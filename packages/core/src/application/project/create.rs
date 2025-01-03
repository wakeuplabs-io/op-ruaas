use crate::{
    config::CoreConfig,
    domain::{self, Project, TProjectInfraRepository},
};
use std::path::PathBuf;

pub struct CreateProjectService<PR, VC, PIR>
where
    PR: domain::project::TProjectRepository,
    VC: domain::project::TProjectVersionControl,
    PIR: TProjectInfraRepository,
{
    repository: PR,
    version_control: VC,
    project_infra_repository: PIR,
}

impl<PR, VC, PIR> CreateProjectService<PR, VC, PIR>
where
    PR: domain::project::TProjectRepository,
    VC: domain::project::TProjectVersionControl,
    PIR: TProjectInfraRepository,
{
    pub fn new(repository: PR, version_control: VC, project_infra_repository: PIR) -> Self {
        Self {
            repository,
            version_control,
            project_infra_repository,
        }
    }

    pub fn create(
        &self,
        root: &PathBuf,
        config: &CoreConfig,
        init_git: bool,
    ) -> Result<Project, Box<dyn std::error::Error>> {
        let project = self.repository.create(root, config)?;

        self.project_infra_repository.pull(&project)?;

        if init_git {
            self.version_control.init(&root)?;
            self.version_control.stage(&root)?;
            self.version_control.commit(&root, "First commit", true)?;
        }

        Ok(project)
    }
}
