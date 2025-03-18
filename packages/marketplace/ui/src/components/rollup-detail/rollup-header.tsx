import { Button } from "@/components/ui/button";
import { Offer, Order } from "@/types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { UnsubscribeModal } from "./unsubscribe-modal";
import { ShieldCheck } from "lucide-react";
import { RefundModal } from "./refund-modal";
import { currentUnixTime } from "@/lib/utils";

interface RollupHeaderProps {
  order: Order;
  offer: Offer;
}

export function RollupHeader({ order, offer }: RollupHeaderProps) {
  const { fulfilledAt, terminatedAt, id, setupMetadata } = order;
  const timeRemainingInSeconds =
    fulfilledAt > 0n ? Number(fulfilledAt + 48n * 3600n - currentUnixTime) : 0;

    console.log("terminatedAt", {order})

  if (!order) return null;

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-medium">
          {setupMetadata.name}{" "}
          <span className="text-gray-500">/ {offer.metadata.title}</span>
        </h2>
      </div>

      {fulfilledAt === 0n &&
        currentUnixTime - order.createdAt > BigInt(24 * 3600) && (
          <div className="flex justify-end">
            <RefundModal orderId={id} className="h-10 px-6 text-white">
              Refund
            </RefundModal>
          </div>
        )}

      <div className="flex gap-3 mt-4 md:mt-0 w-full md:w-auto">
        {terminatedAt == 0n && timeRemainingInSeconds > 0 && (
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  className="h-10 w-10 rounded-[10px] border border-shield-border bg-shield-background flex items-center justify-center !hover:bg-shield-background"
                >
                  <ShieldCheck className="h-5 w-5 text-shield-border" />
                </Button>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="bg-tooltip-background text-tooltip-text shadow-md border border-tooltip-border"
              >
                <p>
                  You have{" "}
                  <span>
                    {timeRemainingInSeconds > 0
                      ? timeRemainingInSeconds < 3600
                        ? "less than 1 hour"
                        : Math.max(0, timeRemainingInSeconds / 3600).toFixed(
                            0
                          ) + " hours"
                      : "0 hours"}
                  </span>{" "}
                  of warranty remaining to cancel the service at no cost.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        <UnsubscribeModal
          offer={offer}
          order={order}
          className="h-10 px-6 text-white"
        />
      </div>
    </div>
  );
}
