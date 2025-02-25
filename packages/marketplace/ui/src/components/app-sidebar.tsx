import * as React from "react";
import { BookMarked, FilePlus2 } from "lucide-react";
import { NavMain } from "@/components/nav-main";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { NavDeployments } from "./nav-deployments";
import { capitalize } from "@/lib/strings";
import { Deployment } from "@/lib/services/deployment";
import { cn } from "@/lib/utils";
import CustomConnectButton from "./connect-wallet";
import { buttonVariants } from "./ui/button";

const navMain = [
  {
    title: "New rollup",
    url: "/app",
    icon: FilePlus2,
  },
  {
    title: "My rollups",
    url: "/app/deploy",
    icon: BookMarked,
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
        <NavMain items={navMain} />
        <NavDeployments
          deployments={deployments.map((d) => ({
            id: d.id,
            name: capitalize(d.name),
          }))}
        />
      </SidebarContent>
      <CustomConnectButton />
      <SidebarFooter className="pb-4 px-4 flex flex-col items-center space-y-6">
        <a
          href="https://www.wakeuplabs.io/"
          target="_blank"
          className={cn(buttonVariants({ variant: "secondary" }), "w-full h-[74px] flex justify-center items-center")}
        >
          <img className="h-[45px]" src="/wakeuplabs.png" alt="logo" />
        </a>
      </SidebarFooter>


    </Sidebar>
  );
}
