use crate::domain::{Deployment, Project, TDeploymentRunner, TProjectInfraRepository};
use serde_yaml::Value;
use std::collections::HashMap;

pub struct DeploymentRunnerService {
    deployment_runner: Box<dyn TDeploymentRunner>,
    project_infra_repository: Box<dyn TProjectInfraRepository>,
}

pub trait TDeploymentRunnerService {
    fn run(
        &self,
        project: &Project,
        deployment: &Deployment,
        monitoring: bool,
        explorer: bool,
    ) -> Result<(), Box<dyn std::error::Error>>;
    fn stop(&self) -> Result<(), Box<dyn std::error::Error>>;
}

// implementations ===================================================

impl DeploymentRunnerService {
    pub fn new(
        deployment_runner: Box<dyn TDeploymentRunner>,
        project_infra_repository: Box<dyn TProjectInfraRepository>,
    ) -> Self {
        Self {
            deployment_runner: deployment_runner,
            project_infra_repository: project_infra_repository,
        }
    }
}

impl TDeploymentRunnerService for DeploymentRunnerService {
    fn run(
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

    fn stop(&self) -> Result<(), Box<dyn std::error::Error>> {
        self.deployment_runner.stop()?;

        Ok(())
    }
}
