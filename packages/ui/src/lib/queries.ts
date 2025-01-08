import { queryOptions, useMutation } from "@tanstack/react-query"
import { ApiService, Deployment } from "./api"
import { queryClient } from "@/main"


export class QueryKeyFactory {
    static deploymentsByOwner(ownerId: string): string[] {
        return ["deployments", ownerId]
    }

    static deploymentById(ownerId: string, id: string): string[] {
        return ["deployment", ownerId, id]
    }

    static deploymentArtifactById(ownerId: string, id: string): string[] {
        return ["deploymentArtifact", ownerId, id]
    }

    static hasDeploymentArtifact(ownerId: string, id: string): string[] {
        return ["hasDeploymentArtifact", ownerId, id]
    }
}

export const deploymentsByOwner = (ownerId?: string) => {
    return queryOptions({
        queryKey: QueryKeyFactory.deploymentsByOwner(ownerId!),
        queryFn: () => ApiService.deploymentsByOwner(),
        initialData: [] as Deployment[],
        enabled: !!ownerId,
    })
}

export const deploymentById = (ownerId?: string, id?: string) => {
    return queryOptions({
        queryKey: QueryKeyFactory.deploymentById(ownerId!, id!),
        queryFn: () => ApiService.deploymentById(id!),
        enabled: !!ownerId && !!id
    })
}

export const deploymentHasArtifactById = (ownerId?: string, id?: string) => {
    return queryOptions({
        queryKey: QueryKeyFactory.hasDeploymentArtifact(ownerId!, id!),
        queryFn: () => ApiService.hasDeploymentArtifact(id!),
        enabled: !!ownerId && !!id
    })
}

export const useCreateProjectMutation = () => {
    return useMutation({
        mutationFn: (data: {
            mainnet: boolean,
            chainId: number,
            governanceSymbol: string,
            governanceName: string
        }) => ApiService.createProject(data.mainnet, data.chainId, data.governanceSymbol, data.governanceName),
    })
}

export const useCreateDeploymentMutation = () => {
    return useMutation({
        mutationFn: (data: Deployment) => ApiService.createDeployment(data),
        onSuccess: (deployment) => {
            queryClient.invalidateQueries({
                queryKey: QueryKeyFactory.deploymentsByOwner(deployment.owner_id)
            })
        }
    })
}

export const useUpdateDeploymentMutation = () => {
    return useMutation({
        mutationFn: (data: Deployment) => ApiService.updateDeployment(data),
        onSuccess: (deployment) => {
            queryClient.invalidateQueries({
                queryKey: QueryKeyFactory.deploymentsByOwner(deployment.owner_id)
            });
            queryClient.invalidateQueries({
                queryKey: QueryKeyFactory.deploymentById(deployment.owner_id, deployment.id)
            });
        }
    })
}

export const useDeleteDeploymentMutation = () => {
    return useMutation({
        mutationFn: async (id: string) =>  ApiService.deleteDeployment(id),
        onSuccess: (deployment) => {
            queryClient.invalidateQueries({
                queryKey: QueryKeyFactory.deploymentsByOwner(deployment.owner_id)
            })
        }
    })
}


export const useUpdateDeploymentArtifactMutation = () => {
    return useMutation({
        // mutationFn: (data: any) => ApiService.updateDeploymentArtifact(data),
        onSuccess: () => {
            queryClient.invalidateQueries({
                // queryKey: QueryKeyFactory.deploymentsByOwner(data.owner_id)
            })
        }
    })
}

