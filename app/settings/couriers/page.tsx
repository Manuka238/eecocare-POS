"use client";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { useThemeMode } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import { COURIERS, courierPerformance } from "@/lib/crh-data";
import { Truck, PlusCircle, MapPin, Pencil, Trash2, X } from "lucide-react";
import { ConfirmationModal } from "@/components/ui";
import { AnimatePresence, motion } from "framer-motion";
import { CourierSubNav } from "@/components/courier-sub-nav";

interface CourierItem {
  id: string;
  name: string;
  branches: string[];
  totalOrders: number;
  successRate: number;
}



export default function CouriersPage() {
  const { dark } = useThemeMode();
  const [courierList, setCourierList] = useState<CourierItem[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  // Add & Edit modal states
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [courierToEdit, setCourierToEdit] = useState<CourierItem | null>(null);

  const [formName, setFormName] = useState("");
  const [formBranches, setFormBranches] = useState("");
  const [formTotalOrders, setFormTotalOrders] = useState<number>(0);
  const [formSuccessRate, setFormSuccessRate] = useState<number>(0);

  // Load and persist states
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("system_couriers");
      if (stored) {
        try {
          setCourierList(JSON.parse(stored));
        } catch (e) {
          console.error("Failed to parse system_couriers", e);
        }
      } else {
        const initial: CourierItem[] = COURIERS.map((c) => {
          const perf = courierPerformance.find((p) => p.courier === c.name);
          return {
            id: c.id,
            name: c.name,
            branches: c.branches,
            totalOrders: perf ? perf.totalOrders : 0,
            successRate: perf ? perf.successRate : 0,
          };
        });
        setCourierList(initial);
        localStorage.setItem("system_couriers", JSON.stringify(initial));
      }
    }
  }, []);

  const updateCouriers = (newCouriers: CourierItem[]) => {
    setCourierList(newCouriers);
    if (typeof window !== "undefined") {
      localStorage.setItem("system_couriers", JSON.stringify(newCouriers));
    }
  };

  const handleSaveCourier = () => {
    if (!formName.trim()) {
      alert("Please enter a courier name!");
      return;
    }

    const branchesArr = formBranches
      .split(",")
      .map((b) => b.trim())
      .filter(Boolean);

    if (courierToEdit) {
      // Edit
      const updated = courierList.map((c) =>
        c.id === courierToEdit.id
          ? {
              ...c,
              name: formName.trim(),
              branches: branchesArr,
              totalOrders: Number(formTotalOrders),
              successRate: Number(formSuccessRate),
            }
          : c
      );
      updateCouriers(updated);
    } else {
      // Add
      const newCourier: CourierItem = {
        id: `c-${Date.now()}`,
        name: formName.trim(),
        branches: branchesArr,
        totalOrders: Number(formTotalOrders),
        successRate: Number(formSuccessRate),
      };
      updateCouriers([...courierList, newCourier]);
    }

    setShowAddEditModal(false);
    setCourierToEdit(null);
  };

  const labelCls = cn("block text-xs font-semibold mb-1.5", dark ? "text-slate-400" : "text-slate-500");
  const inputCls = cn("w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors", dark ? "border-white/10 bg-slate-800 text-white focus:border-violet-500" : "border-slate-200 bg-slate-50 text-slate-900 focus:border-violet-500");

  return (
    <AppShell title="Courier Management" description="Manage courier companies and partnerships">
      <div className="space-y-4">
        <CourierSubNav activeTab="couriers" />
        <div className="flex justify-end">
          <button
            onClick={() => {
              setCourierToEdit(null);
              setFormName("");
              setFormBranches("");
              setFormTotalOrders(0);
              setFormSuccessRate(0);
              setShowAddEditModal(true);
            }}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl hover:brightness-110 active:scale-95"
          >
            <PlusCircle className="h-4 w-4" /> Add Courier
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {courierList.map((c) => (
            <div
              key={c.id}
              className={cn(
                "rounded-3xl border p-5 card-hover transition-all flex flex-col justify-between",
                dark ? "border-white/10 bg-slate-900/80 hover:border-white/20" : "border-slate-200 bg-white hover:shadow-md"
              )}
            >
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 p-2.5 text-white">
                    <Truck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold">{c.name}</p>
                    <Link
                      href={`/settings/branches?courier=${encodeURIComponent(c.name)}`}
                      className={cn(
                        "text-xs font-semibold hover:underline hover:text-violet-500 transition-colors",
                        dark ? "text-slate-400" : "text-slate-500"
                      )}
                    >
                      {c.branches.length} branches
                    </Link>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className={cn("rounded-xl p-2.5", dark ? "bg-slate-800" : "bg-slate-50")}>
                    <p className="text-[10px] text-slate-400 uppercase">Orders</p>
                    <p className="font-bold">{c.totalOrders}</p>
                  </div>
                  <div className={cn("rounded-xl p-2.5", dark ? "bg-slate-800" : "bg-slate-50")}>
                    <p className="text-[10px] text-slate-400 uppercase">Success</p>
                    <p
                      className={cn(
                        "font-bold",
                        c.successRate >= 90
                          ? "text-emerald-400"
                          : c.successRate >= 80
                          ? "text-yellow-400"
                          : "text-red-400"
                      )}
                    >
                      {c.successRate}%
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-4">
                  {c.branches.map((b) => (
                    <Link
                      key={b}
                      href={`/settings/branches?courier=${encodeURIComponent(c.name)}`}
                      className={cn(
                        "flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] hover:bg-violet-500/10 hover:text-violet-500 hover:border-violet-500/25 border border-transparent transition-all",
                        dark ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-600"
                      )}
                    >
                      <MapPin className="h-2.5 w-2.5" />
                      {b}
                    </Link>
                  ))}
                  {c.branches.length === 0 && (
                    <span className="text-xs text-slate-500 italic">No branches registered</span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-3 border-t dark:border-white/5 border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setCourierToEdit(c);
                    setFormName(c.name);
                    setFormBranches(c.branches.join(", "));
                    setFormTotalOrders(c.totalOrders);
                    setFormSuccessRate(c.successRate);
                    setShowAddEditModal(true);
                  }}
                  className="flex-1 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 hover:brightness-110 shadow-sm px-3 py-2 text-xs font-semibold text-white transition active:scale-95"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteId(c.id)}
                  className="rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:brightness-110 shadow-sm px-3 py-2 text-xs font-semibold text-white transition active:scale-95"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          {courierList.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-400 opacity-60">
              No courier partners registered
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
                  {courierToEdit ? "Edit Courier Partner" : "Add Courier Partner"}
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
                  <label className={labelCls}>Courier Name *</label>
                  <input
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className={inputCls}
                    placeholder="e.g. Domex Express"
                  />
                </div>
                <div>
                  <label className={labelCls}>Branches (Comma-separated)</label>
                  <input
                    value={formBranches}
                    onChange={(e) => setFormBranches(e.target.value)}
                    className={inputCls}
                    placeholder="e.g. Colombo, Kandy, Galle"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Total Orders</label>
                    <input
                      type="number"
                      value={formTotalOrders}
                      onChange={(e) => setFormTotalOrders(Number(e.target.value))}
                      className={inputCls}
                      placeholder="e.g. 150"
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Success Rate (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={formSuccessRate}
                      onChange={(e) => setFormSuccessRate(Number(e.target.value))}
                      className={inputCls}
                      placeholder="e.g. 85.5"
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
                  onClick={handleSaveCourier}
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
        {deleteId && (
          <ConfirmationModal
            title="Delete Courier"
            message="Are you sure you want to delete this courier partner? This will remove all their branches and historical performance records."
            confirmLabel="Delete"
            onConfirm={() => {
              updateCouriers(courierList.filter((c) => c.id !== deleteId));
              setDeleteId(null);
            }}
            onClose={() => setDeleteId(null)}
          />
        )}
      </AnimatePresence>
    </AppShell>
  );
}
