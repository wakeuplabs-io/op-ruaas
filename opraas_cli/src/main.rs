mod commands;
mod config;
mod console;
mod utils;

use build::BuildTargets;
use clap::{Parser, Subcommand};
use commands::*;
use config::{Comparison, Config, Requirement, SystemRequirementsChecker, TSystemRequirementsChecker};
use console::print_error;
use deploy::DeployTarget;
use dotenv::dotenv;
use async_trait::async_trait;
use inspect::InspectTarget;
use monitor::MonitorTarget;
use release::ReleaseTargets;
use semver::Version;
use init::InitTargets;

#[derive(Parser)]
#[command(author, version, about, long_about = None)]
struct Args {
    #[command(subcommand)]
    cmd: Commands,
}

#[derive(Subcommand, Debug, Clone)]
enum Commands {
    /// Create new project, template config file and folders
    New { name: String },
    /// Initialize a new project
    Init { target: InitTargets },
    /// Compile sources and create docker images for it
    Build { target: BuildTargets },
    /// Tags and pushes already built docker images to the registry for usage in the deployment
    Release { target: ReleaseTargets },
    /// Spin up local dev environment
    Dev {},
    /// Deploy your blockchain. Target must be one of: contracts, infra, all
    Deploy { name: String, target: DeployTarget },
    /// Get details about the current deployment. Target must be one of: contracts, infra
    Inspect { target: InspectTarget },
    /// Monitor your chain. Target must be one of: onchain, offchain
    Monitor { target: MonitorTarget },
}


#[async_trait]
pub trait Runnable {
  async fn run(&self, cfg: &crate::config::Config) -> Result<(), Box<dyn std::error::Error>>;
}

#[tokio::main]
async fn main() {
    dotenv().ok();

    // enable logging
    pretty_env_logger::init_custom_env("LOG_LEVEL");

    // Check requirements
    SystemRequirementsChecker::new().check(vec![Requirement {
        program: "docker",
        version_arg: "-v",
        required_version: Version::parse("24.0.0").unwrap(),
        required_comparator: Comparison::GreaterThanOrEqual,
    }]).unwrap_or_else(|e| {
        print_error(&format!("\n\nError: {}\n\n", e));
        std::process::exit(1);
    });

    // load config
    let config = Config::new_from_root(&std::env::current_dir().unwrap().as_path());

    // run commands
    let args = Args::parse();
    if let Err(e) =  match args.cmd {
        Commands::New { name } => NewCommand::new(name).run(&config).await,
        Commands::Init { target } => InitCommand::new(target).run(&config).await,
        Commands::Build { target } => BuildCommand::new(target).run(&config).await,
        Commands::Dev {} => DevCommand.run(&config).await,
        Commands::Release { target }  => ReleaseCommand::new(target).run(&config).await,
        Commands::Inspect { target } => InspectCommand::new(target).run(&config).await,
        Commands::Monitor { target } => MonitorCommand::new(target).run(&config).await,
        Commands::Deploy { target, name } => DeployCommand::new(target, name).run(&config).await,
    } {
        print_error(&format!("\n\nError: {}\n\n", e));
        std::process::exit(1);
    }
}

