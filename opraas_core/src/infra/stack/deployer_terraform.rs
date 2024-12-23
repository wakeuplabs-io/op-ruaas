use serde_yaml::Value;

use crate::{
    domain::{Deployment, Stack, TDeploymentRepository, TStackInfraDeployer},
    infra::deployment::InMemoryDeploymentRepository,
    system, yaml,
};
use std::{
    collections::HashMap,
    fs::{self, File},
    path::{Path, PathBuf},
    process::Command,
};

pub struct TerraformDeployer {
    deployment_repository: Box<dyn TDeploymentRepository>,
}

// implementations ================================================

impl TerraformDeployer {
    pub fn new<T>(root: T) -> Self
    where
        T: Into<PathBuf>,
    {
        Self {
            deployment_repository: Box::new(InMemoryDeploymentRepository::new(root)),
        }
    }

    fn create_values_file<T>(
        &self,
        stack: &Stack,
        values: &HashMap<&str, Value>,
        target: T,
    ) -> Result<(), Box<dyn std::error::Error>>
    where
        T: AsRef<Path>,
    {
        let depl: &Deployment = stack.as_ref();
        let mut updates: HashMap<&str, Value> = values.clone();

        // global ================================================

        updates.entry("global.host").or_insert("localhost".into());
        updates.entry("global.protocol").or_insert("https".into());
        updates
            .entry("global.storageClassName")
            .or_insert("gp2".into());

        // private keys ================================================

        updates
            .entry("wallets.batcher")
            .or_insert(depl.accounts_config.batcher_private_key.clone().into());
        updates
            .entry("wallets.proposer")
            .or_insert(depl.accounts_config.proposer_private_key.clone().into());

        // artifacts images =============================================

        updates
            .entry("node.image.tag")
            .or_insert(depl.release_name.clone().into());
        updates
            .entry("node.image.repository")
            .or_insert(format!("{}/{}", depl.registry_url, "op-node").into());

        updates
            .entry("batcher.image.tag")
            .or_insert(depl.release_name.clone().into());
        updates
            .entry("batcher.image.repository")
            .or_insert(format!("{}/{}", depl.registry_url, "op-batcher").into());

        updates
            .entry("proposer.image.tag")
            .or_insert(depl.release_name.clone().into());
        updates
            .entry("proposer.image.repository")
            .or_insert(format!("{}/{}", depl.registry_url, "op-proposer").into());

        updates
            .entry("geth.image.tag")
            .or_insert(depl.release_name.clone().into());
        updates
            .entry("geth.image.repository")
            .or_insert(format!("{}/{}", depl.registry_url, "op-geth").into());

        // chain settings ================================================

        updates
            .entry("chain.id")
            .or_insert(depl.network_config.l2_chain_id.to_string().into());
        updates
            .entry("chain.l1Rpc")
            .or_insert(depl.network_config.l1_rpc_url.clone().into());

        // ================================================

        yaml::rewrite_yaml_to(stack.helm.join("values.yaml"), target, &values)?;

        Ok(())
    }
}

impl TStackInfraDeployer for TerraformDeployer {
    fn deploy(&self, stack: &Stack, values: &HashMap<&str, Value>) -> Result<Deployment, Box<dyn std::error::Error>> {
        let mut deployment = stack.deployment.as_ref().unwrap().clone();
        let contracts_artifacts = deployment.contracts_artifacts.as_ref().unwrap();

        // create values file
        let values_file = tempfile::NamedTempFile::new()?;
        self.create_values_file(stack, &values, values_file.path())?;

        // copy addresses.json and artifacts.zip to helm/config so it can be loaded by it
        let config_dir = stack.helm.join("config");
        fs::create_dir_all(&config_dir)?;

        let unzipped_artifacts = tempfile::TempDir::new()?;
        zip_extract::extract(
            File::open(contracts_artifacts)?,
            &unzipped_artifacts.path(),
            true,
        )?;

        fs::copy(contracts_artifacts, config_dir.join("artifacts.zip"))?;
        fs::copy(
            unzipped_artifacts.path().join("addresses.json"),
            config_dir.join("addresses.json"),
        )?;

        // deploy using terraform

        system::execute_command(
            Command::new("terraform")
                .arg("init")
                .current_dir(&stack.aws),
            false,
        )?;

        system::execute_command(
            Command::new("terraform")
                .arg("plan")
                .current_dir(&stack.aws),
            false,
        )?;

        system::execute_command(
            Command::new("terraform")
                .arg("apply")
                .arg("-auto-approve")
                .arg(format!(
                    "-var=values_file_path={}",
                    values_file.path().to_str().unwrap()
                ))
                .current_dir(&stack.aws),
            false,
        )?;

        // write artifacts to repository

        let infra_artifacts = tempfile::NamedTempFile::new()?;
        let output = system::execute_command(
            Command::new("terraform")
                .arg("output")
                .arg("-json")
                .current_dir(&stack.aws),
            true,
        )?;
        fs::write(infra_artifacts.path(), output)?;

        deployment.infra_artifacts = Some(infra_artifacts.path().to_path_buf());
        self.deployment_repository.save(&mut deployment)?;

        Ok(deployment)
    }
}
