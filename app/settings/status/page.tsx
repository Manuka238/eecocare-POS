"use client";
import { useState, useEffect } from "react";
import { AppShell } from "@/components/app-shell";
import { useThemeMode } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import { ORDER_STATUSES } from "@/lib/crh-data";
import { GripVertical, PlusCircle, Pencil, Trash2, X } from "lucide-react";
import { ConfirmationModal } from "@/components/ui";
import { AnimatePresence, motion } from "framer-motion";

interface StatusItem {
  value: string;
  label: string;
  color: string;
  index?: number;
}

export default function StatusConfigPage() {
  const { dark } = useThemeMode();
  const [statusList, setStatusList] = useState<StatusItem[]>([]);
  const [deleteValue, setDeleteValue] = useState<string | null>(null);

  // Add & Edit modal states
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [statusToEdit, setStatusToEdit] = useState<StatusItem | null>(null);

  const [formLabel, setFormLabel] = useState("");
  const [formValue, setFormValue] = useState("");
  const [formColor, setFormColor] = useState("#6B7280");
  const [formIndex, setFormIndex] = useState<number>(0);

  // Load and persist states
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("system_statuses");
      if (stored) {
        try {
          setStatusList(JSON.parse(stored));
        } catch (e) {
          console.error("Failed to parse system_statuses", e);
        }
      } else {
        const initial = ORDER_STATUSES.map((s, idx) => ({
          value: s.value,
          label: s.label,
          color: s.color,
          index: idx,
        }));
        setStatusList(initial);
        localStorage.setItem("system_statuses", JSON.stringify(initial));
      }
    }
  }, []);

  const updateStatuses = (newStatuses: StatusItem[]) => {
    // Sort by index
    const sorted = [...newStatuses].sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
    setStatusList(sorted);
    if (typeof window !== "undefined") {
      localStorage.setItem("system_statuses", JSON.stringify(sorted));
    }
  };

  const handleSaveStatus = () => {
    if (!formLabel.trim()) {
      alert("Please enter a status label!");
      return;
    }

    const calculatedValue = formValue.trim() || formLabel.trim().toLowerCase().replace(/\s+/g, "_");

    if (statusToEdit) {
      // Edit
      const updated = statusList.map((s) =>
        s.value === statusToEdit.value
          ? {
              value: calculatedValue,
              label: formLabel.trim(),
              color: formColor.trim(),
              index: Number(formIndex),
            }
          : s
      );
      updateStatuses(updated);
    } else {
      // Add
      const newStatus: StatusItem = {
        value: calculatedValue,
        label: formLabel.trim(),
        color: formColor.trim(),
        index: Number(formIndex),
      };
      updateStatuses([...statusList, newStatus]);
    }

    setShowAddEditModal(false);
    setStatusToEdit(null);
  };

  const labelCls = cn("block text-xs font-semibold mb-1.5", dark ? "text-slate-400" : "text-slate-500");
  const inputCls = cn("w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors", dark ? "border-white/10 bg-slate-800 text-white focus:border-violet-500" : "border-slate-200 bg-slate-50 text-slate-900 focus:border-violet-500");

  return (
    <AppShell title="Status Configuration" description="Configure order status workflow">
      <div className="space-y-4">
        <div className="flex justify-end">
          <button
            onClick={() => {
              setStatusToEdit(null);
              setFormLabel("");
              setFormValue("");
              setFormColor("#6B7280");
              setFormIndex(statusList.length);
              setShowAddEditModal(true);
            }}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl hover:brightness-110 active:scale-95"
          >
            <PlusCircle className="h-4 w-4" /> Add Status
          </button>
        </div>

        <div className={cn("rounded-3xl border overflow-hidden", dark ? "border-white/10 bg-slate-900/80" : "border-slate-200 bg-white")}>
          {statusList.map((s, i) => (
            <div
              key={s.value}
              className={cn(
                "flex items-center gap-4 px-5 py-3.5 border-b transition-colors flex-wrap sm:flex-nowrap",
                dark ? "border-white/5 hover:bg-white/5" : "border-slate-100 hover:bg-slate-50",
                i === statusList.length - 1 && "border-b-0"
              )}
            >
              <GripVertical className="h-4 w-4 text-slate-400 cursor-grab shrink-0" />
              <span className="flex h-4 w-4 rounded-full shrink-0 animate-pulse" style={{ backgroundColor: s.color }} />
              <span className="flex-1 font-semibold text-sm min-w-[120px]">{s.label}</span>
              <span
                className="inline-flex rounded-full px-3 py-1 text-xs font-semibold text-white shadow-sm shrink-0"
                style={{ backgroundColor: s.color }}
              >
                {s.label}
              </span>
              <span className={cn("font-mono text-xs shrink-0", dark ? "text-slate-500" : "text-slate-400")}>
                {s.color}
              </span>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-mono shrink-0",
                  dark ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-500"
                )}
              >
                Order #{s.index ?? i + 1}
              </span>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 ml-auto pl-4">
                <button
                  type="button"
                  onClick={() => {
                    setStatusToEdit(s);
                    setFormLabel(s.label);
                    setFormValue(s.value);
                    setFormColor(s.color);
                    setFormIndex(s.index ?? i);
                    setShowAddEditModal(true);
                  }}
                  className="rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 hover:brightness-110 shadow-sm p-1.5 text-white active:scale-95 transition"
                  title="Edit Status"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteValue(s.value)}
                  className="rounded-lg bg-gradient-to-r from-rose-500 to-red-650 hover:brightness-110 shadow-sm p-1.5 text-white active:scale-95 transition"
                  title="Delete Status"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
          {statusList.length === 0 && (
            <div className="py-12 text-center text-slate-400 opacity-60">
              No order statuses configured
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {showAddEditModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowAddEditModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={cn(
                "max-w-md w-full rounded-3xl p-6 shadow-2xl relative overflow-hidden",
                dark ? "bg-slate-900 border border-white/10" : "bg-white border border-slate-200"
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-violet-600 to-blue-600" />

              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold">
                  {statusToEdit ? "Edit Status Color & Workflow" : "Add Status Workflow"}
                </h3>
                <button
                  onClick={() => setShowAddEditModal(false)}
                  className="text-slate-400 hover:text-slate-250"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3.5">
                <div>
                  <label className={labelCls}>Status Label *</label>
                  <input
                    value={formLabel}
                    onChange={(e) => setFormLabel(e.target.value)}
                    className={inputCls}
                    placeholder="e.g. Received at warehouse"
                  />
                </div>
                <div>
                  <label className={labelCls}>Unique Value Code</label>
                  <input
                    value={formValue}
                    onChange={(e) => setFormValue(e.target.value)}
                    className={inputCls}
                    placeholder="e.g. received_warehouse (leave empty to auto-generate)"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Theme Hex Color *</label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={formColor}
                        onChange={(e) => setFormColor(e.target.value)}
                        className="h-9 w-9 rounded-lg border-0 bg-transparent cursor-pointer"
                      />
                      <input
                        value={formColor}
                        onChange={(e) => setFormColor(e.target.value)}
                        className={cn(inputCls, "flex-1 font-mono uppercase text-xs")}
                        placeholder="#6B7280"
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Workflow Index</label>
                    <input
                      type="number"
                      value={formIndex}
                      onChange={(e) => setFormIndex(Number(e.target.value))}
                      className={inputCls}
                      placeholder="e.g. 5"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setShowAddEditModal(false)}
                  className={cn(
                    "rounded-xl px-4 py-2.5 text-xs font-semibold",
                    dark ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-slate-100 text-slate-650 hover:bg-slate-200"
                  )}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveStatus}
                  className="rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-600/15 hover:brightness-110 active:scale-95 transition"
                >
                  Save
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteValue && (
          <ConfirmationModal
            title="Delete Status Workflow"
            message="Are you sure you want to delete this status workflow state? Active orders currently set to this status will remain, but the status key will no longer appear in filter drop-downs."
            confirmLabel="Delete"
            onConfirm={() => {
              updateStatuses(statusList.filter((s) => s.value !== deleteValue));
              setDeleteValue(null);
            }}
            onClose={() => setDeleteValue(null)}
          />
        )}
      </AnimatePresence>
    </AppShell>
  );
}
