use crate::config::{SystemRequirementsChecker, TSystemRequirementsChecker, GIT_REQUIREMENT};
use crate::infrastructure::console::{print_error, style_spinner};
use crate::AppContext;
use clap::ValueEnum;
use colored::*;
use indicatif::{HumanDuration, ProgressBar};
use opraas_core::application::initialize::ArtifactInitializer;
use opraas_core::config::CoreConfig;
use opraas_core::domain::{ArtifactFactory, ArtifactKind, Project};
use opraas_core::infrastructure::artifact::GitArtifactSourceRepository;
use std::{sync::Arc, thread, time::Instant};

#[derive(Debug, Clone, ValueEnum)]
pub enum InitTargets {
    Batcher,
    Node,
    Contracts,
    Proposer,
    Geth,
    All,
}

pub struct InitCommand {
    system_requirement_checker: SystemRequirementsChecker,
    artifact_initializer: Arc<ArtifactInitializer<GitArtifactSourceRepository>>,
}

impl InitCommand {
    pub fn new() -> Self {
        Self {
            system_requirement_checker: SystemRequirementsChecker::new(),
            artifact_initializer: Arc::new(ArtifactInitializer::new(GitArtifactSourceRepository::new())),
        }
    }

    pub fn run(&self, _ctx: &AppContext, target: &InitTargets) -> Result<(), Box<dyn std::error::Error>> {
        self.system_requirement_checker
            .check(vec![GIT_REQUIREMENT])?;

        let project = Project::try_from(std::env::current_dir()?)?;
        let config = CoreConfig::new_from_toml(&project.config).unwrap();

        // assemble list of artifacts to build
        let artifacts = match target {
            InitTargets::All => ArtifactFactory::get_all(&project, &config),
            InitTargets::Batcher => vec![ArtifactFactory::get(
                &ArtifactKind::Batcher,
                &project,
                &config,
            )],
            InitTargets::Node => vec![ArtifactFactory::get(&ArtifactKind::Node, &project, &config)],
            InitTargets::Contracts => vec![ArtifactFactory::get(
                &ArtifactKind::Contracts,
                &project,
                &config,
            )],
            InitTargets::Proposer => vec![ArtifactFactory::get(
                &ArtifactKind::Proposer,
                &project,
                &config,
            )],
            InitTargets::Geth => vec![ArtifactFactory::get(&ArtifactKind::Geth, &project, &config)],
        };

        // start timer and spinner
        let started = Instant::now();
        let init_spinner = style_spinner(
            ProgressBar::new_spinner(),
            &format!(
                "⏳ Initializing {}...",
                artifacts
                    .iter()
                    .map(|e| e.to_string())
                    .collect::<Vec<_>>()
                    .join(", ")
            ),
        );

        // iterate over the artifacts and download
        let handles: Vec<_> = artifacts
            .iter()
            .map(|artifact| {
                let artifact = Arc::new(artifact.clone());
                let artifact_initializer = Arc::clone(&self.artifact_initializer);

                thread::spawn(move || {
                    match artifact_initializer.initialize(&artifact) {
                        Ok(_) => {}
                        Err(e) => {
                            print_error(&format!("❌ Error initializing {}", artifact));
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

        init_spinner.finish_with_message(format!("Done in {}", HumanDuration(started.elapsed())));

        // print instructions ========================================

        println!(
            "\n{title}\n\n\
            - {bin} {build_cmd}\n\
            \tBuilds docker images from artifacts.\n\n\
            - {bin} {release_cmd}\n\
            \tPublishes docker images to be used in dev or prod.\n\n\
            - {bin} {dev_cmd}\n\
            \tRuns a local dev environment.\n\n\
            - {bin} {deploy_cmd}\n\
            \tDeploys contracts to l1 and infra to kubernetes through terraform.\n",
            title = "What's Next?".bright_white().bold(),
            bin = env!("CARGO_BIN_NAME").blue(),
            build_cmd = "build [contracts|node|etc...]".blue(),
            release_cmd = "release [contracts|node|etc...]".blue(),
            dev_cmd = "dev".blue(),
            deploy_cmd = "deploy [contracts|infra|all] --name <deployment_name>".blue()
        );

        Ok(())
    }
}
