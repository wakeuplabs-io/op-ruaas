import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { useQuery, type QueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/hooks/use-auth";
import { deploymentsByOwner } from "@/lib/queries/deployment";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar/app-sidebar";

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  component: RouteComponent
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
