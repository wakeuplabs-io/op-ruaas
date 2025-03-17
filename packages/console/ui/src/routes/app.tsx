import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useAuth } from "@/lib/hooks/use-auth";
import { deploymentsByOwner } from "@/lib/queries/deployment";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/app")({
  component: RouteComponent,
});

function RouteComponent() {
  const { user } = useAuth();
  const { data: deployments } = useQuery(deploymentsByOwner(user?.id));

  return (
    <SidebarProvider>
      <AppSidebar deployments={deployments} />
      <SidebarInset className="bg-gray-50 min-h-screen w-full">
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}
