"use client";
import { useMemo } from "react";
import { AppShell } from "@/components/app-shell";
import { orders } from "@/lib/crh-data";
import { FilteredStatCard, FilteredOrdersTable } from "@/components/filtered-orders";
import { CheckCircle, DollarSign, CalendarCheck, TrendingUp } from "lucide-react";

export default function DeliveredOrdersPage() {
  const delivered = useMemo(() => orders.filter((o) => o.status === "delivered"), []);
  const totalValue = delivered.reduce((s, o) => s + o.price, 0);

  return (
    <AppShell title="Delivered Orders" description="Successfully completed deliveries">
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <FilteredStatCard title="Total Delivered" value={delivered.length} accent="#10B981" icon={<CheckCircle className="h-5 w-5" />} />
          <FilteredStatCard title="Total Revenue" value={`Rs. ${totalValue.toLocaleString()}`} accent="#3B82F6" icon={<DollarSign className="h-5 w-5" />} />
          <FilteredStatCard title="Today" value={3} accent="#8B5CF6" icon={<CalendarCheck className="h-5 w-5" />} />
          <FilteredStatCard title="Success Rate" value="87.5%" accent="#10B981" icon={<TrendingUp className="h-5 w-5" />} />
        </div>
        <FilteredOrdersTable data={delivered} showUrgent={false} />
      </div>
    </AppShell>
  );
}
