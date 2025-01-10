use crate::domain::{self, Deployment, Project};

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

        self.infra_deployer
            .deploy(project, deployment, domain, monitoring, explorer)
            .await?;

        self.deployment_repository.save(deployment).await?;

        Ok(())
    }
}
