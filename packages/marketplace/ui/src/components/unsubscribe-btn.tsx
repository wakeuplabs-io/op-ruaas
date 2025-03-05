import { Button, ButtonProps } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "./ui/scroll-area";

export const UnsubscribeButton: React.FC<{ l1Rpc?: string } & ButtonProps> = ({ l1Rpc, disabled, ...props }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button  {...props} />
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

          <ol className="space-y-6 overflow-y-scroll mt-8">
            <li className="pl-4">
              <div className="-ml-4">1. Terminate payments.</div>
              <div className="text-muted-foreground text-sm mt-1">
                This will stop immediately the payment flow. Be aware the
                minimum payment unit is 30 days. You'll receive the remaining
                funds right away.
              </div>
              <Button className="mt-4">Terminate payments</Button>
            </li>

            <li className="pl-4">
              <div className="-ml-4">2. Reassign sequencer permissions.</div>
              <div className="text-muted-foreground text-sm mt-1">
                Remove sequencer permissions from provider. If you're just
                shutting down the chain feel free to set the sequencer address
                to 0x0.
              </div>
              <AddressInput
                className="mt-4"
                placeholder="Sequencer address"
                currentValue="0x000000000000000000000000000000"
              />
              <Button className="mt-6">Reassign sequencer permissions</Button>
            </li>

            <li className="pl-4">
              <div className="-ml-4">3. Reassign batcher permissions.</div>
              <div className="text-muted-foreground text-sm mt-1">
                Remove batcher permissions from provider. If you're just
                shutting down the chain feel free to set the batcher address to
                0x0.
              </div>
              <AddressInput
                className="mt-4"
                placeholder="Batcher address"
                currentValue="0x000000000000000000000000000000"
              />
              <Button className="mt-6">Reassign batcher permissions</Button>
            </li>

            <li className="pl-4">
              <div className="-ml-4">
                4. Reassign Challenger and Proposer permissions.
              </div>
              <div className="text-muted-foreground text-sm mt-1">
                Remove Challenger and Proposer permissions from provider. If
                you're just shutting down the chain feel free to set the batcher
                address to 0x0.
              </div>
              <AddressInput
                className="mt-4"
                placeholder="Challenger address"
                currentValue="0x000000000000000000000000000000"
              />
              <AddressInput
                className="mt-4"
                placeholder="Proposer address"
                currentValue="0x000000000000000000000000000000"
              />
              <Button className="mt-6">
                Reassign Challenger and Proposer permissions
              </Button>
            </li>
          </ol>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

const AddressInput: React.FC<{
  className?: string;
  placeholder?: string;
  currentValue?: string;
  onChange?: (value: string) => void;
  value?: string;
}> = ({ className, placeholder, currentValue, onChange, value }) => {
  return (
    <div className={className}>
      <div className="relative">
        <Input
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
        />
        <Button
          size="sm"
          variant="link"
          className="absolute right-0 top-1/2 -translate-y-1/2"
          onClick={() => onChange?.("0x000000000000000000000000000000")}
        >
          Zero
        </Button>
      </div>
      <p className="text-xs mt-1 text-muted-foreground">
        Current value: {currentValue}
      </p>
    </div>
  );
};
