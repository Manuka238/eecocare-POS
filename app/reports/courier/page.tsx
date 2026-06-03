"use client";
import { AppShell } from "@/components/app-shell";
import { useThemeMode } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import { courierPerformance } from "@/lib/crh-data";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { CourierSubNav } from "@/components/courier-sub-nav";

export default function CourierReportPage() {
  const { dark } = useThemeMode();
  const axisColor = dark ? "#64748B" : "#94A3B8";

  return (
    <AppShell title="Courier Reports" description="Per-courier performance analysis">
      <div className="space-y-6">
        <CourierSubNav activeTab="reports" />
        <div className={cn("rounded-3xl border p-5", dark ? "border-white/10 bg-slate-900/80" : "border-slate-200 bg-white")}>
          <h3 className="font-semibold mb-4">Courier Comparison</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={courierPerformance}>
              <CartesianGrid strokeDasharray="3 3" stroke={dark ? "#1E293B" : "#F1F5F9"} />
              <XAxis dataKey="courier" tick={{ fill: axisColor, fontSize: 12 }} />
              <YAxis tick={{ fill: axisColor, fontSize: 12 }} />
              <Tooltip contentStyle={{ backgroundColor: dark ? "#1E293B" : "#FFF", borderColor: dark ? "#334155" : "#E2E8F0", borderRadius: 12 }} />
              <Legend />
              <Bar dataKey="delivered" fill="#10B981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="rescheduled" fill="#EAB308" radius={[4, 4, 0, 0]} />
              <Bar dataKey="failed" fill="#EF4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="returned" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className={cn("rounded-3xl border overflow-hidden", dark ? "border-white/10 bg-slate-900/80" : "border-slate-200 bg-white")}>
          <div className="p-5 pb-3"><h3 className="font-semibold">Detailed Performance</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className={cn("text-left text-xs uppercase tracking-wider", dark ? "bg-slate-800 text-slate-400" : "bg-slate-50 text-slate-500")}>
                <th className="px-4 py-3 font-medium">Courier</th><th className="px-4 py-3 font-medium">Total</th><th className="px-4 py-3 font-medium">Delivered</th><th className="px-4 py-3 font-medium">Rescheduled</th><th className="px-4 py-3 font-medium">Failed</th><th className="px-4 py-3 font-medium">Returned</th><th className="px-4 py-3 font-medium">Success Rate</th>
              </tr></thead>
              <tbody>
                {courierPerformance.map((c) => (
                  <tr key={c.courier} className={cn("border-t transition-colors", dark ? "border-white/5 hover:bg-white/5" : "border-slate-100 hover:bg-slate-50")}>
                    <td className="px-4 py-3 font-semibold">{c.courier}</td>
                    <td className="px-4 py-3">{c.totalOrders}</td>
                    <td className="px-4 py-3 text-emerald-400">{c.delivered}</td>
                    <td className="px-4 py-3 text-yellow-400">{c.rescheduled}</td>
                    <td className="px-4 py-3 text-red-400">{c.failed}</td>
                    <td className="px-4 py-3 text-purple-400">{c.returned}</td>
                    <td className="px-4 py-3"><div className="flex items-center gap-2"><div className={cn("h-2 rounded-full", dark ? "bg-slate-700" : "bg-slate-200")} style={{ width: 60 }}><div className="h-2 rounded-full bg-gradient-to-r from-violet-500 to-blue-500" style={{ width: `${c.successRate}%` }} /></div><span className={cn("font-bold text-xs", c.successRate >= 90 ? "text-emerald-400" : c.successRate >= 80 ? "text-yellow-400" : "text-red-400")}>{c.successRate}%</span></div></td>
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
