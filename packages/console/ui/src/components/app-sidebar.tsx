import * as React from "react";
import { LogInIcon, Rocket, SettingsIcon, ShieldCheck } from "lucide-react";
import { useRouter } from "@tanstack/react-router";
import { NavMain } from "@/components/nav-main";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { NavDeployments } from "./nav-deployments";
import { Button, buttonVariants } from "./ui/button";
import { useAuth } from "@/lib/hooks/use-auth";
import { capitalize } from "@/lib/strings";
import { Deployment } from "@/lib/services/deployment";
import { cn } from "@/lib/utils";

const navMain = [
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
  const router = useRouter();
  const { user, signOut } = useAuth();

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

      <SidebarFooter className="pb-4 px-4">
        <a href="https://www.wakeuplabs.io/" target="_blank" className={cn(buttonVariants({ variant: "secondary" }), "w-full h-[74px]")}>
          <img className="h-[45px]" src="/wakeuplabs.png" alt="logo" />
        </a>

        {user ? (
          <Button variant="ghost" onClick={() => signOut()}>
            <LogInIcon className="h-4 w-4" />
            <span>Logout</span>
          </Button>
        ) : (
          <Button
            variant="ghost"
            onClick={() => router.navigate({ to: "/auth/signin" })}
          >
            <LogInIcon className="h-4 w-4" />
            <span>Login</span>
          </Button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
