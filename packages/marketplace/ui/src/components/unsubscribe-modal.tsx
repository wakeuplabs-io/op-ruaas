import { Button, ButtonProps } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "./ui/scroll-area";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export const UnsubscribeModal: React.FC<{ l1Rpc?: string } & ButtonProps> = ({
  l1Rpc,
  disabled,
  ...props
}) => {
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
            className="mt-8"
            title="1. Terminate payments."
            description="This will stop immediately the payment flow. Be aware the minimum payment unit is 30 days. You'll receive the remaining funds right away."
          >
            <Button className="mt-6">
              Terminate payments <ArrowRight />
            </Button>
          </StepCard>

          <StepCard
            className="mt-6"
            title="2. Remove sequencer permissions."
            description="Remove sequencer permissions from provider."
          >
            <Button className="mt-6">
              Remove permission <ArrowRight />
            </Button>
          </StepCard>

          <StepCard
            className="mt-6"
            title="3. Remove batcher permissions."
            description="Remove batcher permissions from provider."
          >
            <Button className="mt-6">
              Remove permission <ArrowRight />
            </Button>
          </StepCard>

          <StepCard
            className="mt-6"
            title="4. Remove Challenger and Proposer."
            description="Remove Challenger and Proposer permissions from provider."
          >
            <Button className="mt-6">
              Remove permission <ArrowRight />
            </Button>
          </StepCard>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

const StepCard: React.FC<{
  className?: string;
  isActive?: boolean;
  isComplete?: boolean;
  title?: string;
  description?: string;
  children?: React.ReactNode;
}> = ({ className, isActive, isComplete, children, title, description }) => {
  return (
    <div
      className={cn(
        "border rounded-xl p-4",
        isComplete
          ? "bg-green-100 border-green-300 text-green-700"
          : "bg-background",
        className
      )}
    >
      <div className="font-medium">{title}</div>
      {!isComplete && (
        <div className="text-muted-foreground text-sm mt-4">{description}</div>
      )}
      {isActive && children}
    </div>
  );
};
