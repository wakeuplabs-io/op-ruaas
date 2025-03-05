import { Button } from "@/components/ui/button";
import { DepositModal } from "./deposit-modal";
import { useEffect, useState } from "react";
import { useGetBalance } from "@/hooks/use-get-balance";
import { Offer, Plan } from "@/types";

interface RollupActionsProps {
  orderId: string;
  offer: Offer
}

export function RollupActions({ orderId, offer }: RollupActionsProps) {
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [ plans, setPlans ] = useState<Plan[]>();
  const { balance, isLoading } = useGetBalance(orderId);

  useEffect(() => {
    setPlans([
      { months: 1n, pricePerMonth: offer.pricePerMonth },
      { months: 3n, pricePerMonth: offer.pricePerMonth },
      { months: 6n, pricePerMonth: offer.pricePerMonth },
      { months: 12n, pricePerMonth: offer.pricePerMonth },
    ])
  },[offer])

  return (
    <div className="mb-6">
      <h1 className="text-4xl font-bold">
        {isLoading ? "-" : balance ? balance.toString(10) : "-"}
      </h1>
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
        plans={plans}
      />
    </div>
  );
}
