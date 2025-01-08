import React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { deploymentsByOwner } from "@/lib/queries";

export const SidebarLayout: React.FC<{
  children: React.ReactNode;
  title: string;
  breadcrumb?: { id: number; label: string }[];
  onBreadcrumbClick?: (id: number) => void;
}> = ({ children, title, breadcrumb, onBreadcrumbClick }) => {
  breadcrumb = breadcrumb || [];

  const { user } = useAuth();
  const { data: deployments } = useQuery(deploymentsByOwner(user?.userId));

  return (
    <SidebarProvider>
      <AppSidebar deployments={deployments} />
      <SidebarInset className="bg-gray-50 min-h-screen w-full">
        <header className="flex h-16 shrink-0 items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink className="font-semibold">
                  {title}
                </BreadcrumbLink>
              </BreadcrumbItem>

              {breadcrumb.length ? <BreadcrumbSeparator /> : null}

              {breadcrumb.map((s, index) => (
                <React.Fragment key={s.id}>
                  <BreadcrumbItem
                    className={cn({
                      "hidden md:block": index !== breadcrumb.length - 1,
                    })}
                  >
                    <BreadcrumbLink
                      onClick={() =>
                        onBreadcrumbClick && onBreadcrumbClick(s.id)
                      }
                      className={cn("cursor-pointer", {
                        "font-semibold": index === breadcrumb.length - 1,
                      })}
                    >
                      {s.label}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  {index < breadcrumb.length - 1 && (
                    <BreadcrumbSeparator className="hidden md:block" />
                  )}
                </React.Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <main className="p-4 pt-0 pb-20">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
};
