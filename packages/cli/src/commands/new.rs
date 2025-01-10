use crate::{infrastructure::console::style_spinner, AppContext};
use colored::*;
use indicatif::ProgressBar;
use opraas_core::{
    application::CreateProjectService,
    config::CoreConfig,
    infrastructure::project::{GitVersionControl, InMemoryProjectInfraRepository, InMemoryProjectRepository},
};
use std::{env, path::PathBuf};

pub struct NewCommand {
    project_creator: CreateProjectService<InMemoryProjectRepository, GitVersionControl, InMemoryProjectInfraRepository>,
}

impl NewCommand {
    pub fn new() -> Self {
        Self {
            project_creator: CreateProjectService::new(
                InMemoryProjectRepository::new(),
                GitVersionControl::new(),
                InMemoryProjectInfraRepository::new(),
            ),
        }
    }

    pub fn run(&self, _ctx: &AppContext, name: &str) -> Result<(), Box<dyn std::error::Error>> {
        let mut root = PathBuf::from(&name);
        if !root.is_absolute() {
            root = env::current_dir()?.join(root)
        }

        if root.exists() {
            return Err(format!("Directory already exists: {}", root.display()).into());
        } else {
            std::fs::create_dir_all(&root)?;
        }

        let create_spinner = style_spinner(
            ProgressBar::new_spinner(),
            &format!("⏳ Creating {} at {}...", name, root.display()),
        );

        let default_config = CoreConfig::default();
        self.project_creator.create(&root, &default_config, true)?;

        create_spinner.finish_with_message(format!(
            "✔️ Success! Created {} at {}\n",
            name,
            root.display()
        ));

        // print instructions ========================================

        println!(
            "\n{title}\n\n\
            Inside that directory, you can run several commands:\n\n\
            - {bin} {init_cmd}\n\
            \tInitiates artifacts for local builds.\n\n\
            - {bin} {build_cmd}\n\
            \tBuilds docker images from artifacts.\n\n\
            - {bin} {release_cmd}\n\
            \tPublishes docker images to be used in dev or prod.\n\n\
            - {bin} {dev_cmd}\n\
            \tRuns a local dev environment.\n\n\
            - {bin} {deploy_cmd}\n\
            \tDeploys contracts to l1 and infra to kubernetes through terraform.\n\n\
            We suggest that you begin by typing:\n\
            - {cd_cmd} {name}\n\
            - {bin} {dev_cmd}",
            title = "What's Next?".bright_white().bold(),
            bin = env!("CARGO_BIN_NAME").blue(),
            init_cmd = "init [contracts|node|etc...]".blue(),
            build_cmd = "-v build [contracts|node|etc...]".blue(),
            release_cmd = "-v release [contracts|node|etc...]".blue(),
            dev_cmd = "-v dev".blue(),
            deploy_cmd = "-v deploy [contracts|infra|all] --name <deployment_name>".blue(),
            cd_cmd = "cd".blue(),
            name = name.blue()
        );

        Ok(())
    }
}
