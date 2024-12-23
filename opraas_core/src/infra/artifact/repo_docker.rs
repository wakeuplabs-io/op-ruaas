use crate::{domain, system};
use log::warn;
use std::process::Command;

pub struct DockerArtifactRepository;

// implementations ==========================================

impl DockerArtifactRepository {
    pub fn new() -> Self {
        Self
    }
}

impl domain::TArtifactRepository for DockerArtifactRepository {
    fn create(&self, artifact: &domain::Artifact) -> Result<(), Box<dyn std::error::Error>> {
        let use_buildx = match system::execute_command(Command::new("docker").arg("buildx").arg("version"), true) {
            Ok(_) => true,
            Err(_) => {
                warn!("Docker buildx not found, falling back to legacy build");
                false
            }
        };

        if use_buildx {
            system::execute_command(
                Command::new("docker")
                    .arg("buildx")
                    .arg("build")
                    .arg("--platform")
                    .arg("linux/amd64")
                    .arg("-t")
                    .arg(artifact.name())
                    .arg("-f")
                    .arg(artifact.dockerfile())
                    .arg(".")
                    .current_dir(artifact.context()),
                false,
            )?;
        } else {
            system::execute_command(
                Command::new("docker")
                    .arg("build")
                    .arg("-t")
                    .arg(artifact.name())
                    .arg("-f")
                    .arg(artifact.dockerfile())
                    .arg(".")
                    .current_dir(artifact.context()),
                false,
            )?;
        }

        Ok(())
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
