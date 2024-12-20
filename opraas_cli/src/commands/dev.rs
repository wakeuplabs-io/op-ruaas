use crate::config::{
    SystemRequirementsChecker, TSystemRequirementsChecker, DOCKER_REQUIREMENT, HELM_REQUIREMENT, K8S_REQUIREMENT,
};
use crate::infra::console::{print_info, print_warning, style_spinner, Dialoguer, TDialoguer};
use assert_cmd::Command;
use indicatif::ProgressBar;
use opraas_core::application::{
    contracts::deploy::{StackContractsDeployerService, TStackContractsDeployerService},
    stack::run::{StackRunnerService, TStackRunnerService},
};
use opraas_core::config::CoreConfig;
use opraas_core::domain::{
    ArtifactFactory, ArtifactKind, ProjectFactory, Release, Stack, TArtifactFactory, TProjectFactory,
};
use opraas_core::infra::deployment::InMemoryDeploymentRepository;
use opraas_core::infra::ethereum::{GethTestnetNode, TTestnetNode};
use opraas_core::infra::release::{DockerReleaseRepository, DockerReleaseRunner};
use opraas_core::infra::stack::repo_inmemory::GitStackInfraRepository;
use opraas_core::infra::stack::runner_helm::HelmStackRunner;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::thread;
use std::time::Duration;

pub struct DevCommand {
    dialoguer: Box<dyn TDialoguer>,
    l1_node: Box<dyn TTestnetNode>,
    stack_runner: Box<dyn TStackRunnerService>,
    system_requirement_checker: Box<dyn TSystemRequirementsChecker>,
    artifacts_factory: Box<dyn TArtifactFactory>,
    contracts_deployer: Box<dyn TStackContractsDeployerService>,
    project_factory: Box<dyn TProjectFactory>,
}

const DEFAULT_REGISTRY: &str = "wakeuplabs";
const DEFAULT_RELEASE_TAG: &str = "v0.0.4";

// implementations ================================================

impl DevCommand {
    pub fn new() -> Self {
        let project_factory = Box::new(ProjectFactory::new());
        let project = project_factory.from_cwd().unwrap();

        Self {
            dialoguer: Box::new(Dialoguer::new()),
            l1_node: Box::new(GethTestnetNode::new()),
            stack_runner: Box::new(StackRunnerService::new(
                Box::new(HelmStackRunner::new("opruaas-dev", "opruaas-dev")),
                Box::new(GitStackInfraRepository::new()),
            )),
            system_requirement_checker: Box::new(SystemRequirementsChecker::new()),
            artifacts_factory: Box::new(ArtifactFactory::new()),
            contracts_deployer: Box::new(StackContractsDeployerService::new(
                Box::new(InMemoryDeploymentRepository::new(&project.root)),
                Box::new(DockerReleaseRepository::new()),
                Box::new(DockerReleaseRunner::new()),
            )),
            project_factory,
        }
    }

    pub fn run(&self, default: bool) -> Result<(), Box<dyn std::error::Error>> {
        self.system_requirement_checker
            .check(vec![DOCKER_REQUIREMENT, K8S_REQUIREMENT, HELM_REQUIREMENT])?;

        let project = self.project_factory.from_cwd().unwrap();
        let mut config = CoreConfig::new_from_toml(&project.config)?;

        print_info("Dev command will run a local l1 node, deploy contracts to it and then install the infra in your local network.");
        print_info("You can use a release you build with build and release command or a third-party release");

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
            print_info("We need you to switch your kubernetes context to local");
            print_info("You can change your kubernetes context with kubectl config use-context");
            return Ok(());
        }

        // request release name and repository to test

        let registry_url: String = match default {
            true => DEFAULT_REGISTRY.to_string(),
            false => self
                .dialoguer
                .prompt("Input Docker registry url (e.g. dockerhub.io/wakeuplabs) "),
        };

        let release_name: String = match default {
            true => DEFAULT_RELEASE_TAG.to_string(),
            false => self.dialoguer.prompt("Input release name (e.g. v0.1.0)"),
        };

        // deploy monitoring and explorer

        let enable_monitoring = self.dialoguer.confirm("Do you want to enable monitoring?");

        let enable_explorer = self.dialoguer.confirm("Do you want to enable explorer?");

        // update config for devnet mode

        let wallet_address = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
        let wallet_private_key = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
        config.network.l1_chain_id = 1337;
        config.accounts.admin_address = wallet_address.to_string();
        config.accounts.admin_private_key = wallet_private_key.to_string();
        config.accounts.batcher_address = wallet_address.to_string();
        config.accounts.batcher_private_key = wallet_private_key.to_string();
        config.accounts.proposer_address = wallet_address.to_string();
        config.accounts.proposer_private_key = wallet_private_key.to_string();
        config.accounts.sequencer_address = wallet_address.to_string();
        config.accounts.sequencer_private_key = wallet_private_key.to_string();
        config.accounts.deployer_address = wallet_address.to_string();
        config.accounts.deployer_private_key = wallet_private_key.to_string();
        config.accounts.challenger_address = wallet_address.to_string();
        config.accounts.challenger_private_key = wallet_private_key.to_string();
        config.network.l1_rpc_url = "http://host.docker.internal:8545".to_string();
        config.network.fund_dev_accounts = true;

        // start local network ===========================

        let l1_spinner = style_spinner(ProgressBar::new_spinner(), "⏳ Starting l1 node...");

        self.l1_node.start(config.network.l1_chain_id, 8545)?;

        l1_spinner.finish_with_message("✔️ L1 node ready...");

        // Deploy contracts ===========================

        let contracts_spinner = style_spinner(
            ProgressBar::new_spinner(),
            "⏳ Deploying contracts to local network...",
        );

        let contracts_release = Release::from_artifact(
            &self
                .artifacts_factory
                .get(&ArtifactKind::Contracts, &project, &config),
            &release_name,
            &registry_url,
        );

        let contracts_deployment = self
            .contracts_deployer
            .deploy("dev", &contracts_release, &config, true, false)?;

        contracts_spinner.finish_with_message("✔️ Contracts deployed...");

        // start stack ===========================

        let infra_spinner = style_spinner(
            ProgressBar::new_spinner(),
            "⏳ Installing infra in local kubernetes...",
        );

        self.stack_runner.start(
            &Stack::new(
                project.infra.helm.clone(),
                project.infra.aws.clone(),
                Some(contracts_deployment),
            ),
            enable_monitoring,
            enable_explorer,
        )?;

        infra_spinner.finish_with_message("✔️ Infra installed...");

        // inform results and wait for exit ===========================

        print_info("\n\n================================================\n\n");

        print_info("L1 rpc available at http://localhost:8545");
        print_info("L2 rpc available at http://localhost:80/rpc");
        if enable_monitoring {
            print_info("L2 monitoring available at http://localhost:80/monitoring");
        }
        if enable_explorer {
            print_info("L2 explorer available at http://localhost:80");
        }
        print_warning("It may take a little bit for rpc to respond and explorer to index...");

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

impl Drop for DevCommand {
    fn drop(&mut self) {
        match self.l1_node.stop() {
            Ok(_) => {}
            Err(e) => {
                print_warning(&format!("Failed to stop l1 node: {}", e));
            }
        }

        match self.stack_runner.stop() {
            Ok(_) => {}
            Err(e) => {
                print_warning(&format!("Failed to stop stack runner: {}", e));
            }
        }
    }
}
