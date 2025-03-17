import { useCopyToClipboard } from "@/lib/hooks/use-copy-to-clipboard";
import { cn } from "@/lib/utils";
import { Check, CopyIcon } from "lucide-react";
import { useCallback } from "react";

export const DeploymentValue: React.FC<{
  value: string;
  description: string;
  className?: string;
}> = (props) => {
  const { isCopied, copyToClipboard } = useCopyToClipboard({});

  const onCopyClick = useCallback(() => {
    copyToClipboard(props.value as string);
  }, []);

  return (
    <div className={cn("h-12 px-4 border rounded-md relative overflow-x-hidden", props.className)}>
      <div className="flex items-start justify-center flex-col h-full">
        <pre className="text-foreground text-sm overflow-clip">{props.value}</pre>
        <span className="text-xs text-muted-foreground">{props.description}</span>
      </div>
      <button
        className="absolute right-0 top-1/2 -translate-y-1/2 rounded-sm h-12 w-12 border grid place-content-center bg-gray-100"
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
