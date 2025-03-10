import { AddressManagerList } from "@/components/rollup-detail/address-manager-list";
import { RollupActions } from "@/components/rollup-detail/rollup-actions";
import { RollupHeader } from "@/components/rollup-detail/rollup-header";
import { Card } from "@/components/ui/card";
import { createLazyFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Clock, Download, OctagonAlert } from "lucide-react";
import { useOrder } from "@/lib/hooks/use-order";

export const Route = createLazyFileRoute("/rollups/$id")({
  component: RollupDashboard,
});

export default function RollupDashboard() {
  const { id } = Route.useParams();
  const { fulfilledAt } = useOrder({ id: BigInt(id) });
  const [statusColor, setStatusColor] = useState("gray-200");

  return (
    <div className="md:p-6 space-y-6">
      <Card
        className={cn(
          "border rounded-lg w-full mx-auto space-y-6",
          `border-${statusColor}`
        )}
      >
        <RollupHeader />

        {/* <RollupActions
          orderId={id}
          offer={offer}
          setStatusColor={setStatusColor}
          statusColor={statusColor}
        /> */}
      </Card>

      {fulfilledAt > 0 ? (
        <div>
          <Card className="p-6 border rounded-lg">
            <AddressManagerList />
          </Card>

          <Button
            variant="outline"
            className="w-full mt-6 py-6 flex gap-2 items-center justify-center bg-gray-200"
          >
            <Download className="h-5 w-5" />
            Download zip
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-6">
          <div className="rounded-xl text-center bg-white h-[360px] flex flex-col items-center justify-center border border-[#FFD813]">
            <div className="h-20 w-20 rounded-full bg-[#FFF1C7] flex items-center justify-center mb-12 mx-auto">
              <Clock className="text-[#FFD813] h-12 w-12" />
            </div>

            <div className="text-xl font-medium mb-6">Waiting for provider</div>
            <div className="text-sm text-muted-foreground max-w-sm mx-auto">
              Your Rollup is being processed and should be active within the
              next 24 hours.
            </div>
          </div>

          <div className="rounded-xl text-center bg-white h-[360px] flex flex-col items-center justify-center border border-[#6696AF]">
            <div className="h-20 w-20 rounded-full bg-[#DEF4FF] flex items-center justify-center mb-12 mx-auto">
              <OctagonAlert className="text-[#6696AF] h-12 w-12" />
            </div>

            <div className="text-xl font-medium mb-6">Cancellation Policy</div>
            <div className="text-sm text-muted-foreground max-w-sm mx-auto">
            Once the service is active, you will have 48 hours to review it and unsubscribe before being charged.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
