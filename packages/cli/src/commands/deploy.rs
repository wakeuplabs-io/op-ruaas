use crate::{
    config::{
        SystemRequirementsChecker, TSystemRequirementsChecker, DOCKER_REQUIREMENT, HELM_REQUIREMENT, K8S_REQUIREMENT,
        TERRAFORM_REQUIREMENT,
    },
    infrastructure::console::{print_info, style_spinner, Dialoguer, TDialoguer},
    AppContext,
};
use clap::ValueEnum;
use colored::*;
use indicatif::ProgressBar;
use opraas_core::{
    application::deployment::{
        deploy_contracts::ContractsDeployerService, deploy_infra::InfraDeployerService,
        manager::DeploymentManagerService,
    },
    config::CoreConfig,
    domain::{Deployment, DeploymentKind, DeploymentOptions, Project},
    infrastructure::{
        deployment::{
            DockerContractsDeployer, InMemoryDeploymentArtifactsRepository, InMemoryDeploymentRepository,
            TerraformDeployer,
        },
        project::InMemoryProjectInfraRepository,
        release::{DockerReleaseRepository, DockerReleaseRunner},
    },
};

#[derive(Debug, Clone, ValueEnum)]
pub enum DeployTarget {
    Contracts,
    Infra,
}

#[derive(Debug, Clone, ValueEnum, PartialEq, Eq)]
pub enum DeployDeploymentKind {
    Sequencer,
    Replica,
}

impl From<DeployDeploymentKind> for DeploymentKind {
    fn from(kind: DeployDeploymentKind) -> Self {
        match kind {
            DeployDeploymentKind::Sequencer => DeploymentKind::Sequencer,
            DeployDeploymentKind::Replica => DeploymentKind::Replica,
        }
    }
}
pub struct DeployCommand {
    dialoguer: Dialoguer,
    contracts_deployer: ContractsDeployerService<
        InMemoryDeploymentRepository,
        InMemoryDeploymentArtifactsRepository,
        DockerContractsDeployer,
    >,
    infra_deployer:
        InfraDeployerService<TerraformDeployer, InMemoryDeploymentRepository, InMemoryProjectInfraRepository>,
    system_requirement_checker: SystemRequirementsChecker,
    deployments_manager: DeploymentManagerService<InMemoryDeploymentRepository, InMemoryDeploymentArtifactsRepository>,
}

impl DeployCommand {
    pub fn new() -> Self {
        let project = Project::try_from(std::env::current_dir().unwrap()).unwrap();

        Self {
            dialoguer: Dialoguer::new(),
            contracts_deployer: ContractsDeployerService::new(
                InMemoryDeploymentRepository::new(&project.root),
                InMemoryDeploymentArtifactsRepository::new(&project.root),
                DockerContractsDeployer::new(
                    Box::new(DockerReleaseRepository::new()),
                    Box::new(DockerReleaseRunner::new()),
                ),
            ),
            infra_deployer: InfraDeployerService::new(
                TerraformDeployer::new(Box::new(InMemoryDeploymentArtifactsRepository::new(
                    &project.root,
                ))),
                InMemoryDeploymentRepository::new(&project.root),
                InMemoryProjectInfraRepository::new(),
            ),
            deployments_manager: DeploymentManagerService::new(
                InMemoryDeploymentRepository::new(&project.root),
                InMemoryDeploymentArtifactsRepository::new(&project.root),
            ),
            system_requirement_checker: SystemRequirementsChecker::new(),
        }
    }

    pub async fn run(
        &self,
        ctx: &AppContext,
        target: &DeployTarget,
        deployment_id: &str,
        deployment_name: &str,
        deployment_release_tag: &str,
        deployment_release_namespace: &str,
        deploy_deterministic_deployer: bool,
        kind: DeployDeploymentKind,
        sequencer_url: &str,
        storage_class_name: &str,
        values: Option<String>,
    ) -> Result<(), Box<dyn std::error::Error>> {
        self.system_requirement_checker.check(vec![
            DOCKER_REQUIREMENT,
            K8S_REQUIREMENT,
            HELM_REQUIREMENT,
            TERRAFORM_REQUIREMENT,
        ])?;

        let project = Project::try_from(std::env::current_dir()?)?;
        let config = CoreConfig::new_from_toml(&project.config).unwrap();
        let owner_id = ctx.user_id.clone().ok_or("User not found")?;

        // dev is reserved for local deployments
        if deployment_id == "dev" {
            return Err("Deployment id cannot be 'dev'".into());
        } else if deployment_id.contains(" ") {
            return Err("Deployment id cannot contain spaces".into());
        } else if deployment_id.trim().is_empty() {
            return Err("Deployment id cannot be empty".into());
        }

        let release_registry: String = self
            .dialoguer
            .prompt("Input Docker registry url (e.g. wakeuplabs) ");
        let release_tag: String = self.dialoguer.prompt("Input release tag (e.g. v1.0.0)");

        if !self
            .dialoguer
            .confirm("This may involve some costs. Have you double-checked the configuration? Please review .env, config.toml, infra/helm/values.yaml to ensure it's what you expect. Help yourself with the README.md files if in doubt.")
        {
            return Ok(());
        }

        let domain = matches!(target, DeployTarget::Infra)
            .then(|| {
                self.dialoguer
                    .prompt("Input domain name (e.g. wakeuplabs.com)")
            })
            .unwrap_or_default();

        let enable_monitoring = matches!(target, DeployTarget::Infra)
            .then(|| self.dialoguer.confirm("Enable monitoring?"))
            .unwrap_or_default();

        let enable_explorer = matches!(target, DeployTarget::Infra)
            .then(|| self.dialoguer.confirm("Enable explorer?"))
            .unwrap_or_default();

        // contracts deployment ===========================================================

        if matches!(target, DeployTarget::Contracts) {
            let contracts_deployer_spinner = style_spinner(ProgressBar::new_spinner(), "Deploying contracts...");

            let mut deployment = Deployment::new(
                deployment_id,
                deployment_name,
                &owner_id,
                &release_tag,
                &release_registry,
                config.network,
                config.accounts,
            )?;

            self.contracts_deployer
                .deploy(
                    &project,
                    &mut deployment,
                    deploy_deterministic_deployer,
                    true,
                )
                .await?;

            contracts_deployer_spinner.finish_with_message("✔️ Contracts deployed...");
        }

        // infra deployment ===========================================================

        if matches!(target, DeployTarget::Infra) {
            let mut deployment = self
                .deployments_manager
                .find_by_id(deployment_id)
                .await?
                .expect("Contracts deployment not found");

            if sequencer_url.is_empty() && kind == DeployDeploymentKind::Replica {
                return Err("Sequencer url is empty".into());
            }

            let infra_deployer_spinner = style_spinner(ProgressBar::new_spinner(), "Deploying stack infra...");

            self.infra_deployer
                .deploy(
                    &project,
                    &mut deployment,
                    &DeploymentOptions {
                        host: domain,
                        monitoring: enable_monitoring,
                        explorer: enable_explorer,
                        storage_class_name: storage_class_name.to_string(),
                        release_tag: deployment_release_tag.to_string(),
                        release_namespace: deployment_release_namespace.to_string(),
                        sequencer_url: Some(sequencer_url.to_string()),
                        kind: kind.into(),
                        values_path: values.map(std::path::PathBuf::from),
                    },
                )
                .await?;

            infra_deployer_spinner.finish_with_message("✔️ Infra deployed, your chain is live!");

            print_info("\nFor https domain make sure to create an A record pointing to `elb_dnsname` as specified here: https://github.com/amcginlay/venafi-demos/tree/main/demos/01-eks-ingress-nginx-cert-manager#configure-route53");
        }

        // clear screen and display artifacts ===========================================================

        print!("\x1B[2J\x1B[1;1H");

        let deployment = self
            .deployments_manager
            .find_by_id(deployment_id)
            .await?
            .expect("Contracts deployment not found");

        if matches!(target, DeployTarget::Contracts) {
            match &deployment.contracts_addresses {
                Some(addresses) => println!(
                    r#"The contract addresses of your chain:
                {}"#,
                    addresses
                ),
                None => println!("No deployment addresses found"),
            }
        }

        if matches!(target, DeployTarget::Infra) {
            match &deployment.infra_base_url {
                Some(base_url) => println!(
                    r#"Relevant endpoints from your infra:
                - Explorer: {base_url}
                - Rpc: {base_url}/rpc
                - Monitoring: {base_url}/monitoring"#
                ),
                None => println!("No infra found"),
            }
        }

        // print instructions

        println!(
            "\n{title}\n\n\
            You can find your deployment artifacts at ./deployments/{deployment_id}\n\n\
            We recommend you keep these files and your keys secure as they're needed to run your deployment.\n\n\
            Some useful commands for you now:\n\n\
            - {bin_name} {command}\n\
            \tDisplay the artifacts for each deployment.\n\n\
            {note}\n",
            title = "What's Next?".bright_white().bold(),
            bin_name=env!("CARGO_BIN_NAME").blue(),
            command="inspect [contracts|infra] --deployment-id <deployment-id>".blue(),
            note="NOTE: At the moment there's no way to remove a deployment, you'll need to manually go to `infra/aws` and run `terraform destroy`. For upgrades you'll also need to run them directly in helm.".yellow()
        );

        if matches!(target, DeployTarget::Infra) {
            println!("\n{}\n", "Make sure to create an A record pointing to `elb_dnsname` as specified here: https://github.com/amcginlay/venafi-demos/tree/main/demos/01-eks-ingress-nginx-cert-manager#configure-route53".yellow());
        } else if matches!(target, DeployTarget::Contracts) {
            println!("\n{}\n", "Ideally wait ~256 blocks, ~1 hour (in ethereum) for full finalization before moving forward with infra deployment".yellow());
        }

        Ok(())
    }
}
