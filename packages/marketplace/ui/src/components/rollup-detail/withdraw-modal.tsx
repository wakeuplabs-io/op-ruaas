"use client"

import { useState } from "react"
import { X, Minus, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface DepositModalProps {
  isOpen: boolean
  onClose: () => void
}

export function WithdrawModal({ isOpen, onClose }: DepositModalProps) {
  const [months, setMonths] = useState(1)
  const monthlyPrice = 10
  const totalAmount = months * monthlyPrice

  const decreaseMonths = () => {
    if (months > 1) {
      setMonths(months - 1)
    }
  }

  const increaseMonths = () => {
    setMonths(months + 1)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-2xl">
        <div className="p-6">
          <DialogHeader className="flex flex-row items-start justify-between">
            <DialogTitle className="text-xl font-semibold">Deposit Funds</DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 p-0">
              <X className="h-5 w-5" />
              <span className="sr-only">Close</span>
            </Button>
          </DialogHeader>

          <p className="mt-2 text-base text-gray-700">
            Retreive funds from your subscription. Choose months, see the total, and confirm.
          </p>

          <div className="mt-8">
            <div className="flex items-center justify-between">
              <span className="text-base font-medium">Months:</span>
              <div className="flex items-center">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={decreaseMonths}
                  disabled={months <= 1}
                  className="h-10 w-10 rounded-full border-gray-200"
                >
                  <Minus className="h-4 w-4" />
                  <span className="sr-only">Decrease</span>
                </Button>
                <span className="mx-6 text-xl font-medium">{months}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={increaseMonths}
                  className="h-10 w-10 rounded-full border-gray-200"
                >
                  <Plus className="h-4 w-4" />
                  <span className="sr-only">Increase</span>
                </Button>
              </div>
            </div>

            <div className="mt-12 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Monthly Price:</span>
                <span className="text-gray-900">${monthlyPrice}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Number of Months:</span>
                <span className="text-gray-900">{months}</span>
              </div>
              <div className="flex justify-between items-center pt-3">
                <span className="text-base font-semibold">Total Amount:</span>
                <span className="text-xl font-semibold text-red-500">${totalAmount}</span>
              </div>
            </div>
          </div>

          <Button className="w-full mt-8 bg-red-500 hover:bg-red-600 text-white py-6 rounded-full">
            Complete Deposit
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

