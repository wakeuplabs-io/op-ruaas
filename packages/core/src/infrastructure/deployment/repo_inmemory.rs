use crate::domain::{self, Deployment};
use std::{fs, path::PathBuf};

pub struct InMemoryDeploymentRepository {
    root: PathBuf,
}

impl InMemoryDeploymentRepository {
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
impl domain::deployment::TDeploymentRepository for InMemoryDeploymentRepository {
    async fn find_by_id(&self, id: &str) -> Result<Option<domain::Deployment>, Box<dyn std::error::Error>> {
        let depl_path = self.root.join(id).join("deployment.json");
        let exists = std::fs::exists(&depl_path).unwrap_or(false);
        if !exists {
            return Ok(None);
        }

        let deserialized = fs::read_to_string(&depl_path)?;
        let deployment: Deployment = serde_json::from_str(&deserialized)?;

        Ok(Some(deployment))
    }

    async fn find_by_owner(&self, owner_id: &str) -> Result<Vec<Deployment>, Box<dyn std::error::Error>> {
        let mut deployments = Vec::new();

        for entry in fs::read_dir(&self.root)? {
            let entry = entry?;
            let depl_path = entry.path();
            let deserialized = fs::read_to_string(&depl_path)?;
            let deployment: Deployment = serde_json::from_str(&deserialized)?;

            if deployment.owner_id != owner_id {
                continue;
            }
            deployments.push(deployment);
        }

        Ok(deployments)
    }

    async fn save(&self, deployment: &Deployment) -> Result<(), Box<dyn std::error::Error>> {
        let serialized = serde_json::to_string(&deployment)?;

        let depl_path = self.root.join(&deployment.id).join("deployment.json");

        std::fs::create_dir_all(depl_path.parent().unwrap()).expect("Can't create deployments directory");
        fs::write(depl_path, serialized)?;

        Ok(())
    }

    async fn delete(&self, deployment: &Deployment) -> Result<(), Box<dyn std::error::Error>> {
        fs::remove_file(self.root.join(&deployment.id).join("deployment.json"))?;
        Ok(())
    }
}
