use crate::{docker, filesystem, git};

pub struct GethBuildArtifact {
    docker: Box<dyn docker::TDockerBuilder>,
    filesystem: Box<dyn filesystem::Filesystem>,
    downloader: Box<dyn git::GitReleaseDownloader>,
}

impl GethBuildArtifact {
    pub fn new() -> Self {
        Self {
            docker: Box::new(docker::DockerBuilder::new()),
            downloader: Box::new(git::Git::new()),
            filesystem: Box::new(filesystem::Fs::new()),
        }
    }
}

impl crate::artifacts::initializable::Initializable for GethBuildArtifact {
    fn initialize(&self, cfg: &crate::config::Config) -> Result<(), Box<dyn std::error::Error>> {
        if self.filesystem.exists(&cfg.tree.src.geth) {
            return Ok(());
        }

        self.downloader.download_release(
            &cfg.core.artifacts.geth.release_url,
            &cfg.core.artifacts.geth.release_tag,
            &cfg.tree.src.geth.as_path().to_str().unwrap(),
        )?;

        Ok(())
    }
}

impl crate::artifacts::build::BuildArtifact for GethBuildArtifact {
    fn build(&self, cfg: &crate::config::Config) -> Result<(), Box<dyn std::error::Error>> {
        if !self.filesystem.exists(&cfg.tree.src.geth) {
            return Err("Geth src is not available".into());
        }

        if !self.filesystem.exists(&cfg.tree.infra.docker.geth) {
            return Err(format!(
                "Geth dockerfile is not available at {} Make sure CloudArtifact.setup() has been called",
                &cfg.tree.infra.docker.geth.display()
            )
            .into());
        }

        self.docker.build(
            &cfg.tree.src.geth.as_path().to_str().unwrap(),
            &cfg.tree.infra.docker.geth.as_path().to_str().unwrap(),
            &cfg.core.artifacts.geth.image_tag,
        )?;

        Ok(())
    }

    fn release(
        &self,
        cfg: &crate::config::Config,
        name: &str,
        repository: &str,
    ) -> Result<(), Box<dyn std::error::Error>> {
        self.docker.push(
            &cfg.core.artifacts.geth.image_tag,
            format!("{}:{}", &cfg.core.artifacts.geth.image_tag, name).as_str(),
            repository,
        )?;

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::artifacts::initializable::Initializable;
    use crate::config::Config;
    use mockall::predicate;

    #[test]
    fn test_setup_downloads_release_if_not_exists() {
        let config = Config {
            tree: crate::config::TreeConfig::new_from_root(std::env::current_dir().unwrap()),
            core: crate::config::CoreConfig::new_from_null(),
        };

        let mut mock_filesystem = filesystem::MockFilesystem::new();
        mock_filesystem
            .expect_exists()
            .with(predicate::eq(config.tree.src.geth.clone()))
            .times(1) // Expect 1 call to `exists`
            .returning(|_| false); // Return false to indicate that the file does not exist

        let mut mock_downloader = git::MockGitReleaseDownloader::new();
        mock_downloader
            .expect_download_release()
            .times(1) // Expect 1 call to `download_release`
            .returning(|_, _, _| Ok(())); // Return Ok to indicate successful download

        let batcher_artifact = GethBuildArtifact {
            docker: Box::new(docker::MockTDockerBuilder::new()),
            downloader: Box::new(mock_downloader),
            filesystem: Box::new(mock_filesystem),
        };

        // act
        let result = batcher_artifact.initialize(&config);

        // assert
        assert!(result.is_ok());
    }

    #[test]
    fn test_setup_does_not_download_if_exists() {
        let config = Config {
            tree: crate::config::TreeConfig::new_from_root(std::env::current_dir().unwrap()),
            core: crate::config::CoreConfig::new_from_null(),
        };

        let mut mock_filesystem = filesystem::MockFilesystem::new();
        mock_filesystem
            .expect_exists()
            .with(predicate::eq(config.tree.src.geth.clone()))
            .times(1) // Expect 1 call to `exists`
            .returning(|_| true); // Return true to indicate that the file exists

        let mut mock_downloader = git::MockGitReleaseDownloader::new();
        mock_downloader.expect_download_release().times(0); // Expect 0 calls to `download_release`

        let batcher_artifact = GethBuildArtifact {
            docker: Box::new(docker::MockTDockerBuilder::new()),
            downloader: Box::new(mock_downloader),
            filesystem: Box::new(mock_filesystem),
        };

        // act
        let result = batcher_artifact.initialize(&config);

        // assert
        assert!(result.is_ok());
    }
}
