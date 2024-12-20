use std::{collections::HashMap, path::PathBuf};
use serde_yaml::Value;
use crate::infra::deployment::InMemoryDeploymentRepository;
use super::{Deployment, Project, TDeploymentRepository};

pub struct Stack {
    pub helm: PathBuf,
    pub aws: PathBuf,
    pub deployment: Option<Deployment>,
}

pub trait TStackInfraRepository: Send + Sync {
    fn pull(&self, stack: &Stack) -> Result<(), Box<dyn std::error::Error>>;
}

pub trait TStackInfraDeployer: Send + Sync {
    fn deploy(&self, stack: &Stack, values: &HashMap<&str, Value>) -> Result<Deployment, Box<dyn std::error::Error>>;
}

pub trait TStackRunner {
    fn run(&self, stack: &Stack, values: &HashMap<&str, Value>) -> Result<(), Box<dyn std::error::Error>>;
    fn stop(&self) -> Result<(), Box<dyn std::error::Error>>;
}

// implementations ==================================================

impl Stack {
    pub fn new(helm: PathBuf, aws: PathBuf, deployment: Option<Deployment>) -> Self {
        Self {
            helm,
            aws,
            deployment,
        }
    }

    pub fn load(project: &Project, deployment_name: &str) -> Self {
        let deployment_repository = InMemoryDeploymentRepository::new(&project.root);
        let deployment = deployment_repository.find(deployment_name).unwrap();

        Self {
            helm: project.infra.helm.clone(),
            aws: project.infra.aws.clone(),
            deployment,
        }
    }
}
