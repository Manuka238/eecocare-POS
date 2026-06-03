"use client";
import { useMemo } from "react";
import { AppShell } from "@/components/app-shell";
import { orders } from "@/lib/crh-data";
import { FilteredStatCard, FilteredOrdersTable } from "@/components/filtered-orders";
import { Clock, RefreshCw, AlertTriangle, DollarSign } from "lucide-react";

export default function RescheduledOrdersPage() {
  const rescheduled = useMemo(() => orders.filter((o) => o.status.startsWith("rescheduled")), []);
  const totalValue = rescheduled.reduce((s, o) => s + o.price, 0);
  const r1 = rescheduled.filter((o) => o.status === "rescheduled_01").length;
  const r3plus = rescheduled.filter((o) => parseInt(o.status.split("_")[1] || "0") >= 3).length;

  return (
    <AppShell title="Rescheduled Orders" description="Orders requiring re-delivery coordination">
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <FilteredStatCard title="Total Rescheduled" value={rescheduled.length} accent="#EAB308" icon={<RefreshCw className="h-5 w-5" />} />
          <FilteredStatCard title="Reschedule 1" value={r1} accent="#F59E0B" icon={<Clock className="h-5 w-5" />} />
          <FilteredStatCard title="Reschedule 3+" value={r3plus} accent="#F97316" icon={<AlertTriangle className="h-5 w-5" />} />
          <FilteredStatCard title="Total Value" value={`Rs. ${totalValue.toLocaleString()}`} accent="#8B5CF6" icon={<DollarSign className="h-5 w-5" />} />
        </div>
        <FilteredOrdersTable data={rescheduled} />
      </div>
    </AppShell>
  );
}
