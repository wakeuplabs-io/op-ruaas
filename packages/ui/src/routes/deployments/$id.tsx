import { createFileRoute } from "@tanstack/react-router";
import { DeploymentValue } from "@/components/ui/deployment-value";
import { Button } from "@/components/ui/button";
import {
  Download,
  Edit,
  MoreHorizontal,
  Trash2,
  Upload,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card } from "@/components/ui/card";
import { SidebarLayout } from "@/layouts/sidebar";

export const Route = createFileRoute("/deployments/$id")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <SidebarLayout
      title="Deployments"
      breadcrumb={[{ id: 0, label: "Holensky" }]}
    >
      <Card className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-bold text-xl">Holensky</h1>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal />
                <span className="sr-only">More</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-48 rounded-lg"
              side="right"
              align="start"
            >
              <DropdownMenuItem>
                <Edit className="text-muted-foreground" />
                <span>Update name</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Upload className="text-muted-foreground" />
                <span>Upload artifacts.zip</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Upload className="text-muted-foreground" />
                <span>Upload deployment.json</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Trash2 className="text-muted-foreground" />
                <span>Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-2">
          <h2 className="text-sm">Infrastructure</h2>
          <ul className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            <li>
              <DeploymentValue
                value="0xDc64a14...F6C9"
                description="Explorer url"
              />
            </li>
            <li>
              <DeploymentValue value="0xDc64a14...F6C9" description="Rpc url" />
            </li>
            <li>
              <DeploymentValue
                value="0xDc64a14...F6C9"
                description="Monitoring url"
              />
            </li>
          </ul>
        </div>

        <div className="space-y-2">
          <h2 className="text-sm">Addresses</h2>
          <ul className="grid gap-3  grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            <li>
              <DeploymentValue
                value="0xDc64a14...F6C9"
                description="Explorer url"
              />
            </li>
            <li>
              <DeploymentValue
                value="0xDc64a14...F6C9"
                description="Explorer url"
              />
            </li>
            <li>
              <DeploymentValue
                value="0xDc64a14...F6C9"
                description="Explorer url"
              />
            </li>
            <li>
              <DeploymentValue
                value="0xDc64a14...F6C9"
                description="Explorer url"
              />
            </li>
            <li>
              <DeploymentValue
                value="0xDc64a14...F6C9"
                description="Explorer url"
              />
            </li>
            <li>
              <DeploymentValue
                value="0xDc64a14...F6C9"
                description="Explorer url"
              />
            </li>
            <li>
              <DeploymentValue
                value="0xDc64a14...F6C9"
                description="Explorer url"
              />
            </li>
            <li>
              <DeploymentValue
                value="0xDc64a14...F6C9"
                description="Explorer url"
              />
            </li>
            <li>
              <DeploymentValue
                value="0xDc64a14...F6C9"
                description="Explorer url"
              />
            </li>
            <li>
              <DeploymentValue
                value="0xDc64a14...F6C9"
                description="Explorer url"
              />
            </li>
            <li>
              <DeploymentValue
                value="0xDc64a14...F6C9"
                description="Explorer url"
              />
            </li>
          </ul>
        </div>
      </Card>

      <Button
        size="lg"
        variant="secondary"
        className="w-full mt-6 rounded-full font-medium"
      >
        Download artifacts <Download />
      </Button>
    </SidebarLayout>
  );
}
