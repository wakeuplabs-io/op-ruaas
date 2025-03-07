import { AddressManagerList } from "@/components/rollup-detail/address-manager-list";
import { RollupActions } from "@/components/rollup-detail/rollup-actions";
import { RollupHeader } from "@/components/rollup-detail/rollup-header";
import { Card } from "@/components/ui/card";
import { useOrderDetails } from "@/lib/hooks/use-order-details";
import { createLazyFileRoute } from "@tanstack/react-router";
import { useParams } from "@tanstack/react-router";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export const Route = createLazyFileRoute("/app/rollups/$id")({
  component: RollupDashboard,
});

export default function RollupDashboard() {
  const { id } = useParams({ from: "/app/rollups/$id" });
  const { offer } = useOrderDetails(id);
  const [statusColor, setStatusColor] = useState("gray-200");
  return (
    <div className="md:p-6 space-y-6">
      <Card
        className={cn(
          "border rounded-lg w-full mx-auto",
          `border-${statusColor}`
        )}
      >
        <RollupHeader />
        
        <RollupActions
          orderId={id}
          offer={offer}
          setStatusColor={setStatusColor}
          statusColor={statusColor}
        />
      </Card>

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
  );
}
