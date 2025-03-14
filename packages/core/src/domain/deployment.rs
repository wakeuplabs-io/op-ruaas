use super::Project;
use crate::config::{AccountsConfig, NetworkConfig};
use serde::{Deserialize, Serialize};
use std::error::Error;
use url::Url;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Deployment {
    pub id: String,
    pub name: String, // holensky, sepolia, mumbai, etc
    pub owner_id: String,
    pub release_tag: String,
    pub release_registry: String,
    pub infra_base_url: Option<String>,
    pub contracts_addresses: Option<String>,
    pub network_config: NetworkConfig,
    pub accounts_config: AccountsConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeploymentOptions {
    pub host: String,
    pub kind: DeploymentKind,
    pub monitoring: bool,
    pub explorer: bool,
    pub release_tag: String,
    pub release_namespace: String,
    pub storage_class_name: String,
    pub sequencer_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeploymentMonitorOptions {
    pub kind: MonitorKind,
    pub args: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum MonitorKind {
    Multisig,
    Fault,
    Withdrawals,
    Drippie,
    Secrets,
    GlobalEvents,
    LivenessExpiration,
    Balances,
    Dispute,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum DeploymentKind {
    Sequencer,
    Replica,
}

pub type DeploymentArtifact = Vec<u8>;

#[async_trait::async_trait]
pub trait TDeploymentRepository: Send + Sync {
    async fn find_by_id(&self, id: &str) -> Result<Option<Deployment>, Box<dyn std::error::Error>>;
    async fn find_by_owner(&self, owner_id: &str) -> Result<Vec<Deployment>, Box<dyn std::error::Error>>;
    async fn save(&self, deployment: &Deployment) -> Result<(), Box<dyn std::error::Error>>;
    async fn delete(&self, deployment: &Deployment) -> Result<(), Box<dyn std::error::Error>>;
}

#[async_trait::async_trait]
pub trait TDeploymentArtifactsRepository: Send + Sync {
    async fn find_one(&self, deployment: &Deployment) -> Result<Option<DeploymentArtifact>, Box<dyn Error>>;
    async fn exists(&self, deployment: &Deployment) -> Result<bool, Box<dyn Error>>;
    async fn save(&self, deployment: &Deployment, artifact: DeploymentArtifact) -> Result<(), Box<dyn Error>>;
    async fn delete(&self, deployment: &Deployment) -> Result<(), Box<dyn Error>>;
}

#[async_trait::async_trait]
pub trait TInfraDeployerProvider: Send + Sync {
    async fn deploy(
        &self,
        project: &Project,
        deployment: &mut Deployment,
        opts: &DeploymentOptions,
    ) -> Result<(), Box<dyn std::error::Error>>;
}

pub trait TContractsDeployerProvider: Send + Sync {
    fn deploy(
        &self,
        project: &Project,
        deployment: &mut Deployment,
        deploy_deterministic_deployer: bool,
        slow: bool,
    ) -> Result<Vec<u8>, Box<dyn std::error::Error>>; // DeploymentArtifact
}

#[async_trait::async_trait]
pub trait TDeploymentRunner {
    async fn run(
        &self,
        project: &Project,
        deployment: &Deployment,
        opts: &DeploymentOptions,
    ) -> Result<(), Box<dyn std::error::Error>>;
    fn stop(&self, release_tag: &str, release_namespace: &str) -> Result<(), Box<dyn std::error::Error>>;
}

#[async_trait::async_trait]
pub trait TDeploymentMonitorRunner {
    async fn run(
        &self,
        project: &Project,
        deployment: &Deployment,
        opts: &DeploymentMonitorOptions,
    ) -> Result<(), Box<dyn std::error::Error>>;
    fn stop(&self) -> Result<(), Box<dyn std::error::Error>>;
}

// implementations ========================================================

impl Deployment {
    pub fn new<T>(
        id: T,
        name: T,
        owner_id: T,
        release_tag: T,
        release_registry: T,
        network_config: NetworkConfig,
        accounts_config: AccountsConfig,
    ) -> Result<Self, Box<dyn std::error::Error>>
    where
        T: Into<String>,
    {
        Ok(Self {
            id: id.into(),
            name: name.into(),
            owner_id: owner_id.into(),
            release_tag: release_tag.into(),
            release_registry: release_registry.into(),
            network_config,
            accounts_config,
            contracts_addresses: None,
            infra_base_url: None,
        })
    }

    pub fn build_deploy_config(&self) -> Result<String, Box<dyn std::error::Error>> {
        let json = format!(
            r#"{{
                "l1ChainID": {l1_chain_id},
                "l2ChainID": {l2_chain_id}, 
                "p2pSequencerAddress": "{p2p_sequencer_address}",
                "batchInboxAddress": "{batch_inbox_address}",
                "batchSenderAddress": "{batch_sender_address}",
                "l2OutputOracleProposer": "{l1_output_oracle_proposer}",
                "l2OutputOracleChallenger": "{l2_output_oracle_challenger}",
                "proxyAdminOwner": "{proxy_admin_owner}",
                "finalSystemOwner": "{final_system_owner}",
                "baseFeeVaultRecipient": "{base_fee_vault_recipient}",
                "l1FeeVaultRecipient": "{l1_fee_vault_recipient}",
                "sequencerFeeVaultRecipient": "{sequencer_fee_vault_recipient}",
                "governanceTokenOwner": "{governance_token_owner}",
                "enableGovernance": {enable_governance},
                "governanceTokenSymbol": "{governance_token_symbol}",
                "governanceTokenName": "{governance_token_name}",
                "preimageOracleMinProposalSize": {preimage_oracle_min_proposal_size},
                "preimageOracleChallengePeriod": {preimage_oracle_challenge_period},
                "l2BlockTime": {l2_block_time},
                "maxSequencerDrift": {max_sequencer_drift},
                "sequencerWindowSize": {sequencer_window_size},
                "channelTimeout": {channel_timeout},
                "finalizationPeriodSeconds": {finalization_period_seconds},
                "l2OutputOracleSubmissionInterval": {l2_output_oracle_submission_interval},
                "l2OutputOracleStartingBlockNumber": {l2_output_oracle_starting_block_number},
                "l2GenesisBlockGasLimit": "{l2_genesis_block_gas_limit}",
                "faultGameClockExtension": {fault_game_clock_extension},
                "faultGameMaxClockDuration": {fault_game_max_clock_duration},
                "faultGameGenesisBlock": {fault_game_genesis_block},
                "faultGameGenesisOutputRoot": "{fault_game_genesis_output_root}",
                "faultGameSplitDepth": {fault_game_split_depth},
                "faultGameWithdrawalDelay": {fault_game_withdrawal_delay},
                "baseFeeVaultMinimumWithdrawalAmount": "{base_fee_vault_minimum_withdrawal_amount}",
                "l1FeeVaultMinimumWithdrawalAmount": "{l1_fee_vault_minimum_withdrawal_amount}",
                "sequencerFeeVaultMinimumWithdrawalAmount": "{sequencer_fee_vault_minimum_withdrawal_amount}",
                "baseFeeVaultWithdrawalNetwork": {base_fee_vault_withdrawal_network},
                "l1FeeVaultWithdrawalNetwork": {l1_fee_vault_withdrawal_network},
                "sequencerFeeVaultWithdrawalNetwork": {sequencer_fee_vault_withdrawal_network},
                "fundDevAccounts": {fund_dev_accounts},
                "l2GenesisBlockBaseFeePerGas": "{l2_genesis_block_base_fee_per_gas}",
                "gasPriceOracleOverhead": {gas_price_oracle_overhead},
                "gasPriceOracleScalar": {gas_price_oracle_scalar},
                "eip1559Denominator": {eip1559_denominator},
                "eip1559DenominatorCanyon": {eip1559_denominator_canyon},
                "eip1559Elasticity": {eip1559_elasticity},
                "l2GenesisRegolithTimeOffset": "{l2_genesis_regolith_time_offset}",
                "l2GenesisCanyonTimeOffset": "{l2_genesis_canyon_time_offset}",
                "faultGameAbsolutePrestate": "{fault_game_absolute_prestate}",
                "faultGameMaxDepth": {fault_game_max_depth},
                "systemConfigStartBlock": {system_config_start_block},
                "requiredProtocolVersion": "{required_protocol_version}",
                "recommendedProtocolVersion": "{recommended_protocol_version}",
                "l1StartingBlockTag": "Override",
                "l2OutputOracleStartingTimestamp": -1,
                "l1UseClique": {l1_use_clique},
                "cliqueSignerAddress": "{clique_signer_address}",
                "l1GenesisBlockTimestamp": "Override",
                "l1BlockTime": {l1_block_time},
                "superchainConfigGuardian": "{superchain_config_guardian}"
            }}"#,
            l1_chain_id = self.network_config.l1_chain_id,
            l2_chain_id = self.network_config.l2_chain_id,
            p2p_sequencer_address = self.accounts_config.sequencer_address,
            batch_inbox_address = self.network_config.batch_inbox_address,
            batch_sender_address = self.accounts_config.batcher_address,
            l1_output_oracle_proposer = self.accounts_config.proposer_address,
            l2_output_oracle_challenger = self.accounts_config.challenger_address,
            proxy_admin_owner = self.accounts_config.admin_address,
            final_system_owner = self.accounts_config.admin_address,
            base_fee_vault_recipient = self.accounts_config.admin_address,
            l1_fee_vault_recipient = self.accounts_config.admin_address,
            sequencer_fee_vault_recipient = self.accounts_config.admin_address,
            governance_token_owner = self.accounts_config.admin_address,
            enable_governance = self.network_config.enable_governance,
            governance_token_symbol = self.network_config.governance_token_symbol,
            governance_token_name = self.network_config.governance_token_name,
            preimage_oracle_min_proposal_size = self.network_config.preimage_oracle_min_proposal_size,
            preimage_oracle_challenge_period = self.network_config.preimage_oracle_challenge_period,
            l2_block_time = self.network_config.l2_block_time,
            max_sequencer_drift = self.network_config.max_sequencer_drift,
            sequencer_window_size = self.network_config.sequencer_window_size,
            channel_timeout = self.network_config.channel_timeout,
            finalization_period_seconds = self.network_config.finalization_period_seconds,
            l2_output_oracle_submission_interval = self.network_config.l2_output_oracle_submission_interval,
            l2_output_oracle_starting_block_number = self.network_config.l2_output_oracle_starting_block_number,
            l2_genesis_block_gas_limit = self.network_config.l2_genesis_block_gas_limit,
            fault_game_clock_extension = self.network_config.fault_game_clock_extension,
            fault_game_max_clock_duration = self.network_config.fault_game_max_clock_duration,
            fault_game_genesis_block = self.network_config.fault_game_genesis_block,
            fault_game_genesis_output_root = self.network_config.fault_game_genesis_output_root,
            fault_game_split_depth = self.network_config.fault_game_split_depth,
            fault_game_withdrawal_delay = self.network_config.fault_game_withdrawal_delay,
            base_fee_vault_minimum_withdrawal_amount = self.network_config.base_fee_vault_minimum_withdrawal_amount,
            l1_fee_vault_minimum_withdrawal_amount = self.network_config.l1_fee_vault_minimum_withdrawal_amount,
            sequencer_fee_vault_minimum_withdrawal_amount = self
                .network_config
                .sequencer_fee_vault_minimum_withdrawal_amount,
            base_fee_vault_withdrawal_network = self.network_config.base_fee_vault_withdrawal_network,
            l1_fee_vault_withdrawal_network = self.network_config.l1_fee_vault_withdrawal_network,
            sequencer_fee_vault_withdrawal_network = self.network_config.sequencer_fee_vault_withdrawal_network,
            fund_dev_accounts = self.network_config.fund_dev_accounts,
            l2_genesis_block_base_fee_per_gas = self.network_config.l2_genesis_block_base_fee_per_gas,
            gas_price_oracle_overhead = self.network_config.gas_price_oracle_overhead,
            gas_price_oracle_scalar = self.network_config.gas_price_oracle_scalar,
            eip1559_denominator = self.network_config.eip1559_denominator,
            eip1559_denominator_canyon = self.network_config.eip1559_denominator_canyon,
            eip1559_elasticity = self.network_config.eip1559_elasticity,
            l2_genesis_regolith_time_offset = self.network_config.l2_genesis_regolith_time_offset,
            l2_genesis_canyon_time_offset = self.network_config.l2_genesis_canyon_time_offset,
            fault_game_absolute_prestate = self.network_config.fault_game_absolute_prestate,
            fault_game_max_depth = self.network_config.fault_game_max_depth,
            system_config_start_block = self.network_config.system_config_start_block,
            required_protocol_version = self.network_config.required_protocol_version,
            recommended_protocol_version = self.network_config.recommended_protocol_version,
            l1_use_clique = self.network_config.l1_use_clique,
            clique_signer_address = self.accounts_config.admin_address,
            l1_block_time = self.network_config.l1_block_time,
            superchain_config_guardian = self.accounts_config.admin_address,
        );

        Ok(json)
    }

    pub fn build_sequencer_values_yaml(&self, opts: &DeploymentOptions) -> Result<String, Box<dyn std::error::Error>> {
        let yaml = format!(
            r#"
# NOTE: 
# This values.yaml is particularly crafter for use with the opruaas CLI.
# In any other case you'll need to properly place files and values.

# global configs ===============================================================

global:
  hosts: 
    - host.docker.internal
    - {host}
  protocol: http
  email: email@email.com
  storageClassName: "{storage_class_name}"
  image:
    pullPolicy: IfNotPresent

chain:
  id: "{l2_chain_id}" 
  l1Rpc: "{l1_rpc_url}"
  artifacts: ".tmp/artifacts.zip"
  addresses: ".tmp/addresses.json"

wallets:
  batcher: {batcher_private_key}
  proposer: {proposer_private_key}

# core ===============================================================

geth:
  name: op-geth
  image:
    repository: wakeuplabs/op-geth
    tag: v0.0.4
  ports:
    rpcHttp: 8545 
    rpcWs: 8546
    rpcAuth: 9551
    metrics: 7300
    p2p: 30313
  datadir: /app/data/datadir/data
  storage:
    sequencer: 5Gi
    replica: 5Gi

node:
  name: op-node
  image:
    repository: wakeuplabs/op-node
    tag: v0.0.4
  ports:
    rpc: 7545
    p2p: 9222
    metrics: 7300

batcher:
  name: op-batcher
  image:
    repository: wakeuplabs/op-batcher
    tag: v0.0.4
  ports:
    rpc: 6545 
    metrics: 7300

proposer:
  name: op-proposer
  image:
    repository: wakeuplabs/op-proposer
    tag: v0.0.4
  ports:
    rpc: 5545 
    metrics: 7300

proxyd:
  name: proxyd
  image:
    repository: us-docker.pkg.dev/oplabs-tools-artifacts/images/proxyd
    tag: latest
  port: 8080
  urls:
    http: http://proxyd-service:8080
    ws: ws://proxyd-service:8080
  ingress:
    nodePath: /rpc
  redis:
    name: proxyd-redis
    port: 6379
    image:
      repository: redis
      tag: latest

# monitoring ===============================================================

monitoring:
  enabled: {monitoring_enabled}

grafana:
  enabled: true

  adminUser: admin
  adminPassword: admin

  sidecar:
    dashboards:
      enabled: true
  
  datasources:
    datasources.yaml:
      apiVersion: 1
      datasources:
        - name: Prometheus
          type: prometheus
          access: proxy
          url: http://{{ .Release.Name }}-prometheus-server
          isDefault: true
          uid: prometheus-datasource
  ingress:
    enabled: true
    path: /monitoring(/|$)(.*)
    annotations:
      kubernetes.io/ingress.class: "nginx"
      nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
      nginx.ingress.kubernetes.io/rewrite-target: /$2
    hosts:
      - {host}

  grafana.ini:
    server:
      root_url: "%(protocol)s://%(domain)s/monitoring"  # Dynamically adapts to ingress host

prometheus:
  enabled: true
  
  alertmanager:
    enabled: false
  
  pushgateway:
    enabled: false
  
  server:
    enabled: true
    service:
      type: ClusterIP

  prometheus-node-exporter:
    enabled: false

# explorer ===============================================================

explorer:
  enabled: {explorer_enabled}

blockscout:
  postgres:
    dbName: blockscout-db
    user: user
    password: password
    image:
      repository: postgres
      tag: latest
    storage: 5Gi

blockscout-stack:
  config:
    prometheus:
      enabled: false
  blockscout:
    ingress:
      enabled: true
      className: nginx
      hostname: {host}

    env:
      CHAIN_ID: "{l2_chain_id}"
      NETWORK: "Optimism"
      ECTO_USE_SSL: "false"
      ETHEREUM_JSONRPC_VARIANT: "geth"
      ETHEREUM_JSONRPC_HTTP_URL: http://proxyd-service:8080
      ETHEREUM_JSONRPC_WS_URL: ws://proxyd-service:8080
    extraEnv:
      - name: DATABASE_URL
        valueFrom:
          secretKeyRef:
            name: blockscout-secret
            key: DATABASE_URL
            
  frontend:
    ingress:
      enabled: true
      className: nginx
      hostname: {host}
    env:
      NEXT_PUBLIC_API_PROTOCOL: http
            "#,
            l1_rpc_url = self.network_config.l1_rpc_url.as_ref().unwrap(),
            l2_chain_id = self.network_config.l2_chain_id,
            batcher_private_key = self.accounts_config.batcher_private_key.as_ref().unwrap(),
            proposer_private_key = self.accounts_config.proposer_private_key.as_ref().unwrap(),
            storage_class_name = opts.storage_class_name,
            monitoring_enabled = opts.monitoring,
            explorer_enabled = opts.explorer,
            host = opts.host,
        );

        Ok(yaml)
    }

    pub fn build_replica_values_yaml(&self, opts: &DeploymentOptions) -> Result<String, Box<dyn std::error::Error>> {
        let yaml = format!(
            r#"
# NOTE: 
# This values.yaml is particularly crafter for use with the opruaas CLI.
# In any other case you'll need to properly place files and values.

# global configs ===============================================================

global:
  hosts: 
    - {host}
  protocol: http
  email: email@email.com
  storageClassName: "{storage_class_name}"
  image:
    pullPolicy: IfNotPresent

chain:
  id: "{l2_chain_id}" 
  l1Rpc: "{l1_rpc_url}"
  artifacts: ".tmp/artifacts.zip"
  addresses: ".tmp/addresses.json"

# core ===============================================================

sequencer_url: {sequencer_url}
sequencer_host: {sequencer_host}

geth:
  name: op-geth
  image:
    repository: wakeuplabs/op-geth
    tag: v0.0.4
  ports:
    rpcHttp: 8545 
    rpcWs: 8546
    rpcAuth: 9551
    metrics: 7300
    p2p: 30313
  datadir: /app/data/datadir/data
  storage:
    sequencer: 5Gi
    replica: 5Gi

node:
  name: op-node
  image:
    repository: wakeuplabs/op-node
    tag: v0.0.4
  ports:
    rpc: 7545
    p2p: 9222
    metrics: 7300

batcher:
  name: op-batcher
  image:
    repository: wakeuplabs/op-batcher
    tag: v0.0.4
  ports:
    rpc: 6545 
    metrics: 7300

proposer:
  name: op-proposer
  image:
    repository: wakeuplabs/op-proposer
    tag: v0.0.4
  ports:
    rpc: 5545 
    metrics: 7300

proxyd:
  name: proxyd
  image:
    repository: us-docker.pkg.dev/oplabs-tools-artifacts/images/proxyd
    tag: latest
  port: 8080
  urls:
    http: http://proxyd-service:8080
    ws: ws://proxyd-service:8080
  ingress:
    nodePath: /rpc
  redis:
    name: proxyd-redis
    port: 6379
    image:
      repository: redis
      tag: latest

# monitoring ===============================================================

monitoring:
  enabled: {monitoring_enabled}

grafana:
  enabled: true

  adminUser: admin
  adminPassword: admin

  sidecar:
    dashboards:
      enabled: true
  
  datasources:
    datasources.yaml:
      apiVersion: 1
      datasources:
        - name: Prometheus
          type: prometheus
          access: proxy
          url: http://{{ .Release.Name }}-prometheus-server
          isDefault: true
          uid: prometheus-datasource
  ingress:
    enabled: true
    path: /monitoring(/|$)(.*)
    annotations:
      kubernetes.io/ingress.class: "nginx"
      nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
      nginx.ingress.kubernetes.io/rewrite-target: /$2
    hosts:
      - {host}

  grafana.ini:
    server:
      root_url: "%(protocol)s://%(domain)s/monitoring"  # Dynamically adapts to ingress host

prometheus:
  enabled: true
  
  alertmanager:
    enabled: false
  
  pushgateway:
    enabled: false
  
  server:
    enabled: true
    service:
      type: ClusterIP

  prometheus-node-exporter:
    enabled: false

# explorer ===============================================================

explorer:
  enabled: {explorer_enabled}

blockscout:
  postgres:
    dbName: blockscout-db
    user: user
    password: password
    image:
      repository: postgres
      tag: latest
    storage: 5Gi

blockscout-stack:
  config:
    prometheus:
      enabled: false
  blockscout:
    ingress:
      enabled: true
      className: nginx
      hostname: {host}

    env:
      CHAIN_ID: "{l2_chain_id}"
      NETWORK: "Optimism"
      ECTO_USE_SSL: "false"
      ETHEREUM_JSONRPC_VARIANT: "geth"
      ETHEREUM_JSONRPC_HTTP_URL: http://proxyd-service:8080
      ETHEREUM_JSONRPC_WS_URL: ws://proxyd-service:8080
    extraEnv:
      - name: DATABASE_URL
        valueFrom:
          secretKeyRef:
            name: blockscout-secret
            key: DATABASE_URL
            
  frontend:
    ingress:
      enabled: true
      className: nginx
      hostname: {host}
    env:
      NEXT_PUBLIC_API_PROTOCOL: http
            "#,
            host = opts.host,
            l1_rpc_url = self.network_config.l1_rpc_url.as_ref().unwrap(),
            l2_chain_id = self.network_config.l2_chain_id,
            storage_class_name = opts.storage_class_name,
            monitoring_enabled = opts.monitoring,
            explorer_enabled = opts.explorer,
            sequencer_url = opts.sequencer_url.as_ref().unwrap(),
            sequencer_host = Url::parse(opts.sequencer_url.as_ref().unwrap())
                .unwrap()
                .host_str()
                .unwrap(),
        );

        Ok(yaml)
    }
}
