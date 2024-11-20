use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct ArtifactsConfig {
    pub infra: ArtifactConfig,
    pub node: ArtifactConfig,
    pub geth: ArtifactConfig,
    pub contracts: ArtifactConfig,
    pub batcher: ArtifactConfig,
    pub proposer: ArtifactConfig,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct ArtifactConfig {
    pub source_repo: String,
    pub source_tag: String,
}

impl ArtifactsConfig {
    pub fn null() -> Self {
        Self {
            infra: ArtifactConfig {
                source_repo: String::from("wakeuplabs-io/opraas"),
                source_tag: String::from("v0.0.2"),
            },
            node: ArtifactConfig {
                source_repo: String::from("ethereum-optimism/optimism"),
                source_tag: String::from("op-node/v1.9.4"),
            },
            contracts: ArtifactConfig {
                source_repo: String::from("ethereum-optimism/optimism"),
                source_tag: String::from("op-contracts/v1.6.0"),
            },
            batcher: ArtifactConfig {
                source_repo: String::from("ethereum-optimism/optimism"),
                source_tag: String::from("op-batcher/v1.9.4"),
            },
            proposer: ArtifactConfig {
                source_repo: String::from("ethereum-optimism/optimism"),
                source_tag: String::from("op-proposer/v1.9.4"),
            },
            geth: ArtifactConfig {
                source_repo: String::from("ethereum-optimism/op-geth"),
                source_tag: String::from("v1.101315.3"),
            },
        }
    }
}
