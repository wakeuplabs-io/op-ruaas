import { queryOptions, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/main";
import { Deployment, DeploymentService } from "../services/deployment";

class QueryKeyFactory {
  static deploymentsByOwner(ownerId: string): string[] {
    return ["deployments", ownerId];
  }

  static deploymentById(ownerId: string, id: string): string[] {
    return ["deployment", ownerId, id];
  }
}

export const useCreateDeploymentMutation = () => {
  return useMutation({
    mutationFn: (data: Deployment) => DeploymentService.create(data),
    onSuccess: (deployment) => {
      queryClient.invalidateQueries({
        queryKey: QueryKeyFactory.deploymentsByOwner(deployment.owner_id),
      });
    },
  });
};

export const deploymentsByOwner = (ownerId?: string) => {
  return queryOptions({
    queryKey: QueryKeyFactory.deploymentsByOwner(ownerId!),
    queryFn: () => DeploymentService.findByOwner(),
    initialData: [] as Deployment[],
    enabled: !!ownerId,
  });
};

export const deploymentById = (ownerId?: string, id?: string) => {
  return queryOptions({
    queryKey: QueryKeyFactory.deploymentById(ownerId!, id!),
    queryFn: () => DeploymentService.findById(id!),
    enabled: !!ownerId && !!id,
  });
};

export const useUpdateDeploymentMutation = () => {
  return useMutation({
    mutationFn: (data: Deployment) => DeploymentService.update(data),
    onSuccess: (deployment) => {
      queryClient.invalidateQueries({
        queryKey: QueryKeyFactory.deploymentsByOwner(deployment.owner_id),
      });
      queryClient.invalidateQueries({
        queryKey: QueryKeyFactory.deploymentById(
          deployment.owner_id,
          deployment.id
        ),
      });
    },
  });
};

export const useDeleteDeploymentMutation = () => {
  return useMutation({
    mutationFn: async (id: string) => DeploymentService.delete(id),
    onSuccess: (deployment) => {
      queryClient.invalidateQueries({
        queryKey: QueryKeyFactory.deploymentsByOwner(deployment.owner_id),
      });
    },
  });
};
