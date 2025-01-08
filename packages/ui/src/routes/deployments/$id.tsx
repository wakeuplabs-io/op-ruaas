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
import { useSuspenseQueries } from "@tanstack/react-query";
import { useAuth } from "@/lib/hooks/use-auth";
import { capitalize } from "@/lib/strings";
import { useCallback, useState } from "react";
import { UpdateDeploymentNameDialog } from "@/components/update-deployment-name-dialog";
import { Deployment } from "@/lib/api";

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
  const { id } = Route.useParams();

  const [{ data: deployment }, { data: deploymentHasArtifact }] =
    useSuspenseQueries({
      queries: [
        deploymentById(user?.userId, id),
        deploymentHasArtifactById(user?.userId, id),
      ],
    });

  return (
    <SidebarLayout
      title="Deployments"
      breadcrumb={[{ id: 0, label: capitalize(deployment.name) }]}
    >
      <Card className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-bold text-xl">{capitalize(deployment.name)}</h1>
          <OptionsMenu deployment={deployment} />
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

        {!deployment.contracts_addresses && !deployment.infra_base_url && (
          <div className="space-y-2">
            <h2 className="text-sm">No deployment outputs. Deploy locally and upload new outputs from the menu</h2>
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

const OptionsMenu: React.FC<{ deployment: Deployment }> = ({ deployment }) => {
  const { navigate } = useRouter();
  const [updateOpen, setUpdateOpen] = useState(false);
  const { mutateAsync: deleteDeployment } = useDeleteDeploymentMutation();

  const onDelete = useCallback(() => {
    if (window.confirm("Are you sure? There's no way back")) {
      deleteDeployment(deployment.id).then(() => {
        navigate({ to: "/" });
      });
    }
  }, [navigate, deleteDeployment, deployment]);

  const onUpdateName = useCallback(() => {
    setUpdateOpen(true);
  }, []);

  return (
    <>
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
          {/* TODO: */}
          {/* <DropdownMenuItem>
            <Upload className="text-muted-foreground" />
            <span>Update artifacts.zip</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Upload className="text-muted-foreground" />
            <span>Update deployment.json</span>
          </DropdownMenuItem> */}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onDelete}>
            <Trash2 className="text-muted-foreground" />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <UpdateDeploymentNameDialog
        open={updateOpen}
        setOpen={setUpdateOpen}
        deployment={deployment}
      />

      <input type="file" id="deployment" className="hidden" />
      <input type="file" id="artifact" className="hidden" />
    </>
  );
};
