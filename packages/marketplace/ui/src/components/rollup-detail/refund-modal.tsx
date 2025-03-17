import { Button, ButtonProps } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "../ui/scroll-area";
import { ArrowRight } from "lucide-react";
import { useTerminate } from "@/lib/hooks/use-terminate";
import { StepCard } from "../step-card";
import { UnsubscribeStep } from "@/types";

export const RefundModal: React.FC<
  {
    orderId: bigint;
    disabled?: boolean;
  } & ButtonProps
> = ({ orderId, disabled, ...props }) => {
  const { terminate } = useTerminate({ orderId });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button {...props} />
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px]">
        <ScrollArea className="max-h-[600px]">
          <DialogHeader>
            <DialogTitle>Unsubscribe</DialogTitle>
            <DialogDescription>
              Terminate payments and revoke provider permissions. This is
              irreversible. Please follow the steps below to unsubscribe.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-red-100 text-red-800 py-2 px-4 rounded-md mt-8">
            All unsubscribe actions are permanent and cannot be undone.
          </div>

          <StepCard
            className="mt-8 text-white"
            title="1. Terminate payments."
            description="This will stop immediately the payment flow. Be aware the minimum payment unit is 30 days. You'll receive the remaining funds right away."
            isComplete={false}
            isActive={true}
          >
            <Button className="mt-6" onClick={() => terminate()}>
              Terminate payments <ArrowRight />
            </Button>
          </StepCard>

        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
