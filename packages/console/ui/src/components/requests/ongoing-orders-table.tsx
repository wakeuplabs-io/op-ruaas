import { Button } from "../ui/button";
import { TerminateModal } from "./modals/terminate";
import { WithdrawModal } from "./modals/withdraw";
import { Order } from "@/types";

export const OngoingOrdersTable: React.FC<{ orders: Order[] }> = ({
  orders,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-3 px-4 font-normal text-muted-foreground text-sm">
                Rollup
              </th>
              <th className="text-left py-3 px-4 font-normal text-muted-foreground text-sm">
                Plan
              </th>
              <th className="text-left py-3 px-4 font-normal text-muted-foreground text-sm">
                Date of purchase
              </th>
              <th className="text-left py-3 px-4 font-normal text-muted-foreground text-sm">
                Client address
              </th>
              <th className="py-3 px-4"></th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && <div className="p-4">No orders found</div>}

            {orders.map((o) => (
              <tr key={o.id} className="border-b border-gray-100">
                <td className="h-16 px-4 text-gray-900">
                  {o.setupMetadata.name}
                </td>
                <td className="h-16 px-4 text-gray-900">
                  {o.offer.metadata.title}
                </td>
                <td className="h-16 px-4 text-gray-900">
                  {new Date(Number(o.createdAt) * 1000)
                    .toISOString()
                    .slice(0, 16)
                    .replace("T", " ")}
                </td>
                <td className="h-16 px-4 text-gray-900">{o.client}</td>
                <td className="h-16 px-4 text-right space-x-2">
                  <TerminateModal order={o}>
                    <Button variant="outline" className="text-muted-foreground">
                      Terminate
                    </Button>
                  </TerminateModal>
                  <WithdrawModal order={o}>
                    <Button
                      variant="outline"
                      className="text-primary border-primary hover:text-primary/90"
                    >
                      Withdraw
                    </Button>
                  </WithdrawModal>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
