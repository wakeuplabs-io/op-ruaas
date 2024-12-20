use log::info;

use crate::{
    domain::{Stack, TStackRunner},
    system, yaml,
};
use std::{
    collections::HashMap,
    fs::{self, File},
    process::Command,
};

pub struct HelmStackRunner {
    release_name: String,
    namespace: String,
}

// implementations ============================================================

impl HelmStackRunner {
    pub fn new(release_name: &str, namespace: &str) -> Self {
        Self {
            release_name: release_name.to_string(),
            namespace: namespace.to_string(),
        }
    }

    fn build_dependencies(&self, stack: &Stack) -> Result<(), Box<dyn std::error::Error>> {
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
                .current_dir(&stack.helm),
            false,
        )?;

        system::execute_command(
            Command::new("helm")
                .arg("dependency")
                .arg("build")
                .current_dir(&stack.helm),
            false,
        )?;

        Ok(())
    }

    fn create_values_file(
        &self,
        stack: &Stack,
        values: &HashMap<&str, String>,
        target: &str,
    ) -> Result<(), Box<dyn std::error::Error>> {
        let depl = stack.deployment.as_ref().unwrap();
        let mut updates = values.clone();

        // global ================================================

        updates
            .entry("global.host")
            .or_insert("localhost".to_string());
        updates
            .entry("global.protocol")
            .or_insert("http".to_string());
        updates
            .entry("global.storageClassName")
            .or_insert("".to_string());

        // private keys ================================================

        updates
            .entry("wallets.batcher")
            .or_insert(depl.accounts_config.batcher_private_key.clone());
        updates
            .entry("wallets.proposer")
            .or_insert(depl.accounts_config.proposer_private_key.clone());

        // artifacts images =============================================

        updates
            .entry("node.image.tag")
            .or_insert(depl.release_name.clone());
        updates
            .entry("node.image.repository")
            .or_insert(format!("{}/{}", depl.registry_url, "op-node"));

        updates
            .entry("batcher.image.tag")
            .or_insert(depl.release_name.clone());
        updates
            .entry("batcher.image.repository")
            .or_insert(format!("{}/{}", depl.registry_url, "op-batcher"));

        updates
            .entry("proposer.image.tag")
            .or_insert(depl.release_name.clone());
        updates
            .entry("proposer.image.repository")
            .or_insert(format!("{}/{}", depl.registry_url, "op-proposer"));

        updates
            .entry("geth.image.tag")
            .or_insert(depl.release_name.clone());
        updates
            .entry("geth.image.repository")
            .or_insert(format!("{}/{}", depl.registry_url, "op-geth"));

        // chain settings ================================================

        updates
            .entry("chain.id")
            .or_insert(depl.network_config.l2_chain_id.to_string());
        updates
            .entry("chain.l1Rpc")
            .or_insert(depl.network_config.l1_rpc_url.clone());

        // ================================================

        yaml::rewrite_yaml_to(
            stack.helm.join("values.yaml").to_str().unwrap(),
            target,
            &updates,
        )?;

        yaml::rewrite_yaml_to(
            stack.helm.join("values.yaml").to_str().unwrap(),
            stack.helm.join("values-updated.yaml").to_str().unwrap(),
            &updates,
        )?;

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

impl TStackRunner for HelmStackRunner {
    fn run(&self, stack: &Stack, values: &HashMap<&str, String>) -> Result<(), Box<dyn std::error::Error>> {
        let deployment = stack.deployment.as_ref().unwrap();
        let contracts_artifacts = deployment.contracts_artifacts.as_ref().unwrap();

        // add repos, install pre-requisites and build dependencies
        self.build_dependencies(stack)?;

        // create values file from stack
        let values_file = tempfile::NamedTempFile::new()?;
        self.create_values_file(stack, &values, values_file.path().to_str().unwrap())?;

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

        // install core infrastructure

        system::execute_command(
            Command::new("helm")
                .arg("install")
                .arg(format!("op-ruaas-runner-{}", &self.release_name))
                .arg("-f")
                .arg(values_file.path().to_str().unwrap())
                .arg("--namespace")
                .arg(&self.namespace)
                .arg("--create-namespace")
                .arg(stack.helm.to_str().unwrap()),
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
        if running_releases.contains(&format!("op-ruaas-runner-{}", &self.release_name)) == false {
            return Ok(());
        }

        system::execute_command(
            Command::new("helm")
                .arg("uninstall")
                .arg(format!("op-ruaas-runner-{}", &self.release_name))
                .arg("--namespace")
                .arg(&self.namespace),
            false,
        )?;

        Ok(())
    }
}
