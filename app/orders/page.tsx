"use client";

import { useState, useMemo, useEffect, useRef, type ReactNode } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { AppShell } from "@/components/app-shell";
import { useThemeMode } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import { orders, ORDER_STATUSES, URGENT_LEVELS, COURIERS, DISTRICTS, type Order } from "@/lib/crh-data";
import { hasPermission } from "@/lib/permissions";
import {
  Search,
  PlusCircle,
  Pencil,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Filter,
  ShoppingBag,
  Truck,
  CheckCircle,
  AlertCircle,
  Eye,
  Package,
  Clock,
  AlertTriangle,
  XCircle,
  RotateCcw,
  ShieldAlert,
  ChevronDown,
  Download,
  FileSpreadsheet,
  Share2,
  Printer
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { ConfirmationModal, ViewOrderModal, StatusDropdown, FilterSelect } from "@/components/ui";
import { AddEditOrderModal } from "@/components/add-edit-order-modal";

const PAGE_SIZE = 10;

/* ─── Operations Icon Mapping ─────────────────────────── */
const operationsIconMap: Record<string, any> = {
  delivered: Truck,
  rescheduled: Clock,
  urgent: AlertTriangle,
  failed: XCircle,
  cancelled: XCircle,
  return: RotateCcw,
  returnReq: AlertCircle,
  problems: ShieldAlert,
};

/* ─── Per-card gradient config ─────────────────────────── */
const operationsCardGradients: Record<string, { top: string; icon: string; glow: string; badge: string }> = {
  delivered: { top: "from-emerald-400 via-emerald-500 to-teal-600", icon: "from-emerald-500 to-teal-600", glow: "rgba(16,185,129,0.18)", badge: "bg-emerald-500/15 text-emerald-400" },
  rescheduled: { top: "from-amber-400 via-amber-500 to-orange-500", icon: "from-amber-500 to-orange-500", glow: "rgba(245,158,11,0.18)", badge: "bg-amber-500/15 text-amber-400" },
  urgent: { top: "from-orange-400 via-orange-500 to-red-500", icon: "from-orange-500 to-red-500", glow: "rgba(249,115,22,0.18)", badge: "bg-orange-500/15 text-orange-400" },
  failed: { top: "from-red-400 via-red-500 to-rose-600", icon: "from-red-500 to-rose-600", glow: "rgba(239,68,68,0.18)", badge: "bg-red-500/15 text-red-400" },
  cancelled: { top: "from-rose-400 via-rose-500 to-pink-600", icon: "from-rose-500 to-pink-600", glow: "rgba(244,63,94,0.18)", badge: "bg-rose-500/15 text-rose-400" },
  return: { top: "from-violet-400 via-violet-500 to-purple-600", icon: "from-violet-500 to-purple-600", glow: "rgba(139,92,246,0.18)", badge: "bg-violet-500/15 text-violet-400" },
  returnReq: { top: "from-purple-400 via-purple-500 to-fuchsia-600", icon: "from-purple-500 to-fuchsia-600", glow: "rgba(168,85,247,0.18)", badge: "bg-purple-500/15 text-purple-400" },
  problems: { top: "from-blue-400 via-blue-500 to-indigo-600", icon: "from-blue-500 to-indigo-600", glow: "rgba(59,130,246,0.18)", badge: "bg-blue-500/15 text-blue-400" },
};

/* ─── Smooth Value counting Hook ─────────────────────── */
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
      const easeProgress = 1 - Math.pow(1 - progress, 3); // easeOutCubic
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



/* ─── Glowing Focus SearchBar Component ───────────────── */
function SearchBar({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
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

/* ─── Premium Quick-Filter Chips Component ─────────────── */
function QuickFilterChips({
  selected,
  onChange,
  counts,
}: {
  selected: string;
  onChange: (filter: string) => void;
  counts: { all: number; active: number; delivered: number; returns: number };
}) {
  const { dark } = useThemeMode();
  const options = [
    { value: "all", label: "All Orders", count: counts.all, color: "violet" },
    { value: "active", label: "Active Ops", count: counts.active, color: "cyan" },
    { value: "delivered", label: "Delivered", count: counts.delivered, color: "emerald" },
    { value: "returns", label: "Returns & Issues", count: counts.returns, color: "rose" },
  ];

  const pillStyles = {
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
        const color = opt.color as keyof typeof pillStyles;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold transition-all duration-300 active:scale-95",
              isSelected
                ? pillStyles[color]
                : dark
                  ? "border-white/5 bg-slate-800/40 text-slate-400 hover:bg-slate-800 hover:text-slate-200 hover:border-white/10"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <span>{opt.label}</span>
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[9px] font-bold transition-colors",
                isSelected
                  ? dark
                    ? "bg-white/10 text-white"
                    : "bg-black/5 text-black/80"
                  : dark
                    ? "bg-white/5 text-slate-500"
                    : "bg-slate-100 text-slate-500"
              )}
            >
              {opt.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ─── Premium Export Utility Toolbar ─────────────────────── */
const orderExportHeaders = [
  "Waybill Number",
  "Order Number",
  "Customer Name",
  "Address",
  "District",
  "City",
  "Contact",
  "Price (LKR)",
  "Payment Method",
  "Courier",
  "Courier Branch",
  "Sales Channel",
  "Notes",
  "Status",
  "Urgent Level",
  "Last Action",
  "Created At"
];

const getOrderStatusLabel = (status: string) => ORDER_STATUSES.find((s) => s.value === status)?.label || status;
const getUrgentLabel = (level: string) => URGENT_LEVELS.find((u) => u.value === level)?.label || level;

const orderFieldValue = (order: Order, header: string) => {
  const map: Record<string, string> = {
    "Waybill Number": order.waybillNumber || "",
    "Order Number": order.orderNumber || "",
    "Customer Name": order.customerName || "",
    "Address": order.address || "",
    "District": order.district || "",
    "City": order.city || "",
    "Contact": order.contact || "",
    "Price (LKR)": order.price ? String(order.price) : "0",
    "Payment Method": order.paymentMethod || "",
    "Courier": order.courier || "",
    "Courier Branch": order.courierBranch || "",
    "Sales Channel": order.salesChannel || "",
    "Notes": order.notes || "",
    "Status": getOrderStatusLabel(order.status),
    "Urgent Level": getUrgentLabel(order.urgentLevel),
    "Last Action": order.lastAction || "",
    "Created At": order.createdAt || "",
  };
  return map[header] || "";
};

function downloadBlob(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function buildCsv(records: Order[]) {
  const escape = (value: string) => `"${value.replaceAll('"', '""')}"`;
  return [
    orderExportHeaders.join(","),
    ...records.map((record) =>
      orderExportHeaders
        .map((header) => escape(orderFieldValue(record, header)))
        .join(","),
    ),
  ].join("\n");
}

function buildExcel(records: Order[]) {
  const headerCells = orderExportHeaders
    .map(
      (header) =>
        `<th style="padding:8px;border:1px solid #d4d4d8;background:#f8fafc;">${header}</th>`,
    )
    .join("");

  const rows = records
    .map(
      (record) =>
        `<tr>${orderExportHeaders
          .map(
            (header) =>
              `<td style="padding:8px;border:1px solid #e2e8f0;">${orderFieldValue(record, header)}</td>`,
          )
          .join("")}</tr>`,
    )
    .join("");

  return `<html><body><table><thead><tr>${headerCells}</tr></thead><tbody>${rows}</tbody></table></body></html>`;
}

function downloadPDF(title: string, records: Order[]) {
  try {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "pt",
      format: "letter"
    });

    const primaryColor = [15, 23, 42]; // #0f172a (Slate 900)
    const accentColor = [30, 58, 138];  // #1e3a8a (Royal Blue)
    const textColor = [71, 85, 105];   // #475569 (Slate 600)
    const darkTextColor = [15, 23, 42]; // #0f172a (Slate 900)

    // Document header details
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.text("EECO POS CARE", 40, 50);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text("Courier Resolution Hub - Order resolution systems", 40, 62);

    // Contact info (Right aligned)
    doc.setFontSize(8);
    doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
    const rightInfoX = doc.internal.pageSize.width - 40;
    doc.text("📍 123 Business Park, Suite 100, Colombo, Sri Lanka", rightInfoX, 42, { align: "right" });
    doc.text("📞 +94 11 234 5678", rightInfoX, 52, { align: "right" });
    doc.text("✉️ info@eecogroup.com | 🌐 www.eecogroup.com", rightInfoX, 62, { align: "right" });

    // Horizontal line
    doc.setDrawColor(226, 232, 240); // #e2e8f0
    doc.setLineWidth(1);
    doc.line(40, 72, doc.internal.pageSize.width - 40, 72);

    // Title banner
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(40, 80, doc.internal.pageSize.width - 80, 24, "F");

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text(title.toUpperCase(), 50, 95);

    const dateStr = `DATE: ${new Date().toLocaleDateString()}`;
    doc.text(dateStr, doc.internal.pageSize.width - 50, 95, { align: "right" });

    // Summary Boxes
    const boxWidth = (doc.internal.pageSize.width - 90) / 2;

    // Left Box - Business Information
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(40, 115, boxWidth, 16, "F");
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text("BUSINESS INFORMATION", 40 + boxWidth / 2, 126, { align: "center" });

    doc.setDrawColor(226, 232, 240);
    doc.rect(40, 131, boxWidth, 70);

    doc.setFontSize(7.5);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    const labelsLeft = ["Business Name:", "Department:", "Prepared By:", "Contact No.:", "Email:"];
    const valuesLeft = ["EECO GROUP", "Courier Resolution Hub", "System Administrator", "+94 11 234 5678", "info@eecogroup.com"];
    labelsLeft.forEach((label, idx) => {
      const yPos = 143 + idx * 12;
      doc.setFont("Helvetica", "bold");
      doc.text(label, 50, yPos);
      doc.setFont("Helvetica", "normal");
      doc.text(valuesLeft[idx], 130, yPos);
    });

    // Right Box - Orders Summary
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(40 + boxWidth + 10, 115, boxWidth, 16, "F");
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text("ORDERS SUMMARY", 40 + boxWidth + 10 + boxWidth / 2, 126, { align: "center" });

    doc.rect(40 + boxWidth + 10, 131, boxWidth, 70);

    doc.setFontSize(7.5);
    const labelsRight = ["Total Orders:", "Total Revenue:", "Active Ops:", "Export Date:", "System Mode:"];
    const totalRev = records.reduce((sum, r) => sum + r.price, 0);
    const activeOps = records.filter(r => !["delivered", "failed", "cancelled"].includes(r.status)).length;
    const valuesRight = [
      `${records.length} records`,
      `Rs. ${totalRev.toLocaleString()}`,
      `${activeOps} active`,
      new Date().toLocaleDateString(),
      "POS CourierResolution"
    ];
    labelsRight.forEach((label, idx) => {
      const yPos = 143 + idx * 12;
      doc.setFont("Helvetica", "bold");
      doc.text(label, 40 + boxWidth + 20, yPos);
      doc.setFont("Helvetica", "normal");

      if (idx === 1) {
        doc.setTextColor(22, 163, 74); // green
      } else if (idx === 2) {
        doc.setTextColor(245, 158, 11); // orange
      } else {
        doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
      }
      doc.text(valuesRight[idx], 40 + boxWidth + 110, yPos);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]); // reset
    });

    // Table Data
    const tableHeaders = [
      "NO.",
      "WAYBILL",
      "ORDER NO",
      "CUSTOMER NAME",
      "CONTACT",
      "PRICE",
      "COURIER",
      "STATUS",
      "URGENCY"
    ];

    const tableRows = records.map((record, idx) => {
      return [
        (idx + 1).toString(),
        record.waybillNumber || "-",
        record.orderNumber || "-",
        record.customerName || "-",
        record.contact || "-",
        `Rs. ${record.price.toLocaleString()}`,
        record.courier || "-",
        getOrderStatusLabel(record.status),
        getUrgentLabel(record.urgentLevel)
      ];
    });

    autoTable(doc, {
      startY: 215,
      head: [tableHeaders],
      body: tableRows,
      margin: { left: 40, right: 40 },
      theme: "striped",
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: "bold",
        halign: "center",
        valign: "middle"
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: [71, 85, 105]
      },
      columnStyles: {
        0: { halign: "center", cellWidth: 30 },
        1: { fontStyle: "bold", textColor: [15, 23, 42], cellWidth: 70 },
        2: { fontStyle: "bold", textColor: [15, 23, 42], cellWidth: 60 },
        3: { cellWidth: 120 },
        4: { cellWidth: 80 },
        5: { halign: "right", fontStyle: "bold", cellWidth: 70 },
        6: { cellWidth: 70 },
        7: { cellWidth: 100 },
        8: { halign: "center", cellWidth: 60 }
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 7) {
          const statusVal = records[data.row.index].status;
          if (statusVal === 'delivered') {
            data.cell.styles.textColor = [22, 101, 52]; // green
            data.cell.styles.fontStyle = 'bold';
          } else if (['failed', 'cancelled', 'return_ho', 'return_client'].includes(statusVal)) {
            data.cell.styles.textColor = [153, 27, 27]; // red
            data.cell.styles.fontStyle = 'bold';
          } else if (statusVal.startsWith('rescheduled')) {
            data.cell.styles.textColor = [180, 83, 9]; // amber
            data.cell.styles.fontStyle = 'bold';
          }
        }
      },
      didDrawPage: (data) => {
        const pageCount = doc.getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        doc.text(
          `Page ${data.pageNumber} of ${pageCount}`,
          doc.internal.pageSize.width - 40,
          doc.internal.pageSize.height - 20,
          { align: "right" }
        );
      }
    });

    doc.save(`${title.toLowerCase().replaceAll(" ", "-")}.pdf`);
  } catch (error) {
    console.error("PDF generation failed:", error);
    alert("An error occurred during PDF generation.");
  }
}

function buildPremiumPrintable(title: string, records: Order[]) {
  const rows = records.map((record, idx) => {
    let statusBadge = '';
    const statusVal = record.status;
    const statusLabel = getOrderStatusLabel(statusVal);
    if (statusVal === 'delivered') {
      statusBadge = `<span class="badge badge-success">${statusLabel}</span>`;
    } else if (['failed', 'cancelled', 'return_ho', 'return_client'].includes(statusVal)) {
      statusBadge = `<span class="badge badge-failed">${statusLabel}</span>`;
    } else if (statusVal.startsWith('rescheduled')) {
      statusBadge = `<span class="badge badge-rescheduled">${statusLabel}</span>`;
    } else {
      statusBadge = `<span class="badge badge-neutral">${statusLabel}</span>`;
    }

    let urgencyBadge = '';
    const urgentVal = record.urgentLevel;
    const urgentLabel = getUrgentLabel(urgentVal);
    if (urgentVal === 'critical') {
      urgencyBadge = `<span class="badge badge-failed">${urgentLabel}</span>`;
    } else if (urgentVal === 'high') {
      urgencyBadge = `<span class="badge badge-rescheduled">${urgentLabel}</span>`;
    } else if (urgentVal !== 'none') {
      urgencyBadge = `<span class="badge badge-neutral">${urgentLabel}</span>`;
    } else {
      urgencyBadge = `-`;
    }

    return `<tr>
      <td class="text-center">${idx + 1}</td>
      <td class="font-semibold text-dark">${record.waybillNumber}</td>
      <td class="font-semibold text-dark">${record.orderNumber}</td>
      <td>${record.customerName || "-"}</td>
      <td>${record.contact || "-"}</td>
      <td class="text-right font-semibold">Rs. ${record.price.toLocaleString()}</td>
      <td>${record.courier || "-"}</td>
      <td class="text-center">${statusBadge}</td>
      <td class="text-center">${urgencyBadge}</td>
    </tr>`;
  }).join("");

  const totalRev = records.reduce((s, r) => s + r.price, 0);
  const activeOps = records.filter(r => !["delivered", "failed", "cancelled"].includes(r.status)).length;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
      </head>
      <body>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
          * { box-sizing: border-box; }
          body, .pdf-wrapper { 
            font-family: 'Inter', sans-serif; 
            margin: 0; 
            padding: 20px; 
            color: #1e293b; 
            background: #ffffff; 
            font-size: 10px;
            line-height: 1.4;
            width: 100%;
          }
          
          table.main-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; border: 1px solid #e2e8f0; }
          table.main-table th { 
            background: #0f172a; 
            color: white; 
            padding: 8px 6px; 
            font-size: 9px; 
            font-weight: 700; 
            text-align: center; 
            border: 1px solid #1e293b;
          }
          table.main-table td { 
            padding: 6px; 
            border: 1px solid #e2e8f0; 
            font-size: 9px; 
            color: #475569;
          }
          table.main-table tr:nth-child(even) { background-color: #f8fafc; }
          
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .font-semibold { font-weight: 600; }
          .text-dark { color: #0f172a; }
          
          .badge { padding: 3px 6px; border-radius: 4px; font-size: 8px; font-weight: 700; display: inline-block; width: auto; min-width: 70px; text-align: center; }
          .badge-success { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
          .badge-failed { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
          .badge-rescheduled { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
          .badge-neutral { background: #f1f5f9; color: #334155; border: 1px solid #e2e8f0; }
          
          .footer-banner { background: #0f172a; color: white; padding: 10px; text-align: center; font-size: 10px; font-weight: 500; letter-spacing: 0.5px; margin-top: 20px; }
          
          @media print {
            body, .pdf-wrapper { padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
        <div class="pdf-wrapper">
        
        <!-- Header table -->
        <table style="width: 100%; border: none; margin-bottom: 20px; border-collapse: collapse;">
          <tr>
            <td style="vertical-align: middle; border: none; padding: 0;">
              <table style="border: none; border-collapse: collapse;">
                <tr>
                  <td style="border: none; padding: 0 15px 0 0; vertical-align: middle;">
                    <img src="/logo.png" alt="Logo" style="height: 50px; object-fit: contain;" onerror="this.style.display='none'" />
                  </td>
                  <td style="border: none; padding: 0; vertical-align: middle;">
                    <h1 class="company-name" style="font-size: 20px; font-weight: 800; color: #1e3a8a; margin: 0; line-height: 1; letter-spacing: -0.5px;">EECO POS CARE</h1>
                    <div class="company-slogan" style="font-size: 10px; color: #475569; margin-top: 3px; font-weight: 500;">Courier Resolution Hub - Order resolution systems</div>
                  </td>
                </tr>
              </table>
            </td>
            <td style="text-align: right; vertical-align: middle; border: none; padding: 0;">
              <div class="contact-info" style="display: inline-block; text-align: left; border-left: 2px solid #cbd5e1; padding-left: 15px; font-size: 9px; color: #0f172a; font-weight: 500; line-height: 1.3;">
                <div>📍 123 Business Park, Suite 100, Colombo, Sri Lanka</div>
                <div>📞 +94 11 234 5678</div>
                <div>✉️ info@eecogroup.com</div>
                <div>🌐 www.eecogroup.com</div>
              </div>
            </td>
          </tr>
        </table>

        <!-- Title Banner Table -->
        <table style="width: 100%; background: #0f172a; color: white; margin-bottom: 20px; border-collapse: collapse; border: none;">
          <tr>
            <td style="padding: 10px 15px; border: none; vertical-align: middle;">
              <h2 class="title-text" style="font-size: 14px; font-weight: 700; letter-spacing: 1px; margin: 0; text-transform: uppercase; color: white;">${title.toUpperCase()}</h2>
            </td>
            <td style="padding: 10px 15px; border: none; text-align: right; vertical-align: middle; font-size: 10px; font-weight: 600;">
              DATE: &nbsp;&nbsp;&nbsp;${new Date().toLocaleDateString()}
            </td>
          </tr>
        </table>

        <!-- Summary Grid Table -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; border: none; table-layout: fixed;">
          <tr>
            <td style="width: 49%; vertical-align: top; border: 1px solid #e2e8f0; padding: 0;">
              <div class="info-box-header" style="background: #0f172a; color: white; padding: 6px; text-align: center; font-weight: 700; font-size: 10px; letter-spacing: 0.5px;">BUSINESS INFORMATION</div>
              <table style="width: 100%; border-collapse: collapse; border: none;">
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td style="width: 40%; padding: 5px 10px; font-weight: 600; color: #334155; background: #f8fafc; border-right: 1px solid #e2e8f0; border-top: none; border-left: none;">Business Name:</td>
                  <td style="width: 60%; padding: 5px 10px; font-weight: 500; color: #0f172a; border: none;">EECO GROUP</td>
                </tr>
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td style="width: 40%; padding: 5px 10px; font-weight: 600; color: #334155; background: #f8fafc; border-right: 1px solid #e2e8f0; border-top: none; border-left: none;">Department:</td>
                  <td style="width: 60%; padding: 5px 10px; font-weight: 500; color: #0f172a; border: none;">Courier Resolution Hub</td>
                </tr>
                <tr>
                  <td style="width: 40%; padding: 5px 10px; font-weight: 600; color: #334155; background: #f8fafc; border-right: 1px solid #e2e8f0; border: none;">Prepared By:</td>
                  <td style="width: 60%; padding: 5px 10px; font-weight: 500; color: #0f172a; border: none;">System Administrator</td>
                </tr>
              </table>
            </td>
            <td style="width: 2%; border: none;"></td>
            <td style="width: 49%; vertical-align: top; border: 1px solid #e2e8f0; padding: 0;">
              <div class="info-box-header" style="background: #0f172a; color: white; padding: 6px; text-align: center; font-weight: 700; font-size: 10px; letter-spacing: 0.5px;">REPORT SUMMARY</div>
              <table style="width: 100%; border-collapse: collapse; border: none;">
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td style="width: 45%; padding: 5px 10px; font-weight: 600; color: #334155; background: #f8fafc; border-right: 1px solid #e2e8f0; border-top: none; border-left: none;">Total Orders Count:</td>
                  <td style="width: 55%; padding: 5px 10px; font-weight: 700; color: #1e3a8a; border: none;">${records.length} records</td>
                </tr>
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td style="width: 45%; padding: 5px 10px; font-weight: 600; color: #334155; background: #f8fafc; border-right: 1px solid #e2e8f0; border-top: none; border-left: none;">Total Valuation (LKR):</td>
                  <td style="width: 55%; padding: 5px 10px; font-weight: 700; color: #166534; border: none;">Rs. ${totalRev.toLocaleString()}</td>
                </tr>
                <tr>
                  <td style="width: 45%; padding: 5px 10px; font-weight: 600; color: #334155; background: #f8fafc; border-right: 1px solid #e2e8f0; border: none;">Active Operations:</td>
                  <td style="width: 55%; padding: 5px 10px; font-weight: 700; color: #b45309; border: none;">${activeOps} active</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- Main Orders Table -->
        <table class="main-table">
          <thead>
            <tr>
              <th style="width: 4%">NO.</th>
              <th style="width: 11%">WAYBILL</th>
              <th style="width: 10%">ORDER NO</th>
              <th style="width: 18%">CUSTOMER NAME</th>
              <th style="width: 12%">CONTACT</th>
              <th style="width: 13%">PRICE (LKR)</th>
              <th style="width: 12%">COURIER</th>
              <th style="width: 11%">STATUS</th>
              <th style="width: 9%">URGENCY</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>

        <!-- Footer signature / approvals -->
        <table style="width: 100%; border: none; margin-top: 40px; border-collapse: collapse; table-layout: fixed;">
          <tr>
            <td style="border: none; text-align: center; padding: 10px;">
              <div style="width: 150px; border-bottom: 1px solid #94a3b8; margin: 0 auto 5px auto;"></div>
              <div style="font-weight: 600; color: #475569; font-size: 9px;">PREPARED BY</div>
              <div style="color: #94a3b8; font-size: 8px;">System Administrator</div>
            </td>
            <td style="border: none; text-align: center; padding: 10px;">
              <div style="width: 150px; border-bottom: 1px solid #94a3b8; margin: 0 auto 5px auto;"></div>
              <div style="font-weight: 600; color: #475569; font-size: 9px;">CHECKED BY</div>
              <div style="color: #94a3b8; font-size: 8px;">Finance Manager</div>
            </td>
            <td style="border: none; text-align: center; padding: 10px;">
              <div style="width: 150px; border-bottom: 1px solid #94a3b8; margin: 0 auto 5px auto;"></div>
              <div style="font-weight: 600; color: #475569; font-size: 9px;">AUTHORIZED BY</div>
              <div style="color: #94a3b8; font-size: 8px;">Operations Director</div>
            </td>
          </tr>
        </table>

        <div class="footer-banner">
          EECO GROUP • CONFIDENTIAL SYSTEM REPORT • DO NOT DISTRIBUTE OUTSIDE THE ORGANIZATION
        </div>
        
        </div>
      </body>
    </html>
  `;
}

function openPrint(title: string, records: Order[]) {
  const blob = new Blob([buildPremiumPrintable(title, records)], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (win) {
    win.onload = () => {
      setTimeout(() => {
        win.print();
      }, 500);
    };
  } else {
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const contentWindow = iframe.contentWindow;
    if (!contentWindow) return;

    contentWindow.document.write(buildPremiumPrintable(title, records));
    contentWindow.document.close();
    contentWindow.focus();

    setTimeout(() => {
      contentWindow.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 500);
  }
}

function ExportToolbarButton({
  onClick,
  children,
  icon: Icon,
  variantColor,
  className,
}: {
  onClick: () => void;
  children: ReactNode;
  icon: any;
  variantColor: "violet" | "emerald" | "rose" | "teal" | "blue";
  className?: string;
}) {
  const { dark } = useThemeMode();

  const gradientMap = {
    violet: {
      gradient: "from-violet-600 to-blue-600",
      shadow: dark ? "shadow-violet-600/20" : "shadow-violet-600/15",
      glow: "hover:shadow-[0_4px_15px_rgba(139,92,246,0.25)]",
    },
    emerald: {
      gradient: "from-emerald-500 to-teal-600",
      shadow: dark ? "shadow-emerald-500/20" : "shadow-emerald-500/15",
      glow: "hover:shadow-[0_4px_15px_rgba(16,185,129,0.25)]",
    },
    rose: {
      gradient: "from-rose-500 to-red-600",
      shadow: dark ? "shadow-rose-500/20" : "shadow-rose-500/15",
      glow: "hover:shadow-[0_4px_15px_rgba(244,63,94,0.25)]",
    },
    teal: {
      gradient: "from-teal-500 to-cyan-600",
      shadow: dark ? "shadow-teal-500/20" : "shadow-teal-500/15",
      glow: "hover:shadow-[0_4px_15px_rgba(20,184,166,0.25)]",
    },
    blue: {
      gradient: "from-blue-500 to-indigo-600",
      shadow: dark ? "shadow-blue-500/20" : "shadow-blue-500/15",
      glow: "hover:shadow-[0_4px_15px_rgba(59,130,246,0.25)]",
    },
  };

  const colors = gradientMap[variantColor];

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r px-3 py-2 text-[11px] font-bold text-white transition-all duration-200 transform active:scale-[0.96] hover:brightness-110 shadow-md",
        colors.gradient,
        colors.shadow,
        colors.glow,
        className
      )}
    >
      <Icon className="h-3 w-3" />
      {children}
    </button>
  );
}

function ExportToolbar({ records, title }: { records: Order[]; title: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="flex flex-wrap gap-2">
      <ExportToolbarButton
        onClick={() =>
          downloadBlob(
            `${title.replaceAll(" ", "-").toLowerCase()}.csv`,
            buildCsv(records),
            "text/csv;charset=utf-8",
          )
        }
        variantColor="violet"
        icon={FileSpreadsheet}
      >
        CSV
      </ExportToolbarButton>

      <ExportToolbarButton
        onClick={() =>
          downloadBlob(
            `${title.replaceAll(" ", "-").toLowerCase()}.xls`,
            buildExcel(records),
            "application/vnd.ms-excel;charset=utf-8",
          )
        }
        variantColor="emerald"
        icon={FileSpreadsheet}
      >
        Excel
      </ExportToolbarButton>

      <ExportToolbarButton
        onClick={() => downloadPDF(title, records)}
        variantColor="rose"
        icon={Download}
      >
        PDF
      </ExportToolbarButton>

      <ExportToolbarButton
        onClick={() => {
          if (records.length === 0) {
            navigator.clipboard.writeText("No orders to display.");
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            return;
          }

          const header = `*${title} (${records.length} records)*\nGenerated on ${new Date().toLocaleDateString()}\n----------------------------------------\n`;
          const lines = records.map((record) => {
            const waybill = record.waybillNumber;
            const orderNum = record.orderNumber;
            const customer = record.customerName;
            const price = record.price;
            const courier = record.courier;
            const status = getOrderStatusLabel(record.status);
            return `• *Order:* ${orderNum} (${waybill})\n  👤 ${customer} | 📞 ${record.contact}\n  💰 Rs. ${price.toLocaleString()} | 🚚 ${courier}\n  📍 ${record.city}, ${record.district}\n  📦 Status: ${status}`;
          });
          const text = `${header}${lines.join("\n\n")}`;

          navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
        variantColor={copied ? "emerald" : "teal"}
        icon={Share2}
        className={copied ? "bg-emerald-600 hover:bg-emerald-500 text-white font-semibold dark:bg-emerald-600 dark:hover:bg-emerald-500 border-transparent shadow-[0_0_12px_rgba(16,185,129,0.3)]" : ""}
      >
        {copied ? "Copied! ✓" : "WhatsApp"}
      </ExportToolbarButton>

      <ExportToolbarButton
        onClick={() => openPrint(`${title} - Print`, records)}
        variantColor="blue"
        icon={Printer}
      >
        Print
      </ExportToolbarButton>
    </div>
  );
}

/* ─── Premium Bulk Action Dropdown Component ────────────── */
function BulkActionDropdown({
  label,
  options,
  onSelect,
  icon: Icon,
}: {
  label: string;
  options: { value: string; label: string; color?: string }[];
  onSelect: (value: string) => void;
  icon: any;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { dark } = useThemeMode();

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  return (
    <div ref={containerRef} className="relative select-none animate-fadeIn">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "inline-flex items-center justify-between gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all duration-200 cursor-pointer select-none border",
          "hover:shadow-md active:scale-[0.98]",
          dark
            ? "border-white/10 bg-slate-800/90 text-white hover:border-violet-500/40 hover:bg-slate-800"
            : "border-slate-200 bg-white text-slate-800 hover:border-violet-400/50 hover:bg-slate-50",
          isOpen && (dark ? "border-violet-500/50 shadow-lg shadow-violet-500/10" : "border-violet-400/60 shadow-lg shadow-violet-500/10")
        )}
      >
        <Icon className="h-3.5 w-3.5 text-violet-500 dark:text-violet-400" />
        <span>{label}</span>
        <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform duration-300", isOpen && "rotate-180")} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "absolute top-full mt-2 left-0 z-50 w-52 rounded-2xl border p-2 shadow-xl backdrop-blur-md max-h-60 overflow-y-auto",
              dark ? "bg-slate-950 border-white/10 text-white" : "bg-white border-slate-200 text-slate-800"
            )}
          >
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onSelect(opt.value);
                  setIsOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-left transition-colors",
                  dark ? "hover:bg-white/5 text-slate-300 hover:text-white" : "hover:bg-slate-100 text-slate-700 hover:text-slate-950"
                )}
              >
                {opt.color && (
                  <span
                    className="h-1.5 w-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: opt.color }}
                  />
                )}
                {opt.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── All Orders Main Component ────────────────────────── */
export default function AllOrdersPage() {
  const { dark } = useThemeMode();
  const [orderList, setOrderList] = useState<typeof orders>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const orderListRef = useRef<typeof orders>([]);

  // Synchronize ref with latest state to prevent stale closures in listeners
  useEffect(() => {
    orderListRef.current = orderList;
  }, [orderList]);

  // Load from localStorage on mount & listen to storage events
  useEffect(() => {
    const loadOrders = () => {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("eeco-care-pos-orders");
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            const migrated = parsed.map((o: any) => {
              let pStatus = o.packingStatus;
              if (pStatus === "unpacked") pStatus = "Ordered";
              else if (pStatus === "packed") pStatus = "Packed";
              else if (pStatus === "dispatched") pStatus = "Dispatched";
              return {
                ...o,
                packingStatus: (pStatus || "Ordered") as "Ordered" | "Packed" | "Dispatched",
              };
            });
            
            // Prevent reference-based infinite loops by strictly comparing parsed content
            if (JSON.stringify(migrated) !== JSON.stringify(orderListRef.current)) {
              setOrderList(migrated);
            }
            setIsInitialized(true);
            return;
          } catch (e) {
            console.error("Failed to parse orders:", e);
          }
        }
        
        // Fallback: start with empty array if no orders exist
        if (JSON.stringify([]) !== JSON.stringify(orderListRef.current)) {
          setOrderList([]);
        }
        localStorage.setItem("eeco-care-pos-orders", "[]");
        setIsInitialized(true);
      }
    };

    loadOrders();
    window.addEventListener("storage", loadOrders);
    return () => window.removeEventListener("storage", loadOrders);
  }, []);

  // Save to localStorage when orderList changes
  useEffect(() => {
    if (isInitialized && typeof window !== "undefined") {
      localStorage.setItem("eeco-care-pos-orders", JSON.stringify(orderList));
    }
  }, [orderList, isInitialized]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [courierFilter, setCourierFilter] = useState("");
  const [urgentFilter, setUrgentFilter] = useState("");
  const [quickFilter, setQuickFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewOrder, setViewOrder] = useState<typeof orders[0] | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [orderToEdit, setOrderToEdit] = useState<typeof orders[0] | null>(null);
  const [opsOpen, setOpsOpen] = useState(false);
  const [activeOpsFilter, setActiveOpsFilter] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);

  // Clear selection when search or filters change to prevent accidental bulk updates
  useEffect(() => {
    setSelectedIds([]);
  }, [search, statusFilter, courierFilter, urgentFilter, quickFilter, activeOpsFilter]);

  // Read query params on mount to support incoming links from Dashboard Operations Overview
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const opsFilterParam = params.get("opsFilter");
      if (opsFilterParam) {
        setActiveOpsFilter(opsFilterParam);
        setOpsOpen(true);
        // Clear query parameters so reloading the page doesn't lock the filter
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      }
    }
  }, []);

  // Dynamic calculations from live orderList for PageBanner and chips
  const statsCounts = useMemo(() => {
    const all = orderList.length;
    const active = orderList.filter(o => !["delivered", "failed", "cancelled"].includes(o.status)).length;
    const delivered = orderList.filter(o => o.status === "delivered").length;
    const returns = orderList.filter(o => ["failed", "cancelled", "return_requested", "return_ho", "return_client"].includes(o.status)).length;
    return { all, active, delivered, returns };
  }, [orderList]);

  // Operations cards calculations from live orderList (Delivered, Rescheduled, Urgent, Failed, Cancelled, Return, ReturnReq, Problems)
  const operationsCardsData = useMemo(() => {
    const deliveredOrders = orderList.filter(o => o.status === "delivered");
    const rescheduledOrders = orderList.filter(o => o.status.startsWith("rescheduled"));
    const urgentOrders = orderList.filter(o => ["high", "critical"].includes(o.urgentLevel));
    const failedOrders = orderList.filter(o => o.status === "failed");
    const cancelledOrders = orderList.filter(o => o.status === "cancelled");
    const returnOrders = orderList.filter(o => ["return_ho", "return_client"].includes(o.status));
    const returnReqOrders = orderList.filter(o => o.status === "return_requested");
    const problemOrders = orderList.filter(o => o.status === "failed" || o.urgentLevel === "critical");

    return [
      { key: "delivered", label: "Delivered Orders", count: deliveredOrders.length, revenue: deliveredOrders.reduce((s, o) => s + o.price, 0), change: 12.0, color: "#10B981" },
      { key: "rescheduled", label: "Rescheduled Orders", count: rescheduledOrders.length, revenue: rescheduledOrders.reduce((s, o) => s + o.price, 0), change: -4.2, color: "#F59E0B" },
      { key: "urgent", label: "Urgent Orders", count: urgentOrders.length, revenue: urgentOrders.reduce((s, o) => s + o.price, 0), change: 15.3, color: "#F97316" },
      { key: "failed", label: "Failed Deliveries", count: failedOrders.length, revenue: failedOrders.reduce((s, o) => s + o.price, 0), change: -22.0, color: "#EF4444" },
      { key: "cancelled", label: "Cancelled Orders", count: cancelledOrders.length, revenue: cancelledOrders.reduce((s, o) => s + o.price, 0), change: -8.6, color: "#EF4444" },
      { key: "return", label: "Return Orders", count: returnOrders.length, revenue: returnOrders.reduce((s, o) => s + o.price, 0), change: 3.1, color: "#8B5CF6" },
      { key: "returnReq", label: "Return Requested", count: returnReqOrders.length, revenue: returnReqOrders.reduce((s, o) => s + o.price, 0), change: 7.8, color: "#A855F7" },
      { key: "problems", label: "Active Problems", count: problemOrders.length, revenue: problemOrders.reduce((s, o) => s + o.price, 0), change: -33.0, color: "#3B82F6" },
    ];
  }, [orderList]);

  const filtered = useMemo(() => {
    return orderList.filter((o) => {
      const q = search.toLowerCase();
      const matchSearch = !q || o.orderNumber.toLowerCase().includes(q) || o.customerName.toLowerCase().includes(q) || o.waybillNumber.toLowerCase().includes(q) || o.contact.includes(q);
      const matchStatus = !statusFilter || o.status === statusFilter;
      const matchCourier = !courierFilter || o.courier === courierFilter;
      const matchUrgent = !urgentFilter || o.urgentLevel === urgentFilter;

      let matchQuick = true;
      if (quickFilter === "active") {
        matchQuick = !["delivered", "failed", "cancelled"].includes(o.status);
      } else if (quickFilter === "delivered") {
        matchQuick = o.status === "delivered";
      } else if (quickFilter === "returns") {
        matchQuick = ["failed", "cancelled", "return_requested", "return_ho", "return_client"].includes(o.status);
      }

      let matchOps = true;
      if (activeOpsFilter) {
        if (activeOpsFilter === "delivered") matchOps = o.status === "delivered";
        else if (activeOpsFilter === "rescheduled") matchOps = o.status.startsWith("rescheduled");
        else if (activeOpsFilter === "urgent") matchOps = ["high", "critical"].includes(o.urgentLevel);
        else if (activeOpsFilter === "failed") matchOps = o.status === "failed";
        else if (activeOpsFilter === "cancelled") matchOps = o.status === "cancelled";
        else if (activeOpsFilter === "return") matchOps = ["return_ho", "return_client"].includes(o.status);
        else if (activeOpsFilter === "returnReq") matchOps = o.status === "return_requested";
        else if (activeOpsFilter === "problems") matchOps = o.status === "failed" || o.urgentLevel === "critical";
      }

      return matchSearch && matchStatus && matchCourier && matchUrgent && matchQuick && matchOps;
    });
  }, [search, statusFilter, courierFilter, urgentFilter, quickFilter, activeOpsFilter, orderList]);

  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const getStatusColor = (status: string) => ORDER_STATUSES.find((s) => s.value === status)?.color || "#6B7280";
  const getStatusLabel = (status: string) => ORDER_STATUSES.find((s) => s.value === status)?.label || status;
  const getUrgentColor = (level: string) => URGENT_LEVELS.find((u) => u.value === level)?.color || "#6B7280";
  const getUrgentLabel = (level: string) => URGENT_LEVELS.find((u) => u.value === level)?.label || level;

  const getRowClass = (o: typeof orders[0]) => {
    if (o.status === "return_client") return dark ? "bg-red-900/20 border-l-4 border-red-800" : "bg-red-50 border-l-4 border-red-700";
    if (o.status === "return_ho") return dark ? "bg-red-900/15 border-l-4 border-red-600" : "bg-red-50/80 border-l-4 border-red-600";
    if (o.status === "return_requested") return dark ? "bg-purple-900/15 border-l-4 border-purple-600" : "bg-purple-50 border-l-4 border-purple-500";
    if (o.status.startsWith("rescheduled")) return dark ? "bg-yellow-900/10 border-l-4 border-yellow-500" : "bg-yellow-50 border-l-4 border-yellow-400";
    if (o.status === "failed") return dark ? "bg-red-900/10 border-l-4 border-red-500" : "bg-red-50/60 border-l-4 border-red-400";
    if (o.urgentLevel === "critical") return dark ? "bg-orange-900/10 border-l-4 border-orange-500" : "bg-orange-50 border-l-4 border-orange-400";
    return "border-l-4 border-transparent";
  };

  return (
    <AppShell
      title="All Orders"
      description={`${statsCounts.active} active operations out of ${statsCounts.all} total orders`}
      variant="gradient"
      customIcon={<Truck className="h-5 w-5 text-white" />}
    >
      <div className="space-y-6">

        {/* ─── Premium Collapsible Operations Overview ──────── */}
        <section className="space-y-3">
          {/* Toggle button */}
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
            {/* Subtle shimmer sweep when collapsed */}
            {!opsOpen && (
              <span className="absolute inset-0 -translate-x-full animate-[shimmer_2.5s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/8 to-transparent" />
            )}
            {!opsOpen && (
              <span className="absolute inset-0 rounded-3xl animate-pulse bg-gradient-to-r from-violet-500/5 via-blue-500/10 to-violet-500/5" />
            )}

            <div className="flex items-center gap-3 z-10 relative">
              {/* Icon badge */}
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {operationsCardsData.map((card, idx) => {
                      const Icon = operationsIconMap[card.key] ?? Package;
                      const isPositive = card.change >= 0;
                      const grad = operationsCardGradients[card.key] ?? operationsCardGradients.problems;
                      // Clamp a fake progress bar width based on count vs max count
                      const maxCount = Math.max(...operationsCardsData.map(c => c.count), 1);
                      const barPct = Math.round((card.count / maxCount) * 100);

                      return (
                        <motion.button
                          key={card.key}
                          onClick={() => { setActiveOpsFilter(activeOpsFilter === card.key ? null : card.key); setPage(0); }}
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.35, delay: idx * 0.04, ease: "easeOut" }}
                          className={cn(
                            "relative text-left overflow-hidden rounded-3xl border p-5 flex flex-col justify-between min-h-[160px] transition-all duration-300 group/card cursor-pointer active:scale-95",
                            activeOpsFilter === card.key
                              ? (dark ? "border-violet-500 bg-slate-800 shadow-[0_0_15px_rgba(139,92,246,0.3)] ring-1 ring-violet-500" : "border-violet-400 bg-violet-50/50 shadow-[0_0_15px_rgba(139,92,246,0.2)] ring-1 ring-violet-400")
                              : (dark ? "border-white/10 bg-slate-900/80 hover:border-white/20 hover:bg-slate-800" : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md hover:bg-slate-50")
                          )}
                          style={{
                            boxShadow: dark && activeOpsFilter !== card.key ? `0 4px 24px ${grad.glow}` : undefined,
                          }}
                        >
                          {/* Gradient top accent strip */}
                          <div className={cn("absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r", grad.top)} />

                          {/* Faint background gradient bloom */}
                          <div
                            className="absolute inset-0 opacity-[0.04] pointer-events-none"
                            style={{ background: `radial-gradient(ellipse at top left, ${card.color}, transparent 70%)` }}
                          />

                          {/* Hover cursor glow */}
                          <div
                            className="absolute inset-0 rounded-3xl opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 pointer-events-none"
                            style={{ background: `radial-gradient(200px circle at 30% 40%, ${grad.glow}, transparent 70%)` }}
                          />

                          {/* Header: label + icon badge */}
                          <div className="relative z-10 flex items-start justify-between">
                            <span className={cn("text-[10px] font-bold uppercase tracking-[0.08em] leading-tight max-w-[120px]", dark ? "text-slate-400" : "text-slate-500")}>
                              {card.label}
                            </span>
                            <div className={cn(
                              "flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br shadow-md transition-transform duration-300 group-hover/card:scale-110 shrink-0",
                              grad.icon
                            )}>
                              <Icon className="h-4 w-4 text-white" />
                            </div>
                          </div>

                          {/* Count + revenue */}
                          <div className="relative z-10 mt-3">
                            <div className="flex items-baseline gap-1.5">
                              <span className={cn("text-[2rem] font-extrabold tracking-tight leading-none", dark ? "text-white" : "text-slate-900")}>
                                {card.count}
                              </span>
                              <span className={cn("text-xs font-semibold", dark ? "text-slate-500" : "text-slate-400")}>
                                orders
                              </span>
                            </div>
                            <div className={cn("mt-1 text-xs font-bold", dark ? "text-slate-300" : "text-slate-600")}>
                              Rs. {card.revenue.toLocaleString()}
                            </div>
                          </div>

                          {/* Progress bar */}
                          <div className="relative z-10 mt-3">
                            <div className={cn("h-1.5 w-full rounded-full overflow-hidden", dark ? "bg-white/8" : "bg-slate-100")}>
                              <div
                                className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-700", grad.top)}
                                style={{ width: `${barPct}%` }}
                              />
                            </div>
                          </div>

                          {/* Trend badge */}
                          <div className="relative z-10 mt-2.5 flex items-center justify-between">
                            <span className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold",
                              isPositive ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"
                            )}>
                              <span className="text-[9px]">{isPositive ? "▲" : "▼"}</span>
                              {Math.abs(card.change).toFixed(1)}% vs last month
                            </span>
                          </div>

                          {/* Bottom shimmer line on hover */}
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

        {/* Toolbar Wrapper with Search & Filters */}
        <div className="space-y-4">
          <div className={cn("flex flex-col gap-3 rounded-3xl border p-5 md:flex-row md:items-center md:justify-between transition-all duration-300 shadow-sm", dark ? "border-white/10 bg-slate-900/80 backdrop-blur-md" : "border-slate-200 bg-white")}>
            <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
              <SearchBar
                value={search}
                onChange={(val) => { setSearch(val); setPage(0); }}
                placeholder="Search waybill, order number, customer, or contact..."
              />
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  "rounded-2xl p-3 transition-all duration-300 transform active:scale-95 shadow-sm border flex items-center justify-center shrink-0 w-11 h-11",
                  showFilters
                    ? "bg-violet-600 text-white border-transparent shadow-violet-600/20"
                    : dark
                      ? "bg-slate-800 text-slate-300 hover:bg-slate-700 border-white/5"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200"
                )}
              >
                <Filter className="h-4 w-4" />
              </button>
            </div>

            {selectedIds.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2 justify-end w-full md:w-auto">
                <div className="flex items-center gap-1.5 mr-2 shrink-0 bg-violet-500/10 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 px-3 py-1.5 rounded-2xl text-xs font-bold shadow-sm">
                  <span>{selectedIds.length} Selected</span>
                  <button
                    type="button"
                    onClick={() => setSelectedIds([])}
                    className="ml-1 text-[10px] uppercase tracking-wider hover:underline hover:text-violet-500 transition-all"
                  >
                    Clear
                  </button>
                </div>
                
                <BulkActionDropdown
                  label="Status"
                  icon={Truck}
                  options={ORDER_STATUSES.map(s => ({ value: s.value, label: s.label, color: s.color }))}
                  onSelect={(newStatus) => {
                    const statusLabel = getOrderStatusLabel(newStatus);
                    setOrderList(prev =>
                      prev.map(o =>
                        selectedIds.includes(o.id)
                          ? { ...o, status: newStatus as any, lastAction: `Status bulk-updated to ${statusLabel}` }
                          : o
                      )
                    );
                    setSelectedIds([]);
                  }}
                />

                <BulkActionDropdown
                  label="Courier"
                  icon={Package}
                  options={COURIERS.map(c => ({ value: c.name, label: c.name }))}
                  onSelect={(newCourier) => {
                    setOrderList(prev =>
                      prev.map(o =>
                        selectedIds.includes(o.id)
                          ? { ...o, courier: newCourier, lastAction: `Courier bulk-updated to ${newCourier}` }
                          : o
                      )
                    );
                    setSelectedIds([]);
                  }}
                />

                <BulkActionDropdown
                  label="Urgency"
                  icon={AlertTriangle}
                  options={URGENT_LEVELS.map(u => ({ value: u.value, label: u.label, color: u.color }))}
                  onSelect={(newUrgency) => {
                    const urgencyLabel = getUrgentLabel(newUrgency);
                    setOrderList(prev =>
                      prev.map(o =>
                        selectedIds.includes(o.id)
                          ? { ...o, urgentLevel: newUrgency, lastAction: `Urgency bulk-updated to ${urgencyLabel}` }
                          : o
                      )
                    );
                    setSelectedIds([]);
                  }}
                />

                {hasPermission("orders_delete") && (
                  <button
                    type="button"
                    onClick={() => setConfirmBulkDelete(true)}
                    className="inline-flex items-center rounded-2xl bg-gradient-to-r from-rose-500 to-red-600 hover:brightness-110 px-4 py-2 text-sm font-semibold text-white transition active:scale-95 shadow-md shadow-rose-600/15 hover:shadow-rose-600/25 shrink-0"
                  >
                    <Trash2 className="mr-2 inline h-4 w-4" />
                    Delete Selected ({selectedIds.length})
                  </button>
                )}

                <ExportToolbar
                  records={orderList.filter(o => selectedIds.includes(o.id))}
                  title={`Selected Orders (${selectedIds.length})`}
                />
              </div>
            ) : (
              <div className="flex flex-col items-end gap-2 shrink-0">
                {hasPermission("orders_write") && (
                  <button
                    onClick={() => {
                      setOrderToEdit(null);
                      setIsAddEditModalOpen(true);
                    }}
                    className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-violet-600/20 transition-all duration-200 hover:shadow-[0_8px_25px_rgba(139,92,246,0.3)] hover:brightness-110 active:scale-[0.97]"
                  >
                    <PlusCircle className="h-4 w-4" /> Add Order
                  </button>
                )}
                <ExportToolbar records={filtered} title="All Orders List" />
              </div>
            )}
          </div>

          {/* Quick-Filter Chips Row */}
          <QuickFilterChips
            selected={quickFilter}
            onChange={(filter) => { setQuickFilter(filter); setPage(0); }}
            counts={statsCounts}
          />
        </div>

        {/* Expandable Advanced Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className={cn("flex flex-wrap gap-3 rounded-3xl border p-5 shadow-sm transition-all", dark ? "border-white/10 bg-slate-900/60" : "border-slate-200 bg-slate-50")}>
                <FilterSelect value={statusFilter} onChange={(v) => { setStatusFilter(v); setPage(0); }} placeholder="All Statuses" options={ORDER_STATUSES.map((s) => ({ value: s.value, label: s.label }))} />
                <FilterSelect value={courierFilter} onChange={(v) => { setCourierFilter(v); setPage(0); }} placeholder="All Couriers" options={COURIERS.map((c) => ({ value: c.name, label: c.name }))} />
                <FilterSelect value={urgentFilter} onChange={(v) => { setUrgentFilter(v); setPage(0); }} placeholder="All Urgency" options={URGENT_LEVELS.map((u) => ({ value: u.value, label: u.label }))} />

                <button
                  onClick={() => {
                    setStatusFilter("");
                    setCourierFilter("");
                    setUrgentFilter("");
                    setSearch("");
                    setQuickFilter("all");
                    setPage(0);
                  }}
                  className={cn(
                    "rounded-2xl px-4 py-2.5 text-xs font-bold transition-all duration-200 active:scale-95 border",
                    dark
                      ? "bg-slate-800 text-slate-300 hover:bg-slate-700 border-white/5"
                      : "bg-slate-200 text-slate-600 hover:bg-slate-300 border-slate-300"
                  )}
                >
                  Clear All
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>



        {/* Table Listing */}
        <div className={cn("rounded-3xl border overflow-hidden transition-all duration-300 shadow-sm", dark ? "border-white/10 bg-slate-900/80" : "border-slate-200 bg-white")}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className={cn("text-left text-[10px] uppercase tracking-wider border-b", dark ? "bg-slate-900/40 text-slate-400 border-white/5" : "bg-slate-50 text-slate-500 border-slate-200")}>
                  <th className="px-4 py-3.5 font-bold w-12 text-center">
                    <input
                      type="checkbox"
                      className="rounded border-slate-300 dark:border-white/10 bg-transparent text-violet-600 focus:ring-violet-500 h-4 w-4 cursor-pointer"
                      checked={paged.length > 0 && paged.every(o => selectedIds.includes(o.id))}
                      ref={el => {
                        if (el) {
                          const someSelected = paged.some(o => selectedIds.includes(o.id));
                          const allSelected = paged.every(o => selectedIds.includes(o.id));
                          el.indeterminate = someSelected && !allSelected;
                        }
                      }}
                      onChange={(e) => {
                        if (e.target.checked) {
                          const visibleIds = paged.map(o => o.id);
                          setSelectedIds(prev => Array.from(new Set([...prev, ...visibleIds])));
                        } else {
                          const visibleIds = paged.map(o => o.id);
                          setSelectedIds(prev => prev.filter(id => !visibleIds.includes(id)));
                        }
                      }}
                    />
                  </th>
                  <th className="px-4 py-3.5 font-bold">Waybill</th>
                  <th className="px-4 py-3.5 font-bold">Order No</th>
                  <th className="px-4 py-3.5 font-bold">Customer</th>
                  <th className="px-4 py-3.5 font-bold">Contact</th>
                  <th className="px-4 py-3.5 font-bold">Price</th>
                  <th className="px-4 py-3.5 font-bold">Courier</th>
                  <th className="px-4 py-3.5 font-bold">Status</th>
                  <th className="px-4 py-3.5 font-bold">Urgent</th>
                  <th className="px-4 py-3.5 font-bold">Last Action</th>
                  <th className="px-4 py-3.5 font-bold text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((o) => (
                  <tr
                    key={o.id}
                    className={cn(
                      "border-t transition-all duration-200",
                      dark
                        ? "border-white/5 hover:bg-white/5"
                        : "border-slate-100 hover:bg-slate-50/70 hover:shadow-inner",
                      getRowClass(o),
                      selectedIds.includes(o.id) && (dark ? "bg-violet-950/20" : "bg-violet-50/40")
                    )}
                  >
                    <td className="px-4 py-4 text-center">
                      <input
                        type="checkbox"
                        className="rounded border-slate-300 dark:border-white/10 bg-transparent text-violet-600 focus:ring-violet-500 h-4 w-4 cursor-pointer"
                        checked={selectedIds.includes(o.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds(prev => [...prev, o.id]);
                          } else {
                            setSelectedIds(prev => prev.filter(id => id !== o.id));
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                    <td className="px-4 py-4 font-mono text-xs font-medium">{o.waybillNumber}</td>
                    <td className="px-4 py-4">
                      <span className={cn("font-bold text-xs", dark ? "text-violet-400" : "text-violet-600")}>
                        {o.orderNumber}
                      </span>
                    </td>
                    <td className="px-4 py-4 font-semibold text-xs">{o.customerName}</td>
                    <td className="px-4 py-4 text-xs font-medium text-slate-500 dark:text-slate-400">{o.contact}</td>
                    <td className="px-4 py-4 font-extrabold text-xs">Rs. {o.price.toLocaleString()}</td>
                    <td className="px-4 py-4 font-semibold text-xs">{o.courier}</td>
                    <td className="px-4 py-4">
                      {hasPermission("orders_write") ? (
                        <StatusDropdown
                          value={o.status}
                          onChange={(newStatus) => {
                            setOrderList((prev) =>
                              prev.map((item) =>
                                item.id === o.id ? { ...item, status: newStatus as any, lastAction: `Status updated to ${getStatusLabel(newStatus)}` } : item
                              )
                            );
                          }}
                        />
                      ) : (
                        <span
                          className="relative inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold text-white shadow-sm select-none"
                          style={{
                            backgroundImage: `linear-gradient(to right, ${
                              (ORDER_STATUSES.find((s) => s.value === o.status) || { color: "#6B7280" }).color
                            }, ${(ORDER_STATUSES.find((s) => s.value === o.status) || { color: "#6B7280" }).color}CC)`,
                            boxShadow: `0 2px 8px ${(ORDER_STATUSES.find((s) => s.value === o.status) || { color: "#6B7280" }).color}40`,
                          }}
                        >
                          <span className="relative flex h-1.5 w-1.5 shrink-0">
                            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
                          </span>
                          <span>{getOrderStatusLabel(o.status)}</span>
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {o.urgentLevel !== "none" && (
                        <span
                          className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-[9px] font-bold text-white uppercase tracking-wider", o.urgentLevel === "critical" && "animate-pulse")}
                          style={{ backgroundColor: getUrgentColor(o.urgentLevel) }}
                        >
                          {getUrgentLabel(o.urgentLevel)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 max-w-[200px] truncate text-xs font-medium text-slate-500 dark:text-slate-400">{o.lastAction}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setViewOrder(o)}
                          className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 hover:brightness-110 shadow-md shadow-teal-500/15 hover:shadow-[0_4px_12px_rgba(20,184,166,0.25)] px-2.5 py-[6px] text-[11px] font-bold text-white transition-all duration-200 active:scale-[0.96] transform"
                        >
                          <Eye className="h-3 w-3" />
                          View
                        </button>
                        {hasPermission("orders_write") && (
                          <button
                            type="button"
                            onClick={() => {
                              setOrderToEdit(o);
                              setIsAddEditModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 hover:brightness-110 shadow-md shadow-violet-600/15 hover:shadow-[0_4px_12px_rgba(139,92,246,0.25)] px-2.5 py-[6px] text-[11px] font-bold text-white transition-all duration-200 active:scale-[0.96] transform"
                          >
                            <Pencil className="h-3 w-3" />
                            Edit
                          </button>
                        )}
                        {hasPermission("orders_delete") && (
                          <button
                            type="button"
                            onClick={() => setDeleteId(o.id)}
                            className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:brightness-110 shadow-md shadow-rose-500/15 hover:shadow-[0_4px_12px_rgba(244,63,94,0.25)] px-2.5 py-[6px] text-[11px] font-bold text-white transition-all duration-200 active:scale-[0.96] transform"
                          >
                            <Trash2 className="h-3 w-3" />
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {paged.length === 0 && (
                  <tr>
                    <td colSpan={11} className="px-4 py-16 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <AlertCircle className="h-8 w-8 text-slate-500 animate-bounce" />
                        <span className="font-semibold text-sm">No orders found matching the filters</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className={cn("flex items-center justify-between border-t px-5 py-4", dark ? "border-white/5" : "border-slate-100")}>
            <span className="text-xs font-semibold text-slate-400">
              Showing {filtered.length === 0 ? 0 : page * PAGE_SIZE + 1}-{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
                className={cn(
                  "rounded-xl p-2 transition-all disabled:opacity-30 border",
                  dark ? "hover:bg-slate-800 border-white/5 text-slate-300" : "hover:bg-slate-100 border-slate-200 text-slate-600"
                )}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                {page + 1} / {totalPages || 1}
              </span>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage(page + 1)}
                className={cn(
                  "rounded-xl p-2 transition-all disabled:opacity-30 border",
                  dark ? "hover:bg-slate-800 border-white/5 text-slate-300" : "hover:bg-slate-100 border-slate-200 text-slate-600"
                )}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      <AnimatePresence>
        {deleteId && (
          <ConfirmationModal
            title="Delete Order"
            message="Are you sure you want to delete this order? This action cannot be undone."
            confirmLabel="Delete"
            onConfirm={() => {
              setOrderList((prev) => prev.filter((o) => o.id !== deleteId));
              setDeleteId(null);
            }}
            onClose={() => setDeleteId(null)}
          />
        )}
      </AnimatePresence>

      {/* View Modal */}
      <AnimatePresence>
        {viewOrder && (
          <ViewOrderModal
            order={viewOrder}
            onClose={() => setViewOrder(null)}
          />
        )}
      </AnimatePresence>

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {isAddEditModalOpen && (
          <AddEditOrderModal
            orderToEdit={orderToEdit}
            onClose={() => {
              setIsAddEditModalOpen(false);
              setOrderToEdit(null);
            }}
            onSave={(savedData) => {
              if (orderToEdit) {
                setOrderList((prev) =>
                  prev.map((o) =>
                    o.id === orderToEdit.id ? { ...o, ...savedData } : o
                  )
                );
              } else {
                const newOrder = {
                  ...savedData,
                  id: `ORD-${Date.now()}`,
                  createdAt: new Date().toLocaleDateString(),
                  lastActionDate: new Date().toLocaleDateString(),
                  packingStatus: "Ordered",
                } as any;
                setOrderList((prev) => [newOrder, ...prev]);
              }
              setIsAddEditModalOpen(false);
              setOrderToEdit(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Bulk Delete Modal */}
      <AnimatePresence>
        {confirmBulkDelete && (
          <ConfirmationModal
            title="Bulk Delete Orders"
            message={`Are you sure you want to delete the ${selectedIds.length} selected orders? This action is permanent and cannot be undone.`}
            confirmLabel="Delete All"
            onConfirm={() => {
              setOrderList((prev) => prev.filter((o) => !selectedIds.includes(o.id)));
              setSelectedIds([]);
              setConfirmBulkDelete(false);
            }}
            onClose={() => setConfirmBulkDelete(false)}
          />
        )}
      </AnimatePresence>

    </AppShell>
  );
}
