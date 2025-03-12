import { useOrders } from "./use-orders";

export function useOrder(orderId: bigint) {
  const { sequencerRollups, replicaRollups, isLoading, error, refetch } = useOrders();
  const order = [...sequencerRollups, ...replicaRollups].find(o => o.id === orderId);
  return { order, isLoading, error, refetch };
}
