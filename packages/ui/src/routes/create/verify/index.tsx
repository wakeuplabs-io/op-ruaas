import { Pagination } from "@/components/pagination";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Command } from "@/components/ui/command";
import { Dropzone } from "@/components/ui/dropzone";
import { Input } from "@/components/ui/input";
import { SidebarLayout } from "@/layouts/sidebar";
import { Deployment } from "@/lib/api";
import { useToast } from "@/lib/hooks/use-toast";
import { useCreateDeploymentMutation } from "@/lib/queries";
import { cn, readFile } from "@/lib/utils";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Check, Upload } from "lucide-react";
import { useCallback, useState } from "react";

export const Route = createFileRoute("/create/verify/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { toast } = useToast();
  const { navigate } = useRouter();
  const [deploymentFile, setDeploymentFile] = useState<File | null>(null);
  const [artifactFile, setArtifactFile] = useState<File | null>(null);

  const { mutateAsync: createDeployment, isPending } =
    useCreateDeploymentMutation();

  const onDrop = useCallback((files: File[]) => {
    let valid = false;

    for (const file of files) {
      if (file.name === "deployment.json") {
        setDeploymentFile(file);
        valid = true;
      } else if (file.name === "artifact.zip") {
        setArtifactFile(file);
        valid = true;
      }
    }

    if (!valid) {
      toast({
        variant: "destructive",
        title: "Invalid file",
        description:
          "Please ensure files are named deployment.json and artifact.zip",
      });
    }
  }, []);

  const onNext = useCallback(async () => {
    if (!deploymentFile) {
      return;
    }

    try {
      const deployment = await createDeployment(
        JSON.parse(await readFile(deploymentFile)) as Deployment
      );
      if (artifactFile) {
        // TODO: upload artifact
      }

      navigate({ to: "/deployments/$id", params: { id: deployment.id } });
    } catch (error) {
      console.error(error);
    }
  }, [deploymentFile]);

  return (
    <SidebarLayout title="Verify">
      <Card>
        <CardTitle>Verify and upload chain artifacts</CardTitle>
        <CardDescription className="mt-4 md:mt-6">
          Check out deployment addresses and relevant endpoints. You can run
          this command locally.
        </CardDescription>

        <Command
          className="mt-4"
          command="npx opruaas inspect all --deployment {name}"
        />

        <CardDescription className="mt-10 md:mt-10">
          Or if authenticated upload the artifacts to save them to your account
          and recheck any time you want.
        </CardDescription>

        <div className="w-full mt-4">
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
            <label
              htmlFor="deployment"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "justify-between cursor-pointer"
              )}
            >
              Deployment.json
              {deploymentFile ? (
                <Check className="h-4 w-4 text-primary" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
            </label>
            <label
              htmlFor="artifact"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "justify-between cursor-pointer"
              )}
            >
              Artifact.zip
              {artifactFile ? (
                <Check className="h-4 w-4 text-primary" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
            </label>
          </div>

          <input
            id="deployment"
            type="file"
            className="hidden"
            onChange={(e) =>
              e.target.files && setDeploymentFile(e.target.files[0])
            }
          />
          <input
            id="artifact"
            type="file"
            className="hidden"
            onChange={(e) =>
              e.target.files && setArtifactFile(e.target.files[0])
            }
          />
          {(!artifactFile || !deploymentFile) && (
            <Dropzone onDrop={onDrop} className="mt-4" />
          )}
        </div>
      </Card>

      <Pagination
        className="mt-6"
        prev={{ disabled: true }}
        next={{ disabled: !deploymentFile, onClick: onNext, isPending }}
      />
    </SidebarLayout>
  );
}
