import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDeposit } from "@/lib/hooks/use-deposit";
import { Plan } from "@/types";
import { formatTokenAmount, sleep } from "@/lib/utils";
import { useAccount } from "wagmi";
import { useNavigate } from "@tanstack/react-router";

interface DepositModalProps {
  orderId: bigint;
  pricePerMonth: bigint;
  isOpen: boolean;
  onClose: () => void;
  refetch: () => void;
}

enum ModalStatus {
  IDLE = "idle",
  SUCCESS = "success",
}

export function DepositModal({
  orderId,
  pricePerMonth,
  isOpen,
  onClose,
  refetch,
}: DepositModalProps) {
  const navigate = useNavigate();

  const { depositFunds } = useDeposit();
  const { isConnected } = useAccount();

  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [status, setStatus] = useState<ModalStatus>(ModalStatus.IDLE);

  const plans = useMemo(
    () => [
      { months: 1, pricePerMonth },
      { months: 3, pricePerMonth },
      { months: 6, pricePerMonth },
      { months: 12, pricePerMonth },
    ],
    [pricePerMonth]
  );

  useEffect(() => {
    if (!selectedPlan && plans.length > 0) {
      setSelectedPlan(plans[0]);
    }
  }, [plans, selectedPlan]);

  useEffect(() => {
    if (status === ModalStatus.SUCCESS) {
      const timer = setTimeout(async () => {
        onClose();

        await sleep(1000);
        setStatus(ModalStatus.IDLE);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [status, onClose]);

  const calculateTotal = (plan: Plan): bigint => {
    return BigInt(plan.months) * plan.pricePerMonth;
  };

  const handleDeposit = async () => {
    navigate({ to: `/rollups/${orderId.toString()}` });
    if (!selectedPlan) return;
    setIsPending(true);
    setStatus(ModalStatus.IDLE);

    try {
      await depositFunds(BigInt(orderId), calculateTotal(selectedPlan));
      setStatus(ModalStatus.SUCCESS);
      refetch();
      navigate({
        to: `/rollups/$id`,
        params: { id: orderId.toString() },
      });
    } catch (error) {
      console.error(error);
      window.alert("Failed to deposit funds");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[95%] md:max-w-[547px] p-4 sm:p-6 md:p-8 overflow-hidden rounded-2xl">
        <div>
          <DialogHeader className="flex flex-row items-start justify-between">
            <DialogTitle className="text-xl font-semibold">
              Deposit Funds
            </DialogTitle>
          </DialogHeader>

          <p className="mt-2 text-base text-gray-700">
            Add funds for your subscription. Select a subscription period:
          </p>

          <div className="mt-6 sm:mt-8 pb-6 sm:pb-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {plans?.map((plan) => (
              <button
                key={plan.months}
                onClick={() => setSelectedPlan(plan)}
                className={`p-4 rounded-lg border transition-colors ${
                  selectedPlan === plan
                    ? "border-red-500 bg-red-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="text-lg">{plan.months * 30} days</div>
                <div className="text-gray-500 font-medium mt-2 text-base">
                  ${formatTokenAmount(calculateTotal(plan), 18n, 0)}
                </div>
              </button>
            ))}
          </div>

          {selectedPlan && (
            <>
              <Button
                size="lg"
                className="w-full mt-6 sm:mt-8"
                onClick={handleDeposit}
                isPending={isPending}
                disabled={
                  isPending || !isConnected || status === ModalStatus.SUCCESS
                }
              >
                {!isConnected && "Connect your wallet to deposit"}
                {isConnected &&
                  status === ModalStatus.IDLE &&
                  "Complete Deposit"}
                {isConnected && status === ModalStatus.SUCCESS && <>Success</>}
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
