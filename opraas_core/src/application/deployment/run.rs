use crate::domain::{Deployment, Project, TDeploymentRunner, TProjectInfraRepository};
use serde_yaml::Value;
use std::collections::HashMap;

pub struct DeploymentRunnerService<DR, PIR>
where
    DR: TDeploymentRunner,
    PIR: TProjectInfraRepository,
{
    deployment_runner: DR,
    project_infra_repository: PIR,
}

impl<DR, PIR> DeploymentRunnerService<DR, PIR>
where
    DR: TDeploymentRunner,
    PIR: TProjectInfraRepository,
{
    pub fn new(deployment_runner: DR, project_infra_repository: PIR) -> Self {
        Self {
            deployment_runner,
            project_infra_repository,
        }
    }

    pub fn run(
        &self,
        project: &Project,
        deployment: &Deployment,
        monitoring: bool,
        explorer: bool,
    ) -> Result<(), Box<dyn std::error::Error>> {
        self.project_infra_repository.pull(project)?;

        let mut values: HashMap<&str, Value> = HashMap::new();
        values.insert("monitoring.enabled", monitoring.into());
        values.insert("explorer.enabled", explorer.into());

        self.deployment_runner.run(project, deployment, &values)?;

        Ok(())
    }

    pub fn stop(&self) -> Result<(), Box<dyn std::error::Error>> {
        self.deployment_runner.stop()?;

        Ok(())
    }
}
