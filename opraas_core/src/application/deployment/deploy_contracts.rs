use crate::domain::{self, Deployment, Project};

pub struct ContractsDeployerService<DR, DAR, CDP>
where
    DR: domain::deployment::TDeploymentRepository,
    DAR: domain::deployment::TDeploymentArtifactsRepository,
    CDP: domain::deployment::TContractsDeployerProvider,
{
    deployment_repository: DR,
    deployment_artifact_repository: DAR,
    contracts_deployer: CDP,
}

impl<DR, DAR, CDP> ContractsDeployerService<DR, DAR, CDP>
where
    DR: domain::deployment::TDeploymentRepository,
    DAR: domain::deployment::TDeploymentArtifactsRepository,
    CDP: domain::deployment::TContractsDeployerProvider,
{
    pub fn new(deployment_repository: DR, deployment_artifact_repository: DAR, contracts_deployer: CDP) -> Self {
        Self {
            contracts_deployer,
            deployment_repository,
            deployment_artifact_repository,
        }
    }

    pub async fn deploy(
        &self,
        project: &Project,
        deployment: &mut Deployment,
        deploy_deterministic_deployer: bool,
        slow: bool,
    ) -> Result<(), Box<dyn std::error::Error>> {
        let deployment_artifact =
            self.contracts_deployer
                .deploy(project, deployment, deploy_deterministic_deployer, slow)?;

        println!("ok");
        self.deployment_repository.save(deployment).await?;
        println!("ok");
        self.deployment_artifact_repository
            .save(deployment, deployment_artifact)
            .await?;
        println!("ok");

        Ok(())
    }
}
