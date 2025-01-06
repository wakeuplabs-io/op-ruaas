import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { Check, CopyIcon } from "lucide-react";
import { useCallback } from "react";

export const DeploymentValue: React.FC<{
  value: string;
  description: string;
}> = (props) => {
  const { isCopied, copyToClipboard } = useCopyToClipboard({});

  const onCopyClick = useCallback(() => {
    copyToClipboard(props.value as string);
  }, []);

  return (
    <div className="py-2 px-4 border rounded-md relative">
      <div>
        <pre className="text-foreground text-sm">{props.value}</pre>
        <span className="text-xs text-muted-foreground">{props.description}</span>
      </div>
      <button
        className="absolute right-1 top-1/2 -translate-y-1/2 rounded-sm h-12 w-12 grid place-content-center bg-gray-100"
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
