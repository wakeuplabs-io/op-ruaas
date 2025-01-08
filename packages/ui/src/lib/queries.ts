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
}

export const deploymentsByOwner = (ownerId?: string) => {
    return queryOptions({
        queryKey: ['deployments', ownerId],
        queryFn: () => ApiService.deploymentsByOwner(),
        initialData: [] as Deployment[],
        enabled: !!ownerId,
    })
}

export const deploymentById = (ownerId?: string, id?: string) => {
    return queryOptions({
        queryKey: ['deployment', ownerId, id],
        queryFn: () => ApiService.deploymentById(id!),
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
    })
}

export const useUpdateDeploymentMutation = () => {
    return useMutation({
        mutationFn: (data: Deployment) => ApiService.updateDeployment(data),
        onSuccess: () => {
            queryClient.invalidateQueries({
                // queryKey: QueryKeyFactory.deploymentsByOwner(data.owner_id)
                // queryKey: QueryKeyFactory.deploymentById(data.owner_id)
            })
        }
    })
}

export const useDeleteDeploymentMutation = () => {
    return useMutation({
        mutationFn: (id: string) => ApiService.deleteDeployment(id),
        onSuccess: () => {
            queryClient.invalidateQueries({
                // queryKey: QueryKeyFactory.deploymentsByOwner(data.owner_id)
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

export const useGetDeploymentArtifacts = () => {
    return useMutation({
        // mutationFn: (data: any) => ApiService.updateDeploymentArtifact(data),
        onSuccess: () => {
            queryClient.invalidateQueries({
                // queryKey: QueryKeyFactory.deploymentsByOwner(data.owner_id)
            })
        }
    })
}