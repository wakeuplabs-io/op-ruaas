import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useFullFilRequest } from "@/lib/hooks/use-fullfil";
import { cn } from "@/lib/utils";
import { Order } from "@/types";
import { Check, Upload } from "lucide-react";
import { useState } from "react";

export const FulfillModal: React.FC<{
  order: Order;
  children: React.ReactNode;
}> = ({ order, children }) => {
  const { onFullFilRequest, isPending } = useFullFilRequest();
  const [deploymentFile, setDeploymentFile] = useState<File | null>(null);
  const [artifactFile, setArtifactFile] = useState<File | null>(null);
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px] gap-0">
        <DialogHeader className="mb-4">
          <DialogTitle>Fullfil Request</DialogTitle>
          <DialogDescription>
            You can make use of the create wizard to do the deployment. You have
            24 hs since the order creation before its expiration.
          </DialogDescription>
        </DialogHeader>

        <label className="font-medium text-sm mb-2">User request</label>
        <div className="flex overflow-x-auto mb-4">
          <pre className="flex-1 text-sm bg-muted max-w-full p-4 rounded-md max-h-28 overflow-y-scroll">
            {JSON.stringify(order.setupMetadata, null, 2)}
          </pre>
        </div>

        <label className="font-medium text-sm mb-2">Offer details</label>
        <div className="flex overflow-x-auto mb-4">
          <pre className="flex-1 text-sm bg-muted max-w-full p-4 rounded-md max-h-28 overflow-y-scroll">
            {JSON.stringify(
              order.offer,
              (_, value) =>
                typeof value === "bigint" ? value.toString() : value,
              2
            )}
          </pre>
        </div>

        <div className="mb-4">
          <label
            htmlFor="artifact"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "justify-between cursor-pointer w-full mb-3"
            )}
          >
            Artifact.zip
            {artifactFile ? (
              <Check className="h-4 w-4 text-primary" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
          </label>

          <label
            htmlFor="deployment"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "justify-between cursor-pointer w-full"
            )}
          >
            Deployment.json
            {deploymentFile ? (
              <Check className="h-4 w-4 text-primary" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
          </label>

          <input
            id="deployment"
            type="file"
            accept=".json"
            className="hidden"
            onChange={(e) =>
              e.target.files && setDeploymentFile(e.target.files[0])
            }
          />

          <input
            id="artifact"
            type="file"
            accept=".zip"
            className="hidden"
            onChange={(e) =>
              e.target.files && setArtifactFile(e.target.files[0])
            }
          />
        </div>

        <DialogFooter>
          <Button
            size="lg"
            disabled={isPending}
            variant="secondary"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            size="lg"
            type="submit"
            isPending={isPending}
            onClick={() =>
              onFullFilRequest(order.id, artifactFile!, deploymentFile!)
                .then(() => window.alert("Order fulfilled"))
                .then(() => setOpen(false))
                .catch((e) => window.alert("Something went wrong" + e?.message))
            }
          >
            Fullfil Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
