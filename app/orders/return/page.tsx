"use client";
import { useMemo } from "react";
import { AppShell } from "@/components/app-shell";
import { orders } from "@/lib/crh-data";
import { FilteredStatCard, FilteredOrdersTable } from "@/components/filtered-orders";
import { RotateCcw, Package, ArrowDownCircle, DollarSign } from "lucide-react";

export default function ReturnOrdersPage() {
  const returns = useMemo(() => orders.filter((o) => o.status.includes("return")), []);
  const requested = returns.filter((o) => o.status === "return_requested").length;
  const ho = returns.filter((o) => o.status === "return_ho").length;
  const client = returns.filter((o) => o.status === "return_client").length;
  const totalValue = returns.reduce((s, o) => s + o.price, 0);

  return (
    <AppShell title="Return Orders" description="Track and manage order returns">
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <FilteredStatCard title="Return Requested" value={requested} accent="#8B5CF6" icon={<RotateCcw className="h-5 w-5" />} />
          <FilteredStatCard title="Return to HO" value={ho} accent="#DC2626" icon={<Package className="h-5 w-5" />} />
          <FilteredStatCard title="Return to Client" value={client} accent="#991B1B" icon={<ArrowDownCircle className="h-5 w-5" />} />
          <FilteredStatCard title="Total Value" value={`Rs. ${totalValue.toLocaleString()}`} accent="#F97316" icon={<DollarSign className="h-5 w-5" />} />
        </div>
        <FilteredOrdersTable data={returns} />
      </div>
    </AppShell>
  );
}
