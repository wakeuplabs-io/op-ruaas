use crate::config::{AccountsConfig, NetworkConfig};
use std::path::PathBuf;

#[derive(Debug, Clone)]
pub struct Deployment {
    pub name: String,
    pub release_name: String,
    pub registry_url: String,
    pub network_config: NetworkConfig,
    pub accounts_config: AccountsConfig,
    pub contracts_artifacts: Option<PathBuf>,
    pub infra_artifacts: Option<PathBuf>,
}

pub trait TDeploymentRepository {
    fn save(&self, deployment: &Deployment) -> Result<(), Box<dyn std::error::Error>>;
    fn find(&self, name: &str) -> Result<Option<Deployment>, Box<dyn std::error::Error>>;
}

// implementations ========================================================

impl Deployment {
    pub fn new(
        name: String,
        release_name: String,
        registry_url: String,
        network_config: NetworkConfig,
        accounts_config: AccountsConfig,
    ) -> Self {
        Self {
            name,
            release_name,
            registry_url,
            network_config,
            accounts_config,
            contracts_artifacts: None,
            infra_artifacts: None,
        }
    }

    pub fn write_contracts_config(&self, path: &PathBuf) -> Result<(), Box<dyn std::error::Error>> {
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
                "l1StartingBlockTag": "{l1_starting_block_tag}",
                "l2OutputOracleStartingTimestamp": {l2_output_oracle_starting_timestamp},
                "l1UseClique": {l1_use_clique},
                "cliqueSignerAddress": "{clique_signer_address}",
                "l1GenesisBlockTimestamp": "{l1_genesis_block_timestamp}",
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
            preimage_oracle_min_proposal_size =
                self.network_config.preimage_oracle_min_proposal_size,
            preimage_oracle_challenge_period = self.network_config.preimage_oracle_challenge_period,
            l2_block_time = self.network_config.l2_block_time,
            max_sequencer_drift = self.network_config.max_sequencer_drift,
            sequencer_window_size = self.network_config.sequencer_window_size,
            channel_timeout = self.network_config.channel_timeout,
            finalization_period_seconds = self.network_config.finalization_period_seconds,
            l2_output_oracle_submission_interval =
                self.network_config.l2_output_oracle_submission_interval,
            l2_output_oracle_starting_block_number =
                self.network_config.l2_output_oracle_starting_block_number,
            l2_genesis_block_gas_limit = self.network_config.l2_genesis_block_gas_limit,
            fault_game_clock_extension = self.network_config.fault_game_clock_extension,
            fault_game_max_clock_duration = self.network_config.fault_game_max_clock_duration,
            fault_game_genesis_block = self.network_config.fault_game_genesis_block,
            fault_game_genesis_output_root = self.network_config.fault_game_genesis_output_root,
            fault_game_split_depth = self.network_config.fault_game_split_depth,
            fault_game_withdrawal_delay = self.network_config.fault_game_withdrawal_delay,
            base_fee_vault_minimum_withdrawal_amount =
                self.network_config.base_fee_vault_minimum_withdrawal_amount,
            l1_fee_vault_minimum_withdrawal_amount =
                self.network_config.l1_fee_vault_minimum_withdrawal_amount,
            sequencer_fee_vault_minimum_withdrawal_amount = self
                .network_config
                .sequencer_fee_vault_minimum_withdrawal_amount,
            base_fee_vault_withdrawal_network =
                self.network_config.base_fee_vault_withdrawal_network,
            l1_fee_vault_withdrawal_network = self.network_config.l1_fee_vault_withdrawal_network,
            sequencer_fee_vault_withdrawal_network =
                self.network_config.sequencer_fee_vault_withdrawal_network,
            fund_dev_accounts = self.network_config.fund_dev_accounts,
            l2_genesis_block_base_fee_per_gas =
                self.network_config.l2_genesis_block_base_fee_per_gas,
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
            l1_starting_block_tag = self.network_config.l1_starting_block_tag,
            l2_output_oracle_starting_timestamp =
                self.network_config.l2_output_oracle_starting_timestamp,
            l1_use_clique = self.network_config.l1_use_clique,
            clique_signer_address = self.accounts_config.admin_address,
            l1_genesis_block_timestamp = self.network_config.l1_genesis_block_timestamp,
            l1_block_time = self.network_config.l1_block_time,
            superchain_config_guardian = self.accounts_config.admin_address,
        );

        std::fs::write(path, json.as_bytes())?;

        Ok(())
    }
}
