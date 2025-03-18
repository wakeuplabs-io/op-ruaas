import { Pagination } from "@/components/pagination";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/lib/hooks/use-toast";
import { useCreateProjectMutation } from "@/lib/queries/project";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { DownloadIcon } from "lucide-react";
import React, { useCallback, useMemo, useState } from "react";

export const Route = createFileRoute("/create/setup/")({
  component: RouteComponent,
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

function RouteComponent() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState<SetupStep>(SetupStep.L1_CHAIN);
  const [mainnet, setMainnet] = useState<boolean>(false);
  const [chainId, setChainId] = useState<number>(128930);
  const [governanceSymbol, setGovernanceSymbol] = useState<string>("");
  const [governanceName, setGovernanceName] = useState<string>("");

  const { mutateAsync, isPending } = useCreateProjectMutation();

  const onDownload = useCallback(async () => {
    try {
      const res = await mutateAsync({
        mainnet,
        chainId,
        governanceSymbol,
        governanceName,
      });
      const url = window.URL.createObjectURL(res);
      window.open(url, "_blank");
    } catch (e) {
      toast({
        title: "Error",
        description: "Failed to create project",
        variant: "destructive",
      });
    }
  }, [mainnet, chainId, governanceName, governanceSymbol]);

  const currentStepIndex = useMemo(
    () => steps.findIndex((s) => s.step === step),
    [step]
  );

  const next = useCallback(() => {
    if (currentStepIndex < steps.length - 1) {
      setStep(steps[currentStepIndex + 1].step);
    } else {
      router.navigate({ to: "/create/deploy" });
    }
  }, [currentStepIndex]);

  const previous = useCallback(() => {
    if (currentStepIndex > 0) {
      setStep(steps[currentStepIndex - 1].step);
    }
  }, [currentStepIndex]);

  return (
    <>
      <main className="p-6">
        {step == SetupStep.L1_CHAIN && (
          <L1ChainStep mainnet={mainnet} setMainnet={setMainnet} />
        )}
        {step == SetupStep.L2_CHAIN && (
          <L2ChainStep chainId={chainId} setChainId={setChainId} />
        )}
        {step == SetupStep.GOVERNANCE && (
          <L2GovernanceStep
            name={governanceName}
            setName={setGovernanceName}
            symbol={governanceSymbol}
            setSymbol={setGovernanceSymbol}
          />
        )}
        {step == SetupStep.DOWNLOAD && (
          <DownloadStep onDownload={onDownload} isPending={isPending} />
        )}

        <Pagination
          className="mt-6"
          prev={{ disabled: currentStepIndex === 0, onClick: previous }}
          next={{ onClick: next }}
        />
      </main>
    </>
  );
}

const L1ChainStep: React.FC<{
  mainnet: boolean;
  setMainnet: (mainnet: boolean) => void;
}> = ({ mainnet, setMainnet }) => {
  return (
    <Card>
      <CardTitle>L1 chain</CardTitle>
      <CardDescription className="mt-4 md:mt-6">
        The L1 chain to which your rollup will be posting transactions. Think of
        it as an exchange between costs and security.
      </CardDescription>

      <div className="flex items-center justify-between mt-10 px-4 h-12 text-sm border rounded-lg">
        <span className="text-sm">Ethereum mainnet</span>
        <Switch checked={mainnet} onCheckedChange={setMainnet} />
      </div>
    </Card>
  );
};

const L2ChainStep: React.FC<{
  chainId: number;
  setChainId: (chainId: number) => void;
}> = ({ chainId, setChainId }) => {
  return (
    <Card>
      <CardTitle>Your L2 Chain Details</CardTitle>
      <CardDescription className="mt-4 md:mt-6">
        Define core parameters for your L2 chain. For more advanced options fine
        tune the generated config file before deployment.
      </CardDescription>

      <Input
        type="number"
        value={chainId}
        onChange={(e) => setChainId(Number(e.target.value))}
        className="mt-10"
        placeholder="L2 chain id"
      />
    </Card>
  );
};

const L2GovernanceStep: React.FC<{
  name: string;
  setName: (name: string) => void;
  symbol: string;
  setSymbol: (symbol: string) => void;
}> = ({ name, setName, symbol, setSymbol }) => {
  return (
    <Card>
      <CardTitle>L2 Governance</CardTitle>
      <CardDescription className="mt-4 md:mt-6">
        Define core parameters for your L2 chain. For more advanced options fine
        tune the generated config file before deployment.
      </CardDescription>

      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="mt-10"
        placeholder="Token name"
      />

      <Input
        value={symbol}
        onChange={(e) => setSymbol(e.target.value)}
        className="mt-2"
        placeholder="Token symbol"
      />
    </Card>
  );
};

const DownloadStep: React.FC<{
  onDownload: () => void;
  isPending: boolean;
}> = ({ onDownload, isPending }) => {
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
        onClick={onDownload}
        disabled={isPending}
        size="lg"
        variant="secondary"
        className="w-full mt-4"
      >
        {isPending ? (
          "Downloading..."
        ) : (
          <>
            Download <DownloadIcon />
          </>
        )}
      </Button>
    </>
  );
};
