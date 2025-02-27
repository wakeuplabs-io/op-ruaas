use crate::{
    domain::{Deployment, DeploymentKind, DeploymentOptions, Project, TDeploymentRunner},
    system,
};
use log::info;
use std::{
    fs::{self, File},
    io::Write,
    path::Path,
    process::Command,
};

pub struct HelmDeploymentRunner {
    deployment_artifact_repository: Box<dyn crate::domain::TDeploymentArtifactsRepository>,
}

#[async_trait::async_trait]
impl TDeploymentRunner for HelmDeploymentRunner {
    async fn run(
        &self,
        project: &Project,
        deployment: &Deployment,
        opts: &DeploymentOptions,
    ) -> Result<(), Box<dyn std::error::Error>> {
        let chart_root = match opts.kind {
            DeploymentKind::Replica => project.infrastructure.helm.replica.as_ref(),
            DeploymentKind::Sequencer => project.infrastructure.helm.sequencer.as_ref(),
        };

        // add repos, install pre-requisites and build dependencies
        self.build_dependencies(&chart_root)?;

        // create .tmp folder
        let helm_tmp_folder = chart_root.join(".tmp");
        let _ = fs::remove_dir_all(&helm_tmp_folder);
        fs::create_dir_all(&helm_tmp_folder)?;

        // create values file from stack.
        let values_file = helm_tmp_folder.join("values.yaml");
        let values_yaml = match opts.kind {
            DeploymentKind::Replica => deployment.build_replica_values_yaml(opts),
            DeploymentKind::Sequencer => deployment.build_sequencer_values_yaml(opts),
        }?;
        fs::write(&values_file, values_yaml)?;

        // create artifacts.zip and addresses.json in helm so it can be loaded by it
        let deployment_artifacts = self
            .deployment_artifact_repository
            .find_one(deployment)
            .await?
            .ok_or("No deployment artifacts found")?;

        File::create(helm_tmp_folder.join("artifacts.zip"))?.write_all(&deployment_artifacts)?;

        fs::write(
            helm_tmp_folder.join("addresses.json"),
            deployment
                .contracts_addresses
                .as_ref()
                .ok_or("No deployment addresses found")?,
        )?;

        // install core infrastructure

        system::execute_command(
            Command::new("helm")
                .arg("install")
                .arg(&opts.release_tag)
                .arg("-f")
                .arg(values_file.to_str().unwrap())
                .arg("--namespace")
                .arg(&opts.release_namespace)
                .arg("--create-namespace")
                .arg(chart_root.to_str().unwrap()),
            false,
        )?;

        self.wait_for_running_release(&opts.release_namespace)?;

        Ok(())
    }

    fn stop(&self, release_tag: &str, release_namespace: &str) -> Result<(), Box<dyn std::error::Error>> {
        let running_releases = system::execute_command(
            Command::new("helm")
                .arg("list")
                .arg("--no-headers")
                .arg("--namespace")
                .arg(release_namespace),
            true,
        )?;
        if !running_releases.contains(release_tag) {
            return Ok(());
        }

        system::execute_command(
            Command::new("helm")
                .arg("uninstall")
                .arg(release_tag)
                .arg("--namespace")
                .arg(release_namespace),
            false,
        )?;

        Ok(())
    }
}

impl HelmDeploymentRunner {
    pub fn new(deployment_artifact_repository: Box<dyn crate::domain::TDeploymentArtifactsRepository>) -> Self {
        Self {
            deployment_artifact_repository,
        }
    }

    fn build_dependencies(&self, root: &Path) -> Result<(), Box<dyn std::error::Error>> {
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
                    .arg(url),
                false,
            )?;
        }
        system::execute_command(Command::new("helm").arg("repo").arg("update"), false)?;

        // install pre-requisites, without these helm won't be capable of understanding out chart

        let pre_requisites = [
            (
                "ingress-nginx",
                "ingress-nginx/ingress-nginx",
                vec![
                    "--version",
                    "v4.6.0",
                    "--set",
                    "tcp.30313=op-geth-sequencer-service:30313",
                ], 
            ),
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

            self.wait_for_running_release(name)?;
        }

        // build dependencies

        system::execute_command(
            Command::new("helm")
                .arg("dependency")
                .arg("update")
                .current_dir(&root),
            false,
        )?;

        system::execute_command(
            Command::new("helm")
                .arg("dependency")
                .arg("build")
                .current_dir(&root),
            false,
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
