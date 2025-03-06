"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useDeposit } from "@/hooks/use-deposit"
import { Plan } from "@/types"
import { formatTokenAmount } from "@/lib/utils"
import { Loader2, CheckCircle } from "lucide-react"
import { useAccount } from "wagmi";

interface DepositModalProps {
  orderId: string;
  plans: Plan[] | undefined;
  isOpen: boolean;
  onClose: () => void;
}

const DAYS_PER_MONTH = 30n;

enum ModalStatus {
  IDLE = "idle",
  SUCCESS = "success",
}

export function DepositModal({ orderId, plans, isOpen, onClose }: DepositModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const { depositFunds } = useDeposit();
  const [isPending, setIsPending] = useState(false);
  const [status, setStatus] = useState<ModalStatus>(ModalStatus.IDLE);
  const { isConnected } = useAccount();

  useEffect(() => {
    if (plans && plans.length > 0) {
      setSelectedPlan(plans[0]);
    }
  }, [plans]);

  const calculateTotal = (plan: Plan): bigint => {
    return BigInt(plan.months * plan.pricePerMonth);
  };

  const handleDeposit = async () => {
    if (!selectedPlan) return;

    setIsPending(true);
    setStatus(ModalStatus.IDLE);

    try {
      await depositFunds(BigInt(orderId), calculateTotal(selectedPlan));
      setStatus(ModalStatus.SUCCESS);
    } catch (error) {
      console.error(error);
    } finally {
      setIsPending(false);
    }
  };

  if (!plans) {
    return <p className="text-center p-6 text-gray-600">Loading...</p>;
  }

  if (plans.length === 0) {
    return <p className="text-center p-6 text-gray-600">No available plans</p>;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-2xl">
        <div className="p-6">
          <DialogHeader className="flex flex-row items-start justify-between">
            <DialogTitle className="text-xl font-semibold">Deposit Funds</DialogTitle>
          </DialogHeader>

          <p className="mt-2 text-base text-gray-700">
            Add funds for your subscription. Choose a plan, see the total, and confirm.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-3">
            {plans.map((plan) => (
              <button
                key={plan.months}
                onClick={() => setSelectedPlan(plan)}
                className={`p-4 rounded-lg border transition-colors ${
                  selectedPlan === plan ? "border-red-500 bg-red-50" : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="text-lg font-semibold">{(plan.months * DAYS_PER_MONTH).toString(10)} days</div>
                <div className="text-red-500 font-medium mt-2">${formatTokenAmount(calculateTotal(plan))} total</div>
              </button>
            ))}
          </div>

          {selectedPlan && (
            <>
              <div className="mt-8 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Number of days:</span>
                  <span className="text-gray-900">{(selectedPlan.months * DAYS_PER_MONTH).toString(10)}</span>
                </div>
                <div className="flex justify-between items-center pt-3">
                  <span className="text-base font-semibold">Total Amount:</span>
                  <span className="text-xl font-semibold text-red-500">${formatTokenAmount(calculateTotal(selectedPlan))}</span>
                </div>
              </div>

              <Button
                className="w-full mt-8 bg-red-500 hover:bg-red-600 text-white py-6 rounded-full flex items-center justify-center gap-2"
                onClick={handleDeposit}
                isPending={isPending}
                disabled={isPending || !isConnected || status === "success"}
              >
                {isPending && <Loader2 className="animate-spin h-5 w-5" />}
                {!isConnected && "Connect your wallet to deposit"}
                {isConnected && status === ModalStatus.IDLE && "Complete Deposit"}
                {isConnected && status === ModalStatus.SUCCESS && <><CheckCircle className="h-5 w-5 text-green-500" /> Success</>}
              </Button>
              {!isConnected && (
                <p className="mt-2 text-center text-sm text-red-500">
                  You must connect your wallet to proceed with the deposit.
                </p>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
