use std::{
    env,
    path::{Path, PathBuf},
};

#[derive(Debug, Clone)]
pub struct Project {
    pub root: PathBuf,
    pub config: PathBuf,
    pub infra: Infra,
    pub src: Src,
}

pub struct ProjectFactory;

#[derive(Debug, Clone)]
pub struct Infra {
    pub root: PathBuf,
    pub aws: PathBuf,
    pub helm: PathBuf,
    pub docker: Dockerfiles,
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

pub trait TProjectRepository: Send + Sync {
    fn write(&self, project: &Project, filepath: &Path, content: &str) -> Result<(), Box<dyn std::error::Error>>;
    fn exists(&self, project: &Project) -> bool;
    fn has(&self, project: &Project, filepath: &Path) -> bool;
}

pub trait TProjectInfraRepository: Send + Sync {
    fn pull(&self, project: &Project) -> Result<(), Box<dyn std::error::Error>>;
}

pub trait TProjectVersionControl: Send + Sync {
    fn init(&self, root: &Path) -> Result<(), Box<dyn std::error::Error>>;
    fn stage(&self, root: &Path) -> Result<(), Box<dyn std::error::Error>>;
    fn commit(&self, root: &Path, message: &str, initial: bool) -> Result<(), Box<dyn std::error::Error>>;
    fn tag(&self, root: &Path, tag: &str) -> Result<(), Box<dyn std::error::Error>>;
}

pub trait TProjectFactory: Send + Sync {
    fn from_cwd(&self) -> Option<Project>;
    fn from_root(&self, root: PathBuf) -> Project;
}

// implementations =================================================================

impl ProjectFactory {
    pub fn new() -> Self {
        Self
    }
}

impl TProjectFactory for ProjectFactory {
    /// walk back to find config.toml
    fn from_cwd(&self) -> Option<Project> {
        let mut current = env::current_dir().unwrap();

        for _ in 0..10 {
            if current.join("config.toml").exists() {
                return Some(self.from_root(current));
            }

            current = current.parent().unwrap().to_path_buf()
        }

        None
    }

    /// creates from given root
    fn from_root(&self, root: PathBuf) -> Project {
        Project {
            root: root.clone(),
            config: root.join("config.toml"),
            infra: Infra {
                root: root.join("infra"),
                aws: root.join("infra").join("aws"),
                helm: root.join("infra").join("helm"),
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
        }
    }
}
