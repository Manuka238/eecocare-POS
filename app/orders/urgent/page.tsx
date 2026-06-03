"use client";
import { useMemo } from "react";
import { AppShell } from "@/components/app-shell";
import { orders } from "@/lib/crh-data";
import { FilteredStatCard, FilteredOrdersTable } from "@/components/filtered-orders";
import { AlertTriangle, Zap, AlertOctagon, Flame } from "lucide-react";

export default function UrgentOrdersPage() {
  const urgent = useMemo(() => orders.filter((o) => o.urgentLevel !== "none").sort((a, b) => { const rank: Record<string,number> = { critical: 0, high: 1, medium: 2, low: 3 }; return (rank[a.urgentLevel] ?? 4) - (rank[b.urgentLevel] ?? 4); }), []);
  const critical = urgent.filter((o) => o.urgentLevel === "critical").length;
  const high = urgent.filter((o) => o.urgentLevel === "high").length;
  const medium = urgent.filter((o) => o.urgentLevel === "medium").length;
  const low = urgent.filter((o) => o.urgentLevel === "low").length;

  return (
    <AppShell title="Urgent Orders" description="Priority orders requiring immediate attention">
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <FilteredStatCard title="Critical" value={critical} accent="#EF4444" icon={<Flame className="h-5 w-5" />} />
          <FilteredStatCard title="High" value={high} accent="#F97316" icon={<AlertOctagon className="h-5 w-5" />} />
          <FilteredStatCard title="Medium" value={medium} accent="#F59E0B" icon={<AlertTriangle className="h-5 w-5" />} />
          <FilteredStatCard title="Low" value={low} accent="#3B82F6" icon={<Zap className="h-5 w-5" />} />
        </div>
        <FilteredOrdersTable data={urgent} />
      </div>
    </AppShell>
  );
}
