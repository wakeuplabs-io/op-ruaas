use crate::{
    domain::{Deployment, Stack, TStackRunner},
    system, yaml,
};
use log::info;
use serde_yaml::Value;
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

    fn create_values_file<T>(
        &self,
        stack: &Stack,
        values: &HashMap<&str, Value>,
        target: T,
    ) -> Result<(), Box<dyn std::error::Error>> 
    where
        T: AsRef<std::path::Path>,
        {
        let depl: &Deployment = stack.as_ref();
        let mut updates: HashMap<&str, Value> = values.clone();

        // global ================================================

        updates.entry("global.host").or_insert("localhost".into());
        updates.entry("global.protocol").or_insert("http".into());
        updates
            .entry("global.storageClassName")
            .or_insert("".into());

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

        yaml::rewrite_yaml_to(stack.helm.join("values.yaml"), target, &updates)?;

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
    fn run(&self, stack: &Stack, values: &HashMap<&str, Value>) -> Result<(), Box<dyn std::error::Error>> {
        let deployment: &Deployment = stack.as_ref();
        let contracts_artifacts = deployment.contracts_artifacts.as_ref().unwrap();

        // add repos, install pre-requisites and build dependencies
        self.build_dependencies(stack)?;

        // create .tmp folder
        let helm_tmp_folder = stack.helm.join(".tmp");
        let _ = fs::remove_dir_all(&helm_tmp_folder);
        fs::create_dir_all(&helm_tmp_folder)?;

        // create values file from stack
        let values_file = helm_tmp_folder.join("values.yaml");
        self.create_values_file(stack, &values, &values_file)?;

        let unzipped_artifacts = tempfile::TempDir::new()?;
        zip_extract::extract(
            File::open(contracts_artifacts)?,
            &unzipped_artifacts.path(),
            true,
        )?;
        
        // copy addresses.json and artifacts.zip to helm/.tmp so it can be loaded by it
        fs::copy(contracts_artifacts, helm_tmp_folder.join("artifacts.zip"))?;
        fs::copy(
            unzipped_artifacts.path().join("addresses.json"),
            helm_tmp_folder.join("addresses.json"),
        )?;

        // install core infrastructure

        system::execute_command(
            Command::new("helm")
                .arg("install")
                .arg(format!("op-ruaas-runner-{}", &self.release_name))
                .arg("-f")
                .arg(values_file.to_str().unwrap())
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
