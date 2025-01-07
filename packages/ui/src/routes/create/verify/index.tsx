import { Pagination } from "@/components/pagination";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Command } from "@/components/ui/command";
import { Dropzone } from "@/components/ui/dropzone";
import { SidebarLayout } from "@/layouts/sidebar";
import { useToast } from "@/lib/hooks/use-toast";
import { createFileRoute } from "@tanstack/react-router";
import { Check, Upload } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/create/verify/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { toast } = useToast();
  const [deployment, setDeployment] = useState<File | null>(null);
  const [artifact, setArtifact] = useState<File | null>(null);

  const onDrop = (files: File[]) => {
    let valid = false;

    for (const file of files) {
      if (file.name === "deployment.json") {
        setDeployment(file);
        valid = true;
      } else if (file.name === "artifact.zip") {
        setArtifact(file);
        valid = true;
      }
    }

    if (!valid) {
      toast({
        variant: "destructive",
        title: "Invalid file",
        description: "Please ensure files are named deployment.json and artifact.zip",
      })
    }
  };

  return (
    <SidebarLayout title="Verify">
      <Card>
        <CardTitle>Verify and upload chain artifacts</CardTitle>
        <CardDescription className="mt-4 md:mt-6">
          Check out deployment addresses and relevant endpoints. You can run
          this command locally or if authenticated upload the artifacts to save
          them to your account and recheck any time you want.
        </CardDescription>

        <Command className="mt-10" command="npm i -g @wakeuplabs/opruaas" />

        <div className="w-full mt-10">
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
            <Button size="lg" variant="outline" className="justify-between">
              Deployment.json
              {deployment ? (
                <Check className="h-4 w-4 text-primary" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
            </Button>
            <Button size="lg" variant="outline" className="justify-between">
              Artifact.zip
              {artifact ? (
                <Check className="h-4 w-4 text-primary" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
            </Button>
          </div>

          <Dropzone onDrop={onDrop} className="mt-4" />
        </div>
      </Card>

      <Pagination
        className="mt-6"
        disablePrev
        disableNext
      />
    </SidebarLayout>
  );
}
