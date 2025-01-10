import { api } from "../api";

export class ProjectService {
  static async create(
    mainnet: boolean,
    chainId: number,
    governanceSymbol: string,
    governanceName: string
  ): Promise<Blob> {
    const res = await api.post(
      "projects",
      {
        l1_chain_id: mainnet ? 1 : 17000, // mainnet ethereum - holensky
        l1_block_time: 12, // for both mainnet ethereum and holenksy
        finalization_period_seconds: 12, // for both mainnet ethereum and holenksy
        l2_chain_id: chainId,
        governance_token_symbol: governanceSymbol,
        governance_token_name: governanceName,

        // defaults
        l2_block_time: 2,
        channel_timeout: 300,
        max_sequencer_drift: 600,
        sequencer_window_size: 3600,
        l2_output_oracle_submission_interval: 120,
        l2_output_oracle_starting_block_number: 0,
        base_fee_vault_minimum_withdrawal_amount: "0x8ac7230489e80000",
        l1_fee_vault_minimum_withdrawal_amount: "0x8ac7230489e80000",
        sequencer_fee_vault_minimum_withdrawal_amount: "0x8ac7230489e80000",
        base_fee_vault_withdrawal_network: 0,
        l1_fee_vault_withdrawal_network: 0,
        sequencer_fee_vault_withdrawal_network: 0,
        enable_governance: true,
        l2_genesis_block_gas_limit: "0x2faf080",
        l2_genesis_block_base_fee_per_gas: "0x3b9aca00",
        eip1559_denominator: 50,
        eip1559_elasticity: 10,
        l2_genesis_regolith_time_offset: "0x0",
        system_config_start_block: 0,
        required_protocol_version:
          "0x0000000000000000000000000000000000000000000000000000000000000000",
        recommended_protocol_version:
          "0x0000000000000000000000000000000000000000000000000000000000000000",
        fund_dev_accounts: false,
        fault_game_absolute_prestate:
          "0x03c7ae758795765c6664a5d39bf63841c71ff191e9189522bad8ebff5d4eca98",
        fault_game_max_depth: 30,
        fault_game_clock_extension: 0,
        fault_game_max_clock_duration: 1200,
        fault_game_genesis_block: 0,
        fault_game_genesis_output_root:
          "0xDEADBEEFDEADBEEFDEADBEEFDEADBEEFDEADBEEFDEADBEEFDEADBEEFDEADBEEF",
        fault_game_split_depth: 14,
        fault_game_withdrawal_delay: 604800,
        preimage_oracle_min_proposal_size: 10000,
        preimage_oracle_challenge_period: 120,
        gas_price_oracle_overhead: 2100,
        gas_price_oracle_scalar: 1000000,
        eip1559_denominator_canyon: 250,
        l2_genesis_canyon_time_offset: "0x40",
        l1_use_clique: true,
        batch_inbox_address: "0xff69000000000000000000000000001201101712",
      },
      {
        responseType: "blob",
      }
    );

    return res.data;
  }
}
