import { api } from "../api";

export type Deployment = {
  id: string;
  name: string;
  owner_id: string;
  release_tag: string;
  release_registry: string;
  infra_base_url: string | null;
  contracts_addresses: string | null;
  network_config: any;
  accounts_config: any;
};

export class DeploymentService {
  static async create(deployment: Deployment): Promise<Deployment> {
    const res = await api.post("deployments", deployment);
    return res.data;
  }

  static async findByOwner(): Promise<Deployment[]> {
    try {
      const res = await api.get("deployments");
      return res.data;
    } catch (e) {
      return [];
    }
  }

  static async findById(id: string): Promise<Deployment> {
    const res = await api.get(`deployments/${id}`); 
    return res.data;
  }

  static async update(deployment: Deployment): Promise<Deployment> {
    const res = await api.put(`deployments/${deployment.id}`, deployment);
    return res.data;
  }

  static async delete(id: string): Promise<Deployment> {
    const res = await api.delete(`deployments/${id}`);
    return res.data;
  }
}
