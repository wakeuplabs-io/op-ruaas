use std::{collections::HashMap, path::Path};

use super::Artifact;
use mockall::automock;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Release {
    pub artifact_name: String,
    pub artifact_tag: String,
    pub registry_url: String,
}

#[automock]
pub trait TReleaseRepository: Send + Sync {
    fn create_for_artifact(
        &self,
        artifact: &Artifact,
        release_name: &str,
        registry_url: &str,
    ) -> Result<Release, Box<dyn std::error::Error>>;
    fn pull(&self, release: &Release) -> Result<(), Box<dyn std::error::Error>>;
}

pub trait TReleaseRunner: Send + Sync {
    fn run(&self, release: &Release, opts: ReleaseRunnerOptions) -> Result<(), Box<dyn std::error::Error>>;
    fn stop(&self, container_name: &str) -> Result<(), Box<dyn std::error::Error>>;
}

pub struct ReleaseRunnerOptions<'a> {
    pub env: HashMap<&'a str, String>,
    pub args: Vec<String>,
    pub volume: &'a Path,
    pub container_name: String,
}

// implementations =============================================

impl Release {
    pub fn new<T>(artifact_name: T, artifact_tag: T, registry_url: T) -> Self
    where
        T: Into<String>,
    {
        let artifact_name = artifact_name.into();
        let artifact_tag = artifact_tag.into();
        let registry_url = registry_url.into();

        if artifact_name.is_empty() {
            panic!("Artifact name can't be empty");
        }
        if artifact_tag.is_empty() {
            panic!("Artifact tag can't be empty");
        }
        if registry_url.is_empty() {
            panic!("Registry url can't be empty");
        }

        Self {
            artifact_name,
            artifact_tag,
            registry_url,
        }
    }

    pub fn from_artifact<T>(artifact: &Artifact, release_name: T, registry_url: T) -> Self
    where
        T: Into<String>,
    {
        let release_name = release_name.into();
        let registry_url = registry_url.into();

        if artifact.name().is_empty() {
            panic!("Artifact name can't be empty");
        }
        if release_name.is_empty() {
            panic!("Artifact tag can't be empty");
        }
        if registry_url.is_empty() {
            panic!("Registry url can't be empty");
        }

        Self {
            artifact_name: artifact.name().to_string(),
            artifact_tag: release_name.to_string(),
            registry_url: registry_url.to_string(),
        }
    }

    pub fn uri(&self) -> String {
        format!(
            "{}/{}:{}",
            self.registry_url, self.artifact_name, self.artifact_tag
        )
    }
}
