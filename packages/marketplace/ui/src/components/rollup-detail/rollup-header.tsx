import { Button } from "@/components/ui/button";

export function RollupHeader() {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-medium">
          Rollup 1 <span className="text-gray-500">/Basic</span>
        </h2>
        <button className="text-gray-400">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 20h9"></path>
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
          </svg>
        </button>
      </div>

      <div className="flex gap-3 mt-4 md:mt-0 w-full md:w-auto">
        <Button variant="outline">Verify</Button>
        <Button variant="outline">Change Plan</Button>
        <Button className="bg-red-500 hover:bg-red-600 text-white">Unsubscribe</Button>
      </div>
    </div>
  );
}
