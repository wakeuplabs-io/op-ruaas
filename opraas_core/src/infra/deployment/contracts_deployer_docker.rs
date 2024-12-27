use crate::domain::{self, Deployment, Project, Release, TContractsDeployerProvider};
use rand::Rng;
use std::{collections::HashMap, fs};
use tempfile::TempDir;

pub struct DockerContractsDeployer {
    release_repository: Box<dyn domain::release::TReleaseRepository>,
    release_runner: Box<dyn domain::release::TReleaseRunner>,
}

const IN_NETWORK: &str = "in/deploy-config.json";
const OUT_ADDRESSES: &str = "out/addresses.json";
const OUT_ALLOCS: &str = "out/allocs-l2.json";
const OUT_GENESIS: &str = "out/genesis.json";
const OUT_ROLLUP_CONFIG: &str = "out/rollup-config.json";
const OUT_JWT_SECRET: &str = "out/jwt-secret.txt";

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

impl TContractsDeployerProvider for DockerContractsDeployer {
    fn deploy(
        &self,
        _project: &Project,
        deployment: &mut Deployment,
        deploy_deterministic_deployer: bool,
        slow: bool,
    ) -> Result<(), Box<dyn std::error::Error>> {
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

        // create environment
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
        #[rustfmt::skip]
         env.insert("OUT_ADDRESSES", format!("/shared/{}", OUT_ADDRESSES.to_string()));
        #[rustfmt::skip]
         env.insert("OUT_GENESIS", format!("/shared/{}", OUT_GENESIS.to_string()));
        #[rustfmt::skip]
         env.insert("OUT_ALLOCS", format!("/shared/{}", OUT_ALLOCS.to_string()));
        #[rustfmt::skip]
         env.insert("OUT_JWT_SECRET", format!("/shared/{}", OUT_JWT_SECRET.to_string()));
        #[rustfmt::skip]
         env.insert("OUT_ROLLUP_CONFIG", format!("/shared/{}", OUT_ROLLUP_CONFIG.to_string()));

        let contracts_release = Release {
            artifact_name: "op-contracts".to_string(),
            artifact_tag: deployment.release_tag.clone(),
            registry_url: deployment.release_registry.clone(),
        };

        // ensure release is available locally for run and run it to generate contracts
        self.release_repository.pull(&contracts_release)?;
        self.release_runner.run(&contracts_release, volume, env)?;

        // Load outputs into deployment
        deployment.addresses = Some(fs::read_to_string(&volume_dir.path().join(OUT_ADDRESSES))?);
        deployment.allocs = Some(fs::read_to_string(&volume_dir.path().join(OUT_ALLOCS))?);
        deployment.genesis = Some(fs::read_to_string(&volume_dir.path().join(OUT_GENESIS))?);
        deployment.jwt_secret = Some(fs::read_to_string(&volume_dir.path().join(OUT_JWT_SECRET))?);
        deployment.rollup_config = Some(fs::read_to_string(
            &volume_dir.path().join(OUT_ROLLUP_CONFIG),
        )?);

        Ok(())
    }
}
