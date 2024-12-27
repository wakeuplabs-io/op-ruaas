use crate::domain::{self, Deployment, Project};

pub struct ContractsDeployerService {
    deployment_repository: Box<dyn domain::deployment::TDeploymentRepository>,
    contracts_deployer: Box<dyn domain::deployment::TContractsDeployerProvider>,
}

pub trait TContractsDeployerService: Send + Sync {
    fn deploy(
        &self,
        project: &Project,
        deployment: &mut Deployment,
        deploy_deterministic_deployer: bool,
        slow: bool,
    ) -> Result<(), Box<dyn std::error::Error>>;
}

// implementations ===================================================

impl ContractsDeployerService {
    pub fn new(
        deployment_repository: Box<dyn domain::deployment::TDeploymentRepository>,
        contracts_deployer: Box<dyn domain::deployment::TContractsDeployerProvider>,
    ) -> Self {
        Self {
            contracts_deployer,
            deployment_repository,
        }
    }
}

impl TContractsDeployerService for ContractsDeployerService {
    fn deploy(
        &self,
        project: &Project,
        deployment: &mut Deployment,
        deploy_deterministic_deployer: bool,
        slow: bool,
    ) -> Result<(), Box<dyn std::error::Error>> {
        self.contracts_deployer
            .deploy(project, deployment, deploy_deterministic_deployer, slow)?;

        self.deployment_repository.save(deployment)?;

        Ok(())
    }
}
