use crate::{
    domain::{self, Release},
    system,
};
use log::warn;
use std::process::Command;

pub struct DockerReleaseRepository;

// implementations ==================================================

impl Default for DockerReleaseRepository {
    fn default() -> Self {
        Self::new()
    }
}

impl DockerReleaseRepository {
    pub fn new() -> Self {
        Self
    }

    fn exists(&self, artifact: &domain::Artifact) -> bool {
        !system::execute_command(
            Command::new("docker")
                .arg("images")
                .arg("-q")
                .arg(artifact.name()),
            true,
        )
        .unwrap()
        .is_empty()
    }
}

impl domain::TReleaseRepository for DockerReleaseRepository {
    fn pull(&self, release: &Release) -> Result<(), Box<dyn std::error::Error>> {
        system::execute_command(Command::new("docker").arg("pull").arg(release.uri()), false)?;

        Ok(())
    }

    fn create_for_artifact(
        &self,
        artifact: &domain::Artifact,
        release_name: &str,
        registry_url: &str,
    ) -> Result<Release, Box<dyn std::error::Error>> {
        let use_buildx = match system::execute_command(Command::new("docker").arg("buildx").arg("version"), true) {
            Ok(_) => true,
            Err(_) => {
                warn!("Docker buildx not found, falling back to legacy build");
                false
            }
        };

        let release = Release::from_artifact(artifact, release_name, registry_url);

        if use_buildx {
            // buildx requires us to push
            system::execute_command(
                Command::new("docker")
                    .arg("buildx")
                    .arg("build")
                    .arg("--platform")
                    .arg("linux/amd64,linux/arm64")
                    .arg("-t")
                    .arg(release.uri())
                    .arg("--push")
                    .arg("-f")
                    .arg(artifact.dockerfile())
                    .arg(".")
                    .current_dir(artifact.context()),
                false,
            )?;
        } else {
            if !self.exists(artifact) {
                return Err(format!("Artifact {} not found", artifact.name()).into());
            }

            system::execute_command(
                Command::new("docker")
                    .arg("tag")
                    .arg(artifact.name())
                    .arg(release.uri()),
                true,
            )?;

            system::execute_command(Command::new("docker").arg("push").arg(release.uri()), false)?;
        }

        Ok(release)
    }
}
