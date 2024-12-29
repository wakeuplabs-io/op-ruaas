use crate::domain::{Deployment, TDeploymentRepository};

pub struct DeploymentManagerService<T>
where
    T: TDeploymentRepository,
{
    deployment_repository: T,
}

impl<T> DeploymentManagerService<T>
where
    T: TDeploymentRepository,
{
    pub fn new(deployment_repository: T) -> Self {
        Self {
            deployment_repository,
        }
    }

    pub async fn find_one(&self, owner_id: &str, id: &str) -> Result<Option<Deployment>, Box<dyn std::error::Error>> {
        self.deployment_repository.find_one(owner_id, id).await
    }

    pub async fn list(&self, owner_id: &str) -> Result<Vec<String>, Box<dyn std::error::Error>> {
        self.deployment_repository.list(owner_id).await
    }

    pub async fn delete(&self, deployment: &Deployment) -> Result<(), Box<dyn std::error::Error>> {
        self.deployment_repository.delete(deployment).await
    }

    pub async fn save(&self, deployment: &Deployment) -> Result<(), Box<dyn std::error::Error>> {
        self.deployment_repository.save(deployment).await
    }
}
