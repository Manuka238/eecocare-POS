"use client";
import { useMemo } from "react";
import { AppShell } from "@/components/app-shell";
import { useThemeMode } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import { problemHeatmap } from "@/lib/crh-data";
import { FilteredStatCard } from "@/components/filtered-orders";
import { MapPin, AlertTriangle, Shield, Flame } from "lucide-react";

export default function ProblemHeatmapsPage() {
  const { dark } = useThemeMode();
  const sorted = useMemo(() => [...problemHeatmap].sort((a, b) => b.total - a.total), []);
  const worst = sorted[0];
  const best = sorted[sorted.length - 1];
  const totalProblems = sorted.reduce((s, d) => s + d.total, 0);
  const maxTotal = sorted[0]?.total || 1;

  const getIntensity = (val: number, max: number) => {
    const ratio = val / max;
    if (ratio > 0.75) return { bg: "bg-red-500/20", text: "text-red-400" };
    if (ratio > 0.5) return { bg: "bg-orange-500/15", text: "text-orange-400" };
    if (ratio > 0.25) return { bg: "bg-yellow-500/10", text: "text-yellow-400" };
    return { bg: "bg-green-500/10", text: "text-green-400" };
  };

  return (
    <AppShell title="Problem Heatmaps" description="Problem distribution across districts">
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <FilteredStatCard title="Most Problematic" value={worst.district} accent="#EF4444" icon={<Flame className="h-5 w-5" />} />
          <FilteredStatCard title="Safest District" value={best.district} accent="#10B981" icon={<Shield className="h-5 w-5" />} />
          <FilteredStatCard title="Total Problems" value={totalProblems} accent="#F97316" icon={<AlertTriangle className="h-5 w-5" />} />
          <FilteredStatCard title="Districts" value={sorted.length} accent="#8B5CF6" icon={<MapPin className="h-5 w-5" />} />
        </div>
        <div className={cn("rounded-3xl border overflow-hidden", dark ? "border-white/10 bg-slate-900/80" : "border-slate-200 bg-white")}>
          <div className="p-5 pb-3"><h3 className="font-semibold">Problem Heatmap</h3><p className={cn("text-xs mt-1", dark ? "text-slate-400" : "text-slate-500")}>Color intensity represents problem severity</p></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className={cn("text-left text-xs uppercase tracking-wider", dark ? "bg-slate-800 text-slate-400" : "bg-slate-50 text-slate-500")}>
                <th className="px-4 py-3 font-medium">District</th>
                <th className="px-4 py-3 font-medium">Reschedules</th>
                <th className="px-4 py-3 font-medium">Failures</th>
                <th className="px-4 py-3 font-medium">Returns</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Severity</th>
              </tr></thead>
              <tbody>
                {sorted.map((d) => {
                  const intensity = getIntensity(d.total, maxTotal);
                  return (
                    <tr key={d.district} className={cn("border-t transition-colors", dark ? "border-white/5 hover:bg-white/5" : "border-slate-100 hover:bg-slate-50")}>
                      <td className="px-4 py-3 font-semibold">{d.district}</td>
                      <td className="px-4 py-3"><span className={cn("rounded-lg px-2 py-1 text-xs font-medium", getIntensity(d.reschedules, sorted[0]?.reschedules || 1).bg, getIntensity(d.reschedules, sorted[0]?.reschedules || 1).text)}>{d.reschedules}</span></td>
                      <td className="px-4 py-3"><span className={cn("rounded-lg px-2 py-1 text-xs font-medium", getIntensity(d.failures, sorted[0]?.failures || 1).bg, getIntensity(d.failures, sorted[0]?.failures || 1).text)}>{d.failures}</span></td>
                      <td className="px-4 py-3"><span className={cn("rounded-lg px-2 py-1 text-xs font-medium", getIntensity(d.returns, sorted[0]?.returns || 1).bg, getIntensity(d.returns, sorted[0]?.returns || 1).text)}>{d.returns}</span></td>
                      <td className="px-4 py-3 font-bold">{d.total}</td>
                      <td className="px-4 py-3"><div className={cn("h-3 rounded-full", dark ? "bg-slate-700" : "bg-slate-200")} style={{ width: 80 }}><div className="h-3 rounded-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all" style={{ width: `${(d.total / maxTotal) * 100}%` }} /></div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
