mod commands;
mod config;
mod infrastructure;
mod lib;

use clap::{Parser, Subcommand};
use colored::Colorize;
use commands::{
    build::BuildTargets,
    deploy::{DeployDeploymentKind, DeployTarget},
    init::InitTargets,
    inspect::InspectTarget,
    monitor::{MonitorKind, MonitorTarget},
    release::ReleaseTargets,
    start::StartDeploymentKind,
    BuildCommand, DeployCommand, InitCommand, InspectCommand, MonitorCommand, NewCommand, ReleaseCommand, StartCommand,
};
use dotenv::dotenv;
use infrastructure::console::print_error;
use log::{Level, LevelFilter};

#[derive(Parser)]
#[clap(name = "opruaas")]
#[clap(version = "0.1.7")]
#[clap(about = "Easily deploy and manage rollups with the Optimism stack.", long_about = None)]
struct Args {
    #[command(subcommand)]
    cmd: Commands,

    /// Suppress logging output
    #[arg(short, long, default_value_t = false)]
    verbose: bool,
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
    Start {
        #[arg(value_enum, default_value_t = StartDeploymentKind::Sequencer)]
        kind: StartDeploymentKind,

        #[arg(value_enum, default_value = "http://host.docker.internal:80/rpc")]
        sequencer_url: String,

        #[arg(long, help = "Path to a custom helm values file")]
        values: Option<String>,

        #[arg(long, help = "Run infra for a particular contracts deployment")]
        contracts_deployment_id: Option<String>,

        #[arg(
            long,
            default_value_t = false,
            help = "Weather to use default releases or not"
        )]
        default: bool,
        // TODO: values file
    },
    /// Deploy your blockchain. Target must be one of: contracts, infra, all
    Deploy {
        target: DeployTarget,

        #[arg(value_enum, default_value_t = DeployDeploymentKind::Sequencer)]
        kind: DeployDeploymentKind,

        #[arg(long)]
        deployment_id: String,

        #[arg(long)]
        deployment_name: String,

        #[arg(long, default_value_t = false)]
        deploy_deterministic_deployer: bool,

        #[arg(long, default_value = "")]
        sequencer_url: String,

        #[arg(long, default_value = "gp2")]
        storage_class_name: String,

        #[arg(long, default_value = "opruaas")]
        deployment_release_tag: String,

        #[arg(long, default_value = "opruaas")]
        deployment_release_namespace: String,

        #[arg(long, help = "Path to a custom helm values file")]
        values: Option<String>,
    },
    /// Get details about the current deployment. Target must be one of: contracts, infra
    Inspect {
        target: InspectTarget,

        #[arg(long)]
        deployment_id: String,
    },
    /// Monitor your chain. Target must be one of: onchain, offchain
    Monitor {
        target: MonitorTarget,

        #[arg(long)]
        deployment_id: String,

        #[arg(
            long,
            help = "Monitoring kind to run. Available: multisig, fault, withdrawals, balances, drippie, secrets, global_events, liveness_expiration, faultproof_withdrawals, dispute"
        )]
        kind: Option<MonitorKind>,

        #[arg(trailing_var_arg = true)]
        args: Option<Vec<String>>,
    },
}

pub struct AppContext {
    pub user_id: Option<String>,
}

#[tokio::main]
async fn main() {
    dotenv().ok();

    let args = Args::parse();

    let log_level = if args.verbose {
        LevelFilter::Debug
    } else {
        LevelFilter::Off
    };

    env_logger::Builder::from_default_env()
        .filter_level(log::LevelFilter::Off) // Turn off all logs by default
        .format(|f, record| {
            use std::io::Write;
            let target = record.target();
            let level = match record.level() {
                Level::Trace => "TRACE".red().to_string(),
                Level::Debug => "DEBUG".blue().to_string(),
                Level::Info => "INFO".green().to_string(),
                Level::Warn => "WARN".yellow().to_string(),
                Level::Error => "ERROR".red().to_string(),
            };
            writeln!(f, " {} {} > {}", level, target.bold(), record.args())
        })
        .filter_module("main", log_level)
        .filter_module("opraas_core", log_level)
        .init();

    let ctx = AppContext {
        user_id: Some("root".into()),
    };

    // run commands
    if let Err(e) = match args.cmd {
        Commands::New { name } => NewCommand::new().run(&ctx, &name),
        Commands::Init { target } => InitCommand::new().run(&ctx, &target),
        Commands::Build { target } => BuildCommand::new().run(&ctx, &target),
        Commands::Release { target } => ReleaseCommand::new().run(&ctx, target),
        Commands::Start {
            default,
            kind,
            contracts_deployment_id,
            sequencer_url,
            values,
        } => {
            StartCommand::new()
                .run(
                    &ctx,
                    kind,
                    contracts_deployment_id,
                    &sequencer_url,
                    default,
                    values,
                )
                .await
        }
        Commands::Deploy {
            target,
            deployment_id,
            deployment_name,
            deployment_release_tag,
            deployment_release_namespace,
            deploy_deterministic_deployer,
            kind,
            sequencer_url,
            storage_class_name,
            values,
        } => {
            DeployCommand::new()
                .run(
                    &ctx,
                    &target,
                    &deployment_id,
                    &deployment_name,
                    &deployment_release_tag,
                    &deployment_release_namespace,
                    deploy_deterministic_deployer,
                    kind,
                    &sequencer_url,
                    &storage_class_name,
                    values,
                )
                .await
        }
        Commands::Inspect {
            target,
            deployment_id,
        } => {
            InspectCommand::new()
                .run(&ctx, &target, &deployment_id)
                .await
        }
        Commands::Monitor {
            target,
            deployment_id,
            kind,
            args,
        } => {
            MonitorCommand::new()
                .run(&ctx, &target, &deployment_id, kind, args)
                .await
        }
    } {
        print_error(&format!("\n\nError: {}\n\n", e));
        std::process::exit(1);
    }
}
