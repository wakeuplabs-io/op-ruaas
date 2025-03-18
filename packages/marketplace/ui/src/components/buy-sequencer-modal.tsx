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
import React, { useCallback, useEffect, useState } from "react";
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
import { useCreateOrder } from "@/lib/hooks/use-create-order";
import { useRouter } from "@tanstack/react-router";
import { readArtifact } from "@/lib/artifacts";
import { useOrders } from "@/lib/hooks/use-orders";

enum SubscribeStep {
  UploadArtifacts,
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

export const BuySequencerModal: React.FC<
  { offerId: string; offer: Offer } & ButtonProps
> = ({ offer, offerId, ...props }) => {
  const router = useRouter();
  const { refetch: refetchOrders } = useOrders();
  const [selectedMonths, setSelectedMonths] = useState("1");
  const [sequencerType, setSequencerType] = useState<SequencerType>(
    SequencerType.New
  );
  const [showSetup, setShowSetup] = useState(false);
  const [artifacts, setArtifacts] = useState<File | null>(null);
  const [systemConfigProxy, setSystemConfigProxy] = useState(zeroAddress);
  const [l2OutputOracleProxy, setL2OutputOracleProxy] = useState(zeroAddress);
  const [systemOwnerSafe, setSystemOwnerSafe] = useState(zeroAddress);
  const [proxyAdmin, setProxyAdmin] = useState(zeroAddress);
  const [l1ChainId, setL1ChainId] = useState(1);
  const [step, setStep] = useState<SubscribeStep>(
    SubscribeStep.UploadArtifacts
  );

  const {
    setBatcherAddress,
    setSequencerAddress,
    setOracleAddress,
    isPending: isChainPermissionsPending,
  } = useChainPermissions({
    l1ChainId,
    systemConfigProxy,
    l2OutputOracleProxy,
    systemOwnerSafe,
    proxyAdmin,
  });
  const { createOrder, isPending: isCreateOrderPending } = useCreateOrder();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "" },
  });

  const onSubmit = useCallback(
    async (data: z.infer<typeof formSchema>) => {
      try {
        if (sequencerType === SequencerType.Existing && !artifacts) {
          throw new Error("No artifacts selected");
        }

        const orderId = await createOrder(
          BigInt(offerId),
          BigInt(selectedMonths),
          offer.pricePerMonth,
          data.name,
          artifacts
        );
        await refetchOrders();
        router.navigate({
          to: `/rollups/$id`,
          params: { id: orderId.toString() },
        });
      } catch (e: any) {
        alert("Error creating order: " + e?.message);
      }
    },
    [router, sequencerType, createOrder]
  );

  useEffect(() => {
    if (!artifacts) return;
    readArtifact(artifacts)
      .then(({ addresses, deployConfig }) => {
        setL1ChainId(deployConfig["l1ChainID"]);
        setSystemConfigProxy(addresses["SystemConfigProxy"]);
        setL2OutputOracleProxy(addresses["L2OutputOracleProxy"]);
        setSystemOwnerSafe(addresses["SystemOwnerSafe"]);
        setProxyAdmin(addresses["ProxyAdmin"]);
        setStep(SubscribeStep.SetSequencer);
      })
      .catch((error) => {
        alert("Error reading artifacts: " + error.toString());
      });
  }, [artifacts]);

  return (
    <Dialog
      onOpenChange={() => {
        setShowSetup(false);
        setArtifacts(null);
        setSequencerType(SequencerType.New);
        setSystemConfigProxy(zeroAddress);
        setL2OutputOracleProxy(zeroAddress);
        setSystemOwnerSafe(zeroAddress);
        setProxyAdmin(zeroAddress);

        form.reset();
      }}
    >
      <DialogTrigger>
        <Button {...props} />
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px] p-12">
        {showSetup ? (
          <>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <DialogHeader>
                  <DialogTitle>{offer.metadata.title} Plan Setup</DialogTitle>
                  <DialogDescription>
                    Nice choice! Now follow the steps to set up your rollup.
                  </DialogDescription>
                </DialogHeader>

                <FormField
                  control={form.control}
                  name="name"
                  disabled={isCreateOrderPending}
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
                      <label htmlFor="" className="text-sm font-medium">
                        Upload your Rollup config:
                      </label>
                      <div className="mt-2">
                        <label
                          htmlFor="artifacts"
                          className="flex items-center justify-between cursor-pointer border h-12 px-3 rounded-md text-muted-foreground text-sm"
                        >
                          {artifacts ? artifacts?.name : "No file selected"}
                          <UploadIcon className="w-5 h-5" />
                        </label>
                        <input
                          type="file"
                          id="artifacts"
                          className="hidden"
                          disabled={isCreateOrderPending}
                          accept=".zip"
                          onChange={(e) =>
                            setArtifacts(e.target.files?.[0] ?? null)
                          }
                        />
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
                        type="button"
                        isPending={isChainPermissionsPending}
                        onClick={() =>
                          setSequencerAddress(offer.metadata.wallets!.sequencer)
                            .then(() => setStep(SubscribeStep.SetBatcher))
                            .catch((error) => alert(error.toString()))
                        }
                      >
                        Give permission <ArrowRight />
                      </Button>
                    </StepCard>

                    <StepCard
                      className="mt-4"
                      title="2. Assign batcher permissions."
                      description="Give the batcher permissions to the provider."
                      isComplete={step > SubscribeStep.SetBatcher}
                      isActive={step === SubscribeStep.SetBatcher}
                    >
                      <Button
                        className="mt-6"
                        type="button"
                        isPending={isChainPermissionsPending}
                        onClick={() =>
                          setBatcherAddress(offer.metadata.wallets!.batcher)
                            .then(() => setStep(SubscribeStep.SetOracle))
                            .catch((error) => alert(error.toString()))
                        }
                      >
                        Give permission <ArrowRight />
                      </Button>
                    </StepCard>

                    <StepCard
                      className="mt-4"
                      title="3. Assign Challenger and Proposer."
                      description="Assign the proposer and challenger to the provider."
                      isComplete={step > SubscribeStep.SetOracle}
                      isActive={step === SubscribeStep.SetOracle}
                    >
                      <Button
                        className="mt-6"
                        type="button"
                        isPending={isChainPermissionsPending}
                        onClick={() =>
                          setOracleAddress(
                            offer.metadata.wallets!.proposer,
                            offer.metadata.wallets!.challenger
                          )
                            .then(() => setStep(SubscribeStep.Done))
                            .catch((error) => alert(error.toString()))
                        }
                      >
                        Give permission <ArrowRight />
                      </Button>
                    </StepCard>
                  </>
                )}

                <Button
                  className="w-full mt-12 text-white"
                  type="submit"
                  size="lg"
                  isPending={isCreateOrderPending}
                  disabled={
                    !form.formState.isValid ||
                    (sequencerType === SequencerType.Existing &&
                      step < SubscribeStep.Done)
                  }
                >
                  Create Order
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

            <Button
              variant="primary"
              size="lg"
              onClick={() => setShowSetup(true)}
            >
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
