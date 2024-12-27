use crate::{
    domain::{Deployment, Project, TDeploymentRunner},
    system, yaml,
};
use log::info;
use serde_yaml::Value;
use std::{
    collections::HashMap,
    fs::{self, File},
    io::Write,
    process::Command,
};
use zip::write::FileOptions;

pub struct HelmDeploymentRunner {
    release_tag: String,
    namespace: String,
}

// implementations ============================================================

impl HelmDeploymentRunner {
    pub fn new(release_tag: &str, namespace: &str) -> Self {
        Self {
            release_tag: release_tag.to_string(),
            namespace: namespace.to_string(),
        }
    }

    fn build_dependencies(&self, project: &Project) -> Result<(), Box<dyn std::error::Error>> {
        let repo_dependencies = [
            (
                "ingress-nginx",
                "https://kubernetes.github.io/ingress-nginx",
            ),
            ("jetstack", "https://charts.jetstack.io/"),
            ("blockscout", "https://blockscout.github.io/helm-charts"),
            (
                "prometheus-community",
                "https://prometheus-community.github.io/helm-charts",
            ),
        ];

        for (repo, url) in repo_dependencies {
            system::execute_command(
                Command::new("helm")
                    .arg("repo")
                    .arg("add")
                    .arg(repo)
                    .arg(url)
                    .arg("--force-update"),
                false,
            )?;
        }
        system::execute_command(Command::new("helm").arg("repo").arg("update"), false)?;

        // install pre-requisites, without these helm won't be capable of understanding out chart

        let pre_requisites = [
            ("ingress-nginx", "ingress-nginx/ingress-nginx", vec![]),
            (
                "cert-manager",
                "jetstack/cert-manager",
                vec!["--version", "v1.10.0", "--set", "installCRDs=true"],
            ),
        ];

        for (name, repo, args) in pre_requisites {
            // if already installed skip
            if system::execute_command(Command::new("helm").args(["list", "-n", name]), true)?.contains(name) {
                continue;
            }

            info!("Installing {} from {}", name, repo);
            system::execute_command(
                Command::new("helm")
                    .args(["install", name, repo, "-n", name, "--create-namespace"])
                    .args(args),
                false,
            )?;

            self.wait_for_running_release(&name)?;
        }

        // build dependencies

        system::execute_command(
            Command::new("helm")
                .arg("dependency")
                .arg("update")
                .current_dir(&project.infra.helm),
            false,
        )?;

        system::execute_command(
            Command::new("helm")
                .arg("dependency")
                .arg("build")
                .current_dir(&project.infra.helm),
            false,
        )?;

        Ok(())
    }

    fn create_values_file<T>(
        &self,
        project: &Project,
        deployment: &Deployment,
        values: &HashMap<&str, Value>,
        target: T,
    ) -> Result<(), Box<dyn std::error::Error>>
    where
        T: AsRef<std::path::Path>,
    {
        let mut updates: HashMap<&str, Value> = values.clone();

        // global ================================================

        updates.entry("global.host").or_insert("localhost".into());
        updates.entry("global.protocol").or_insert("http".into());
        updates
            .entry("global.storageClassName")
            .or_insert("".into());

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
                .ok_or("Missing l1_rpc_url")?
                .into(),
        );

        // ================================================

        yaml::rewrite_yaml_to(project.infra.helm.join("values.yaml"), target, &updates)?;

        Ok(())
    }

    fn wait_for_running_release(&self, namespace: &str) -> Result<(), Box<dyn std::error::Error>> {
        info!("Waiting for release {} to be ready", namespace);

        loop {
            let pods = system::execute_command(
                Command::new("kubectl")
                    .arg("get")
                    .arg("pods")
                    .arg("-n")
                    .arg(namespace)
                    .arg("--no-headers"),
                true,
            )?;

            if !pods.contains("Pending") && !pods.contains("CrashLoopBackOff") && !pods.contains("Err") {
                break;
            }

            std::thread::sleep(std::time::Duration::from_secs(4));
        }

        Ok(())
    }
}

impl TDeploymentRunner for HelmDeploymentRunner {
    fn run(
        &self,
        project: &Project,
        deployment: &Deployment,
        values: &HashMap<&str, Value>,
    ) -> Result<(), Box<dyn std::error::Error>> {
        // add repos, install pre-requisites and build dependencies
        self.build_dependencies(project)?;

        // create .tmp folder
        let helm_tmp_folder = project.infra.helm.join(".tmp");
        let _ = fs::remove_dir_all(&helm_tmp_folder);
        fs::create_dir_all(&helm_tmp_folder)?;

        // create values file from stack
        let values_file = helm_tmp_folder.join("values.yaml");
        self.create_values_file(project, deployment, &values, &values_file)?;

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

        // install core infrastructure

        system::execute_command(
            Command::new("helm")
                .arg("install")
                .arg(format!("op-ruaas-runner-{}", &self.release_tag))
                .arg("-f")
                .arg(values_file.to_str().unwrap())
                .arg("--namespace")
                .arg(&self.namespace)
                .arg("--create-namespace")
                .arg(project.infra.helm.to_str().unwrap()),
            false,
        )?;

        self.wait_for_running_release(&self.namespace)?;

        Ok(())
    }

    fn stop(&self) -> Result<(), Box<dyn std::error::Error>> {
        let running_releases = system::execute_command(
            Command::new("helm")
                .arg("list")
                .arg("--no-headers")
                .arg("--namespace")
                .arg(&self.namespace),
            true,
        )?;
        if running_releases.contains(&format!("op-ruaas-runner-{}", &self.release_tag)) == false {
            return Ok(());
        }

        system::execute_command(
            Command::new("helm")
                .arg("uninstall")
                .arg(format!("op-ruaas-runner-{}", &self.release_tag))
                .arg("--namespace")
                .arg(&self.namespace),
            false,
        )?;

        Ok(())
    }
}
