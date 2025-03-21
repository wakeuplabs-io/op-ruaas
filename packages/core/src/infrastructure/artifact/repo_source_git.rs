use crate::{
    config::artifacts::{INFRA_SOURCE_REPO, INFRA_SOURCE_REPO_VERSION},
    domain::{self, artifact::Artifact},
    git,
};

pub struct GitArtifactSourceRepository;

impl Default for GitArtifactSourceRepository {
    fn default() -> Self {
        Self::new()
    }
}

impl GitArtifactSourceRepository {
    pub fn new() -> Self {
        Self
    }
}

impl domain::artifact::TArtifactSourceRepository for GitArtifactSourceRepository {
    fn pull(&self, artifact: &Artifact) -> Result<(), Box<dyn std::error::Error>> {
        let (source_repo, source_tag) = artifact.source_info();

        git::clone_tag(source_repo, source_tag, artifact.context())?;

        // download dockerfile for infra
        match artifact {
            Artifact::Batcher(..) => {
                git::download_release_asset(
                    INFRA_SOURCE_REPO,
                    INFRA_SOURCE_REPO_VERSION,
                    "packages/infrastructure/docker/batcher.dockerfile",
                    artifact.dockerfile(),
                )?;
            }
            Artifact::Contracts(..) => {
                git::download_release_asset(
                    INFRA_SOURCE_REPO,
                    INFRA_SOURCE_REPO_VERSION,
                    "packages/infrastructure/docker/contracts.dockerfile",
                    artifact.dockerfile(),
                )?;
            }
            Artifact::Proposer(..) => {
                git::download_release_asset(
                    INFRA_SOURCE_REPO,
                    INFRA_SOURCE_REPO_VERSION,
                    "packages/infrastructure/docker/proposer.dockerfile",
                    artifact.dockerfile(),
                )?;
            }
            Artifact::Geth(..) => {
                git::download_release_asset(
                    INFRA_SOURCE_REPO,
                    INFRA_SOURCE_REPO_VERSION,
                    "packages/infrastructure/docker/geth.dockerfile",
                    artifact.dockerfile(),
                )?;
            }
            Artifact::Node(..) => {
                git::download_release_asset(
                    INFRA_SOURCE_REPO,
                    INFRA_SOURCE_REPO_VERSION,
                    "packages/infrastructure/docker/node.dockerfile",
                    artifact.dockerfile(),
                )?;
            }
        };

        Ok(())
    }

    fn exists(&self, artifact: &Artifact) -> bool {
        artifact.context().exists()
    }
}
