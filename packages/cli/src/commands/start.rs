use crate::{
    config::{
        SystemRequirementsChecker, TSystemRequirementsChecker, DOCKER_REQUIREMENT, HELM_REQUIREMENT, K8S_REQUIREMENT,
    },
    infrastructure::console::{print_info, print_warning, style_spinner, Dialoguer, TDialoguer},
    AppContext,
};
use assert_cmd::Command;
use clap::ValueEnum;
use indicatif::ProgressBar;
use opraas_core::{
    application::deployment::{
        deploy_contracts::ContractsDeployerService, manager::DeploymentManagerService, run::DeploymentRunnerService,
    },
    config::CoreConfig,
    domain::{Deployment, DeploymentKind, DeploymentOptions, Project},
    infrastructure::{
        deployment::{
            DockerContractsDeployer, HelmDeploymentRunner, InMemoryDeploymentArtifactsRepository,
            InMemoryDeploymentRepository,
        },
        ethereum::{GethTestnetNode, TTestnetNode},
        project::InMemoryProjectInfraRepository,
        release::{DockerReleaseRepository, DockerReleaseRunner},
    },
};
use std::{
    sync::{
        atomic::{AtomicBool, Ordering},
        Arc,
    },
    thread,
    time::Duration,
};

#[derive(Debug, Clone, ValueEnum)]
pub enum StartDeploymentKind {
    Sequencer,
    Replica,
}
impl From<StartDeploymentKind> for DeploymentKind {
    fn from(kind: StartDeploymentKind) -> Self {
        match kind {
            StartDeploymentKind::Sequencer => DeploymentKind::Sequencer,
            StartDeploymentKind::Replica => DeploymentKind::Replica,
        }
    }
}

pub struct StartCommand {
    release_tag: Option<String>,
    release_namespace: Option<String>,

    dialoguer: Dialoguer,
    l1_node: Box<dyn TTestnetNode>,
    deployment_runner: DeploymentRunnerService<HelmDeploymentRunner, InMemoryProjectInfraRepository>,
    deployments_manager: DeploymentManagerService<InMemoryDeploymentRepository, InMemoryDeploymentArtifactsRepository>,
    system_requirement_checker: SystemRequirementsChecker,
    contracts_deployer: ContractsDeployerService<
        InMemoryDeploymentRepository,
        InMemoryDeploymentArtifactsRepository,
        DockerContractsDeployer,
    >,
}

const DEFAULT_REGISTRY: &str = "wakeuplabs";
const DEFAULT_RELEASE_TAG: &str = "v0.0.4";

impl StartCommand {
    pub fn new() -> Self {
        let project = Project::try_from(std::env::current_dir().unwrap()).unwrap();

        Self {
            release_tag: None,
            release_namespace: None,

            dialoguer: Dialoguer::new(),
            l1_node: Box::new(GethTestnetNode::new()),
            deployment_runner: DeploymentRunnerService::new(
                HelmDeploymentRunner::new(Box::new(InMemoryDeploymentArtifactsRepository::new(
                    &project.root,
                ))),
                InMemoryProjectInfraRepository::new(),
            ),
            deployments_manager: DeploymentManagerService::new(
                InMemoryDeploymentRepository::new(&project.root),
                InMemoryDeploymentArtifactsRepository::new(&project.root),
            ),
            system_requirement_checker: SystemRequirementsChecker::new(),
            contracts_deployer: ContractsDeployerService::new(
                InMemoryDeploymentRepository::new(&project.root),
                InMemoryDeploymentArtifactsRepository::new(&project.root),
                DockerContractsDeployer::new(
                    Box::new(DockerReleaseRepository::new()),
                    Box::new(DockerReleaseRunner::new()),
                ),
            ),
        }
    }

    pub async fn run(
        &mut self,
        ctx: &AppContext,
        kind: StartDeploymentKind,
        contracts_deployment_id: Option<String>,
        sequencer_url: &str,
        default: bool,
        values: Option<String>,
    ) -> Result<(), Box<dyn std::error::Error>> {
        self.system_requirement_checker
            .check(vec![DOCKER_REQUIREMENT, K8S_REQUIREMENT, HELM_REQUIREMENT])?;

        let project = Project::try_from(std::env::current_dir()?)?;
        let mut config = CoreConfig::new_from_toml(&project.config)?;
        let owner_id = ctx.user_id.clone().ok_or("User not found")?;

        print_info(
            r#"Dev command will run a local l1 node, deploy contracts to it and then install the infra in your local network.
            You can use a release you build with build and release command or a third-party release."#,
        );

        // confirm kubernetes context point to local

        let current_context_cmd = Command::new("kubectl")
            .arg("config")
            .arg("current-context")
            .output()?;
        let current_context = String::from_utf8_lossy(&current_context_cmd.stdout);

        if !self.dialoguer.confirm(&format!(
            "Confirm that your kubernetes context is pointing to local: {}",
            current_context
        )) {
            print_warning("Aborting...");
            print_info(
                r#"We need you to switch your kubernetes context to local.
                You can change your kubernetes context with kubectl config use-context."#,
            );
            return Ok(());
        }

        // request release name and repository to test

        let release_registry: String = match default {
            true => DEFAULT_REGISTRY.into(),
            false => self
                .dialoguer
                .prompt("Input docker registry url (e.g. dockerhub.io/wakeuplabs) "),
        };

        let release_tag: String = match default {
            true => DEFAULT_RELEASE_TAG.into(),
            false => self.dialoguer.prompt("Input release tag (e.g. v0.1.0)"),
        };

        // deploy monitoring and explorer?

        let enable_monitoring = self.dialoguer.confirm("Do you want to enable monitoring?");
        let enable_explorer = self.dialoguer.confirm("Do you want to enable explorer?");

        // retrieve deployment addresses or use an existing deployment

        let mut deployment = Deployment::new(
            "dev",
            "Development",
            &owner_id,
            &release_tag,
            &release_registry,
            config.network.clone(),
            config.accounts.clone(),
        )?;

        if let Some(contracts_deployment_id) = contracts_deployment_id {
            let contracts_depl = self
                .deployments_manager
                .find_by_id(&contracts_deployment_id)
                .await?
                .ok_or("Deployment not found")?;

            deployment.contracts_addresses = contracts_depl.contracts_addresses;
        } else {
            // update config for devnet mode

            let wallet_address = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
            let wallet_private_key = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
            config.network.l1_chain_id = 1337;
            config.accounts.admin_address = wallet_address.into();
            config.accounts.admin_private_key = Some(wallet_private_key.into());
            config.accounts.batcher_address = wallet_address.into();
            config.accounts.batcher_private_key = Some(wallet_private_key.into());
            config.accounts.proposer_address = wallet_address.into();
            config.accounts.proposer_private_key = Some(wallet_private_key.into());
            config.accounts.sequencer_address = wallet_address.into();
            config.accounts.sequencer_private_key = Some(wallet_private_key.into());
            config.accounts.deployer_address = wallet_address.into();
            config.accounts.deployer_private_key = Some(wallet_private_key.into());
            config.accounts.challenger_address = wallet_address.into();
            config.accounts.challenger_private_key = Some(wallet_private_key.into());
            config.network.l1_rpc_url = Some("http://host.docker.internal:8545".into());
            config.network.fund_dev_accounts = true;

            // start local network ===========================

            if let StartDeploymentKind::Sequencer = kind {
                let l1_spinner = style_spinner(ProgressBar::new_spinner(), "⏳ Starting l1 node...");

                self.l1_node.start(config.network.l1_chain_id, 8545)?;

                l1_spinner.finish_with_message("✔️ L1 node ready...");
            }

            // deploy contracts ===========================

            if let StartDeploymentKind::Sequencer = kind {
                let contracts_spinner = style_spinner(
                    ProgressBar::new_spinner(),
                    "⏳ Deploying contracts to local network...",
                );

                self.contracts_deployer
                    .deploy(&project, &mut deployment, true, false)
                    .await?;

                contracts_spinner.finish_with_message("✔️ Contracts deployed...");
            } else {
                let contracts_depl = self
                    .deployments_manager
                    .find_by_id(&deployment.id)
                    .await?
                    .ok_or("Deployment not found")?;

                deployment.contracts_addresses = contracts_depl.contracts_addresses;
            }
        }

        // start stack ===========================

        let infra_spinner = style_spinner(
            ProgressBar::new_spinner(),
            "⏳ Installing infra in local kubernetes...",
        );

        // assemble namespace and tag for release
        match kind {
            StartDeploymentKind::Replica => {
                self.release_namespace = Some("replica".to_string());
                self.release_tag = Some("replica".to_string());
            }
            StartDeploymentKind::Sequencer => {
                self.release_namespace = Some("sequencer".to_string());
                self.release_tag = Some("sequencer".to_string());
            }
        }

        let host = match kind {
            StartDeploymentKind::Replica => "replica.localhost",
            StartDeploymentKind::Sequencer => "localhost",
        };

        // run sequencer or replica
        self.deployment_runner
            .run(
                &project,
                &deployment,
                &DeploymentOptions {
                    kind: kind.into(),
                    explorer: enable_explorer,
                    monitoring: enable_monitoring,
                    host: host.to_string(),
                    release_namespace: self.release_namespace.clone().unwrap(),
                    release_tag: self.release_tag.clone().unwrap(),
                    sequencer_url: Some(sequencer_url.to_string()),
                    storage_class_name: "".to_string(),
                    values_path: values.map(std::path::PathBuf::from),
                },
            )
            .await?;

        infra_spinner.finish_with_message("✔️ Infra installed...");

        // inform results and wait for exit ===========================

        print_info("\n\n================================================\n\n");

        print_info(&format!("L1 rpc available at http://{}:8545", host));
        print_info(&format!("L2 rpc available at http://{}:80/rpc", host));
        if enable_monitoring {
            print_info(&format!(
                "L2 monitoring available at http://{}:80/monitoring",
                host
            ));
        }
        if enable_explorer {
            print_info(&format!("L2 explorer available at http://{}:80", host));
        }
        print_warning("It may take a little bit for rpc to respond and explorer to index...");

        if host != "localhost" {
            print_warning(&format!(
                "Remember to add `127.0.0.1 {}` to `/etc/hosts`",
                host
            ));
        }

        print_info("\n\n================================================\n\n");

        print_warning("Press Ctrl + C to exit...");

        let running = Arc::new(AtomicBool::new(true));
        let running_clone = Arc::clone(&running);

        ctrlc::set_handler(move || {
            running_clone.store(false, Ordering::SeqCst);
            print_warning("Cleaning up don't interrupt...");
        })?;

        // wait for exit
        while running.load(Ordering::SeqCst) {
            thread::sleep(Duration::from_secs(1));
        }

        Ok(())
    }
}

impl Drop for StartCommand {
    fn drop(&mut self) {
        match self.l1_node.stop() {
            Ok(_) => {}
            Err(e) => {
                print_warning(&format!("Failed to stop l1 node: {}", e));
            }
        }

        if let (Some(tag), Some(namespace)) = (self.release_tag.as_ref(), self.release_namespace.as_ref()) {
            if let Err(e) = self.deployment_runner.stop(tag, namespace) {
                print_warning(&format!("Failed to stop stack runner: {}", e));
            }
        } else {
            print_warning("Release tag or namespace is missing, skipping stop.");
        }
    }
}
