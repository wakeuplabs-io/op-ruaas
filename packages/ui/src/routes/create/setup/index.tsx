import { AppSidebar } from "@/components/app-sidebar";
import { Pagination } from "@/components/pagination";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { createFileRoute } from "@tanstack/react-router";
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
  const [step, setStep] = useState<SetupStep>(SetupStep.L1_CHAIN);

  const currentStepIndex = steps.findIndex((s) => s.step === step);

  const next = () => {
    if (currentStepIndex < steps.length - 1) {
      setStep(steps[currentStepIndex + 1].step);
    } else {
      // TODO: create and navigate to inspect
    }
  };

  const previous = () => {
    if (currentStepIndex > 0) {
      setStep(steps[currentStepIndex - 1].step);
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-gray-50 min-h-screen">
        <header className="flex h-16 shrink-0 items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              {steps.map((s, index) => (
                <React.Fragment key={s.step}>
                  <BreadcrumbItem>
                    <BreadcrumbLink
                      onClick={() => setStep(s.step)}
                      className={cn("cursor-pointer", {
                        "font-semibold": s.step === step,
                      })}
                    >
                      {s.label}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  {index < steps.length - 1 && (
                    <BreadcrumbSeparator className="hidden md:block" />
                  )}
                </React.Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <main className="p-4 pt-0">
          {step == SetupStep.L1_CHAIN && <L1ChainStep />}
          {step == SetupStep.L2_CHAIN && <L2ChainStep />}
          {step == SetupStep.GOVERNANCE && <L2GovernanceStep />}
          {step == SetupStep.DOWNLOAD && <DownloadStep />}

          <Pagination className="mt-6" onNext={next} onPrev={previous} />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

const L1ChainStep: React.FC = () => {
  return (
    <div className="border rounded-xl py-8 px-10 bg-white">
      <h1 className="font-bold text-xl">L1 chain</h1>
      <p className="mt-6 text-sm">
        The L1 chain to which your rollup will be posting transactions. Think of
        it as an exchange between costs and security.
      </p>

      <div className="flex items-center justify-between mt-10 px-4 py-3 border rounded-lg">
        <span>Ethereum testnet</span>
        <Switch />
      </div>
    </div>
  );
};

const L2ChainStep: React.FC = () => {
  return (
    <div className="border rounded-xl py-8 px-10 bg-white">
      <h1 className="font-bold text-xl">Your L2 Chain Details</h1>
      <p className="mt-6 text-sm">
        Define core parameters for your L2 chain. For more advanced options fine
        tune the generated config file before deployment.
      </p>

      <Input className="mt-10 h-12" placeholder="L2 chain id" />
    </div>
  );
};

const L2GovernanceStep: React.FC = () => {
  return (
    <div className="border rounded-xl py-8 px-10 bg-white">
      <h1 className="font-bold text-xl">L2 Governance</h1>
      <p className="mt-6 text-sm">
        Define core parameters for your L2 chain. For more advanced options fine
        tune the generated config file before deployment.
      </p>

      <Input className="mt-10 h-12" placeholder="Token name" />

      <Input className="mt-4 h-12" placeholder="Token symbol" />
    </div>
  );
};

const DownloadStep: React.FC = () => {
  return (
    <div>
      <div className="border rounded-xl py-8 px-10 bg-white">
        <h1 className="font-bold text-xl">Download your project</h1>
        <p className="mt-6 text-sm">
          Download and unzip your project, click next and follow the deployment
          instructions.
        </p>
      </div>
      <Button variant="secondary" size={"lg"} className="w-full rounded-full mt-4">
        Download <DownloadIcon />
      </Button>
    </div>
  );
};
