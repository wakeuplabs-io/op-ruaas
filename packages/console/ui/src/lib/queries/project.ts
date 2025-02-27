import { useMutation } from "@tanstack/react-query"
import { ProjectService } from "../services/project"


export const useCreateProjectMutation = () => {
    return useMutation({
        mutationFn: (data: {
            mainnet: boolean,
            chainId: number,
            governanceSymbol: string,
            governanceName: string
        }) => ProjectService.create(data.mainnet, data.chainId, data.governanceSymbol, data.governanceName),
    })
}
