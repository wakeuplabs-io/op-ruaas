use crate::domain::TProjectVersionControl;

pub struct VersionControlProjectService<T>
where
    T: TProjectVersionControl,
{
    version_control: T,
}

impl<T> VersionControlProjectService<T>
where
    T: TProjectVersionControl,
{
    pub fn new(version_control: T) -> Self {
        Self { version_control }
    }

    pub fn commit(
        &self,
        project: &crate::domain::Project,
        message: &str,
        initial: bool,
    ) -> Result<(), Box<dyn std::error::Error>> {
        self.version_control.commit(&project.root, message, initial)
    }

    pub fn tag(&self, project: &crate::domain::Project, tag: &str) -> Result<(), Box<dyn std::error::Error>> {
        self.version_control.tag(&project.root, tag)
    }
}
