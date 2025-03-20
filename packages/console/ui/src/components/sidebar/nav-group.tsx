import { type LucideIcon } from "lucide-react";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Link, useRouterState } from "@tanstack/react-router";

export function NavGroup({
  title,
  items,
}: {
  title?: string;
  items: {
    title: string;
    url: string;
    icon: LucideIcon;
  }[];
}) {
  const router = useRouterState();
  const currentPath = router.location.pathname;

  return (
    <SidebarGroup>
      {title && <SidebarGroupLabel>{title}</SidebarGroupLabel>}
      <SidebarMenu>
        {items.map((item, index) => (
          <SidebarMenuItem key={index}>
            <SidebarMenuButton
              isActive={item.url === currentPath}
              asChild
              tooltip={item.title}
              className="h-10 px-2"
            >
              <Link to={item.url}>
                <item.icon className="h-5 w-5"/>
                <span>{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
