use crate::config::{artifacts::ArtifactConfig, CoreConfig};
use mockall::automock;
use std::{
    fmt,
    path::{Path, PathBuf},
    sync::Arc,
};

use super::Project;

#[derive(Debug)]
pub struct ArtifactData {
    pub name: String,
    pub context: PathBuf,
    pub dockerfile: PathBuf,
    pub source_url: String,
    pub source_tag: String,
}

#[derive(Hash, Eq, PartialEq, Debug)]
pub enum ArtifactKind {
    Batcher,
    Node,
    Contracts,
    Proposer,
    Geth,
}

impl ArtifactKind {
    pub const fn all() -> &'static [ArtifactKind] {
        &[
            ArtifactKind::Batcher,
            ArtifactKind::Node,
            ArtifactKind::Contracts,
            ArtifactKind::Proposer,
            ArtifactKind::Geth,
        ]
    }
}

#[derive(Debug)]
pub enum Artifact {
    Batcher(ArtifactData),
    Node(ArtifactData),
    Contracts(ArtifactData),
    Proposer(ArtifactData),
    Geth(ArtifactData),
}

impl fmt::Display for Artifact {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            Artifact::Batcher(_data) => write!(f, "Batcher"),
            Artifact::Node(_data) => write!(f, "Node"),
            Artifact::Contracts(_data) => write!(f, "Contracts"),
            Artifact::Proposer(_data) => write!(f, "Proposer"),
            Artifact::Geth(_data) => write!(f, "Geth"),
        }
    }
}

pub struct ArtifactFactory {}

#[automock]
pub trait TArtifactSourceRepository: Send + Sync {
    fn pull(&self, artifact: &Artifact) -> Result<(), Box<dyn std::error::Error>>;
    fn exists(&self, artifact: &Artifact) -> bool;
}

pub trait TArtifactFactory {
    fn get(&self, kind: &ArtifactKind, project: &Project, config: &CoreConfig) -> Arc<Artifact>;
    fn get_all(&self, project: &Project, config: &CoreConfig) -> Vec<Arc<Artifact>>;
}

#[automock]
pub trait TArtifactRepository: Send + Sync {
    fn exists(&self, artifact: &Artifact) -> bool;
    fn create(&self, artifact: &Artifact) -> Result<(), Box<dyn std::error::Error>>;
}

impl ArtifactData {
    pub fn new(name: &str, context: &Path, dockerfile: &Path, config: &ArtifactConfig) -> Self {
        Self {
            name: name.to_string(),
            context: context.to_path_buf(),
            dockerfile: dockerfile.to_path_buf(),
            source_url: config.source_repo.clone(),
            source_tag: config.source_tag.clone(),
        }
    }
}

impl Artifact {
    pub fn new(kind: ArtifactKind, source: &Path, dockerfile: &Path, config: &ArtifactConfig) -> Self {
        match kind {
            ArtifactKind::Batcher => Artifact::Batcher(ArtifactData::new("op-batcher", source, dockerfile, config)),
            ArtifactKind::Node => Artifact::Node(ArtifactData::new("op-node", source, dockerfile, config)),
            ArtifactKind::Contracts => Artifact::Contracts(ArtifactData::new(
                "op-contracts",
                source,
                dockerfile,
                config,
            )),
            ArtifactKind::Proposer => Artifact::Proposer(ArtifactData::new("op-proposer", source, dockerfile, config)),
            ArtifactKind::Geth => Artifact::Geth(ArtifactData::new("op-geth", source, dockerfile, config)),
        }
    }

    pub fn name(&self) -> &str {
        match self {
            Artifact::Batcher(data)
            | Artifact::Node(data)
            | Artifact::Proposer(data)
            | Artifact::Geth(data)
            | Artifact::Contracts(data) => &data.name,
        }
    }

    pub fn source_info(&self) -> (&str, &str) {
        match self {
            Artifact::Batcher(data)
            | Artifact::Node(data)
            | Artifact::Proposer(data)
            | Artifact::Geth(data)
            | Artifact::Contracts(data) => (&data.source_url, &data.source_tag),
        }
    }

    pub fn context(&self) -> &PathBuf {
        match self {
            Artifact::Batcher(data)
            | Artifact::Node(data)
            | Artifact::Proposer(data)
            | Artifact::Geth(data)
            | Artifact::Contracts(data) => &data.context,
        }
    }

    pub fn dockerfile(&self) -> &PathBuf {
        match self {
            Artifact::Batcher(data)
            | Artifact::Node(data)
            | Artifact::Proposer(data)
            | Artifact::Geth(data)
            | Artifact::Contracts(data) => &data.dockerfile,
        }
    }
}

impl ArtifactFactory {
    pub fn get(kind: &ArtifactKind, project: &Project, config: &CoreConfig) -> Arc<Artifact> {
        match kind {
            ArtifactKind::Batcher => Arc::new(Artifact::new(
                ArtifactKind::Batcher,
                &project.src.batcher,
                &project.infrastructure.docker.batcher,
                &config.artifacts.batcher,
            )),
            ArtifactKind::Contracts => Arc::new(Artifact::new(
                ArtifactKind::Contracts,
                &project.src.contracts,
                &project.infrastructure.docker.contracts,
                &config.artifacts.contracts,
            )),
            ArtifactKind::Geth => Arc::new(Artifact::new(
                ArtifactKind::Geth,
                &project.src.geth,
                &project.infrastructure.docker.geth,
                &config.artifacts.geth,
            )),
            ArtifactKind::Node => Arc::new(Artifact::new(
                ArtifactKind::Node,
                &project.src.node,
                &project.infrastructure.docker.node,
                &config.artifacts.node,
            )),
            ArtifactKind::Proposer => Arc::new(Artifact::new(
                ArtifactKind::Proposer,
                &project.src.proposer,
                &project.infrastructure.docker.proposer,
                &config.artifacts.proposer,
            )),
        }
    }

    pub fn get_all(project: &Project, config: &CoreConfig) -> Vec<Arc<Artifact>> {
        ArtifactKind::all()
            .iter()
            .map(|kind| ArtifactFactory::get(kind, project, config))
            .collect()
    }
}
