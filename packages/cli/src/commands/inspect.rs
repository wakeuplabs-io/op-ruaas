use clap::ValueEnum;
use opraas_core::{
    application::deployment::manager::DeploymentManagerService,
    domain::Project,
    infrastructure::deployment::{InMemoryDeploymentArtifactsRepository, InMemoryDeploymentRepository},
};

use crate::AppContext;

#[derive(Debug, Clone, ValueEnum)]
pub enum InspectTarget {
    Contracts,
    Infra,
    All,
}

pub struct InspectCommand {
    deployments_manager: DeploymentManagerService<InMemoryDeploymentRepository, InMemoryDeploymentArtifactsRepository>,
}

impl InspectCommand {
    pub fn new() -> Self {
        let project = Project::try_from(std::env::current_dir().unwrap()).unwrap();

        Self {
            deployments_manager: DeploymentManagerService::new(
                InMemoryDeploymentRepository::new(&project.root),
                InMemoryDeploymentArtifactsRepository::new(&project.root),
            ),
        }
    }

    pub async fn run(
        &self,
        ctx: &AppContext,
        target: &InspectTarget,
        deployment_id: &str,
    ) -> Result<(), Box<dyn std::error::Error>> {
        let owner = ctx.user_id.clone().ok_or("User not found")?;

        let deployment = self
            .deployments_manager
            .find_one(&owner, deployment_id)
            .await?
            .ok_or("Deployment not found")?;

        if matches!(target, InspectTarget::Contracts | InspectTarget::All) {
            match &deployment.contracts_addresses {
                Some(addresses) => println!(
                    r#"The contract addresses of your chain:
                {}"#,
                    addresses
                ),
                None => println!("No deployment addresses found"),
            }
        }

        if matches!(target, InspectTarget::Infra | InspectTarget::All) {
            match &deployment.infra_base_url {
                Some(base_url) => println!(
                    r#"Relevant endpoints from your infra:
                - Explorer: {base_url}
                - Rpc: {base_url}/rpc
                - Monitoring: {base_url}/monitoring"#
                ),
                None => println!("No infra found"),
            }
        }

        Ok(())
    }
}
