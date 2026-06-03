"use client";
import { AppShell } from "@/components/app-shell";
import { useThemeMode } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import { districtPerformance } from "@/lib/crh-data";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export default function DistrictAnalyticsPage() {
  const { dark } = useThemeMode();
  const axisColor = dark ? "#64748B" : "#94A3B8";
  const sorted = [...districtPerformance].sort((a, b) => b.orders - a.orders);

  return (
    <AppShell title="District Analytics" description="Geographic performance breakdown">
      <div className="space-y-6">
        <div className={cn("rounded-3xl border p-5", dark ? "border-white/10 bg-slate-900/80" : "border-slate-200 bg-white")}>
          <h3 className="font-semibold mb-4">Orders by District</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={sorted.slice(0, 10)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={dark ? "#1E293B" : "#F1F5F9"} />
              <XAxis type="number" tick={{ fill: axisColor, fontSize: 12 }} />
              <YAxis dataKey="district" type="category" width={100} tick={{ fill: axisColor, fontSize: 12 }} />
              <Tooltip contentStyle={{ backgroundColor: dark ? "#1E293B" : "#FFF", borderRadius: 12 }} />
              <Bar dataKey="orders" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className={cn("rounded-3xl border overflow-hidden", dark ? "border-white/10 bg-slate-900/80" : "border-slate-200 bg-white")}>
          <div className="p-5 pb-3"><h3 className="font-semibold">District Performance</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className={cn("text-left text-xs uppercase tracking-wider", dark ? "bg-slate-800 text-slate-400" : "bg-slate-50 text-slate-500")}>
                <th className="px-4 py-3 font-medium">District</th><th className="px-4 py-3 font-medium">Orders</th><th className="px-4 py-3 font-medium">Delivered</th><th className="px-4 py-3 font-medium">Returns</th><th className="px-4 py-3 font-medium">Fail Rate</th><th className="px-4 py-3 font-medium">Reschedule Rate</th>
              </tr></thead>
              <tbody>
                {sorted.map((d) => (
                  <tr key={d.district} className={cn("border-t transition-colors", dark ? "border-white/5 hover:bg-white/5" : "border-slate-100 hover:bg-slate-50")}>
                    <td className="px-4 py-3 font-semibold">{d.district}</td>
                    <td className="px-4 py-3">{d.orders}</td>
                    <td className="px-4 py-3 text-emerald-400">{d.delivered}</td>
                    <td className="px-4 py-3 text-red-400">{d.returns}</td>
                    <td className="px-4 py-3"><span className={cn("font-medium", d.failRate <= 6 ? "text-emerald-400" : d.failRate <= 10 ? "text-yellow-400" : "text-red-400")}>{d.failRate}%</span></td>
                    <td className="px-4 py-3"><span className={cn("font-medium", d.rescheduledRate <= 8 ? "text-emerald-400" : d.rescheduledRate <= 12 ? "text-yellow-400" : "text-red-400")}>{d.rescheduledRate}%</span></td>
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
