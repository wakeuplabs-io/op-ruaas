use crate::domain::{self, Deployment, DeploymentArtifact, Project, Release, TContractsDeployerProvider};
use rand::Rng;
use std::{
    collections::HashMap,
    fs::{self, File},
    io::Read,
};
use tempfile::TempDir;

pub struct DockerContractsDeployer {
    release_repository: Box<dyn domain::release::TReleaseRepository>,
    release_runner: Box<dyn domain::release::TReleaseRunner>,
}

const IN_NETWORK: &str = "in/deploy-config.json";

// implementations ===================================================

impl DockerContractsDeployer {
    pub fn new(
        release_repository: Box<dyn domain::release::TReleaseRepository>,
        release_runner: Box<dyn domain::release::TReleaseRunner>,
    ) -> Self {
        Self {
            release_repository,
            release_runner,
        }
    }
}

#[async_trait::async_trait]
impl TContractsDeployerProvider for DockerContractsDeployer {
    fn deploy(
        &self,
        _project: &Project,
        deployment: &mut Deployment,
        deploy_deterministic_deployer: bool,
        slow: bool,
    ) -> Result<DeploymentArtifact, Box<dyn std::error::Error>> {
        // we'll create a shared volume to share data with the contracts deployer
        let volume_dir: TempDir = TempDir::new()?; // automatically removed when dropped from scope
        std::fs::create_dir_all(volume_dir.path().join("out"))?;
        std::fs::create_dir_all(volume_dir.path().join("in"))?;
        let volume = volume_dir.path();

        // write contracts config to shared volume for artifact consumption
        fs::write(
            &volume_dir.path().join(IN_NETWORK),
            deployment.build_deploy_config()?,
        )?;

        let mut env: HashMap<&str, String> = HashMap::new();

        #[rustfmt::skip]
         env.insert("ETH_RPC_URL", deployment.network_config.l1_rpc_url.clone().expect("L1 RPC URL not set"));
        #[rustfmt::skip]
         env.insert("DEPLOYER_ADDRESS", deployment.accounts_config.deployer_address.clone());
        #[rustfmt::skip]
         env.insert("DEPLOYER_PRIVATE_KEY", deployment.accounts_config.deployer_private_key.clone().expect("Deployer private key not set"));
        #[rustfmt::skip]
         env.insert("IMPL_SALT", rand::thread_rng().gen::<[u8; 16]>() .iter() .map(|b| format!("{:02x}", b)) .collect::<String>());
        #[rustfmt::skip]
         env.insert("DEPLOY_DETERMINISTIC_DEPLOYER",deploy_deterministic_deployer.to_string());
        #[rustfmt::skip]
         env.insert("SLOW_ARG", if slow { "--slow" } else { "" }.to_string());
        //  TODO: env vars with in and out paths

        let contracts_release = Release {
            artifact_name: "op-contracts".to_string(),
            artifact_tag: deployment.release_tag.clone(),
            registry_url: deployment.release_registry.clone(),
        };

        // ensure release is available locally for run and run it to generate contracts
        self.release_repository.pull(&contracts_release)?;
        self.release_runner.run(&contracts_release, volume, env)?;

        // Load outputs into deployment
        let mut artifacts_zip = File::open(volume_dir.path().join("out").join("artifacts.zip"))?;
        let mut artifacts_zip_buffer = Vec::new();
        artifacts_zip.read_to_end(&mut artifacts_zip_buffer)?;

        Ok(artifacts_zip_buffer)
    }
}
