import { ConfigInput } from "@/components/config-input";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useMemo, useState } from "react";
import { ConfigSection } from "@/components/config-section";
import { cn } from "@/lib/utils";
import {
  networkConfig,
  NetworkConfig,
  networkConfigSchema,
} from "@/shared/config/network-config";
import { ApiService } from "@/lib/api";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

export const Route = createFileRoute("/configure/")({
  component: ConfigureChain,
});

function ConfigureChain() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const {
    register,
    formState: { errors },
    handleSubmit,
  } = useForm<NetworkConfig>({
    resolver: zodResolver(networkConfigSchema),
    defaultValues: {
      l2_chain_id: 1234,

      l2_output_oracle_submission_interval: 120,
      l2_output_oracle_starting_block_number: 0,

      l2_block_time: 2,
      max_sequencer_drift: 600,
      sequencer_window_size: 3600,
      channel_timeout: 300,
      system_config_start_block: 0,
      batch_inbox_address: "0xff69000000000000000000000000001201101712",

      finalization_period_seconds: 12,

      l2_genesis_block_gas_limit: "0x2faf080",
      l2_genesis_block_base_fee_per_gas: "0x3b9aca00",
      eip1559_denominator: 50,
      eip1559_elasticity: 10,
      eip1559_denominator_canyon: 250,

      enable_governance: false,
      governance_token_symbol: "OP",
      governance_token_name: "Optimism",

      base_fee_vault_minimum_withdrawal_amount: "0x8ac7230489e80000",
      l1_fee_vault_minimum_withdrawal_amount: "0x8ac7230489e80000",
      sequencer_fee_vault_minimum_withdrawal_amount: "0x8ac7230489e80000",

      base_fee_vault_withdrawal_network: 0,
      l1_fee_vault_withdrawal_network: 0,
      sequencer_fee_vault_withdrawal_network: 0,

      l2_genesis_regolith_time_offset: "0x0",
      l2_genesis_canyon_time_offset: "0x40",

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
    },
  });
  const [chainId, setChainId] = useState<number>(1);
  const [advanced, setAdvanced] = useState<boolean>(false);

  const onL1ChainSelect = useCallback((chainId: number) => {
    setChainId(chainId);
  }, []);

  const filteredNetworkConfig = useMemo(() => {
    if (advanced) {
      return networkConfig;
    }

    return networkConfig
      .map((nc) => ({
        ...nc,
        inputs: nc.inputs.filter((i) => !i.advanced),
      }))
      .filter((i) => i.inputs.length > 0);
  }, [advanced]);

  const onSubmit = useCallback(async (data: NetworkConfig) => {
    try {
      setLoading(true);
      const res = await ApiService.buildChainConfig(chainId, {
        ...data,
      });

      const url = window.URL.createObjectURL(res.data);
      window.open(url, "_blank");

      router.navigate({ to: "/deploy" });
    } catch (e: any) {
      window.alert("Failed to create deployment: " + e?.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="min-h-screen flex">
          <aside className="w-[600px] h-screen overflow-y-scroll sticky top-0 px-6 py-10 border-r border-gray-300 space-y-2">
            <h2 className="font-medium">Settings</h2>
            <div>
              <a
                href="#l1-chain"
                className="text-gray-700 font-medium text-base"
              >
                L1 chain
              </a>
            </div>

            <div>
              <a
                href="#advanced"
                className="text-gray-700 font-medium text-base"
              >
                Advanced Mode
              </a>
            </div>

            {filteredNetworkConfig.map((nc) => (
              <div className="space-y-2">
                <a
                  href={`#${nc.id}`}
                  className="font-medium text-base text-gray-700"
                >
                  {nc.title}
                </a>
                <ul className="space-y-1 text-sm">
                  {nc.inputs.map((i) => (
                    <li className="pl-4">
                      <a href={`#${i.title}`} className="text-gray-600">
                        {i.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </aside>

          <div className="max-w- mx-14 w-full my-10 divide-y">
            <div className="py-6 space-y-2">
              <h1 className="text-xl font-bold">Setup Chain</h1>
              <p className="text-sm">
                Walkthrough the config parameters to generate a config for your
                chain you can deploy.
              </p>
            </div>

            <div className="space-y-3 py-6" id="advanced">
              <h2 className="text-xl font-bold">Advanced mode</h2>
              <div className="space-y-3">
                <span className="block text-sm text-neutral">
                  Enable advanced mode to fine tune all parameters that define
                  your chain. If want a quick test the defaults should be enough
                  and you can keep this as disabled
                </span>

                <select
                  className="select select-bordered w-full"
                  value={advanced ? "enabled" : "disabled"}
                  onChange={(e) => setAdvanced(e.target.value === "enabled")}
                >
                  <option value="disabled">Disabled</option>
                  <option value="enabled">Enabled</option>
                </select>
              </div>
            </div>

            <div className="space-y-3 py-6" id="l1-chain">
              <h2 className="text-xl font-bold">L1 chain</h2>
              <div className="space-y-3">
                <p className="text-sm text-neutral">
                  The L1 chain to which your rollup will be posting
                  transactions. Think of it as an exchange between costs and
                  security.
                </p>

                <select
                  value={chainId}
                  onChange={(e) => onL1ChainSelect(Number(e.target.value))}
                  className="select select-bordered w-full"
                >
                  <option value={1}>Ethereum</option>
                </select>
              </div>
            </div>

            <form className="py-6 space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <h2 className="text-xl font-bold">Your chain</h2>

              {filteredNetworkConfig.map((nc) => (
                <ConfigSection
                  id={nc.title}
                  title={nc.title}
                  description={nc.description}
                >
                  {nc.inputs.map((i) => (
                    <ConfigInput
                      {...register(i.id)}
                      id={i.id}
                      title={i.title}
                      description={i.description}
                      type={i.type}
                      notes={i.notes}
                      standardConfigRequirement={i.standardConfigRequirement}
                      error={errors[i.id]?.message}
                    />
                  ))}
                </ConfigSection>
              ))}

              <button
                type="submit"
                disabled={loading}
                className={cn("btn btn-sm", {
                  "loading loading-spinner": loading,
                })}
              >
                Download zip file
              </button>
            </form>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
