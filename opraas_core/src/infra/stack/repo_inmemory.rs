use crate::{
    config::artifacts::{INFRA_SOURCE_REPO, INFRA_SOURCE_REPO_VERSION},
    domain::{Stack, TStackInfraRepository},
    git,
};

pub struct GitStackInfraRepository {}

// implementations ================================================

impl GitStackInfraRepository {
    pub fn new() -> Self {
        Self {}
    }
}

impl TStackInfraRepository for GitStackInfraRepository {
    fn pull(&self, stack: &Stack) -> Result<(), Box<dyn std::error::Error>> {
        if !stack.helm.exists() {
            git::download_zipped_asset(
                INFRA_SOURCE_REPO,
                INFRA_SOURCE_REPO_VERSION,
                "infra-helm",
                &stack.helm,
            )?;
        }

        if !stack.aws.exists() {
            git::download_zipped_asset(
                INFRA_SOURCE_REPO,
                INFRA_SOURCE_REPO_VERSION,
                "infra-aws",
                &stack.aws,
            )?;
        }

        Ok(())
    }
}
