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

const navMarketplace = [
  {
    title: "Requests",
    url: "/marketplace/requests",
    icon: PackageIcon,
  },
];

const navCreate = [
  {
    title: "Setup",
    url: "/create/setup",
    icon: SettingsIcon,
  },
  {
    title: "Deploy",
    url: "/create/deploy",
    icon: Rocket,
  },
  {
    title: "Verify",
    url: "/create/verify",
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

      <SidebarContent className="px-4">
        <NavGroup items={[...navCreate, ...navMarketplace]} />
        <hr className="my-2"/>
        <NavDeployments
          deployments={[
            ...deployments.map((d) => ({
              id: d.id,
              name: capitalize(d.name),
            })),
            ...deployments.map((d) => ({
              id: d.id,
              name: capitalize(d.name),
            })),
            ...deployments.map((d) => ({
              id: d.id,
              name: capitalize(d.name),
            }))
          ]}
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
