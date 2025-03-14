use crate::AppContext;
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

#[derive(Debug, Clone, clap::ValueEnum)]
pub enum MonitorTarget {
    Onchain,
    Offchain,
}

pub struct MonitorCommand {
    deployments_manager: DeploymentManagerService<InMemoryDeploymentRepository, InMemoryDeploymentArtifactsRepository>,
}

impl MonitorCommand {
    pub fn new() -> MonitorCommand {
        let project = Project::try_from(std::env::current_dir().unwrap()).unwrap();

        Self {
            deployments_manager: DeploymentManagerService::new(
                InMemoryDeploymentRepository::new(&project.root),
                InMemoryDeploymentArtifactsRepository::new(&project.root),
            ),
        }
    }

    pub async fn run(
        &self,
        _ctx: &AppContext,
        target: &MonitorTarget,
        deployment_id: &str,
        subcmd: Option<String>,
        args: Option<Vec<String>>,
    ) -> Result<(), Box<dyn std::error::Error>> {
        let deployment = self
            .deployments_manager
            .find_by_id(deployment_id)
            .await?
            .ok_or("Deployment not found")?;

        match target {
            MonitorTarget::Onchain => {
                // extract subcommand and prefill with chain details

                // commands are
                match subcmd.unwrap().as_ref() {
                    "status" => {}
                    "multisig" => {}
                    "fault" => {}
                    "withdrawals" => {}
                    "balances" => {}
                    "drippie" => {}
                    "secrets" => {}
                    "global_events" => {}
                    "liveness_expiration" => {}
                    "faultproof_withdrawals" => {}
                    "dispute" => {}
                    _ => {
                        println!("Unknown subcommand");
                    }
                }
            }
            MonitorTarget::Offchain => {
                // TODO: print the monitoring url
                print!("{}", deployment.infra_base_url.as_ref().unwrap());
            }
        }

        Ok(())
    }
}
