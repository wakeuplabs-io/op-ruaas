import { Button } from "@/components/ui/button";
import { DepositModal } from "./deposit-modal";
import { useEffect, useState } from "react";
import { useGetBalance } from "@/lib/hooks/use-get-balance";
import { Offer, Plan } from "@/types";
import {
  cn,
  formatTokenAmount,
  calculateStatusColor,
  formatRemainingTime,
} from "@/lib/utils";
import { BookDown } from "lucide-react";
import { DeploymentValue } from "../deployment-value";

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
    <div>
      <div className="py-4">
        <h1 className={cn("text-4xl font-bold", `text-${statusColor}`)}>
          {isLoading ? "-" : displayBalance}
        </h1>
        <p className="text-gray-500 mt-1">
          ${isLoading ? "-" : formatTokenAmount(balance || 0n)}
        </p>
      </div>

      <div className="flex justify-between items-center gap-4 mt-4">
        <Button
          variant="outline"
          onClick={() => setIsDepositModalOpen(true)}
          className="w-32 h-11 flex items-center justify-center gap-2"
        >
          <BookDown className="h-5 w-5" />
          Deposit
        </Button>

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
