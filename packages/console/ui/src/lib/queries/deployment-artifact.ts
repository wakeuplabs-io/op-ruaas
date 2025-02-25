import { queryOptions, useMutation } from "@tanstack/react-query"
import { DeploymentArtifactService } from "../services/deployment-artifact"


class QueryKeyFactory {
    static exists(ownerId: string, id: string): string[] {
        return ["hasDeploymentArtifact", ownerId, id]
    }
}

export const useDownloadDeploymentArtifact = () => {
    return useMutation({
        mutationFn: async (id: string) => DeploymentArtifactService.findById(id),
    })
}

export const useSetDeploymentArtifactMutation = () => {
    return useMutation({
        mutationFn: (data: { deploymentId: string, artifact: File }) => DeploymentArtifactService.set(data.deploymentId, data.artifact),
    })
}

export const deploymentArtifactExists = (ownerId?: string, id?: string) => {
    return queryOptions({
        queryKey: QueryKeyFactory.exists(ownerId!, id!),
        queryFn: () => DeploymentArtifactService.exists(id!),
        enabled: !!ownerId && !!id
    })
}

