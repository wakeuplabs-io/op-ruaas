use crate::{
    config::CoreConfig,
    domain::{self, Deployment, Release, OUT_CONTRACTS_ARTIFACTS_ADDRESSES, OUT_CONTRACTS_ARTIFACTS_DEPLOY_CONFIG},
};
use rand::Rng;
use serde_json::Value;
use std::io::Read;
use std::{collections::HashMap, io::Cursor};
use tempfile::TempDir;
use zip::ZipArchive;

pub struct StackContractsDeployerService {
    deployment_repository: Box<dyn domain::deployment::TDeploymentRepository>,
    release_repository: Box<dyn domain::release::TReleaseRepository>,
    release_runner: Box<dyn domain::release::TReleaseRunner>,
}

pub struct StackContractsInspectorService {}

pub trait TStackContractsDeployerService: Send + Sync {
    fn deploy(
        &self,
        name: &str,
        contracts_release: &Release,
        config: &CoreConfig,
        deploy_deterministic_deployer: bool,
        slow: bool,
    ) -> Result<Deployment, Box<dyn std::error::Error>>;

    fn find(&self, name: &str) -> Result<Option<Deployment>, Box<dyn std::error::Error>>;
}

pub trait TStackContractsInspectorService: Send + Sync {
    fn inspect(&self, artifact: Cursor<Vec<u8>>) -> Result<Value, Box<dyn std::error::Error>>;
}

const IN_NETWORK: &str = "in/deploy-config.json";
const OUT_ARTIFACTS: &str = "out/artifacts.zip";

// implementations ===================================================

impl StackContractsDeployerService {
    pub fn new(
        deployment_repository: Box<dyn domain::deployment::TDeploymentRepository>,
        release_repository: Box<dyn domain::release::TReleaseRepository>,
        release_runner: Box<dyn domain::release::TReleaseRunner>,
    ) -> Self {
        Self {
            deployment_repository,
            release_repository,
            release_runner,
        }
    }
}

impl TStackContractsDeployerService for StackContractsDeployerService {
    fn deploy(
        &self,
        deployment_name: &str,
        contracts_release: &Release,
        config: &CoreConfig,
        deploy_deterministic_deployer: bool,
        slow: bool,
    ) -> Result<Deployment, Box<dyn std::error::Error>> {
        // ensure release is available locally for run
        self.release_repository.pull(&contracts_release)?;

        // we'll create a shared volume to share data with the contracts deployer
        let volume_dir: TempDir = TempDir::new()?; // automatically removed when dropped from scope
        std::fs::create_dir_all(volume_dir.path().join("out"))?;
        std::fs::create_dir_all(volume_dir.path().join("in"))?;
        let volume = volume_dir.path();

        // deployment initially points to local files
        let mut deployment = Deployment::new(
            deployment_name.to_string(),
            contracts_release.artifact_tag.clone(),
            contracts_release.registry_url.clone(),
            config.network.clone(),
            config.accounts.clone(),
        );

        // write contracts config to shared volume for artifact consumption
        deployment.write_contracts_config(&volume_dir.path().join(IN_NETWORK))?;

        // create environment
        let mut env: HashMap<&str, String> = HashMap::new();

        #[rustfmt::skip]
        env.insert("ETH_RPC_URL", config.network.l1_rpc_url.clone());
        #[rustfmt::skip]
        env.insert("DEPLOYER_ADDRESS", config.accounts.deployer_address.clone());
        #[rustfmt::skip]
        env.insert("DEPLOYER_PRIVATE_KEY", config.accounts.deployer_private_key.clone());
        #[rustfmt::skip]
        env.insert("IMPL_SALT", rand::thread_rng() .gen::<[u8; 16]>() .iter() .map(|b| format!("{:02x}", b)) .collect::<String>());
        #[rustfmt::skip]
        env.insert("DEPLOY_DETERMINISTIC_DEPLOYER",deploy_deterministic_deployer.to_string());
        #[rustfmt::skip]
        env.insert("SLOW_ARG", if slow { "--slow" } else { "" }.to_string());

        // using contracts artifact, create a deployment
        self.release_runner.run(&contracts_release, volume, env)?;

        // check out zip exists and add it to deployment
        let artifact_path = volume_dir.path().join(OUT_ARTIFACTS);
        if !artifact_path.exists() {
            return Err("Contracts artifact not found".into());
        }
        deployment.contracts_artifacts = Some(artifact_path);
        self.deployment_repository.save(&mut deployment)?;

        Ok(deployment)
    }

    fn find(&self, name: &str) -> Result<Option<Deployment>, Box<dyn std::error::Error>> {
        self.deployment_repository.find(name)
    }
}

impl StackContractsInspectorService {
    pub fn new() -> Self {
        Self {}
    }
}

impl TStackContractsInspectorService for StackContractsInspectorService {
    fn inspect(&self, artifact_reader: Cursor<Vec<u8>>) -> Result<Value, Box<dyn std::error::Error>> {
        let mut file_contents: HashMap<String, String> = HashMap::new();

        let mut archive = ZipArchive::new(artifact_reader).map_err(|e| e.to_string())?;

        // Iterate through the files in the archive
        for i in 0..archive.len() {
            let file_name;
            {
                let file = archive.by_index(i).map_err(|e| e.to_string())?;
                file_name = file.name().to_string();
            }

            if file_name == OUT_CONTRACTS_ARTIFACTS_ADDRESSES || file_name == OUT_CONTRACTS_ARTIFACTS_DEPLOY_CONFIG {
                let mut file = archive.by_index(i).map_err(|e| e.to_string())?;
                let mut contents = String::new();

                file.read_to_string(&mut contents)
                    .map_err(|e| e.to_string())?;

                file_contents.insert(file_name.clone(), contents);
            }
        }

        if let (Some(addresses), Some(deploy_config)) = (
            file_contents.get(OUT_CONTRACTS_ARTIFACTS_ADDRESSES),
            file_contents.get(OUT_CONTRACTS_ARTIFACTS_DEPLOY_CONFIG),
        ) {
            // Parse the JSON content of both files
            let addresses_json: Value = serde_json::from_str(addresses).map_err(|e| e.to_string())?;
            let deploy_config_json: Value = serde_json::from_str(deploy_config).map_err(|e| e.to_string())?;

            // Combine the results into a single JSON response
            let result = serde_json::json!({
                "addresses": addresses_json,
                "deploy-config": deploy_config_json,
            });

            return Ok(result);
        }

        Err("Required deployment files not found in the ZIP".into())
    }
}
