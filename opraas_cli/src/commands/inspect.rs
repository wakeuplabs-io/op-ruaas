use clap::ValueEnum;
use opraas_core::{
    application::deployment::{
        inspect_contracts::{DeploymentContractsInspectorService, TDeploymentContractsInspectorService},
        inspect_infra::{DeploymentInfraInspectorService, TDeploymentInfraInspectorService},
    },
    domain::{ProjectFactory, TProjectFactory},
    infra::deployment::InMemoryDeploymentRepository,
};
use std::io::Cursor;

#[derive(Debug, Clone, ValueEnum)]
pub enum InspectTarget {
    Contracts,
    Infra,
    All,
}

pub struct InspectCommand {
    contracts_inspector: Box<dyn TDeploymentContractsInspectorService>,
    infra_inspector: Box<dyn TDeploymentInfraInspectorService>,
}

// implementations ===================================================

impl InspectCommand {
    pub fn new() -> Self {
        let project_factory = Box::new(ProjectFactory::new());
        let project = project_factory.from_cwd().unwrap();

        Self {
            contracts_inspector: Box::new(DeploymentContractsInspectorService::new(Box::new(
                InMemoryDeploymentRepository::new(&project.root),
            ))),
            infra_inspector: Box::new(DeploymentInfraInspectorService::new(Box::new(
                InMemoryDeploymentRepository::new(&project.root),
            ))),
        }
    }

    pub fn run(&self, target: InspectTarget, deployment_name: String) -> Result<(), Box<dyn std::error::Error>> {
        if matches!(target, InspectTarget::Contracts | InspectTarget::All) {
            let deployment = self.contracts_inspector.find(&deployment_name)?;

            if let Some(deployment) = deployment {
                let artifact_cursor = Cursor::new(std::fs::read(&deployment.contracts_artifacts.unwrap())?);
                println!(
                    "{}",
                    serde_json::to_string_pretty(&self.contracts_inspector.inspect(artifact_cursor)?)?
                );
            } else {
                return Err("Contracts deployment not found".into());
            }
        }

        if matches!(target, InspectTarget::Infra | InspectTarget::All) {
            let deployment = self.infra_inspector.find(&deployment_name)?;

            if let Some(deployment) = deployment {
                let artifact_cursor = Cursor::new(std::fs::read(&deployment.infra_artifacts.unwrap())?);
                println!(
                    "{}",
                    serde_json::to_string_pretty(&self.infra_inspector.inspect(artifact_cursor)?)?
                );
            } else {
                return Err("Infra deployment not found".into());
            }
        }

        Ok(())
    }
}
