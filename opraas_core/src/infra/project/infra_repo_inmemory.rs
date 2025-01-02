use crate::{
    config::artifacts::{INFRA_SOURCE_REPO, INFRA_SOURCE_REPO_VERSION},
    domain::{Project, TProjectInfraRepository},
    git,
};

pub struct InMemoryProjectInfraRepository {}

// implementations ================================================

impl InMemoryProjectInfraRepository {
    pub fn new() -> Self {
        Self {}
    }
}

impl TProjectInfraRepository for InMemoryProjectInfraRepository {
    fn pull(&self, project: &Project) -> Result<(), Box<dyn std::error::Error>> {
        if !project.infra.helm.exists() {
            git::download_zipped_asset(
                INFRA_SOURCE_REPO,
                INFRA_SOURCE_REPO_VERSION,
                "infra-helm",
                &project.infra.helm,
            )?;
        }

        if !project.infra.aws.exists() {
            git::download_zipped_asset(
                INFRA_SOURCE_REPO,
                INFRA_SOURCE_REPO_VERSION,
                "infra-aws",
                &project.infra.aws,
            )?;
        }

        Ok(())
    }
}
