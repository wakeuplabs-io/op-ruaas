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
import { formatUnits } from "viem";
import React, { useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { UploadIcon } from "lucide-react";
import { Input } from "./ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateOrder } from "@/lib/hooks/use-create-order";
import { useRouter } from "@tanstack/react-router";

const formSchema = z.object({
  name: z.string().min(1, "Rollup name is required"),
});

export const BuyReplicaModal: React.FC<
  { offerId: string; offer: Offer } & ButtonProps
> = ({ offer, offerId, ...props }) => {
  const router = useRouter();
  const [selectedMonths, setSelectedMonths] = useState("1");
  const [showSetup, setShowSetup] = useState(false);
  const [artifacts, setArtifacts] = useState<File | null>(null);

  const { createOrder, isPending } = useCreateOrder();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "" },
  });

  const onSubmit = useCallback(
    async (data: z.infer<typeof formSchema>) => {
      try {
        if (!artifacts) {
          throw new Error("No artifacts selected");
        }

        const orderId = await createOrder(
          BigInt(offerId),
          BigInt(selectedMonths),
          offer.pricePerMonth,
          data.name,
          artifacts
        );

        router.navigate({ to: `/rollups/$id`, params: { id: orderId.toString()} });
      } catch (e: any) {
        alert("Error creating order: " + e?.message);
      }
    },
    [artifacts, createOrder]
  );

  return (
    <Dialog onOpenChange={() => setShowSetup(false)}>
      <DialogTrigger>
        <Button {...props} />
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        {showSetup ? (
          <>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <DialogHeader>
                  <DialogTitle>{offer.metadata.title} Plan Setup</DialogTitle>
                  <DialogDescription>
                    Nice selection! Now follow the steps to set up your rollup.
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

                <div className="mt-6">
                  <label htmlFor="" className="text-sm">
                    Upload your Rollup config:
                  </label>
                  <div className="mt-4">
                    <label
                      htmlFor="artifacts"
                      className="flex items-center justify-between cursor-pointer border h-12 px-4 rounded-md text-muted-foreground text-sm"
                    >
                      {artifacts ? artifacts?.name : "No file selected"}
                      <UploadIcon className="w-5 h-5" />
                    </label>
                    <input
                      type="file"
                      id="artifacts"
                      className="hidden"
                      accept=".zip"
                      onChange={(e) =>
                        setArtifacts(e.target.files?.[0] ?? null)
                      }
                    />
                  </div>
                </div>

                <Button
                  className="w-full mt-12"
                  type="submit"
                  size="lg"
                  disabled={!form.formState.isValid || !artifacts || isPending}
                >
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

            <Button
              size="lg"
              className="mt-12"
              onClick={() => setShowSetup(true)}
            >
              Select Plan
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

const RadioGroup: React.FC<{
  options: { label: string; description: string; value: string }[];
  onChange: (value: string) => void;
  currentValue: string;
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
