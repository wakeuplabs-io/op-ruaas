import { Copy } from "lucide-react";

interface CopyableInfoBoxProps {
  value: string;
  shortValue: string;
  label: string;
}

export function CopyableInfoBox({ value, shortValue, label }: CopyableInfoBoxProps) {
  const handleCopy = () => {
    navigator.clipboard.writeText(value);
  };

  return (
    <div
      className="
        flex items-center
        w-70 h-11
        rounded-md
        border border-gray-200
        overflow-hidden text-sm
      "
    >
      <div className="flex-1 px-4 py-2">
        <p className="font-medium text-gray-900">{shortValue}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
      <button
        className="
          h-full px-4
          bg-gray-100 hover:bg-gray-200
          transition-colors
        "
        onClick={handleCopy}
      >
        <Copy className="h-5 w-5 text-gray-700" />
      </button>
    </div>
  );
}
