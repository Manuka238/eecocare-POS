"use client";
import { AppShell } from "@/components/app-shell";
import { useThemeMode } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import { deliveryByHour, monthlyTrends } from "@/lib/crh-data";
import { FilteredStatCard } from "@/components/filtered-orders";
import { Clock, TrendingUp, Sun, Calendar } from "lucide-react";
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";

export default function DeliveryTrendsPage() {
  const { dark } = useThemeMode();
  const axisColor = dark ? "#64748B" : "#94A3B8";
  const bestHour = deliveryByHour.reduce((max, h) => h.deliveries > max.deliveries ? h : max, deliveryByHour[0]);

  return (
    <AppShell title="Delivery Trends" description="Delivery patterns and timing analysis">
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <FilteredStatCard title="Peak Hour" value={bestHour.hour} accent="#F59E0B" icon={<Clock className="h-5 w-5" />} />
          <FilteredStatCard title="Best Day" value="Wednesday" accent="#10B981" icon={<Calendar className="h-5 w-5" />} />
          <FilteredStatCard title="Avg Daily" value="38" accent="#3B82F6" icon={<TrendingUp className="h-5 w-5" />} />
          <FilteredStatCard title="Peak Deliveries" value={bestHour.deliveries} accent="#8B5CF6" icon={<Sun className="h-5 w-5" />} />
        </div>
        <div className={cn("rounded-3xl border p-5", dark ? "border-white/10 bg-slate-900/80" : "border-slate-200 bg-white")}>
          <h3 className="font-semibold mb-4">Deliveries by Hour</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={deliveryByHour}>
              <CartesianGrid strokeDasharray="3 3" stroke={dark ? "#1E293B" : "#F1F5F9"} />
              <XAxis dataKey="hour" tick={{ fill: axisColor, fontSize: 12 }} />
              <YAxis tick={{ fill: axisColor, fontSize: 12 }} />
              <Tooltip contentStyle={{ backgroundColor: dark ? "#1E293B" : "#FFF", borderRadius: 12 }} />
              <Bar dataKey="deliveries" fill="#10B981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="failures" fill="#EF4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className={cn("rounded-3xl border p-5", dark ? "border-white/10 bg-slate-900/80" : "border-slate-200 bg-white")}>
          <h3 className="font-semibold mb-4">Monthly Delivery Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke={dark ? "#1E293B" : "#F1F5F9"} />
              <XAxis dataKey="month" tick={{ fill: axisColor, fontSize: 12 }} />
              <YAxis tick={{ fill: axisColor, fontSize: 12 }} />
              <Tooltip contentStyle={{ backgroundColor: dark ? "#1E293B" : "#FFF", borderRadius: 12 }} />
              <Legend />
              <Line type="monotone" dataKey="delivered" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="rescheduled" stroke="#EAB308" strokeWidth={2} strokeDasharray="5 5" />
              <Line type="monotone" dataKey="failed" stroke="#EF4444" strokeWidth={2} strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </AppShell>
  );
}
