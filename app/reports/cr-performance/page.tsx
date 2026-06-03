"use client";
import { AppShell } from "@/components/app-shell";
import { useThemeMode } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import { crPerformance } from "@/lib/crh-data";
import { FilteredStatCard } from "@/components/filtered-orders";
import { Phone, MessageCircle, ArrowUpCircle, CheckCircle, Timer, TrendingUp } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";

export default function CRPerformancePage() {
  const { dark } = useThemeMode();
  const axisColor = dark ? "#64748B" : "#94A3B8";

  return (
    <AppShell title="CR Performance" description="CR Manager productivity and effectiveness">
      <div className="space-y-6">
        <div className={cn("rounded-3xl border p-5", dark ? "border-white/10 bg-slate-900/80" : "border-slate-200 bg-white")}>
          <h3 className="font-semibold mb-4">Manager Comparison</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={crPerformance}>
              <CartesianGrid strokeDasharray="3 3" stroke={dark ? "#1E293B" : "#F1F5F9"} />
              <XAxis dataKey="manager" tick={{ fill: axisColor, fontSize: 12 }} />
              <YAxis tick={{ fill: axisColor, fontSize: 12 }} />
              <Tooltip contentStyle={{ backgroundColor: dark ? "#1E293B" : "#FFF", borderColor: dark ? "#334155" : "#E2E8F0", borderRadius: 12 }} />
              <Legend />
              <Bar dataKey="callsMade" name="Calls" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="messagesSent" name="Messages" fill="#22C55E" radius={[4, 4, 0, 0]} />
              <Bar dataKey="resolvedOrders" name="Resolved" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {crPerformance.map((cr) => (
            <div key={cr.manager} className={cn("rounded-3xl border p-5", dark ? "border-white/10 bg-slate-900/80" : "border-slate-200 bg-white")}>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 text-sm font-bold text-white">{cr.manager.split(" ").map((n) => n[0]).join("")}</div>
                <div><p className="font-semibold">{cr.manager}</p><p className={cn("text-xs", dark ? "text-slate-400" : "text-slate-500")}>{cr.totalActions} total actions</p></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className={cn("rounded-xl p-3", dark ? "bg-slate-800" : "bg-slate-50")}><div className="flex items-center gap-1.5 text-blue-400 mb-1"><Phone className="h-3 w-3" /><span className="text-[10px] uppercase tracking-wider">Calls</span></div><p className="text-lg font-bold">{cr.callsMade}</p></div>
                <div className={cn("rounded-xl p-3", dark ? "bg-slate-800" : "bg-slate-50")}><div className="flex items-center gap-1.5 text-green-400 mb-1"><MessageCircle className="h-3 w-3" /><span className="text-[10px] uppercase tracking-wider">Messages</span></div><p className="text-lg font-bold">{cr.messagesSent}</p></div>
                <div className={cn("rounded-xl p-3", dark ? "bg-slate-800" : "bg-slate-50")}><div className="flex items-center gap-1.5 text-emerald-400 mb-1"><CheckCircle className="h-3 w-3" /><span className="text-[10px] uppercase tracking-wider">Resolved</span></div><p className="text-lg font-bold">{cr.resolvedOrders}</p></div>
                <div className={cn("rounded-xl p-3", dark ? "bg-slate-800" : "bg-slate-50")}><div className="flex items-center gap-1.5 text-violet-400 mb-1"><TrendingUp className="h-3 w-3" /><span className="text-[10px] uppercase tracking-wider">Recovery</span></div><p className="text-lg font-bold">{cr.recoveryRate}%</p></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
