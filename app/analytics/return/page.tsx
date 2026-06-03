"use client";
import { AppShell } from "@/components/app-shell";
import { useThemeMode } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import { returnReasons, monthlyTrends } from "@/lib/crh-data";
import { FilteredStatCard } from "@/components/filtered-orders";
import { RotateCcw, TrendingDown, AlertTriangle, Shield } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Line, LineChart, XAxis, YAxis, CartesianGrid } from "recharts";

const COLORS = ["#EF4444", "#F97316", "#F59E0B", "#8B5CF6", "#3B82F6", "#6B7280"];

export default function ReturnAnalyticsPage() {
  const { dark } = useThemeMode();
  const axisColor = dark ? "#64748B" : "#94A3B8";
  const totalReturns = returnReasons.reduce((s, r) => s + r.count, 0);

  return (
    <AppShell title="Return Analytics" description="Understand and reduce returns">
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <FilteredStatCard title="Total Returns" value={totalReturns} accent="#EF4444" icon={<RotateCcw className="h-5 w-5" />} />
          <FilteredStatCard title="Return Rate" value="8.2%" accent="#F97316" icon={<TrendingDown className="h-5 w-5" />} />
          <FilteredStatCard title="Top Reason" value="Wrong Item" accent="#8B5CF6" icon={<AlertTriangle className="h-5 w-5" />} />
          <FilteredStatCard title="Recovery Rate" value="34%" accent="#10B981" icon={<Shield className="h-5 w-5" />} />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className={cn("rounded-3xl border p-5", dark ? "border-white/10 bg-slate-900/80" : "border-slate-200 bg-white")}>
            <h3 className="font-semibold mb-4">Return Reasons</h3>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={returnReasons} cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={3} dataKey="count" nameKey="reason">
                  {returnReasons.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: dark ? "#1E293B" : "#FFF", borderRadius: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-3">
              {returnReasons.map((r, i) => (
                <div key={r.reason} className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-xs"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />{r.reason}</span>
                  <span className="text-xs font-semibold">{r.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
          <div className={cn("rounded-3xl border p-5", dark ? "border-white/10 bg-slate-900/80" : "border-slate-200 bg-white")}>
            <h3 className="font-semibold mb-4">Return Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke={dark ? "#1E293B" : "#F1F5F9"} />
                <XAxis dataKey="month" tick={{ fill: axisColor, fontSize: 12 }} />
                <YAxis tick={{ fill: axisColor, fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: dark ? "#1E293B" : "#FFF", borderRadius: 12 }} />
                <Line type="monotone" dataKey="returns" stroke="#EF4444" strokeWidth={3} dot={{ r: 5, fill: "#EF4444" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
