import { ScrollText } from "lucide-react";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Link } from "@tanstack/react-router";

export function NavDeployments({
  deployments,
}: {
  deployments: {
    id: string;
    name: string;
  }[];
}) {

  if (deployments.length === 0) {
    return null;
  }
  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>My Deployments</SidebarGroupLabel>
      <SidebarMenu>
        {deployments.map((item) => (
          <SidebarMenuItem key={item.id}>
            <SidebarMenuButton asChild>
              <Link to="/app/deployments/$id" params={{ id: item.id }}>
                <ScrollText className="text-sidebar-foreground/70" />
                <span>{item.name}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
