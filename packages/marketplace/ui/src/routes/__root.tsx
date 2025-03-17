import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

const TanStackRouterDevtools =
  process.env.NODE_ENV === "production"
    ? () => null // Render nothing in production
    : () => null; // Render nothing in production

// React.lazy(() =>
//     import("@tanstack/router-devtools").then((res) => ({
//       default: res.TanStackRouterDevtools,
//     }))
//   );

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  component: () => (
    <>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="bg-gray-50 min-h-screen w-full">
          <Outlet />
          <TanStackRouterDevtools />
        </SidebarInset>
      </SidebarProvider>
    </>
  ),
});
