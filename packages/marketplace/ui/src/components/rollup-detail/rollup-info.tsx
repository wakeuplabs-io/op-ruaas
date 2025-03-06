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
    <div className="flex gap-4">
      {infoData.map((item, index) => (
        <div key={index} className="flex items-center rounded-lg border border-gray-200 overflow-hidden text-sm">
          <div className="flex-1 p-2">
            <p className="font-medium truncate">{item.value}</p>
            <p className="text-xs text-gray-500">{item.label}</p>
          </div>
          <button className="p-2 hover:bg-gray-50" onClick={() => handleCopy(item.value)}>
            <Copy className="h-4 w-4 text-gray-500" />
          </button>
        </div>
      ))}
    </div>
  );
}
