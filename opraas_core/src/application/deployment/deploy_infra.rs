use crate::domain::{self, Deployment, Project};
use std::collections::HashMap;

pub struct InfraDeployerService<ID, DR, PIR>
where
    ID: domain::deployment::TInfraDeployerProvider,
    DR: domain::deployment::TDeploymentRepository,
    PIR: domain::project::TProjectInfraRepository,
{
    infra_deployer: ID,
    deployment_repository: DR,
    project_infra_repository: PIR,
}

impl<ID, DR, PIR> InfraDeployerService<ID, DR, PIR>
where
    ID: domain::deployment::TInfraDeployerProvider,
    DR: domain::deployment::TDeploymentRepository,
    PIR: domain::project::TProjectInfraRepository,
{
    pub fn new(infra_deployer: ID, deployment_repository: DR, project_infra_repository: PIR) -> Self {
        Self {
            infra_deployer,
            deployment_repository,
            project_infra_repository,
        }
    }

    pub async fn deploy(
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

        self.infra_deployer
            .deploy(project, deployment, &values)
            .await?;

        self.deployment_repository.save(deployment).await?;

        Ok(())
    }
}
