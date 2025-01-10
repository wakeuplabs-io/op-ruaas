import { createFileRoute, useRouter } from '@tanstack/react-router'
import { DeploymentValue } from '@/components/ui/deployment-value'
import { Button } from '@/components/ui/button'
import { Download, Edit, MoreHorizontal, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Card } from '@/components/ui/card'
import { getCurrentUser } from 'aws-amplify/auth'
import { useSuspenseQueries } from '@tanstack/react-query'
import { useAuth } from '@/lib/hooks/use-auth'
import { capitalize } from '@/lib/strings'
import { useCallback, useState } from 'react'
import { UpdateDeploymentNameDialog } from '@/components/update-deployment-name-dialog'
import {
  deploymentById,
  useDeleteDeploymentMutation,
} from '@/lib/queries/deployment'
import {
  deploymentArtifactExists,
  useDownloadDeploymentArtifact,
} from '@/lib/queries/deployment-artifact'
import { Deployment } from '@/lib/services/deployment'
import { useToast } from '@/lib/hooks/use-toast'
import { BreadcrumbHeader } from '@/components/breadcrumb-header'

export const Route = createFileRoute('/app/deployments/$id')({
  component: RouteComponent,
  loader: async ({ params: { id }, context: { queryClient } }) => {
    const user = await getCurrentUser()
    queryClient.ensureQueryData(deploymentById(user.userId, id))
    queryClient.ensureQueryData(deploymentArtifactExists(user.userId, id))
  },
})

function RouteComponent() {
  const { user } = useAuth()
  const { toast } = useToast()
  const { id } = Route.useParams()

  const [{ data: deployment }, { data: deploymentHasArtifact }] =
    useSuspenseQueries({
      queries: [
        deploymentById(user?.userId, id),
        deploymentArtifactExists(user?.userId, id),
      ],
    })
  const { mutateAsync: downloadArtifact, isPending: isDownloading } =
    useDownloadDeploymentArtifact()

  const onDownload = useCallback(async () => {
    if (!id) return

    try {
      const res = await downloadArtifact(id)
      const url = window.URL.createObjectURL(res)
      window.open(url, '_blank')
    } catch (e) {
      toast({
        title: 'Error',
        description: 'Failed to create project',
        variant: 'destructive',
      })
    }
  }, [id, downloadArtifact])

  return (
    <>
      <BreadcrumbHeader
        title="Deployments"
        breadcrumb={[{ id: 0, label: capitalize(deployment.name) }]}
      />

      <main className="p-4 pt-0 pb-20">
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
                  ),
                )}
              </ul>
            </div>
          )}

          {!deployment.contracts_addresses && !deployment.infra_base_url && (
            <div className="space-y-2">
              <h2 className="text-sm">
                No deployment outputs. Deploy locally and upload new outputs
                from the menu
              </h2>
            </div>
          )}
        </Card>

        {deploymentHasArtifact && (
          <Button
            size="lg"
            variant="secondary"
            className="w-full mt-6 rounded-full font-medium"
            isPending={isDownloading}
            onClick={onDownload}
          >
            Download artifacts <Download />
          </Button>
        )}
      </main>
    </>
  )
}

const OptionsMenu: React.FC<{ deployment: Deployment }> = ({ deployment }) => {
  const { navigate } = useRouter()
  const [updateOpen, setUpdateOpen] = useState(false)
  const { mutateAsync: deleteDeployment } = useDeleteDeploymentMutation()

  const onDelete = useCallback(() => {
    if (window.confirm("Are you sure? There's no way back")) {
      deleteDeployment(deployment.id).then(() => {
        navigate({ to: '/app' })
      })
    }
  }, [navigate, deleteDeployment, deployment])

  const onUpdateName = useCallback(() => {
    setUpdateOpen(true)
  }, [])

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
  )
}
