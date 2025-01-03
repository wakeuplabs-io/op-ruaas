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
                },
                {
                    id:  "l2_output_oracle_submission_interval",
                    title: "l2_output_oracle_submission_interval",
                    advanced: true,
                    description:
                        "Number of blocks between proposals to the L2OutputOracle. Will be removed with the addition of permissionless proposals.",
                    type: "Number of blocks",
                    notes: "Must not be 0. 120 (4 minutes) is suggested.",
                },
                {
                    id: "l2_output_oracle_starting_block_number",
                    title: "l2_output_oracle_starting_block_number",
                    advanced: true,
                    description:
                        "Block number of the first OP Stack block. Typically this should be zero, but this may be non-zero for networks that have been upgraded from a legacy system (like OP Mainnet). Will be removed with the addition of permissionless proposals.",
                    type: "Number",
                    recommendedValue: "0",
                    notes: "Should be 0 for new chains.",
                },
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
                {
                    id: "max_sequencer_drift",
                    title: "max_sequencer_drift",
                    advanced: true,
                    description:
                        "How far the L2 timestamp can differ from the actual L1 timestamp.",
                    type: "Number of seconds",
                    recommendedValue: "1800",
                    notes:
                        "Must not be 0. 1800 (30 minutes) is the constant that takes effect with the Fjord activation.",
                },
                {
                    id: "sequencer_window_size",
                    title: "sequencer_window_size",
                    advanced: true,
                    description:
                        "Maximum number of L1 blocks that a Sequencer can wait to incorporate the information in a specific L1 block. For example, if the window is 10 then the information in L1 block n must be incorporated by L1 block n+10.",
                    type: "Number of blocks",
                    notes: "Must not be 0. 3600 (12 hours) is suggested.",
                    standardConfigRequirement:
                        "3_600 base layer blocks (12 hours for an L2 on Ethereum, assuming 12 second L1 blocktime). This is an important value for constraining the sequencer's ability to re-order transactions; higher values would pose a risk to user protections.",
                },
                {
                    id: "channel_timeout",
                    title: "channel_timeout",
                    advanced: true,
                    description:
                        "Maximum number of L1 blocks that a transaction channel frame can be considered valid. A transaction channel frame is a chunk of a compressed batch of transactions. After the timeout, the frame is dropped.",
                    type: "Number of blocks",
                    defaultValue: "50",
                    notes:
                        "This default value was introduced in the Granite network upgrade",
                },
                {
                    id: "system_config_start_block",
                    title: "system_config_start_block",
                    advanced: true,
                    description:
                        "Maximum number of L1 blocks that a transaction channel frame can be considered valid. A transaction channel frame is a chunk of a compressed batch of transactions. After the timeout, the frame is dropped.",
                    type: "Number of blocks",
                    defaultValue: "50",
                    notes:
                        "This default value was introduced in the Granite network upgrade",
                },
                {
                    id: "batch_inbox_address",
                    title: "batch_inbox_address",
                    advanced: true,
                    description:
                        "Address that Sequencer transaction batches are sent to on L1.",
                    type: "L1 Address",
                    standardConfigRequirement:
                        "Convention is versionByte || keccak256(bytes32(chainId))[:19], where || denotes concatenation, versionByte is 0x00, and chainId is a uint256. This is to cover the full range of chain ids, to the full uint256 size.",
                },
            ],
        },
        {
            id: "gas",
            title: "Gas",
            description:
                "Set such that Fee Margin is between 0 and 50%. No higher than 200_000_000 gas. Chain operators are driven to maintain a stable and reliable chain. When considering a change to this value, careful deliberation is necessary.",
            inputs: [
                {
                    id: "l2_genesis_block_gas_limit",
                    title: "l2_genesis_block_gas_limit",
                    advanced: true,
                    description:
                        "L2GenesisBlockGasLimit represents the chain's block gas limit.",
                    type: "Number",
                    notes:
                        "Must not be 0. Must be greater than MaxResourceLimit + SystemTxMaxGas.",
                },
                {
                    id: "l2_genesis_block_base_fee_per_gas",
                    title: "l2_genesis_block_base_fee_per_gas",
                    advanced: true,
                    description:
                        "L2GenesisBlockBaseFeePerGas represents the base fee per gas.",
                    type: "Number",
                    notes: " L2 genesis block base fee per gas cannot be nil.",
                },
                {
                    id: "eip1559_denominator",
                    title: "eip1559_denominator",
                    advanced: true,
                    description:
                        "EIP1559Denominator is the denominator of EIP1559 base fee market.",
                    type: "Number",
                    notes: "Must not be 0.",
                },
                {
                    id: "eip1559_elasticity",
                    title: "eip1559_elasticity",
                    advanced: true,
                    description:
                        "EIP1559Elasticity is the elasticity of the EIP1559 fee market.",
                    type: "Number",
                    notes: "Must not be 0.",
                },
                {
                    id: "eip1559_denominator_canyon",
                    title: "eip1559_denominator_canyon",
                    advanced: true,
                    description:
                        "EIP1559DenominatorCanyon is the denominator of EIP1559 base fee market when Canyon is active.",
                    type: "Number",
                    notes: "Must not be 0 if Canyon is activated.",
                    recommendedValue: "250",
                },
                {
                    id: "gas_price_oracle_overhead",
                    title: "gas_price_oracle_overhead",
                    advanced: true,
                    description: "GasPriceOracleOverhead represents the initial value of the gas overhead in the GasPriceOracle predeploy.",
                    type: "Number",
                },
                {
                    id: "gas_price_oracle_scalar",
                    title: "gas_price_oracle_scalar",
                    advanced: true,
                    description: "GasPriceOracleScalar represents the initial value of the gas scalar in the GasPriceOracle predeploy.",
                }
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
        {
            id: "minimum-fees",
            title: "Minimum fees withdrawal amount",
            description:
                "Withdrawals to L1 are expensive and the minimum fee is to prevent overhead costs of continuous tiny withdrawals. If the withdrawal execution costs more than the fee-reward, then the fee Must not be collected economically.",
            inputs: [
                {
                    id: "base_fee_vault_minimum_withdrawal_amount",
                    title: "base_fee_vault_minimum_withdrawal_amount",
                    advanced: true,
                    description:
                        "BaseFeeVaultMinimumWithdrawalAmount represents the minimum withdrawal amount for the BaseFeeVault.",
                    type: "Number in wei",
                },
                {
                    id: "l1_fee_vault_minimum_withdrawal_amount",
                    title: "l1_fee_vault_minimum_withdrawal_amount",
                    advanced: true,
                    description:
                        "L1FeeVaultMinimumWithdrawalAmount represents the minimum withdrawal amount for the L1FeeVault.",
                    type: "Number in wei",
                },
                {
                    id: "sequencer_fee_vault_minimum_withdrawal_amount",
                    title: "sequencer_fee_vault_minimum_withdrawal_amount",
                    advanced: true,
                    description:
                        "SequencerFeeVaultMinimumWithdrawalAmount represents the minimum withdrawal amount for the SequencerFeeVault.",
                    type: "Number in wei",
                },
            ],
        },
        {
            id: "withdrawal-network",
            title: "Withdrawal network",
            inputs: [
                {
                    id: "base_fee_vault_withdrawal_network",
                    title: "base_fee_vault_withdrawal_network",
                    advanced: true,
                    description:
                        "BaseFeeVaultWithdrawalNetwork represents the withdrawal network for the BaseFeeVault. value of 0 will withdraw ETH to the recipient address on L1 and a value of 1 will withdraw ETH to the recipient address on L2.",
                    type: "Number representing network enum",
                    notes: "Withdrawals to Ethereum are more expensive.",
                },
                {
                    id: "l1_fee_vault_withdrawal_network",
                    title: "l1_fee_vault_withdrawal_network",
                    advanced: true,
                    description:
                        "L1FeeVaultWithdrawalNetwork represents the withdrawal network for the L1FeeVault. A value of 0 will withdraw ETH to the recipient address on L1 and a value of 1 will withdraw ETH to the recipient address on L2.",
                    type: "Number representing network enum",
                    notes: "Withdrawals to Ethereum are more expensive.",
                },

                {
                    id: "sequencer_fee_vault_withdrawal_network",
                    title: "sequencer_fee_vault_withdrawal_network",
                    advanced: true,
                    description:
                        "SequencerFeeVaultWithdrawalNetwork represents the withdrawal network for the SequencerFeeVault. A value of 0 will withdraw ETH to the recipient address on L1 and a value of 1 will withdraw ETH to the recipient address on L2.",
                    type: "Number representing network enum",
                    notes: "Withdrawals to Ethereum are more expensive.",
                },
            ],
        },
        {
            id: "offset-values",
            title: "Offset values",
            inputs: [
                {
                    id: "l2_genesis_regolith_time_offset",
                    title: "l2_genesis_regolith_time_offset",
                    advanced: true,
                    description:
                        "L2GenesisRegolithTimeOffset is the number of seconds after genesis block that Regolith hard fork activates. Set it to 0 to activate at genesis. Nil to disable Regolith.",
                    type: "Number in seconds",
                    defaultValue: "nil",
                    recommendedValue: "0x0",
                    standardConfigRequirement: "Network upgrade (hardfork) is activated.",
                },
                {
                    id: "l2_genesis_canyon_time_offset",
                    title: "l2_genesis_canyon_time_offset",
                    advanced: true,
                    description:
                        "L2GenesisCanyonTimeOffset is the number of seconds after genesis block that Canyon hard fork activates. Set it to 0 to activate at genesis. Nil to disable Canyon.",
                    type: "Number of seconds",
                    defaultValue: "nil",
                    recommendedValue: "0x0",
                    standardConfigRequirement: "Network upgrade (hardfork) is activated.",
                },
            ],
        },
        {
            id: "fault-proofs",
            title: "Fault proofs",
            inputs: [
                {
                    id: "fault_game_absolute_prestate",
                    title: "fault_game_absolute_prestate",
                    advanced: true,
                    description:
                        "FaultGameAbsolutePrestate is the absolute prestate of Cannon. This is computed by generating a proof from the 0th -> 1st instruction and grabbing the prestate from the output JSON. All honest challengers should agree on the setup state of the program.",
                    type: "Hash",
                },
                {
                    id: "fault_game_max_depth",
                    title: "fault_game_max_depth",
                    advanced: true,
                    description:
                        "FaultGameMaxDepth is the maximum depth of the position tree within the fault dispute game. 2^{FaultGameMaxDepth} is how many instructions the execution trace bisection game supports. Ideally, this should be conservatively set so that there is always enough room for a full Cannon trace.",
                    type: "Number",
                },
                {
                    id: "fault_game_clock_extension",
                    title: "fault_game_clock_extension",
                    advanced: true,
                    description:
                        "FaultGameClockExtension is the amount of time that the dispute game will set the potential grandchild claim's, clock to, if the remaining time is less than this value at the time of a claim's creation.",
                    type: "Number",
                },
                {
                    id: "fault_game_max_clock_duration",
                    title: "fault_game_max_clock_duration",
                    advanced: true,
                    description:
                        "FaultGameMaxClockDuration is the maximum amount of time that may accumulate on a team's chess clock before they may no longer respond.",
                    type: "Number",
                },
                {
                    id: "fault_game_genesis_block",
                    title: "fault_game_genesis_block",
                    advanced: true,
                    description: "FaultGameGenesisBlock is the block number for genesis.",
                    type: "Number",
                },
                {
                    id: "fault_game_genesis_output_root",
                    title: "fault_game_genesis_output_root",
                    advanced: true,
                    description:
                        "FaultGameGenesisOutputRoot is the output root for the genesis block.",
                    type: "Hash",
                },
                {
                    id: "fault_game_split_depth",
                    title: "fault_game_split_depth",
                    advanced: true,
                    description:
                        "FaultGameSplitDepth is the depth at which the fault dispute game splits from output roots to execution trace claims.",
                    type: "Number",
                },
                {
                    id: "fault_game_withdrawal_delay",
                    title: "fault_game_withdrawal_delay",
                    advanced: true,
                    description:
                        "FaultGameWithdrawalDelay is the number of seconds that users must wait before withdrawing ETH from a fault game.",
                    type: "Number",
                },
                {
                    id: "preimage_oracle_min_proposal_size",
                    title: "preimage_oracle_min_proposal_size",
                    advanced: true,
                    description:
                        "PreimageOracleMinProposalSize is the minimum number of bytes that a large preimage oracle proposal can be.",
                    type: "Number",
                },
                {
                    id: "preimage_oracle_challenge_period",
                    title: "preimage_oracle_challenge_period",
                    advanced: true,
                    description:
                        "PreimageOracleChallengePeriod is the number of seconds that challengers have to challenge a large preimage proposal.",
                    type: "Number of seconds",
                },
            ],
        },
        {
            id: "miscellaneous",
            title: "Miscellaneous",
            inputs: [
                {
                    id: "required_protocol_version",
                    title: "required_protocol_version",
                    advanced: true,
                    description:
                        "RequiredProtocolVersion indicates the protocol version that nodes are recommended to adopt, to stay in sync with the network.",
                    type: "Hex string",
                },
                {
                    id: "recommended_protocol_version",
                    title: "recommended_protocol_version",
                    advanced: true,
                    description:
                        "RecommendedProtocolVersion indicates the protocol version that nodes are recommended to adopt, to stay in sync with the network.",
                    type: "Hex string",
                },
                {
                    id: "fund_dev_accounts",
                    title: "fund_dev_accounts",
                    advanced: true,
                    description:
                        "FundDevAccounts determines whether to fund the dev accounts. Should only be used during devnet deployments.",
                    type: "boolean",
                },
            ],
        },
    ];