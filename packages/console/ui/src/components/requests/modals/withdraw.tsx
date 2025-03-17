import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBalance } from "@/lib/hooks/use-balance";
import { useWithdraw } from "@/lib/hooks/use-withdraw";
import {
  MARKETPLACE_TOKEN_DECIMALS,
  MARKETPLACE_TOKEN_SYMBOL,
} from "@/shared/constants/marketplace";
import { Order } from "@/types";
import { useMemo, useState } from "react";
import { formatUnits } from "viem";

export const WithdrawModal: React.FC<{
  order: Order;
  children: React.ReactNode;
}> = ({ children, order }) => {
  const { balance } = useBalance(order.id);
  const { withdraw, isPending } = useWithdraw();

  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");

  const isInGuarantee = useMemo(() => {
    const timeSinceFulFilled = Date.now() - Number(order.fulfilledAt * 1000n);
    return order.fulfilledAt == 0n || timeSinceFulFilled < 24 * 60 * 60 * 1000;
  }, [order]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Withdraw</DialogTitle>
          <DialogDescription>Withdraw from ongoing order.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-4">
          <Label htmlFor="amount" className="text-right">
            Amount
          </Label>
          <Input
            id="amount"
            type="number"
            placeholder="Amount of tokens to withdraw"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <div className="text-sm text-muted-foreground">
            You can withdraw {formatUnits(balance, MARKETPLACE_TOKEN_DECIMALS)}{" "}
            {MARKETPLACE_TOKEN_SYMBOL}.{" "}
            {isInGuarantee ? "Once guarantee expires" : ""}
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="secondary"
            disabled={isPending}
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            isPending={isPending}
            disabled={isInGuarantee}
            onClick={() => {
              withdraw(order.id, amount)
                .then(() => window.alert("Successful withdraw"))
                .then(() => setOpen(false))
                .catch((e) =>
                  window.alert("Something went wrong: " + e?.message)
                );
            }}
          >
            Withdraw
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
