use crate::domain::{self, Deployment, DeploymentArtifact};
use std::{error::Error, fs, path::PathBuf};

pub struct InMemoryDeploymentArtifactsRepository {
    root: PathBuf,
}

impl InMemoryDeploymentArtifactsRepository {
    pub fn new<T>(root: T) -> Self
    where
        T: Into<PathBuf>,
    {
        let root = root.into();
        let deployments_root = root.join("deployments");
        std::fs::create_dir_all(&deployments_root).expect("Can't create deployments directory");

        Self {
            root: deployments_root,
        }
    }
}

#[async_trait::async_trait]
impl domain::deployment::TDeploymentArtifactsRepository for InMemoryDeploymentArtifactsRepository {
    async fn find_one(&self, deployment: &Deployment) -> Result<Option<DeploymentArtifact>, Box<dyn Error>> {
        let depl_path = self
            .root
            .join(&deployment.owner_id)
            .join(&deployment.id)
            .join("artifact.zip");
        let exists = std::fs::exists(&depl_path).unwrap_or(false);
        if !exists {
            return Ok(None);
        }

        let deserialized = fs::read(&depl_path).unwrap();
        Ok(Some(deserialized))
    }

    async fn exists(&self, deployment: &Deployment) -> Result<bool, Box<dyn Error>> {
        let depl_path = self
            .root
            .join(&deployment.owner_id)
            .join(&deployment.id)
            .join("artifact.zip");

        Ok(std::fs::exists(&depl_path).unwrap_or(false))
    }

    async fn save(&self, deployment: &Deployment, artifact: DeploymentArtifact) -> Result<(), Box<dyn Error>> {
        let depl_path = self
            .root
            .join(&deployment.owner_id)
            .join(&deployment.id)
            .join("artifact.zip");
        fs::write(depl_path, artifact).unwrap();
        Ok(())
    }

    async fn delete(&self, deployment: &Deployment) -> Result<(), Box<dyn Error>> {
        let depl_path = self
            .root
            .join(&deployment.owner_id)
            .join(&deployment.id)
            .join("artifact.zip");
        fs::remove_file(depl_path).unwrap();
        Ok(())
    }
}
