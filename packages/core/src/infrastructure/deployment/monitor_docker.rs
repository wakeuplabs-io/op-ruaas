use std::{collections::HashMap, vec};

use crate::domain::{
    self, Deployment, DeploymentMonitorOptions, MonitorKind, Project, Release, ReleaseRunnerOptions,
    TDeploymentMonitorRunner,
};

pub struct DockerMonitorRunner {
    release_repository: Box<dyn domain::release::TReleaseRepository>,
    release_runner: Box<dyn domain::release::TReleaseRunner>,
}

const CONTAINER_NAME: &str = "op-monitor";

// implementations ===================================================

impl DockerMonitorRunner {
    pub fn new(
        release_repository: Box<dyn domain::release::TReleaseRepository>,
        release_runner: Box<dyn domain::release::TReleaseRunner>,
    ) -> Self {
        Self {
            release_repository,
            release_runner,
        }
    }
}

#[async_trait::async_trait]
impl TDeploymentMonitorRunner for DockerMonitorRunner {
    async fn run(
        &self,
        project: &Project,
        deployment: &Deployment,
        opts: &DeploymentMonitorOptions,
    ) -> Result<(), Box<dyn std::error::Error>> {
        let (cmd, monitor_release) = match opts.kind {
            MonitorKind::Balances
            | MonitorKind::Multisig
            | MonitorKind::Drippie
            | MonitorKind::Fault
            | MonitorKind::GlobalEvents
            | MonitorKind::LivenessExpiration
            | MonitorKind::Secrets
            | MonitorKind::Withdrawals => (
                "/usr/local/bin/monitorism",
                Release {
                    artifact_name: "op-monitorism".to_string(),
                    artifact_tag: "latest".to_string(),
                    registry_url: "us-docker.pkg.dev/oplabs-tools-artifacts/images".to_string(),
                },
            ),
            MonitorKind::Dispute => (
                "/usr/local/bin/op-dispute-mon",
                Release {
                    artifact_name: "op-dispute-mon".to_string(),
                    artifact_tag: "latest".to_string(),
                    registry_url: "us-docker.pkg.dev/oplabs-tools-artifacts/images".to_string(),
                },
            ),
        };

        let l1_rpc = match deployment.id.as_str() {
            "dev" => "http://host.docker.internal:8545".to_string(),
            _ => deployment
                .network_config
                .l1_rpc_url
                .clone()
                .ok_or("L1 RPC URL is required")?,
        };

        let l2_rpc = match deployment.id.as_str() {
            "dev" => "http://host.docker.internal".to_string(),
            _ => format!(
                "{}/rpc",
                deployment
                    .infra_base_url
                    .as_ref()
                    .ok_or("Infra base URL is required")?
            ),
        };

        let deployment_addresses: serde_json::Value =
            serde_json::from_str(&deployment.contracts_addresses.clone().unwrap()).unwrap();

        // prefills
        let args: Vec<String> = match opts.kind {
            MonitorKind::Balances => vec!["balances".to_string(), "--node.url".to_string(), l1_rpc],
            MonitorKind::Drippie => vec!["drippie".to_string(), "--l1.node.url".to_string(), l1_rpc],
            MonitorKind::Fault => vec![
                "fault".to_string(),
                "--l1.node.url".to_string(),
                l1_rpc,
                "--l2.node.url".to_string(),
                l2_rpc,
                "--optimismportal.address".to_string(),
                deployment_addresses["OptimismPortal"].to_string(),
            ],
            MonitorKind::LivenessExpiration => vec![
                "liveness_expiration".to_string(),
                "--l1.node.url".to_string(),
                l1_rpc,
                "--safe.address".to_string(),
                deployment_addresses["SystemOwnerSafe"].to_string(),
            ],
            MonitorKind::GlobalEvents => vec![
                "global_events".to_string(),
                "--l1.node.url".to_string(),
                l1_rpc,
            ],
            MonitorKind::Secrets => vec!["secrets".to_string(), "--l1.node.url".to_string(), l1_rpc],
            MonitorKind::Withdrawals => vec![
                "withdrawals".to_string(),
                "--l1.node.url".to_string(),
                l1_rpc,
                "--l2.node.url".to_string(),
                l2_rpc,
                "--optimismportal.address".to_string(),
                deployment_addresses["OptimismPortal"].to_string(),
            ],
            MonitorKind::Multisig => vec![
                "multisig".to_string(),
                "--optimismportal.address".to_string(),
                deployment_addresses["OptimismPortal"].to_string(),
                "--safe.address".to_string(),
                deployment_addresses["SystemOwnerSafe"].to_string(),
            ],
            MonitorKind::Dispute => vec![
                "dispute".to_string(),
                "--l1-eth-rpc".to_string(),
                l1_rpc,
                "--rollup-rpc".to_string(),
                l2_rpc,
                "--game-factory-address".to_string(),
                deployment_addresses["DisputeGameFactory"].to_string(),
            ],
        };

        // ensure release is available locally for run and run it to generate contracts
        self.release_repository.pull(&monitor_release)?;
        self.release_runner.run(
            &monitor_release,
            ReleaseRunnerOptions {
                volume: &project.root,
                env: HashMap::new(),
                args: [vec![cmd.to_string()], args, opts.args.clone()].concat(),
                container_name: CONTAINER_NAME.to_string(),
            },
        )?;

        Ok(())
    }

    fn stop(&self) -> Result<(), Box<dyn std::error::Error>> {
        self.release_runner.stop(CONTAINER_NAME)?;

        Ok(())
    }
}
