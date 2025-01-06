import * as React from "react";
import { LogInIcon, Rocket, SettingsIcon, ShieldCheck } from "lucide-react";

import { NavMain } from "@/components/nav-main";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { NavProjects } from "./nav-projects";
import { Button } from "./ui/button";

// This is sample data.
const data = {
  navMain: [
    {
      title: "Setup",
      url: "/",
      icon: SettingsIcon,
      isActive: true,
    },
    {
      title: "Deploy",
      url: "/deploy",
      icon: Rocket,
    },
    {
      title: "Verification",
      url: "/inspect",
      icon: ShieldCheck,
    },
  ],
  projects: [
    {
      name: "Sepolia",
      url: "#",
    },
    {
      name: "Holenksy",
      url: "#",
    },
    {
      name: "Mainnet",
      url: "#",
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="py-14 px-2">
          <img className="h-8" src="/opruaas.png" alt="logo" />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <Button size={"icon"} variant={"ghost"} className="bg-black text-white">
          <LogInIcon />
        </Button>
        <div className="bg-gray-50 h-[74px] w-full rounded-md flex justify-center items-center">
          <img className="h-[45px]" src="/wakeuplabs.png" alt="logo" />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
