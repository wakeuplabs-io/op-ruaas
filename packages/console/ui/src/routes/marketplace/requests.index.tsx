import { NewOrdersTable } from "@/components/requests/new-orders-table";
import { OngoingOrdersTable } from "@/components/requests/ongoing-orders-table";
import { TerminatedOrdersTable } from "@/components/requests/terminated-orders-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useVendorOrders } from "@/lib/hooks/use-vendor-orders";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";

export const Route = createFileRoute("/marketplace/requests/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { orders } = useVendorOrders();

  const { newOrders, ongoingOrders, terminatedOrders } = useMemo(() => {
    return {
      newOrders: orders.filter((o) => o.fulfilledAt == 0n),
      ongoingOrders: orders.filter(
        (o) => o.terminatedAt == 0n && o.fulfilledAt != 0n
      ),
      terminatedOrders: orders.filter((o) => o.terminatedAt != 0n),
    };
  }, [orders]);

  return (
    <main className="p-6">
      <Tabs defaultValue="new">
        <TabsList className="">
          <TabsTrigger className="w-48 h-10 flex justify-center" value="new">
            New
          </TabsTrigger>
          <TabsTrigger
            className="w-48 h-10 flex justify-center"
            value="ongoing"
          >
            Ongoing
          </TabsTrigger>
          <TabsTrigger
            className="w-48 h-10 flex justify-center"
            value="terminated"
          >
            Terminated
          </TabsTrigger>
        </TabsList>
        <TabsContent value="new">
          <NewOrdersTable orders={newOrders} />
        </TabsContent>
        <TabsContent value="ongoing">
          <OngoingOrdersTable orders={ongoingOrders} />
        </TabsContent>
        <TabsContent value="terminated">
          <TerminatedOrdersTable orders={terminatedOrders} />
        </TabsContent>
      </Tabs>
    </main>
  );
}
