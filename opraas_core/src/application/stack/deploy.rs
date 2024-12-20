use crate::domain::{self, Deployment, Stack};
use serde_json::Value;
use std::io::Read;
use std::{collections::HashMap, io::Cursor};
use zip::ZipArchive;

pub struct StackInfraDeployerService {
    stack_deployer: Box<dyn domain::stack::TStackInfraDeployer>,
    stack_infra_repository: Box<dyn domain::stack::TStackInfraRepository>,
    deployment_repository: Box<dyn domain::deployment::TDeploymentRepository>,
}

pub struct StackInfraInspectorService {}

pub trait TStackInfraDeployerService: Send + Sync {
    fn deploy(&self, stack: &Stack, domain: &str) -> Result<Deployment, Box<dyn std::error::Error>>;
    fn find(&self, name: &str) -> Result<Option<Deployment>, Box<dyn std::error::Error>>;
}

pub trait TStackInfraInspectorService: Send + Sync {
    fn inspect(&self, artifact: Cursor<Vec<u8>>) -> Result<Value, Box<dyn std::error::Error>>;
}

const OUT_ARTIFACTS_OUTPUTS: &str = "output.json";

// implementations ===================================================

impl StackInfraDeployerService {
    pub fn new(
        stack_deployer: Box<dyn domain::stack::TStackInfraDeployer>,
        stack_infra_repository: Box<dyn domain::stack::TStackInfraRepository>,
        deployment_repository: Box<dyn domain::deployment::TDeploymentRepository>,
    ) -> Self {
        Self {
            stack_deployer,
            stack_infra_repository,
            deployment_repository,
        }
    }
}

impl TStackInfraDeployerService for StackInfraDeployerService {
    fn deploy(&self, stack: &Stack, domain: &str) -> Result<Deployment, Box<dyn std::error::Error>> {
        if stack.deployment.is_none() {
            return Err("Stack does not contain deployment".into());
        }

        self.stack_infra_repository.pull(stack)?;

        let mut values = HashMap::new();
        values.insert("global.host", domain.to_string());

        let deployment = self.stack_deployer.deploy(stack, &values)?;

        Ok(deployment)
    }

    fn find(&self, name: &str) -> Result<Option<Deployment>, Box<dyn std::error::Error>> {
        self.deployment_repository.find(name)
    }
}

impl StackInfraInspectorService {
    pub fn new() -> Self {
        Self {}
    }
}

impl TStackInfraInspectorService for StackInfraInspectorService {
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

            if file_name == OUT_ARTIFACTS_OUTPUTS {
                let mut file = archive.by_index(i).map_err(|e| e.to_string())?;
                let mut contents = String::new();

                file.read_to_string(&mut contents)
                    .map_err(|e| e.to_string())?;

                file_contents.insert(file_name.clone(), contents);
            }
        }

        if let Some(addresses) = file_contents.get(OUT_ARTIFACTS_OUTPUTS) {
            let outputs_json: Value = serde_json::from_str(addresses).map_err(|e| e.to_string())?;

            // Combine the results into a single JSON response
            let result = serde_json::json!({
                "outputs": outputs_json,
            });

            return Ok(result);
        }

        Err("Required deployment files not found in the ZIP".into())
    }
}
