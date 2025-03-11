import { AddressManagerList } from "@/components/rollup-detail/address-manager-list";
import { RollupActions } from "@/components/rollup-detail/rollup-actions";
import { RollupHeader } from "@/components/rollup-detail/rollup-header";
import { Card } from "@/components/ui/card";
import { createLazyFileRoute } from "@tanstack/react-router";
import { useState } from "react";
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
      <div className="rounded-lg bg-gradient-to-l from-gray-300 to-transparent p-px">
        <div className="border px-8 py-6 shadow-sm bg-white rounded-[calc(0.75rem-1px)]">
          <RollupHeader />

          {fulfilledAt > 0 && (
            <RollupActions
              orderId={id}
              offer={null!}
              setStatusColor={setStatusColor}
              statusColor={statusColor}
            />
          )}
        </div>
      </div>

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
          <div className="rounded-lg bg-gradient-to-l from-[#FFD813] to-transparent p-px">
            <div className="border p-12 shadow-sm bg-white rounded-[calc(0.75rem-1px)] border-gray-200 flex flex-col items-center justify-center h-[360px]">
              <div className="h-20 w-20 rounded-full bg-[#FFF1C7] flex items-center justify-center mb-12 mx-auto">
                <Clock className="text-[#FFD813] h-12 w-12" />
              </div>

              <div className="text-xl font-medium mb-6">
                Waiting for provider
              </div>
              <div className="text-sm text-muted-foreground max-w-sm mx-auto text-center">
                Your Rollup is being processed and should be active within the
                next 24 hours.
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-gradient-to-l from-[#6696AF] to-transparent p-px">
            <div className="border p-12 shadow-sm bg-white rounded-[calc(0.75rem-1px)] border-gray-200 flex flex-col items-center justify-center h-[360px]">
              <div className="h-20 w-20 rounded-full bg-[#DEF4FF] flex items-center justify-center mb-12 mx-auto">
                <OctagonAlert className="text-[#6696AF] h-12 w-12" />
              </div>

              <div className="text-xl font-medium mb-6">
                Cancellation Policy
              </div>
              <div className="text-sm text-muted-foreground max-w-sm mx-auto text-center">
                Once the service is active, you will have 48 hours to review it
                and unsubscribe before being charged.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
