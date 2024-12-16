import { l1BlockTimes } from "@/config/l1-block-times";
import { NetworkConfig } from "@/config/network-config";
import axios from "axios";


export class ApiService {

    static buildChainConfig(l1ChainId: number, config: NetworkConfig) {
        return axios.post(
            import.meta.env.VITE_SERVER_URL + '/build',
            {
                config: {
                    l1_chain_id: l1ChainId,
                    l1_block_time: l1BlockTimes[l1ChainId],
                    l1_use_clique: true,
                    ...config
                }
            },
            { responseType: 'blob' },
        )
    }

    static inspectContracts(artifact: File) {
        const formData = new FormData();
        formData.append("file", artifact);

        return axios.post(
            import.meta.env.VITE_SERVER_URL + "/inspect/contracts",
            formData,
            { headers: { "Content-Type": "multipart/form-data" } }
        );
    }

    static inspectInfra(artifact: File) {
        const formData = new FormData();
        formData.append("file", artifact);

        return axios.post(
            import.meta.env.VITE_SERVER_URL + "/inspect/infra",
            formData,
            { headers: { "Content-Type": "multipart/form-data" } }
        );
    }
}