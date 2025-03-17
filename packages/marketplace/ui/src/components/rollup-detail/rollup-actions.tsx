import { Button } from "@/components/ui/button";
import React, { useMemo } from "react";
import { cn, formatTokenAmount, formatRemainingTime } from "@/lib/utils";
import { BookDown } from "lucide-react";
import { DeploymentValue } from "./deployment-value";

export const RollupActions: React.FC<{
  rpcUrl: string;
  l2ChainId: number;
  pricePerMonth: bigint;
  balance: bigint;
}> = ({ pricePerMonth, balance, l2ChainId, rpcUrl }) => {
  const remainingTimeString = useMemo(() => {
    if (!pricePerMonth || balance === 0n) return "-";
    return formatRemainingTime(balance, pricePerMonth);
  }, [pricePerMonth, balance]);

  const statusColor = useMemo(() => {
    if (!pricePerMonth || balance === 0n) return "red-500";
    const daysRemaining = balance / (pricePerMonth / 30n);
    if (daysRemaining < 1n) return "red-500";
    if (daysRemaining < 30n) return "yellow-500";
    return "gray-800";
  }, [pricePerMonth, balance]);

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

      <div className="flex justify-between items-center gap-4 mt-8">
        <Button
          variant="outline"
          className="w-32 h-11 flex items-center justify-center gap-2 mt-8"
        >
          <BookDown className="h-5 w-5" />
          Deposit
        </Button>

        <div className="flex gap-4 mt-11">
          {[
            { label: "Chain ID", value: l2ChainId.toString() },
            { label: "RPC URL", value: rpcUrl },
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
};
