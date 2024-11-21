use crate::{domain::{self, Release}, system};
use std::process::Command;

pub struct DockerReleaseRepository;

// implementations ==================================================

impl DockerReleaseRepository {
    pub fn new() -> Self {
        Self
    }

    fn exists(&self, artifact: &domain::Artifact) -> bool {
        !system::execute_command(
            Command::new("docker")
                .arg("images")
                .arg("-q")
                .arg(artifact.name())
        )
        .unwrap()
        .is_empty()
    }
}

impl domain::TReleaseRepository for DockerReleaseRepository {
    fn pull(&self, release: &Release) -> Result<(), Box<dyn std::error::Error>> {
        system::execute_command(Command::new("docker").arg("pull").arg(release.uri()))?;

        Ok(())
    }

    fn create_for_artifact(
        &self,
        artifact: &domain::Artifact,
        release_name: &str, 
        registry_url: &str
    ) -> Result<Release, Box<dyn std::error::Error>> {
        // check image exists locally
        if self.exists(&artifact) == false {
            return Err(format!("Artifact {} not found", artifact.name()).into());
        }

        let release = Release::from_artifact(artifact, release_name, registry_url);

        system::execute_command(
            Command::new("docker")
                .arg("tag")
                .arg(artifact.name())
                .arg(release.uri()),
        )?;

        system::execute_command(Command::new("docker").arg("push").arg(release.uri()))?;

        Ok(release)
    }
}
