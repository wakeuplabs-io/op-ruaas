import { useChainId, useSwitchChain } from "wagmi";

export const useEnsureChain = () => {
  const currentChainId = useChainId();
  const { switchChainAsync, chains } = useSwitchChain();

  const ensureChainId = async (chainId: number) => {
    if (currentChainId !== chainId) {
      const l1Chain = chains.find((chain) => chain.id === chainId);
      if (!l1Chain) {
        throw new Error("L1 chain not found");
      }

      await switchChainAsync({
        chainId: l1Chain.id,
        addEthereumChainParameter: {
          chainName: l1Chain.name,
          nativeCurrency: l1Chain.nativeCurrency,
          rpcUrls: [l1Chain.rpcUrls.default.http[0]],
        },
      });
    }
  };

  return { ensureChainId };
};
