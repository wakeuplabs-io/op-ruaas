use crate::domain::{Deployment, DeploymentMonitorOptions, Project, TDeploymentMonitorRunner};

pub struct DeploymentMonitorRunnerService<DR>
where
    DR: TDeploymentMonitorRunner,
{
    deployment_monitor_runner: DR,
}

impl<DR> DeploymentMonitorRunnerService<DR>
where
    DR: TDeploymentMonitorRunner,
{
    pub fn new(deployment_monitor_runner: DR) -> Self {
        Self {
            deployment_monitor_runner,
        }
    }

    pub async fn run(
        &self,
        project: &Project,
        deployment: &Deployment,
        opts: &DeploymentMonitorOptions,
    ) -> Result<(), Box<dyn std::error::Error>> {
        self.deployment_monitor_runner
            .run(project, deployment, opts)
            .await?;

        Ok(())
    }

    pub fn stop(&self) -> Result<(), Box<dyn std::error::Error>> {
        self.deployment_monitor_runner.stop()?;

        Ok(())
    }
}
