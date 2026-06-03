"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { AppShell } from "@/components/app-shell";
import { useThemeMode } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import { orders as initialOrders } from "@/lib/crh-data";
import {
  Search,
  PackageOpen,
  ArrowRight,
  User,
  X,
  AlertTriangle,
  TrendingUp,
  Clock,
  Filter,
  AlertCircle,
  FileText,
  MapPin,
  Phone,
  CreditCard,
  ChevronRight,
  Zap,
  Layers,
  Hash,
  LayoutGrid,
  LayoutList,
  SlidersHorizontal,
  Eye,
  Printer,
  CircleDot,
  Timer,
  Banknote,
  ShoppingBag,
  Flame,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";

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

/* ─── Receipt Printer ─────────────────────────────────── */
const generateItemsForOrder = (orderPrice: number) => {
  const baseItems = [
    { id: "item-1", name: "EECO Care Premium Soap (Pack of 4)", sku: "PROD-SOAP-01", barcode: "5011001", qty: 1, price: 1500 },
    { id: "item-2", name: "Ceylon Gold Special Tea (250g)", sku: "PROD-TEA-02", barcode: "5011002", qty: 2, price: 2200 },
    { id: "item-3", name: "EECO Hydro Glow Lotion (200ml)", sku: "PROD-LOTN-03", barcode: "5011003", qty: 1, price: 4800 },
  ];
  const sumBase = baseItems.reduce((acc, item) => acc + item.price * item.qty, 0);
  if (orderPrice <= sumBase) {
    return [{ id: "item-0", name: "EECO Packaged Goods (Standard Edition)", sku: "PROD-GOODS-00", barcode: "5011000", qty: 1, price: orderPrice }];
  }
  return [
    ...baseItems,
    { id: "item-4", name: "EECO Care Premium Supplement Pack", sku: "PROD-SUPP-04", barcode: "5011004", qty: 1, price: orderPrice - sumBase },
  ];
};

const formatIssuedDate = (date: Date): string => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
};

const handlePrintReceipt = (order: any) => {
  if (!order) return;
  const orderIssuedDate = formatIssuedDate(new Date());
  const orderItems = generateItemsForOrder(order.price);
  const itemsHtml = orderItems
    .map(
      (item, idx) => `
    <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
      <td style="padding: 8px 4px; text-align: left;">${idx + 1}</td>
      <td style="padding: 8px 4px; text-align: left; font-weight: 600;">${item.name}<div style="font-size: 9px; font-weight: normal; color: #64748b; font-family: monospace; margin-top: 2px;">${item.sku}</div></td>
      <td style="padding: 8px 4px; text-align: center;">${item.qty}</td>
      <td style="padding: 8px 4px; text-align: right;">Rs. ${item.price.toLocaleString()}</td>
      <td style="padding: 8px 4px; text-align: right; font-weight: bold;">Rs. ${(item.price * item.qty).toLocaleString()}</td>
    </tr>
  `
    )
    .join("");

  const receiptHtml = `
    <div class="receipt-container">
      <div style="border-bottom: 2px dashed #cbd5e1; padding-bottom: 12px; margin-bottom: 12px; text-align: left;">
        <h1 style="margin: 0; font-size: 22px; font-weight: 900; color: #4f46e5; font-family: 'Courier New', Courier, monospace; letter-spacing: 0.5px;">
          ${order.orderNumber}
        </h1>
      </div>
      <div style="font-size: 11px; line-height: 1.5; margin-bottom: 14px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
          <span><strong>Customer Name:</strong></span>
          <span style="font-weight: bold;">${order.customerName}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span><strong>Fulfillment Date:</strong></span>
          <span>${orderIssuedDate}</span>
        </div>
      </div>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 14px;">
        <thead>
          <tr style="border-bottom: 2.5px solid #000; font-size: 10px; text-transform: uppercase; font-weight: bold;">
            <th style="padding: 6px 4px; text-align: left; width: 5%;">#</th>
            <th style="padding: 6px 4px; text-align: left;">Item Description</th>
            <th style="padding: 6px 4px; text-align: center; width: 10%;">Qty</th>
            <th style="padding: 6px 4px; text-align: right; width: 20%;">Price</th>
            <th style="padding: 6px 4px; text-align: right; width: 25%;">Total</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      <div style="border-top: 2px dashed #cbd5e1; padding-top: 10px; font-size: 12px;">
        <div style="display: flex; justify-content: space-between; font-weight: 800; font-size: 14px;">
          <span>TOTAL PRICE:</span>
          <span style="color: #10b981;">Rs. ${order.price.toLocaleString()}</span>
        </div>
      </div>
      <div style="text-align: center; margin-top: 25px; border-top: 1px dotted #cbd5e1; padding-top: 12px; font-size: 9px; color: #94a3b8; font-weight: bold;">
        Thank you for shopping with EECO Care!
      </div>
    </div>
  `;

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(`
      <html>
        <head>
          <title>Order Receipt - ${order.orderNumber}</title>
          <style>
            body { margin: 0; padding: 20px; background: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; justify-content: center; }
            .receipt-container { width: 100%; max-width: 480px; background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05); box-sizing: border-box; }
            @media print { body { background: #fff; padding: 0; } .receipt-container { border: none; box-shadow: none; max-width: 100%; padding: 0; } @page { size: portrait; margin: 10mm; } }
          </style>
          <script>window.onload = function() { window.print(); }</script>
        </head>
        <body>${receiptHtml}</body>
      </html>
    `);
    printWindow.document.close();
  }
};

/* ─────────────────────────────────────────────────────────
   MAIN PAGE
   ───────────────────────────────────────────────────────── */
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
            createdAtDaysAgo: o.createdAtDaysAgo ?? (o.id === "o8" ? 4 : o.id === "o14" ? 6 : o.id === "o2" ? 3 : 1),
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
      createdAtDaysAgo: o.id === "o8" ? 4 : o.id === "o14" ? 6 : o.id === "o2" ? 3 : 1,
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

export default function PendingPackingPage() {
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
  const [urgencyFilter, setUrgencyFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const pendingOrders = useMemo(() => {
    return orders.filter(
      (o) =>
        o.status === "Ordered" &&
        (urgencyFilter === "all" ||
          (urgencyFilter === "high" && ["high", "critical"].includes(o.urgentLevel)) ||
          (urgencyFilter === "standard" && !["high", "critical"].includes(o.urgentLevel))) &&
        (channelFilter === "all" || o.salesChannel === channelFilter) &&
        (o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          o.waybillNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          o.district.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [orders, searchQuery, urgencyFilter, channelFilter]);

  const stats = useMemo(() => {
    const allPending = orders.filter((o) => o.status === "Ordered");
    const totalCount = allPending.length;
    const totalValue = allPending.reduce((sum, o) => sum + o.price, 0);
    const criticalCount = allPending.filter((o) => ["high", "critical"].includes(o.urgentLevel)).length;
    const standardCount = allPending.filter((o) => !["high", "critical"].includes(o.urgentLevel)).length;
    const oldestDays = allPending.reduce((max, o) => {
      const days = o.id === "o8" ? 4 : o.id === "o14" ? 6 : o.id === "o2" ? 3 : 1;
      return Math.max(max, days);
    }, 0);
    return { totalCount, totalValue, criticalCount, standardCount, oldestDays };
  }, [orders]);



  const getUrgencyConfig = (level: string) => {
    switch (level) {
      case "critical":
        return {
          label: "CRITICAL",
          dot: "bg-rose-500",
          badge: dark
            ? "bg-rose-500/15 text-rose-400 ring-1 ring-rose-500/30"
            : "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
          border: dark ? "border-l-rose-500" : "border-l-rose-400",
          glow: dark ? "shadow-[inset_0_0_30px_rgba(244,63,94,0.06)]" : "",
          icon: <Flame className="h-3 w-3" />,
        };
      case "high":
        return {
          label: "HIGH",
          dot: "bg-orange-500",
          badge: dark
            ? "bg-orange-500/15 text-orange-400 ring-1 ring-orange-500/30"
            : "bg-orange-50 text-orange-700 ring-1 ring-orange-200",
          border: dark ? "border-l-orange-500" : "border-l-orange-400",
          glow: dark ? "shadow-[inset_0_0_30px_rgba(249,115,22,0.06)]" : "",
          icon: <AlertTriangle className="h-3 w-3" />,
        };
      case "medium":
        return {
          label: "MEDIUM",
          dot: "bg-amber-500",
          badge: dark
            ? "bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30"
            : "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
          border: dark ? "border-l-amber-400" : "border-l-amber-300",
          glow: "",
          icon: <CircleDot className="h-3 w-3" />,
        };
      default:
        return {
          label: "STANDARD",
          dot: dark ? "bg-slate-500" : "bg-slate-400",
          badge: dark
            ? "bg-slate-500/15 text-slate-400 ring-1 ring-slate-500/30"
            : "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
          border: dark ? "border-l-slate-600" : "border-l-slate-300",
          glow: "",
          icon: null,
        };
    }
  };

  const statCards = [
    {
      label: "Total Pending",
      value: stats.totalCount,
      suffix: "orders",
      icon: Layers,
      color: "violet",
      grad: "from-violet-500 to-purple-600",
      bg: dark ? "bg-violet-500/10" : "bg-violet-50",
      text: dark ? "text-violet-400" : "text-violet-600",
    },
    {
      label: "Urgent Orders",
      value: stats.criticalCount,
      suffix: "critical",
      icon: Zap,
      color: "rose",
      grad: "from-rose-500 to-pink-600",
      bg: dark ? "bg-rose-500/10" : "bg-rose-50",
      text: dark ? "text-rose-400" : "text-rose-600",
    },
    {
      label: "COD Pipeline",
      value: stats.totalValue,
      suffix: "",
      icon: Banknote,
      color: "emerald",
      grad: "from-emerald-500 to-teal-600",
      bg: dark ? "bg-emerald-500/10" : "bg-emerald-50",
      text: dark ? "text-emerald-400" : "text-emerald-600",
      isCurrency: true,
    },
    {
      label: "Oldest Order",
      value: stats.oldestDays,
      suffix: "days",
      icon: Timer,
      color: "blue",
      grad: "from-blue-500 to-indigo-600",
      bg: dark ? "bg-blue-500/10" : "bg-blue-50",
      text: dark ? "text-blue-400" : "text-blue-600",
    },
  ];

  const filterChips = [
    { key: "all", label: "All Orders", count: stats.totalCount, icon: Layers },
    { key: "high", label: "Urgent", count: stats.criticalCount, icon: Zap },
    { key: "standard", label: "Standard", count: stats.standardCount, icon: ShoppingBag },
  ];

  return (
    <AppShell
      title="Pending Packing"
      description="Overview of orders waiting to be packaged, weighed, and dispatched to courier channels."
      customIcon={<PackageOpen className="h-5 w-5" />}
      customGradient="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-indigo-700 text-white shadow-xl border-none"
    >
      {/* Inline keyframes */}
      <style>{`
        @keyframes shimmer-slide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.85); opacity: 0.6; }
          50% { transform: scale(1.15); opacity: 0; }
          100% { transform: scale(0.85); opacity: 0; }
        }
        @keyframes float-up {
          0% { transform: translateY(6px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        .anim-float-up { animation: float-up 0.5s ease-out both; }
      `}</style>

      <div className="space-y-5">

        {/* ═══════════════════════════════════════════════════════
            STAT CARDS ROW
           ═══════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {statCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.05 + idx * 0.04 }}
                className={cn(
                  "relative overflow-hidden rounded-2xl border p-4 transition-all duration-300 group/stat",
                  dark
                    ? "border-white/[0.08] bg-slate-900/70 hover:border-white/15 hover:bg-slate-800/90"
                    : "border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-lg"
                )}
              >
                {/* Top accent line */}
                <div className={cn("absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r opacity-80", card.grad)} />

                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <span
                      className={cn(
                        "text-[10px] font-bold uppercase tracking-[0.08em]",
                        dark ? "text-slate-500" : "text-slate-400"
                      )}
                    >
                      {card.label}
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className={cn("text-2xl font-extrabold tracking-tight leading-none", dark ? "text-white" : "text-slate-900")}>
                        {card.isCurrency ? `Rs. ${card.value.toLocaleString()}` : card.value}
                      </span>
                      {card.suffix && (
                        <span className={cn("text-[10px] font-semibold", dark ? "text-slate-500" : "text-slate-400")}>
                          {card.suffix}
                        </span>
                      )}
                    </div>
                  </div>
                  <div
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-xl transition-transform duration-300 group-hover/stat:scale-110",
                      card.bg
                    )}
                  >
                    <Icon className={cn("h-4 w-4", card.text)} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* ═══════════════════════════════════════════════════════
            SEARCH + FILTER TOOLBAR
           ═══════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className={cn(
            "rounded-2xl border p-4 space-y-3 transition-all duration-300",
            dark ? "border-white/[0.08] bg-slate-900/70" : "border-slate-200/80 bg-white"
          )}
        >
          {/* Top row: search + channel + view toggle */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Search */}
            <div
              className={cn(
                "flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 transition-all duration-300 flex-1 max-w-md group/search",
                dark
                  ? "border-white/[0.08] bg-slate-800/70 focus-within:border-violet-500/60 focus-within:bg-slate-800 focus-within:shadow-[0_0_12px_rgba(139,92,246,0.1)]"
                  : "border-slate-200 bg-slate-50/80 focus-within:border-violet-400 focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(139,92,246,0.08)]"
              )}
            >
              <Search
                className={cn(
                  "h-4 w-4 shrink-0 transition-colors",
                  dark ? "text-slate-500 group-focus-within/search:text-violet-400" : "text-slate-400 group-focus-within/search:text-violet-500"
                )}
              />
              <input
                ref={searchRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search order, customer, waybill, district..."
                className={cn(
                  "w-full bg-transparent text-sm outline-none",
                  dark ? "placeholder:text-slate-600 text-white" : "placeholder:text-slate-400 text-slate-900"
                )}
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    searchRef.current?.focus();
                  }}
                  className={cn("shrink-0 rounded-md p-0.5 transition-colors", dark ? "hover:bg-white/10" : "hover:bg-slate-200")}
                >
                  <X className="h-3.5 w-3.5 text-slate-400" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Channel filter */}
              <div className="relative">
                <select
                  value={channelFilter}
                  onChange={(e) => setChannelFilter(e.target.value)}
                  className={cn(
                    "rounded-xl border px-3.5 py-2.5 text-xs font-semibold appearance-none cursor-pointer pr-8 outline-none transition-all",
                    dark
                      ? "bg-slate-800 border-white/[0.08] text-slate-300 hover:bg-slate-700 focus:border-violet-500/50"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 focus:border-violet-400"
                  )}
                >
                  <option value="all">All Channels</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Facebook">Facebook</option>
                  <option value="Website">Website</option>
                  <option value="Messenger">Messenger</option>
                </select>
                <SlidersHorizontal className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 opacity-40 pointer-events-none" />
              </div>

              {/* View toggle */}
              <div
                className={cn(
                  "flex rounded-xl border overflow-hidden",
                  dark ? "border-white/[0.08]" : "border-slate-200"
                )}
              >
                {[
                  { mode: "card" as const, icon: LayoutGrid },
                  { mode: "table" as const, icon: LayoutList },
                ].map(({ mode, icon: VIcon }) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={cn(
                      "flex items-center justify-center h-[38px] w-[38px] transition-all duration-200",
                      viewMode === mode
                        ? dark
                          ? "bg-violet-500/20 text-violet-400"
                          : "bg-violet-50 text-violet-600"
                        : dark
                        ? "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                        : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    <VIcon className="h-4 w-4" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Filter chips */}
          <div className="flex flex-wrap gap-2">
            {filterChips.map((chip) => {
              const isActive = urgencyFilter === chip.key;
              const ChipIcon = chip.icon;
              return (
                <button
                  key={chip.key}
                  onClick={() => setUrgencyFilter(chip.key)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11px] font-bold transition-all duration-200 active:scale-95",
                    isActive
                      ? dark
                        ? "bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/30 shadow-[0_0_10px_rgba(139,92,246,0.1)]"
                        : "bg-violet-50 text-violet-700 ring-1 ring-violet-200 shadow-sm"
                      : dark
                      ? "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                  )}
                >
                  <ChipIcon className="h-3 w-3" />
                  {chip.label}
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-px text-[9px] font-extrabold",
                      isActive
                        ? dark
                          ? "bg-violet-500/20 text-violet-300"
                          : "bg-violet-100 text-violet-700"
                        : dark
                        ? "bg-white/5 text-slate-600"
                        : "bg-slate-100 text-slate-400"
                    )}
                  >
                    {chip.count}
                  </span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* ═══════════════════════════════════════════════════════
            RESULTS COUNT BAR
           ═══════════════════════════════════════════════════════ */}
        <div className="flex items-center justify-between px-1">
          <span className={cn("text-xs font-semibold", dark ? "text-slate-500" : "text-slate-400")}>
            Showing <span className={dark ? "text-white" : "text-slate-700"}>{pendingOrders.length}</span> of {stats.totalCount} pending orders
          </span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className={cn(
                "text-[10px] font-bold px-2 py-1 rounded-md transition-colors",
                dark ? "text-violet-400 hover:bg-violet-500/10" : "text-violet-600 hover:bg-violet-50"
              )}
            >
              Clear search
            </button>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════
            ORDERS — CARD VIEW
           ═══════════════════════════════════════════════════════ */}
        <AnimatePresence mode="wait">
          {viewMode === "card" ? (
            <motion.div
              key="card-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              {pendingOrders.length === 0 ? (
                <div
                  className={cn(
                    "rounded-2xl border p-12 text-center",
                    dark ? "border-white/[0.08] bg-slate-900/70" : "border-slate-200/80 bg-white"
                  )}
                >
                  <PackageOpen className={cn("h-10 w-10 mx-auto mb-3", dark ? "text-slate-600" : "text-slate-300")} />
                  <p className={cn("text-sm font-semibold", dark ? "text-slate-400" : "text-slate-500")}>
                    No pending orders match your filters
                  </p>
                  <p className={cn("text-xs mt-1", dark ? "text-slate-600" : "text-slate-400")}>
                    Try adjusting your search or filter criteria
                  </p>
                </div>
              ) : (
                pendingOrders.map((order, idx) => {
                  const urg = getUrgencyConfig(order.urgentLevel);
                  const isHovered = hoveredCard === order.id;
                  const daysPending = order.createdAtDaysAgo;
                  const isOld = daysPending >= 3;

                  return (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: idx * 0.03 }}
                      onMouseEnter={() => setHoveredCard(order.id)}
                      onMouseLeave={() => setHoveredCard(null)}
                      className={cn(
                        "relative rounded-2xl border border-l-[3px] transition-all duration-300 group/order",
                        urg.border,
                        urg.glow,
                        dark
                          ? "border-white/[0.08] bg-slate-900/70 hover:bg-slate-800/90 hover:border-white/15"
                          : "border-slate-200/80 bg-white hover:shadow-lg hover:shadow-slate-200/50 hover:border-slate-300",
                        isHovered && (dark ? "ring-1 ring-white/[0.06]" : "ring-1 ring-violet-100")
                      )}
                    >
                      {/* Card body */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4">
                        {/* Left section: Order info */}
                        <div className="flex-1 min-w-0 space-y-2.5">
                          {/* Row 1: Order number + urgency badge */}
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <span
                              className={cn(
                                "text-sm font-extrabold tracking-tight",
                                dark ? "text-white" : "text-slate-900"
                              )}
                            >
                              {order.orderNumber}
                            </span>
                            <span className={cn("inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider", urg.badge)}>
                              {urg.icon}
                              {urg.label}
                            </span>
                            {isOld && (
                              <span
                                className={cn(
                                  "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[9px] font-bold",
                                  daysPending >= 5
                                    ? dark
                                      ? "bg-rose-500/15 text-rose-400"
                                      : "bg-rose-50 text-rose-600"
                                    : dark
                                    ? "bg-amber-500/15 text-amber-400"
                                    : "bg-amber-50 text-amber-600"
                                )}
                              >
                                <Clock className="h-2.5 w-2.5" />
                                {daysPending}d in queue
                              </span>
                            )}
                          </div>

                          {/* Row 2: Customer + location details */}
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                            <div className="flex items-center gap-1.5">
                              <User className={cn("h-3 w-3 shrink-0", dark ? "text-slate-500" : "text-slate-400")} />
                              <span className={cn("text-xs font-semibold", dark ? "text-slate-200" : "text-slate-700")}>
                                {order.customerName}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <MapPin className={cn("h-3 w-3 shrink-0", dark ? "text-slate-600" : "text-slate-400")} />
                              <span className={cn("text-[11px]", dark ? "text-slate-400" : "text-slate-500")}>
                                {order.city}, {order.district}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Phone className={cn("h-3 w-3 shrink-0", dark ? "text-slate-600" : "text-slate-400")} />
                              <span className={cn("text-[11px] font-mono", dark ? "text-slate-500" : "text-slate-400")}>
                                {order.contact}
                              </span>
                            </div>
                          </div>

                          {/* Row 3: Metadata pills */}
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold",
                                dark ? "bg-white/[0.04] text-slate-400" : "bg-slate-100 text-slate-500"
                              )}
                            >
                              <Hash className="h-2.5 w-2.5" />
                              {order.waybillNumber}
                            </span>
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold",
                                dark ? "bg-white/[0.04] text-slate-400" : "bg-slate-100 text-slate-500"
                              )}
                            >
                              <ShoppingBag className="h-2.5 w-2.5" />
                              {order.salesChannel}
                            </span>
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold",
                                dark ? "bg-white/[0.04] text-slate-400" : "bg-slate-100 text-slate-500"
                              )}
                            >
                              <CreditCard className="h-2.5 w-2.5" />
                              {order.paymentMethod}
                            </span>
                          </div>
                        </div>

                        {/* Right section: price + actions */}
                        <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-2 sm:min-w-[160px] shrink-0">
                          {/* Price */}
                          <div className="text-right">
                            <span className={cn("text-lg font-extrabold tracking-tight", dark ? "text-white" : "text-slate-900")}>
                              Rs. {order.price.toLocaleString()}
                            </span>
                            <div className={cn("text-[9px] font-bold uppercase tracking-wider mt-0.5", dark ? "text-slate-600" : "text-slate-400")}>
                              COD Value
                            </div>
                          </div>

                          {/* Action buttons */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handlePrintReceipt(order)}
                              className={cn(
                                "flex h-8 w-8 items-center justify-center rounded-lg border transition-all duration-200 active:scale-90",
                                dark
                                  ? "border-white/[0.08] hover:bg-white/[0.06] text-slate-500 hover:text-slate-300"
                                  : "border-slate-200 hover:bg-slate-50 text-slate-400 hover:text-slate-600"
                              )}
                              title="Print Receipt"
                            >
                              <Printer className="h-3.5 w-3.5" />
                            </button>
                            <Link
                              href={`/packing/packing-orders?id=${order.id}`}
                              className={cn(
                                "inline-flex h-8 items-center gap-1.5 rounded-lg px-3.5 text-xs font-bold text-white transition-all duration-200 active:scale-95",
                                "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500",
                                "shadow-sm shadow-violet-600/20 hover:shadow-md hover:shadow-violet-600/30"
                              )}
                            >
                              Pack
                              <ArrowRight className="h-3 w-3" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </motion.div>
          ) : (
            /* ═══════════════════════════════════════════════════
               ORDERS — TABLE VIEW
               ═══════════════════════════════════════════════════ */
            <motion.div
              key="table-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "rounded-2xl border overflow-hidden",
                dark ? "border-white/[0.08] bg-slate-900/70" : "border-slate-200/80 bg-white"
              )}
            >
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] text-sm">
                  <thead>
                    <tr
                      className={cn(
                        "text-left text-[10px] uppercase tracking-wider",
                        dark ? "bg-slate-800/50 text-slate-500 border-b border-white/5" : "bg-slate-50/80 text-slate-500 border-b border-slate-100"
                      )}
                    >
                      <th className="px-4 py-3 font-bold">Order</th>
                      <th className="px-4 py-3 font-bold">Customer</th>
                      <th className="px-4 py-3 font-bold text-center">Priority</th>
                      <th className="px-4 py-3 font-bold">Channel</th>
                      <th className="px-4 py-3 font-bold text-center">Age</th>
                      <th className="px-4 py-3 font-bold text-right">COD Value</th>
                      <th className="px-4 py-3 font-bold text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingOrders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-14 text-center">
                          <PackageOpen className={cn("h-8 w-8 mx-auto mb-2", dark ? "text-slate-600" : "text-slate-300")} />
                          <span className={cn("text-sm font-semibold", dark ? "text-slate-500" : "text-slate-400")}>
                            No pending orders found
                          </span>
                        </td>
                      </tr>
                    ) : (
                      pendingOrders.map((order) => {
                        const urg = getUrgencyConfig(order.urgentLevel);
                        const daysPending = order.createdAtDaysAgo;

                        return (
                          <tr
                            key={order.id}
                            className={cn(
                              "border-t transition-colors duration-150",
                              dark ? "border-white/[0.04] hover:bg-white/[0.03]" : "border-slate-100 hover:bg-slate-50/50",
                              (order.urgentLevel === "critical" || order.urgentLevel === "high") &&
                                (dark ? "border-l-2 border-l-rose-500/60" : "border-l-2 border-l-rose-300")
                            )}
                          >
                            <td className="px-4 py-3.5">
                              <div className={cn("text-xs font-bold", dark ? "text-violet-400" : "text-violet-600")}>
                                {order.orderNumber}
                              </div>
                              <div className={cn("font-mono text-[10px] mt-0.5", dark ? "text-slate-600" : "text-slate-400")}>
                                {order.waybillNumber}
                              </div>
                            </td>
                            <td className="px-4 py-3.5">
                              <div className={cn("text-xs font-semibold", dark ? "text-slate-200" : "text-slate-700")}>
                                {order.customerName}
                              </div>
                              <div className={cn("text-[10px] mt-0.5 flex items-center gap-1", dark ? "text-slate-500" : "text-slate-400")}>
                                <MapPin className="h-2.5 w-2.5" />
                                {order.city}, {order.district}
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <span className={cn("inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[9px] font-extrabold uppercase", urg.badge)}>
                                {urg.icon}
                                {urg.label}
                              </span>
                            </td>
                            <td className="px-4 py-3.5">
                              <span className={cn("text-xs font-semibold", dark ? "text-slate-300" : "text-slate-600")}>
                                {order.salesChannel}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <span
                                className={cn(
                                  "text-xs font-bold",
                                  daysPending >= 5
                                    ? "text-rose-500"
                                    : daysPending >= 3
                                    ? "text-orange-500"
                                    : dark
                                    ? "text-slate-300"
                                    : "text-slate-600"
                                )}
                              >
                                {daysPending}d
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-right">
                              <span className={cn("text-xs font-extrabold", dark ? "text-white" : "text-slate-900")}>
                                Rs. {order.price.toLocaleString()}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => handlePrintReceipt(order)}
                                  className={cn(
                                    "flex h-7 w-7 items-center justify-center rounded-lg border transition-all active:scale-90",
                                    dark
                                      ? "border-white/[0.08] hover:bg-white/[0.06] text-slate-500 hover:text-slate-300"
                                      : "border-slate-200 hover:bg-slate-50 text-slate-400 hover:text-slate-600"
                                  )}
                                  title="Print"
                                >
                                  <Printer className="h-3 w-3" />
                                </button>
                                <Link
                                  href={`/packing/packing-orders?id=${order.id}`}
                                  className="inline-flex h-7 items-center gap-1 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 px-3 text-[10px] font-bold text-white transition-all active:scale-95 shadow-sm shadow-violet-600/20"
                                >
                                  Pack <ArrowRight className="h-2.5 w-2.5" />
                                </Link>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppShell>
  );
}
