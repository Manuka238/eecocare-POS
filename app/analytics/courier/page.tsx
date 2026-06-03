"use client";
import { AppShell } from "@/components/app-shell";
import { useThemeMode } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import { courierPerformance } from "@/lib/crh-data";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend, PieChart, Pie, Cell } from "recharts";
import { CourierSubNav } from "@/components/courier-sub-nav";

const COLORS = ["#10B981", "#3B82F6", "#8B5CF6", "#F59E0B", "#EF4444"];

export default function CourierAnalyticsPage() {
  const { dark } = useThemeMode();
  const axisColor = dark ? "#64748B" : "#94A3B8";
  const pieData = courierPerformance.map((c) => ({ name: c.courier, value: c.totalOrders }));

  return (
    <AppShell title="Courier Analytics" description="Deep analysis of courier performance">
      <div className="space-y-6">
        <CourierSubNav activeTab="analytics" />
        <div className="grid gap-6 lg:grid-cols-2">
          <div className={cn("rounded-3xl border p-5", dark ? "border-white/10 bg-slate-900/80" : "border-slate-200 bg-white")}>
            <h3 className="font-semibold mb-4">Success Rate by Courier</h3>
            <div className="space-y-4">
              {courierPerformance.map((c) => (
                <div key={c.courier}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{c.courier}</span>
                    <span className={cn("text-sm font-bold", c.successRate >= 90 ? "text-emerald-400" : c.successRate >= 80 ? "text-yellow-400" : "text-red-400")}>{c.successRate}%</span>
                  </div>
                  <div className={cn("h-3 rounded-full", dark ? "bg-slate-700" : "bg-slate-200")}>
                    <div className="h-3 rounded-full bg-gradient-to-r from-violet-500 to-blue-500 transition-all duration-500" style={{ width: `${c.successRate}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className={cn("rounded-3xl border p-5", dark ? "border-white/10 bg-slate-900/80" : "border-slate-200 bg-white")}>
            <h3 className="font-semibold mb-4">Order Distribution</h3>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: dark ? "#1E293B" : "#FFF", borderRadius: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-3 mt-2">
              {pieData.map((p, i) => <span key={p.name} className="flex items-center gap-1.5 text-xs"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />{p.name}</span>)}
            </div>
          </div>
        </div>
        <div className={cn("rounded-3xl border p-5", dark ? "border-white/10 bg-slate-900/80" : "border-slate-200 bg-white")}>
          <h3 className="font-semibold mb-4">Stacked Performance</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={courierPerformance}>
              <CartesianGrid strokeDasharray="3 3" stroke={dark ? "#1E293B" : "#F1F5F9"} />
              <XAxis dataKey="courier" tick={{ fill: axisColor, fontSize: 12 }} />
              <YAxis tick={{ fill: axisColor, fontSize: 12 }} />
              <Tooltip contentStyle={{ backgroundColor: dark ? "#1E293B" : "#FFF", borderRadius: 12 }} />
              <Legend />
              <Bar dataKey="delivered" stackId="a" fill="#10B981" />
              <Bar dataKey="rescheduled" stackId="a" fill="#EAB308" />
              <Bar dataKey="failed" stackId="a" fill="#EF4444" />
              <Bar dataKey="returned" stackId="a" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </AppShell>
  );
}
