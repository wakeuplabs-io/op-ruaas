use opraas_core::domain::{Deployment, TDeploymentRepository};

pub struct S3DeploymentRepository {}

// implementations ====================================

impl TDeploymentRepository for S3DeploymentRepository {
    fn find(&self, id: &str) -> Result<Option<Deployment>, Box<dyn std::error::Error>> {
        todo!()
    }

    fn save(&self, deployment: &mut Deployment) -> Result<(), Box<dyn std::error::Error>> {
        todo!()
    }
}

impl S3DeploymentRepository {
    pub fn new() -> Self {
        Self {}
    }
}
