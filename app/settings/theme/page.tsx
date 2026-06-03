"use client";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useThemeMode } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import { ThemeSwitch } from "@/components/ui";
import { Sun, Moon, Palette, Type, Sidebar } from "lucide-react";

const accents = [
  { name: "Violet Blue", from: "#8B5CF6", to: "#3B82F6" },
  { name: "Emerald Teal", from: "#10B981", to: "#14B8A6" },
  { name: "Rose Pink", from: "#F43F5E", to: "#EC4899" },
  { name: "Amber Orange", from: "#F59E0B", to: "#F97316" },
];

export default function ThemeSettingsPage() {
  const { dark } = useThemeMode();
  const [fontSize, setFontSize] = useState("medium");
  const [selectedAccent, setSelectedAccent] = useState(0);

  return (
    <AppShell title="Theme Settings" description="Customize appearance and display preferences">
      <div className="space-y-6">
        {/* Theme Toggle */}
        <div className={cn("rounded-3xl border p-5", dark ? "border-white/10 bg-slate-900/80" : "border-slate-200 bg-white")}>
          <div className="flex items-center gap-3 mb-4">
            <Palette className="h-5 w-5 text-violet-400" />
            <h3 className="font-semibold">Theme Mode</h3>
          </div>
          <div className="flex items-center gap-4">
            <div className={cn("flex-1 rounded-2xl border p-4 text-center cursor-pointer transition-all", dark ? "border-violet-500 bg-violet-500/10" : "border-slate-200 hover:border-violet-300")}>
              <Moon className="h-8 w-8 mx-auto mb-2 text-violet-400" />
              <p className="text-sm font-medium">Dark Mode</p>
            </div>
            <ThemeSwitch />
            <div className={cn("flex-1 rounded-2xl border p-4 text-center cursor-pointer transition-all", !dark ? "border-violet-500 bg-violet-500/10" : "border-white/10 hover:border-white/20")}>
              <Sun className="h-8 w-8 mx-auto mb-2 text-amber-400" />
              <p className="text-sm font-medium">Light Mode</p>
            </div>
          </div>
        </div>

        {/* Color Scheme */}
        <div className={cn("rounded-3xl border p-5", dark ? "border-white/10 bg-slate-900/80" : "border-slate-200 bg-white")}>
          <div className="flex items-center gap-3 mb-4">
            <Palette className="h-5 w-5 text-blue-400" />
            <h3 className="font-semibold">Accent Color</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {accents.map((a, i) => (
              <button key={a.name} onClick={() => setSelectedAccent(i)} className={cn("rounded-2xl border p-4 text-center transition-all", selectedAccent === i ? "border-violet-500 ring-2 ring-violet-500/30" : dark ? "border-white/10 hover:border-white/20" : "border-slate-200 hover:border-slate-300")}>
                <div className="h-10 w-full rounded-xl mb-2" style={{ background: `linear-gradient(135deg, ${a.from}, ${a.to})` }} />
                <p className="text-xs font-medium">{a.name}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Font Size */}
        <div className={cn("rounded-3xl border p-5", dark ? "border-white/10 bg-slate-900/80" : "border-slate-200 bg-white")}>
          <div className="flex items-center gap-3 mb-4">
            <Type className="h-5 w-5 text-emerald-400" />
            <h3 className="font-semibold">Font Size</h3>
          </div>
          <div className="flex gap-3">
            {["small", "medium", "large"].map((s) => (
              <button key={s} onClick={() => setFontSize(s)} className={cn("flex-1 rounded-xl px-4 py-3 text-sm font-medium capitalize transition-all", fontSize === s ? "bg-gradient-to-r from-violet-600 to-blue-600 text-white shadow-lg" : dark ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}>{s}</button>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
