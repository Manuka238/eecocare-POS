"use client";
import { AppShell } from "@/components/app-shell";
import { useThemeMode } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import { monthlyTrends, courierPerformance } from "@/lib/crh-data";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { TrendingUp, CheckCircle, RotateCcw, XCircle } from "lucide-react";
import { FilteredStatCard } from "@/components/filtered-orders";

export default function MonthlyReportPage() {
  const { dark } = useThemeMode();
  const axisColor = dark ? "#64748B" : "#94A3B8";
  const latest = monthlyTrends[monthlyTrends.length - 1];

  return (
    <AppShell title="Monthly Report" description="Monthly trends and performance summary">
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <FilteredStatCard title="Delivered" value={latest.delivered} accent="#10B981" icon={<CheckCircle className="h-5 w-5" />} />
          <FilteredStatCard title="Rescheduled" value={latest.rescheduled} accent="#EAB308" icon={<RotateCcw className="h-5 w-5" />} />
          <FilteredStatCard title="Failed" value={latest.failed} accent="#EF4444" icon={<XCircle className="h-5 w-5" />} />
          <FilteredStatCard title="Returns" value={latest.returns} accent="#8B5CF6" icon={<TrendingUp className="h-5 w-5" />} />
        </div>
        <div className={cn("rounded-3xl border p-5", dark ? "border-white/10 bg-slate-900/80" : "border-slate-200 bg-white")}>
          <h3 className="font-semibold mb-4">Monthly Trends</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={monthlyTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke={dark ? "#1E293B" : "#F1F5F9"} />
              <XAxis dataKey="month" tick={{ fill: axisColor, fontSize: 12 }} />
              <YAxis tick={{ fill: axisColor, fontSize: 12 }} />
              <Tooltip contentStyle={{ backgroundColor: dark ? "#1E293B" : "#FFF", borderColor: dark ? "#334155" : "#E2E8F0", borderRadius: 12 }} />
              <Legend />
              <Bar dataKey="delivered" fill="#10B981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="rescheduled" fill="#EAB308" radius={[4, 4, 0, 0]} />
              <Bar dataKey="failed" fill="#EF4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="returns" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className={cn("rounded-3xl border p-5", dark ? "border-white/10 bg-slate-900/80" : "border-slate-200 bg-white")}>
          <h3 className="font-semibold mb-4">Courier Ranking</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className={cn("text-left text-xs uppercase tracking-wider", dark ? "text-slate-400" : "text-slate-500")}>
                <th className="px-4 py-2 font-medium">#</th><th className="px-4 py-2 font-medium">Courier</th><th className="px-4 py-2 font-medium">Orders</th><th className="px-4 py-2 font-medium">Delivered</th><th className="px-4 py-2 font-medium">Success Rate</th>
              </tr></thead>
              <tbody>
                {courierPerformance.sort((a, b) => b.successRate - a.successRate).map((c, i) => (
                  <tr key={c.courier} className={cn("border-t", dark ? "border-white/5" : "border-slate-100")}>
                    <td className="px-4 py-2.5 font-bold">{i + 1}</td>
                    <td className="px-4 py-2.5 font-medium">{c.courier}</td>
                    <td className="px-4 py-2.5">{c.totalOrders}</td>
                    <td className="px-4 py-2.5">{c.delivered}</td>
                    <td className="px-4 py-2.5"><span className={cn("font-semibold", c.successRate >= 90 ? "text-emerald-400" : c.successRate >= 80 ? "text-yellow-400" : "text-red-400")}>{c.successRate}%</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
