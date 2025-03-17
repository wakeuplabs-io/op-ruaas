use std::path::{Path, PathBuf};

use crate::config::CoreConfig;

#[derive(Debug, Clone)]
pub struct Project {
    pub root: PathBuf,
    pub config: PathBuf,
    pub infrastructure: Infrastructure,
    pub src: Src,
}

#[derive(Debug, Clone)]
pub struct Infrastructure {
    pub root: PathBuf,
    pub aws: PathBuf,
    pub helm: HelmCharts,
    pub docker: Dockerfiles,
}

#[derive(Debug, Clone)]
pub struct HelmCharts {
    pub root: PathBuf,
    pub sequencer: PathBuf,
    pub replica: PathBuf,
}

#[derive(Debug, Clone)]
pub struct Dockerfiles {
    pub root: PathBuf,
    pub node: PathBuf,
    pub geth: PathBuf,
    pub batcher: PathBuf,
    pub proposer: PathBuf,
    pub explorer: PathBuf,
    pub contracts: PathBuf,
}

#[derive(Debug, Clone)]
pub struct Src {
    pub root: PathBuf,
    pub contracts: PathBuf,
    pub node: PathBuf,
    pub geth: PathBuf,
    pub batcher: PathBuf,
    pub proposer: PathBuf,
    pub explorer: PathBuf,
}

pub trait TProjectRepository {
    fn create(&self, root: &Path, config: &CoreConfig) -> Result<Project, Box<dyn std::error::Error>>;
    fn write(&self, project: &Project, filepath: &Path, content: &str) -> Result<(), Box<dyn std::error::Error>>;
    fn exists(&self, project: &Project) -> bool;
    fn has(&self, project: &Project, filepath: &Path) -> bool;
}

pub trait TProjectInfraRepository {
    fn pull(&self, project: &Project) -> Result<(), Box<dyn std::error::Error>>;
}

pub trait TProjectVersionControl {
    fn init(&self, root: &Path) -> Result<(), Box<dyn std::error::Error>>;
    fn stage(&self, root: &Path) -> Result<(), Box<dyn std::error::Error>>;
    fn commit(&self, root: &Path, message: &str, initial: bool) -> Result<(), Box<dyn std::error::Error>>;
    fn tag(&self, root: &Path, tag: &str) -> Result<(), Box<dyn std::error::Error>>;
}

impl TryFrom<PathBuf> for Project {
    type Error = &'static str;

    /// walk back to find config.toml
    fn try_from(path: PathBuf) -> Result<Self, Self::Error> {
        let mut root = path;

        for _ in 0..10 {
            if root.join("config.toml").exists() {
                return Ok(Project {
                    root: root.clone(),
                    config: root.join("config.toml"),
                    infrastructure: Infrastructure {
                        root: root.join("infra"),
                        aws: root.join("infra").join("aws"),
                        helm: HelmCharts {
                            root: root.join("infra").join("helm"),
                            sequencer: root.join("infra").join("helm").join("sequencer"),
                            replica: root.join("infra").join("helm").join("replica"),
                        },
                        docker: Dockerfiles {
                            root: root.join("infra").join("docker"),
                            node: root.join("infra").join("docker").join("node.dockerfile"),
                            geth: root.join("infra").join("docker").join("geth.dockerfile"),
                            batcher: root.join("infra").join("docker").join("batcher.dockerfile"),
                            proposer: root
                                .join("infra")
                                .join("docker")
                                .join("proposer.dockerfile"),
                            explorer: root
                                .join("infra")
                                .join("docker")
                                .join("explorer.dockerfile"),
                            contracts: root
                                .join("infra")
                                .join("docker")
                                .join("contracts.dockerfile"),
                        },
                    },
                    src: Src {
                        root: root.join("src"),
                        contracts: root.join("src").join("contracts"),
                        node: root.join("src").join("node"),
                        geth: root.join("src").join("geth"),
                        batcher: root.join("src").join("batcher"),
                        proposer: root.join("src").join("proposer"),
                        explorer: root.join("src").join("explorer"),
                    },
                });
            }

            root = root.parent().unwrap().to_path_buf()
        }

        Err("Could not find config.toml")
    }
}
