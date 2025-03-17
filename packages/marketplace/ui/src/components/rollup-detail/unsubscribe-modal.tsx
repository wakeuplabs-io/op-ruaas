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
import { useChainPermissions } from "@/lib/hooks/use-chain-permissions";
import { zeroAddress } from "viem";
import { useOrderDetails } from "@/lib/hooks/use-order";
import { StepCard } from "../step-card";
import { useTerminate } from "@/lib/hooks/use-terminate";
import { UnsubscribeStep } from "@/types";

export const UnsubscribeModal: React.FC<
  {
    orderId: bigint;
    disabled?: boolean;
    step: UnsubscribeStep;
  } & ButtonProps
> = ({ orderId, disabled, step, ...props }) => {
  const { data } = useOrderDetails({ id: orderId });
  const { terminate} = useTerminate({ orderId });
  const {
    setBatcherAddress,
    setSequencerAddress,
    setOracleAddress,
  } = useChainPermissions({
    l1ChainId: Number(data?.order.deploymentMetadata.network.l1ChainID ?? 0),
    systemConfigProxy:
      data?.order.deploymentMetadata.addresses.systemConfigProxy ?? zeroAddress,
    l2OutputOracleProxy:
      data?.order.deploymentMetadata.addresses.l2OutputOracleProxy ??
      zeroAddress,
    systemOwnerSafe:
      data?.order.deploymentMetadata.addresses.systemOwnerSafe ?? zeroAddress,
    proxyAdmin:
      data?.order.deploymentMetadata.addresses.proxyAdmin ?? zeroAddress,
  });

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
            isComplete={step > UnsubscribeStep.Unsubscribe}
            isActive={step === UnsubscribeStep.Unsubscribe}
          >
            <Button className="mt-6" onClick={() => terminate()}>
              Terminate payments <ArrowRight />
            </Button>
          </StepCard>

          <StepCard
            className="mt-6"
            title="2. Remove sequencer permissions."
            description="Remove sequencer permissions from provider."
            isComplete={step > UnsubscribeStep.SetSequencer}
            isActive={step === UnsubscribeStep.SetSequencer}
          >
            <Button
              className="mt-6"
              onClick={() => setSequencerAddress(zeroAddress)}
            >
              Remove permission <ArrowRight />
            </Button>
          </StepCard>

          <StepCard
            className="mt-6"
            title="3. Remove batcher permissions."
            description="Remove batcher permissions from provider."
            isComplete={step > UnsubscribeStep.SetBatcher}
            isActive={step === UnsubscribeStep.SetBatcher}
          >
            <Button
              className="mt-6"
              onClick={() => setBatcherAddress(zeroAddress)}
            >
              Remove permission <ArrowRight />
            </Button>
          </StepCard>

          <StepCard
            className="mt-6"
            title="4. Remove Challenger and Proposer."
            description="Remove Challenger and Proposer permissions from provider."
            isComplete={step > UnsubscribeStep.SetOracle}
            isActive={step === UnsubscribeStep.SetOracle}
          >
            <Button
              className="mt-6"
              onClick={() => setOracleAddress(zeroAddress, zeroAddress)}
            >
              Remove permission <ArrowRight />
            </Button>
          </StepCard>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
