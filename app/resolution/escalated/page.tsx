"use client";
import { useMemo } from "react";
import { AppShell } from "@/components/app-shell";
import { useThemeMode } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import { orders, actionTimeline, ORDER_STATUSES } from "@/lib/crh-data";
import { FilteredStatCard } from "@/components/filtered-orders";
import { ArrowUpCircle, CheckCircle, Clock, Timer } from "lucide-react";

export default function EscalatedOrdersPage() {
  const { dark } = useThemeMode();
  const escalations = useMemo(() => actionTimeline.filter((a) => a.type === "escalation"), []);
  const escalatedOrders = useMemo(() => escalations.map((e) => ({ ...e, order: orders.find((o) => o.id === e.orderId) })).filter((e) => e.order), [escalations]);

  const avgResolution = useMemo(() => {
    return "0 hrs";
  }, []);

  return (
    <AppShell title="Escalated Orders" description="Orders requiring supervisor attention">
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <FilteredStatCard title="Total Escalated" value={escalations.length} accent="#EF4444" icon={<ArrowUpCircle className="h-5 w-5" />} />
          <FilteredStatCard title="Resolved" value={0} accent="#10B981" icon={<CheckCircle className="h-5 w-5" />} />
          <FilteredStatCard title="Pending" value={escalations.length} accent="#F59E0B" icon={<Clock className="h-5 w-5" />} />
          <FilteredStatCard title="Avg Resolution" value={avgResolution} accent="#8B5CF6" icon={<Timer className="h-5 w-5" />} />
        </div>
        <div className={cn("rounded-3xl border overflow-hidden", dark ? "border-white/10 bg-slate-900/80" : "border-slate-200 bg-white")}>
          <table className="w-full text-sm">
            <thead><tr className={cn("text-left text-xs uppercase tracking-wider", dark ? "bg-slate-800 text-slate-400" : "bg-slate-50 text-slate-500")}>
              <th className="px-4 py-3 font-medium">Order No</th><th className="px-4 py-3 font-medium">Customer</th><th className="px-4 py-3 font-medium">Reason</th><th className="px-4 py-3 font-medium">Escalated By</th><th className="px-4 py-3 font-medium">Date</th><th className="px-4 py-3 font-medium">Status</th>
            </tr></thead>
            <tbody>
              {escalatedOrders.map((e) => (
                <tr key={e.id} className={cn("border-t transition-colors", dark ? "border-white/5 hover:bg-white/5" : "border-slate-100 hover:bg-slate-50")}>
                  <td className="px-4 py-3 font-semibold">{e.order!.orderNumber}</td>
                  <td className="px-4 py-3">{e.order!.customerName}</td>
                  <td className="px-4 py-3 text-xs">{e.notes}</td>
                  <td className="px-4 py-3">{e.createdBy}</td>
                  <td className="px-4 py-3 text-xs">{new Date(e.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3"><span className="inline-flex rounded-full px-2.5 py-1 text-xs font-medium text-white" style={{ backgroundColor: ORDER_STATUSES.find((s) => s.value === e.order!.status)?.color }}>{ORDER_STATUSES.find((s) => s.value === e.order!.status)?.label}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
