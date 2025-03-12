export const useOrder = ({ id }: { id: bigint }) => {
  // TODO: unmock

  return {
    name: "mock rollup",
    id: 1n,
    fulfilledAt: 0n,
    terminatedAt: 0n,
    provider: {
      sequencer: "0x123",
      batcher: "0x123",
      proposer: "0x123",
      challenger: "0x123",
    },
    network: { l1ChainId: 1n },
    addresses: {
      systemConfigProxy: "0x123",
      l2OutputOracleProxy: "0x123",
      systemOwnerSafe: "0x123",
      proxyAdmin: "0x123",
    },
  };
};
