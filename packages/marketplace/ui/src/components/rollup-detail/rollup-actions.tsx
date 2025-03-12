import { Button } from "@/components/ui/button";
import { DepositModal } from "./deposit-modal";
import { useEffect, useState } from "react";
import { useBalance } from "@/lib/hooks/use-balance";
import { Order, Plan } from "@/types";
import {
  cn,
  formatTokenAmount,
  calculateStatusColor,
  formatRemainingTime,
} from "@/lib/utils";
import { BookDown, TriangleAlert } from "lucide-react";
import { DeploymentValue } from "../deployment-value";

interface RollupActionsProps {
  order: Order;
  setStatusColor: (color: string) => void;
  statusColor: string;
}
export function RollupActions({
  order,
  setStatusColor,
  statusColor,
}: RollupActionsProps) {
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [plans, setPlans] = useState<Plan[]>();
  const [displayBalance, setDisplayBalance] = useState<string>("-");
  const { balance, isLoading, refetch } = useBalance(order.id);

  useEffect(() => {
    if (!order) return;
    const { offer } = order;
    setPlans([
      { months: 1n, pricePerMonth: offer.pricePerMonth },
      { months: 3n, pricePerMonth: offer.pricePerMonth },
      { months: 6n, pricePerMonth: offer.pricePerMonth },
      { months: 12n, pricePerMonth: offer.pricePerMonth },
    ]);
  }, [order]);

  useEffect(() => {
    const { offer } = order;
    if (!isLoading && balance !== undefined && offer) {
      setStatusColor(calculateStatusColor(balance, offer.pricePerMonth));
      setDisplayBalance(formatRemainingTime(balance, offer.pricePerMonth));
    }
  }, [balance, isLoading, order, setStatusColor]);

  return (
    <div>
      {order.terminatedAt > 0n ? (
        <h2 className="mt-4 text-2xl font-semibold text-alert-border">
          Unsubscribed
        </h2>
      ) : (
        <div className="py-4">
          <h1 className={cn("text-4xl font-bold", `text-${statusColor}`)}>
            {isLoading ? "-" : displayBalance}
          </h1>
          <p className="text-gray-500 mt-1">
            ${isLoading ? "-" : formatTokenAmount(balance || 0n)}
          </p>
        </div>
      )}

      <div className="flex justify-between items-center gap-4 mt-2">
        {order.terminatedAt > 0n ? (
          <div className="mt-4">
            <div className=" p-4 bg-alert-background rounded-lg flex items-start gap-3">
              <TriangleAlert className="h-11 w-11 text-alert-border stroke-[1.5] flex-shrink-0" />
              <p className="text-sm text-alert-border">
                You're unsubscribed, but provider permissions are still active.
                Complete the process to revoke access.
              </p>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            onClick={() => setIsDepositModalOpen(true)}
            className="w-32 h-11 flex items-center justify-center gap-2"
          >
            <BookDown className="h-5 w-5" />
            Deposit
          </Button>
        )}

        <div className="flex gap-4">
          {[
            { label: "Chain ID", value: "0xDc64a14...F6C9" },
            { label: "RPC URL", value: "0xDc64a14...F6C9" },
          ].map((item, index) => (
            <DeploymentValue
              key={index}
              value={item.value}
              description={item.label}
              className="min-w-[250px]"
            />
          ))}
        </div>
      </div>

      <DepositModal
        orderId={order.id}
        isOpen={isDepositModalOpen}
        onClose={() => {
          setIsDepositModalOpen(false);
          refetch();
        }}
        plans={plans}
      />
    </div>
  );
}
