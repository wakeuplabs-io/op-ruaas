import { RollupHeader } from "@/components/rollup-detail/rollup-header";
import { createLazyFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Clock, Download, OctagonAlert } from "lucide-react";
import { useOrderDetails } from "@/lib/hooks/use-order";
import { DeploymentValue } from "@/components/rollup-detail/deployment-value";
import { useCallback } from "react";
import { pinata } from "@/lib/pinata";
import { NotFoundPage } from "@/components/not-found";

export const Route = createLazyFileRoute("/rollups/$id")({
  component: RollupDashboard,
});

export default function RollupDashboard() {
  const { id } = Route.useParams();
  const { data, isLoading, refetch } = useOrderDetails({ id: BigInt(id) });

  const onDownload = useCallback(async () => {
    const artifactsCid = data?.order.deploymentMetadata.artifacts;
    if (!artifactsCid) return;

    const gatewayUrl = await pinata.gateways.public.convert(artifactsCid);
    window.open(gatewayUrl, "_blank");
  }, [data]);

  if(isLoading && !data) {
    <></>
  }

  if (!data) {
    return <NotFoundPage />;
  }

  const { order, offer } = data;
  return (
    <div className="md:p-6 space-y-6">
      <RollupHeader order={{ ...order, id: BigInt(id) }} offer={offer} refetch={refetch} />

      {order.fulfilledAt > 0 ? (
        <div>
          <div className="rounded-lg bg-gradient-to-l from-gray-300 to-transparent p-px">
            <div className="px-8 py-6 bg-white rounded-[calc(0.6rem-1px)]">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-9">
                {Object.entries(order.deploymentMetadata.addresses).map(
                  ([key, value], index) => (
                    <DeploymentValue
                      key={index}
                      value={value as string}
                      description={key as string}
                    />
                  )
                )}
              </div>
            </div>
          </div>

          <Button
            variant="secondary"
            className="w-full mt-6 py-6 flex gap-2 items-center justify-center"
            onClick={onDownload}
          >
            <Download className="h-5 w-5" />
            Download zip
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-6">
          <div className="rounded-lg bg-gradient-to-l from-[#FFD813] to-transparent p-px">
            <div className="p-12 shadow-sm bg-white rounded-[calc(0.6rem-1px)] border-gray-200 flex flex-col items-center justify-center h-[360px]">
              <div className="h-20 w-20 rounded-full bg-[#FFF1C7] flex items-center justify-center mb-12 mx-auto">
                <Clock className="text-[#FFD813] h-12 w-12" />
              </div>

              <div className="text-xl font-medium mb-6">
                Waiting for provider
              </div>
              <div className="text-sm text-muted-foreground max-w-sm mx-auto text-center">
                Your Rollup is being processed and should be active within the
                next 24 hours.
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-gradient-to-l from-[#6696AF] to-transparent p-px">
            <div className="p-12 shadow-sm bg-white rounded-[calc(0.6rem-1px)] border-gray-200 flex flex-col items-center justify-center h-[360px]">
              <div className="h-20 w-20 rounded-full bg-[#DEF4FF] flex items-center justify-center mb-12 mx-auto">
                <OctagonAlert className="text-[#6696AF] h-12 w-12" />
              </div>

              <div className="text-xl font-medium mb-6">
                Cancellation Policy
              </div>
              <div className="text-sm text-muted-foreground max-w-sm mx-auto text-center">
                Once the service is active, you will have 48 hours to review it
                and unsubscribe before being charged.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
