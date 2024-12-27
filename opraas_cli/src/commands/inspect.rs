use clap::ValueEnum;
use opraas_core::{
    application::deployment::{
        inspect_contracts::{DeploymentContractsInspectorService, TDeploymentContractsInspectorService},
        inspect_infra::{DeploymentInfraInspectorService, TDeploymentInfraInspectorService},
    },
    domain::{ProjectFactory, TProjectFactory},
    infra::deployment::InMemoryDeploymentRepository,
};

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

    pub async fn run(&self, target: InspectTarget, id: String) -> Result<(), Box<dyn std::error::Error>> {
        if matches!(target, InspectTarget::Contracts | InspectTarget::All) {
            let deployment = self
                .contracts_inspector
                .find(&id)
                .await?
                .ok_or("Deployment not found")?;

            println!(
                "{}",
                serde_json::to_string_pretty(&self.contracts_inspector.inspect(&deployment).await?)?
            );
        }

        if matches!(target, InspectTarget::Infra | InspectTarget::All) {
            let deployment = self
                .infra_inspector
                .find(&id)
                .await?
                .ok_or("Deployment not found")?;

            println!(
                "{}",
                serde_json::to_string_pretty(&self.infra_inspector.inspect(&deployment).await?)?
            );
        }

        Ok(())
    }
}
