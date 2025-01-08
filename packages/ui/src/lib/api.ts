import { fetchAuthSession } from "aws-amplify/auth";
import axios from 'axios';

export type Deployment = {
    id: string;
    owner_id: string;
    release_tag: string,
    release_registry: string,
    infra_base_url?: string,
    contracts_addresses?: { [key: string]: string },
    network_config: any,
    accounts_config: any
}

export class ApiService {
    private static axiosInstance = axios.create({
        baseURL: import.meta.env.VITE_SERVER_URL,
        timeout: 5000,
        headers: {
            'Content-Type': 'application/json',
        },
    });

    private static async getBearerToken() {
        const token = (await fetchAuthSession()).tokens?.idToken
        return token;
    }

    static async deploymentsByOwner(): Promise<Deployment[]> {
        try {
            const res = await this.axiosInstance.get("deployments", {
                headers: {
                    Authorization: `Bearer ${await this.getBearerToken()}`
                }
            });

            return res.data
        } catch (e) {
            return []
        }
    }

    static async deploymentById(id: string): Promise<Deployment> {
        const res = await this.axiosInstance.get(`deployments/${id}`, {
            headers: {
                Authorization: `Bearer ${await this.getBearerToken()}`
            }
        })

        return res.data
    }
}