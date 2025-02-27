import * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import {  buttonVariants } from "./ui/button";
import { cn } from "@/lib/utils";

export function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="py-6 px-4">
          <img className="h-8" src="/opruaas.png" alt="logo" />
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
      </SidebarContent>

      <SidebarFooter className="pb-4 px-4">
        <a href="https://www.wakeuplabs.io/" target="_blank" className={cn(buttonVariants({ variant: "secondary" }), "w-full h-[74px]")}>
          <img className="h-[45px]" src="/wakeuplabs.png" alt="logo" />
        </a>
      </SidebarFooter>
    </Sidebar>
  );
}
