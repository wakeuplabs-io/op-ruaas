use std::path::Path;

use crate::domain::{self, Project};

pub struct InMemoryProjectRepository;

impl InMemoryProjectRepository {
    pub fn new() -> Self {
        Self
    }
}

impl domain::project::TProjectRepository for InMemoryProjectRepository {
    fn exists(&self, project: &Project) -> bool {
        project.root.exists()
    }

    fn has(&self, project: &Project, filepath: &Path) -> bool {
        filepath.starts_with(&project.root) && filepath.exists()
    }

    fn write(&self, project: &Project, filepath: &Path, content: &str) -> Result<(), Box<dyn std::error::Error>> {
        // ensure filepath is a subpath of the project root
        if !filepath.starts_with(&project.root) {
            return Err("File path is not a subpath of the project root".into());
        }

        // Creates all missing directories in the path
        if let Some(parent) = filepath.parent() {
            std::fs::create_dir_all(parent)?;
        }

        std::fs::write(filepath, content)?;

        Ok(())
    }
}
