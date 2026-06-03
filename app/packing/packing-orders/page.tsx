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
  PackageOpen,
  Printer,
  FileText,
  QrCode,
  RotateCcw,
  Scale,
  Scan,
  AlertCircle,
  Truck,
  User,
  ArrowRight,
  TrendingUp,
  Boxes,
  HelpCircle,
  X,
  Plus,
  MapPin,
  ChevronDown,
  ChevronRight,
  LayoutGrid,
  Trash2,
  MoreHorizontal,
  Hash,
  CreditCard,
  Eye,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

// Sound Effects via Web Audio API
const playBeepSound = (type: "success" | "error") => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (type === "success") {
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(950, ctx.currentTime);
      gain1.gain.setValueAtTime(0.08, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.08);

      setTimeout(() => {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(1450, ctx.currentTime);
        gain2.gain.setValueAtTime(0.08, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start();
        osc2.stop(ctx.currentTime + 0.08);
      }, 60);
    } else {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(140, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.22);
    }
  } catch (e) {
    console.warn("Web Audio API not supported:", e);
  }
};

const generateItemsForOrder = (orderPrice: number) => {
  const baseItems = [
    { id: "item-1", name: "EECO Care Premium Soap (Pack of 4)", sku: "PROD-SOAP-01", barcode: "5011001", qty: 1, price: 1500, image: "🧼" },
    { id: "item-2", name: "Ceylon Gold Special Tea (250g)", sku: "PROD-TEA-02", barcode: "5011002", qty: 2, price: 2200, image: "🍃" },
    { id: "item-3", name: "EECO Hydro Glow Lotion (200ml)", sku: "PROD-LOTN-03", barcode: "5011003", qty: 1, price: 4800, image: "🧴" },
  ];

  const sumBase = baseItems.reduce((acc, item) => acc + item.price * item.qty, 0);
  if (orderPrice <= sumBase) {
    return [
      { id: "item-0", name: "EECO Packaged Goods (Standard Edition)", sku: "PROD-GOODS-00", barcode: "5011000", qty: 1, price: orderPrice, image: "📦" },
    ];
  } else {
    return [
      ...baseItems,
      { id: "item-4", name: "EECO Care Premium Supplement Pack", sku: "PROD-SUPP-04", barcode: "5011004", qty: 1, price: orderPrice - sumBase, image: "🧴" },
    ];
  }
};

const generateCode39SVG = (value?: string): string => {
  if (!value) return "";
  const CODE39_MAP: Record<string, string> = {
    '0': '000110100', '1': '100100001', '2': '001100001', '3': '101100000',
    '4': '000110001', '5': '100110000', '6': '001110000', '7': '000100101',
    '8': '100100100', '9': '001100100', 'A': '100001001', 'B': '001001001',
    'C': '101001000', 'D': '000011001', 'E': '100011000', 'F': '001011000',
    'G': '000001101', 'H': '100001100', 'I': '001001100', 'J': '000011100',
    'K': '100000011', 'L': '001000011', 'M': '101000010', 'N': '000010011',
    'O': '100010010', 'P': '001010010', 'Q': '000000111', 'R': '100000110',
    'S': '001000110', 'T': '000010110', 'U': '110000001', 'V': '011000001',
    'W': '111000000', 'X': '010010001', 'Y': '110010000', 'Z': '011010000',
    '-': '010000101', '.': '110000100', ' ': '011000100', '*': '010010100',
    '$': '010101000', '/': '010100010', '+': '010001010', '%': '000101010'
  };

  const cleanValue = "*" + value.toUpperCase().replace(/[^A-Z0-9\-]/g, "") + "*";
  let x = 0;
  const narrowWidth = 1.5;
  const wideWidth = 3.8;
  const gap = 1.5;
  let rectsHTML = '';

  for (let i = 0; i < cleanValue.length; i++) {
    const char = cleanValue[i];
    const pattern = CODE39_MAP[char] || CODE39_MAP['*'];
    
    for (let j = 0; j < 9; j++) {
      const isBlack = j % 2 === 0;
      const isWide = pattern[j] === '1';
      const width = isWide ? wideWidth : narrowWidth;
      
      if (isBlack) {
        rectsHTML += `<rect x="${x}" y="0" width="${width}" height="45" fill="black" />`;
      }
      x += width;
    }
    x += gap;
  }

  return `<svg viewBox="0 0 ${x} 45" style="width: 100%; height: 42px;" preserveAspectRatio="none">${rectsHTML}</svg>`;
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

function useAnimatedValue(targetValue: number, duration = 800) {
  const [currentValue, setCurrentValue] = useState(targetValue);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const startValue = currentValue;
    const change = targetValue - startValue;

    if (change === 0) return;

    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      // Easing function: easeOutQuad
      const easeProgress = progress * (2 - progress);
      
      setCurrentValue(startValue + change * easeProgress);

      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(step);
      }
    };

    animationFrameId = window.requestAnimationFrame(step);
    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [targetValue]);

  return currentValue;
}

function StatBox({
  title,
  value,
  suffix,
  icon: Icon,
  color,
}: {
  title: string;
  value: string | number;
  suffix?: string;
  icon: any;
  color: "violet" | "emerald" | "blue" | "fuchsia";
}) {
  const { dark } = useThemeMode();
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const colorMap = {
    violet: {
      border: dark ? "border-violet-500/20 bg-slate-900/60" : "border-violet-200 bg-white",
      glowColor: dark ? "rgba(139, 92, 246, 0.12)" : "rgba(139, 92, 246, 0.06)",
      topGradient: "from-violet-500 to-purple-600",
      bg: dark ? "bg-violet-500/10 text-violet-400" : "bg-violet-50 text-violet-600",
      text: dark ? "text-violet-400" : "text-violet-600",
    },
    emerald: {
      border: dark ? "border-emerald-500/20 bg-slate-900/60" : "border-emerald-200 bg-white",
      glowColor: dark ? "rgba(16, 185, 129, 0.12)" : "rgba(16, 185, 129, 0.06)",
      topGradient: "from-emerald-500 to-teal-600",
      bg: dark ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-50 text-emerald-600",
      text: dark ? "text-emerald-400" : "text-emerald-600",
    },
    blue: {
      border: dark ? "border-blue-500/20 bg-slate-900/60" : "border-blue-200 bg-white",
      glowColor: dark ? "rgba(59, 130, 246, 0.12)" : "rgba(59, 130, 246, 0.06)",
      topGradient: "from-blue-500 to-indigo-600",
      bg: dark ? "bg-blue-500/10 text-blue-400" : "bg-blue-50 text-blue-600",
      text: dark ? "text-blue-400" : "text-blue-600",
    },
    fuchsia: {
      border: dark ? "border-fuchsia-500/20 bg-slate-900/60" : "border-fuchsia-200 bg-white",
      glowColor: dark ? "rgba(217, 70, 239, 0.12)" : "rgba(217, 70, 239, 0.06)",
      topGradient: "from-fuchsia-500 to-pink-600",
      bg: dark ? "bg-fuchsia-500/10 text-fuchsia-400" : "bg-fuchsia-50 text-fuchsia-600",
      text: dark ? "text-fuchsia-400" : "text-fuchsia-600",
    },
  };

  const theme = colorMap[color];

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setCoords({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const animatedNum = useAnimatedValue(typeof value === "number" ? value : parseFloat(String(value).replace(/[^\d.-]/g, "")) || 0);
  const displayValue = typeof value === "number" ? String(Math.round(animatedNum)) : value;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "relative overflow-hidden rounded-3xl border p-5 flex flex-col justify-between min-h-[120px] transition-all duration-300 card-hover text-left",
        theme.border
      )}
      style={{
        boxShadow: dark
          ? (isHovered ? `0 12px 30px ${theme.glowColor}, 0 0 15px ${theme.glowColor}` : `0 4px 15px rgba(0,0,0,0.2)`)
          : (isHovered ? `0 12px 30px ${theme.glowColor}` : undefined)
      }}
    >
      <div className={cn("absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r", theme.topGradient)} />
      {isHovered && (
        <div
          className="absolute pointer-events-none rounded-3xl opacity-40 transition-opacity duration-300"
          style={{
            width: "100%",
            height: "100%",
            left: 0,
            top: 0,
            background: `radial-gradient(140px circle at ${coords.x}px ${coords.y}px, ${theme.glowColor}, transparent 70%)`,
            zIndex: 1,
          }}
        />
      )}
      <div className="flex items-start justify-between w-full z-10 relative">
        <div className="space-y-1.5">
          <div className={cn("text-[10px] font-bold uppercase tracking-[0.08em]", dark ? "text-slate-500" : "text-slate-400")}>
            {title}
          </div>
          <div className="flex items-baseline gap-1">
            <span className={cn("text-2xl font-extrabold tracking-tight leading-none", dark ? "text-white" : "text-slate-900")}>
              {displayValue}
            </span>
            {suffix && (
              <span className={cn("text-[10px] font-semibold", dark ? "text-slate-500" : "text-slate-400")}>
                {suffix}
              </span>
            )}
          </div>
        </div>
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl transition-transform duration-300", theme.bg, isHovered && "scale-110")}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </motion.div>
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

export default function PackingOrdersPage() {
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

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Queue active session states
  const [activeQueueIds, setActiveQueueIds] = useState<string[]>(["o16", "o10"]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedModalOrderIds, setSelectedModalOrderIds] = useState<string[]>([]);
  const [modalSearchQuery, setModalSearchQuery] = useState("");

  // Deletion and bulk-manage states
  const [selectedQueueOrderIds, setSelectedQueueOrderIds] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlId = params.get("id");
      if (urlId) {
        setSelectedOrderId(urlId);
        setActiveQueueIds((prev) => (prev.includes(urlId) ? prev : [...prev, urlId]));
      }
    }
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<"all" | "Ordered" | "Packed" | "Dispatched">("Ordered");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [scanStatus, setScanStatus] = useState<{ message: string; type: "success" | "error" | null }>({ message: "", type: null });

  const [showWaybillModal, setShowWaybillModal] = useState(false);
  const [isPackingCompleted, setIsPackingCompleted] = useState(false);
  const [showCheatSheet, setShowCheatSheet] = useState(true);

  const memoizedIssuedDate = useMemo(() => {
    if (!selectedOrderId) return "";
    return formatIssuedDate(new Date());
  }, [selectedOrderId]);

  const selectedOrder = useMemo(() => orders.find((o) => o.id === selectedOrderId) || null, [orders, selectedOrderId]);
  const [checklistState, setChecklistState] = useState<Record<string, boolean>>({});

  const selectedOrderItems = useMemo(() => {
    if (!selectedOrder) return [];
    return generateItemsForOrder(selectedOrder.price);
  }, [selectedOrder]);

  useEffect(() => {
    if (selectedOrder) {
      const initial: Record<string, boolean> = {};
      selectedOrderItems.forEach((item) => {
        initial[item.sku] = true;
      });
      setChecklistState(initial);
      setScanStatus({ message: "", type: null });
      setBarcodeInput("");
      setShowCheatSheet(true);
    }
  }, [selectedOrderId, selectedOrderItems, selectedOrder]);

  const allItemsPacked = useMemo(() => {
    if (selectedOrderItems.length === 0) return false;
    return selectedOrderItems.every((item) => checklistState[item.sku]);
  }, [selectedOrderItems, checklistState]);

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !barcodeInput.trim()) return;

    const trimmedInput = barcodeInput.trim().toUpperCase();
    const matchedItem = selectedOrderItems.find(
      (item) => item.sku.toUpperCase() === trimmedInput || item.barcode === trimmedInput
    );

    if (matchedItem) {
      if (checklistState[matchedItem.sku]) {
        setScanStatus({ message: `Item "${matchedItem.name}" already verified!`, type: "error" });
        playBeepSound("error");
      } else {
        setChecklistState((prev) => ({ ...prev, [matchedItem.sku]: true }));
        setScanStatus({ message: `Scanned successfully: ${matchedItem.name}!`, type: "success" });
        playBeepSound("success");
        setShowCheatSheet(false);
      }
    } else {
      setScanStatus({ message: "SKU or Barcode mismatch! Verify label and try again.", type: "error" });
      playBeepSound("error");
    }
    setBarcodeInput("");
    setTimeout(() => setScanStatus({ message: "", type: null }), 3000);
  };

  const toggleItemPack = (sku: string) => {
    setChecklistState((prev) => {
      const val = !prev[sku];
      playBeepSound(val ? "success" : "error");
      return { ...prev, [sku]: val };
    });
  };

  const handleCompletePacking = () => {
    if (!selectedOrderId || !allItemsPacked) return;

    setIsPackingCompleted(true);
    setTimeout(() => {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === selectedOrderId
            ? { ...o, packingStatus: "Packed", status: "collected_koombio" }
            : o
        )
      );
      setIsPackingCompleted(false);
      setScanStatus({ message: "Order packing checklist completed successfully!", type: "success" });
    }, 1500);
  };

  const handleCourierDispatch = () => {
    if (!selectedOrderId) return;
    setOrders((prev) =>
      prev.map((o) =>
        o.id === selectedOrderId
          ? {
              ...o,
              packingStatus: "Dispatched",
              status: "collected_koombio",
              dispatchedDate: new Date().toISOString().split("T")[0],
            }
          : o
      )
    );
    setSelectedOrderId(null);
  };

  const handleBulkCompletePacking = () => {
    const orderedIds = selectedQueueOrderIds.filter((id) => {
      const order = orders.find((o) => o.id === id);
      return order && order.packingStatus === "Ordered";
    });
    if (orderedIds.length === 0) return;

    setOrders((prev) =>
      prev.map((o) =>
        orderedIds.includes(o.id)
          ? { ...o, packingStatus: "Packed", status: "collected_koombio" }
          : o
      )
    );
    playBeepSound("success");
    setSelectedQueueOrderIds([]);
    setScanStatus({ message: `${orderedIds.length} order(s) verified & packed successfully!`, type: "success" });
    setTimeout(() => setScanStatus({ message: "", type: null }), 3000);
  };

  const handleBulkDispatch = () => {
    const packedIds = selectedQueueOrderIds.filter((id) => {
      const order = orders.find((o) => o.id === id);
      return order && order.packingStatus === "Packed";
    });
    if (packedIds.length === 0) return;

    setOrders((prev) =>
      prev.map((o) =>
        packedIds.includes(o.id)
          ? {
              ...o,
              packingStatus: "Dispatched",
              status: "collected_koombio",
              dispatchedDate: new Date().toISOString().split("T")[0],
            }
          : o
      )
    );
    playBeepSound("success");
    setSelectedQueueOrderIds([]);
  };

  const toggleCheckAll = () => {
    if (!selectedOrder || selectedOrder.packingStatus !== "Ordered") return;
    const allChecked = selectedOrderItems.every((item) => checklistState[item.sku]);
    const newState: Record<string, boolean> = {};
    selectedOrderItems.forEach((item) => {
      newState[item.sku] = !allChecked;
    });
    setChecklistState(newState);
    playBeepSound(allChecked ? "error" : "success");
  };

  const packedCount = selectedOrderItems.filter((item) => checklistState[item.sku]).length;
  const packingProgress = selectedOrderItems.length > 0 ? (packedCount / selectedOrderItems.length) * 100 : 0;

  const handlePrintReceipt = (order: any) => {
    if (!order) return;

    const orderIssuedDate = formatIssuedDate(new Date());
    const orderItems = generateItemsForOrder(order.price);

    const itemsHtml = orderItems.map((item, idx) => `
      <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
        <td style="padding: 8px 4px; text-align: left;">${idx + 1}</td>
        <td style="padding: 8px 4px; text-align: left; font-weight: 600;">${item.name}<div style="font-size: 9px; font-weight: normal; color: #64748b; font-family: monospace; margin-top: 2px;">${item.sku}</div></td>
        <td style="padding: 8px 4px; text-align: center;">${item.qty}</td>
        <td style="padding: 8px 4px; text-align: right;">Rs. ${item.price.toLocaleString()}</td>
        <td style="padding: 8px 4px; text-align: right; font-weight: bold;">Rs. ${(item.price * item.qty).toLocaleString()}</td>
      </tr>
    `).join("");

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
          <tbody>
            ${itemsHtml}
          </tbody>
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
              body {
                margin: 0;
                padding: 20px;
                background: #f8fafc;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                display: flex;
                justify-content: center;
              }
              .receipt-container {
                width: 100%;
                max-width: 480px;
                background: #fff;
                border: 1px solid #e2e8f0;
                border-radius: 16px;
                padding: 20px;
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
                box-sizing: border-box;
              }
              @media print {
                body {
                  background: #fff;
                  padding: 0;
                }
                .receipt-container {
                  border: none;
                  box-shadow: none;
                  max-width: 100%;
                  padding: 0;
                }
                @page {
                  size: portrait;
                  margin: 10mm;
                }
              }
            </style>
            <script>
              window.onload = function() {
                window.print();
              }
            </script>
          </head>
          <body>
            ${receiptHtml}
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleBulkPrintWaybills = (ids: string[]) => {
    if (ids.length === 0) return;

    let pagesHtml = "";
    ids.forEach((id) => {
      const order = orders.find((o) => o.id === id);
      if (!order) return;

      const orderIssuedDate = formatIssuedDate(new Date());
      const orderContact = formatPhoneNumber(order.contact);
      const addressParts = order.address ? order.address.split(",") : [];
      const address_line1 = addressParts[0] ? addressParts[0].trim() : "";
      const address_line2 = addressParts[1] ? addressParts[1].trim() : "";
      const address_line3 = addressParts.slice(2).join(",").trim() || "";
      const description = order.notes || "EECO Care Products Pack";

      pagesHtml += `
        <div class="koombiyo-waybill">
          <div class="koombiyo-waybill-inner">
            <!-- LEFT COLUMN -->
            <div class="waybill-left-col">
              <div class="waybill-left-top">
                <img 
                  src="/koombiyo-logo.png" 
                  alt="Koombiyo Logo" 
                  class="waybill-koombiyo-logo"
                />
                <div class="waybill-koombiyo-address">
                  Address: No.25, Epitamulla Road, Kotte. Tel: 011 7 886 786
                </div>
              </div>

              <div class="waybill-left-middle">
                <div style="margin-bottom: 2px; line-height: 1.2;">
                  <span style="font-weight: bold;">From :</span> <strong style="color: #000; font-size: 9.5px;">Eeco Aromatics</strong>
                </div>
                <div style="margin-bottom: 2px; line-height: 1.2;">
                  <span style="font-weight: bold;">Contact Number &nbsp;:</span> <strong style="color: #000;">762051906</strong>
                </div>
                <div style="line-height: 1.2;">
                  <span style="font-weight: bold;">Issued Date &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:</span> <strong style="color: #000;">${orderIssuedDate}</strong>
                </div>
              </div>

              <div class="waybill-left-bottom">
                <div style="line-height: 1.2; margin-bottom: 2px;">
                  <span style="font-weight: bold;">To :</span> <strong style="color: #000; font-size: 11px;">${order.customerName}</strong>
                </div>
                <div style="display: flex; line-height: 1.2; margin-bottom: 2px; align-items: flex-start;">
                  <span style="font-weight: bold; flex-shrink: 0;">Address &nbsp;:</span>
                  <span style="font-weight: bold; color: #000; margin-left: 4px; font-size: 9px; line-height: 1.1;">
                    ${address_line1}${address_line2 ? `, ${address_line2}` : ""}${address_line3 ? `, ${address_line3}` : ""}
                  </span>
                </div>
                <div style="line-height: 1.2; margin-bottom: 2px;">
                  <span style="font-weight: bold;">Phone No :</span> <strong style="color: #000; font-size: 10px;">${orderContact}</strong>
                </div>
                <div style="line-height: 1.2;">
                  <span style="font-weight: bold;">Description :</span> <strong style="color: #000; font-size: 9px;">${description}</strong>
                </div>
              </div>
            </div>

            <!-- RIGHT COLUMN -->
            <div class="waybill-right-col">
              <div class="waybill-right-header">
                <div class="waybill-right-header-text">PROOF OF DELIVERY</div>
              </div>

              <div class="waybill-right-barcode-box"></div>

              <div class="waybill-right-middle">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
                  <span style="font-weight: bold; font-size: 9.5px;">COD AMOUNT :</span>
                  <span style="border: 1.5px solid #1b4f93; padding: 1px 6px; font-family: monospace; font-size: 11.5px; font-weight: bold; border-radius: 4px; color: #000; min-width: 60px; text-align: right; display: inline-block;">
                    ${order.price.toFixed(2)}
                  </span>
                </div>
                <div style="line-height: 1.1; margin-bottom: 1px;">
                  <span style="font-weight: bold;">Order No:</span> <strong style="color: #000; font-family: monospace; font-size: 9px;">${order.orderNumber}</strong>
                </div>
                <div style="line-height: 1.1;">
                  <span style="font-weight: bold;">Weight :</span> <strong style="color: #000; font-size: 9px;">${order.weightGrams ? order.weightGrams + 'g' : ''}</strong>
                </div>
              </div>

              <div class="waybill-right-pod-box">
                <div style="display: flex; line-height: 1.1;">
                  <span style="width: 55px; font-weight: bold;">Name</span>
                  <span style="margin-right: 4px; font-weight: bold;">:</span>
                </div>
                <div style="display: flex; line-height: 1.1;">
                  <span style="width: 55px; font-weight: bold;">Address</span>
                  <span style="margin-right: 4px; font-weight: bold;">:</span>
                </div>
                <div style="display: flex; line-height: 1.1;">
                  <span style="width: 55px; font-weight: bold;">NIC Number</span>
                  <span style="margin-right: 4px; font-weight: bold;">:</span>
                </div>
                <div style="display: flex; line-height: 1.1;">
                  <span style="width: 55px; font-weight: bold;">Date</span>
                  <span style="margin-right: 4px; font-weight: bold;">:</span>
                </div>
                <div style="display: flex; line-height: 1.1;">
                  <span style="width: 55px; font-weight: bold;">Signature</span>
                  <span style="margin-right: 4px; font-weight: bold;">:</span>
                </div>
                <div style="display: flex; line-height: 1.1; align-items: center;">
                  <span style="width: 55px; font-weight: bold;">Deliverd</span>
                  <span style="margin-right: 4px; font-weight: bold;">:</span>
                  <span style="display: inline-flex; align-items: center; margin-right: 5px; margin-left: 2px;">
                    <span style="border: 1px solid #1b4f93; width: 9px; height: 9px; display: inline-block; margin-right: 2px;"></span> Yes
                  </span>
                  <span style="display: inline-flex; align-items: center;">
                    <span style="border: 1px solid #1b4f93; width: 9px; height: 9px; display: inline-block; margin-right: 2px;"></span> No
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    });

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Print Bulk Waybills</title>
            <base href="${window.location.origin}/" />
            <style>
              body {
                margin: 0;
                padding: 0;
                background: #fff;
              }
              .koombiyo-waybill {
                display: flex;
                width: 5.5in;
                height: 3.5in;
                font-family: Arial, Helvetica, sans-serif;
                color: #000;
                padding: 2px;
                box-sizing: border-box;
                background: #fff;
                page-break-after: always;
                break-after: page;
                overflow: hidden;
                border: 1px solid #1b4f93;
                margin: 0 auto;
              }
              .koombiyo-waybill:last-child {
                page-break-after: avoid;
                break-after: avoid;
              }
              .koombiyo-waybill * {
                box-sizing: border-box;
              }
              .koombiyo-waybill-inner {
                border: 2px solid #1b4f93;
                border-radius: 8px;
                width: 100%;
                height: 100%;
                display: flex;
                box-sizing: border-box;
              }
              .waybill-left-col {
                width: 58%;
                height: 100%;
                display: flex;
                flex-direction: column;
                box-sizing: border-box;
              }
              .waybill-right-col {
                width: 42%;
                height: 100%;
                display: flex;
                flex-direction: column;
                box-sizing: border-box;
                border-left: 2px solid #1b4f93;
              }
              .waybill-left-top {
                height: 32%;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 3px;
                box-sizing: border-box;
              }
              .waybill-koombiyo-logo {
                height: 22mm;
                max-height: 90%;
                object-fit: contain;
                display: block;
              }
              .waybill-koombiyo-address {
                font-size: 7.5px;
                font-weight: bold;
                color: #1b4f93;
                margin-top: 1px;
                font-family: Arial, sans-serif;
                text-align: center;
                letter-spacing: -0.1px;
              }
              .waybill-left-middle {
                height: 26%;
                border-top: 2px solid #1b4f93;
                padding: 4px 6px;
                box-sizing: border-box;
                display: flex;
                flex-direction: column;
                justify-content: center;
                font-size: 9px;
                color: #1b4f93;
              }
              .waybill-left-bottom {
                height: 42%;
                border-top: 2px solid #1b4f93;
                padding: 4px 6px;
                box-sizing: border-box;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                font-size: 9.5px;
                color: #1b4f93;
              }
              .waybill-right-header {
                height: 11%;
                display: flex;
                align-items: center;
                justify-content: center;
                border-bottom: 2px solid #1b4f93;
                box-sizing: border-box;
              }
              .waybill-right-header-text {
                font-size: 11.5px;
                font-weight: 900;
                color: #1b4f93;
                font-family: Arial, sans-serif;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }
              .waybill-right-barcode-box {
                height: 28%;
                border: 1.5px solid #1b4f93;
                border-radius: 6px;
                margin: 3px 6px;
                box-sizing: border-box;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 2px;
                overflow: hidden;
                background: #fff;
              }
              .waybill-right-middle {
                height: 24%;
                padding: 2px 6px;
                box-sizing: border-box;
                display: flex;
                flex-direction: column;
                justify-content: center;
                font-size: 9.5px;
                color: #1b4f93;
              }
              .waybill-right-pod-box {
                height: 33%;
                border: 1.5px solid #1b4f93;
                border-radius: 6px;
                margin: 3px 6px;
                box-sizing: border-box;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                padding: 4px 6px;
                font-size: 9px;
                color: #1b4f93;
              }
              @media print {
                body { margin: 0; padding: 0; background: #fff; }
                @page { size: 5.5in 3.5in; margin: 0; }
                .koombiyo-waybill {
                  display: flex !important;
                  width: 5.5in !important;
                  height: 3.5in !important;
                  margin: 0 !important;
                  padding: 2px !important;
                  border: 1px solid #1b4f93 !important;
                  box-sizing: border-box !important;
                  background: #fff !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                  page-break-after: always !important;
                  break-after: page !important;
                }
                .koombiyo-waybill:last-child {
                  page-break-after: avoid !important;
                  break-after: avoid !important;
                }
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
            ${pagesHtml}
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleBulkPrintReceipts = (ids: string[]) => {
    if (ids.length === 0) return;

    // 1. Group IDs into rows (pairs)
    const rows: string[][] = [];
    for (let i = 0; i < ids.length; i += 2) {
      rows.push(ids.slice(i, i + 2));
    }

    // 2. Group rows into pages based on maximum row height
    const pages: string[][][] = []; // list of pages, where each page is a list of rows
    let currentPageRows: string[][] = [];
    let currentPageHeight = 0;
    const MAX_PAGE_HEIGHT = 980; // Safe printable A4 height in pixels

    rows.forEach((row) => {
      const id1 = row[0];
      const id2 = row[1];

      const getOrderCost = (orderId?: string) => {
        if (!orderId) return 0;
        const order = orders.find((o) => o.id === orderId);
        if (!order) return 0;
        const orderItems = generateItemsForOrder(order.price);
        return 68 + orderItems.length * 16;
      };

      const cost1 = getOrderCost(id1);
      const cost2 = getOrderCost(id2);
      const rowCost = Math.max(cost1, cost2);

      const spacing = currentPageRows.length > 0 ? 8 : 0;

      if (currentPageRows.length > 0 && currentPageHeight + rowCost + spacing > MAX_PAGE_HEIGHT) {
        pages.push(currentPageRows);
        currentPageRows = [row];
        currentPageHeight = rowCost;
      } else {
        currentPageRows.push(row);
        currentPageHeight += rowCost + spacing;
      }
    });

    if (currentPageRows.length > 0) {
      pages.push(currentPageRows);
    }

    let pagesHtml = "";
    pages.forEach((pageRows) => {
      let pageHtml = "";
      pageRows.forEach((row) => {
        row.forEach((id) => {
          const order = orders.find((o) => o.id === id);
          if (!order) return;

          const orderIssuedDate = formatIssuedDate(new Date());
          const orderItems = generateItemsForOrder(order.price);

          const itemsHtml = orderItems.map((item, idx) => `
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dotted #e2e8f0; padding: 2px 0;">
              <div style="display: flex; align-items: center; gap: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 76%;">
                <span style="font-weight: bold; color: #64748b; min-width: 12px; display: inline-block;">${idx + 1}.</span>
                <span style="font-weight: 700; color: #1e293b;">${item.name}</span>
                <span style="font-size: 8px; color: #64748b; font-family: monospace;">(${item.sku})</span>
              </div>
              <div style="display: flex; align-items: center; gap: 6px; shrink-0;">
                <span style="background: #f1f5f9; color: #1e293b; padding: 0.5px 4px; border-radius: 4px; font-weight: 800; font-size: 9.5px;">x${item.qty}</span>
                <span style="font-weight: 700; font-family: monospace; min-width: 50px; text-align: right;">Rs. ${(item.price * item.qty).toLocaleString()}</span>
              </div>
            </div>
          `).join("");

          pageHtml += `
            <div class="receipt-container">
              <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1.5px dashed #cbd5e1; padding-bottom: 3px; margin-bottom: 4px;">
                <span style="font-size: 13px; font-weight: 800; color: #4f46e5; font-family: 'Courier New', Courier, monospace; letter-spacing: 0.2px;">
                  ${order.orderNumber}
                </span>
                <span style="font-size: 12px; font-weight: 800; color: #10b981; font-family: monospace;">
                  Rs. ${order.price.toLocaleString()}
                </span>
              </div>

              <div style="display: flex; justify-content: space-between; font-size: 9.5px; line-height: 1.2; margin-bottom: 4px; color: #334155;">
                <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 60%;"><strong>Cust:</strong> ${order.customerName}</span>
                <span style="color: #64748b; font-size: 8.5px;">${orderIssuedDate}</span>
              </div>

              <div style="font-size: 9px; line-height: 1.2; margin-bottom: 2px;">
                ${itemsHtml}
              </div>

              <div style="text-align: center; border-top: 1px dotted #e2e8f0; padding-top: 2px; font-size: 8px; color: #94a3b8; font-weight: bold; letter-spacing: 0.5px; text-transform: uppercase;">
                EECO Care Packing Slip
              </div>
            </div>
          `;
        });
      });

      pagesHtml += `
        <div class="receipt-page">
          ${pageHtml}
        </div>
      `;
    });

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Print Bulk Receipts</title>
            <style>
              body {
                margin: 0;
                padding: 10px;
                background: #f8fafc;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              }
              .receipt-page {
                display: grid;
                grid-template-columns: 1fr 1fr;
                column-gap: 12px;
                row-gap: 8px;
                page-break-after: always;
                break-after: page;
                box-sizing: border-box;
                padding: 10px;
                width: 100%;
                max-width: 790px;
                margin: 0 auto;
              }
              .receipt-page:last-child {
                page-break-after: avoid;
                break-after: avoid;
              }
              .receipt-container {
                display: block;
                width: 100%;
                background: #fff;
                border: 1.5px solid #cbd5e1;
                border-radius: 8px;
                padding: 6px 12px;
                box-sizing: border-box;
                margin: 0;
              }
              @media print {
                body { margin: 0; padding: 0; background: #fff; }
                @page { size: auto; margin: 0mm; }
                .receipt-page {
                  display: grid !important;
                  grid-template-columns: 1fr 1fr !important;
                  column-gap: 12px !important;
                  row-gap: 8px !important;
                  padding: 4mm 0 !important;
                  width: 100% !important;
                  max-width: 100% !important;
                }
                .receipt-container {
                  display: block !important;
                  border: 1.5px solid #cbd5e1 !important;
                  box-shadow: none !important;
                  background: #fff !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                  padding: 6px 12px !important;
                  margin: 0 !important;
                }
              }
            </style>
            <script>
              window.onload = function() {
                window.print();
                window.close();
              }
            </script>
          </head>
          <body>
            ${pagesHtml}
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  // Computed values for selector modal listing
  const availablePendingOrders = useMemo(() => {
    return orders.filter(
      (o) => o.packingStatus === "Ordered" && !activeQueueIds.includes(o.id)
    );
  }, [orders, activeQueueIds]);

  const filteredModalOrders = useMemo(() => {
    return availablePendingOrders.filter((o) => {
      const query = modalSearchQuery.toLowerCase().trim();
      if (!query) return true;
      return (
        o.orderNumber.toLowerCase().includes(query) ||
        o.customerName.toLowerCase().includes(query) ||
        o.waybillNumber.toLowerCase().includes(query) ||
        o.district.toLowerCase().includes(query)
      );
    });
  }, [availablePendingOrders, modalSearchQuery]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (!activeQueueIds.includes(o.id)) return false;

      const matchesSearch =
        o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.waybillNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.district.toLowerCase().includes(searchQuery.toLowerCase());

      if (filterTab === "all") return matchesSearch;
      return o.packingStatus === filterTab && matchesSearch;
    });
  }, [orders, searchQuery, filterTab, activeQueueIds]);

  const stats = useMemo(() => {
    const unpacked = orders.filter((o) => o.packingStatus === "Ordered" && activeQueueIds.includes(o.id)).length;
    const packed = orders.filter((o) => o.packingStatus === "Packed" && activeQueueIds.includes(o.id)).length;
    const dispatched = orders.filter((o) => o.packingStatus === "Dispatched" && activeQueueIds.includes(o.id)).length;
    const accuracy = 99.8;
    return { unpacked, packed, dispatched, accuracy };
  }, [orders, activeQueueIds]);

  const tabConfig = [
    { value: "Ordered", label: "Ordered", count: stats.unpacked, dot: "bg-violet-500" },
    { value: "Packed", label: "Packed", count: stats.packed, dot: "bg-emerald-500" },
    { value: "Dispatched", label: "Dispatched", count: stats.dispatched, dot: "bg-blue-500" },
    { value: "all", label: "All", count: activeQueueIds.length, dot: dark ? "bg-slate-400" : "bg-slate-500" },
  ];

  const handleAddSelectedOrders = () => {
    if (selectedModalOrderIds.length === 0) return;
    setActiveQueueIds((prev) => {
      const next = [...prev];
      selectedModalOrderIds.forEach((id) => {
        if (!next.includes(id)) {
          next.push(id);
        }
      });
      return next;
    });

    if (!selectedOrderId && selectedModalOrderIds.length > 0) {
      setSelectedOrderId(selectedModalOrderIds[0]);
    }

    playBeepSound("success");
    setSelectedModalOrderIds([]);
    setIsAddModalOpen(false);
  };

  // Helper: toggle all unpacked in queue
  const toggleSelectAllUnpacked = () => {
    const unpackedFilteredIds = filteredOrders
      .filter((o) => o.packingStatus === "Ordered")
      .map((o) => o.id);
    const isAllSelected = unpackedFilteredIds.every((id) => selectedQueueOrderIds.includes(id));
    if (isAllSelected) {
      setSelectedQueueOrderIds((prev) => prev.filter((id) => !unpackedFilteredIds.includes(id)));
    } else {
      setSelectedQueueOrderIds((prev) => {
        const next = [...prev];
        unpackedFilteredIds.forEach((id) => {
          if (!next.includes(id)) next.push(id);
        });
        return next;
      });
    }
  };

  const allUnpackedSelected =
    filteredOrders.filter((o) => o.packingStatus === "Ordered").length > 0 &&
    filteredOrders.filter((o) => o.packingStatus === "Ordered").every((o) => selectedQueueOrderIds.includes(o.id));

  /* ═══════════════════════════════════════════════════════════
     JSX RENDER
     ═══════════════════════════════════════════════════════════ */
  return (
    <AppShell
      title="Packing Workstation"
      description={`${stats.unpacked} unpacked • ${stats.packed} packed • ${stats.dispatched} dispatched — ${stats.accuracy}% accuracy`}
      variant="gradient"
      customIcon={<Package className="h-5 w-5 text-white" />}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scan-pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(148,163,184,0.15); border-radius: 9999px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(148,163,184,0.3); }
      ` }} />

      <div className="space-y-6">

        {/* ─── Modern Stat Box Row ─── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatBox title="Unpacked" value={stats.unpacked} suffix="orders" icon={PackageOpen} color="violet" />
          <StatBox title="Packed" value={stats.packed} suffix="orders" icon={PackageCheck} color="emerald" />
          <StatBox title="Dispatched" value={stats.dispatched} suffix="orders" icon={Truck} color="blue" />
          <StatBox title="Accuracy" value={stats.accuracy} suffix="%" icon={Scale} color="fuchsia" />
        </div>

        {/* ═══════════════════════════════════════════════════════
            MAIN 2-COLUMN WORKSPACE
           ═══════════════════════════════════════════════════════ */}
        <div className="flex flex-col lg:flex-row gap-4 items-stretch min-h-[600px]">

          {/* ─── COLUMN 1: PACKING QUEUE ─── */}
          <div className="w-full lg:w-[380px] shrink-0 flex flex-col gap-4">
            <div className={cn(
              "flex flex-col h-full rounded-[2rem] border p-5 transition-all duration-300 shadow-sm", 
              dark ? "bg-[#11111a] border-white/5" : "bg-white border-slate-200/60"
            )}>
              
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <h2 className={cn("font-black text-lg tracking-tight", dark ? "text-white" : "text-slate-900")}>Queue</h2>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
                  </span>
                </div>
                <button 
                  onClick={() => {
                    setModalSearchQuery("");
                    setSelectedModalOrderIds([]);
                    setIsAddModalOpen(true);
                  }} 
                  className={cn(
                    "flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm",
                    dark ? "bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30" : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                  )}
                >
                  <Plus className="h-4 w-4" /> Add
                </button>
              </div>

              {/* Animated Segmented Tabs */}
              <div className={cn(
                "relative flex p-1 rounded-2xl mb-4", 
                dark ? "bg-[#0a0a0a]" : "bg-slate-100/80"
              )}>
                {tabConfig.map(tab => (
                  <button
                    key={tab.value}
                    onClick={() => setFilterTab(tab.value as any)}
                    className={cn(
                      "relative flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold z-10 transition-colors active:scale-95",
                      filterTab === tab.value 
                        ? (dark ? "text-white" : "text-slate-900") 
                        : (dark ? "text-slate-500 hover:text-slate-300" : "text-slate-500 hover:text-slate-700")
                    )}
                  >
                    {filterTab === tab.value && (
                      <motion.div
                        layoutId="activeTab"
                        className={cn("absolute inset-0 rounded-xl shadow-sm z-[-1]", dark ? "bg-[#1a1a24] border border-white/5" : "bg-white")}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", filterTab === tab.value ? tab.dot : dark ? "bg-slate-800" : "bg-slate-300")} />
                    {tab.value === "Ordered" ? "To Pack" : tab.value === "all" ? "All" : tab.label}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all mb-4 focus-within:ring-2 focus-within:ring-indigo-500/20", 
                dark ? "bg-[#0a0a0a] border-white/5 focus-within:border-indigo-500/50" : "bg-slate-50 border-slate-200/60 focus-within:border-indigo-400"
              )}>
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none outline-none w-full text-sm font-medium placeholder:text-slate-400 text-slate-900 dark:text-slate-200"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="text-slate-400 hover:text-slate-300 transition">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Bulk Action Bar */}
              <AnimatePresence>
                {selectedQueueOrderIds.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className={cn(
                      "rounded-3xl border p-3 flex flex-col gap-2.5 overflow-hidden shadow-xl mb-4 transition-all duration-300",
                      dark
                        ? "bg-indigo-500/10 border-indigo-500/25"
                        : "bg-indigo-50 border-indigo-200 shadow-indigo-100"
                    )}
                  >
                    <div className="flex items-center justify-between px-1">
                      <span className={cn("text-xs font-black uppercase tracking-widest", dark ? "text-indigo-300" : "text-indigo-700")}>
                        {selectedQueueOrderIds.length} Selected
                      </span>
                      <button
                        onClick={() => setSelectedQueueOrderIds([])}
                        className={cn("text-[10px] font-bold uppercase tracking-wider transition hover:underline",
                          dark ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-700"
                        )}
                      >
                        Clear
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Bulk Verify & Pack */}
                      {selectedQueueOrderIds.some((id) => orders.find((o) => o.id === id)?.packingStatus === "Ordered") && (
                        <button
                          onClick={handleBulkCompletePacking}
                          className="flex-1 min-w-[70px] flex h-8 items-center justify-center gap-1 rounded-xl px-2.5 text-[10px] font-bold tracking-wider uppercase transition active:scale-95 shadow-lg bg-emerald-500 hover:bg-emerald-400 text-white shadow-emerald-500/20"
                          title="Bulk verify & complete packing"
                        >
                          <PackageCheck className="h-3.5 w-3.5" /> Pack
                        </button>
                      )}
                      {/* Bulk Dispatch */}
                      {selectedQueueOrderIds.some((id) => orders.find((o) => o.id === id)?.packingStatus === "Packed") && (
                        <button
                          onClick={handleBulkDispatch}
                          className="flex-1 min-w-[70px] flex h-8 items-center justify-center gap-1 rounded-xl px-2.5 text-[10px] font-bold tracking-wider uppercase transition active:scale-95 shadow-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20"
                          title="Bulk dispatch"
                        >
                          <Truck className="h-3.5 w-3.5" /> Dispatch
                        </button>
                      )}
                      <button
                        onClick={() => handleBulkPrintWaybills(selectedQueueOrderIds)}
                        className={cn("flex-1 min-w-[70px] flex h-8 items-center justify-center gap-1 rounded-xl px-2.5 text-[10px] font-bold tracking-wider uppercase transition active:scale-95 shadow-sm",
                          dark ? "bg-white/10 text-white hover:bg-white/20 border border-white/5" : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
                        )}
                        title="Print Waybills"
                      >
                        <Printer className="h-3.5 w-3.5 text-blue-500" /> Waybill
                      </button>
                      <button
                        onClick={() => handleBulkPrintReceipts(selectedQueueOrderIds)}
                        className={cn("flex-1 min-w-[70px] flex h-8 items-center justify-center gap-1 rounded-xl px-2.5 text-[10px] font-bold tracking-wider uppercase transition active:scale-95 shadow-sm",
                          dark ? "bg-white/10 text-white hover:bg-white/20 border border-white/5" : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
                        )}
                        title="Print Receipts"
                      >
                        <FileText className="h-3.5 w-3.5 text-indigo-500" /> Receipt
                      </button>
                      <button
                        onClick={() => {
                          setActiveQueueIds((prev) => prev.filter((id) => !selectedQueueOrderIds.includes(id)));
                          if (selectedOrderId && selectedQueueOrderIds.includes(selectedOrderId)) {
                            setSelectedOrderId(null);
                          }
                          setSelectedQueueOrderIds([]);
                          playBeepSound("error");
                        }}
                        className={cn("flex h-8 w-8 items-center justify-center rounded-xl transition active:scale-90 shrink-0",
                          dark ? "text-rose-400 hover:bg-rose-500/10 hover:text-rose-300" : "text-rose-500 hover:bg-rose-50 hover:text-rose-600 border border-slate-200 bg-white"
                        )}
                        title="Remove selected"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Select All Row */}
              {filteredOrders.length > 0 && (
                <div className={cn(
                  "flex items-center justify-between gap-2 rounded-2xl border px-4 py-2.5 mb-3 shadow-inner transition-all",
                  dark ? "border-white/5 bg-[#0a0a0a]" : "border-slate-200/60 bg-slate-50"
                )}>
                  <button
                    onClick={() => {
                      const allIds = filteredOrders.map((o) => o.id);
                      const isAll = allIds.every((id) => selectedQueueOrderIds.includes(id));
                      if (isAll) {
                        setSelectedQueueOrderIds((prev) => prev.filter((id) => !allIds.includes(id)));
                      } else {
                        setSelectedQueueOrderIds((prev) => {
                          const next = [...prev];
                          allIds.forEach((id) => { if (!next.includes(id)) next.push(id); });
                          return next;
                        });
                      }
                    }}
                    className={cn(
                      "flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider transition-all active:scale-[0.98]",
                      dark ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    <div className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-lg border transition duration-200",
                      filteredOrders.every((o) => selectedQueueOrderIds.includes(o.id))
                        ? "bg-indigo-600 border-indigo-600 text-white"
                        : dark ? "border-white/15 bg-slate-800" : "border-slate-300 bg-white"
                    )}>
                      {filteredOrders.every((o) => selectedQueueOrderIds.includes(o.id)) && <Check className="h-3 w-3 stroke-[3.5] text-white" />}
                    </div>
                    Select all ({filteredOrders.length})
                  </button>
                  <span className={cn("text-[10px] font-bold uppercase tracking-widest opacity-60", dark ? "text-slate-500" : "text-slate-400")}>
                    {filteredOrders.filter(o => o.packingStatus === "Ordered").length} to pack
                  </span>
                </div>
              )}

              {/* Order List */}
              <div className="flex-1 overflow-y-auto max-h-[500px] pr-2 space-y-2.5 custom-scrollbar">
                <AnimatePresence mode="popLayout">
                  {filteredOrders.length === 0 ? (
                    <motion.div 
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="p-10 text-center text-sm font-medium text-slate-500"
                    >
                      No orders found in queue.
                    </motion.div>
                  ) : (
                    filteredOrders.map(order => {
                      const isActive = order.id === selectedOrderId;
                      const isChecked = selectedQueueOrderIds.includes(order.id);
                      return (
                        <motion.div
                          layout
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          whileHover={{ scale: isActive ? 1 : 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          key={order.id}
                          onClick={() => setSelectedOrderId(order.id)}
                          className={cn(
                            "group cursor-pointer rounded-2xl border p-4 transition-all duration-300 relative overflow-hidden flex items-center gap-3",
                            isActive 
                              ? (dark ? "bg-indigo-500/10 border-indigo-500/50 shadow-md shadow-indigo-500/5" : "bg-indigo-50 border-indigo-300 shadow-md shadow-indigo-100")
                              : (dark ? "bg-[#0a0a0a] border-white/5 hover:border-white/10" : "bg-white border-slate-200/60 hover:border-slate-300 hover:shadow-sm")
                          )}
                        >
                          {isActive && dark && <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl" />}
                          
                          {/* Card Selection Checkbox */}
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedQueueOrderIds((prev) =>
                                prev.includes(order.id)
                                  ? prev.filter((id) => id !== order.id)
                                  : [...prev, order.id]
                              );
                            }}
                            className={cn(
                              "flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-lg border transition active:scale-75 cursor-pointer relative z-20",
                              isChecked
                                ? "bg-indigo-600 border-indigo-600 text-white"
                                : dark ? "border-white/15 bg-slate-800 hover:border-white/25" : "border-slate-300 bg-white hover:border-slate-400"
                            )}
                          >
                            {isChecked && <Check className="h-3 w-3 stroke-[3] text-white" />}
                          </div>

                          <div className="flex-1 min-w-0 relative z-10 flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-1.5">
                                <p className={cn("font-bold text-sm tracking-tight truncate max-w-[140px]", dark ? "text-white" : "text-slate-900")}>{order.customerName}</p>
                                <span className={cn(
                                  "w-2 h-2 rounded-full shadow-sm shrink-0",
                                  order.packingStatus === "Ordered" ? "bg-amber-400 shadow-amber-400/50" :
                                  order.packingStatus === "Packed" ? "bg-emerald-400 shadow-emerald-400/50" :
                                  "bg-blue-400 shadow-blue-400/50"
                                )} />
                              </div>
                              <p className={cn("text-xs font-mono font-medium opacity-60", dark ? "text-slate-400" : "text-slate-500")}>
                                {order.orderNumber}
                              </p>
                            </div>
                            <div className="text-right shrink-0 flex items-center gap-3">
                              <div>
                                <p className={cn("text-xs font-black font-mono tracking-tight", dark ? "text-indigo-400" : "text-indigo-600")}>
                                  Rs. {order.price.toLocaleString()}
                                </p>
                                <p className={cn("text-[9px] font-bold opacity-50 mt-0.5", dark ? "text-slate-500" : "text-slate-400")}>
                                  {order.city}
                                </p>
                              </div>
                              <ChevronRight className={cn(
                                "h-5 w-5 transition-transform", 
                                isActive ? "text-indigo-500" : "text-slate-300 dark:text-slate-700 group-hover:translate-x-1 group-hover:text-slate-400"
                              )} />
                            </div>
                          </div>
                        </motion.div>
                      )
                    })
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* ─── COLUMN 2: STATION ACTIVE WORKSPACE ─── */}
          <div className="flex-1 flex flex-col min-w-0">
            <AnimatePresence mode="wait">
              {!selectedOrder ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, filter: "blur(10px)" }}
                  animate={{ opacity: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, filter: "blur(10px)" }}
                  className={cn(
                    "flex-1 rounded-[2rem] border flex flex-col items-center justify-center p-12 text-center min-h-[500px]", 
                    dark ? "bg-[#11111a] border-white/5" : "bg-white border-slate-200/60 shadow-sm"
                  )}
                >
                  <div className={cn(
                    "h-24 w-24 rounded-[2rem] mb-6 flex items-center justify-center rotate-3 shadow-xl", 
                    dark ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" : "bg-indigo-50 text-indigo-500 border border-indigo-100"
                  )}>
                    <LayoutGrid className="h-10 w-10" />
                  </div>
                  <h3 className={cn("text-2xl font-black tracking-tight mb-2", dark ? "text-white" : "text-slate-900")}>Ready to Pack</h3>
                  <p className={cn("text-sm font-medium max-w-sm", dark ? "text-slate-400" : "text-slate-500")}>Select an order from the queue to start verification and printing.</p>
                </motion.div>
              ) : (
                <motion.div
                  key={selectedOrder.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={cn(
                    "flex-1 flex flex-col rounded-[2rem] border overflow-hidden shadow-xl", 
                    dark ? "bg-[#11111a] border-white/5 shadow-black/50" : "bg-white border-slate-200/60 shadow-slate-200/50"
                  )}
                >
                  {/* Workspace Header - Sleek */}
                  <div className={cn("px-8 py-6 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4", dark ? "border-white/5 bg-[#161622]" : "border-slate-100 bg-slate-50/50")}>
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className={cn("text-2xl font-black font-mono tracking-tighter", dark ? "text-white" : "text-slate-900")}>{selectedOrder.orderNumber}</h2>
                        <span className={cn(
                          "text-xs font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider ring-1", 
                          selectedOrder.packingStatus === "Ordered" ? "bg-amber-500/20 text-amber-500 ring-amber-500/30" :
                          selectedOrder.packingStatus === "Packed" ? "bg-emerald-500/20 text-emerald-500 ring-emerald-500/30" :
                          "bg-blue-500/20 text-blue-500 ring-blue-500/30"
                        )}>
                          {selectedOrder.packingStatus}
                        </span>
                      </div>
                      <p className={cn("text-sm font-semibold flex items-center gap-2", dark ? "text-slate-400" : "text-slate-500")}>
                        <User className="h-4 w-4 opacity-70" /> {selectedOrder.customerName}
                        <span className="opacity-30 mx-1">•</span>
                        <MapPin className="h-4 w-4 opacity-70" /> {selectedOrder.city}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 p-1 rounded-2xl">
                      <button 
                        onClick={() => handlePrintReceipt(selectedOrder)}
                        className={cn(
                          "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95 shadow-sm", 
                          dark ? "bg-[#222230] text-white hover:bg-[#2a2a3a]" : "bg-white text-slate-800 hover:bg-slate-50"
                        )}
                      >
                        <FileText className="h-4 w-4 text-indigo-500" /> Receipt
                      </button>
                      <button onClick={() => setShowWaybillModal(true)} className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95 shadow-sm", 
                        dark ? "bg-[#222230] text-white hover:bg-[#2a2a3a]" : "bg-white text-slate-800 hover:bg-slate-50"
                      )}>
                        <Printer className="h-4 w-4 text-blue-500" /> Waybill
                      </button>
                      <div className={cn("w-px h-6 mx-1", dark ? "bg-white/10" : "bg-slate-300")} />
                      <button onClick={() => setSelectedOrderId(null)} className={cn(
                        "p-2 rounded-xl transition-all hover:bg-red-500 hover:text-white hover:scale-105", 
                        dark ? "text-slate-400" : "text-slate-500"
                      )}>
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Body Split */}
                  <div className="flex flex-col xl:flex-row flex-1 overflow-hidden relative">
                    
                    {/* LEFT: Checklist Area */}
                    <div className="flex-1 p-8 overflow-y-auto relative z-10 custom-scrollbar">
                      
                      {/* Progress */}
                      <div className="flex items-end justify-between mb-3">
                        <div>
                          <h3 className={cn("text-xs font-bold uppercase tracking-wider", dark ? "text-slate-400" : "text-slate-500")}>Verification Progress</h3>
                          <p className={cn("text-2xl font-black tracking-tight", allItemsPacked ? "text-emerald-500" : "text-indigo-500")}>
                            {Math.round(packingProgress)}%
                          </p>
                        </div>
                        <span className={cn("text-sm font-bold px-3 py-1 rounded-lg", dark ? "bg-white/5 text-white" : "bg-slate-100 text-slate-800")}>
                          {packedCount} / {selectedOrderItems.length} items
                        </span>
                      </div>

                      <div className={cn("h-3 w-full rounded-full mb-8 overflow-hidden relative shadow-inner border", dark ? "bg-[#0a0a0a] border-white/5" : "bg-slate-100 border-slate-200/50")}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${packingProgress}%` }}
                          className={cn(
                            "h-full rounded-full transition-all duration-500 relative", 
                            allItemsPacked ? "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]" : "bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                          )}
                        >
                           <div className="absolute inset-0 bg-white/25 animate-pulse animate-duration-1000" />
                        </motion.div>
                      </div>

                      <AnimatePresence>
                        {scanStatus.message && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                            animate={{ opacity: 1, height: "auto", marginBottom: 24 }}
                            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                            className={cn(
                              "px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-3 border overflow-hidden", 
                              scanStatus.type === "success" 
                                ? (dark ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-emerald-50 border-emerald-200 text-emerald-700") 
                                : (dark ? "bg-rose-500/10 border-rose-500/20 text-rose-400" : "bg-rose-50 border-rose-200 text-rose-700")
                            )}
                          >
                            {scanStatus.type === "success" ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <AlertCircle className="h-5 w-5 shrink-0" />}
                            {scanStatus.message}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="space-y-3">
                        <AnimatePresence>
                          {selectedOrderItems.map((item, index) => {
                            const isPacked = checklistState[item.sku];
                            return (
                              <motion.div
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                key={item.sku}
                                className={cn(
                                  "flex items-center gap-5 p-4 rounded-2xl border transition-all select-none cursor-default group hover:scale-[1.005]",
                                  isPacked 
                                    ? (dark ? "bg-emerald-950/30 border-emerald-500/30" : "bg-emerald-50/80 border-emerald-300 shadow-sm") 
                                    : (dark ? "bg-[#161622] border-white/5 hover:border-white/10" : "bg-white border-slate-200 hover:border-slate-300 shadow-sm")
                                )}
                              >
                                {/* Custom Checkbox */}
                                <div className={cn(
                                  "h-8 w-8 rounded-xl border-2 flex items-center justify-center shrink-0 transition-all duration-300",
                                  isPacked 
                                    ? "bg-emerald-500 border-emerald-500 shadow-lg shadow-emerald-500/30 rotate-0 scale-100" 
                                    : (dark ? "border-slate-600 group-hover:border-indigo-500 bg-transparent rotate-[-10deg] scale-95" : "border-slate-300 group-hover:border-indigo-400 bg-slate-50 rotate-[-10deg] scale-95")
                                )}>
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: isPacked ? 1 : 0 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                  >
                                    <Check className="h-5 w-5 text-white stroke-[3]" />
                                  </motion.div>
                                </div>

                                <div className="text-3xl shrink-0 filter drop-shadow-sm">{item.image || "📦"}</div>

                                <div className="flex-1 min-w-0">
                                  <p className={cn("text-sm font-bold truncate transition-all duration-300", 
                                    isPacked ? "opacity-50 line-through decoration-2" : (dark ? "text-white" : "text-slate-900")
                                  )}>
                                    {item.name}
                                  </p>
                                  <div className={cn("flex items-center gap-3 mt-1.5 text-xs font-semibold", isPacked && "opacity-50")}>
                                    <span className={cn("font-mono px-2 py-0.5 rounded-md", dark ? "bg-black/40 text-slate-400" : "bg-slate-100 text-slate-500")}>{item.sku}</span>
                                    <span className={cn("font-mono px-2 py-0.5 rounded-md", dark ? "bg-black/40 text-slate-400" : "bg-slate-100 text-slate-500")}>{item.barcode}</span>
                                    <span className={cn("px-2 py-0.5 rounded-md", dark ? "bg-white/10 text-white" : "bg-slate-800 text-white")}>x{item.qty}</span>
                                  </div>
                                </div>

                                {/* Item Total Price */}
                                <span className={cn("text-xs font-bold font-mono shrink-0", isPacked ? "opacity-40" : dark ? "text-white" : "text-slate-800")}>
                                  Rs. {(item.price * item.qty).toLocaleString()}
                                </span>
                              </motion.div>
                            );
                          })}
                        </AnimatePresence>
                      </div>

                    </div>

                    {/* RIGHT: Specs & Fulfillment Column */}
                    <div className={cn(
                      "w-full xl:w-[340px] border-t xl:border-t-0 xl:border-l p-8 flex flex-col gap-8 relative z-10 custom-scrollbar overflow-y-auto", 
                      dark ? "border-white/5 bg-black/20" : "border-slate-200/60 bg-slate-50/50"
                    )}>
                      
                      <div className="space-y-4">
                        <h3 className={cn("text-xs font-black uppercase tracking-widest", dark ? "text-slate-500" : "text-slate-400")}>Fulfillment Details</h3>
                        <div className="space-y-3">
                          <div className={cn("p-4 rounded-2xl border flex items-center gap-4 transition-all hover:scale-[1.02]", dark ? "bg-[#161622] border-white/5" : "bg-white border-slate-200 shadow-sm")}>
                            <div className={cn("p-2.5 rounded-xl shrink-0", dark ? "bg-blue-500/10 text-blue-400" : "bg-blue-50 text-blue-600")}><Truck className="h-5 w-5" /></div>
                            <div className="min-w-0">
                              <p className={cn("text-[10px] font-bold uppercase tracking-wider mb-0.5", dark ? "text-slate-500" : "text-slate-400")}>Courier</p>
                              <p className={cn("text-sm font-black truncate", dark ? "text-white" : "text-slate-800")}>{selectedOrder.courier} ({selectedOrder.courierBranch})</p>
                            </div>
                          </div>
                          <div className={cn("p-4 rounded-2xl border flex items-center gap-4 transition-all hover:scale-[1.02]", dark ? "bg-[#161622] border-white/5" : "bg-white border-slate-200 shadow-sm")}>
                            <div className={cn("p-2.5 rounded-xl shrink-0", dark ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-50 text-emerald-600")}><CreditCard className="h-5 w-5" /></div>
                            <div className="min-w-0">
                              <p className={cn("text-[10px] font-bold uppercase tracking-wider mb-0.5", dark ? "text-slate-500" : "text-slate-400")}>Collect (COD) / Payment</p>
                              <p className={cn("text-lg font-black font-mono tracking-tight text-emerald-500")}>Rs. {selectedOrder.price.toLocaleString()}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className={cn("text-xs font-black uppercase tracking-widest", dark ? "text-slate-500" : "text-slate-400")}>Package Specs</h3>
                        <div className="space-y-4">
                          <div>
                            <label className={cn("text-[10px] font-bold uppercase tracking-wider mb-2 block", dark ? "text-slate-400" : "text-slate-500")}>Waybill Number</label>
                            <input 
                              type="text" 
                              value={selectedOrder.waybillNumber || ""}
                              onChange={(e) => setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, waybillNumber: e.target.value } : o))}
                              placeholder="Auto-generated or type..."
                              className={cn(
                                "w-full px-4 py-3 rounded-xl border text-sm font-mono font-bold outline-none transition-all focus:ring-2 focus:ring-indigo-500/20", 
                                dark ? "bg-[#0a0a0a] border-white/10 text-white focus:border-indigo-500" : "bg-white border-slate-300 text-slate-900 shadow-inner focus:border-indigo-400"
                              )} 
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className={cn("text-[10px] font-bold uppercase tracking-wider mb-2 block", dark ? "text-slate-400" : "text-slate-500")}>Weight (g)</label>
                              <input 
                                type="number" 
                                value={selectedOrder.weightGrams}
                                onChange={(e) => setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, weightGrams: Math.max(1, Number(e.target.value)) } : o))}
                                className={cn(
                                  "w-full px-4 py-3 rounded-xl border text-sm font-mono font-bold outline-none transition-all", 
                                  dark ? "bg-[#0a0a0a] border-white/10 text-white focus:border-indigo-500" : "bg-white border-slate-300 text-slate-900 shadow-inner focus:border-indigo-400"
                                )} 
                              />
                            </div>
                            <div>
                              <label className={cn("text-[10px] font-bold uppercase tracking-wider mb-2 block", dark ? "text-slate-400" : "text-slate-500")}>Box Size</label>
                              <select
                                value={selectedOrder.boxSize}
                                onChange={(e) => setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, boxSize: e.target.value } : o))}
                                className={cn(
                                  "w-full px-4 py-3 rounded-xl border text-sm font-bold outline-none transition-all appearance-none cursor-pointer", 
                                  dark ? "bg-[#0a0a0a] border-white/10 text-white focus:border-indigo-500" : "bg-white border-slate-300 text-slate-900 shadow-inner focus:border-indigo-400"
                                )}
                              >
                                <option>Small</option>
                                <option>Medium</option>
                                <option>Large</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Primary Actions */}
                      <div className="mt-auto pt-6 border-t dark:border-white/5 border-slate-200/60 space-y-3">
                        {selectedOrder.packingStatus === "Ordered" ? (
                          <>
                            <motion.button
                              whileHover={{ scale: allItemsPacked && !isPackingCompleted ? 1.02 : 1 }}
                              whileTap={{ scale: allItemsPacked && !isPackingCompleted ? 0.98 : 1 }}
                              disabled={!allItemsPacked || isPackingCompleted}
                              onClick={handleCompletePacking}
                              className={cn(
                                "w-full py-4 rounded-2xl text-sm font-black uppercase tracking-widest text-white flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl relative overflow-hidden",
                                allItemsPacked ? "bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/20" : "bg-slate-500 dark:bg-slate-700 shadow-none"
                              )}
                            >
                              {allItemsPacked && <div className="absolute inset-0 bg-white/20 translate-x-[-100%] animate-[shimmer_2s_infinite] skew-x-12" />}
                              {isPackingCompleted ? <RotateCcw className="h-5 w-5 animate-spin" /> : <PackageCheck className="h-5 w-5" />}
                              {isPackingCompleted ? "Finalizing..." : allItemsPacked ? "Complete Packing" : "Finish Checklist First"}
                            </motion.button>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveQueueIds((prev) => prev.filter((id) => id !== selectedOrder.id));
                                setSelectedOrderId(null);
                                playBeepSound("error");
                              }}
                              className={cn(
                                "w-full rounded-2xl py-2.5 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition active:scale-[0.98]",
                                dark ? "text-rose-400 hover:bg-rose-500/10" : "text-rose-500 hover:bg-rose-50"
                              )}
                            >
                              <X className="h-3 w-3" /> Remove from Queue
                            </button>
                          </>
                        ) : selectedOrder.packingStatus === "Packed" ? (
                          <div className="flex gap-2">
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={handleCourierDispatch}
                              className="flex-1 py-4 rounded-2xl text-sm font-black uppercase tracking-widest text-white bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-3 transition-all"
                            >
                              <Truck className="h-5 w-5" /> Dispatch Package
                            </motion.button>
                            <button
                              type="button"
                              onClick={() => {
                                setOrders(prev => prev.map(o => o.id === selectedOrderId ? { ...o, packingStatus: "Ordered" } : o));
                              }}
                              className={cn(
                                "px-4 rounded-2xl border transition active:scale-90 flex items-center justify-center shadow-sm",
                                dark ? "border-white/10 text-slate-400 hover:bg-slate-850" : "border-slate-200 text-slate-500 hover:bg-slate-50"
                              )}
                              title="Reset to Ordered"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div className={cn("p-4 rounded-2xl border flex items-center justify-center gap-2 font-black text-sm uppercase tracking-widest", dark ? "bg-blue-500/10 border-blue-500/20 text-blue-400" : "bg-blue-50 border-blue-200 text-blue-600")}>
                            <CheckCircle2 className="h-5 w-5" /> Dispatched
                          </div>
                        )}
                        
                      </div>

                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

            {/* ═══════════════════════════════════════════════════════
          WAYBILL PREVIEW MODAL
         ═══════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showWaybillModal && selectedOrder && (() => {
          const addressParts = selectedOrder.address ? selectedOrder.address.split(",") : [];
          const address_line1 = addressParts[0] ? addressParts[0].trim() : "";
          const address_line2 = addressParts[1] ? addressParts[1].trim() : "";
          const address_line3 = addressParts.slice(2).join(",").trim() || "";
          const description = selectedOrder.notes || "EECO Care Products Pack";

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowWaybillModal(false)}>
              <div className={cn("relative w-full max-w-xl rounded-2xl border p-6 shadow-2xl overflow-hidden", dark ? "bg-slate-950 border-white/10" : "bg-white border-slate-200")} onClick={(e) => e.stopPropagation()}>
                <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-violet-500 to-blue-500" />
                
                <div className="flex items-center justify-between">
                  <h3 className={cn("text-sm font-bold flex items-center gap-2", dark ? "text-white" : "text-slate-800")}>
                    <Printer className="h-4 w-4 text-blue-500" /> Waybill Preview
                  </h3>
                  <button onClick={() => setShowWaybillModal(false)} className="text-slate-400 hover:text-slate-300">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div 
                  id="waybill-print-sheet" 
                  className="mt-4 bg-white text-slate-900 rounded-xl overflow-hidden p-2 select-none flex justify-center"
                >
                  <style dangerouslySetInnerHTML={{ __html: `
                    .koombiyo-waybill {
                      display: flex;
                      width: 5.5in;
                      height: 3.5in;
                      font-family: Arial, Helvetica, sans-serif;
                      color: #000;
                      padding: 2px;
                      box-sizing: border-box;
                      background: #fff;
                      overflow: hidden;
                      border: 1px solid #1b4f93;
                    }
                    .koombiyo-waybill * {
                      box-sizing: border-box;
                    }
                    .koombiyo-waybill-inner {
                      border: 2px solid #1b4f93;
                      border-radius: 8px;
                      width: 100%;
                      height: 100%;
                      display: flex;
                      box-sizing: border-box;
                    }
                    .waybill-left-col {
                      width: 58%;
                      height: 100%;
                      display: flex;
                      flex-direction: column;
                      box-sizing: border-box;
                    }
                    .waybill-right-col {
                      width: 42%;
                      height: 100%;
                      display: flex;
                      flex-direction: column;
                      box-sizing: border-box;
                      border-left: 2px solid #1b4f93;
                    }
                    .waybill-left-top {
                      height: 32%;
                      display: flex;
                      flex-direction: column;
                      align-items: center;
                      justify-content: center;
                      padding: 3px;
                      box-sizing: border-box;
                    }
                    .waybill-koombiyo-logo {
                      height: 22mm;
                      max-height: 90%;
                      object-fit: contain;
                      display: block;
                    }
                    .waybill-koombiyo-address {
                      font-size: 7.5px;
                      font-weight: bold;
                      color: #1b4f93;
                      margin-top: 1px;
                      font-family: Arial, sans-serif;
                      text-align: center;
                      letter-spacing: -0.1px;
                    }
                    .waybill-left-middle {
                      height: 26%;
                      border-top: 2px solid #1b4f93;
                      padding: 4px 6px;
                      box-sizing: border-box;
                      display: flex;
                      flex-direction: column;
                      justify-content: center;
                      font-size: 9px;
                      color: #1b4f93;
                    }
                    .waybill-left-bottom {
                      height: 42%;
                      border-top: 2px solid #1b4f93;
                      padding: 4px 6px;
                      box-sizing: border-box;
                      display: flex;
                      flex-direction: column;
                      justify-content: space-between;
                      font-size: 9.5px;
                      color: #1b4f93;
                    }
                    .waybill-right-header {
                      height: 11%;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      border-bottom: 2px solid #1b4f93;
                      box-sizing: border-box;
                    }
                    .waybill-right-header-text {
                      font-size: 11.5px;
                      font-weight: 900;
                      color: #1b4f93;
                      font-family: Arial, sans-serif;
                      text-transform: uppercase;
                      letter-spacing: 0.5px;
                    }
                    .waybill-right-barcode-box {
                      height: 28%;
                      border: 1.5px solid #1b4f93;
                      border-radius: 6px;
                      margin: 3px 6px;
                      box-sizing: border-box;
                      display: flex;
                      flex-direction: column;
                      align-items: center;
                      justify-content: center;
                      padding: 2px;
                      overflow: hidden;
                      background: #fff;
                    }
                    .waybill-right-middle {
                      height: 24%;
                      padding: 2px 6px;
                      box-sizing: border-box;
                      display: flex;
                      flex-direction: column;
                      justify-content: center;
                      font-size: 9.5px;
                      color: #1b4f93;
                    }
                    .waybill-right-pod-box {
                      height: 33%;
                      border: 1.5px solid #1b4f93;
                      border-radius: 6px;
                      margin: 3px 6px;
                      box-sizing: border-box;
                      display: flex;
                      flex-direction: column;
                      justify-content: space-between;
                      padding: 4px 6px;
                      font-size: 9px;
                      color: #1b4f93;
                    }
                  ` }} />
                  
                  <div className="koombiyo-waybill">
                    <div className="koombiyo-waybill-inner">
                      {/* LEFT COLUMN */}
                      <div className="waybill-left-col">
                        <div className="waybill-left-top">
                          <img 
                            src="/koombiyo-logo.png" 
                            alt="Koombiyo Logo" 
                            className="waybill-koombiyo-logo"
                          />
                          <div className="waybill-koombiyo-address">
                            Address: No.25, Epitamulla Road, Kotte. Tel: 011 7 886 786
                          </div>
                        </div>

                        <div className="waybill-left-middle">
                          <div style={{ marginBottom: "2px", lineHeight: 1.2 }}>
                            <span style={{ fontWeight: "bold" }}>From :</span> <strong style={{ color: "#000", fontSize: "9.5px" }}>Eeco Aromatics</strong>
                          </div>
                          <div style={{ marginBottom: "2px", lineHeight: 1.2 }}>
                            <span style={{ fontWeight: "bold" }}>Contact Number &nbsp;:</span> <strong style={{ color: "#000" }}>762051906</strong>
                          </div>
                          <div style={{ lineHeight: 1.2 }}>
                            <span style={{ fontWeight: "bold" }}>Issued Date &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:</span> <strong style={{ color: "#000" }}>{memoizedIssuedDate}</strong>
                          </div>
                        </div>

                        <div className="waybill-left-bottom">
                          <div style={{ lineHeight: 1.2, marginBottom: "2px" }}>
                            <span style={{ fontWeight: "bold" }}>To :</span> <strong style={{ color: "#000", fontSize: "11px" }}>{selectedOrder.customerName}</strong>
                          </div>
                          <div style={{ display: "flex", lineHeight: 1.2, marginBottom: "2px", alignItems: "flex-start" }}>
                            <span style={{ fontWeight: "bold", flexShrink: 0 }}>Address &nbsp;:</span>
                            <span style={{ fontWeight: "bold", color: "#000", marginLeft: "4px", fontSize: "9px", lineHeight: 1.1 }}>
                              {address_line1}
                              {address_line2 && `, ${address_line2}`}
                              {address_line3 && `, ${address_line3}`}
                            </span>
                          </div>
                          <div style={{ lineHeight: 1.2, marginBottom: "2px" }}>
                            <span style={{ fontWeight: "bold" }}>Phone No :</span> <strong style={{ color: "#000", fontSize: "10px" }}>{formatPhoneNumber(selectedOrder.contact)}</strong>
                          </div>
                          <div style={{ lineHeight: 1.2 }}>
                            <span style={{ fontWeight: "bold" }}>Description :</span> <strong style={{ color: "#000", fontSize: "9px" }}>{description}</strong>
                          </div>
                        </div>
                      </div>

                      {/* RIGHT COLUMN */}
                      <div className="waybill-right-col">
                        <div className="waybill-right-col-inner" style={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between" }}>
                          <div className="waybill-right-header">
                            <div className="waybill-right-header-text">PROOF OF DELIVERY</div>
                          </div>

                          <div className="waybill-right-barcode-box" />

                          <div className="waybill-right-middle">
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }}>
                              <span style={{ fontWeight: "bold", fontSize: "9.5px" }}>COD AMOUNT :</span>
                              <span style={{ border: "1.5px solid #1b4f93", padding: "1px 6px", fontFamily: "monospace", fontSize: "11.5px", fontWeight: "bold", borderRadius: "4px", color: "#000", minWidth: "60px", textAlign: "right", display: "inline-block" }}>
                                {selectedOrder.price.toFixed(2)}
                              </span>
                            </div>
                            <div style={{ lineHeight: 1.1, marginBottom: "1px" }}>
                              <span style={{ fontWeight: "bold" }}>Order No:</span> <strong style={{ color: "#000", fontFamily: "monospace", fontSize: "9px" }}>{selectedOrder.orderNumber}</strong>
                            </div>
                            <div style={{ lineHeight: 1.1 }}>
                              <span style={{ fontWeight: "bold" }}>Weight :</span> <strong style={{ color: "#000", fontSize: "9px" }}>{selectedOrder.weightGrams ? selectedOrder.weightGrams + 'g' : ''}</strong>
                            </div>
                          </div>

                          <div className="waybill-right-pod-box">
                            <div style={{ display: "flex", lineHeight: 1.1 }}>
                              <span style={{ width: "55px", fontWeight: "bold" }}>Name</span>
                              <span style={{ marginRight: "4px", fontWeight: "bold" }}>:</span>
                            </div>
                            <div style={{ display: "flex", lineHeight: 1.1 }}>
                              <span style={{ width: "55px", fontWeight: "bold" }}>Address</span>
                              <span style={{ marginRight: "4px", fontWeight: "bold" }}>:</span>
                            </div>
                            <div style={{ display: "flex", lineHeight: 1.1 }}>
                              <span style={{ width: "55px", fontWeight: "bold" }}>NIC Number</span>
                              <span style={{ marginRight: "4px", fontWeight: "bold" }}>:</span>
                            </div>
                            <div style={{ display: "flex", lineHeight: 1.1 }}>
                              <span style={{ width: "55px", fontWeight: "bold" }}>Date</span>
                              <span style={{ marginRight: "4px", fontWeight: "bold" }}>:</span>
                            </div>
                            <div style={{ display: "flex", lineHeight: 1.1 }}>
                              <span style={{ width: "55px", fontWeight: "bold" }}>Signature</span>
                              <span style={{ marginRight: "4px", fontWeight: "bold" }}>:</span>
                            </div>
                            <div style={{ display: "flex", lineHeight: 1.1, alignItems: "center" }}>
                              <span style={{ width: "55px", fontWeight: "bold" }}>Deliverd</span>
                              <span style={{ marginRight: "4px", fontWeight: "bold" }}>:</span>
                              <span style={{ display: "inline-flex", alignItems: "center", marginRight: "5px", marginLeft: "2px" }}>
                                <span style={{ border: "1px solid #1b4f93", width: "9px", height: "9px", display: "inline-block", marginRight: "2px" }}></span> Yes
                              </span>
                              <span style={{ display: "inline-flex", alignItems: "center" }}>
                                <span style={{ border: "1px solid #1b4f93", width: "9px", height: "9px", display: "inline-block", marginRight: "2px" }}></span> No
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => {
                      const printContents = document.getElementById("waybill-print-sheet")?.innerHTML;
                      if (printContents) {
                        const printWindow = window.open("", "_blank");
                        if (printWindow) {
                          printWindow.document.write(`
                            <html>
                              <head>
                                <title>Print Waybill - ${selectedOrder.waybillNumber}</title>
                                <base href="${window.location.origin}/" />
                                <style>
                                  body {
                                    margin: 0;
                                    padding: 0;
                                    background: #fff;
                                  }
                                  .koombiyo-waybill {
                                    display: flex;
                                    width: 5.5in;
                                    height: 3.5in;
                                    font-family: Arial, Helvetica, sans-serif;
                                    color: #000;
                                    padding: 2px;
                                    box-sizing: border-box;
                                    background: #fff;
                                    overflow: hidden;
                                    border: 1px solid #1b4f93;
                                    margin: 0 auto;
                                  }
                                  .koombiyo-waybill * {
                                    box-sizing: border-box;
                                  }
                                  .koombiyo-waybill-inner {
                                    border: 2px solid #1b4f93;
                                    border-radius: 8px;
                                    width: 100%;
                                    height: 100%;
                                    display: flex;
                                    box-sizing: border-box;
                                  }
                                  .waybill-left-col {
                                    width: 58%;
                                    height: 100%;
                                    display: flex;
                                    flex-direction: column;
                                    box-sizing: border-box;
                                  }
                                  .waybill-right-col {
                                    width: 42%;
                                    height: 100%;
                                    display: flex;
                                    flex-direction: column;
                                    box-sizing: border-box;
                                    border-left: 2px solid #1b4f93;
                                  }
                                  .waybill-left-top {
                                    height: 32%;
                                    display: flex;
                                    flex-direction: column;
                                    align-items: center;
                                    justify-content: center;
                                    padding: 3px;
                                    box-sizing: border-box;
                                  }
                                  .waybill-koombiyo-logo {
                                    height: 22mm;
                                    max-height: 90%;
                                    object-fit: contain;
                                    display: block;
                                  }
                                  .waybill-koombiyo-address {
                                    font-size: 7.5px;
                                    font-weight: bold;
                                    color: #1b4f93;
                                    margin-top: 1px;
                                    font-family: Arial, sans-serif;
                                    text-align: center;
                                    letter-spacing: -0.1px;
                                  }
                                  .waybill-left-middle {
                                    height: 26%;
                                    border-top: 2px solid #1b4f93;
                                    padding: 4px 6px;
                                    box-sizing: border-box;
                                    display: flex;
                                    flex-direction: column;
                                    justify-content: center;
                                    font-size: 9px;
                                    color: #1b4f93;
                                  }
                                  .waybill-left-bottom {
                                    height: 42%;
                                    border-top: 2px solid #1b4f93;
                                    padding: 4px 6px;
                                    box-sizing: border-box;
                                    display: flex;
                                    flex-direction: column;
                                    justify-content: space-between;
                                    font-size: 9.5px;
                                    color: #1b4f93;
                                  }
                                  .waybill-right-header {
                                    height: 11%;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    border-bottom: 2px solid #1b4f93;
                                    box-sizing: border-box;
                                  }
                                  .waybill-right-header-text {
                                    font-size: 11.5px;
                                    font-weight: 900;
                                    color: #1b4f93;
                                    font-family: Arial, sans-serif;
                                    text-transform: uppercase;
                                    letter-spacing: 0.5px;
                                  }
                                  .waybill-right-barcode-box {
                                    height: 28%;
                                    border: 1.5px solid #1b4f93;
                                    border-radius: 6px;
                                    margin: 3px 6px;
                                    box-sizing: border-box;
                                    display: flex;
                                    flex-direction: column;
                                    align-items: center;
                                    justify-content: center;
                                    padding: 2px;
                                    overflow: hidden;
                                    background: #fff;
                                  }
                                  .waybill-right-middle {
                                    height: 24%;
                                    padding: 2px 6px;
                                    box-sizing: border-box;
                                    display: flex;
                                    flex-direction: column;
                                    justify-content: center;
                                    font-size: 9.5px;
                                    color: #1b4f93;
                                  }
                                  .waybill-right-pod-box {
                                    height: 33%;
                                    border: 1.5px solid #1b4f93;
                                    border-radius: 6px;
                                    margin: 3px 6px;
                                    box-sizing: border-box;
                                    display: flex;
                                    flex-direction: column;
                                    justify-content: space-between;
                                    padding: 4px 6px;
                                    font-size: 9px;
                                    color: #1b4f93;
                                  }
                                  @media print {
                                    body { margin: 0; padding: 0; background: #fff; }
                                    @page { size: 5.5in 3.5in; margin: 0; }
                                    .koombiyo-waybill {
                                      display: flex !important;
                                      width: 5.5in !important;
                                      height: 3.5in !important;
                                      margin: 0 !important;
                                      padding: 2px !important;
                                      border: 1px solid #1b4f93 !important;
                                      box-sizing: border-box !important;
                                      background: #fff !important;
                                      -webkit-print-color-adjust: exact !important;
                                      print-color-adjust: exact !important;
                                    }
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
                    className="flex-1 rounded-lg bg-blue-600 py-2.5 text-xs font-bold text-white hover:bg-blue-500 transition flex items-center justify-center gap-2"
                  >
                    <Printer className="h-3.5 w-3.5" /> Print
                  </button>
                  <button onClick={() => setShowWaybillModal(false)} className={cn("flex-1 rounded-lg border py-2.5 text-xs font-bold transition", dark ? "border-white/10 text-slate-300 hover:bg-white/5" : "border-slate-200 text-slate-600 hover:bg-slate-50")}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
      </AnimatePresence>


      {/* ═══════════════════════════════════════════════════════
          ADD ORDERS MODAL (redesigned)
         ═══════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setIsAddModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "relative w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[80vh]",
                dark ? "bg-slate-950 border-white/10" : "bg-white border-slate-200"
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-violet-500 to-indigo-500" />

              {/* Header + Search */}
              <div className="p-4 pb-3 border-b border-slate-800/10 dark:border-white/5 shrink-0 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className={cn("text-sm font-bold", dark ? "text-white" : "text-slate-800")}>
                    Add Orders to Queue
                  </h3>
                  <button
                    onClick={() => setIsAddModalOpen(false)}
                    className={cn("rounded-lg p-1 transition", dark ? "text-slate-500 hover:text-white" : "text-slate-400 hover:text-slate-700")}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className={cn(
                  "flex items-center gap-2 rounded-xl border px-3 py-2 transition focus-within:border-violet-500/40",
                  dark ? "border-white/[0.08] bg-slate-800/60" : "border-slate-200 bg-slate-50"
                )}>
                  <Search className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                  <input
                    type="text"
                    placeholder="Search orders..."
                    value={modalSearchQuery}
                    onChange={(e) => setModalSearchQuery(e.target.value)}
                    className={cn("w-full bg-transparent text-xs outline-none", dark ? "placeholder:text-slate-600 text-white" : "placeholder:text-slate-400 text-slate-900")}
                  />
                  {modalSearchQuery && (
                    <button onClick={() => setModalSearchQuery("")} className="text-slate-400 hover:text-slate-200">
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className={cn("text-[10px] font-bold", dark ? "text-violet-400" : "text-violet-600")}>
                    {selectedModalOrderIds.length} selected
                  </span>
                  {filteredModalOrders.length > 0 && (
                    <button
                      onClick={() => {
                        const allIds = filteredModalOrders.map(o => o.id);
                        const allSelected = allIds.every(id => selectedModalOrderIds.includes(id));
                        if (allSelected) {
                          setSelectedModalOrderIds(prev => prev.filter(id => !allIds.includes(id)));
                        } else {
                          setSelectedModalOrderIds(prev => {
                            const next = [...prev];
                            allIds.forEach(id => { if (!next.includes(id)) next.push(id); });
                            return next;
                          });
                        }
                      }}
                      className={cn("text-[10px] font-bold transition", dark ? "text-violet-400 hover:text-violet-300" : "text-violet-600 hover:text-violet-500")}
                    >
                      {filteredModalOrders.length > 0 && filteredModalOrders.every(item => selectedModalOrderIds.includes(item.id)) ? "Deselect all" : "Select all"}
                    </button>
                  )}
                </div>
              </div>

              {/* Order List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-1.5 custom-scrollbar">
                {filteredModalOrders.length === 0 ? (
                  <div className={cn("rounded-xl border p-10 text-center text-xs", dark ? "border-white/5 bg-slate-900/40 text-slate-500" : "border-slate-100 bg-slate-50/50 text-slate-400")}>
                    {modalSearchQuery ? "No orders match your search." : "No pending orders available."}
                  </div>
                ) : (
                  filteredModalOrders.map((order) => {
                    const isChecked = selectedModalOrderIds.includes(order.id);

                    return (
                      <div
                        key={order.id}
                        onClick={() => {
                          setSelectedModalOrderIds(prev =>
                            prev.includes(order.id) ? prev.filter(id => id !== order.id) : [...prev, order.id]
                          );
                        }}
                        className={cn(
                          "flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-all duration-200",
                          isChecked
                            ? dark ? "bg-violet-500/[0.06] border-violet-500/25" : "bg-violet-50/50 border-violet-300"
                            : dark ? "border-white/[0.05] bg-slate-900/40 hover:bg-slate-800/50" : "border-slate-200/80 bg-white hover:bg-slate-50"
                        )}
                      >
                        {/* Checkbox */}
                        <div className={cn(
                          "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition",
                          isChecked
                            ? "bg-violet-500 border-violet-500 text-white"
                            : dark ? "border-white/15 bg-slate-800" : "border-slate-300 bg-white"
                        )}>
                          {isChecked && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className={cn("text-xs font-bold truncate", dark ? "text-white" : "text-slate-800")}>
                              {order.customerName}
                            </span>
                            <span className={cn("text-[10px] font-bold font-mono shrink-0", dark ? "text-violet-400" : "text-violet-600")}>
                              Rs. {order.price.toLocaleString()}
                            </span>
                          </div>
                          <div className={cn("flex items-center gap-2 mt-1 text-[10px]", dark ? "text-slate-500" : "text-slate-400")}>
                            <span className="font-mono font-medium">{order.orderNumber}</span>
                            <span className="opacity-30">•</span>
                            <span>{order.city}</span>
                            <span className="opacity-30">•</span>
                            <span>{order.courier}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-slate-800/10 dark:border-white/5 shrink-0 flex gap-2">
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className={cn("flex-1 rounded-lg border py-2.5 text-xs font-bold transition active:scale-[0.98]",
                    dark ? "border-white/10 text-slate-400 hover:bg-white/5" : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  )}
                >
                  Cancel
                </button>
                <button
                  disabled={selectedModalOrderIds.length === 0}
                  onClick={handleAddSelectedOrders}
                  className="flex-1 rounded-lg py-2.5 text-xs font-bold text-white bg-violet-600 hover:bg-violet-500 disabled:opacity-40 transition active:scale-[0.98]"
                >
                  Add {selectedModalOrderIds.length > 0 ? `(${selectedModalOrderIds.length})` : ""} to Queue
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </AppShell>
  );
}
