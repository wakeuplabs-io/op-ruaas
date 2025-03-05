import { Button } from "@/components/ui/button";
import { DepositModal } from "./deposit-modal";
import { useState } from "react";
import { useGetBalance } from "@/hooks/use-get-balance";

interface RollupActionsProps {
  orderId: string;
}

export function RollupActions({ orderId }: RollupActionsProps) {
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);

  const { balance, isLoading } = useGetBalance(orderId);
  console.log("balance", balance);
  return (
    <div className="mb-6">
      {!isLoading && <h1 className="text-4xl font-bold">{balance.toString(10)}</h1>}
      <p className="text-gray-500 mt-1">My Balance</p>
      <div className="flex gap-4 mt-4">
        <Button variant="outline" onClick={() => setIsDepositModalOpen(true)}>
          Deposit
        </Button>
      </div>
      <DepositModal
        orderId={orderId}
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
      />
    </div>
  );
}
