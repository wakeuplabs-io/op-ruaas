import * as React from "react";
import {
  LogInIcon,
  Rocket,
  SettingsIcon,
  ShieldCheck,
} from "lucide-react";
import { useRouter } from "@tanstack/react-router";
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
      url: "/rollups/id",
    },
    {
      name: "Holenksy",
      url: "#",
    },
    {
      name: "Mainnet",
      url: "#",
    },
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
  const router = useRouter(); // Access the router instance
  const currentPath = router.state.location.pathname;

  const navMain = React.useMemo(() => {
    return [
      {
        title: "Setup",
        url: "/create/setup",
        icon: SettingsIcon,
        isActive: currentPath === "/create/setup",
      },
      {
        title: "Deploy",
        url: "/create/deploy",
        icon: Rocket,
        isActive: currentPath === "/create/deploy",
      },
      {
        title: "Verification",
        url: "/create/inspect",
        icon: ShieldCheck,
        isActive: currentPath === "/create/inspect",
      },
    ];
  }, [currentPath]);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="py-6 px-2">
          <img className="h-8" src="/opruaas.png" alt="logo" />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter className="pb-4">
        <Button variant={"secondary"} className={"w-full h-[74px]"}>
          <img className="h-[45px]" src="/wakeuplabs.png" alt="logo" />
        </Button>

        <Button variant={"ghost"}>
          <LogInIcon className="h-4 w-4" />
          <span>Login</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
