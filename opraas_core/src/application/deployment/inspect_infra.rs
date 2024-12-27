use crate::domain::{Deployment, TDeploymentRepository};
use serde_json::Value;

pub struct DeploymentInfraInspectorService {
    deployment_repository: Box<dyn TDeploymentRepository>,
}

pub trait TDeploymentInfraInspectorService: Send + Sync {
    fn find(&self, id: &str) -> Result<Option<Deployment>, Box<dyn std::error::Error>>;
    fn inspect(&self, deployment: &Deployment) -> Result<Value, Box<dyn std::error::Error>>;
}

// implementations ===================================================

impl DeploymentInfraInspectorService {
    pub fn new(deployment_repository: Box<dyn TDeploymentRepository>) -> Self {
        Self {
            deployment_repository,
        }
    }
}

impl TDeploymentInfraInspectorService for DeploymentInfraInspectorService {
    fn find(&self, id: &str) -> Result<Option<Deployment>, Box<dyn std::error::Error>> {
        self.deployment_repository.find(id)
    }

    fn inspect(&self, deployment: &Deployment) -> Result<Value, Box<dyn std::error::Error>> {
        if let Some(outputs) = deployment.infra_outputs.as_ref() {
            let outputs_json: Value = serde_json::from_str(&outputs).map_err(|e| e.to_string())?;

            // Combine the results into a single JSON response
            let result = serde_json::json!({
                "outputs": outputs_json,
            });

            return Ok(result);
        }

        Err("Couldn't find infra outputs".into())
    }
}
