use crate::domain::{Deployment, DeploymentArtifact, TDeploymentArtifactsRepository, TDeploymentRepository};

pub struct ArtifactDeploymentManagerService<T>
where
    T: TDeploymentArtifactsRepository,
{
    deployment_artifacts_repository: T,
}

impl<T> ArtifactDeploymentManagerService<T>
where
    T: TDeploymentArtifactsRepository,
{
    pub fn new(deployment_artifacts_repository: T) -> Self {
        Self {
            deployment_artifacts_repository,
        }
    }

    pub async fn find_one(
        &self,
        deployment: &Deployment,
    ) -> Result<Option<DeploymentArtifact>, Box<dyn std::error::Error>> {
        self.deployment_artifacts_repository
            .find_one(deployment)
            .await
    }

    pub async fn delete(&self, deployment: &Deployment) -> Result<(), Box<dyn std::error::Error>> {
        self.deployment_artifacts_repository
            .delete(deployment)
            .await
    }

    pub async fn save(
        &self,
        deployment: &Deployment,
        artifact: DeploymentArtifact,
    ) -> Result<(), Box<dyn std::error::Error>> {
        self.deployment_artifacts_repository
            .save(deployment, artifact)
            .await
    }
}
