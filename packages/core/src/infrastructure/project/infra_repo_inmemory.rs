use crate::{
    config::artifacts::{INFRA_SOURCE_REPO, INFRA_SOURCE_REPO_VERSION},
    domain::{Project, TProjectInfraRepository},
    git,
};

pub struct InMemoryProjectInfraRepository {}

// implementations ================================================

impl Default for InMemoryProjectInfraRepository {
    fn default() -> Self {
        Self::new()
    }
}

impl InMemoryProjectInfraRepository {
    pub fn new() -> Self {
        Self {}
    }
}

impl TProjectInfraRepository for InMemoryProjectInfraRepository {
    fn pull(&self, project: &Project) -> Result<(), Box<dyn std::error::Error>> {
        if !project.infrastructure.helm.root.exists() {
            git::download_zipped_asset(
                INFRA_SOURCE_REPO,
                INFRA_SOURCE_REPO_VERSION,
                "infra-helm",
                &project.infrastructure.helm.root,
            )?;
        }

        if !project.infrastructure.aws.exists() {
            git::download_zipped_asset(
                INFRA_SOURCE_REPO,
                INFRA_SOURCE_REPO_VERSION,
                "infra-aws",
                &project.infrastructure.aws,
            )?;
        }

        Ok(())
    }
}
