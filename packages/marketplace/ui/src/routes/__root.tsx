import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/lib/hooks/use-mobile";

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
  component: () => {
    const isMobile = useIsMobile();

    return (
      <>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset
            className={cn(
              "bg-gray-50 min-h-screen w-full transition-all",
              isMobile ? "pt-14" : ""
            )}
          >
            <Outlet />
            <TanStackRouterDevtools />
          </SidebarInset>
        </SidebarProvider>
      </>
    );
  },
});
