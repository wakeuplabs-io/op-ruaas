use crate::{
    config::CoreConfig,
    domain::{self, Deployment, Release},
};
use rand::Rng;
use std::collections::HashMap;
use tempfile::TempDir;

pub struct ContractsDeployerService {
    deployment_repository: Box<dyn domain::deployment::TDeploymentRepository>,
    release_repository: Box<dyn domain::release::TReleaseRepository>,
    release_runner: Box<dyn domain::release::TReleaseRunner>,
}

pub trait TContractsDeployerService: Send + Sync {
    fn deploy(
        &self,
        id: &str,
        contracts_release: &Release,
        config: &CoreConfig,
        deploy_deterministic_deployer: bool,
        slow: bool,
    ) -> Result<Deployment, Box<dyn std::error::Error>>;
}

const IN_NETWORK: &str = "in/deploy-config.json";
const OUT_ARTIFACTS: &str = "out/artifacts.zip";

// implementations ===================================================

impl ContractsDeployerService {
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

impl TContractsDeployerService for ContractsDeployerService {
    fn deploy(
        &self,
        id: &str,
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
            id.to_string(),
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
}
