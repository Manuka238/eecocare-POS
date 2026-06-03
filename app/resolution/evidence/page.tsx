"use client";
import { useState, useMemo } from "react";
import { AppShell } from "@/components/app-shell";
import { useThemeMode } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import { evidenceItems, orders } from "@/lib/crh-data";
import { FilteredStatCard } from "@/components/filtered-orders";
import { Image, Mic, Volume2, FileText, Camera, Video, Search, Download } from "lucide-react";
import { FilterSelect } from "@/components/ui";

const TYPE_ICONS: Record<string, { icon: typeof Image; color: string }> = {
  screenshot: { icon: Image, color: "#3B82F6" },
  call_recording: { icon: Mic, color: "#10B981" },
  voice_note: { icon: Volume2, color: "#F59E0B" },
  pdf: { icon: FileText, color: "#EF4444" },
  image: { icon: Camera, color: "#8B5CF6" },
  video: { icon: Video, color: "#F97316" },
};

export default function EvidenceManagerPage() {
  const { dark } = useThemeMode();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const filtered = useMemo(() => {
    return evidenceItems.filter((e) => {
      const q = search.toLowerCase();
      const matchSearch = !q || e.fileName.toLowerCase().includes(q) || e.description.toLowerCase().includes(q) || orders.find((o) => o.id === e.orderId)?.orderNumber.toLowerCase().includes(q);
      const matchType = !typeFilter || e.type === typeFilter;
      return matchSearch && matchType;
    });
  }, [search, typeFilter]);

  const screenshots = evidenceItems.filter((e) => e.type === "screenshot").length;
  const recordings = evidenceItems.filter((e) => e.type === "call_recording" || e.type === "voice_note").length;
  const images = evidenceItems.filter((e) => e.type === "image" || e.type === "video").length;

  return (
    <AppShell title="Evidence Manager" description="Browse and manage all uploaded evidence">
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <FilteredStatCard title="Total Evidence" value={evidenceItems.length} accent="#3B82F6" icon={<FileText className="h-5 w-5" />} />
          <FilteredStatCard title="Screenshots" value={screenshots} accent="#8B5CF6" icon={<Image className="h-5 w-5" />} />
          <FilteredStatCard title="Recordings" value={recordings} accent="#10B981" icon={<Mic className="h-5 w-5" />} />
          <FilteredStatCard title="Images/Video" value={images} accent="#F97316" icon={<Camera className="h-5 w-5" />} />
        </div>

        <div className={cn("flex flex-wrap items-center gap-3 rounded-2xl border p-3", dark ? "border-white/10 bg-slate-900/80" : "border-slate-200 bg-white")}>
          <div className={cn("flex items-center gap-2 rounded-xl px-3 py-2 flex-1 max-w-xs", dark ? "bg-slate-800" : "bg-slate-100")}>
            <Search className="h-4 w-4 text-slate-400" />
            <input className="w-full bg-transparent text-sm outline-none" placeholder="Search evidence..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <FilterSelect value={typeFilter} onChange={(v) => setTypeFilter(v)} placeholder="All Types" options={[{ value: "screenshot", label: "Screenshots" }, { value: "call_recording", label: "Call Recordings" }, { value: "voice_note", label: "Voice Notes" }, { value: "image", label: "Images" }, { value: "pdf", label: "PDFs" }, { value: "video", label: "Videos" }]} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((e) => {
            const cfg = TYPE_ICONS[e.type] || TYPE_ICONS.screenshot;
            const Icon = cfg.icon;
            const order = orders.find((o) => o.id === e.orderId);
            return (
              <div key={e.id} className={cn("rounded-2xl border p-4 transition-all duration-200 card-hover group", dark ? "border-white/10 bg-slate-900/80 hover:border-white/20" : "border-slate-200 bg-white hover:shadow-md")}>
                <div className={cn("flex items-center justify-center rounded-xl p-6 mb-3", dark ? "bg-slate-800" : "bg-slate-50")}>
                  <Icon className="h-10 w-10 transition-transform group-hover:scale-110" style={{ color: cfg.color }} />
                </div>
                <p className="font-medium text-sm truncate">{e.fileName}</p>
                <p className={cn("text-xs mt-1 truncate", dark ? "text-slate-400" : "text-slate-500")}>{e.description}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className={cn("text-[10px]", dark ? "text-slate-500" : "text-slate-400")}>{order?.orderNumber} • {e.fileSize}</span>
                  <button className={cn("rounded-lg p-1.5 opacity-0 group-hover:opacity-100 transition-all", dark ? "hover:bg-slate-700" : "hover:bg-slate-100")}><Download className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
