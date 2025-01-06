import * as React from "react";
import {
  LogInIcon,
  Rocket,
  SaveIcon,
  SettingsIcon,
  ShieldCheck,
  ShieldIcon,
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
import { useAuth } from "@/hooks/use-auth";

// This is sample data.
const data = {
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
  const router = useRouter();
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
        title: "Verify",
        url: "/create/verify",
        icon: ShieldCheck,
        isActive: currentPath === "/create/verify",
      },
    ];
  }, [currentPath]);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="py-6 px-4">
          <img className="h-8" src="/opruaas.png" alt="logo" />
        </div>
      </SidebarHeader>
      <SidebarContent className="px-2">
        <NavMain items={navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter className="pb-4 px-4">
        <Button variant={"secondary"} className={"w-full h-[74px]"}>
          <img className="h-[45px]" src="/wakeuplabs.png" alt="logo" />
        </Button>

        <Button
          variant={"ghost"}
          onClick={() => router.navigate({ to: "/auth/signin" })}
        >
          <LogInIcon className="h-4 w-4" />
          <span>Login</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
