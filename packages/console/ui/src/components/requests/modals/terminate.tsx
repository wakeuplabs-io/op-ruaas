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
import { useTerminateOrder } from "@/lib/hooks/use-terminate";
import { Order } from "@/types";
import { useState } from "react";

export const TerminateModal: React.FC<{
  order: Order;
  children: React.ReactNode;
}> = ({ children, order }) => {
  const [open, setOpen] = useState(false);
  const { terminateOrder, isPending } = useTerminateOrder();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Terminate order</DialogTitle>
          <DialogDescription>
            Are you sure you want to terminate the order? There's no way back.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            disabled={isPending}
            variant="secondary"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            isPending={isPending}
            onClick={() => {
              terminateOrder(order.id)
                .then(() => window.alert("Order terminated"))
                .then(() => setOpen(false))
                .then(() => window.location.reload())
                .catch((e) =>
                  window.alert("Something went wrong: " + e?.message)
                );
            }}
          >
            Terminate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
