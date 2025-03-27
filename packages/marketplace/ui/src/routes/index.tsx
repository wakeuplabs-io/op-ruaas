import { cn, formatTokenAmount } from "@/lib/utils";
import { CheckCircle } from "lucide-react";
import { createFileRoute } from "@tanstack/react-router";
import { REPLICA_IDS, SEQUENCER_IDS } from "@/shared/constants/marketplace";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TabsContent } from "@radix-ui/react-tabs";
import { useOffer } from "@/lib/hooks/use-offer";
import { BuySequencerModal } from "@/components/buy-sequencer-modal";
import { BuyReplicaModal } from "@/components/buy-replica-modal";
import React from "react";
import { SkeletonCard } from "@/components/skeleton-card";

export const Route = createFileRoute("/")({
  component: SubscriptionPlans,
});

export function SubscriptionPlans() {
  const [selected, setSelected] = React.useState<string>(SEQUENCER_IDS[0]);

  return (
    <Tabs
      className="p-6"
      defaultValue="sequencer"
      onValueChange={(value) => {
        setSelected(value === "sequencer" ? SEQUENCER_IDS[0] : REPLICA_IDS[0]);
      }}
    >
      <div className="flex flex-col md:flex-row items-center md:justify-between text-center mb-8">
        <h2 className="text-md font-medium mb-4 md:mb-0">Choose your plan</h2>

        <TabsList className="grid grid-cols-2 h-12 px-2 w-full max-w-xs">
          <TabsTrigger className="h-9" value="sequencer">
            Sequencer
          </TabsTrigger>
          <TabsTrigger className="h-9" value="replica">
            Replica
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent
        value="sequencer"
        className="grid md:grid-cols-3 gap-6 justify-center"
      >
        {SEQUENCER_IDS.map((id) => (
          <PlanCard
            key={id}
            offerId={id}
            sequencer
            selected={selected === id}
          />
        ))}
      </TabsContent>

      <TabsContent
        value="replica"
        className="grid md:grid-cols-3 gap-6 justify-center"
      >
        {REPLICA_IDS.map((id) => (
          <PlanCard key={id} offerId={id} selected={selected === id} />
        ))}
      </TabsContent>
    </Tabs>
  );
}

const PlanCard: React.FC<{
  selected?: boolean;
  offerId: string;
  sequencer?: boolean;
}> = ({ offerId, selected, sequencer }) => {
  const { offer, isLoading } = useOffer(BigInt(offerId));

  if (isLoading) {
    return <SkeletonCard />;
  }
  if (!offer) return null;

  return (
    <div
      className={cn(
        "rounded-lg bg-gradient-to-tl from-primary to-transparent",
        selected ? "p-[2px] from-primary" : "p-[1px] from-gray-200"
      )}
    >
      <div
        className={cn(
          "border p-12 shadow-sm flex flex-col justify-between h-[550px] bg-white",
          selected
            ? "rounded-[calc(0.6rem-2px)] "
            : "rounded-[calc(0.6rem-1px)] "
        )}
      >
        <div>
          <h2 className="text-md font-medium">{offer?.metadata.title}</h2>
          <p className="text-4xl font-bold mt-4">
            ${formatTokenAmount(offer?.pricePerMonth ?? 0n, 18n)}
            <span className="text-2xl font-normal"> / month</span>
          </p>

          <ul className="mt-4 space-y-2">
            {offer?.metadata?.features.map((feature, i) => (
              <li key={i} className="flex items-center gap-2 text-gray-700">
                <CheckCircle className="text-red-500 w-4 h-4" />
                <span className="text-sm font-medium">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {sequencer ? (
          <BuySequencerModal
            offerId={offerId}
            offer={offer!}
            variant="outline"
            className={cn(
              "w-full py-2 border rounded-lg text-sm font-medium transition-all h-10 mt-4",
              selected
                ? "border-red-500 text-red-500 hover:text-red-500"
                : "border-black text-black"
            )}
          >
            {selected ? "Buy now" : "Select plan"}
          </BuySequencerModal>
        ) : (
          <BuyReplicaModal
            offerId={offerId}
            offer={offer!}
            variant="outline"
            className={cn(
              "w-full py-2 border rounded-lg text-sm font-medium transition-all h-10 mt-4",
              selected
                ? "border-red-500 text-red-500 hover:text-red-500"
                : "border-black text-black"
            )}
          >
            {selected ? "Buy now" : "Select plan"}
          </BuyReplicaModal>
        )}
      </div>
    </div>
  );
};
