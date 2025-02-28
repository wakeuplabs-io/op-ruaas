"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface DepositModalProps {
  isOpen: boolean
  onClose: () => void
}

export function WithdrawModal({ isOpen, onClose }: DepositModalProps) {

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-2xl">
        <div className="p-6">
          <DialogHeader className="flex flex-row items-start justify-between">
            <DialogTitle className="text-xl font-semibold">Deposit Funds</DialogTitle>
          </DialogHeader>

          <p className="mt-2 text-base text-gray-700">
            Retreive funds from your subscription. Choose months, see the total, and confirm.
          </p>

        </div>
      </DialogContent>
    </Dialog>
  )
}

