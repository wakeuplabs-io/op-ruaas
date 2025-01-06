import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { cn } from "@/lib/utils";
import { Check, CopyIcon } from "lucide-react";
import { useCallback } from "react";

export const Command: React.FC<{ command: string; className?: string }> = ({
  command,
  className,
}) => {
  const { isCopied, copyToClipboard } = useCopyToClipboard({});

  const onCopyClick = useCallback(() => {
    copyToClipboard(command as string);
  }, []);

  return (
    <div
      className={cn(
        "px-4 flex items-center border rounded-md h-12 relative",
        className
      )}
    >
      <pre
        className="text-muted-foreground text-sm text-clip whitespace-nowrap overflow-hidden w-full"
        title={command}
      >
        {command}
      </pre>
      <button
        className="absolute right-1 top-1/2 -translate-y-1/2 rounded-md h-10 w-10 grid place-content-center bg-gray-100"
        onClick={onCopyClick}
      >
        {isCopied ? (
          <Check className="h-4 w-4" />
        ) : (
          <CopyIcon className="h-4 w-4" />
        )}
        <span className="sr-only">Copy message</span>
      </button>
    </div>
  );
};
