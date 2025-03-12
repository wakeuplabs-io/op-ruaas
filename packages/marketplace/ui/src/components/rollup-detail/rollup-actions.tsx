import { Button } from "@/components/ui/button";
import { useMemo, useState } from "react";
import { Offer } from "@/types";
import { cn, formatTokenAmount, formatRemainingTime } from "@/lib/utils";
import { BookDown } from "lucide-react";
import { DeploymentValue } from "../deployment-value";

interface RollupActionsProps {
  orderId: string;
  offer: Offer | null;
  balance: bigint;
}

export function RollupActions({ offer, balance }: RollupActionsProps) {
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);

  const remainingTimeString = useMemo(() => {
    if (!offer?.pricePerMonth || balance === 0n) return "-";
    return formatRemainingTime(balance, offer.pricePerMonth);
  }, [offer, balance]);

  const statusColor = useMemo(() => {
    if (!offer?.pricePerMonth || balance === 0n) return "red-500";
    const daysRemaining = balance / (offer.pricePerMonth / 30n);
    if (daysRemaining < 1n) return "red-500";
    if (daysRemaining < 30n) return "yellow-500";
    return "gray-800";
  }, [offer, balance]);

  return (
    <div>
      <div className="py-4">
        <h1 className={cn("text-4xl font-bold", `text-${statusColor}`)}>
          {remainingTimeString}
        </h1>
        <p className="text-gray-500 mt-1">
          ${formatTokenAmount(balance || 0n)}
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

      {/* <DepositModal
        orderId={orderId}
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
        plans={plans}
      /> */}
    </div>
  );
}
