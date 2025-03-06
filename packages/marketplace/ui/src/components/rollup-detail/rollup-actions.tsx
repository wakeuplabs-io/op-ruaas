import { Button } from "@/components/ui/button";
import { DepositModal } from "./deposit-modal";
import { useEffect, useState } from "react";
import { useGetBalance } from "@/hooks/use-get-balance";
import { Offer, Plan } from "@/types";
import {
  cn,
  formatTokenAmount,
  calculateStatusColor,
  formatRemainingTime,
} from "@/lib/utils";

interface RollupActionsProps {
  orderId: string;
  offer: Offer | null;
  setStatusColor: (color: string) => void;
  statusColor: string;
}

export function RollupActions({
  orderId,
  offer,
  setStatusColor,
  statusColor,
}: RollupActionsProps) {
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [plans, setPlans] = useState<Plan[]>();
  const [displayBalance, setDisplayBalance] = useState<string>("-");
  const { balance, isLoading, refetch } = useGetBalance(orderId);

  useEffect(() => {
    if (!offer) return;

    setPlans([
      { months: 1n, pricePerMonth: offer.pricePerMonth },
      { months: 3n, pricePerMonth: offer.pricePerMonth },
      { months: 6n, pricePerMonth: offer.pricePerMonth },
      { months: 12n, pricePerMonth: offer.pricePerMonth },
    ]);
  }, [offer]);

  useEffect(() => {
    if (!isLoading && balance !== undefined && offer) {
      setStatusColor(calculateStatusColor(balance, offer.pricePerMonth));
      setDisplayBalance(formatRemainingTime(balance, offer.pricePerMonth));
    }
  }, [balance, isLoading, offer, setStatusColor]);
  return (
    <div className="mb-6">
      <div className={"p-4"}>
        <h1 className={cn("text-4xl font-bold", `text-${statusColor}`)}>
          {isLoading ? "-" : displayBalance}
        </h1>
        <p className="text-gray-500 mt-1">
          ${isLoading ? "-" : formatTokenAmount(balance || 0n)}
        </p>
      </div>

      <div className="flex gap-4 mt-4">
        <Button variant="outline" onClick={() => setIsDepositModalOpen(true)}>
          Deposit
        </Button>
      </div>

      <DepositModal
        orderId={orderId}
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
