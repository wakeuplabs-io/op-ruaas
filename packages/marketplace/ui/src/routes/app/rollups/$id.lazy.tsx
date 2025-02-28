"use client";

import { AddressManagerList } from "@/components/rollup-detail/address-manager-list";
import { DownloadSection } from "@/components/rollup-detail/download-button";
import { RollupActions } from "@/components/rollup-detail/rollup-actions";
import { RollupHeader } from "@/components/rollup-detail/rollup-header";
import { RollupInfo } from "@/components/rollup-detail/rollup-info";
import { Card } from "@/components/ui/card";
import { createLazyFileRoute } from '@tanstack/react-router'
import { useParams } from "@tanstack/react-router";

export const Route = createLazyFileRoute('/app/rollups/$id')({
  component: RollupDashboard,
})

export default function RollupDashboard() {
  const { id } = useParams({ from: "/app/rollups/$id" });

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <Card className="p-6 border rounded-lg">
        <RollupHeader />
        <RollupActions orderId={id} />
        <RollupInfo />
      </Card>

      <Card className="p-6 border rounded-lg">
        <AddressManagerList />
        <DownloadSection />
      </Card>
    </div>
  );
}
