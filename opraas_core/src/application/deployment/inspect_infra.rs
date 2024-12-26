use crate::domain::{Deployment, TDeploymentRepository, OUT_INFRA_ARTIFACTS_OUTPUTS};
use serde_json::Value;
use std::io::Read;
use std::{collections::HashMap, io::Cursor};
use zip::ZipArchive;

pub struct DeploymentInfraInspectorService {
    deployment_repository: Box<dyn TDeploymentRepository>,
}

pub trait TDeploymentInfraInspectorService: Send + Sync {
    fn inspect(&self, artifact: Cursor<Vec<u8>>) -> Result<Value, Box<dyn std::error::Error>>;
    fn find(&self, id: &str) -> Result<Option<Deployment>, Box<dyn std::error::Error>>;
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
    fn inspect(&self, artifact_reader: Cursor<Vec<u8>>) -> Result<Value, Box<dyn std::error::Error>> {
        let mut file_contents: HashMap<String, String> = HashMap::new();

        let mut archive = ZipArchive::new(artifact_reader).map_err(|e| e.to_string())?;

        // Iterate through the files in the archive
        for i in 0..archive.len() {
            let file_name;
            {
                let file = archive.by_index(i).map_err(|e| e.to_string())?;
                file_name = file.name().to_string();
            }

            if file_name == OUT_INFRA_ARTIFACTS_OUTPUTS {
                let mut file = archive.by_index(i).map_err(|e| e.to_string())?;
                let mut contents = String::new();

                file.read_to_string(&mut contents)
                    .map_err(|e| e.to_string())?;

                file_contents.insert(file_name.clone(), contents);
            }
        }

        if let Some(addresses) = file_contents.get(OUT_INFRA_ARTIFACTS_OUTPUTS) {
            let outputs_json: Value = serde_json::from_str(addresses).map_err(|e| e.to_string())?;

            // Combine the results into a single JSON response
            let result = serde_json::json!({
                "outputs": outputs_json,
            });

            return Ok(result);
        }

        Err("Required deployment files not found in the ZIP".into())
    }

    fn find(&self, id: &str) -> Result<Option<Deployment>, Box<dyn std::error::Error>> {
        self.deployment_repository.find(id)
    }
}
