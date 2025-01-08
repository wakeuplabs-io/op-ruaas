import { createFileRoute, useRouter } from "@tanstack/react-router";
import { DeploymentValue } from "@/components/ui/deployment-value";
import { Button } from "@/components/ui/button";
import { Download, Edit, MoreHorizontal, Trash2, Upload } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card } from "@/components/ui/card";
import { SidebarLayout } from "@/layouts/sidebar";
import {
  deploymentById,
  deploymentHasArtifactById,
  useDeleteDeploymentMutation,
} from "@/lib/queries";
import { getCurrentUser } from "aws-amplify/auth";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/hooks/use-auth";
import { capitalize } from "@/lib/strings";
import { useCallback, useState } from "react";
import { UpdateDeploymentNameDialog } from "@/components/update-deployment-name-dialog";

export const Route = createFileRoute("/deployments/$id")({
  component: RouteComponent,
  loader: async ({ params: { id }, context: { queryClient } }) => {
    const user = await getCurrentUser();
    queryClient.ensureQueryData(deploymentById(user.userId, id));
    queryClient.ensureQueryData(deploymentHasArtifactById(user.userId, id));
  },
});

function RouteComponent() {
  const { user } = useAuth();
  const { navigate } = useRouter();
  const { id } = Route.useParams();
  const [updateOpen, setUpdateOpen] = useState(false);

  const { data: deployment } = useSuspenseQuery(
    deploymentById(user?.userId, id)
  );
  const { data: deploymentHasArtifact } = useSuspenseQuery(
    deploymentHasArtifactById(user?.userId, id)
  );
  
  const { mutateAsync: deleteDeployment } = useDeleteDeploymentMutation();

  const onDelete = useCallback(() => {
    if (window.confirm("Are you sure? There's no way back")) {
      deleteDeployment(id).then(() => {
        navigate({ to: "/" });
      });
    }
  }, [navigate, deleteDeployment, id]);

  const onUpdateName = useCallback(() => {
    setUpdateOpen(true);
  }, []);

  return (
    <SidebarLayout
      title="Deployments"
      breadcrumb={[{ id: 0, label: capitalize(deployment.name) }]}
    >
      <UpdateDeploymentNameDialog
        open={updateOpen}
        setOpen={setUpdateOpen}
        deployment={deployment}
      />

      <input type="file" id="deployment" className="hidden" />
      <input type="file" id="artifact" className="hidden" />

      <Card className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-bold text-xl">{capitalize(deployment.name)}</h1>
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
              <DropdownMenuItem onClick={onUpdateName}>
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
              <DropdownMenuItem onClick={onDelete}>
                <Trash2 className="text-muted-foreground" />
                <span>Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {deployment.infra_base_url && (
          <div className="space-y-2">
            <h2 className="text-sm">Infrastructure</h2>
            <ul className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              <li>
                <DeploymentValue
                  value={`${deployment.infra_base_url}`}
                  description="Explorer url"
                />
              </li>
              <li>
                <DeploymentValue
                  value={`${deployment.infra_base_url}/rpc`}
                  description="Rpc url"
                />
              </li>
              <li>
                <DeploymentValue
                  value={`${deployment.infra_base_url}/monitoring`}
                  description="Monitoring url"
                />
              </li>
            </ul>
          </div>
        )}

        {deployment.contracts_addresses && (
          <div className="space-y-2">
            <h2 className="text-sm">Addresses</h2>
            <ul className="grid gap-3  grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {Object.entries(deployment.contracts_addresses).map(
                ([key, value]) => (
                  <li>
                    <DeploymentValue
                      value={value}
                      description={capitalize(key)}
                    />
                  </li>
                )
              )}
            </ul>
          </div>
        )}
      </Card>

      {deploymentHasArtifact && (
        <Button
          size="lg"
          variant="secondary"
          className="w-full mt-6 rounded-full font-medium"
        >
          Download artifacts <Download />
        </Button>
      )}
    </SidebarLayout>
  );
}
