"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { AppShell } from "@/components/app-shell";
import { useThemeMode } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import { orders as initialOrders, ORDER_STATUSES, COURIERS } from "@/lib/crh-data";
import {
  Search,
  Check,
  CheckCircle2,
  Package,
  PackageCheck,
  Printer,
  X,
  Truck,
  FileText,
  FileSpreadsheet,
  FileDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  BarChart3,
  CalendarDays,
  AlertCircle,
  Eye,
  User,
  MapPin,
  CreditCard,
  Hash
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

/* ─── Helpers ─────────────────────────────────────────── */
const randomWeight = (id: string) => {
  const code = id.charCodeAt(id.length - 1) || 5;
  return 150 + (code % 5) * 110;
};

const randomBoxSize = (id: string) => {
  const code = id.charCodeAt(id.length - 1) || 5;
  return ["Small Flyer", "Medium Box", "Large Carton"][code % 3];
};

const formatIssuedDate = (date: Date): string => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
};

const formatPhoneNumber = (phone?: string): string => {
  if (!phone) return "";
  let cleaned = phone.trim().replace(/\s+/g, '');
  if (cleaned.startsWith('+94')) {
    cleaned = '0' + cleaned.substring(3);
  }
  return cleaned;
};

/* ─── Smooth Animated Value Hook ─────────────────────── */
function useAnimatedValue(targetValue: number, duration: number = 800) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const startValue = value;
    const difference = targetValue - startValue;
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      setValue(startValue + difference * easeProgress);

      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(step);
      } else {
        setValue(targetValue);
      }
    };

    animationFrameId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(animationFrameId);
  }, [targetValue]);

  return value;
}



/* ─── Glowing Search Bar ─────────────────────────────── */
function SearchBar({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  const { dark } = useThemeMode();
  const [focused, setFocused] = useState(false);

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl border px-4 py-2.5 transition-all duration-300 flex-1 max-w-md",
        dark
          ? focused
            ? "border-violet-500 bg-slate-900 shadow-[0_0_12px_rgba(139,92,246,0.15)]"
            : "border-white/10 bg-slate-900"
          : focused
            ? "border-violet-500 bg-white shadow-[0_0_12px_rgba(139,92,246,0.1)]"
            : "border-slate-200 bg-white",
      )}
    >
      <Search className={cn("h-4 w-4 transition-colors duration-300", focused ? "text-violet-500" : dark ? "text-slate-400" : "text-slate-500")} />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        className={cn(
          "w-full bg-transparent text-sm outline-none",
          dark ? "placeholder:text-slate-500 text-white" : "placeholder:text-slate-400 text-slate-900",
        )}
      />
      {value && (
        <button onClick={() => onChange("")} className="text-slate-400 hover:text-slate-300 transition-colors">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

/* ─── Quick-Filter Pill Chips ────────────────────────── */
function CourierFilterChips({
  selected,
  onChange,
}: {
  selected: string;
  onChange: (filter: string) => void;
}) {
  const { dark } = useThemeMode();
  const options = [
    { value: "all", label: "All Logistics", color: "violet" },
    { value: "Pronto", label: "Pronto", color: "cyan" },
    { value: "Koombiyo", label: "Koombiyo", color: "emerald" },
    { value: "DHL Express", label: "DHL Express", color: "rose" },
  ];

  const pillStyles: Record<string, string> = {
    violet: dark
      ? "border-violet-500/30 bg-violet-500/10 text-violet-400 shadow-[0_0_12px_rgba(139,92,246,0.1)]"
      : "border-violet-200 bg-violet-50 text-violet-700 shadow-sm",
    cyan: dark
      ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.1)]"
      : "border-cyan-200 bg-cyan-50 text-cyan-700 shadow-sm",
    emerald: dark
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.1)]"
      : "border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm",
    rose: dark
      ? "border-rose-500/30 bg-rose-500/10 text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.1)]"
      : "border-rose-200 bg-rose-50 text-rose-700 shadow-sm",
  };

  return (
    <div className="flex flex-wrap gap-2 animate-fadeIn">
      {options.map((opt) => {
        const isSelected = selected === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold transition-all duration-300 active:scale-95",
              isSelected
                ? pillStyles[opt.color]
                : dark
                  ? "border-white/5 bg-slate-800/40 text-slate-400 hover:bg-slate-800 hover:text-slate-200 hover:border-white/10"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

const getInitialOrdersWithLocal = () => {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("eeco-care-pos-orders");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((o: any) => {
          let pStatus = o.packingStatus;
          if (pStatus === "unpacked") pStatus = "Ordered";
          else if (pStatus === "packed") pStatus = "Packed";
          else if (pStatus === "dispatched") pStatus = "Dispatched";
          return {
            ...o,
            packingStatus: pStatus as "Ordered" | "Packed" | "Dispatched",
          };
        });
      } catch (e) {
        console.error("Failed to parse orders from localStorage:", e);
      }
    }
  }

  // Fallback to mapping initialOrders with base attributes
  const mapped = initialOrders.map((o) => {
    const isDefaultDispatched = o.status === "delivered" || o.id === "o2" || o.id === "o5" || o.id === "o10";
    return {
      ...o,
      packingStatus: (isDefaultDispatched ? "Dispatched" : "Ordered") as "Ordered" | "Packed" | "Dispatched",
      weightGrams: o.id === "o2" ? 480 : o.id === "o5" ? 220 : o.id === "o10" ? 750 : 320,
      boxSize: o.id === "o2" ? "Medium" : o.id === "o5" ? "Small" : o.id === "o10" ? "Large" : "Medium",
      dispatchedDate: isDefaultDispatched
        ? new Date(new Date().setDate(new Date().getDate() - (o.id === "o1" ? 1 : 2))).toISOString().split("T")[0]
        : undefined,
    };
  });

  if (typeof window !== "undefined") {
    localStorage.setItem("eeco-care-pos-orders", JSON.stringify(mapped));
  }
  return mapped;
};

export default function DispatchedOrdersPage() {
  const { dark } = useThemeMode();

  const [orders, setOrders] = useState(() => getInitialOrdersWithLocal());
  const ordersRef = useRef<typeof orders>([]);

  useEffect(() => {
    ordersRef.current = orders;
  }, [orders]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("eeco-care-pos-orders", JSON.stringify(orders));
    }
  }, [orders]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "eeco-care-pos-orders" && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (JSON.stringify(parsed) !== JSON.stringify(ordersRef.current)) {
            setOrders(parsed);
          }
        } catch (err) {
          console.error("Failed to sync orders from localStorage event:", err);
        }
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourierFilter, setSelectedCourierFilter] = useState("all");
  const [selectedOrderForLabel, setSelectedOrderForLabel] = useState<typeof orders[0] | null>(null);
  const [showWaybillModal, setShowWaybillModal] = useState(false);
  const [selectedDispatchedIds, setSelectedDispatchedIds] = useState<string[]>([]);
  const [viewingOrder, setViewingOrder] = useState<typeof orders[0] | null>(null);
  const [modalWaybill, setModalWaybill] = useState("");
  const [isEditingWaybillInModal, setIsEditingWaybillInModal] = useState(false);

  const dispatchedOrders = useMemo(() => {
    return orders.filter(
      (o) =>
        o.packingStatus === "Dispatched" &&
        (selectedCourierFilter === "all" || o.courier === selectedCourierFilter) &&
        (o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          o.waybillNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          o.district.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [orders, searchQuery, selectedCourierFilter]);

  const stats = useMemo(() => {
    const totalCount = dispatchedOrders.length;
    const totalValuation = dispatchedOrders.reduce((sum, o) => sum + o.price, 0);
    const prontoCount = dispatchedOrders.filter((o) => o.courier === "Pronto").length;
    const koombiyoCount = dispatchedOrders.filter((o) => o.courier === "Koombiyo").length;
    return { totalCount, totalValuation, prontoCount, koombiyoCount };
  }, [dispatchedOrders]);

  const handleExportManifest = (format: "CSV" | "Excel") => {
    const targetOrders = dispatchedOrders.filter(o => selectedDispatchedIds.includes(o.id));
    if (targetOrders.length === 0) {
      alert("Please select one or more dispatched orders to export.");
      return;
    }

    const headers = "Waybill,Order No,Recipient,District,City,Courier,Weight,Box Size,COD Amount,Dispatched Date\n";
    const rows = targetOrders
      .map(
        (o) =>
          `"${o.waybillNumber || ""}","${o.orderNumber}","${o.customerName}","${o.district}","${o.city}","${o.courier}",${o.weightGrams}g,"${o.boxSize}",${o.price},"${o.dispatchedDate || ""}"`
      )
      .join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `courier-dispatch-manifest.${format === "CSV" ? "csv" : "csv"}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const memoizedIssuedDate = useMemo(() => formatIssuedDate(new Date()), [showWaybillModal]);

  /* Card definitions */
  const cardData = [
    {
      label: "Total Dispatched",
      value: `${stats.totalCount}`,
      sub: "parcels",
      icon: PackageCheck,
      gradient: "from-violet-400 via-violet-500 to-purple-600",
      iconGrad: "from-violet-500 to-purple-600",
      glow: "rgba(139,92,246,0.18)",
      change: 14.2,
    },
    {
      label: "Total COD Value",
      value: `Rs. ${stats.totalValuation.toLocaleString()}`,
      sub: "collected",
      icon: Truck,
      gradient: "from-emerald-400 via-emerald-500 to-teal-600",
      iconGrad: "from-emerald-500 to-teal-600",
      glow: "rgba(16,185,129,0.18)",
      change: 9.8,
    },
    {
      label: "Pronto Share",
      value: `${stats.prontoCount}`,
      sub: "parcels",
      icon: BarChart3,
      gradient: "from-blue-400 via-blue-500 to-indigo-600",
      iconGrad: "from-blue-500 to-indigo-600",
      glow: "rgba(59,130,246,0.18)",
      change: 5.4,
    },
    {
      label: "Koombiyo Share",
      value: `${stats.koombiyoCount}`,
      sub: "parcels",
      icon: Truck,
      gradient: "from-fuchsia-400 via-fuchsia-500 to-pink-600",
      iconGrad: "from-fuchsia-500 to-pink-600",
      glow: "rgba(217,70,239,0.18)",
      change: 18.0,
    },
  ];

  return (
    <AppShell
      title="Dispatched Orders"
      description="Review courier manifests, reprint tracking labels, and track shipped parcels."
      customIcon={<Truck className="h-5 w-5" />}
      customGradient="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-blue-600 text-white shadow-xl border-none"
    >
      <div className="space-y-6">

        {/* ─── PREMIUM STAT CARDS ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cardData.map((card, idx) => {
            const Icon = card.icon;
            const isPositive = card.change >= 0;
            const maxVal = Math.max(...cardData.map((c) => parseInt(c.value.replace(/[^0-9]/g, "")) || 0), 1);
            const currentVal = parseInt(card.value.replace(/[^0-9]/g, "")) || 0;
            const barPct = Math.round((currentVal / maxVal) * 100);

            return (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: idx * 0.04, ease: "easeOut" }}
                className={cn(
                  "relative text-left overflow-hidden rounded-3xl border p-5 flex flex-col justify-between min-h-[160px] transition-all duration-300 group/card",
                  dark
                    ? "border-white/10 bg-slate-900/80 hover:border-white/20 hover:bg-slate-800"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md hover:bg-slate-50"
                )}
                style={{ boxShadow: dark ? `0 4px 24px ${card.glow}` : undefined }}
              >
                <div className={cn("absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r", card.gradient)} />
                <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ background: `radial-gradient(ellipse at top left, ${card.glow.replace("0.18", "0.6")}, transparent 70%)` }} />
                <div className="absolute inset-0 rounded-3xl opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ background: `radial-gradient(200px circle at 30% 40%, ${card.glow}, transparent 70%)` }} />

                <div className="relative z-10 flex items-start justify-between">
                  <span className={cn("text-[10px] font-bold uppercase tracking-[0.08em] leading-tight max-w-[120px]", dark ? "text-slate-400" : "text-slate-500")}>{card.label}</span>
                  <div className={cn("flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br shadow-md transition-transform duration-300 group-hover/card:scale-110 shrink-0", card.iconGrad)}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                </div>

                <div className="relative z-10 mt-3">
                  <div className="flex items-baseline gap-1.5">
                    <span className={cn("text-[2rem] font-extrabold tracking-tight leading-none", dark ? "text-white" : "text-slate-900")}>{card.value}</span>
                    <span className={cn("text-xs font-semibold", dark ? "text-slate-500" : "text-slate-400")}>{card.sub}</span>
                  </div>
                </div>

                <div className="relative z-10 mt-3">
                  <div className={cn("h-1.5 w-full rounded-full overflow-hidden", dark ? "bg-white/8" : "bg-slate-100")}>
                    <div className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-700", card.gradient)} style={{ width: `${barPct}%` }} />
                  </div>
                </div>

                <div className="relative z-10 mt-2.5 flex items-center justify-between">
                  <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold", isPositive ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400")}>
                    <span className="text-[9px]">{isPositive ? "▲" : "▼"}</span>
                    {Math.abs(card.change).toFixed(1)}% vs last month
                  </span>
                </div>

                <div className={cn("absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r opacity-0 group-hover/card:opacity-60 transition-opacity duration-500", card.gradient)} />
              </motion.div>
            );
          })}
        </div>

        {/* ─── TOOLBAR ─── */}
        <div className="space-y-4">
          <div className={cn("flex flex-col gap-3 rounded-3xl border p-5 md:flex-row md:items-center md:justify-between transition-all duration-300 shadow-sm", dark ? "border-white/10 bg-slate-900/80 backdrop-blur-md" : "border-slate-200 bg-white")}>
            <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
              <SearchBar
                value={searchQuery}
                onChange={(val) => setSearchQuery(val)}
                placeholder="Search waybill, customer name, district..."
              />
            </div>

             <button
              type="button"
              onClick={() => handleExportManifest("CSV")}
              className={cn(
                "inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold text-white shadow-lg transition-all duration-200 active:scale-[0.97]",
                selectedDispatchedIds.length > 0
                  ? "bg-gradient-to-r from-violet-600 via-fuchsia-600 to-blue-600 shadow-violet-600/20 hover:shadow-[0_8px_25px_rgba(139,92,246,0.3)] hover:brightness-110"
                  : "bg-slate-700 hover:bg-slate-600 opacity-55"
              )}
            >
              <FileText className="h-4 w-4" /> Export Selected Manifest {selectedDispatchedIds.length > 0 && `(${selectedDispatchedIds.length})`}
            </button>
          </div>

          <CourierFilterChips
            selected={selectedCourierFilter}
            onChange={(filter) => setSelectedCourierFilter(filter)}
          />
        </div>

        {/* ─── PREMIUM TABLE ─── */}
        <div className={cn("rounded-3xl border overflow-hidden transition-all duration-300 shadow-sm", dark ? "border-white/10 bg-slate-900/80" : "border-slate-200 bg-white")}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className={cn("text-left text-[10px] uppercase tracking-wider border-b", dark ? "bg-slate-900/40 text-slate-400 border-white/5" : "bg-slate-50 text-slate-500 border-slate-200")}>
                  <th className="px-4 py-3.5 font-bold w-[45px]">
                    <div
                      onClick={() => {
                        const allDispatchedIds = dispatchedOrders.map(o => o.id);
                        const allSelected = allDispatchedIds.length > 0 && allDispatchedIds.every(id => selectedDispatchedIds.includes(id));
                        if (allSelected) {
                          setSelectedDispatchedIds(prev => prev.filter(id => !allDispatchedIds.includes(id)));
                        } else {
                          setSelectedDispatchedIds(prev => {
                            const next = [...prev];
                            allDispatchedIds.forEach(id => { if (!next.includes(id)) next.push(id); });
                            return next;
                          });
                        }
                      }}
                      className={cn(
                        "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition cursor-pointer active:scale-75",
                        dispatchedOrders.length > 0 && dispatchedOrders.every(o => selectedDispatchedIds.includes(o.id))
                          ? "bg-violet-500 border-violet-500 text-white"
                          : dark ? "border-white/15 bg-slate-800 hover:border-white/25" : "border-slate-300 bg-white hover:border-slate-400"
                      )}
                    >
                      {dispatchedOrders.length > 0 && dispatchedOrders.every(o => selectedDispatchedIds.includes(o.id)) && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                    </div>
                  </th>
                  <th className="px-4 py-3.5 font-bold">Waybill</th>
                  <th className="px-4 py-3.5 font-bold">Recipient</th>
                  <th className="px-4 py-3.5 font-bold">Courier Details</th>
                  <th className="px-4 py-3.5 font-bold">Package Specification</th>
                  <th className="px-4 py-3.5 font-bold text-right">COD Value</th>
                  <th className="px-4 py-3.5 font-bold text-center">Status</th>
                  <th className="px-4 py-3.5 font-bold text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {dispatchedOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-16 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <AlertCircle className="h-8 w-8 text-slate-500 animate-bounce" />
                        <span className="font-semibold text-sm">No dispatched parcels found</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  dispatchedOrders.map((order) => {
                    const isRowChecked = selectedDispatchedIds.includes(order.id);
                    return (
                      <tr
                        key={order.id}
                        className={cn(
                          "border-t transition-all duration-200",
                          dark ? "border-white/5 hover:bg-white/5" : "border-slate-100 hover:bg-slate-50/70 hover:shadow-inner"
                        )}
                      >
                        <td className="px-4 py-4 w-[45px]">
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDispatchedIds(prev =>
                                isRowChecked ? prev.filter(id => id !== order.id) : [...prev, order.id]
                              );
                            }}
                            className={cn(
                              "flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-lg border transition active:scale-75 cursor-pointer",
                              isRowChecked
                                ? "bg-violet-500 border-violet-500 text-white"
                                : dark ? "border-white/15 bg-slate-800 hover:border-white/25" : "border-slate-300 bg-white hover:border-slate-400"
                            )}
                          >
                            {isRowChecked && <Check className="h-3 w-3 stroke-[3]" />}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className={cn(
                            "flex items-center gap-1.5 border px-2 py-1 rounded-xl transition focus-within:border-violet-500/40 focus-within:shadow-[0_0_12px_rgba(139,92,246,0.06)] max-w-[160px]",
                            dark ? "border-white/10 bg-slate-950/40" : "border-slate-200 bg-slate-50"
                          )}>
                            <input
                              type="text"
                              value={order.waybillNumber || ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                setOrders(prev => prev.map(o => o.id === order.id ? { ...o, waybillNumber: val } : o));
                              }}
                              className={cn("w-full bg-transparent text-xs font-mono font-bold outline-none", dark ? "text-white" : "text-slate-800")}
                              placeholder="Waybill..."
                            />
                          </div>
                          <div className={cn("text-[10px] mt-1.5 ml-1.5 font-bold", dark ? "text-violet-400" : "text-violet-600")}>{order.orderNumber}</div>
                        </td>
                      <td className="px-4 py-4">
                        <div className="font-semibold text-xs">{order.customerName}</div>
                        <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1.5">
                          <span>{order.contact}</span>
                          <span className="opacity-30">•</span>
                          <span>{order.city} ({order.district})</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-semibold text-xs">{order.courier}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">Branch: {order.courierBranch}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-semibold text-xs">{order.weightGrams}g</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{order.boxSize}</div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className={cn("font-extrabold text-xs", dark ? "text-violet-400" : "text-violet-600")}>
                          Rs. {order.price.toLocaleString()}
                        </div>
                        <div className="text-[9px] text-slate-500 mt-0.5 uppercase font-semibold">collected</div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[9px] font-bold uppercase border",
                          order.id === "o1"
                            ? dark ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : dark ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "bg-blue-50 text-blue-700 border-blue-200"
                        )}>
                          <CheckCircle2 className="h-2.5 w-2.5" />
                          {order.id === "o1" ? "Delivered" : "In Transit"}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setViewingOrder(order);
                              setModalWaybill(order.waybillNumber || "");
                              setIsEditingWaybillInModal(false);
                            }}
                            className={cn(
                              "inline-flex items-center gap-1 rounded-xl border px-2.5 py-[6px] text-[11px] font-bold transition-all duration-200 active:scale-[0.96] shadow-sm",
                              dark
                                ? "border-white/10 text-slate-300 hover:bg-slate-800"
                                : "border-slate-200 text-slate-650 hover:bg-slate-50"
                            )}
                          >
                            <Eye className="h-3 w-3 text-violet-500" />
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedOrderForLabel(order);
                              setShowWaybillModal(true);
                            }}
                            className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 hover:brightness-110 shadow-md shadow-violet-600/15 hover:shadow-[0_4px_12px_rgba(139,92,246,0.25)] px-2.5 py-[6px] text-[11px] font-bold text-white transition-all duration-200 active:scale-[0.96] transform"
                          >
                            <Printer className="h-3 w-3" />
                            Reprint
                          </button>
                        </div>
                      </td>
                    </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* KOOMBIYO WAYBILL PREVIEW MODAL */}
      <AnimatePresence>
        {showWaybillModal && selectedOrderForLabel && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowWaybillModal(false)}>
            <div className={cn("relative w-full max-w-xl rounded-3xl border p-6 shadow-2xl overflow-hidden", dark ? "bg-slate-950 border-white/10" : "bg-white border-slate-200")} onClick={(e) => e.stopPropagation()}>
              <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-violet-600 to-blue-600" />
              
              <div className="flex items-center justify-between">
                <h3 className={cn("text-base font-bold flex items-center gap-2", dark ? "text-white" : "text-slate-800")}>
                  <Printer className="h-4 w-4 text-blue-500" /> Waybill Reprint Preview
                </h3>
                <button onClick={() => setShowWaybillModal(false)} className="text-slate-400 hover:text-slate-300">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div 
                id="waybill-print-sheet" 
                className="mt-5 bg-white text-slate-900 rounded-2xl overflow-hidden p-1 select-none"
              >
                <style dangerouslySetInnerHTML={{ __html: `
                  .koombiyo-waybill {
                    width: 100%;
                    max-width: 750px;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                    color: #000;
                    padding: 16px;
                    box-sizing: border-box;
                    background: #fff;
                    margin: 0 auto;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                    border: 1px dashed #d1d5db;
                    border-radius: 12px;
                  }
                  .koombiyo-waybill * { box-sizing: border-box; }
                  .koombiyo-border-card {
                    border: 3.5px double #1b4f93;
                    border-radius: 14px;
                    padding: 10px;
                    background: #fff;
                  }
                  .koombiyo-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
                  .koombiyo-col-left { width: 58%; vertical-align: top; padding-right: 10px; border-right: 2px solid #1b4f93; }
                  .koombiyo-col-right { width: 42%; vertical-align: top; padding-left: 10px; }
                  .koombiyo-logo-area { display: flex; align-items: center; margin-bottom: 6px; }
                  .koombiyo-address-line { font-size: 10px; color: #1b4f93; font-weight: bold; margin-bottom: 8px; letter-spacing: -0.2px; }
                  .koombiyo-card-box { border: 1.5px solid #1b4f93; border-radius: 8px; padding: 6px 10px; margin-bottom: 6px; font-size: 11.5px; line-height: 1.4; }
                  .koombiyo-card-title { color: #1b4f93; font-weight: bold; display: inline-block; }
                  .koombiyo-right-header { font-size: 15px; font-weight: 900; color: #1b4f93; text-align: center; letter-spacing: 0.3px; margin-bottom: 6px; font-family: Arial, Helvetica, sans-serif; white-space: nowrap; }
                  .koombiyo-barcode-box { border: 1.5px solid #1b4f93; border-radius: 8px; padding: 6px; text-align: center; margin-bottom: 8px; background: #fff; }
                  .koombiyo-cod-amount-box { border: 1.5px solid #1b4f93; padding: 3px 8px; font-size: 17px; font-weight: bold; text-align: center; border-radius: 4px; font-family: monospace; background: #fff; display: inline-block; width: 100%; }
                  .koombiyo-form-row { margin-bottom: 2px; display: flex; align-items: flex-end; }
                  .koombiyo-form-label { color: #1b4f93; font-weight: bold; width: 70px; flex-shrink: 0; }
                  .koombiyo-form-line { border-bottom: 1.5px dotted #1b4f93; flex-grow: 1; height: 14px; margin-left: 4px; }
                  .koombiyo-checkbox-container { display: flex; align-items: center; margin-right: 12px; }
                  .koombiyo-checkbox { width: 12px; height: 12px; border: 1.5px solid #1b4f93; display: inline-block; margin-right: 4px; border-radius: 1px; vertical-align: middle; }
                ` }} />
                
                <div className="koombiyo-waybill">
                  <div className="koombiyo-border-card">
                    <table className="koombiyo-table">
                      <tbody>
                        <tr>
                          <td className="koombiyo-col-left">
                            <div className="koombiyo-logo-area" style={{ marginBottom: "6px" }}>
                              <img src="/koombiyo-logo.png" alt="Koombiyo Delivery" className="object-contain" style={{ height: "92px", width: "320px", display: "block" }} />
                            </div>
                            <div className="koombiyo-address-line">
                              Address: <span className="font-normal text-slate-800">No.25, Epitamulla Road, Kotte.</span> Tel: <span className="font-normal text-slate-800">011 7 886 786</span>
                            </div>
                            <div className="koombiyo-card-box">
                              <div className="mb-0.5 flex"><span className="koombiyo-card-title w-[95px] shrink-0">From :</span><span className="font-bold">Eeco Aromatics</span></div>
                              <div className="mb-0.5 flex"><span className="koombiyo-card-title w-[95px] shrink-0">Contact Number :</span><span>762051906</span></div>
                              <div className="flex"><span className="koombiyo-card-title w-[95px] shrink-0">Issued Date :</span><span className="font-bold">{memoizedIssuedDate}</span></div>
                            </div>
                            <div className="koombiyo-card-box min-h-[110px] mb-0">
                              <div className="mb-1 flex"><span className="koombiyo-card-title w-[75px] shrink-0">To :</span><span className="font-bold text-[12px]">{selectedOrderForLabel.customerName}</span></div>
                              <div className="mb-1 flex items-start"><span className="koombiyo-card-title w-[75px] shrink-0">Address :</span><span className="font-bold leading-normal flex-1">{selectedOrderForLabel.address}, {selectedOrderForLabel.city}, {selectedOrderForLabel.district}., .</span></div>
                              <div className="flex"><span className="koombiyo-card-title w-[75px] shrink-0">Phone No :</span><span className="font-bold text-[12px]">{formatPhoneNumber(selectedOrderForLabel.contact)}</span></div>
                            </div>
                          </td>
                          <td className="koombiyo-col-right">
                            <div className="koombiyo-right-header">PROOF OF DELIVERY</div>
                            <div className="koombiyo-barcode-box" style={{ height: "54px" }}></div>
                            <div className="text-[11px] mb-2 pl-0.5 space-y-1">
                              <div className="flex items-center">
                                <span className="text-[#1b4f93] font-bold w-[90px] shrink-0">COD AMOUNT :</span>
                                <div className="flex-1 pl-1"><div className="koombiyo-cod-amount-box">{selectedOrderForLabel.price.toFixed(2)}</div></div>
                              </div>
                              <div><span className="text-[#1b4f93] font-bold w-[90px] inline-block">Order No :</span><span className="font-bold">{selectedOrderForLabel.orderNumber}</span></div>
                              <div><span className="text-[#1b4f93] font-bold w-[90px] inline-block">Weight :</span><span className="font-semibold">{selectedOrderForLabel.weightGrams}g</span></div>
                            </div>
                            <div className="border border-[#1b4f93] rounded-lg p-2 text-[10px] space-y-1 bg-white">
                              <div className="koombiyo-form-row"><span className="koombiyo-form-label">Name</span><span className="text-[#1b4f93] font-bold">:</span><div className="koombiyo-form-line"></div></div>
                              <div className="koombiyo-form-row"><span className="koombiyo-form-label">Address</span><span className="text-[#1b4f93] font-bold">:</span><div className="koombiyo-form-line"></div></div>
                              <div className="koombiyo-form-row"><span className="koombiyo-form-label">NIC Number</span><span className="text-[#1b4f93] font-bold">:</span><div className="koombiyo-form-line"></div></div>
                              <div className="koombiyo-form-row"><span className="koombiyo-form-label">Date</span><span className="text-[#1b4f93] font-bold">:</span><div className="koombiyo-form-line"></div></div>
                              <div className="koombiyo-form-row"><span className="koombiyo-form-label">Signature</span><span className="text-[#1b4f93] font-bold">:</span><div className="koombiyo-form-line"></div></div>
                              <div className="flex items-center pt-1">
                                <span className="koombiyo-form-label">Deliverd</span>
                                <span className="text-[#1b4f93] font-bold mr-2">:</span>
                                <div className="koombiyo-checkbox-container"><span className="koombiyo-checkbox"></span><span className="font-bold">Yes</span></div>
                                <div className="koombiyo-checkbox-container"><span className="koombiyo-checkbox"></span><span className="font-bold">No</span></div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex gap-3">
                <button
                  onClick={() => {
                    const printContents = document.getElementById("waybill-print-sheet")?.innerHTML;
                    if (printContents) {
                      const printWindow = window.open("", "_blank");
                      if (printWindow) {
                        printWindow.document.write(`
                          <html>
                            <head>
                              <title>Print Waybill - ${selectedOrderForLabel.waybillNumber}</title>
                              <base href="${window.location.origin}/" />
                              <style>
                                @media print {
                                  body { margin: 0; padding: 0; background: #fff; }
                                  @page { size: auto; margin: 0mm; }
                                  .koombiyo-waybill {
                                    border: 1.5px dashed #9ca3af !important;
                                    border-radius: 12px !important;
                                    padding: 16px !important;
                                    background: #fff !important;
                                    -webkit-print-color-adjust: exact !important;
                                    print-color-adjust: exact !important;
                                  }
                                }
                                body {
                                  margin: 0;
                                  padding: 10px;
                                  background: #fff;
                                  display: flex;
                                  justify-content: center;
                                  align-items: center;
                                  min-height: 100vh;
                                }
                              </style>
                              <script>
                                function startPrint() {
                                  const imgs = document.getElementsByTagName('img');
                                  const promises = [];
                                  for (let i = 0; i < imgs.length; i++) {
                                    const img = imgs[i];
                                    if (!img.complete) {
                                      promises.push(new Promise((resolve) => {
                                        img.onload = resolve;
                                        img.onerror = resolve;
                                      }));
                                    }
                                  }
                                  Promise.all(promises).then(() => {
                                    setTimeout(() => {
                                      window.print();
                                      window.close();
                                    }, 250);
                                  });
                                }
                              </script>
                            </head>
                            <body onload="startPrint();">
                              ${printContents}
                            </body>
                          </html>
                        `);
                        printWindow.document.close();
                      }
                    }
                  }}
                  className="flex-1 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 py-3 text-xs font-bold text-white shadow-lg hover:brightness-110 transition flex items-center justify-center gap-2"
                >
                  <Printer className="h-4 w-4" /> Print Label
                </button>
                <button onClick={() => setShowWaybillModal(false)} className={cn("flex-1 rounded-xl border py-3 text-xs font-bold transition", dark ? "border-white/10 text-slate-300 hover:bg-white/5" : "border-slate-200 text-slate-600 hover:bg-slate-50")}>
                  Close Preview
                </button>
              </div>

            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════
          VIEW DISPATCHED ORDER DETAILS POPUP (NEW)
         ═══════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {viewingOrder && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setViewingOrder(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.25 }}
              className={cn(
                "relative w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden flex flex-col p-6 text-left",
                dark ? "bg-slate-950 border-white/10 text-white" : "bg-white border-slate-200 text-slate-900"
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-violet-600 via-fuchsia-600 to-blue-600" />

              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/10 dark:border-white/5">
                <div className="flex items-center gap-2">
                  <div className={cn("flex h-8 w-8 items-center justify-center rounded-xl", dark ? "bg-violet-500/10 text-violet-400" : "bg-violet-50 text-violet-600")}>
                    <PackageCheck className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold tracking-tight">Dispatched Order Details</h3>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">{viewingOrder.orderNumber}</p>
                  </div>
                </div>
                <button
                  onClick={() => setViewingOrder(null)}
                  className={cn("rounded-lg p-1 transition", dark ? "text-slate-500 hover:text-white" : "text-slate-400 hover:text-slate-700")}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="py-4 space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar">
                {[
                  { icon: User, label: "Customer", value: viewingOrder.customerName },
                  { icon: MapPin, label: "Address", value: `${viewingOrder.address}, ${viewingOrder.city}, ${viewingOrder.district}` },
                  { icon: Truck, label: "Logistics Partner", value: `${viewingOrder.courier} — ${viewingOrder.courierBranch}` },
                  { icon: CreditCard, label: "COD Payment Info", value: `${viewingOrder.paymentMethod} — Rs. ${viewingOrder.price.toLocaleString()}` },
                  { icon: Package, label: "Package Specification", value: `${viewingOrder.weightGrams}g weight • ${viewingOrder.boxSize} size` },
                  { icon: CalendarDays, label: "Dispatched Date", value: viewingOrder.dispatchedDate || "N/A" },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className={cn("flex items-start gap-3 rounded-2xl p-3 border transition-all duration-200",
                    dark ? "bg-slate-900/40 border-white/5 hover:border-white/10" : "bg-slate-50/50 border-slate-200/50 hover:bg-slate-50"
                  )}>
                    <div className={cn("flex h-7.5 w-7.5 items-center justify-center rounded-xl shrink-0 mt-0.5 shadow-sm",
                      dark ? "bg-violet-500/10 text-violet-400 border border-violet-500/15" : "bg-violet-50 text-violet-500 border border-violet-100"
                    )}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0">
                      <span className={cn("text-[9px] font-bold uppercase tracking-wider block", dark ? "text-slate-500" : "text-slate-400")}>{label}</span>
                      <span className={cn("text-[11px] font-semibold mt-0.5 block leading-relaxed", dark ? "text-white" : "text-slate-800")}>{value}</span>
                    </div>
                  </div>
                ))}

                {/* Waybill section */}
                <div className={cn("rounded-2xl p-4 border flex flex-col gap-3 mt-1.5",
                  dark ? "bg-violet-950/10 border-violet-500/20" : "bg-violet-50/40 border-violet-200/60"
                )}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4 text-violet-500" />
                      <span className={cn("text-[10px] font-bold uppercase tracking-wider", dark ? "text-violet-300" : "text-violet-700")}>Waybill Number</span>
                    </div>
                    {!isEditingWaybillInModal && (
                      <button
                        onClick={() => setIsEditingWaybillInModal(true)}
                        className="text-[10px] font-extrabold uppercase text-violet-500 hover:text-violet-400 transition"
                      >
                        {viewingOrder.waybillNumber ? "Edit Waybill" : "Enter Waybill"}
                      </button>
                    )}
                  </div>

                  {isEditingWaybillInModal ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={modalWaybill}
                        onChange={(e) => setModalWaybill(e.target.value)}
                        className={cn("w-full px-3.5 py-2 border rounded-xl text-xs font-mono font-bold outline-none transition focus:border-violet-500/40",
                          dark ? "bg-slate-950 border-white/10 text-white" : "bg-white border-slate-200 text-slate-900"
                        )}
                        placeholder="Enter waybill number..."
                      />
                      <button
                        onClick={() => {
                          setOrders(prev => prev.map(o => o.id === viewingOrder.id ? { ...o, waybillNumber: modalWaybill.trim() } : o));
                          setViewingOrder(prev => prev ? { ...prev, waybillNumber: modalWaybill.trim() } : null);
                          setIsEditingWaybillInModal(false);
                        }}
                        className="bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-xl px-4 py-2 text-xs font-bold transition hover:brightness-110 active:scale-95 shrink-0"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <div className={cn("text-sm font-mono font-extrabold tracking-wider px-3.5 py-2 rounded-xl border border-dashed",
                      viewingOrder.waybillNumber
                        ? dark ? "bg-slate-950 border-violet-500/25 text-violet-400" : "bg-white border-violet-200 text-violet-700"
                        : dark ? "bg-slate-950 border-white/10 text-slate-500" : "bg-slate-50 border-slate-200 text-slate-400"
                    )}>
                      {viewingOrder.waybillNumber || "No waybill number assigned yet"}
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-slate-800/10 dark:border-white/5 flex gap-2">
                <button
                  onClick={() => setViewingOrder(null)}
                  className={cn("flex-1 rounded-xl border py-2.5 text-xs font-bold transition active:scale-[0.98]",
                    dark ? "border-white/10 text-slate-400 hover:bg-white/5" : "border-slate-200 text-slate-655 hover:bg-slate-50"
                  )}
                >
                  Close Details
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </AppShell>
  );
}
