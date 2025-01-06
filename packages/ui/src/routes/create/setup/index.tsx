import { Pagination } from "@/components/pagination";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { SidebarLayout } from "@/layouts/sidebar";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { DownloadIcon } from "lucide-react";
import React, { useState } from "react";

export const Route = createFileRoute("/create/setup/")({
  component: Index,
});

enum SetupStep {
  L1_CHAIN,
  L2_CHAIN,
  GOVERNANCE,
  DOWNLOAD,
}

const steps = [
  { step: SetupStep.L1_CHAIN, label: "L1" },
  { step: SetupStep.L2_CHAIN, label: "L2" },
  { step: SetupStep.GOVERNANCE, label: "L2 Governance" },
  { step: SetupStep.DOWNLOAD, label: "Download" },
];

function Index() {
  const router = useRouter();
  const [step, setStep] = useState<SetupStep>(SetupStep.L1_CHAIN);

  const currentStepIndex = steps.findIndex((s) => s.step === step);

  const next = () => {
    if (currentStepIndex < steps.length - 1) {
      setStep(steps[currentStepIndex + 1].step);
    } else {
      router.navigate({ to: "/create/deploy" });
    }
  };

  const previous = () => {
    if (currentStepIndex > 0) {
      setStep(steps[currentStepIndex - 1].step);
    }
  };

  return (
    <SidebarLayout
      title="Setup"
      breadcrumb={steps.map((s) => ({
        id: s.step,
        label: s.label,
        active: s.step === step,
      }))}
      onBreadcrumbClick={(id) => setStep(id)}
    >
      {step == SetupStep.L1_CHAIN && <L1ChainStep />}
      {step == SetupStep.L2_CHAIN && <L2ChainStep />}
      {step == SetupStep.GOVERNANCE && <L2GovernanceStep />}
      {step == SetupStep.DOWNLOAD && <DownloadStep />}

      <Pagination className="mt-6" onNext={next} onPrev={previous} />
    </SidebarLayout>
  );
}

const L1ChainStep: React.FC = () => {
  return (
    <Card>
      <CardTitle>L1 chain</CardTitle>
      <CardDescription className="mt-4 md:mt-6">
        The L1 chain to which your rollup will be posting transactions. Think of
        it as an exchange between costs and security.
      </CardDescription>

      <div className="flex items-center justify-between mt-10 px-4 h-12 text-sm border rounded-lg">
        <span className="text-sm">Ethereum testnet</span>
        <Switch />
      </div>
    </Card>
  );
};

const L2ChainStep: React.FC = () => {
  return (
    <Card>
      <CardTitle>Your L2 Chain Details</CardTitle>
      <CardDescription className="mt-4 md:mt-6">
        Define core parameters for your L2 chain. For more advanced options fine
        tune the generated config file before deployment.
      </CardDescription>

      <Input className="mt-10" placeholder="L2 chain id" />
    </Card>
  );
};

const L2GovernanceStep: React.FC = () => {
  return (
    <Card>
      <CardTitle>L2 Governance</CardTitle>
      <CardDescription className="mt-4 md:mt-6">
        Define core parameters for your L2 chain. For more advanced options fine
        tune the generated config file before deployment.
      </CardDescription>

      <Input className="mt-10" placeholder="Token name" />

      <Input className="mt-2" placeholder="Token symbol" />
    </Card>
  );
};

const DownloadStep: React.FC = () => {
  return (
    <>
      <Card>
        <CardTitle>Download your project</CardTitle>

        <CardDescription className="mt-4 md:mt-6">
          Download and unzip your project, click next and follow the deployment
          instructions.
        </CardDescription>
      </Card>

      <Button
        size="lg"
        variant="secondary"
        className="w-full rounded-full mt-4"
      >
        Download <DownloadIcon />
      </Button>
    </>
  );
};
