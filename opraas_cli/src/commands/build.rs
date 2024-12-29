use crate::{
    config::{SystemRequirementsChecker, TSystemRequirementsChecker, DOCKER_REQUIREMENT, GIT_REQUIREMENT},
    infra::console::{print_error, style_spinner},
};
use colored::*;
use indicatif::{HumanDuration, ProgressBar};
use opraas_core::{
    application::build::ArtifactBuilderService,
    config::CoreConfig,
    domain::{ArtifactFactory, ArtifactKind, ProjectFactory, TArtifactFactory, TProjectFactory},
    infra::artifact::{DockerArtifactRepository, GitArtifactSourceRepository},
};
use std::{sync::Arc, thread, time::Instant};

pub struct BuildCommand {
    artifacts_factory: Box<dyn TArtifactFactory>,
    artifacts_builder: Arc<ArtifactBuilderService<DockerArtifactRepository, GitArtifactSourceRepository>>,
    system_requirements_checker: Box<dyn TSystemRequirementsChecker>,
    project_factory: Box<dyn TProjectFactory>,
}

#[derive(Debug, Clone, clap::ValueEnum)]
pub enum BuildTargets {
    Batcher,
    Node,
    Contracts,
    Proposer,
    Geth,
    All,
}

// implementations ================================================

impl BuildCommand {
    pub fn new() -> Self {
        Self {
            artifacts_factory: Box::new(ArtifactFactory::new()),
            artifacts_builder: Arc::new(ArtifactBuilderService::new(
                DockerArtifactRepository::new(),
                GitArtifactSourceRepository::new(),
            )),
            system_requirements_checker: Box::new(SystemRequirementsChecker::new()),
            project_factory: Box::new(ProjectFactory::new()),
        }
    }

    pub fn run(&self, target: BuildTargets) -> Result<(), Box<dyn std::error::Error>> {
        self.system_requirements_checker
            .check(vec![GIT_REQUIREMENT, DOCKER_REQUIREMENT])?;

        let project = self
            .project_factory
            .from_cwd()
            .expect("No project found in current directory");
        let config = CoreConfig::new_from_toml(&project.config).expect("Invalid project configuration");

        // assemble list of artifacts to build
        let artifacts = match target {
            BuildTargets::All => self.artifacts_factory.get_all(&project, &config),
            BuildTargets::Batcher => vec![self
                .artifacts_factory
                .get(&ArtifactKind::Batcher, &project, &config)],
            BuildTargets::Node => vec![self
                .artifacts_factory
                .get(&ArtifactKind::Node, &project, &config)],
            BuildTargets::Contracts => vec![self
                .artifacts_factory
                .get(&ArtifactKind::Contracts, &project, &config)],
            BuildTargets::Proposer => vec![self
                .artifacts_factory
                .get(&ArtifactKind::Proposer, &project, &config)],
            BuildTargets::Geth => vec![self
                .artifacts_factory
                .get(&ArtifactKind::Geth, &project, &config)],
        };

        // start time count and spinner
        let started = Instant::now();
        let build_spinner = style_spinner(
            ProgressBar::new_spinner(),
            &format!(
                "⏳ Building {}...",
                artifacts
                    .iter()
                    .map(|e| e.to_string())
                    .collect::<Vec<_>>()
                    .join(", ")
            ),
        );

        // Iterate over the artifacts and build
        let handles: Vec<_> = artifacts
            .iter()
            .map(|&ref artifact| {
                let artifact = Arc::clone(artifact); // Clone the Arc for thread ownership
                let builder_service = Arc::clone(&self.artifacts_builder);

                thread::spawn(move || -> Result<(), String> {
                    match builder_service.build(&artifact) {
                        Ok(_) => {}
                        Err(e) => {
                            print_error(&format!("❌ Error building {}", artifact));
                            return Err(e.to_string());
                        }
                    }
                    Ok(())
                })
            })
            .collect();

        // Wait for all threads to complete
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

        build_spinner.finish_with_message(format!("✔️ Built in {}", HumanDuration(started.elapsed())));

        // print instructions

        println!(
            "\n{title}\n\n\
            - {bin} {release_cmd}\n\
            \tPublishes artifacts to registry for consumption in dev and deploy.\n\n\
            - {bin} {dev_cmd}\n\
            \tTry your artifacts locally without spending any resources.\n\n\
            - {bin} {deploy_cmd}\n\
            \tUse your artifacts to create contracts deployments or whole infra.\n",
            title = "What's Next?".bright_white().bold(),
            bin = env!("CARGO_BIN_NAME").blue(),
            release_cmd = "release [contracts|node|etc...]".blue(),
            dev_cmd = "dev".blue(),
            deploy_cmd = "deploy [contracts|infra|all] --name <deployment_name>".blue()
        );

        Ok(())
    }
}
