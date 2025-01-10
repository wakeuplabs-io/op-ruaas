import { Command } from "@/components/ui/command";
import { createLazyFileRoute, useRouter } from "@tanstack/react-router";
import React, { useMemo, useState } from "react";
import { Pagination } from "@/components/pagination";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { BreadcrumbHeader } from "@/components/breadcrumb-header";

export const Route = createLazyFileRoute("/app/deploy/")({
  component: RouteComponent,
});

enum DeploymentStep {
  INSTALL_DEPENDENCIES,
  RUN_DEV_MODE,
  DEPLOY,
}

const steps = [
  { step: DeploymentStep.INSTALL_DEPENDENCIES, label: "Install Dependencies" },
  { step: DeploymentStep.RUN_DEV_MODE, label: "Dev Mode" },
  { step: DeploymentStep.DEPLOY, label: "Go Live" },
];

function RouteComponent() {
  const router = useRouter();

  const [step, setStep] = useState<DeploymentStep>(
    DeploymentStep.INSTALL_DEPENDENCIES
  );
  const currentStepIndex = steps.findIndex((s) => s.step === step);

  const next = () => {
    if (currentStepIndex < steps.length - 1) {
      setStep(steps[currentStepIndex + 1].step);
    } else {
      router.navigate({ to: "/app/verify" });
    }
  };

  const previous = () => {
    if (currentStepIndex > 0) {
      setStep(steps[currentStepIndex - 1].step);
    }
  };

  const breadcrumb = useMemo(() => {
    return steps.reduce(
      (acc, s) => {
        if (s.step > step) return acc;
        else return [...acc, { id: s.step, label: s.label }];
      },
      [] as { id: number; label: string }[]
    );
  }, [step]);

  return (
    <>
      <BreadcrumbHeader
        title="Deploy"
        breadcrumb={breadcrumb}
        onBreadcrumbClick={(id) => setStep(id)}
      />

      <main className="p-4 pt-0 pb-20">
        {step === DeploymentStep.INSTALL_DEPENDENCIES && (
          <InstallDependenciesStep />
        )}
        {step === DeploymentStep.RUN_DEV_MODE && <RunDevModeStep />}
        {step === DeploymentStep.DEPLOY && <DeployStep />}

        <Pagination
          className="mt-6"
          prev={{ disabled: currentStepIndex === 0, onClick: previous }}
          next={{ onClick: next }}
        />
      </main>
    </>
  );
}

const InstallDependenciesStep: React.FC = () => {
  return (
    <Card>
      <CardTitle>Install Opruaas</CardTitle>
      <CardDescription className="mt-4 md:mt-6">
        Install dependencies if needed. Docker, Kubernetes, Helm, Aws. Then
        install opruaas cli with
      </CardDescription>

      <Command className="mt-10" command="npm i -g @wakeuplabs/opruaas" />
    </Card>
  );
};

const RunDevModeStep: React.FC = () => {
  return (
    <Card>
      <CardTitle>Run in dev mode</CardTitle>
      <CardDescription className="mt-4 md:mt-6">
        Run from inside the project directory
      </CardDescription>

      <Command className="mt-10" command="npx opruaas -v dev --default" />
    </Card>
  );
};

const DeployStep: React.FC = () => {
  return (
    <Card>
      <CardTitle>Go Live</CardTitle>
      <CardDescription className="mt-4 md:mt-6">
        Run from inside the project directory
      </CardDescription>

      <Command
        className="mt-10"
        command="opruaas -v deploy --deployment-id holensky --deployment-name 'My Prod Deployment' --target all"
      />
    </Card>
  );
};
