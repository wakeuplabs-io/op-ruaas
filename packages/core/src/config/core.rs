use crate::config::{AccountsConfig, ArtifactsConfig, NetworkConfig};
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct CoreConfig {
    pub artifacts: ArtifactsConfig,
    pub accounts: AccountsConfig,
    pub network: NetworkConfig,
}

impl CoreConfig {
    pub fn new_from_toml<P: AsRef<std::path::Path>>(p: &P) -> Result<Self, Box<dyn std::error::Error>> {
        if !p.as_ref().exists() {
            return Err("Config file not found".into());
        }

        let config_content = std::fs::read_to_string(p)?;
        let config: CoreConfig = toml::from_str(&config_content)?;

        Ok(config)
    }

    pub fn to_toml<P: AsRef<std::path::Path>>(&self, p: &P) -> Result<(), Box<dyn std::error::Error>> {
        let config_content = toml::to_string(&self)?;
        std::fs::write(p, config_content)?;

        Ok(())
    }

    pub fn null() -> Self {
        Self {
            artifacts: ArtifactsConfig::null(),
            accounts: AccountsConfig::null(),
            network: NetworkConfig::null(),
        }
    }
}
