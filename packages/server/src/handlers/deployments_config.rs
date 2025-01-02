use crate::utils::zip::zip_folder;
use axum::{
    http::{HeaderMap, HeaderValue, StatusCode},
    response::IntoResponse,
    Extension, Json,
};
use opraas_core::{
    application::CreateProjectService,
    config::{AccountsConfig, ArtifactsConfig, CoreConfig, NetworkConfig},
    infra::project::{GitVersionControl, InMemoryProjectInfraRepository, InMemoryProjectRepository},
};
use serde::Deserialize;
use std::{path::PathBuf, sync::Arc};
use tempfile::TempDir;

#[derive(Deserialize)]
pub struct ConfigurePayload {
    pub max_sequencer_drift: u32,
    pub sequencer_window_size: u32,
    pub channel_timeout: u32,
    pub l2_block_time: u32,
    pub l1_block_time: u32,
    pub l1_chain_id: u32,
    pub l2_chain_id: u32,
    pub l2_output_oracle_submission_interval: u32,
    pub l2_output_oracle_starting_block_number: u32,
    pub finalization_period_seconds: u32,
    pub base_fee_vault_minimum_withdrawal_amount: String,
    pub l1_fee_vault_minimum_withdrawal_amount: String,
    pub sequencer_fee_vault_minimum_withdrawal_amount: String,
    pub base_fee_vault_withdrawal_network: u32,
    pub l1_fee_vault_withdrawal_network: u32,
    pub sequencer_fee_vault_withdrawal_network: u32,
    pub enable_governance: bool,
    pub governance_token_symbol: String,
    pub governance_token_name: String,
    pub l2_genesis_block_gas_limit: String,
    pub l2_genesis_block_base_fee_per_gas: String,
    pub eip1559_denominator: u32,
    pub eip1559_elasticity: u32,
    pub l2_genesis_regolith_time_offset: String,
    pub system_config_start_block: u32,
    pub required_protocol_version: String,
    pub recommended_protocol_version: String,
    pub fund_dev_accounts: bool,
    pub fault_game_absolute_prestate: String,
    pub fault_game_max_depth: u32,
    pub fault_game_clock_extension: u32,
    pub fault_game_max_clock_duration: u32,
    pub fault_game_genesis_block: u32,
    pub fault_game_genesis_output_root: String,
    pub fault_game_split_depth: u32,
    pub fault_game_withdrawal_delay: u32,
    pub preimage_oracle_min_proposal_size: u32,
    pub preimage_oracle_challenge_period: u32,
    pub gas_price_oracle_overhead: u32,
    pub gas_price_oracle_scalar: u32,
    pub eip1559_denominator_canyon: u32,
    pub l2_genesis_canyon_time_offset: String,
    pub l1_use_clique: bool,
    pub batch_inbox_address: String,
}

pub async fn create(
    Extension(create_service): Extension<
        Arc<CreateProjectService<InMemoryProjectRepository, GitVersionControl, InMemoryProjectInfraRepository>>,
    >,
    Json(data): Json<ConfigurePayload>,
) -> Result<impl IntoResponse, (StatusCode, &'static str)> {
    let mut headers = HeaderMap::new();
    headers.insert("Content-Type", HeaderValue::from_static("application/zip"));
    headers.insert(
        "Content-Disposition",
        HeaderValue::from_str(&format!("attachment; filename=\"opruaas-project.zip\"")).expect("Invalid header value"),
    );

    let config = CoreConfig {
        network: NetworkConfig {
            l1_rpc_url: None,
            max_sequencer_drift: data.max_sequencer_drift,
            sequencer_window_size: data.sequencer_window_size,
            channel_timeout: data.channel_timeout,
            l2_block_time: data.l2_block_time,
            l1_block_time: data.l1_block_time,
            l1_chain_id: data.l1_chain_id,
            l2_chain_id: data.l2_chain_id,
            l2_output_oracle_submission_interval: data.l2_output_oracle_submission_interval,
            l2_output_oracle_starting_block_number: data.l2_output_oracle_starting_block_number,
            finalization_period_seconds: data.finalization_period_seconds,
            base_fee_vault_minimum_withdrawal_amount: data.base_fee_vault_minimum_withdrawal_amount,
            l1_fee_vault_minimum_withdrawal_amount: data.l1_fee_vault_minimum_withdrawal_amount,
            sequencer_fee_vault_minimum_withdrawal_amount: data.sequencer_fee_vault_minimum_withdrawal_amount,
            base_fee_vault_withdrawal_network: data.base_fee_vault_withdrawal_network,
            l1_fee_vault_withdrawal_network: data.l1_fee_vault_withdrawal_network,
            sequencer_fee_vault_withdrawal_network: data.sequencer_fee_vault_withdrawal_network,
            enable_governance: data.enable_governance,
            governance_token_symbol: data.governance_token_symbol,
            governance_token_name: data.governance_token_name,
            l2_genesis_block_gas_limit: data.l2_genesis_block_gas_limit,
            l2_genesis_block_base_fee_per_gas: data.l2_genesis_block_base_fee_per_gas,
            eip1559_denominator: data.eip1559_denominator,
            eip1559_elasticity: data.eip1559_elasticity,
            l2_genesis_regolith_time_offset: data.l2_genesis_regolith_time_offset,
            system_config_start_block: data.system_config_start_block,
            required_protocol_version: data.required_protocol_version,
            recommended_protocol_version: data.recommended_protocol_version,
            fund_dev_accounts: data.fund_dev_accounts,
            fault_game_absolute_prestate: data.fault_game_absolute_prestate,
            fault_game_max_depth: data.fault_game_max_depth,
            fault_game_clock_extension: data.fault_game_clock_extension,
            fault_game_max_clock_duration: data.fault_game_max_clock_duration,
            fault_game_genesis_block: data.fault_game_genesis_block,
            fault_game_genesis_output_root: data.fault_game_genesis_output_root,
            fault_game_split_depth: data.fault_game_split_depth,
            fault_game_withdrawal_delay: data.fault_game_withdrawal_delay,
            preimage_oracle_min_proposal_size: data.preimage_oracle_min_proposal_size,
            preimage_oracle_challenge_period: data.preimage_oracle_challenge_period,
            gas_price_oracle_overhead: data.gas_price_oracle_overhead,
            gas_price_oracle_scalar: data.gas_price_oracle_scalar,
            eip1559_denominator_canyon: data.eip1559_denominator_canyon,
            l2_genesis_canyon_time_offset: data.l2_genesis_canyon_time_offset,
            l1_use_clique: data.l1_use_clique,
            batch_inbox_address: data.batch_inbox_address,
        },
        accounts: AccountsConfig::null(),
        artifacts: ArtifactsConfig::null(),
    };

    let tmp_dir = TempDir::new().unwrap(); // automatically clean up on drop
    let project = create_service
        .create(&PathBuf::from(tmp_dir.path()), &config, false)
        .unwrap();

    let zip_buffer =
        zip_folder(&project.root).map_err(|_| (StatusCode::INTERNAL_SERVER_ERROR, "Failed to zip project"));

    Ok((StatusCode::OK, headers, zip_buffer))
}
