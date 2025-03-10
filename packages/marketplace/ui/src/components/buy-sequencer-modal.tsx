import { Offer } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Button, ButtonProps } from "./ui/button";
import { formatUnits, zeroAddress } from "viem";
import React, { useCallback, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { useChainPermissions } from "@/lib/hooks/use-chain-permissions";
import { ArrowRight, UploadIcon } from "lucide-react";
import { StepCard } from "./step-card";
import { Input } from "./ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";

enum SubscribeStep {
  SetSequencer,
  SetBatcher,
  SetOracle,
  Done,
}

enum SequencerType {
  New,
  Existing,
}

const formSchema = z.object({
  name: z.string().min(1, "Rollup name is required"),
});

export const BuySequencerModal: React.FC<{ offer: Offer } & ButtonProps> = ({
  offer,
  ...props
}) => {
  const [selectedMonths, setSelectedMonths] = useState("1");
  const [sequencerType, setSequencerType] = useState<SequencerType>(
    SequencerType.New
  );
  const [showSetup, setShowSetup] = useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "" },
  });

  const {
    batcher,
    sequencer,
    proposer,
    challenger,
    setBatcherAddress,
    setSequencerAddress,
    setOracleAddress,
  } = useChainPermissions({
    l1ChainId: Number(1), // offer.metadata.l1ChainId
    systemConfigProxy: "systemConfigProxy" as `0x${string}`,
    l2OutputOracleProxy: "l2OutputOracleProxy" as `0x${string}`,
    systemOwnerSafe: "systemOwnerSafe" as `0x${string}`,
    proxyAdmin: "proxyAdmin" as `0x${string}`,
  });

  const step = useMemo(() => {
    if (sequencer === offer.metadata.wallets.sequencer)
      return SubscribeStep.SetSequencer;
    if (batcher === offer.metadata.wallets.batcher)
      return SubscribeStep.SetBatcher;
    if (proposer === offer.metadata.wallets.proposer)
      return SubscribeStep.SetOracle;
    if (challenger === offer.metadata.wallets.challenger)
      return SubscribeStep.SetOracle;
    return SubscribeStep.Done;
  }, [offer, sequencer, batcher, proposer, challenger]);

  const onSubmit = useCallback((data: z.infer<typeof formSchema>) => {
    // TODO: upload artifact to IPFS
    // TODO: approve marketplace and call createOrder
  }, []);

  return (
    <Dialog onOpenChange={() => setShowSetup(false)}>
      <DialogTrigger>
        <Button {...props} />
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        {showSetup ? (
          <>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
              >
                <DialogHeader>
                  <DialogTitle>{offer.metadata.title} Plan Setup</DialogTitle>
                  <DialogDescription>
                    Purchase successful! Now follow the steps to set up your
                    rollup.
                  </DialogDescription>
                </DialogHeader>

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="mt-6">
                      <FormLabel>Name your Rollup:</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Rollup 1" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {sequencerType === SequencerType.Existing && (
                  <>
                    <div className="mt-6">
                      <label htmlFor="" className="text-sm">
                        Upload your Rollup configuration:
                      </label>
                      <div className="mt-4">
                        <label
                          htmlFor="artifacts"
                          className="flex items-center justify-between cursor-pointer border h-12 px-4 rounded-md text-muted-foreground"
                        >
                          Click to upload
                          <UploadIcon className="w-5 h-5" />
                        </label>
                        <input type="file" id="artifacts" className="hidden" />
                      </div>
                    </div>

                    <StepCard
                      className="mt-6"
                      title="1. Assign sequencer permissions."
                      description="Give the sequencer permissions to the provider."
                      isComplete={step > SubscribeStep.SetSequencer}
                      isActive={step === SubscribeStep.SetSequencer}
                    >
                      <Button
                        className="mt-6"
                        onClick={() => setSequencerAddress(zeroAddress)}
                      >
                        Give permission <ArrowRight />
                      </Button>
                    </StepCard>

                    <StepCard
                      className="mt-6"
                      title="2. Assign batcher permissions."
                      description="Give the batcher permissions to the provider."
                      isComplete={step > SubscribeStep.SetBatcher}
                      isActive={step === SubscribeStep.SetBatcher}
                    >
                      <Button
                        className="mt-6"
                        onClick={() => setBatcherAddress(zeroAddress)}
                      >
                        Give permission <ArrowRight />
                      </Button>
                    </StepCard>

                    <StepCard
                      className="mt-6"
                      title="3. Assign Challenger and Proposer."
                      description="Assign the proposer and challenger to the provider."
                      isComplete={step > SubscribeStep.SetOracle}
                      isActive={step === SubscribeStep.SetOracle}
                    >
                      <Button
                        className="mt-6"
                        onClick={() =>
                          setOracleAddress(zeroAddress, zeroAddress)
                        }
                      >
                        Remove permission <ArrowRight />
                      </Button>
                    </StepCard>
                  </>
                )}

                <Button className="w-full mt-12" type="submit" size="lg" disabled={!form.formState.isValid || ( sequencerType === SequencerType.Existing && step < SubscribeStep.Done)}>
                  Complete Order
                </Button>
              </form>
            </Form>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{offer.metadata.title} Plan Deposit</DialogTitle>
              <DialogDescription>
                Add funds for your subscription. Select a subscription period:
              </DialogDescription>
            </DialogHeader>
            <RadioGroup
              className="mt-12"
              options={[
                {
                  label: "1 month",
                  description: `${formatUnits(offer.pricePerMonth, 18)} ETH`,
                  value: "1",
                },
                {
                  label: "3 months",
                  description: `${formatUnits(offer.pricePerMonth * 3n, 18)} ETH`,
                  value: "3",
                },
                {
                  label: "6 months",
                  description: `${formatUnits(offer.pricePerMonth * 6n, 18)} ETH`,
                  value: "6",
                },
                {
                  label: "12 months",
                  description: `${formatUnits(offer.pricePerMonth * 12n, 18)} ETH`,
                  value: "12",
                },
              ]}
              onChange={setSelectedMonths}
              currentValue={selectedMonths}
            />

            <label
              htmlFor=""
              className="mb-4 mt-14 text-sm font-medium text-muted-foreground"
            >
              Sequencer type:
            </label>
            <RadioGroup
              options={[
                {
                  label: "New",
                  description: "Create a New Chain",
                  value: SequencerType.New,
                },
                {
                  label: "Existing",
                  description: "Create sequencer for an existing chain",
                  value: SequencerType.Existing,
                },
              ]}
              currentValue={sequencerType}
              onChange={setSequencerType}
            />

            <Button className="mt-12" size="lg" onClick={() => setShowSetup(true)}>
              Setup Plan
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

const RadioGroup: React.FC<{
  options: { label: string; description: string; value: any }[];
  onChange: (value: any) => void;
  currentValue: any;
  className?: string;
}> = ({ options, currentValue, onChange, className }) => {
  return (
    <div className={cn("grid grid-cols-2 gap-4", className)}>
      {options.map((option) => (
        <div
          className={cn(
            "border cursor-pointer rounded-md text-center space-y-3 h-[100px] flex flex-col justify-center",
            option.value === currentValue && "border-red-600"
          )}
          onClick={() => onChange(option.value)}
        >
          <div className="text-lg">{option.label}</div>
          <div className="text-muted-foreground text-sm">
            {option.description}
          </div>
        </div>
      ))}
    </div>
  );
};
