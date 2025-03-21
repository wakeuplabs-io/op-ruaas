use crate::{
    infrastructure::console::{print_info, print_warning},
    AppContext,
};
use opraas_core::{
    application::deployment::{manager::DeploymentManagerService, monitor::DeploymentMonitorRunnerService},
    domain::{DeploymentMonitorOptions, Project},
    infrastructure::{
        deployment::{DockerMonitorRunner, InMemoryDeploymentArtifactsRepository, InMemoryDeploymentRepository},
        release::{DockerReleaseRepository, DockerReleaseRunner},
    },
};

#[derive(Debug, Clone, clap::ValueEnum)]
pub enum MonitorTarget {
    Onchain,
    Offchain,
}

#[derive(Debug, Clone, clap::ValueEnum)]
pub enum MonitorKind {
    Multisig,
    Fault,
    Withdrawals,
    Drippie,
    Secrets,
    GlobalEvents,
    LivenessExpiration,
    Balances,
    Dispute,
}

impl From<MonitorKind> for opraas_core::domain::MonitorKind {
    fn from(kind: MonitorKind) -> Self {
        match kind {
            MonitorKind::Multisig => Self::Multisig,
            MonitorKind::Fault => Self::Fault,
            MonitorKind::Withdrawals => Self::Withdrawals,
            MonitorKind::Drippie => Self::Drippie,
            MonitorKind::Secrets => Self::Secrets,
            MonitorKind::GlobalEvents => Self::GlobalEvents,
            MonitorKind::LivenessExpiration => Self::LivenessExpiration,
            MonitorKind::Balances => Self::Balances,
            MonitorKind::Dispute => Self::Dispute,
        }
    }
}

pub struct MonitorCommand {
    deployments_manager: DeploymentManagerService<InMemoryDeploymentRepository, InMemoryDeploymentArtifactsRepository>,
    deployment_monitor_runner: DeploymentMonitorRunnerService<DockerMonitorRunner>,
}

impl MonitorCommand {
    pub fn new() -> MonitorCommand {
        let project = Project::try_from(std::env::current_dir().unwrap()).unwrap();

        Self {
            deployments_manager: DeploymentManagerService::new(
                InMemoryDeploymentRepository::new(&project.root),
                InMemoryDeploymentArtifactsRepository::new(&project.root),
            ),
            deployment_monitor_runner: DeploymentMonitorRunnerService::new(DockerMonitorRunner::new(
                Box::new(DockerReleaseRepository::new()),
                Box::new(DockerReleaseRunner::new()),
            )),
        }
    }

    pub async fn run(
        &self,
        _ctx: &AppContext,
        target: &MonitorTarget,
        deployment_id: &str,
        kind: Option<MonitorKind>,
        args: Option<Vec<String>>,
    ) -> Result<(), Box<dyn std::error::Error>> {
        let project = Project::try_from(std::env::current_dir()?)?;
        let deployment = self
            .deployments_manager
            .find_by_id(deployment_id)
            .await?
            .ok_or("Deployment not found")?;

        match target {
            MonitorTarget::Onchain => {
                print_info("Running monitor...");
                print_warning("Remember to use '-v' to see the logs. We'll prefill some values for you.");

                self.deployment_monitor_runner
                    .run(
                        &project,
                        &deployment,
                        &DeploymentMonitorOptions {
                            args: args.unwrap_or_default(),
                            kind: kind.unwrap().into(),
                        },
                    )
                    .await?;
            }
            MonitorTarget::Offchain => {
                let host = match deployment.id.as_str() {
                    "dev" => "localhost:80",
                    _ => deployment
                        .infra_base_url
                        .as_ref()
                        .ok_or("Infra base URL not found")?,
                };

                print_info("Monitor URL:");
                print_info(&format!("http://monitoring.{}", host));
            }
        }

        Ok(())
    }
}

impl Drop for MonitorCommand {
    fn drop(&mut self) {
        match self.deployment_monitor_runner.stop() {
            Ok(_) => {}
            Err(e) => {
                print_warning(&format!("Failed to stop monitor runner: {}", e));
            }
        }
    }
}
