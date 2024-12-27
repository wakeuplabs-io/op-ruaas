use crate::domain::{self, Deployment, Project};
use std::collections::HashMap;

pub struct InfraDeployerService {
    infra_deployer: Box<dyn domain::deployment::TInfraDeployerProvider>,
    deployment_repository: Box<dyn domain::deployment::TDeploymentRepository>,
    project_infra_repository: Box<dyn domain::project::TProjectInfraRepository>,
}

pub trait TInfraDeployerService: Send + Sync {
    fn deploy(
        &self,
        project: &Project,
        deployment: &mut Deployment,
        domain: &str, // web domain
        monitoring: bool,
        explorer: bool,
    ) -> Result<(), Box<dyn std::error::Error>>;
}

// implementations ===================================================

impl InfraDeployerService {
    pub fn new(
        infra_deployer: Box<dyn domain::deployment::TInfraDeployerProvider>,
        deployment_repository: Box<dyn domain::deployment::TDeploymentRepository>,
        project_infra_repository: Box<dyn domain::project::TProjectInfraRepository>,
    ) -> Self {
        Self {
            infra_deployer,
            deployment_repository,
            project_infra_repository,
        }
    }
}

impl TInfraDeployerService for InfraDeployerService {
    fn deploy(
        &self,
        project: &Project,
        deployment: &mut Deployment,
        domain: &str,
        monitoring: bool,
        explorer: bool,
    ) -> Result<(), Box<dyn std::error::Error>> {
        self.project_infra_repository.pull(project)?;

        let mut values: HashMap<&str, serde_yaml::Value> = HashMap::new();
        values.insert("global.host", domain.into());
        values.insert("monitoring.enabled", monitoring.into());
        values.insert("explorer.enabled", explorer.into());

        self.infra_deployer.deploy(project, deployment, &values)?;

        self.deployment_repository.save(deployment)?;

        Ok(())
    }
}
