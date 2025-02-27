use crate::domain::{Deployment, DeploymentOptions, Project, TDeploymentRunner, TProjectInfraRepository};

pub struct DeploymentRunnerService<DR, PIR>
where
    DR: TDeploymentRunner,
    PIR: TProjectInfraRepository,
{
    deployment_runner: DR,
    project_infra_repository: PIR,
}

impl<DR, PIR> DeploymentRunnerService<DR, PIR>
where
    DR: TDeploymentRunner,
    PIR: TProjectInfraRepository,
{
    pub fn new(deployment_runner: DR, project_infra_repository: PIR) -> Self {
        Self {
            deployment_runner,
            project_infra_repository,
        }
    }

    pub async fn run(
        &self,
        project: &Project,
        deployment: &Deployment,
        opts: &DeploymentOptions
    ) -> Result<(), Box<dyn std::error::Error>> {
        self.project_infra_repository.pull(project)?;

        self.deployment_runner
            .run(project, deployment, &opts)
            .await?;

        Ok(())
    }

    pub fn stop(&self, release_tag: &str, release_namespace: &str) -> Result<(), Box<dyn std::error::Error>> {
        self.deployment_runner.stop(
            release_tag,
            release_namespace
        )?;

        Ok(())
    }
}
