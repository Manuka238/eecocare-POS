"use client";
import { useMemo } from "react";
import { AppShell } from "@/components/app-shell";
import { useThemeMode } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import { orders, actionTimeline, ORDER_STATUSES, URGENT_LEVELS } from "@/lib/crh-data";
import { FilteredStatCard } from "@/components/filtered-orders";
import { Clock, AlertTriangle, CalendarClock, Timer } from "lucide-react";

export default function PendingIssuesPage() {
  const { dark } = useThemeMode();
  const pending = useMemo(() => orders.filter((o) => o.status.startsWith("rescheduled") || o.status === "failed" || o.status.includes("return")), []);
  const overdue = pending.filter((o) => { const d = new Date(o.lastActionDate); const now = new Date(); return (now.getTime() - d.getTime()) > 86400000; });

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);
  const todayFollowUps = useMemo(() => {
    return actionTimeline.filter((a) => a.followUpRequired && a.nextFollowUp === todayStr).length;
  }, [todayStr]);

  const avgWaitTime = useMemo(() => {
    if (pending.length === 0) return "0 hrs";
    const totalHours = pending.reduce((sum, o) => {
      const hoursAgo = Math.floor((new Date().getTime() - new Date(o.lastActionDate).getTime()) / 3600000);
      return sum + hoursAgo;
    }, 0);
    return `${Math.round(totalHours / pending.length)} hrs`;
  }, [pending]);

  return (
    <AppShell title="Pending Issues" description="Unresolved orders requiring attention">
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <FilteredStatCard title="Total Pending" value={pending.length} accent="#F59E0B" icon={<Clock className="h-5 w-5" />} />
          <FilteredStatCard title="Overdue (>24hrs)" value={overdue.length} accent="#EF4444" icon={<AlertTriangle className="h-5 w-5" />} />
          <FilteredStatCard title="Today's Follow-ups" value={todayFollowUps} accent="#3B82F6" icon={<CalendarClock className="h-5 w-5" />} />
          <FilteredStatCard title="Avg Wait Time" value={avgWaitTime} accent="#8B5CF6" icon={<Timer className="h-5 w-5" />} />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {pending.map((o) => {
            const lastActions = actionTimeline.filter((a) => a.orderId === o.id);
            const lastAction = lastActions[lastActions.length - 1];
            const hoursAgo = Math.floor((new Date().getTime() - new Date(o.lastActionDate).getTime()) / 3600000);
            const isOverdue = hoursAgo > 24;
            return (
              <div key={o.id} className={cn("rounded-2xl border p-4 transition-all duration-200 card-hover", dark ? "border-white/10 bg-slate-900/80" : "border-slate-200 bg-white", isOverdue && "border-l-4 border-l-red-500")}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{o.orderNumber}</span>
                    <span className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium text-white" style={{ backgroundColor: ORDER_STATUSES.find((s) => s.value === o.status)?.color }}>{ORDER_STATUSES.find((s) => s.value === o.status)?.label}</span>
                  </div>
                  {isOverdue && <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-bold text-red-400">OVERDUE</span>}
                </div>
                <p className={cn("text-sm mt-1", dark ? "text-slate-300" : "text-slate-700")}>{o.customerName} — {o.courier}</p>
                <p className={cn("text-xs mt-1", dark ? "text-slate-500" : "text-slate-400")}>Last action: {o.lastAction}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className={cn("text-xs", isOverdue ? "text-red-400" : "text-slate-400")}>{hoursAgo}h ago</span>
                  <span className="text-xs text-slate-400">{o.actionCount} actions • Rs. {o.price.toLocaleString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
