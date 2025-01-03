use crate::domain::{self, artifact::Artifact};

pub struct ArtifactBuilderService<AR, ASR>
where
    AR: domain::artifact::TArtifactRepository,
    ASR: domain::artifact::TArtifactSourceRepository,
{
    artifact_repository: AR,
    artifact_source_repository: ASR,
}

impl<AR, ASR> ArtifactBuilderService<AR, ASR>
where
    AR: domain::artifact::TArtifactRepository,
    ASR: domain::artifact::TArtifactSourceRepository,
{
    pub fn new(artifact_repository: AR, artifact_source_repository: ASR) -> Self {
        Self {
            artifact_repository,
            artifact_source_repository,
        }
    }

    pub fn build(&self, artifact: &Artifact) -> Result<(), Box<dyn std::error::Error>> {
        if !self.artifact_source_repository.exists(artifact) {
            self.artifact_source_repository.pull(artifact)?;
        }

        self.artifact_repository.create(artifact)?;

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use crate::{
        application::ArtifactBuilderService,
        domain::{Artifact, ArtifactData, MockTArtifactRepository, MockTArtifactSourceRepository},
    };
    use std::path::PathBuf;

    #[test]
    fn should_pull_source_if_not_existent() {
        let mut mock_artifact_repo = MockTArtifactRepository::new();
        let mut mock_source_repo = MockTArtifactSourceRepository::new();

        let artifact = Artifact::Batcher(ArtifactData {
            name: "mock".to_string(),
            context: PathBuf::new(),
            dockerfile: PathBuf::new(),
            source_tag: "v0.0.1".to_string(),
            source_url: "http://github.com".to_string(),
        });

        // Mock behaviors
        mock_source_repo.expect_exists().return_const(false);

        mock_source_repo.expect_pull().returning(|_| Ok(()));

        mock_artifact_repo.expect_create().returning(|_| Ok(()));

        let service = ArtifactBuilderService {
            artifact_repository: mock_artifact_repo,
            artifact_source_repository: mock_source_repo,
        };

        let result = service.build(&artifact);
        assert!(result.is_ok());
    }

    #[test]
    fn should_not_pull_source_if_existent() {
        let mut mock_artifact_repo = MockTArtifactRepository::new();
        let mut mock_source_repo = MockTArtifactSourceRepository::new();

        let artifact = Artifact::Batcher(ArtifactData {
            name: "mock".to_string(),
            context: PathBuf::new(),
            dockerfile: PathBuf::new(),
            source_tag: "v0.0.1".to_string(),
            source_url: "http://github.com".to_string(),
        });

        // Mock behaviors
        mock_source_repo.expect_exists().return_const(true);

        mock_source_repo.expect_pull().never();

        mock_artifact_repo.expect_create().returning(|_| Ok(()));

        let service = ArtifactBuilderService {
            artifact_repository: mock_artifact_repo,
            artifact_source_repository: mock_source_repo,
        };

        let result = service.build(&artifact);
        assert!(result.is_ok());
    }
}
