use crate::domain;
use crate::domain::artifact::Artifact;

pub struct ArtifactInitializer<SR>
where
    SR: domain::artifact::TArtifactSourceRepository,
{
    source_repository: SR,
}

impl<SR> ArtifactInitializer<SR>
where
    SR: domain::artifact::TArtifactSourceRepository,
{
    pub fn new(source_repository: SR) -> Self {
        Self { source_repository }
    }

    pub fn initialize(&self, artifact: &Artifact) -> Result<(), Box<dyn std::error::Error>> {
        if self.source_repository.exists(artifact) {
            return Ok(());
        }

        self.source_repository.pull(artifact)?;

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use crate::{
        application::ArtifactInitializer,
        domain::{Artifact, ArtifactData, MockTArtifactSourceRepository},
    };
    use std::path::PathBuf;

    #[test]
    fn should_not_pull_if_existent() {
        let mut mock_source_repo = MockTArtifactSourceRepository::new();

        let artifact = Artifact::Batcher(ArtifactData {
            name: "mock".to_string(),
            context: PathBuf::new(),
            dockerfile: PathBuf::new(),
            source_tag: "v0.0.1".to_string(),
            source_url: "http://github.com".to_string(),
        });

        mock_source_repo.expect_exists().returning(|_| true);

        mock_source_repo.expect_pull().never();

        let service = ArtifactInitializer {
            source_repository: mock_source_repo,
        };

        let result = service.initialize(&artifact);
        assert!(result.is_ok());
    }

    #[test]
    fn should_pull_if_not_existent() {
        let mut mock_source_repo = MockTArtifactSourceRepository::new();

        let artifact = Artifact::Batcher(ArtifactData {
            name: "mock".to_string(),
            context: PathBuf::new(),
            dockerfile: PathBuf::new(),
            source_tag: "v0.0.1".to_string(),
            source_url: "http://github.com".to_string(),
        });

        mock_source_repo.expect_exists().returning(|_| false);

        mock_source_repo.expect_pull().returning(|_| Ok(()));

        let service = ArtifactInitializer {
            source_repository: mock_source_repo,
        };

        let result = service.initialize(&artifact);
        assert!(result.is_ok());
    }
}
