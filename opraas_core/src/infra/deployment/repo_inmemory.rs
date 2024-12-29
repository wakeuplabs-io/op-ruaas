use crate::domain::{self, Deployment};
use serde::{Deserialize, Serialize};
use std::{fs, path::PathBuf};

pub struct InMemoryDeploymentRepository {
    root: PathBuf,
}

#[derive(Debug, Deserialize, Serialize)]
struct ReleaseMetadata {
    name: String,
    registry_url: String,
}

// implementations ====================================

#[async_trait::async_trait]
impl domain::deployment::TDeploymentRepository for InMemoryDeploymentRepository {
    async fn find_one(
        &self,
        owner_id: &str,
        id: &str,
    ) -> Result<Option<domain::Deployment>, Box<dyn std::error::Error>> {
        let depl_path = self.root.join(format!("{}-{}.json", owner_id, id));
        let exists = std::fs::exists(&depl_path).unwrap_or(false);
        if !exists {
            return Ok(None);
        }

        let deserialized = fs::read_to_string(&depl_path)?;
        let deployment: Deployment = serde_json::from_str(&deserialized)?;

        Ok(Some(deployment))
    }

    async fn list(&self, owner_id: &str) -> Result<Vec<String>, Box<dyn std::error::Error>> {
        let mut deployments = Vec::new();

        for entry in fs::read_dir(&self.root)? {
            let entry = entry?;
            let path = entry.path();

            if !path.is_file() {
                continue;
            }

            let filename = path.file_name().unwrap().to_str().unwrap();
            if filename.starts_with(format!("{}-", owner_id).as_str()) {
                deployments.push(String::from(filename));
            }
        }

        Ok(deployments)
    }

    async fn save(&self, deployment: &Deployment) -> Result<(), Box<dyn std::error::Error>> {
        let serialized = serde_json::to_string_pretty(&deployment)?;
        fs::write(
            self.root
                .join(format!("{}-{}.json", deployment.owner_id, deployment.id)),
            serialized,
        )?;

        Ok(())
    }

    async fn delete(&self, deployment: &Deployment) -> Result<(), Box<dyn std::error::Error>> {
        fs::remove_file(
            self.root
                .join(format!("{}-{}.json", deployment.owner_id, deployment.id)),
        )?;
        Ok(())
    }
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
