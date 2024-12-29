use crate::{
    domain::{Deployment, Project, TInfraDeployerProvider},
    system, yaml,
};
use serde_yaml::Value;
use std::{
    collections::HashMap,
    fs::{self, File},
    io::Write,
    path::Path,
    process::Command,
};
use zip::write::FileOptions;

pub struct TerraformDeployer {}

// implementations ================================================

impl TerraformDeployer {
    pub fn new() -> Self {
        Self {}
    }

    fn create_values_file<T>(
        &self,
        project: &Project,
        deployment: &Deployment,
        values: &HashMap<&str, Value>,
        target: T,
    ) -> Result<(), Box<dyn std::error::Error>>
    where
        T: AsRef<Path>,
    {
        let mut updates: HashMap<&str, Value> = values.clone();

        // global ================================================

        updates.entry("global.host").or_insert("localhost".into());
        updates.entry("global.protocol").or_insert("https".into());
        updates
            .entry("global.storageClassName")
            .or_insert("gp2".into());

        // private keys ================================================

        updates.entry("wallets.batcher").or_insert(
            deployment
                .accounts_config
                .batcher_private_key
                .clone()
                .ok_or("No batcher private key found")?
                .into(),
        );
        updates.entry("wallets.proposer").or_insert(
            deployment
                .accounts_config
                .proposer_private_key
                .clone()
                .ok_or("No proposer private key found")?
                .into(),
        );

        // artifacts images =============================================

        updates
            .entry("node.image.tag")
            .or_insert(deployment.release_tag.clone().into());
        updates
            .entry("node.image.repository")
            .or_insert(format!("{}/{}", deployment.release_registry, "op-node").into());

        updates
            .entry("batcher.image.tag")
            .or_insert(deployment.release_tag.clone().into());
        updates
            .entry("batcher.image.repository")
            .or_insert(format!("{}/{}", deployment.release_registry, "op-batcher").into());

        updates
            .entry("proposer.image.tag")
            .or_insert(deployment.release_tag.clone().into());
        updates
            .entry("proposer.image.repository")
            .or_insert(format!("{}/{}", deployment.release_registry, "op-proposer").into());

        updates
            .entry("geth.image.tag")
            .or_insert(deployment.release_tag.clone().into());
        updates
            .entry("geth.image.repository")
            .or_insert(format!("{}/{}", deployment.release_registry, "op-geth").into());

        // chain settings ================================================

        updates
            .entry("chain.id")
            .or_insert(deployment.network_config.l2_chain_id.to_string().into());
        updates.entry("chain.l1Rpc").or_insert(
            deployment
                .network_config
                .l1_rpc_url
                .clone()
                .ok_or("No L1 RPC URL found")?
                .into(),
        );

        // ================================================

        yaml::rewrite_yaml_to(project.infra.helm.join("values.yaml"), target, &values)?;

        Ok(())
    }
}

#[async_trait::async_trait]
impl TInfraDeployerProvider for TerraformDeployer {
    async fn deploy(
        &self,
        project: &Project,
        deployment: &mut Deployment,
        values: &HashMap<&str, Value>,
    ) -> Result<(), Box<dyn std::error::Error>> {
        // create .tmp folder
        let helm_tmp_folder = project.infra.helm.join(".tmp");
        let _ = fs::remove_dir_all(&helm_tmp_folder);
        fs::create_dir_all(&helm_tmp_folder)?;

        // create values file
        let values_file = helm_tmp_folder.join("values.yaml");
        self.create_values_file(project, &deployment, &values, &values_file)?;

        // build artifacts.zip and copy addresses.json and to helm so it can be loaded by it
        let zip_file = File::create(helm_tmp_folder.join("artifacts.zip"))?;
        let mut zip = zip::ZipWriter::new(zip_file);

        let options = FileOptions::default()
            .compression_method(zip::CompressionMethod::Deflated)
            .unix_permissions(0o755);

        zip.start_file("addresses.json", options)?;
        zip.write_all(
            deployment
                .addresses
                .as_ref()
                .ok_or("No deployment addresses found")?
                .as_bytes(),
        )?;

        zip.start_file("genesis.json", options)?;
        zip.write_all(
            deployment
                .genesis
                .as_ref()
                .ok_or("No deployment genesis found")?
                .as_bytes(),
        )?;

        zip.start_file("jwt-secret.txt", options)?;
        zip.write_all(
            deployment
                .jwt_secret
                .as_ref()
                .ok_or("No deployment jwt-secret found")?
                .as_bytes(),
        )?;

        zip.start_file("rollup-config.json", options)?;
        zip.write_all(
            deployment
                .rollup_config
                .as_ref()
                .ok_or("No deployment rollup-config found")?
                .as_bytes(),
        )?;

        zip.finish()?;

        fs::write(
            helm_tmp_folder.join("addresses.json"),
            deployment
                .addresses
                .as_ref()
                .ok_or("No deployment addresses found")?,
        )?;

        // deploy using terraform ===============================

        system::execute_command(
            Command::new("terraform")
                .arg("init")
                .current_dir(&project.infra.aws),
            false,
        )?;

        system::execute_command(
            Command::new("terraform")
                .arg("plan")
                .arg(format!(
                    "-var=values_file_path={}",
                    values_file.to_str().unwrap()
                ))
                .arg(format!("-var=name={}", deployment.id))
                .current_dir(&project.infra.aws),
            false,
        )?;

        system::execute_command(
            Command::new("terraform")
                .arg("apply")
                .arg("-auto-approve")
                .arg(format!(
                    "-var=values_file_path={}",
                    values_file.to_str().unwrap()
                ))
                .arg(format!("-var=name={}", deployment.id))
                .current_dir(&project.infra.aws),
            false,
        )?;

        // extract outputs from deployment

        let output = system::execute_command(
            Command::new("terraform")
                .arg("output")
                .arg("-json")
                .current_dir(&project.infra.aws),
            true,
        )?;

        // save it in the deployment repository
        deployment.infra_outputs = Some(output);

        Ok(())
    }
}
