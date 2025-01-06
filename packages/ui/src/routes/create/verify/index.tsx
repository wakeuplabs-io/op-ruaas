import { Pagination } from "@/components/pagination";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Dropzone } from "@/components/ui/dropzone";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SidebarLayout } from "@/layouts/sidebar";
import { createFileRoute } from "@tanstack/react-router";
import { Check, Upload } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/create/verify/")({
  component: RouteComponent,
});

function RouteComponent() {
  const [deployment, setDeployment] = useState<File | null>(null);
  const [artifact, setArtifact] = useState<File | null>(null);

  return (
    <SidebarLayout title="Verify">
      <Card>
        <CardTitle>Verify and upload chain artifacts</CardTitle>
        <CardDescription className="mt-4 md:mt-6">
          Check out deployment addresses and relevant endpoints. Come back
          whenever to recheck your deployment and recover your artifacts.
        </CardDescription>

        <Tabs defaultValue="deployment" className="w-full mt-10">
          <TabsList className="w-full">
            <TabsTrigger className="w-full justify-between" value="deployment">
              Deployment.json
              <div className="bg-white p-2">
                {deployment ? (
                  <Check className="h-4 w-4 text-primary" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
              </div>
            </TabsTrigger>
            <TabsTrigger className="w-full justify-between" value="artifact">
              Artifact.zip
              <div className="bg-white p-2">
                {artifact ? (
                  <Check className="h-4 w-4 text-primary" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
              </div>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="deployment">
            <Dropzone file={deployment} setFile={setDeployment} />
          </TabsContent>
          <TabsContent value="artifact">
            <Dropzone file={artifact} setFile={setArtifact} />
          </TabsContent>
        </Tabs>
      </Card>

      <Pagination className="mt-6" disableNext disablePrev />
    </SidebarLayout>
  );
}
