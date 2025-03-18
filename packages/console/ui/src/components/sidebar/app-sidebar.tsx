import * as React from "react";
import {
  PackageIcon,
  Rocket,
  SettingsIcon,
  ShieldCheck,
} from "lucide-react";
import { NavGroup } from "@/components/sidebar/nav-group";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { NavDeployments } from "./nav-deployments";
import { buttonVariants } from "../ui/button";
import { capitalize } from "@/lib/utils";
import { Deployment } from "@/lib/services/deployment";
import { cn } from "@/lib/utils";
import CustomConnectButton from "../connect-wallet";
import { useAuth } from "@/lib/hooks/use-auth";

const navMarketplace = [
  {
    title: "Requests",
    url: "/app/requests",
    icon: PackageIcon,
  },
];

const navCreate = [
  {
    title: "Setup",
    url: "/app",
    icon: SettingsIcon,
  },
  {
    title: "Deploy",
    url: "/app/deploy",
    icon: Rocket,
  },
  {
    title: "Verify",
    url: "/app/verify",
    icon: ShieldCheck,
  },
];

export function AppSidebar({
  deployments,
  ...props
}: React.ComponentProps<typeof Sidebar> & { deployments: Deployment[] }) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="py-6 px-4">
          <img className="h-8" src="/opruaas.png" alt="logo" />
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <NavGroup title="Marketplace" items={navMarketplace} />
        <NavGroup title="Create" items={navCreate} />
        <NavDeployments
          deployments={deployments.map((d) => ({
            id: d.id,
            name: capitalize(d.name),
          }))}
        />
      </SidebarContent>

      <SidebarFooter className="pb-10 px-4 space-y-2">
        <hr  className="border-muted"/>

        <CustomConnectButton />

        <hr  className="border-muted"/>

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
