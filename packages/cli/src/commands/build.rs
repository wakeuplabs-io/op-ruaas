use crate::{
    config::{SystemRequirementsChecker, TSystemRequirementsChecker, DOCKER_REQUIREMENT, GIT_REQUIREMENT},
    infrastructure::console::{print_error, style_spinner},
    lib::join_threads,
    AppContext,
};
use colored::*;
use indicatif::{HumanDuration, ProgressBar};
use opraas_core::{
    application::build::ArtifactBuilderService,
    config::CoreConfig,
    domain::{ArtifactFactory, ArtifactKind, Project},
    infrastructure::artifact::{DockerArtifactRepository, GitArtifactSourceRepository},
};
use std::{sync::Arc, thread, time::Instant};

#[derive(Debug, Clone, clap::ValueEnum)]
pub enum BuildTargets {
    Batcher,
    Node,
    Contracts,
    Proposer,
    Geth,
    All,
}

pub struct BuildCommand {
    artifacts_builder: Arc<ArtifactBuilderService<DockerArtifactRepository, GitArtifactSourceRepository>>,
    system_requirements_checker: SystemRequirementsChecker,
}

impl BuildCommand {
    pub fn new() -> Self {
        Self {
            artifacts_builder: Arc::new(ArtifactBuilderService::new(
                DockerArtifactRepository::new(),
                GitArtifactSourceRepository::new(),
            )),
            system_requirements_checker: SystemRequirementsChecker::new(),
        }
    }

    pub fn run(&self, _ctx: &AppContext, target: &BuildTargets) -> Result<(), Box<dyn std::error::Error>> {
        self.system_requirements_checker
            .check(vec![GIT_REQUIREMENT, DOCKER_REQUIREMENT])?;

        let project = Project::try_from(std::env::current_dir()?)?;
        let config = CoreConfig::new_from_toml(&project.config).expect("Invalid project configuration");

        // assemble list of artifacts to build
        let artifacts = match target {
            BuildTargets::All => ArtifactFactory::get_all(&project, &config),
            BuildTargets::Batcher => vec![ArtifactFactory::get(
                &ArtifactKind::Batcher,
                &project,
                &config,
            )],
            BuildTargets::Node => vec![ArtifactFactory::get(&ArtifactKind::Node, &project, &config)],
            BuildTargets::Contracts => vec![ArtifactFactory::get(
                &ArtifactKind::Contracts,
                &project,
                &config,
            )],
            BuildTargets::Proposer => vec![ArtifactFactory::get(
                &ArtifactKind::Proposer,
                &project,
                &config,
            )],
            BuildTargets::Geth => vec![ArtifactFactory::get(&ArtifactKind::Geth, &project, &config)],
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
        join_threads(
            artifacts
                .iter()
                .map(|artifact| {
                    let artifact = Arc::clone(artifact); // Clone the Arc for thread ownership
                    let builder_service = Arc::clone(&self.artifacts_builder);

                    thread::spawn(move || -> Result<(), String> {
                        builder_service.build(&artifact).map_err(|e| {
                            print_error(&format!("❌ Error building {}", artifact));
                            e.to_string()
                        })?;

                        Ok(())
                    })
                })
                .collect(),
        )?;

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
