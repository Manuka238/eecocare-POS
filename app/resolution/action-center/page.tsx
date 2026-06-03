"use client";

import { useState, useMemo, useRef } from "react";
import { AppShell } from "@/components/app-shell";
import { useThemeMode } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import { orders, actionTimeline, evidenceItems, ORDER_STATUSES, URGENT_LEVELS } from "@/lib/crh-data";
import { Phone, MessageCircle, MessageSquare, Building2, UserCog, FileEdit, ArrowUpCircle, RotateCcw, Search, PlusCircle, Clock, Paperclip, X, Shield, Package, ChevronDown, CheckCircle, XCircle, AlertCircle, ShieldAlert, Trash2, Volume2, FileDown, Download, Wrench } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { ConfirmationModal } from "@/components/ui";

const ACTION_ICONS: Record<string, { icon: typeof Phone; color: string }> = {
  customer_call: { icon: Phone, color: "#3B82F6" },
  customer_sms: { icon: MessageSquare, color: "#06B6D4" },
  customer_whatsapp: { icon: MessageCircle, color: "#22C55E" },
  customer_email: { icon: MessageSquare, color: "#8B5CF6" },
  branch_call: { icon: Building2, color: "#F97316" },
  manager_call: { icon: UserCog, color: "#F59E0B" },
  courier_message: { icon: MessageCircle, color: "#A855F7" },
  courier_remark: { icon: FileEdit, color: "#8B5CF6" },
  escalation: { icon: ArrowUpCircle, color: "#EF4444" },
  return_request: { icon: RotateCcw, color: "#F43F5E" },
  supervisor_review: { icon: Shield, color: "#6366F1" },
  status_update: { icon: FileEdit, color: "#6B7280" },
};

const operationsIconMap: Record<string, any> = {
  rescheduled: Clock,
  fixed: CheckCircle,
  failed: XCircle,
  returnReq: AlertCircle,
  return: RotateCcw,
  problems: ShieldAlert,
};

const operationsCardGradients: Record<string, { top: string; icon: string; glow: string; badge: string }> = {
  rescheduled: { top: "from-amber-400 via-amber-500 to-orange-500", icon: "from-amber-500 to-orange-500", glow: "rgba(245,158,11,0.18)", badge: "bg-amber-500/15 text-amber-400" },
  fixed: { top: "from-emerald-400 via-emerald-500 to-teal-600", icon: "from-emerald-500 to-teal-600", glow: "rgba(16,185,129,0.18)", badge: "bg-emerald-500/15 text-emerald-400" },
  failed: { top: "from-red-400 via-red-500 to-rose-600", icon: "from-red-500 to-rose-600", glow: "rgba(239,68,68,0.18)", badge: "bg-red-500/15 text-red-400" },
  returnReq: { top: "from-purple-400 via-purple-500 to-fuchsia-600", icon: "from-purple-500 to-fuchsia-600", glow: "rgba(168,85,247,0.18)", badge: "bg-purple-500/15 text-purple-400" },
  return: { top: "from-violet-400 via-violet-500 to-purple-600", icon: "from-violet-500 to-purple-600", glow: "rgba(139,92,246,0.18)", badge: "bg-violet-500/15 text-violet-400" },
  problems: { top: "from-blue-400 via-blue-500 to-indigo-600", icon: "from-blue-500 to-indigo-600", glow: "rgba(59,130,246,0.18)", badge: "bg-blue-500/15 text-blue-400" },
};

export default function ActionCenterPage() {
  const { dark } = useThemeMode();
  const [selectedOrderId, setSelectedOrderId] = useState(orders[0]?.id || "");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [opsOpen, setOpsOpen] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [selectedAction, setSelectedAction] = useState<any | null>(null);
  
  // Convert constants to reactive states for additions/deletions
  const [timeline, setTimeline] = useState(actionTimeline);
  const [evidence, setEvidence] = useState(evidenceItems);
  
  // Deletion and Preview states
  const [deletingActionId, setDeletingActionId] = useState<string | null>(null);
  const [viewingEvidence, setViewingEvidence] = useState<any | null>(null);

  // Form states for Add Action Modal
  const [newActionType, setNewActionType] = useState("customer_call");
  const [newActionNotes, setNewActionNotes] = useState("");
  const [newActionResult, setNewActionResult] = useState("");
  const [newActionFollowUp, setNewActionFollowUp] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; size: string; type: string; description: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    const newFiles = files.map((file) => {
      const kb = file.size / 1024;
      const sizeStr = kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb.toFixed(0)} KB`;
      
      let mappedType = "screenshot";
      if (file.type.startsWith("audio/") || file.name.endsWith(".mp3") || file.name.endsWith(".wav")) mappedType = "call_recording";
      else if (file.name.endsWith(".pdf")) mappedType = "pdf";
      else if (file.type.startsWith("video/")) mappedType = "video";
      else if (file.type.startsWith("image/")) mappedType = "screenshot";

      return {
        name: file.name,
        size: sizeStr,
        type: mappedType,
        description: `Uploaded evidence attachment: ${file.name}`
      };
    });
    setUploadedFiles((prev) => [...prev, ...newFiles]);
    playBeepSound("success");
  };

  const handleRemoveUploadedFile = (idx: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== idx));
    playBeepSound("error");
  };

  // Audio / Action save beep sounds via Web Audio API
  const playBeepSound = (type: "success" | "error") => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (type === "success") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(950, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      } else {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(320, ctx.currentTime);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      }
    } catch (e) {}
  };

  const handleDownloadEvidence = (ev: any) => {
    try {
      const fileContent = `EECO CARE POS - Sealed Evidence Log File\nFile: ${ev.fileName}\nType: ${ev.type}\nUploaded By: ${ev.uploadedBy || 'CR Manager'}\nDescription: ${ev.description}\nMD5: ${Math.random().toString(36).substring(7).toUpperCase()}`;
      const blob = new Blob([fileContent], { type: "text/plain;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.setAttribute("download", ev.fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      playBeepSound("success");
    } catch (e) {}
  };

  const handleSaveAction = () => {
    if (!newActionNotes) return;
    const newId = `a${timeline.length + 1}`;

    const newEvIds: string[] = [];
    const newEvItems: any[] = [];
    uploadedFiles.forEach((file, index) => {
      const evId = `e_new_${Date.now()}_${index}`;
      newEvIds.push(evId);
      newEvItems.push({
        id: evId,
        orderId: selectedOrderId,
        type: file.type,
        fileName: file.name,
        fileSize: file.size,
        description: file.description,
        uploadedBy: "CR Manager",
        createdAt: new Date().toISOString().split("T")[0]
      });
    });

    if (newEvItems.length > 0) {
      setEvidence((prev) => [...prev, ...newEvItems]);
    }

    const newEntry = {
      id: newId,
      orderId: selectedOrderId,
      type: newActionType as any,
      method: newActionType.includes("call") ? "Phone Call" : newActionType.includes("whatsapp") ? "WhatsApp" : "System Update",
      notes: newActionNotes,
      result: newActionResult,
      followUpRequired: newActionFollowUp,
      nextFollowUp: newActionFollowUp ? new Date(Date.now() + 86400000).toISOString().split("T")[0] : "",
      evidenceIds: newEvIds,
      createdBy: "CR Manager",
      createdAt: new Date().toISOString(),
    };
    setTimeline((prev) => [...prev, newEntry]);
    setNewActionNotes("");
    setNewActionResult("");
    setNewActionFollowUp(false);
    setUploadedFiles([]);
    setShowModal(false);
    playBeepSound("success");
  };

  const selectedActionEvidence = useMemo(() => {
    if (!selectedAction) return [];
    return evidence.filter((e) => selectedAction.evidenceIds.includes(e.id));
  }, [selectedAction, evidence]);

  const operationsCardsData = useMemo(() => {
    const rescheduledOrders = orders.filter(o => o.status.startsWith("rescheduled"));
    const fixedProblems = orders.filter(o => o.status === "delivered" && o.actionCount > 1); // Fixed problems heuristic
    const failedOrders = orders.filter(o => o.status === "failed");
    const returnReqOrders = orders.filter(o => o.status === "return_requested");
    const returnOrders = orders.filter(o => ["return_ho", "return_client"].includes(o.status));
    const activeProblems = orders.filter(o => o.status === "failed" || o.urgentLevel === "critical" || o.urgentLevel === "high");

    return [
      { key: "rescheduled", label: "Rescheduled", count: rescheduledOrders.length, revenue: rescheduledOrders.reduce((s, o) => s + o.price, 0), change: -4.2, color: "#F59E0B" },
      { key: "fixed", label: "Fixed Problems", count: fixedProblems.length, revenue: fixedProblems.reduce((s, o) => s + o.price, 0), change: 12.0, color: "#10B981" },
      { key: "failed", label: "Failed Deliveries", count: failedOrders.length, revenue: failedOrders.reduce((s, o) => s + o.price, 0), change: -22.0, color: "#EF4444" },
      { key: "returnReq", label: "Return Requested", count: returnReqOrders.length, revenue: returnReqOrders.reduce((s, o) => s + o.price, 0), change: 7.8, color: "#A855F7" },
      { key: "return", label: "Return Orders", count: returnOrders.length, revenue: returnOrders.reduce((s, o) => s + o.price, 0), change: 3.1, color: "#8B5CF6" },
      { key: "problems", label: "Active Problems", count: activeProblems.length, revenue: activeProblems.reduce((s, o) => s + o.price, 0), change: -15.0, color: "#3B82F6" },
    ];
  }, []);

  const problemOrders = useMemo(() => {
    let filtered = orders.filter((o) => o.status.startsWith("rescheduled") || o.status === "failed" || o.status.includes("return") || o.status === "cancelled" || o.urgentLevel !== "none");

    if (activeFilter) {
      filtered = filtered.filter(o => {
        if (activeFilter === "rescheduled") return o.status.startsWith("rescheduled");
        if (activeFilter === "fixed") return o.status === "delivered" && o.actionCount > 1;
        if (activeFilter === "failed") return o.status === "failed";
        if (activeFilter === "returnReq") return o.status === "return_requested";
        if (activeFilter === "return") return ["return_ho", "return_client"].includes(o.status);
        if (activeFilter === "problems") return o.status === "failed" || o.urgentLevel === "critical" || o.urgentLevel === "high";
        return true;
      });
    }

    return filtered
      .sort((a, b) => {
        if (a.status === "failed" && b.status !== "failed") return -1;
        if (a.status !== "failed" && b.status === "failed") return 1;
        if (a.status !== b.status) return a.status.localeCompare(b.status);
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      })
      .filter((o) => { const q = search.toLowerCase(); return !q || o.orderNumber.toLowerCase().includes(q) || o.customerName.toLowerCase().includes(q); });
  }, [search, activeFilter]);

  const selectedOrder = orders.find((o) => o.id === selectedOrderId);
  const orderActions = timeline.filter((a) => a.orderId === selectedOrderId).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const getStatusColor = (s: string) => ORDER_STATUSES.find((st) => st.value === s)?.color || "#6B7280";
  const getStatusLabel = (s: string) => ORDER_STATUSES.find((st) => st.value === s)?.label || s;

  return (
    <AppShell title="Action Center" description="Resolve delivery issues with structured workflows">
      <div className="flex flex-col gap-6 pb-6">
        {/* Operations Overview Section */}
        <section className="space-y-3">
          <button
            onClick={() => setOpsOpen((v) => !v)}
            className={cn(
              "relative group flex w-full items-center justify-between gap-3 rounded-3xl border px-6 py-4 transition-all duration-500 shadow-sm overflow-hidden",
              opsOpen
                ? dark
                  ? "border-white/10 bg-slate-900/60 text-slate-300"
                  : "border-slate-200 bg-white/80 text-slate-600"
                : dark
                  ? "border-violet-500/40 bg-gradient-to-r from-violet-900/40 via-blue-900/30 to-violet-900/40 text-white shadow-lg shadow-violet-500/15 hover:shadow-violet-500/25"
                  : "border-violet-300/70 bg-gradient-to-r from-violet-50 via-blue-50 to-violet-50 text-violet-800 shadow-lg shadow-violet-200/60 hover:shadow-violet-300/70"
            )}
          >
            {!opsOpen && (
              <span className="absolute inset-0 -translate-x-full animate-[shimmer_2.5s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/8 to-transparent" />
            )}
            <div className="flex items-center gap-3 z-10 relative">
              <div className={cn(
                "flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-300",
                opsOpen
                  ? dark ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-500"
                  : "bg-gradient-to-br from-violet-500 to-blue-600 text-white shadow-md shadow-violet-500/30"
              )}>
                <Package className="h-4 w-4" />
              </div>
              <div className="text-left">
                <div className={cn("text-sm font-bold tracking-tight", !opsOpen && (dark ? "text-white" : "text-violet-900"))}>
                  Operations Overview
                </div>
                <div className={cn("text-[11px] font-medium", dark ? "text-slate-400" : "text-slate-500")}>
                  {operationsCardsData.length} metric categories across {operationsCardsData.reduce((s, c) => s + c.count, 0)} orders
                </div>
              </div>
            </div>
            <motion.div
              animate={opsOpen ? { rotate: 180 } : { rotate: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="z-10 relative"
            >
              <ChevronDown className={cn("h-5 w-5 transition-colors", opsOpen ? (dark ? "text-slate-500" : "text-slate-400") : (dark ? "text-violet-300" : "text-violet-600"))} />
            </motion.div>
          </button>

          <AnimatePresence initial={false}>
            {opsOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="pt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                    {operationsCardsData.map((card, idx) => {
                      const Icon = operationsIconMap[card.key] ?? Package;
                      const isPositive = card.change >= 0;
                      const grad = operationsCardGradients[card.key] ?? operationsCardGradients.problems;
                      const maxCount = Math.max(...operationsCardsData.map(c => c.count), 1);
                      const barPct = Math.round((card.count / maxCount) * 100);

                      return (
                        <motion.button
                          key={card.key}
                          onClick={() => setActiveFilter(activeFilter === card.key ? null : card.key)}
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.35, delay: idx * 0.04, ease: "easeOut" }}
                          className={cn(
                            "relative text-left overflow-hidden rounded-3xl border p-4 flex flex-col justify-between min-h-[140px] transition-all duration-300 group/card cursor-pointer active:scale-95",
                            activeFilter === card.key
                              ? (dark ? "border-violet-500 bg-slate-800 shadow-[0_0_15px_rgba(139,92,246,0.3)] ring-1 ring-violet-500" : "border-violet-400 bg-violet-50/50 shadow-[0_0_15px_rgba(139,92,246,0.2)] ring-1 ring-violet-400")
                              : (dark ? "border-white/10 bg-slate-900/80 hover:border-white/20 hover:bg-slate-800" : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md hover:bg-slate-50")
                          )}
                          style={{
                            boxShadow: dark && activeFilter !== card.key ? `0 4px 24px ${grad.glow}` : undefined,
                          }}
                        >
                          <div className={cn("absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r", grad.top)} />
                          <div
                            className="absolute inset-0 opacity-[0.04] pointer-events-none"
                            style={{ background: `radial-gradient(ellipse at top left, ${card.color}, transparent 70%)` }}
                          />
                          <div
                            className="absolute inset-0 rounded-3xl opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 pointer-events-none"
                            style={{ background: `radial-gradient(200px circle at 30% 40%, ${grad.glow}, transparent 70%)` }}
                          />
                          <div className="relative z-10 flex items-start justify-between">
                            <span className={cn("text-[10px] font-bold uppercase tracking-[0.08em] leading-tight max-w-[90px]", dark ? "text-slate-400" : "text-slate-500")}>
                              {card.label}
                            </span>
                            <div className={cn(
                              "flex h-8 w-8 items-center justify-center rounded-2xl bg-gradient-to-br shadow-md transition-transform duration-300 group-hover/card:scale-110 shrink-0",
                              grad.icon
                            )}>
                              <Icon className="h-4 w-4 text-white" />
                            </div>
                          </div>
                          <div className="relative z-10 mt-3">
                            <div className="flex items-baseline gap-1.5">
                              <span className={cn("text-2xl font-extrabold tracking-tight leading-none", dark ? "text-white" : "text-slate-900")}>
                                {card.count}
                              </span>
                            </div>
                          </div>
                          <div className="relative z-10 mt-3">
                            <div className={cn("h-1.5 w-full rounded-full overflow-hidden", dark ? "bg-white/8" : "bg-slate-100")}>
                              <div
                                className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-700", grad.top)}
                                style={{ width: `${barPct}%` }}
                              />
                            </div>
                          </div>
                          <div className={cn(
                            "absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r opacity-0 group-hover/card:opacity-60 transition-opacity duration-500",
                            grad.top
                          )} />
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        <div className="flex gap-6 min-h-[450px]" style={{ flex: "1 1 auto" }}>
          {/* Left: Order List */}
          <div className={cn("w-80 shrink-0 rounded-3xl border overflow-hidden flex flex-col hidden lg:flex", dark ? "border-white/10 bg-slate-900/80" : "border-slate-200 bg-white")}>
            <div className={cn("p-3 border-b", dark ? "border-white/5" : "border-slate-100")}>
              <div className={cn("flex items-center gap-2 rounded-xl px-3 py-2", dark ? "bg-slate-800" : "bg-slate-100")}>
                <Search className="h-4 w-4 text-slate-400" />
                <input className="w-full bg-transparent text-sm outline-none" placeholder="Search orders..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
              {problemOrders.map((o) => (
                <button key={o.id} onClick={() => setSelectedOrderId(o.id)} className={cn("w-full rounded-2xl p-3 text-left transition-all duration-200", selectedOrderId === o.id ? "bg-gradient-to-r from-violet-600/20 to-blue-600/20 border-l-4 border-violet-500" : dark ? "hover:bg-slate-800" : "hover:bg-slate-50", "border-l-4", selectedOrderId !== o.id && "border-transparent")}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">{o.orderNumber}</span>
                    <span className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium text-white" style={{ backgroundColor: getStatusColor(o.status) }}>{getStatusLabel(o.status)}</span>
                  </div>
                  <p className={cn("text-xs mt-1", dark ? "text-slate-400" : "text-slate-500")}>{o.customerName}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    {o.urgentLevel !== "none" && <span className="rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white" style={{ backgroundColor: URGENT_LEVELS.find((u) => u.value === o.urgentLevel)?.color }}>{o.urgentLevel}</span>}
                    <span className={cn("text-[10px]", dark ? "text-slate-500" : "text-slate-400")}>{o.actionCount} actions</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right: Timeline */}
          <div className="flex-1 flex flex-col min-w-0">
            {selectedOrder && (
              <>
                {/* Order Header */}
                <div className={cn("rounded-3xl border p-5 mb-4", dark ? "border-white/10 bg-slate-900/80" : "border-slate-200 bg-white")}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-bold">{selectedOrder.customerName}</h2>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className={cn("text-sm", dark ? "text-slate-400" : "text-slate-500")}>{selectedOrder.waybillNumber}</span>
                        <span className="inline-flex rounded-full px-2.5 py-1 text-xs font-medium text-white" style={{ backgroundColor: getStatusColor(selectedOrder.status) }}>{getStatusLabel(selectedOrder.status)}</span>
                        {selectedOrder.urgentLevel !== "none" && <span className={cn("rounded-full px-2.5 py-1 text-xs font-bold text-white", selectedOrder.urgentLevel === "critical" && "animate-pulse")} style={{ backgroundColor: URGENT_LEVELS.find((u) => u.value === selectedOrder.urgentLevel)?.color }}>{selectedOrder.urgentLevel}</span>}
                      </div>
                    </div>
                    <button onClick={() => setShowModal(true)} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl">
                      <PlusCircle className="h-4 w-4" /> Add Action
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-4 md:grid-cols-4">
                    {[["Price", `Rs. ${selectedOrder.price.toLocaleString()}`], ["Courier", selectedOrder.courier], ["District", selectedOrder.district], ["Contact", selectedOrder.contact]].map(([l, v]) => (
                      <div key={l} className={cn("rounded-xl p-2.5", dark ? "bg-slate-800" : "bg-slate-50")}>
                        <p className={cn("text-[10px] uppercase tracking-wider", dark ? "text-slate-500" : "text-slate-400")}>{l}</p>
                        <p className="text-sm font-semibold mt-0.5">{v}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Timeline */}
                <div className={cn("flex-1 rounded-3xl border p-5 overflow-y-auto", dark ? "border-white/10 bg-slate-900/80" : "border-slate-200 bg-white")}>
                  <h3 className="font-semibold mb-4">Action Timeline</h3>
                  {orderActions.length === 0 ? (
                    <div className="py-12 text-center text-slate-400">No actions recorded yet</div>
                  ) : (
                    <div className="relative pl-8">
                      <div className={cn("absolute left-[15px] top-0 bottom-0 w-[2px]", dark ? "bg-slate-700" : "bg-slate-200")} />
                      {orderActions.map((action, idx) => {
                        const cfg = ACTION_ICONS[action.type] || ACTION_ICONS.status_update;
                        const Icon = cfg.icon;
                        const time = new Date(action.createdAt);
                        const evCount = action.evidenceIds.length;
                        return (
                          <div key={action.id} className="relative mb-6 last:mb-0">
                            {/* Timeline dot */}
                            <div className={cn("absolute -left-7 top-0.5 flex h-6 w-6 items-center justify-center rounded-full text-white ring-4 z-10", dark ? "ring-slate-900/80" : "ring-white")} style={{ backgroundColor: cfg.color }}>
                              <Icon className="h-3 w-3" />
                            </div>
                            {/* Time */}
                            <div className="flex items-center gap-2 mb-1">
                              <span className={cn("text-xs font-medium", dark ? "text-slate-400" : "text-slate-500")}>
                                {time.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}
                              </span>
                              <span className={cn("text-[10px] rounded-full px-2 py-0.5 font-medium", dark ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-500")}>
                                {action.method}
                              </span>
                            </div>
                            {/* Content card */}
                             <div
                               onClick={() => setSelectedAction(action)}
                               className={cn(
                                 "rounded-2xl border p-3.5 transition-all duration-200 cursor-pointer hover:scale-[1.005] hover:shadow-md relative group/actionCard",
                                 dark
                                   ? "border-white/5 bg-slate-800/50 hover:bg-slate-800 hover:border-violet-500/30"
                                   : "border-slate-100 bg-slate-50 hover:bg-slate-100 hover:border-violet-300"
                               )}
                             >
                               <button
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   setDeletingActionId(action.id);
                                 }}
                                 title="Delete Action Log"
                                 className={cn(
                                   "absolute top-3 right-3 rounded-xl p-1.5 opacity-0 group-hover/actionCard:opacity-100 transition-all duration-200 hover:scale-110 active:scale-95 border z-20",
                                   dark
                                     ? "bg-slate-900 border-white/10 hover:border-rose-500/50 hover:bg-rose-500/10 text-slate-400 hover:text-rose-450"
                                     : "bg-white border-slate-200 hover:border-rose-300 hover:bg-rose-50 text-slate-550 hover:text-rose-600"
                                 )}
                               >
                                 <Trash2 className="h-3.5 w-3.5" />
                               </button>
                               <p className="text-sm pr-8">{action.notes}</p>
                               {action.result && <p className={cn("text-sm mt-2 font-medium", dark ? "text-emerald-400" : "text-emerald-600")}>Result: {action.result}</p>}
                               <div className="flex items-center gap-3 mt-2">
                                 {action.followUpRequired && (
                                   <span className="flex items-center gap-1 text-[10px] text-amber-400"><Clock className="h-3 w-3" /> Follow-up: {action.nextFollowUp}</span>
                                 )}
                                 {evCount > 0 && (
                                   <span className="flex items-center gap-1 text-[10px] text-violet-400"><Paperclip className="h-3 w-3" /> {evCount} evidence</span>
                                 )}
                                 <span className={cn("text-[10px]", dark ? "text-slate-500" : "text-slate-400")}>{action.createdBy}</span>
                               </div>
                             </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
            {!selectedOrder && (
              <div className={cn("flex-1 rounded-3xl border p-12 flex flex-col items-center justify-center text-center", dark ? "border-white/10 bg-slate-900/40" : "border-slate-200 bg-white")}>
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-500 mb-4">
                  <Wrench className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-bold mb-1">No Issue Selected</h3>
                <p className={cn("text-sm max-w-sm", dark ? "text-slate-400" : "text-slate-500")}>
                  {orders.length === 0
                    ? "There are currently no active delivery issues or rescheduled orders in the system. High five!"
                    : "Select an order from the left sidebar to view its detailed timeline and record resolution actions."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Action Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className={cn("max-w-lg w-full rounded-3xl p-6 max-h-[90vh] overflow-y-auto", dark ? "bg-slate-900 border border-white/10" : "bg-white border border-slate-200")}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Add Action</h3>
                <button onClick={() => setShowModal(false)} className={cn("rounded-xl p-2 transition-colors", dark ? "hover:bg-slate-800" : "hover:bg-slate-100")}><X className="h-4 w-4" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className={cn("block text-xs font-medium mb-1.5", dark ? "text-slate-400" : "text-slate-500")}>Action Type</label>
                  <select
                    value={newActionType}
                    onChange={(e) => setNewActionType(e.target.value)}
                    className={cn("w-full rounded-xl border px-4 py-2.5 text-sm outline-none", dark ? "border-white/10 bg-slate-800 text-white" : "border-slate-200 bg-slate-50")}
                  >
                    <option value="customer_call">Customer Call</option>
                    <option value="customer_whatsapp">Customer WhatsApp</option>
                    <option value="customer_sms">Customer SMS</option>
                    <option value="branch_call">Branch Call</option>
                    <option value="manager_call">Manager Call</option>
                    <option value="courier_remark">Courier Remark</option>
                    <option value="escalation">Escalation</option>
                    <option value="return_request">Return Request</option>
                  </select>
                </div>
                <div>
                  <label className={cn("block text-xs font-medium mb-1.5", dark ? "text-slate-400" : "text-slate-500")}>Notes</label>
                  <textarea
                    value={newActionNotes}
                    onChange={(e) => setNewActionNotes(e.target.value)}
                    className={cn("w-full rounded-xl border px-4 py-2.5 text-sm outline-none resize-none", dark ? "border-white/10 bg-slate-800 text-white" : "border-slate-200 bg-slate-50")}
                    rows={3}
                    placeholder="Describe the action taken..."
                  />
                </div>
                <div>
                  <label className={cn("block text-xs font-medium mb-1.5", dark ? "text-slate-400" : "text-slate-500")}>Result</label>
                  <textarea
                    value={newActionResult}
                    onChange={(e) => setNewActionResult(e.target.value)}
                    className={cn("w-full rounded-xl border px-4 py-2.5 text-sm outline-none resize-none", dark ? "border-white/10 bg-slate-800 text-white" : "border-slate-200 bg-slate-50")}
                    rows={2}
                    placeholder="What was the outcome?"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="followup"
                    className="rounded text-violet-600 focus:ring-violet-500"
                    checked={newActionFollowUp}
                    onChange={(e) => setNewActionFollowUp(e.target.checked)}
                  />
                  <label htmlFor="followup" className="text-sm">Follow-up Required</label>
                </div>
                <div>
                  <label className={cn("block text-xs font-medium mb-1.5", dark ? "text-slate-400" : "text-slate-500")}>Upload Evidence</label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    multiple
                  />
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={cn("rounded-xl border-2 border-dashed p-6 text-center cursor-pointer hover:border-violet-500/50 transition-colors flex flex-col items-center justify-center gap-2", dark ? "border-white/10 bg-slate-900/30" : "border-slate-200 bg-slate-50/50")}
                  >
                    <Paperclip className="h-6 w-6 text-slate-450 dark:text-slate-500" />
                    <p className="text-sm text-slate-400 font-semibold">Drag & drop files or click to browse</p>
                    <p className="text-[10px] text-slate-500">Supports PNG, JPG, PDF, MP3 (Max 10MB)</p>
                  </div>
                  
                  {/* Uploaded Files list preview */}
                  {uploadedFiles.length > 0 && (
                    <div className="mt-3 space-y-2 max-h-[140px] overflow-y-auto pr-1">
                      {uploadedFiles.map((f, idx) => (
                        <div key={idx} className={cn("rounded-xl border p-2.5 flex items-center justify-between gap-3 text-xs", dark ? "bg-slate-800/60 border-white/5" : "bg-slate-50 border-slate-200")}>
                          <div className="flex items-center gap-2 min-w-0">
                            <Paperclip className="h-3.5 w-3.5 text-violet-500 shrink-0" />
                            <div className="min-w-0">
                              <p className="font-semibold truncate max-w-[220px]">{f.name}</p>
                              <p className="text-[10px] text-slate-550 dark:text-slate-400">{f.size} • {f.type}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveUploadedFile(idx)}
                            className={cn("rounded-lg p-1 transition hover:bg-rose-500/10 text-slate-400 hover:text-rose-500")}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-6 flex items-center gap-3 justify-end">
                <button
                  onClick={() => setShowModal(false)}
                  className={cn("rounded-xl px-4 py-2.5 text-sm font-medium", dark ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveAction}
                  className="rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl hover:brightness-110 active:scale-95"
                >
                  Save Action
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Details Modal */}
      <AnimatePresence>
        {selectedAction && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn"
            onClick={() => setSelectedAction(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ duration: 0.25 }}
              className={cn(
                "relative max-w-lg w-full rounded-3xl border p-6 shadow-2xl overflow-hidden flex flex-col",
                dark ? "bg-slate-950 border-white/10" : "bg-white border-slate-200"
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-violet-600 to-blue-600" />

              {/* Modal Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-sm"
                    style={{ backgroundColor: (ACTION_ICONS[selectedAction.type] || ACTION_ICONS.status_update).color }}
                  >
                    {(() => {
                      const IconComponent = (ACTION_ICONS[selectedAction.type] || ACTION_ICONS.status_update).icon;
                      return <IconComponent className="h-4 w-4" />;
                    })()}
                  </div>
                  <div>
                    <h3 className={cn("text-base font-black tracking-tight", dark ? "text-white" : "text-slate-800")}>
                      Action Logs Detail
                    </h3>
                    <p className={cn("text-[10px] font-semibold mt-0.5 uppercase tracking-wider", dark ? "text-slate-500" : "text-slate-400")}>
                      {selectedAction.method}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedAction(null)}
                  className={cn("rounded-xl p-1.5 transition-all hover:scale-105 active:scale-95", dark ? "text-slate-500 hover:text-white" : "text-slate-400 hover:text-slate-700")}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                {/* Meta details */}
                <div className={cn("rounded-2xl border p-3 flex flex-wrap gap-4 text-xs font-semibold justify-between", dark ? "bg-slate-900 border-white/5 text-slate-300" : "bg-slate-50 border-slate-100 text-slate-650")}>
                  <div>
                    <span className={cn("text-[10px] uppercase tracking-wider block mb-0.5", dark ? "text-slate-500" : "text-slate-400")}>Logged By</span>
                    {selectedAction.createdBy}
                  </div>
                  <div>
                    <span className={cn("text-[10px] uppercase tracking-wider block mb-0.5", dark ? "text-slate-500" : "text-slate-400")}>Timestamp</span>
                    {new Date(selectedAction.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true })}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <span className={cn("text-[10px] font-extrabold uppercase tracking-wider block mb-1.5", dark ? "text-slate-500" : "text-slate-400")}>
                    Logged Notes
                  </span>
                  <div className={cn("rounded-2xl border p-4 text-sm leading-relaxed border-l-4 border-l-violet-500", dark ? "bg-slate-900/50 border-white/5" : "bg-slate-50 border-slate-150")}>
                    {selectedAction.notes}
                  </div>
                </div>

                {/* Result */}
                {selectedAction.result && (
                  <div>
                    <span className={cn("text-[10px] font-extrabold uppercase tracking-wider block mb-1.5", dark ? "text-slate-500" : "text-slate-400")}>
                      Outcome / Result
                    </span>
                    <div className={cn("rounded-2xl border p-4 text-sm font-semibold border-l-4 border-l-emerald-500", dark ? "bg-emerald-950/20 border-emerald-500/10 text-emerald-400" : "bg-emerald-50/50 border-emerald-100 text-emerald-700")}>
                      {selectedAction.result}
                    </div>
                  </div>
                )}

                {/* Next Follow Up */}
                {selectedAction.followUpRequired && (
                  <div className={cn("rounded-2xl border p-4 flex items-center gap-3 border-l-4 border-l-amber-500 text-xs font-semibold", dark ? "bg-amber-950/20 border-amber-500/10 text-amber-400" : "bg-amber-50/50 border-amber-100 text-amber-700")}>
                    <Clock className="h-5 w-5 shrink-0" />
                    <div>
                      <span className="block text-[10px] uppercase tracking-wider mb-0.5">Next Action Required</span>
                      Pending follow-up scheduled for <span className="font-bold">{selectedAction.nextFollowUp}</span>
                    </div>
                  </div>
                )}

                {/* Evidence Items */}
                {selectedActionEvidence.length > 0 && (
                  <div className="space-y-2.5">
                    <span className={cn("text-[10px] font-extrabold uppercase tracking-wider block", dark ? "text-slate-500" : "text-slate-400")}>
                      Attached Evidence ({selectedActionEvidence.length})
                    </span>
                    <div className="space-y-2">
                      {selectedActionEvidence.map((ev) => (
                        <div
                          key={ev.id}
                          onClick={() => setViewingEvidence(ev)}
                          className={cn(
                            "rounded-2xl border p-3 flex items-center justify-between gap-3 text-xs cursor-pointer hover:border-violet-500/50 hover:shadow-sm active:scale-[0.985] transition-all duration-200 group/ev",
                            dark ? "bg-slate-900 border-white/5" : "bg-slate-50 border-slate-200"
                          )}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Paperclip className="h-4 w-4 text-violet-550 group-hover/ev:text-violet-500 shrink-0 transition-colors" />
                            <div className="min-w-0">
                              <p className="font-bold truncate max-w-[200px] leading-tight group-hover/ev:text-violet-500 dark:group-hover/ev:text-violet-400 transition-colors">{ev.fileName}</p>
                              <p className={cn("text-[10px] mt-1 truncate max-w-[200px]", dark ? "text-slate-500" : "text-slate-400")}>
                                {ev.fileSize} • {ev.description}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={cn("rounded-full px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider border transition-all group-hover/ev:border-violet-550/20 group-hover/ev:bg-violet-500/5",
                              dark ? "bg-slate-800 border-white/5 text-slate-400" : "bg-slate-100 border-slate-200 text-slate-600"
                            )}>
                              {ev.type}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadEvidence(ev);
                              }}
                              title="Download Evidence File"
                              className={cn(
                                "rounded-xl p-2 transition-all duration-200 hover:scale-110 active:scale-90 border",
                                dark 
                                  ? "border-white/10 hover:border-violet-500/50 hover:bg-violet-500/10 text-slate-400 hover:text-violet-400" 
                                  : "border-slate-200 hover:border-violet-300 hover:bg-violet-50 text-slate-550 hover:text-violet-600"
                              )}
                            >
                              <Download className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer with Delete & Close buttons */}
              <div className="mt-6 flex gap-3 shrink-0">
                <button
                  onClick={() => setDeletingActionId(selectedAction.id)}
                  className={cn(
                    "flex-1 rounded-xl border py-3 text-xs font-extrabold flex items-center justify-center gap-2 transition active:scale-95",
                    dark
                      ? "border-rose-500/30 text-rose-400 bg-rose-500/5 hover:bg-rose-500/10 hover:border-rose-500/50"
                      : "border-rose-200 text-rose-600 bg-rose-50 hover:bg-rose-100/60 hover:border-rose-300"
                  )}
                >
                  <Trash2 className="h-4 w-4" /> Delete Action
                </button>
                <button
                  onClick={() => setSelectedAction(null)}
                  className="flex-[2] rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 py-3 text-xs font-bold text-white shadow-lg hover:brightness-110 active:scale-95 transition-all duration-200"
                >
                  Close Details
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingActionId && (
          <ConfirmationModal
            title="Delete Action Log"
            message="Are you sure you want to permanently delete this resolution action? This operation will remove the notes, outcomes, and uploaded evidence logs from this order's history. This action cannot be undone."
            confirmLabel="Delete Action"
            onConfirm={() => {
              setTimeline((prev) => prev.filter((a) => a.id !== deletingActionId));
              setSelectedAction(null); // Close the detail popup
              setDeletingActionId(null); // Close confirmation modal
              playBeepSound("error");
            }}
            onClose={() => setDeletingActionId(null)}
          />
        )}
      </AnimatePresence>

      {/* Evidence Viewer Modal */}
      <AnimatePresence>
        {viewingEvidence && (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn"
            onClick={() => setViewingEvidence(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={cn(
                "relative max-w-2xl w-full rounded-3xl border p-6 shadow-2xl overflow-hidden flex flex-col items-center justify-center text-center",
                dark ? "bg-slate-950 border-white/10" : "bg-white border-slate-200"
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-violet-600 to-blue-600" />
              
              <div className="w-full flex items-center justify-between mb-4 border-b pb-3 border-slate-800/10 dark:border-white/5">
                <div className="flex items-center gap-2">
                  <Paperclip className="h-4 w-4 text-violet-500" />
                  <span className="font-extrabold text-sm truncate max-w-[300px]">{viewingEvidence.fileName}</span>
                </div>
                <button
                  onClick={() => setViewingEvidence(null)}
                  className={cn("rounded-xl p-1.5 transition hover:scale-105 active:scale-95", dark ? "text-slate-500 hover:text-white" : "text-slate-400 hover:text-slate-700")}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Evidence Rendering */}
              <div className="w-full p-2 flex flex-col items-center justify-center">
                {viewingEvidence.type === "call_recording" ? (
                  <div className={cn("w-full rounded-2xl p-6 border flex flex-col items-center justify-center gap-4", dark ? "bg-slate-900 border-white/5" : "bg-slate-50 border-slate-100")}>
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-500/15 text-violet-500 animate-pulse">
                      <Volume2 className="h-6 w-6" />
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-sm">Call Recording Evidence Logs</p>
                      <p className={cn("text-xs mt-1", dark ? "text-slate-500" : "text-slate-400")}>Size: {viewingEvidence.fileSize} • Uploaded by {viewingEvidence.uploadedBy}</p>
                    </div>

                    {/* Waveform Simulator */}
                    <div className="flex items-center gap-1.5 h-10 mt-2">
                      {[12, 24, 16, 32, 20, 28, 14, 22, 10, 18, 30, 26, 16, 20, 24, 12, 16, 28, 14, 22, 8, 16, 20, 12].map((h, i) => (
                        <motion.div
                          key={i}
                          animate={{ height: [h * 0.4, h, h * 0.4] }}
                          transition={{ duration: 1.2 + (i % 3) * 0.2, repeat: Infinity, ease: "easeInOut" }}
                          className="w-1 rounded-full bg-gradient-to-t from-violet-500 to-blue-500"
                          style={{ height: `${h}px` }}
                        />
                      ))}
                    </div>

                    <audio controls className="w-full mt-4 rounded-xl border border-violet-500/20 shadow-inner" style={{ outline: "none" }}>
                      <source src="/silent.mp3" type="audio/mp3" />
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                ) : (
                  <div className={cn("w-full rounded-2xl border p-4 overflow-hidden flex flex-col items-center justify-center gap-4 relative min-h-[300px]", dark ? "bg-slate-900 border-white/5" : "bg-slate-50 border-slate-150")}>
                    {/* Simulated High-Fidelity Mock Screenshot Frame */}
                    <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06] pointer-events-none" style={{ background: "radial-gradient(circle, #8b5cf6 10%, transparent 80%)" }} />
                    
                    <div className={cn("rounded-2xl border p-5 w-full max-w-md shadow-md text-left leading-relaxed relative overflow-hidden", dark ? "bg-slate-950 border-white/10" : "bg-white border-slate-200")}>
                      <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-violet-500 to-blue-500" />
                      <div className="flex items-center justify-between border-b pb-2 border-slate-800/10 dark:border-white/5 mb-3">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                          <span className={cn("text-[9px] font-black uppercase tracking-wider", dark ? "text-emerald-400" : "text-emerald-600")}>Evidence Verified</span>
                        </div>
                        <span className={cn("text-[8px] font-bold uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-400")}>Sealed Log</span>
                      </div>
                      
                      {/* Simulated Address Pin or Chat Screen */}
                      {viewingEvidence.fileName.includes("maps") ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">📍</div>
                            <div className="min-w-0">
                              <p className="font-bold text-xs">Customer Map Location Shared</p>
                              <p className="text-[10px] text-slate-500">Coordinates Verified via GPS Pin</p>
                            </div>
                          </div>
                          <div className={cn("h-28 w-full rounded-xl border flex items-center justify-center text-center text-xs p-4 flex-col gap-2 font-medium shadow-inner", dark ? "bg-slate-900 border-white/5" : "bg-slate-100 border-slate-200")}>
                            <p className="text-violet-500 font-extrabold text-[13px] tracking-wide">📍 Google Maps API Payload</p>
                            <p className="text-[10px] text-slate-500 max-w-[260px]">Lat: 6.9271° N, Lon: 79.8612° E. Route payload dispatched to delivery rider hand-held device successfully.</p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center shrink-0">💬</div>
                            <div className="min-w-0">
                              <p className="font-bold text-xs">Kamal Chat Conversation</p>
                              <p className="text-[10px] text-slate-500">Sealed: 2026-05-21 11:05:00</p>
                            </div>
                          </div>
                          <div className="space-y-2 text-[10px] font-semibold">
                            <div className={cn("rounded-xl p-2.5 max-w-[80%] text-left", dark ? "bg-slate-900 text-slate-300" : "bg-slate-100 text-slate-700")}>
                              "Hi Eeco team, can you please reschedule my delivery to tomorrow? I won't be home today."
                            </div>
                            <div className="rounded-xl p-2.5 max-w-[80%] ml-auto bg-violet-600 text-white text-right">
                              "Sure Kamal, we have updated your delivery timeline for tomorrow Colombo re-route."
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                <p className={cn("text-xs mt-4 max-w-md font-medium leading-normal", dark ? "text-slate-400" : "text-slate-500")}>
                  {viewingEvidence.description}
                </p>
              </div>

              <div className="mt-6 w-full flex gap-3 justify-end shrink-0">
                <button
                  onClick={() => handleDownloadEvidence(viewingEvidence)}
                  className={cn(
                    "flex-1 rounded-xl border py-3 text-xs font-extrabold flex items-center justify-center gap-2 transition active:scale-95",
                    dark
                      ? "border-violet-500/30 text-violet-400 bg-violet-500/5 hover:bg-violet-500/10 hover:border-violet-500/50"
                      : "border-violet-200 text-violet-600 bg-violet-50 hover:bg-violet-100/60 hover:border-violet-300"
                  )}
                >
                  <FileDown className="h-4 w-4" /> Download File
                </button>
                <button
                  onClick={() => setViewingEvidence(null)}
                  className="flex-[1.5] rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 py-3 text-xs font-bold text-white shadow-lg hover:brightness-110 active:scale-95 transition-all duration-200"
                >
                  Return to Actions
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}
