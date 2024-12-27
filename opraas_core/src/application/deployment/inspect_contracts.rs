use crate::domain::{Deployment, TDeploymentRepository};
use serde_json::Value;

pub struct DeploymentContractsInspectorService {
    deployment_repository: Box<dyn TDeploymentRepository>,
}

pub trait TDeploymentContractsInspectorService: Send + Sync {
    fn find(&self, id: &str) -> Result<Option<Deployment>, Box<dyn std::error::Error>>;
    fn inspect(&self, deployment: &Deployment) -> Result<Value, Box<dyn std::error::Error>>;
}

// implementations ===================================================

impl DeploymentContractsInspectorService {
    pub fn new(deployment_repository: Box<dyn TDeploymentRepository>) -> Self {
        Self {
            deployment_repository,
        }
    }
}

impl TDeploymentContractsInspectorService for DeploymentContractsInspectorService {
    fn inspect(&self, deployment: &Deployment) -> Result<Value, Box<dyn std::error::Error>> {
        if let Some(addresses) = deployment.addresses.as_ref() {
            let addresses_json: Value = serde_json::from_str(addresses).map_err(|e| e.to_string())?;

            let result = serde_json::json!({
                "addresses": addresses_json,
            });

            return Ok(result);
        }

        Err("Required deployment files not found in the ZIP".into())
    }

    fn find(&self, name: &str) -> Result<Option<Deployment>, Box<dyn std::error::Error>> {
        self.deployment_repository.find(name)
    }
}
