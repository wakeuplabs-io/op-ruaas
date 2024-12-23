use std::path::Path;

use crate::domain::TProjectVersionControl;
use git2::{Commit, Oid, Repository, Tree};

pub struct GitVersionControl;

impl GitVersionControl {
    pub fn new() -> Self {
        Self {}
    }
}

impl TProjectVersionControl for GitVersionControl {
    fn init(&self, path: &Path) -> Result<(), Box<dyn std::error::Error>> {
        Repository::init(path)?;

        Ok(())
    }

    fn stage(&self, path: &Path) -> Result<(), Box<dyn std::error::Error>> {
        Repository::open(path)?
            .index()?
            .add_all(&["."], git2::IndexAddOption::DEFAULT, None)?;

        Ok(())
    }

    fn commit(&self, path: &Path, message: &str, initial_commit: bool) -> Result<(), Box<dyn std::error::Error>> {
        let repo = Repository::open(path)?;
        let signature = repo.signature().unwrap();
        let mut index = repo.index()?;

        let oid: Oid;
        let tree: Tree;
        let parent_commit: Option<Commit>;

        if initial_commit {
            oid = repo.index()?.write_tree()?;
            tree = repo.find_tree(oid)?;
            parent_commit = None;
        } else {
            index.write()?;

            oid = index.write_tree()?;
            tree = repo.find_tree(oid)?;
            parent_commit = Some(repo.head()?.peel_to_commit()?);
        }

        let commit_slice: &[&Commit] = match parent_commit.as_ref() {
            Some(parent_commit) => &[parent_commit],
            None => &[],
        };

        repo.commit(
            Some("HEAD"),
            &signature,
            &signature,
            message,
            &tree,
            commit_slice,
        )?;

        Ok(())
    }

    fn tag(&self, root: &Path, tag: &str) -> Result<(), Box<dyn std::error::Error>> {
        let repo = Repository::open(root)?;

        let head = repo.head()?.peel_to_commit()?;
        let signature = repo.signature().unwrap();

        repo.tag(
            tag,
            &repo.find_object(head.id(), None)?,
            &signature,
            "",
            false,
        )?;

        Ok(())
    }
}
