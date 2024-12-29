use crate::{
    config::{SystemRequirementsChecker, TSystemRequirementsChecker, DOCKER_REQUIREMENT, GIT_REQUIREMENT},
    infra::console::{print_error, print_info, print_warning, style_spinner, Dialoguer, TDialoguer},
};
use clap::ValueEnum;
use colored::*;
use indicatif::{HumanDuration, ProgressBar};
use opraas_core::{
    application::ArtifactReleaserService,
    config::CoreConfig,
    domain::{ArtifactFactory, ArtifactKind, Project, TProjectVersionControl},
    infra::{project::GitVersionControl, release::DockerReleaseRepository},
};
use std::{sync::Arc, thread, time::Instant};

pub struct ReleaseCommand {
    version_control: Box<dyn TProjectVersionControl>, // TODO: wrong, should come from application
    dialoguer: Dialoguer,
    system_requirements_checker: SystemRequirementsChecker,
    artifacts_releaser: Arc<ArtifactReleaserService<DockerReleaseRepository>>,
}

#[derive(Debug, Clone, ValueEnum)]
pub enum ReleaseTargets {
    Batcher,
    Node,
    Contracts,
    Proposer,
    Geth,
    All,
}

// implementations ================================================

impl ReleaseCommand {
    pub fn new() -> Self {
        Self {
            version_control: Box::new(GitVersionControl::new()),
            dialoguer: Dialoguer::new(),
            system_requirements_checker: SystemRequirementsChecker::new(),
            artifacts_releaser: Arc::new(ArtifactReleaserService::new(DockerReleaseRepository::new())),
        }
    }

    pub fn run(&self, target: ReleaseTargets) -> Result<(), Box<dyn std::error::Error>> {
        self.system_requirements_checker
            .check(vec![GIT_REQUIREMENT, DOCKER_REQUIREMENT])?;

        let project = Project::try_from(std::env::current_dir()?)?;
        let config = CoreConfig::new_from_toml(&project.config).unwrap();

        // request release name and repository
        print_info("We'll tag your local builds and push them to your registry.");
        print_warning("Make sure your docker user has push permissions to the registry");

        let registry_url: String = self
            .dialoguer
            .prompt("Input Docker registry url (e.g. dockerhub.io/wakeuplabs) ");
        let release_name: String = self.dialoguer.prompt("Input release name (e.g. v0.1.0)");

        // Offer option to tag release in git
        if self
            .dialoguer
            .confirm("Would you also like to tag your local git repository?")
        {
            self.version_control.tag(&project.root, &release_name)?;
        }

        // Iterate over the artifacts and release =========================

        // assemble list of artifacts to build
        let artifacts = match target {
            ReleaseTargets::All => ArtifactFactory::get_all(&project, &config),
            ReleaseTargets::Batcher => vec![ArtifactFactory::get(
                &ArtifactKind::Batcher,
                &project,
                &config,
            )],
            ReleaseTargets::Node => vec![ArtifactFactory::get(&ArtifactKind::Node, &project, &config)],
            ReleaseTargets::Contracts => vec![ArtifactFactory::get(
                &ArtifactKind::Contracts,
                &project,
                &config,
            )],
            ReleaseTargets::Proposer => vec![ArtifactFactory::get(
                &ArtifactKind::Proposer,
                &project,
                &config,
            )],
            ReleaseTargets::Geth => vec![ArtifactFactory::get(&ArtifactKind::Geth, &project, &config)],
        };

        let started = Instant::now();
        let release_spinner = style_spinner(
            ProgressBar::new_spinner(),
            &format!(
                "⏳ Releasing {}...",
                artifacts
                    .iter()
                    .map(|e| e.to_string())
                    .collect::<Vec<_>>()
                    .join(", ")
            ),
        );

        let handles: Vec<_> = artifacts
            .iter()
            .map(|&ref artifact| {
                let release_name = release_name.clone();
                let registry_url = registry_url.clone();
                let artifact = Arc::clone(artifact);
                let artifacts_releaser = Arc::clone(&self.artifacts_releaser);

                thread::spawn(move || -> Result<(), String> {
                    match artifacts_releaser.release(&artifact, &release_name, &registry_url) {
                        Ok(_) => {}
                        Err(e) => {
                            print_error(&format!("❌ Error releasing {}", artifact));
                            return Err(e.to_string());
                        }
                    }
                    Ok(())
                })
            })
            .collect();

        // wait for all threads to complete
        for handle in handles {
            match handle.join() {
                Ok(Ok(_)) => {}
                Ok(Err(e)) => return Err(Box::new(std::io::Error::new(std::io::ErrorKind::Other, e))),
                Err(_) => {
                    return Err(Box::new(std::io::Error::new(
                        std::io::ErrorKind::Other,
                        "Thread panicked",
                    )))
                }
            }
        }

        release_spinner.finish_with_message(format!(
            "✔️ Released in {}",
            HumanDuration(started.elapsed())
        ));

        // print instructions  =========================

        println!(
            "\n{title}\n\n\
            - {bin} {dev_cmd}\n\
            \tTry your artifacts locally without spending any resources.\n\n\
            - {bin} {deploy_cmd}\n\
            \tUse your artifacts to create contracts deployments or whole infra.\n",
            title = "What's Next?".bright_white().bold(),
            bin = env!("CARGO_BIN_NAME").blue(),
            dev_cmd = "dev".blue(),
            deploy_cmd = "deploy [contracts|infra|all] --name <deployment_name>".blue()
        );

        Ok(())
    }
}
