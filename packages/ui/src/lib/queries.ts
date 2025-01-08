import { queryOptions, useMutation } from "@tanstack/react-query"
import { ApiService, Deployment } from "./api"


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