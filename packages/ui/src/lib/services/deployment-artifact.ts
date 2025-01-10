import { api } from "../api";

export type DeploymentArtifact = Blob;

export class DeploymentArtifactService {
  static async set(deploymentId: string, artifact: File): Promise<void> {
    const data = new FormData();
    data.append("artifact.zip", artifact, "artifact.zip");

    await api.put(`deployments/${deploymentId}/artifact`, data, {
      headers: {
        'content-type': 'multipart/form-data'
      }
    });
  }

  static async findById(deploymentId: string): Promise<Blob> {
    const res = await api.get(`deployments/${deploymentId}/artifact`, {
      responseType: "blob",
    });

    return res.data;
  }

  static async exists(deploymentId: string): Promise<boolean> {
    try {
      const res = await api.head(`deployments/${deploymentId}/artifact`);
      return res.status === 200;
    } catch (e) {
      return false;
    }
  }

  static async delete(deploymentId: string): Promise<void> {
    await api.delete(`deployments/${deploymentId}/artifact`);
  }
}
