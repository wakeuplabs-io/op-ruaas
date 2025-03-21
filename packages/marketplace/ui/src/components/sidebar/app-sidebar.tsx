import * as React from "react";
import { Plus } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import CustomConnectButton from "../connect-wallet";
import { buttonVariants } from "../ui/button";
import { Link } from "@tanstack/react-router";
import { useAccount } from "wagmi";
import { useOrders } from "@/lib/hooks/use-orders";
import { useProviderInfo } from "@/lib/hooks/use-provider-info";
import { NavRollups } from "./nav-rollups";

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const { name } = useProviderInfo();
  const { isConnected } = useAccount();
  const { sequencerRollups, replicaRollups } = useOrders();

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="py-6 px-4">
          <img className="h-8" src="/opruaas.png" alt="logo" />
        </div>
      </SidebarHeader>

      {isConnected ? (
        <SidebarContent className="px-4 space-y-2">
          <SidebarGroup>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip={"New Rollup"}
                  className="h-10 px-2"
                >
                  <Link to="/">
                    <Plus className="h-5 w-5" />
                    <span>New Rollup</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>

          <hr />

          <NavRollups
            title="My Sequencers"
            rollups={sequencerRollups.map((r) => ({
              id: r.id.toString(),
              name: r.setupMetadata.name,
            }))}
          />

          {[...sequencerRollups, ...replicaRollups].length ? <hr /> : null}

          <NavRollups
            title="My Replicas"
            rollups={replicaRollups.map((r) => ({
              id: r.id.toString(),
              name: r.setupMetadata.name,
            }))}
          />
        </SidebarContent>
      ) : (
        <div className="h-full"></div>
      )}

      <SidebarFooter className="pb-10 px-4 space-y-2">
        <hr className="border-muted" />

        <div className="text-sm text-gray-700 px-2">
          <h4 className="text-gray-500 text-xs mb-1">Provider</h4>
          <p className="font-medium">
            {name.charAt(0).toUpperCase() + name.slice(1)}
          </p>
        </div>

        <hr className="border-muted" />

        <CustomConnectButton />

        <hr className="border-muted" />

        <a
          href="https://www.wakeuplabs.io/"
          target="_blank"
          className={cn(
            buttonVariants({ variant: "secondary" }),
            "w-full h-[58px]"
          )}
        >
          <img className="h-[45px]" src="/wakeuplabs.png" alt="logo" />
        </a>
      </SidebarFooter>
    </Sidebar>
  );
}
