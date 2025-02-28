import { Copy } from "lucide-react";

const infoData = [
  { label: "Chain ID", value: "0xDc64a14...F6C9" },
  { label: "RPC URL", value: "0xDc64a14...F6C9" }
];

export function RollupInfo() {
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {infoData.map((item, index) => (
        <div key={index} className="flex items-center rounded-lg border border-gray-200 overflow-hidden">
          <div className="flex-1 p-3">
            <p className="text-sm font-medium truncate">{item.value}</p>
            <p className="text-xs text-gray-500">{item.label}</p>
          </div>
          <button className="p-3 hover:bg-gray-50" onClick={() => handleCopy(item.value)}>
            <Copy className="h-5 w-5 text-gray-500" />
          </button>
        </div>
      ))}
    </div>
  );
}
