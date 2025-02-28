import { Copy } from "lucide-react";

const addressManagers = Array(12).fill({
  address: "0xDc64a14...F6C9",
  label: "Address Manager",
});

export function AddressManagerList() {
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
      {addressManagers.map((item, index) => (
        <div key={index} className="flex items-center rounded-lg border border-gray-200 overflow-hidden">
          <div className="flex-1 p-3">
            <p className="text-sm font-medium truncate">{item.address}</p>
            <p className="text-xs text-gray-500">{item.label}</p>
          </div>
          <button className="p-3 hover:bg-gray-50" onClick={() => handleCopy(item.address)}>
            <Copy className="h-5 w-5 text-gray-500" />
          </button>
        </div>
      ))}
    </div>
  );
}
