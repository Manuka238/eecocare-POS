"use client";
import { useMemo } from "react";
import { AppShell } from "@/components/app-shell";
import { orders } from "@/lib/crh-data";
import { FilteredStatCard, FilteredOrdersTable } from "@/components/filtered-orders";
import { XCircle, DollarSign, Clock, TrendingDown } from "lucide-react";

export default function FailedOrdersPage() {
  const failed = useMemo(() => orders.filter((o) => o.status === "failed"), []);
  const totalValue = failed.reduce((s, o) => s + o.price, 0);

  return (
    <AppShell title="Failed Deliveries" description="Orders that failed delivery attempts">
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <FilteredStatCard title="Total Failed" value={failed.length} accent="#EF4444" icon={<XCircle className="h-5 w-5" />} />
          <FilteredStatCard title="Total Value" value={`Rs. ${totalValue.toLocaleString()}`} accent="#F97316" icon={<DollarSign className="h-5 w-5" />} />
          <FilteredStatCard title="Avg Attempts" value="2.4" accent="#F59E0B" icon={<Clock className="h-5 w-5" />} />
          <FilteredStatCard title="Recovery Rate" value="62%" accent="#10B981" icon={<TrendingDown className="h-5 w-5" />} />
        </div>
        <FilteredOrdersTable data={failed} />
      </div>
    </AppShell>
  );
}
