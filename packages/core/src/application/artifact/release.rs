use crate::domain::{self, artifact::Artifact, Release};

pub struct ArtifactReleaserService<T>
where
    T: domain::release::TReleaseRepository,
{
    release_repository: T,
}

impl<T> ArtifactReleaserService<T>
where
    T: domain::release::TReleaseRepository,
{
    pub fn new(release_repository: T) -> Self {
        Self { release_repository }
    }

    pub fn release(
        &self,
        artifact: &Artifact,
        release_name: &str,
        registry_url: &str,
    ) -> Result<Release, Box<dyn std::error::Error>> {
        self.release_repository
            .create_for_artifact(&artifact, release_name, registry_url)
    }
}

#[cfg(test)]
mod test {
    use super::ArtifactReleaserService;
    use crate::domain::{Artifact, ArtifactData, MockTReleaseRepository, Release};
    use std::path::PathBuf;

    #[test]
    fn creates_release_for_artifact() {
        let mut mock_release_repository = MockTReleaseRepository::new();

        let artifact = Artifact::Batcher(ArtifactData {
            name: "mock".to_string(),
            context: PathBuf::new(),
            dockerfile: PathBuf::new(),
            source_tag: "v0.0.1".to_string(),
            source_url: "http://github.com".to_string(),
        });

        mock_release_repository
            .expect_create_for_artifact()
            .returning(|_, _, _| {
                Ok(Release {
                    artifact_name: "artifact_name".to_string(),
                    artifact_tag: "artifact_tag".to_string(),
                    registry_url: "registry_url".to_string(),
                })
            });

        let service = ArtifactReleaserService {
            release_repository: mock_release_repository,
        };

        let result = service.release(&artifact, "release_name", "wakeuplabs");
        assert!(result.is_ok());
    }
}
