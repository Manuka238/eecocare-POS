"use client";
import { AppShell } from "@/components/app-shell";
import { useThemeMode } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import { dailyReportData, monthlyTrends } from "@/lib/crh-data";
import { FilteredStatCard } from "@/components/filtered-orders";
import { DollarSign, TrendingUp, TrendingDown, Shield } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

const finTrends = monthlyTrends.map((m) => ({ month: m.month, revenue: m.delivered * 8500, losses: m.returns * 12000, prevented: m.rescheduled * 6000 }));

export default function FinancialImpactPage() {
  const { dark } = useThemeMode();
  const axisColor = dark ? "#64748B" : "#94A3B8";
  const d = dailyReportData;

  return (
    <AppShell title="Financial Impact" description="Revenue analysis and loss prevention metrics">
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <FilteredStatCard title="Delivered Revenue" value={`Rs. ${d.financial.deliveredValue.toLocaleString()}`} accent="#10B981" icon={<DollarSign className="h-5 w-5" />} />
          <FilteredStatCard title="Return Losses" value={`Rs. ${d.financial.returnValue.toLocaleString()}`} accent="#EF4444" icon={<TrendingDown className="h-5 w-5" />} />
          <FilteredStatCard title="Prevented Losses" value={`Rs. ${d.financial.preventedLosses.toLocaleString()}`} accent="#8B5CF6" icon={<Shield className="h-5 w-5" />} />
          <FilteredStatCard title="Net Impact" value={`Rs. ${(d.financial.deliveredValue - d.financial.returnValue).toLocaleString()}`} accent="#3B82F6" icon={<TrendingUp className="h-5 w-5" />} />
        </div>
        <div className={cn("rounded-3xl border p-5", dark ? "border-white/10 bg-slate-900/80" : "border-slate-200 bg-white")}>
          <h3 className="font-semibold mb-4">Financial Trends</h3>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={finTrends}>
              <defs>
                <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10B981" stopOpacity={0.3} /><stop offset="95%" stopColor="#10B981" stopOpacity={0} /></linearGradient>
                <linearGradient id="gLoss" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} /><stop offset="95%" stopColor="#EF4444" stopOpacity={0} /></linearGradient>
                <linearGradient id="gPrev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} /><stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={dark ? "#1E293B" : "#F1F5F9"} />
              <XAxis dataKey="month" tick={{ fill: axisColor, fontSize: 12 }} />
              <YAxis tick={{ fill: axisColor, fontSize: 12 }} tickFormatter={(v: number) => `Rs.${(v / 1000).toFixed(0)}K`} />
              <Tooltip contentStyle={{ backgroundColor: dark ? "#1E293B" : "#FFF", borderColor: dark ? "#334155" : "#E2E8F0", borderRadius: 12 }} formatter={(v: number) => `Rs. ${v.toLocaleString()}`} />
              <Area type="monotone" dataKey="revenue" stroke="#10B981" fill="url(#gRev)" strokeWidth={2} />
              <Area type="monotone" dataKey="losses" stroke="#EF4444" fill="url(#gLoss)" strokeWidth={2} />
              <Area type="monotone" dataKey="prevented" stroke="#8B5CF6" fill="url(#gPrev)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </AppShell>
  );
}
