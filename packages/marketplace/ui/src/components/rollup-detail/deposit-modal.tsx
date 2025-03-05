"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useDeposit } from "@/hooks/use-deposit"

interface Plan {
  days: number
  pricePerDay: number
}

const PLANS: Plan[] = [
  { days: 30, pricePerDay: 10 },
  { days: 60, pricePerDay: 9 },
  { days: 180, pricePerDay: 8 },
  { days: 360, pricePerDay: 7 },
]

interface DepositModalProps {
  orderId: string;
  isOpen: boolean
  onClose: () => void
}

export function DepositModal({ orderId, isOpen, onClose }: DepositModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<Plan>(PLANS[0])
  const { depositFunds } = useDeposit()

  const calculateTotal = (plan: Plan): bigint => {
    console.log(BigInt(plan.days * plan.pricePerDay).toString(10))
    return BigInt(plan.days * plan.pricePerDay)
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
            {PLANS.map((plan) => (
              <button
                key={plan.days}
                onClick={() => setSelectedPlan(plan)}
                className={`p-4 rounded-lg border transition-colors ${
                  selectedPlan === plan ? "border-red-500 bg-red-50" : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="text-lg font-semibold">{plan.days} days</div>
                <div className="text-sm text-gray-600 mt-1">${plan.pricePerDay}/day</div>
                <div className="text-red-500 font-medium mt-2">${calculateTotal(plan).toString(10)} total</div>
              </button>
            ))}
          </div>

          <div className="mt-8 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Daily Price:</span>
              <span className="text-gray-900">${selectedPlan.pricePerDay}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Number of Days:</span>
              <span className="text-gray-900">{selectedPlan.days}</span>
            </div>
            <div className="flex justify-between items-center pt-3">
              <span className="text-base font-semibold">Total Amount:</span>
              <span className="text-xl font-semibold text-red-500">${calculateTotal(selectedPlan).toString(10)}</span>
            </div>
          </div>

          <Button
            className="w-full mt-8 bg-red-500 hover:bg-red-600 text-white py-6 rounded-full"
            onClick={()=> depositFunds(BigInt(orderId), calculateTotal(selectedPlan))}
          >
            Complete Deposit
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

