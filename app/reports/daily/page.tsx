"use client";
import { AppShell } from "@/components/app-shell";
import { useThemeMode } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import { dailyReportData } from "@/lib/crh-data";
import { FilteredStatCard } from "@/components/filtered-orders";
import { Package, CheckCircle, RefreshCw, XCircle, RotateCcw, DollarSign, Phone, MessageCircle, ArrowUpCircle, Paperclip, Download, FileSpreadsheet } from "lucide-react";

export default function DailyReportPage() {
  const { dark } = useThemeMode();
  const d = dailyReportData;
  return (
    <AppShell title="Daily Report" description={`Operational summary for ${d.date}`}>
      <div className="space-y-6">
        <div className="flex items-center gap-3 justify-end">
          <button className={cn("flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors", dark ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}><Download className="h-4 w-4" /> Export PDF</button>
          <button className={cn("flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors", dark ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}><FileSpreadsheet className="h-4 w-4" /> Export Excel</button>
        </div>
        {/* Order Summary */}
        <div>
          <h3 className="font-semibold mb-3">Order Summary</h3>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <FilteredStatCard title="Total Orders" value={d.summary.totalOrders} accent="#3B82F6" icon={<Package className="h-5 w-5" />} />
            <FilteredStatCard title="Delivered" value={d.summary.delivered} accent="#10B981" icon={<CheckCircle className="h-5 w-5" />} />
            <FilteredStatCard title="Rescheduled" value={d.summary.rescheduled} accent="#EAB308" icon={<RefreshCw className="h-5 w-5" />} />
            <FilteredStatCard title="Failed" value={d.summary.failed} accent="#EF4444" icon={<XCircle className="h-5 w-5" />} />
          </div>
        </div>
        {/* Financial */}
        <div>
          <h3 className="font-semibold mb-3">Financial Impact</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <FilteredStatCard title="Delivered Value" value={`Rs. ${d.financial.deliveredValue.toLocaleString()}`} accent="#10B981" icon={<DollarSign className="h-5 w-5" />} />
            <FilteredStatCard title="Return Value" value={`Rs. ${d.financial.returnValue.toLocaleString()}`} accent="#EF4444" icon={<RotateCcw className="h-5 w-5" />} />
            <FilteredStatCard title="Prevented Losses" value={`Rs. ${d.financial.preventedLosses.toLocaleString()}`} accent="#8B5CF6" icon={<DollarSign className="h-5 w-5" />} />
          </div>
        </div>
        {/* CR Activity */}
        <div>
          <h3 className="font-semibold mb-3">CR Activity</h3>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <FilteredStatCard title="Calls Made" value={d.crActivity.callsMade} accent="#3B82F6" icon={<Phone className="h-5 w-5" />} />
            <FilteredStatCard title="Messages Sent" value={d.crActivity.messagesSent} accent="#22C55E" icon={<MessageCircle className="h-5 w-5" />} />
            <FilteredStatCard title="Escalations" value={d.crActivity.courierEscalations} accent="#F97316" icon={<ArrowUpCircle className="h-5 w-5" />} />
            <FilteredStatCard title="Evidence Uploaded" value={d.crActivity.evidenceUploaded} accent="#8B5CF6" icon={<Paperclip className="h-5 w-5" />} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
