"use client";

import { AddressManagerList } from "@/components/rollup-detail/address-manager-list";
import { DownloadSection } from "@/components/rollup-detail/download-button";
import { RollupActions } from "@/components/rollup-detail/rollup-actions";
import { RollupHeader } from "@/components/rollup-detail/rollup-header";
import { RollupInfo } from "@/components/rollup-detail/rollup-info";
import { Card } from "@/components/ui/card";
import { useOrderDetails } from "@/hooks/use-order-details";
import { createLazyFileRoute } from '@tanstack/react-router'
import { useParams } from "@tanstack/react-router";
import { useState } from "react";
import { cn } from "@/lib/utils";

export const Route = createLazyFileRoute('/app/rollups/$id')({
  component: RollupDashboard,
});

export default function RollupDashboard() {
  const { id } = useParams({ from: "/app/rollups/$id" });
  const { offer } = useOrderDetails(id);
  const [statusColor, setStatusColor] = useState("gray-200");
  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <Card className={cn("p-6 border rounded-lg", `border-${statusColor}`)}>
        <RollupHeader />
        <RollupActions orderId={id} offer={offer} setStatusColor={setStatusColor} statusColor={statusColor} />
        <RollupInfo />
      </Card>

      <Card className="p-6 border rounded-lg">
        <AddressManagerList />
        <DownloadSection />
      </Card>
    </div>
  );
}
