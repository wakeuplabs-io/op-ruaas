import { Button } from "@/components/ui/button";
import React, { useMemo, useState } from "react";
import { cn, formatTokenAmount, formatRemainingTime } from "@/lib/utils";
import { BookDown, TriangleAlert } from "lucide-react";
import { DeploymentValue } from "./deployment-value";
import { DepositModal } from "./deposit-modal";

export const RollupActions: React.FC<{
  rpcUrl: string;
  l2ChainId: number;
  pricePerMonth: bigint;
  balance: bigint;
  orderId: bigint;
  terminatedAt: bigint;
}> = ({ pricePerMonth, balance, l2ChainId, rpcUrl, orderId, terminatedAt }) => {
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
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
      {terminatedAt > 0n ? (
        <h2 className="mt-4 text-2xl font-semibold text-alert-border">
          Unsubscribed
        </h2>
      ) : (
        <div className="py-4">
          <h1 className={cn("text-4xl font-bold", `text-${statusColor}`)}>
            {remainingTimeString}
          </h1>
          <p className="text-gray-500 mt-1">
            ${formatTokenAmount(balance || 0n)}
          </p>
        </div>
      )}

      <div className="flex justify-between items-center gap-4  mt-5">
        {terminatedAt > 0n ? (
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
            className="w-32 h-12 flex items-center justify-center gap-2"
            onClick={() => setIsDepositModalOpen(true)}
          >
            <BookDown className="h-5 w-5" />
            Deposit
          </Button>
        )}

        <div className="flex gap-4">
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

      <DepositModal
        orderId={orderId}
        pricePerMonth={pricePerMonth}
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
      />
    </div>
  );
};
