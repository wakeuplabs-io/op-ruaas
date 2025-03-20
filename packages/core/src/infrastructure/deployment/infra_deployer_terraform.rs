use crate::{
    domain::{
        Deployment, DeploymentKind, DeploymentOptions, Project, TDeploymentArtifactsRepository, TInfraDeployerProvider,
    },
    system,
};
use std::{
    fs::{self, File},
    io::Write,
    path::Path,
    process::Command,
};

pub struct TerraformDeployer {
    deployment_artifact_repository: Box<dyn TDeploymentArtifactsRepository>,
}

#[async_trait::async_trait]
impl TInfraDeployerProvider for TerraformDeployer {
    async fn deploy(
        &self,
        project: &Project,
        deployment: &mut Deployment,
        opts: &DeploymentOptions,
    ) -> Result<(), Box<dyn std::error::Error>> {
        let chart_root: &Path = match opts.kind {
            DeploymentKind::Replica => project.infrastructure.helm.replica.as_ref(),
            DeploymentKind::Sequencer => project.infrastructure.helm.sequencer.as_ref(),
        };

        // create values file
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

        // deploy using terraform init, plan and apply

        system::execute_command(
            Command::new("terraform")
                .arg("init")
                .current_dir(&project.infrastructure.aws),
            false,
        )?;

        system::execute_command(
            Command::new("terraform")
                .arg("plan")
                .arg(format!(
                    "-var=values_path={}",
                    values_file.to_str().unwrap()
                ))
                .arg(format!("-var=chart_path={}", chart_root.to_str().unwrap()))
                .arg(format!("-var=namespace={}", opts.release_namespace))
                .arg(format!("-var=name={}", deployment.id))
                .current_dir(&project.infrastructure.aws),
            false,
        )?;

        system::execute_command(
            Command::new("terraform")
                .arg("apply")
                .arg("-auto-approve")
                .arg(format!(
                    "-var=values_path={}",
                    values_file.to_str().unwrap()
                ))
                .arg(format!("-var=chart_path={}", chart_root.to_str().unwrap()))
                .arg(format!("-var=namespace={}", opts.release_namespace))
                .arg(format!("-var=name={}", deployment.id))
                .current_dir(&project.infrastructure.aws),
            false,
        )?;

        // save it in the deployment repository
        deployment.infra_base_url = Some(format!("http://{}", opts.host));

        Ok(())
    }
}

impl TerraformDeployer {
    pub fn new(deployment_artifact_repository: Box<dyn TDeploymentArtifactsRepository>) -> Self {
        Self {
            deployment_artifact_repository,
        }
    }
}
