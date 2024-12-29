use crate::{
    config::{
        SystemRequirementsChecker, TSystemRequirementsChecker, DOCKER_REQUIREMENT, HELM_REQUIREMENT, K8S_REQUIREMENT,
        TERRAFORM_REQUIREMENT,
    },
    infra::console::{print_info, style_spinner, Dialoguer, TDialoguer},
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
    domain::{Deployment, ProjectFactory, TProjectFactory},
    infra::{
        deployment::{DockerContractsDeployer, InMemoryDeploymentRepository, TerraformDeployer},
        project::InMemoryProjectInfraRepository,
        release::{DockerReleaseRepository, DockerReleaseRunner},
    },
};

#[derive(Debug, Clone, ValueEnum)]
pub enum DeployTarget {
    Contracts,
    Infra,
    All,
}

pub struct DeployCommand {
    dialoguer: Box<dyn TDialoguer>,
    contracts_deployer: ContractsDeployerService<InMemoryDeploymentRepository, DockerContractsDeployer>,
    infra_deployer:
        InfraDeployerService<TerraformDeployer, InMemoryDeploymentRepository, InMemoryProjectInfraRepository>,
    system_requirement_checker: Box<dyn TSystemRequirementsChecker>,
    project_factory: Box<dyn TProjectFactory>,
    deployments_manager: DeploymentManagerService<InMemoryDeploymentRepository>,
}

// implementations ================================================

impl DeployCommand {
    pub fn new() -> Self {
        let project_factory = Box::new(ProjectFactory::new());
        let project = project_factory
            .from_cwd()
            .expect("No project found in current directory");

        Self {
            dialoguer: Box::new(Dialoguer::new()),
            contracts_deployer: ContractsDeployerService::new(
                InMemoryDeploymentRepository::new(&project.root),
                DockerContractsDeployer::new(
                    Box::new(DockerReleaseRepository::new()),
                    Box::new(DockerReleaseRunner::new()),
                ),
            ),
            infra_deployer: InfraDeployerService::new(
                TerraformDeployer::new(),
                InMemoryDeploymentRepository::new(&project.root),
                InMemoryProjectInfraRepository::new(),
            ),
            deployments_manager: DeploymentManagerService::new(InMemoryDeploymentRepository::new(&project.root)),
            system_requirement_checker: Box::new(SystemRequirementsChecker::new()),
            project_factory,
        }
    }

    pub async fn run(
        &self,
        target: DeployTarget,
        id: String,
        deploy_deterministic_deployer: bool,
    ) -> Result<(), Box<dyn std::error::Error>> {
        self.system_requirement_checker.check(vec![
            DOCKER_REQUIREMENT,
            K8S_REQUIREMENT,
            HELM_REQUIREMENT,
            TERRAFORM_REQUIREMENT,
        ])?;

        let project = self.project_factory.from_cwd().unwrap();
        let config = CoreConfig::new_from_toml(&project.config).unwrap();

        // dev is reserved for local deployments
        if id == "dev" {
            return Err("Name cannot be 'dev'".into());
        } else if id.contains(" ") {
            return Err("Name cannot contain spaces".into());
        }

        let release_registry: String = self
            .dialoguer
            .prompt("Input Docker registry url (e.g. dockerhub.io/wakeuplabs) ");
        let release_tag: String = self.dialoguer.prompt("Input release tag (e.g. v0.1.0)");

        if !self
            .dialoguer
            .confirm("This may involve some costs. Have you double-checked the configuration? Please review .env, config.toml, infra/helm/values.yaml to ensure it's what you expect. Help yourself with the README.md files if in doubt.")
        {
            return Ok(());
        }

        let domain = matches!(target, DeployTarget::Infra | DeployTarget::All)
            .then(|| {
                self.dialoguer
                    .prompt("Input domain name (e.g. wakeuplabs.com)")
            })
            .unwrap_or_default();

        let enable_monitoring = matches!(target, DeployTarget::Infra | DeployTarget::All)
            .then(|| self.dialoguer.confirm("Enable monitoring?"))
            .unwrap_or_default();

        let enable_explorer = matches!(target, DeployTarget::Infra | DeployTarget::All)
            .then(|| self.dialoguer.confirm("Enable explorer?"))
            .unwrap_or_default();

        // contracts deployment ===========================================================

        if matches!(target, DeployTarget::Contracts | DeployTarget::All) {
            let contracts_deployer_spinner = style_spinner(ProgressBar::new_spinner(), "Deploying contracts...");

            let mut deployment = Deployment::new(
                id.as_ref(),
                "root",
                &release_tag,
                &release_registry,
                config.network,
                config.accounts,
            );

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

        if matches!(target, DeployTarget::Infra | DeployTarget::All) {
            let mut deployment = self
                .deployments_manager
                .find_one("root", &id)
                .await?
                .expect("Contracts deployment not found");

            let infra_deployer_spinner = style_spinner(ProgressBar::new_spinner(), "Deploying stack infra...");

            self.infra_deployer
                .deploy(
                    &project,
                    &mut deployment,
                    &domain,
                    enable_monitoring,
                    enable_explorer,
                )
                .await?;

            infra_deployer_spinner.finish_with_message("✔️ Infra deployed, your chain is live!");

            print_info("\nFor https domain make sure to create an A record pointing to `elb_dnsname` as specified here: https://github.com/amcginlay/venafi-demos/tree/main/demos/01-eks-ingress-nginx-cert-manager#configure-route53");
        }

        // clear screen and display artifacts ===========================================================

        print!("\x1B[2J\x1B[1;1H");

        // if matches!(target, DeployTarget::Contracts | DeployTarget::All) {
        //     let deployment = self
        //         .deployments_manager
        //         .find_one("root", &id)
        //         .await?
        //         .ok_or("Deployment not found")?;

        //     println!(
        //         "{}",
        //         serde_json::to_string_pretty(&self.contracts_inspector.inspect(&deployment).await?)?
        //     );
        // }

        // if matches!(target, DeployTarget::Infra | DeployTarget::All) {
        //     let deployment = self
        //         .infra_inspector
        //         .find(&id)
        //         .await?
        //         .ok_or("Deployment not found")?;

        //     println!(
        //         "{}",
        //         serde_json::to_string_pretty(&self.infra_inspector.inspect(&deployment).await?)?
        //     );
        // }

        // print instructions

        println!(
            "\n{title}\n\n\
            You can find your deployment artifacts at ./deployments/{id}\n\n\
            We recommend you keep these files and your keys secure as they're needed to run your deployment.\n\n\
            Some useful commands for you now:\n\n\
            - {bin_name} {command}\n\
            \tDisplay the artifacts for each deployment.\n\n\
            {note}\n",
            title = "What's Next?".bright_white().bold(),
            bin_name=env!("CARGO_BIN_NAME").blue(),
            command="inspect [contracts|infra|all] --name <deployment_name>".blue(),
            note="NOTE: At the moment there's no way to remove a deployment, you'll need to manually go to `infra/aws` and run `terraform destroy`. For upgrades you'll also need to run them directly in helm.".yellow()
        );

        if matches!(target, DeployTarget::Infra | DeployTarget::All) {
            println!("\n{}\n", "Make sure to create an A record pointing to `elb_dnsname` as specified here: https://github.com/amcginlay/venafi-demos/tree/main/demos/01-eks-ingress-nginx-cert-manager#configure-route53".yellow());
        }

        Ok(())
    }
}
