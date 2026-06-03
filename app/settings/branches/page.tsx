"use client";
import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { useThemeMode } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import { courierBranches, COURIERS, DISTRICTS } from "@/lib/crh-data";
import { Search, PlusCircle, Pencil, Trash2, Filter, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { ConfirmationModal, ViewBranchModal, FilterSelect } from "@/components/ui";
import { CourierSubNav } from "@/components/courier-sub-nav";

export default function BranchesPage() {
  const { dark } = useThemeMode();
  const [branchList, setBranchList] = useState(courierBranches);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewBranch, setViewBranch] = useState<any | null>(null);

  // Search and filter states
  const [search, setSearch] = useState("");
  const [courierFilter, setCourierFilter] = useState("");
  const [districtFilter, setDistrictFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Add & Edit modal states
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [branchToEdit, setBranchToEdit] = useState<any | null>(null);

  const [formName, setFormName] = useState("");
  const [formCourier, setFormCourier] = useState("");
  const [formDistrict, setFormDistrict] = useState("");
  const [formContact, setFormContact] = useState("");
  const [formManager, setFormManager] = useState("");
  const [formStatus, setFormStatus] = useState("Active");

  // LocalStorage persistence hook
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("system_branches");
      if (stored) {
        try {
          setBranchList(JSON.parse(stored));
        } catch (e) {
          console.error("Failed to parse system_branches", e);
        }
      } else {
        localStorage.setItem("system_branches", JSON.stringify(courierBranches));
      }
    }
  }, []);

  // Parse URL query parameter to filter by courier
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const courierParam = params.get("courier");
      if (courierParam) {
        setCourierFilter(courierParam);
        setShowFilters(true);
        // Clear search params
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      }
    }
  }, []);

  const updateBranches = (newBranches: any[]) => {
    setBranchList(newBranches);
    if (typeof window !== "undefined") {
      localStorage.setItem("system_branches", JSON.stringify(newBranches));
    }
  };

  const filtered = useMemo(() => {
    return branchList.filter((b) => {
      const q = search.toLowerCase();
      const matchSearch = !q || b.name.toLowerCase().includes(q) || b.manager.toLowerCase().includes(q) || b.district.toLowerCase().includes(q);
      const matchCourier = !courierFilter || b.courier === courierFilter;
      const matchDistrict = !districtFilter || b.district === districtFilter;
      const matchStatus = !statusFilter || b.status === statusFilter;
      return matchSearch && matchCourier && matchDistrict && matchStatus;
    });
  }, [branchList, search, courierFilter, districtFilter, statusFilter]);

  const handleSaveBranch = () => {
    if (!formName.trim() || !formContact.trim() || !formManager.trim()) {
      alert("Please fill all required fields!");
      return;
    }

    if (branchToEdit) {
      // Edit mode
      const updated = branchList.map((b) =>
        b.id === branchToEdit.id
          ? {
              ...b,
              name: formName.trim(),
              courier: formCourier,
              district: formDistrict,
              contact: formContact.trim(),
              manager: formManager.trim(),
              status: formStatus,
            }
          : b
      );
      updateBranches(updated);
    } else {
      // Add mode
      const newBranch = {
        id: `b-${Date.now()}`,
        name: formName.trim(),
        courier: formCourier,
        district: formDistrict,
        contact: formContact.trim(),
        manager: formManager.trim(),
        status: formStatus,
      };
      updateBranches([...branchList, newBranch]);
    }

    setShowAddEditModal(false);
    setBranchToEdit(null);
  };

  const labelCls = cn("block text-xs font-semibold mb-1.5", dark ? "text-slate-400" : "text-slate-500");
  const inputCls = cn("w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors", dark ? "border-white/10 bg-slate-800 text-white focus:border-violet-500" : "border-slate-200 bg-slate-50 text-slate-900 focus:border-violet-500");

  return (
    <AppShell title="Branch Configuration" description="Manage courier branch locations">
      <div className="space-y-4">
        <CourierSubNav activeTab="branches" />
        {/* Toolbar */}
        <div className={cn("flex flex-col gap-3 rounded-3xl border p-4 md:flex-row md:items-center md:justify-between", dark ? "border-white/10 bg-slate-900/80" : "border-slate-200 bg-white")}>
          <div className="flex flex-1 items-center gap-3">
            <div className={cn("flex items-center gap-2 rounded-xl px-3 py-2 flex-1 max-w-sm", dark ? "bg-slate-800" : "bg-slate-100")}>
              <Search className="h-4 w-4 text-slate-400" />
              <input className="w-full bg-transparent text-sm outline-none text-slate-800 dark:text-white" placeholder="Search branches..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <button onClick={() => setShowFilters(!showFilters)} className={cn("rounded-xl p-2.5 transition-colors", showFilters ? "bg-violet-600 text-white shadow-md shadow-violet-600/15" : dark ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}>
              <Filter className="h-4 w-4" />
            </button>
          </div>
          <button
            onClick={() => {
              setBranchToEdit(null);
              setFormName("");
              setFormCourier(COURIERS[0]?.name || "Pronto");
              setFormDistrict(DISTRICTS[0] || "Colombo");
              setFormContact("");
              setFormManager("");
              setFormStatus("Active");
              setShowAddEditModal(true);
            }}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl hover:brightness-110 active:scale-95"
          >
            <PlusCircle className="h-4 w-4" /> Add Branch
          </button>
        </div>

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className={cn("flex flex-wrap gap-3 rounded-2xl border p-4", dark ? "border-white/10 bg-slate-900/60" : "border-slate-200 bg-slate-50")}>
                <FilterSelect value={courierFilter} onChange={(v) => setCourierFilter(v)} placeholder="All Couriers" options={COURIERS.map((c) => ({ value: c.name, label: c.name }))} />
                <FilterSelect value={districtFilter} onChange={(v) => setDistrictFilter(v)} placeholder="All Districts" options={DISTRICTS.map((d) => ({ value: d, label: d }))} />
                <FilterSelect value={statusFilter} onChange={(v) => setStatusFilter(v)} placeholder="All Statuses" options={[{ value: "Active", label: "Active" }, { value: "Disabled", label: "Disabled" }]} />
                <button onClick={() => { setCourierFilter(""); setDistrictFilter(""); setStatusFilter(""); setSearch(""); }} className={cn("rounded-xl px-3 py-2 text-sm transition-colors", dark ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-slate-200 text-slate-600 hover:bg-slate-300")}>Clear All</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className={cn("rounded-3xl border overflow-hidden shadow-sm", dark ? "border-white/10 bg-slate-900/80" : "border-slate-200 bg-white")}>
          <table className="w-full text-sm">
            <thead>
              <tr className={cn("text-left text-xs uppercase tracking-wider border-b", dark ? "bg-slate-800 text-slate-400 border-white/5" : "bg-slate-50 text-slate-500 border-slate-200")}>
                <th className="px-4 py-3 font-medium">Branch</th>
                <th className="px-4 py-3 font-medium">Courier</th>
                <th className="px-4 py-3 font-medium">District</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Manager</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr key={b.id} className={cn("border-t transition-colors", dark ? "border-white/5 hover:bg-white/5" : "border-slate-100 hover:bg-slate-50")}>
                  <td className="px-4 py-3 font-semibold">{b.name}</td>
                  <td className="px-4 py-3">
                    <Link
                      href="/settings/couriers"
                      className="font-semibold text-violet-500 hover:underline transition-colors"
                      title="Manage Couriers"
                    >
                      {b.courier}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{b.district}</td>
                  <td className="px-4 py-3 text-xs">{b.contact}</td>
                  <td className="px-4 py-3">{b.manager}</td>
                  <td className="px-4 py-3">
                    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium border", b.status === "Active" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20")}>
                      {b.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setViewBranch(b)}
                        className="rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:brightness-110 shadow-sm hover:shadow-md px-3 py-1.5 text-xs font-semibold text-white transition-all active:scale-95"
                      >
                        View
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setBranchToEdit(b);
                          setFormName(b.name);
                          setFormCourier(b.courier);
                          setFormDistrict(b.district);
                          setFormContact(b.contact);
                          setFormManager(b.manager);
                          setFormStatus(b.status);
                          setShowAddEditModal(true);
                        }}
                        className="rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 hover:brightness-110 shadow-sm hover:shadow-md px-3 py-1.5 text-xs font-semibold text-white transition-all active:scale-95"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteId(b.id)}
                        className="rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:brightness-110 shadow-sm hover:shadow-md px-3 py-1.5 text-xs font-semibold text-white transition-all active:scale-95"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400 opacity-60">
                    No branches found matching the filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {showAddEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowAddEditModal(false)}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={cn("max-w-md w-full rounded-3xl p-6 shadow-2xl relative overflow-hidden", dark ? "bg-slate-900 border border-white/10" : "bg-white border border-slate-200")}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-violet-600 to-blue-600" />
              
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold">{branchToEdit ? "Edit Branch" : "Add Branch"}</h3>
                <button onClick={() => setShowAddEditModal(false)} className="text-slate-400 hover:text-slate-200"><X className="h-4 w-4" /></button>
              </div>

              <div className="space-y-3.5">
                <div>
                  <label className={labelCls}>Branch Name *</label>
                  <input value={formName} onChange={(e) => setFormName(e.target.value)} className={inputCls} placeholder="e.g. Galle Branch" />
                </div>
                <div>
                  <label className={labelCls}>Courier Partner</label>
                  <select value={formCourier} onChange={(e) => setFormCourier(e.target.value)} className={inputCls}>
                    {COURIERS.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>District</label>
                  <select value={formDistrict} onChange={(e) => setFormDistrict(e.target.value)} className={inputCls}>
                    {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Contact Number *</label>
                  <input value={formContact} onChange={(e) => setFormContact(e.target.value)} className={inputCls} placeholder="+94 XX XXX XXXX" />
                </div>
                <div>
                  <label className={labelCls}>Branch Manager *</label>
                  <input value={formManager} onChange={(e) => setFormManager(e.target.value)} className={inputCls} placeholder="Enter manager name" />
                </div>
                <div>
                  <label className={labelCls}>Status</label>
                  <select value={formStatus} onChange={(e) => setFormStatus(e.target.value)} className={inputCls}>
                    <option value="Active">Active</option>
                    <option value="Disabled">Disabled</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button onClick={() => setShowAddEditModal(false)} className={cn("rounded-xl px-4 py-2.5 text-xs font-semibold", dark ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-slate-100 text-slate-650 hover:bg-slate-200")}>Cancel</button>
                <button onClick={handleSaveBranch} className="rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-600/15 hover:brightness-110 active:scale-95 transition">Save</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteId && (
          <ConfirmationModal
            title="Delete Branch"
            message="Are you sure you want to delete this branch? This action cannot be undone."
            confirmLabel="Delete"
            onConfirm={() => {
              updateBranches(branchList.filter((b) => b.id !== deleteId));
              setDeleteId(null);
            }}
            onClose={() => setDeleteId(null)}
          />
        )}
      </AnimatePresence>

      {/* View Branch Modal */}
      <AnimatePresence>
        {viewBranch && (
          <ViewBranchModal
            branch={viewBranch}
            onClose={() => setViewBranch(null)}
          />
        )}
      </AnimatePresence>
    </AppShell>
  );
}
