use crate::domain::{self, Deployment, Project};

pub struct ContractsDeployerService<R, T>
where
    R: domain::deployment::TDeploymentRepository,
    T: domain::deployment::TContractsDeployerProvider,
{
    deployment_repository: R,
    contracts_deployer: T,
}

impl<R, T> ContractsDeployerService<R, T>
where
    R: domain::deployment::TDeploymentRepository,
    T: domain::deployment::TContractsDeployerProvider,
{
    pub fn new(deployment_repository: R, contracts_deployer: T) -> Self {
        Self {
            contracts_deployer,
            deployment_repository,
        }
    }

    pub async fn deploy(
        &self,
        project: &Project,
        deployment: &mut Deployment,
        deploy_deterministic_deployer: bool,
        slow: bool,
    ) -> Result<(), Box<dyn std::error::Error>> {
        self.contracts_deployer
            .deploy(project, deployment, deploy_deterministic_deployer, slow)?;

        self.deployment_repository.save(deployment).await?;

        Ok(())
    }
}
