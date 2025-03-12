import { PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UnsubscribeModal } from "@/components/unsubscribe-modal";
import { Order } from "@/types";

interface RollupHeaderProps {
  order: Order;
}

export function RollupHeader({ order }: RollupHeaderProps) {
  console.log(order)
  if(!order) return <></>
  const { terminatedAt, id, name } = order;
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
      {terminatedAt > 0 ? (
              <div className="flex justify-end">
              <Button className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700">
                Complete process
              </Button>
          </div>
      ): (
        <div className="flex gap-3 mt-4 md:mt-0 w-full md:w-auto">
        <Button variant="outline"  className="h-10 px-6">Change Plan</Button>
        <UnsubscribeModal orderId={id} className="h-10 px-6 text-white" disabled>
          Unsubscribe
        </UnsubscribeModal>
      </div>
      )}
    </div>
  );
}
