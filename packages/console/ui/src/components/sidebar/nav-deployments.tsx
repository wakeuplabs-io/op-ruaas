import { Ellipsis, ScrollText } from "lucide-react";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Sheet, SheetContent } from "../ui/sheet";
import { Input } from "../ui/input";

export function NavDeployments({
  deployments,
}: {
  deployments: {
    id: string;
    name: string;
  }[];
}) {
  const [showAll, setShowAll] = useState(false);
  const [search, setSearch] = useState("");

  const filteredDeployments = useMemo(
    () =>
      deployments.filter((item) =>
        item.name.toLowerCase().includes(search.toLowerCase())
      ),
    [search, deployments]
  );

  if (deployments.length === 0) {
    return null;
  }

  return (
    <>
      <SidebarGroup className="group-data-[collapsible=icon]:hidden">
        <SidebarGroupLabel>My Deployments</SidebarGroupLabel>
        <SidebarMenu>
          {deployments.slice(0, 2).map((item) => (
            <SidebarMenuItem key={item.id}>
              <SidebarMenuButton className="h-10 px-2" asChild>
                <Link to="/deployments/$id" params={{ id: item.id }}>
                  <ScrollText className="text-sidebar-foreground/70" />
                  <span>{item.name}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
          {deployments.length > 2 && (
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => setShowAll(true)}
                className="h-10 px-2"
                asChild
              >
                <button>
                  <Ellipsis className="text-sidebar-foreground/70" />
                  <span>Show all</span>
                </button>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarGroup>

      <Sheet open={showAll} onOpenChange={setShowAll}>
        <SheetContent side="left" className="w-[255px] p-4">
          <Input
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 mb-4"
          />
          <SidebarMenu>
            {filteredDeployments.map((item) => (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton className="h-10 px-2" asChild>
                  <Link onClick={() => setShowAll(false)} to="/deployments/$id" params={{ id: item.id }}>
                    <ScrollText className="text-sidebar-foreground/70" />
                    <span>{item.name}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}

            {filteredDeployments.length === 0 && (
              <SidebarMenuItem>
                <SidebarMenuButton className="h-10 px-2" asChild>
                  <span>No deployments found</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
          </SidebarMenu>
        </SheetContent>
      </Sheet>
    </>
  );
}
