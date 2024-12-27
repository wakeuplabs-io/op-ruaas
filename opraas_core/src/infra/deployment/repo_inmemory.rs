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
    async fn find(&self, id: &str) -> Result<Option<domain::Deployment>, Box<dyn std::error::Error>> {
        let depl_path = self.root.join(format!("{}.json", id));
        let exists = std::fs::exists(&depl_path).unwrap_or(false);
        if !exists {
            return Ok(None);
        }

        let deserialized = fs::read_to_string(&depl_path)?;
        let deployment: Deployment = serde_json::from_str(&deserialized)?;

        Ok(Some(deployment))
    }

    async fn save(&self, deployment: &mut Deployment) -> Result<(), Box<dyn std::error::Error>> {
        let serialized = serde_json::to_string_pretty(&deployment)?;
        fs::write(
            self.root.join(format!("{}.json", deployment.id)),
            serialized,
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
