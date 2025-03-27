import * as React from "react";
import { Plus } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import CustomConnectButton from "./connect-wallet";
import { buttonVariants } from "./ui/button";
import { Link } from "@tanstack/react-router";
import { RollupList } from "./sidebar/rollup-list";
import { useAccount } from "wagmi";
import { useOrders } from "@/lib/hooks/use-orders";
import { useProviderInfo } from "@/lib/hooks/use-provider-info";

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const { isConnected } = useAccount();
  const { sequencerRollups, replicaRollups } = useOrders();
  const { name } = useProviderInfo();

  const [selectedRollupId, setSelectedRollupId] = React.useState<bigint>();
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="py-6 px-4">
          <img className="h-8" src="/opruaas.png" alt="logo" />
        </div>
      </SidebarHeader>

      {isConnected && (
        <SidebarContent className="px-4 space-y-4">
          <Link
            to="/"
            className="w-full flex items-center gap-2 py-2 px-4 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-100 transition"
          >
            <Plus size={16} className="text-red-500" />
            <span className="font-primary">New Rollup</span>
          </Link>
          <hr />

          <RollupList
            name="Sequencer"
            rollups={sequencerRollups.map((r) => ({
              id: r.id,
              name: r.setupMetadata.name,
            }))}
            selectedId={selectedRollupId}
            onSelect={setSelectedRollupId}
          />
          <hr />
          <RollupList
            name="Replica"
            rollups={replicaRollups.map((r) => ({
              id: r.id,
              name: r.setupMetadata.name,
            }))}
            selectedId={selectedRollupId}
            onSelect={setSelectedRollupId}
          />
        </SidebarContent>
      )}

      <div className="px-4 mt-auto text-sm text-gray-700">
        <h4 className="text-gray-500 text-xs mb-1">Provider</h4>
        <p className="font-medium">{name}</p>
      </div>

      <div className="px-4 mt-4">
        <CustomConnectButton />
      </div>

      <SidebarFooter className="pb-4 px-4 flex flex-col items-center mt-4">
        <a
          href="https://www.wakeuplabs.io/"
          target="_blank"
          className={cn(
            buttonVariants({ variant: "secondary" }),
            "w-full h-[74px] flex justify-center items-center"
          )}
        >
          <img className="h-[45px]" src="/wakeuplabs.png" alt="logo" />
        </a>
      </SidebarFooter>
    </Sidebar>
  );
}
