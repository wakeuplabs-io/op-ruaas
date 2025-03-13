import { Button } from "@/components/ui/button";
import { UnsubscribeModal } from "@/components/rollup-detail/unsubscribe-modal";

export const RollupHeader: React.FC<{
  orderId: bigint;
  orderName: string;
  offerName: string;
}> = ({ orderId, orderName, offerName }) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-medium">
          {orderName} <span className="text-gray-500">/ {offerName}</span>
        </h2>
      </div>

      <div className="flex gap-3 mt-4 md:mt-0 w-full md:w-auto">
        <Button variant="outline" className="h-10 px-6">
          Change Plan
        </Button>
        <UnsubscribeModal orderId={orderId} className="h-10 px-6" disabled>
          Unsubscribe
        </UnsubscribeModal>
      </div>
    </div>
  );
};
