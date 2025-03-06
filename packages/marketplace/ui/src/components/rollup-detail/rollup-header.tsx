import { Button } from "@/components/ui/button";
import { PenLine } from "lucide-react";

export function RollupHeader() {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-medium">
          Rollup 1 <span className="text-gray-500">/ Basic</span>
        </h2>
        <button className="text-gray-400">
          <PenLine className="h-4 w-4" />
        </button>
      </div>

      <div className="flex gap-3 mt-4 md:mt-0 w-full md:w-auto">
        <Button variant="outline">Verify</Button>
        <Button variant="outline">Change Plan</Button>
        <Button className="bg-red-500 hover:bg-red-600 text-white">
          Unsubscribe
        </Button>
      </div>
    </div>
  );
}
