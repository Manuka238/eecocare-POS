"use client";
import { useMemo } from "react";
import { AppShell } from "@/components/app-shell";
import { orders } from "@/lib/crh-data";
import { FilteredStatCard, FilteredOrdersTable } from "@/components/filtered-orders";
import { Ban, DollarSign, CalendarX, RefreshCw } from "lucide-react";

export default function CancelledOrdersPage() {
  const cancelled = useMemo(() => orders.filter((o) => o.status === "cancelled"), []);
  const totalValue = cancelled.reduce((s, o) => s + o.price, 0);

  return (
    <AppShell title="Cancelled Orders" description="Orders cancelled by customers">
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <FilteredStatCard title="Total Cancelled" value={cancelled.length} accent="#6B7280" icon={<Ban className="h-5 w-5" />} />
          <FilteredStatCard title="Lost Revenue" value={`Rs. ${totalValue.toLocaleString()}`} accent="#EF4444" icon={<DollarSign className="h-5 w-5" />} />
          <FilteredStatCard title="This Month" value={cancelled.length} accent="#F59E0B" icon={<CalendarX className="h-5 w-5" />} />
          <FilteredStatCard title="Recovery Attempts" value={2} accent="#8B5CF6" icon={<RefreshCw className="h-5 w-5" />} />
        </div>
        <FilteredOrdersTable data={cancelled} showUrgent={false} />
      </div>
    </AppShell>
  );
}
