use super::{Deployment, Project, TDeploymentRepository};
use crate::infra::deployment::InMemoryDeploymentRepository;
use serde_yaml::Value;
use std::{collections::HashMap, path::PathBuf};

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
    pub fn new<T>(helm: T, aws: T, deployment: Option<Deployment>) -> Self
    where
        T: Into<PathBuf>,
    {
        Self {
            helm: helm.into(),
            aws: aws.into(),
            deployment,
        }
    }

    pub fn load<T>(project: &Project, deployment_name: T) -> Result<Self, Box<dyn std::error::Error>>
    where
        T: AsRef<str>,
    {
        let deployment_repository = InMemoryDeploymentRepository::new(&project.root);
        let deployment = deployment_repository.find(deployment_name.as_ref())?;

        Ok(Self {
            helm: project.infra.helm.clone(),
            aws: project.infra.aws.clone(),
            deployment,
        })
    }
}

impl AsRef<Deployment> for Stack {
    fn as_ref(&self) -> &Deployment {
        self.deployment.as_ref().unwrap()
    }
}
