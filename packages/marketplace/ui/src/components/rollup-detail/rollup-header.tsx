import { Button } from "@/components/ui/button";
import { Offer, Order, UnsubscribeStep } from "@/types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { UnsubscribeModal } from "./unsubscribe-modal";
import { ShieldCheck } from "lucide-react";
import { RefundModal } from "./refund-modal";
import { useMemo, useState } from "react";
import {
  cn,
  formatTokenAmount,
  currentUnixTime,
  formatRemainingTime,
} from "@/lib/utils";
import { BookDown, TriangleAlert } from "lucide-react";
import { DeploymentValue } from "./deployment-value";
import { DepositModal } from "./deposit-modal";
import { useUnsubscribe } from "@/lib/hooks/use-unsubscribe";
import { useNavigate } from "@tanstack/react-router";

interface RollupHeaderProps {
  order: Order;
  offer: Offer;
  refetch: () => void;
}

export function RollupHeader({ order, offer, refetch}: RollupHeaderProps) {
  const timeRemainingInSeconds =
    order.fulfilledAt > 0n
      ? Number(order.fulfilledAt + 48n * 3600n - currentUnixTime)
      : 0;
  const navigate = useNavigate()
  const { step } = useUnsubscribe({ order, offer });
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);

  const remainingTimeString = useMemo(() => {
    if (!offer.pricePerMonth || order.balance === 0n) return "-";
    return formatRemainingTime(order.balance, offer.pricePerMonth);
  }, [offer, order]);

  const statusColor = useMemo(() => {
    if (!offer.pricePerMonth || order.balance === 0n) return "red-500";
    const daysRemaining = order.balance / (offer.pricePerMonth / 30n);
    if (daysRemaining < 1n) return "red-500";
    if (daysRemaining < 30n) return "yellow-500";
    return "gray-800";
  }, [offer.pricePerMonth, order.balance]);

  if (!order) return null;

  return (
    <div className="rounded-lg bg-gradient-to-l from-gray-300 to-transparent p-px">
      <div className="px-8 py-6 bg-white rounded-[calc(0.6rem-1px)]">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-medium">
              {order.setupMetadata.name}{" "}
              <span className="text-gray-500">/ {offer.metadata.title}</span>
            </h2>
          </div>

          {order.fulfilledAt === 0n &&
            currentUnixTime - order.createdAt > BigInt(24 * 3600) && (
              <div className="flex justify-end">
                <RefundModal
                  orderId={order.id}
                  className="h-10 px-6 text-white"
                >
                  Refund
                </RefundModal>
              </div>
            )}

          <div className="flex gap-3 mt-4 md:mt-0 w-full md:w-auto">
            {order.terminatedAt == 0n && timeRemainingInSeconds > 0 && (
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
                            : Math.max(
                                0,
                                timeRemainingInSeconds / 3600
                              ).toFixed(0) + " hours"
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
              onClose={() => navigate({ to: `/rollups/${order.id.toString()}` })}
            />
          </div>
        </div>

        {order.fulfilledAt > 0 && (
          <div>
            {order.terminatedAt > 0n ? (
              <h2 className="mt-4 text-2xl font-semibold text-alert-border">
                Unsubscribed
              </h2>
            ) : (
              <div className="py-4">
                <h1 className={cn("text-4xl font-bold", `text-${statusColor}`)}>
                  {remainingTimeString}
                </h1>
                <p className="text-gray-500 mt-1">
                  ${formatTokenAmount(order.balance || 0n)}
                </p>
              </div>
            )}

            <div className="flex justify-between items-end gap-4  mt-5">
              {order.terminatedAt > 0n ? (
                step == UnsubscribeStep.Done ? (
                  <div></div>
                ) : (
                  <div className="mt-4">
                    <div className=" p-4 bg-alert-background rounded-lg flex items-start gap-3">
                      <TriangleAlert className="h-11 w-11 text-alert-border stroke-[1.5] flex-shrink-0" />
                      <p className="text-sm text-alert-border">
                        You're unsubscribed, but provider permissions are still
                        active. Complete the process to revoke access.
                      </p>
                    </div>
                  </div>
                )
              ) : (
                <Button
                  variant="outline"
                  className="w-32 h-12 flex items-center justify-center gap-2"
                  onClick={() => setIsDepositModalOpen(true)}
                >
                  <BookDown className="h-5 w-5" />
                  Deposit
                </Button>
              )}

              <div className="flex gap-4">
                {[
                  {
                    label: "Chain ID",
                    value:
                      order.deploymentMetadata.network.l2ChainID.toString(),
                  },
                  {
                    label: "RPC URL",
                    value: order.deploymentMetadata.urls.rpc,
                  },
                ].map((item, index) => (
                  <DeploymentValue
                    key={index}
                    value={item.value}
                    description={item.label}
                    className="min-w-[250px]"
                  />
                ))}
              </div>
            </div>

            <DepositModal
              orderId={order.id}
              pricePerMonth={offer.pricePerMonth}
              isOpen={isDepositModalOpen}
              onClose={() => {
                setIsDepositModalOpen(false)
                refetch();
              }}
              refetch={refetch}
            />
          </div>
        )}
      </div>
    </div>
  );
}
