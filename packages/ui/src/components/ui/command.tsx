import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { Check, ClipboardCopy } from "lucide-react";
import { useCallback } from "react";

export const Command: React.FC<{ command: string }> = (props) => {
  const { isCopied, copyToClipboard } = useCopyToClipboard({});

  const onCopyClick = useCallback(() => {
    copyToClipboard(props.command as string);
  }, []);

  return (
    <div className="p-2 border rounded-md h-10 relative">
      <pre className="text-muted-foreground">{props.command}</pre>
      <button
        className="absolute right-1 top-1/2 -translate-y-1/2 rounded-md h-8 w-8 grid place-content-center bg-transparent hover:bg-white"
        onClick={onCopyClick}
      >
        {isCopied ? (
          <Check className="h-4 w-4" />
        ) : (
          <ClipboardCopy className="h-4 w-4" />
        )}
        <span className="sr-only">Copy message</span>
      </button>
    </div>
  );
};
