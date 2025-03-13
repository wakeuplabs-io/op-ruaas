import { PenLine, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UnsubscribeModal } from "@/components/unsubscribe-modal";
import { Order } from "@/types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface RollupHeaderProps {
  order: Order;
}

export function RollupHeader({ order }: RollupHeaderProps) {
  if (!order) return <></>;
  const { fulfilledAt, terminatedAt, id, name } = order;
  const currentUnixTime = BigInt(Math.floor(Date.now() / 1000));

  const timeRemainingInSeconds =
    fulfilledAt > 0n ? Number(fulfilledAt + 48n * 3600n - currentUnixTime) : 0;

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-medium">
          {name} <span className="text-gray-500">/ Basic</span>
        </h2>
        <button className="text-gray-400">
          <PenLine className="h-4 w-4" />
        </button>
      </div>

      {terminatedAt > 0n ? (
        <div className="flex justify-end">
          <Button className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700">
            Complete process
          </Button>
        </div>
      ) : (
        <div className="flex gap-3 mt-4 md:mt-0 w-full md:w-auto">
          {fulfilledAt > 0n && timeRemainingInSeconds > 0 && (
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

          <Button variant="outline" className="h-10 px-6">
            Change Plan
          </Button>
          <UnsubscribeModal
            orderId={id}
            className="h-10 px-6 text-white"
            disabled
          >
            Unsubscribe
          </UnsubscribeModal>
        </div>
      )}
    </div>
  );
}
