use uuid::Uuid;

use crate::domain::{Deployment, DeploymentArtifact, TDeploymentArtifactsRepository, TDeploymentRepository};

pub struct DeploymentManagerService<T, U>
where
    T: TDeploymentRepository,
    U: TDeploymentArtifactsRepository,
{
    deployment_repository: T,
    deployment_artifacts_repository: U,
}

impl<T, U> DeploymentManagerService<T, U>
where
    T: TDeploymentRepository,
    U: TDeploymentArtifactsRepository,
{
    pub fn new(deployment_repository: T, deployment_artifacts_repository: U) -> Self {
        Self {
            deployment_repository,
            deployment_artifacts_repository,
        }
    }

    pub async fn save(&self, deployment: &Deployment) -> Result<(), Box<dyn std::error::Error>> {
        self.deployment_repository.save(deployment).await
    }

    pub async fn find_by_id(&self, id: &str) -> Result<Option<Deployment>, Box<dyn std::error::Error>> {
        self.deployment_repository.find_by_id(id).await
    }

    pub async fn find_by_owner(&self, owner_id: &str) -> Result<Vec<Deployment>, Box<dyn std::error::Error>> {
        self.deployment_repository.find_by_owner(owner_id).await
    }

    pub async fn delete(&self, deployment: &Deployment) -> Result<(), Box<dyn std::error::Error>> {
        self.deployment_repository.delete(deployment).await
    }

    pub async fn save_artifact(
        &self,
        deployment: &Deployment,
        artifact: DeploymentArtifact,
    ) -> Result<(), Box<dyn std::error::Error>> {
        self.deployment_artifacts_repository
            .save(deployment, artifact)
            .await
    }

    pub async fn find_artifact(
        &self,
        deployment: &Deployment,
    ) -> Result<Option<DeploymentArtifact>, Box<dyn std::error::Error>> {
        self.deployment_artifacts_repository
            .find_one(deployment)
            .await
    }

    pub async fn exists_artifact(&self, deployment: &Deployment) -> Result<bool, Box<dyn std::error::Error>> {
        self.deployment_artifacts_repository
            .exists(deployment)
            .await
    }

    pub async fn delete_artifact(&self, deployment: &Deployment) -> Result<(), Box<dyn std::error::Error>> {
        self.deployment_artifacts_repository
            .delete(deployment)
            .await
    }
}
