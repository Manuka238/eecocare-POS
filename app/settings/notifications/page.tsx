"use client";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useThemeMode } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import { AlertTriangle, Bell, XCircle, RotateCcw, Clock, ArrowUpCircle, Mail, MessageCircle, Smartphone } from "lucide-react";

const notifications = [
  { id: "n1", icon: AlertTriangle, title: "Urgent Order Alerts", desc: "Get notified when orders are marked as urgent or critical", color: "#EF4444" },
  { id: "n2", icon: XCircle, title: "Failed Delivery Alerts", desc: "Alerts when deliveries fail and need attention", color: "#F97316" },
  { id: "n3", icon: RotateCcw, title: "Return Request Alerts", desc: "Notifications for new return requests", color: "#8B5CF6" },
  { id: "n4", icon: Clock, title: "Unresolved Order Reminders", desc: "Reminders for orders pending resolution over 24 hours", color: "#F59E0B" },
  { id: "n5", icon: Bell, title: "Daily Report Reminder", desc: "End-of-day reminder to review daily reports", color: "#3B82F6" },
  { id: "n6", icon: ArrowUpCircle, title: "Escalation Alerts", desc: "Notifications when orders are escalated", color: "#EF4444" },
];

const channels = [
  { icon: Mail, title: "Email Notifications", desc: "Receive alerts via email", soon: true },
  { icon: Smartphone, title: "SMS Alerts", desc: "Critical alerts via SMS", soon: true },
  { icon: MessageCircle, title: "WhatsApp Integration", desc: "Notifications via WhatsApp", soon: true },
];

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  const { dark } = useThemeMode();
  return (
    <button onClick={onChange} className={cn("relative h-6 w-11 rounded-full transition-colors", on ? "bg-violet-600" : dark ? "bg-slate-700" : "bg-slate-300")}>
      <span className={cn("absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform shadow-sm", on && "translate-x-5")} />
    </button>
  );
}

export default function NotificationsPage() {
  const { dark } = useThemeMode();
  const [toggles, setToggles] = useState<Record<string, boolean>>({ n1: true, n2: true, n3: true, n4: false, n5: true, n6: true });

  return (
    <AppShell title="Notification Settings" description="Configure alert preferences">
      <div className="space-y-6">
        <div className={cn("rounded-3xl border p-5 space-y-1", dark ? "border-white/10 bg-slate-900/80" : "border-slate-200 bg-white")}>
          <h3 className="font-semibold mb-4">Alert Preferences</h3>
          {notifications.map((n) => {
            const Icon = n.icon;
            return (
              <div key={n.id} className={cn("flex items-center gap-4 rounded-2xl px-4 py-3 transition-colors", dark ? "hover:bg-slate-800" : "hover:bg-slate-50")}>
                <div className="rounded-xl p-2.5" style={{ backgroundColor: n.color + "15", color: n.color }}><Icon className="h-4 w-4" /></div>
                <div className="flex-1"><p className="text-sm font-medium">{n.title}</p><p className={cn("text-xs", dark ? "text-slate-400" : "text-slate-500")}>{n.desc}</p></div>
                <Toggle on={toggles[n.id] ?? false} onChange={() => setToggles((t) => ({ ...t, [n.id]: !t[n.id] }))} />
              </div>
            );
          })}
        </div>
        <div className={cn("rounded-3xl border p-5", dark ? "border-white/10 bg-slate-900/80" : "border-slate-200 bg-white")}>
          <h3 className="font-semibold mb-4">Notification Channels</h3>
          <div className="grid gap-4 md:grid-cols-3">
            {channels.map((c) => {
              const Icon = c.icon;
              return (
                <div key={c.title} className={cn("rounded-2xl border p-5 text-center relative overflow-hidden", dark ? "border-white/10 bg-slate-800/50" : "border-slate-200 bg-slate-50")}>
                  <div className="absolute top-3 right-3 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-400">COMING SOON</div>
                  <Icon className="h-8 w-8 mx-auto mb-3 text-slate-400" />
                  <p className="font-medium text-sm">{c.title}</p>
                  <p className={cn("text-xs mt-1", dark ? "text-slate-500" : "text-slate-400")}>{c.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
