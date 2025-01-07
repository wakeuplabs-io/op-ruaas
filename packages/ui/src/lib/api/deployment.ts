import { queryOptions } from "@tanstack/react-query";
import { QueryKeyFactory } from "./queries";
import { ApiService } from "./service";


export type Deployment = {
    id: string;
    owner_id: string;
    project_id: string;
    release_tag: string,
    release_registry: string,
    infra_base_url?: string,
    contracts_addresses?: string,
}

export const deploymentsByOwnerQueryOptions = (ownerId?: string) => {
    return queryOptions({
        queryKey: QueryKeyFactory.deploymentsByOwner(ownerId!),
        queryFn: () => ApiService.deploymentsByOwner(ownerId!),
        enabled: !!ownerId,
        initialData: [] as Deployment[],
    })
}