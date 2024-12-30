use clap::ValueEnum;
use opraas_core::{
    application::deployment::manager::DeploymentManagerService, domain::Project,
    infra::deployment::InMemoryDeploymentRepository,
};

#[derive(Debug, Clone, ValueEnum)]
pub enum InspectTarget {
    Contracts,
    Infra,
    All,
}

pub struct InspectCommand {
    deployments_manager: DeploymentManagerService<InMemoryDeploymentRepository>,
}

// implementations ===================================================

impl InspectCommand {
    pub fn new() -> Self {
        let project = Project::try_from(std::env::current_dir().unwrap()).unwrap();

        Self {
            deployments_manager: DeploymentManagerService::new(InMemoryDeploymentRepository::new(&project.root)),
        }
    }

    pub async fn run(&self, target: InspectTarget, id: String) -> Result<(), Box<dyn std::error::Error>> {
        let deployment = self
            .deployments_manager
            .find_one("root", &id)
            .await?
            .ok_or("Deployment not found")?;

        // if matches!(target, InspectTarget::Contracts | InspectTarget::All) {
        //     match &deployment.addresses {
        //         Some(addresses) => println!("{}", addresses),
        //         None => println!("No addresses found"),
        //     }
        // }

        // if matches!(target, InspectTarget::Infra | InspectTarget::All) {
        //     match &deployment.infra_outputs {
        //         Some(infra) => println!("{}", infra),
        //         None => println!("No infra found"),
        //     }
        // }

        Ok(())
    }
}
