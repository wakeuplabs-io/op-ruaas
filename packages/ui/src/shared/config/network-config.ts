import { z } from "zod";

export const networkConfigSchema = z.object({
    // chain information
    l2_chain_id: z.number(),

    // proposal fields
    finalization_period_seconds: z.number(),
    l2_output_oracle_submission_interval: z.number(),
    l2_output_oracle_starting_block_number: z.number(),

    // blocks
    l2_block_time: z.number(),
    max_sequencer_drift: z.number(),
    sequencer_window_size: z.number(),
    channel_timeout: z.number(),
    system_config_start_block: z.number(),
    batch_inbox_address: z.string().startsWith("0x"),

    // gas
    l2_genesis_block_gas_limit: z.string().startsWith("0x"),
    l2_genesis_block_base_fee_per_gas: z.string().startsWith("0x"),
    eip1559_denominator: z.number(),
    eip1559_elasticity: z.number(),
    eip1559_denominator_canyon: z.number(),
    gas_price_oracle_overhead: z.number(), // deprecated
    gas_price_oracle_scalar: z.number(), // deprecated

    // governance
    enable_governance: z.boolean(),
    governance_token_symbol: z.string(),
    governance_token_name: z.string(),

    // minimum fees withdrawal amount
    base_fee_vault_minimum_withdrawal_amount: z.string().startsWith("0x"),
    l1_fee_vault_minimum_withdrawal_amount: z.string().startsWith("0x"),
    sequencer_fee_vault_minimum_withdrawal_amount: z.string().startsWith("0x"),

    // withdrawal network
    base_fee_vault_withdrawal_network: z.number(),
    l1_fee_vault_withdrawal_network: z.number(),
    sequencer_fee_vault_withdrawal_network: z.number(),

    // offset values
    l2_genesis_regolith_time_offset: z.string().startsWith("0x"),
    l2_genesis_canyon_time_offset: z.string().startsWith("0x"),

    // miscellaneous
    required_protocol_version: z.string().startsWith("0x"),
    recommended_protocol_version: z.string().startsWith("0x"),
    fund_dev_accounts: z.boolean(),

    // fault proofs
    fault_game_absolute_prestate: z.string().startsWith("0x"),
    fault_game_genesis_output_root: z.string().startsWith("0x"),
    fault_game_max_depth: z.number(),
    fault_game_clock_extension: z.number(),
    fault_game_max_clock_duration: z.number(),
    fault_game_genesis_block: z.number(),
    fault_game_split_depth: z.number(),
    fault_game_withdrawal_delay: z.number(),
    preimage_oracle_min_proposal_size: z.number(),
    preimage_oracle_challenge_period: z.number(),
});

export type NetworkConfig = z.infer<typeof networkConfigSchema>;

export const networkConfig: {
    id: string;
    title: string;
    description?: string;
    inputs: {
        id: keyof NetworkConfig;
        title: string;
        description: string;
        defaultValue?: string;
        type?: string;
        recommendedValue?: string;
        notes?: string;
        standardConfigRequirement?: string;
        advanced?: boolean;
    }[];
}[] = [
        {
            id: "chain-information",
            title: "Chain Information",
            inputs: [
                {
                    id: "l2_chain_id",
                    title: "l2_chain_id",
                    description: "Chain ID of the L2 chain.",
                    type: "Number",
                    notes:
                        "Must not be 0. For security reasons, should be unique. Chains should add their chain IDs to ethereum-lists/chains.",
                    standardConfigRequirement:
                        "Foundation-approved, globally unique value.",
                },
            ],
        },
        {
            id: "proposal-fields",
            title: "Proposal fields",
            description:
                "These fields apply to output root proposals. The l2OutputOracleSubmissionInterval is configurable, see the section below for guidance.",
            inputs: [
                {
                    id: "finalization_period_seconds",
                    title: "finalization_period_seconds",
                    description:
                        "Number of seconds that a proposal must be available to challenge before it is considered finalized by the OptimismPortal contract",
                    type: "Number of seconds",
                    notes:
                        "Must not be 0. Recommend 12 on test networks, seven days on production ones",
                    standardConfigRequirement:
                        "7 days. High security. Excessively safe upper bound that leaves enough time to consider social layer solutions to a hack if necessary. Allows enough time for other network participants to challenge the integrity of the corresponding output root.",
                }
            ],
        },
        {
            id: "blocks",
            title: "Blocks",
            description:
                "These fields apply to L2 blocks: Their timing, when they need to be written to L1, and how they get written.",
            inputs: [
                {
                    id:  "l2_block_time",
                    title: "l2_block_time",
                    description:
                        "Number of seconds between each L2 block. Must be < L1 block time (12 on mainnet and Sepolia).",
                    type: "Number of seconds",
                    notes:
                        "Must not be 0. Must be less than the L1 blocktime and a whole number.",
                    standardConfigRequirement: "1 or 2 seconds.",
                },
            ],
        },
        {
            id: "governance",
            title: "Governance",
            inputs: [
                {
                    id: "enable_governance",
                    title: "enable_governance",
                    description:
                        "EnableGovernance determines whether to include governance token predeploy.",
                    type: "boolean",
                    recommendedValue: "false",
                },
                {
                    id: "governance_token_symbol",
                    title: "governance_token_symbol",
                    description:
                        "GovernanceTokenSymbol represents the ERC20 symbol of the GovernanceToken.",
                    type: "string",
                },
                {
                    id: "governance_token_name",
                    title: "governance_token_name",
                    description:
                        "GovernanceTokenName represents the ERC20 name of the GovernanceToken",
                    type: "string",
                },
            ],
        },
    ];