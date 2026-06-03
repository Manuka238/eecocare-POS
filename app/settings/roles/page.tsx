"use client";
import { useState, useEffect } from "react";
import { AppShell } from "@/components/app-shell";
import { useThemeMode } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import { systemRoles } from "@/lib/crh-data";
import { Shield, Users, PlusCircle, Pencil, Trash2, X } from "lucide-react";
import { ConfirmationModal } from "@/components/ui";
import { AnimatePresence, motion } from "framer-motion";

interface RoleItem {
  id: string;
  name: string;
  users: number;
  permissions: string[];
  description: string;
}

const PERM_CATEGORIES = [
  {
    title: "Page Visibility (Navigation Sidebar Options)",
    items: [
      { key: "nav_dashboard", label: "Dashboard Page" },
      { key: "nav_orders", label: "Orders Page" },
      { key: "nav_packing", label: "Packing Station" },
      { key: "nav_resolution", label: "Resolution Center" },
      { key: "nav_products", label: "Products Page" },
      { key: "nav_contacts", label: "Contacts Page" },
      { key: "nav_purchases", label: "Purchases Page" },
      { key: "nav_stock", label: "Stock Page" },
      { key: "nav_expenses", label: "Expenses Page" },
      { key: "nav_reports", label: "Reports Page" },
      { key: "nav_analytics", label: "Analytics Page" },
      { key: "nav_settings", label: "Settings Page" },
    ]
  },
  {
    title: "Detailed Operations (Read/Write/Delete Control)",
    items: [
      { key: "orders_read", label: "View Orders List" },
      { key: "orders_write", label: "Create / Edit Orders" },
      { key: "orders_delete", label: "Delete Orders" },
      { key: "products_read", label: "View Products List" },
      { key: "products_write", label: "Create / Edit Products" },
      { key: "products_delete", label: "Delete Products" },
      { key: "contacts_read", label: "View Contacts List" },
      { key: "contacts_write", label: "Create / Edit Contacts" },
      { key: "contacts_delete", label: "Delete Contacts" },
      { key: "resolution_read", label: "View Resolution Hub" },
      { key: "resolution_write", label: "Update Action Center Records" },
      { key: "resolution_delete", label: "Delete Evidence Files" },
      { key: "financials_read", label: "View Purchases & Expenses" },
      { key: "financials_write", label: "Add Purchases & Expenses" },
      { key: "financials_delete", label: "Delete Purchases & Expenses" },
    ]
  },
  {
    title: "Dashboard Visibility Widgets",
    items: [
      { key: "dash_sales", label: "Sales & Achievement Card" },
      { key: "dash_profit", label: "Net Profit Card" },
      { key: "dash_purchases", label: "Purchases Card" },
      { key: "dash_expenses", label: "Expenses Card" },
      { key: "dash_target", label: "Monthly Target Chart" },
    ]
  }
];

export default function RolesPage() {
  const { dark } = useThemeMode();
  const [roleList, setRoleList] = useState<RoleItem[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Add & Edit modal states
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [roleToEdit, setRoleToEdit] = useState<RoleItem | null>(null);

  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formUsers, setFormUsers] = useState<number>(0);
  const [formPermissions, setFormPermissions] = useState("");

  const [userList, setUserList] = useState<any[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<"roles" | "users">("roles");
  
  // Configure User Permissions modal state
  const [showUserPermModal, setShowUserPermModal] = useState(false);
  const [userToConfigure, setUserToConfigure] = useState<any | null>(null);
  const [configuredPermissions, setConfiguredPermissions] = useState<string[]>([]);

  const handleStartConfigureUser = (user: any) => {
    setUserToConfigure(user);
    const defaultPerms = user.role === "Admin"
      ? ["nav_dashboard", "nav_orders", "nav_packing", "nav_resolution", "nav_products", "nav_contacts", "nav_purchases", "nav_stock", "nav_expenses", "nav_reports", "nav_analytics", "nav_settings", "orders_read", "orders_write", "orders_delete", "products_read", "products_write", "products_delete", "contacts_read", "contacts_write", "contacts_delete", "resolution_read", "resolution_write", "resolution_delete", "financials_read", "financials_write", "financials_delete", "dash_sales", "dash_profit", "dash_purchases", "dash_expenses", "dash_target"]
      : user.role === "CR Manager"
      ? ["nav_orders", "nav_resolution", "nav_reports", "orders_read", "orders_write", "resolution_read", "resolution_write", "reports"]
      : user.role === "CEO"
      ? ["nav_dashboard", "nav_reports", "nav_analytics", "dash_sales", "dash_profit", "dash_purchases", "dash_expenses", "dash_target", "reports", "analytics"]
      : ["nav_orders", "orders_read"];

    const currentPerms = user.permissions && user.permissions.length > 0 ? user.permissions : defaultPerms;
    setConfiguredPermissions(currentPerms);
    setShowUserPermModal(true);
  };

  const handleSaveUserPermissions = () => {
    if (!userToConfigure) return;

    const updatedUsers = userList.map((u) => {
      if (u.id === userToConfigure.id) {
        return {
          ...u,
          permissions: configuredPermissions,
        };
      }
      return u;
    });

    setUserList(updatedUsers);
    if (typeof window !== "undefined") {
      localStorage.setItem("system_users", JSON.stringify(updatedUsers));
      window.dispatchEvent(new Event("storage"));
    }

    setShowUserPermModal(false);
    setUserToConfigure(null);
  };

  // Load and persist states
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("system_roles");
      if (stored) {
        try {
          setRoleList(JSON.parse(stored));
        } catch (e) {
          console.error("Failed to parse system_roles", e);
        }
      } else {
        setRoleList(systemRoles as RoleItem[]);
        localStorage.setItem("system_roles", JSON.stringify(systemRoles));
      }

      // Load users
      const storedUsers = localStorage.getItem("system_users");
      if (storedUsers) {
        try {
          setUserList(JSON.parse(storedUsers));
        } catch (e) {
          console.error("Failed to parse system_users", e);
        }
      } else {
        const { systemUsers } = require("@/lib/crh-data");
        setUserList(systemUsers);
      }
    }
  }, []);

  const updateRoles = (newRoles: RoleItem[]) => {
    setRoleList(newRoles);
    if (typeof window !== "undefined") {
      localStorage.setItem("system_roles", JSON.stringify(newRoles));
    }
  };

  const handleSaveRole = () => {
    if (!formName.trim() || !formDescription.trim()) {
      alert("Please fill all required fields!");
      return;
    }

    const permsArr = formPermissions
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);

    if (roleToEdit) {
      // Edit
      const updated = roleList.map((r) =>
        r.id === roleToEdit.id
          ? {
              ...r,
              name: formName.trim(),
              description: formDescription.trim(),
              users: Number(formUsers),
              permissions: permsArr,
            }
          : r
      );
      updateRoles(updated);
    } else {
      // Add
      const newRole: RoleItem = {
        id: `r-${Date.now()}`,
        name: formName.trim(),
        description: formDescription.trim(),
        users: Number(formUsers),
        permissions: permsArr,
      };
      updateRoles([...roleList, newRole]);
    }

    setShowAddEditModal(false);
    setRoleToEdit(null);
  };

  const labelCls = cn("block text-xs font-semibold mb-1.5", dark ? "text-slate-400" : "text-slate-500");
  const inputCls = cn("w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors", dark ? "border-white/10 bg-slate-800 text-white focus:border-violet-500" : "border-slate-200 bg-slate-50 text-slate-900 focus:border-violet-500");

  return (
    <AppShell title="Roles & Permissions" description="Manage user roles and access levels">
      <div className="space-y-4">
        {/* Sub Navigation Tabs */}
        <div className={cn("flex gap-2 border-b pb-3 mb-6", dark ? "border-white/10" : "border-slate-200")}>
          <button
            onClick={() => setActiveSubTab("roles")}
            className={cn(
              "rounded-xl px-4 py-2 text-xs font-bold transition-all duration-300 active:scale-95 border",
              activeSubTab === "roles"
                ? dark
                  ? "border-violet-500/30 bg-violet-500/10 text-violet-400 shadow-[0_0_12px_rgba(139,92,246,0.1)]"
                  : "border-violet-200 bg-violet-50 text-violet-750 shadow-sm"
                : dark
                  ? "border-transparent bg-slate-800/40 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                  : "border-transparent bg-slate-100 text-slate-650 hover:bg-slate-200 hover:text-slate-900"
            )}
          >
            Access Roles
          </button>
          <button
            onClick={() => setActiveSubTab("users")}
            className={cn(
              "rounded-xl px-4 py-2 text-xs font-bold transition-all duration-300 active:scale-95 border",
              activeSubTab === "users"
                ? dark
                  ? "border-violet-500/30 bg-violet-500/10 text-violet-400 shadow-[0_0_12px_rgba(139,92,246,0.1)]"
                  : "border-violet-200 bg-violet-50 text-violet-750 shadow-sm"
                : dark
                  ? "border-transparent bg-slate-800/40 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                  : "border-transparent bg-slate-100 text-slate-650 hover:bg-slate-200 hover:text-slate-900"
            )}
          >
            User Access Control
          </button>
        </div>

        {activeSubTab === "roles" && (
          <div className="flex justify-end">
            <button
              onClick={() => {
                setRoleToEdit(null);
                setFormName("");
                setFormDescription("");
                setFormUsers(0);
                setFormPermissions("");
                setShowAddEditModal(true);
              }}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl hover:brightness-110 active:scale-95"
            >
              <PlusCircle className="h-4 w-4" /> Add Role
            </button>
          </div>
        )}

        {activeSubTab === "roles" ? (
          <div className="grid gap-4 md:grid-cols-2">
            {roleList.map((r) => (
              <div
                key={r.id}
                className={cn(
                  "rounded-3xl border p-5 card-hover transition-all flex flex-col justify-between",
                  dark ? "border-white/10 bg-slate-900/80 hover:border-white/20" : "border-slate-200 bg-white hover:shadow-md"
                )}
              >
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 p-2.5 text-white">
                      <Shield className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold">{r.name}</p>
                      <p className={cn("text-xs", dark ? "text-slate-400" : "text-slate-500")}>
                        {r.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <Users className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-sm">{r.users} user(s)</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {r.permissions.map((p) => (
                      <span
                        key={p}
                        className={cn(
                          "rounded-full px-2.5 py-1 text-[10px] font-medium",
                          dark ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-650"
                        )}
                      >
                        {p}
                      </span>
                    ))}
                    {r.permissions.length === 0 && (
                      <span className="text-xs text-slate-500 italic">No explicit permissions</span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-3 border-t dark:border-white/5 border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setRoleToEdit(r);
                      setFormName(r.name);
                      setFormDescription(r.description);
                      setFormUsers(r.users);
                      setFormPermissions(r.permissions.join(", "));
                      setShowAddEditModal(true);
                    }}
                    className="flex-1 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 hover:brightness-110 shadow-sm px-3 py-2 text-xs font-semibold text-white transition active:scale-95"
                  >
                    Edit Role
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteId(r.id)}
                    className="rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:brightness-110 shadow-sm px-3 py-2 text-xs font-semibold text-white transition active:scale-95"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {roleList.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-400 opacity-60">
                No user access roles defined
              </div>
            )}
          </div>
        ) : (
          /* User Access Control List */
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {userList.map((u) => {
              const defaultPerms = u.role === "Admin"
                ? ["nav_dashboard", "nav_orders", "nav_packing", "nav_resolution", "nav_products", "nav_contacts", "nav_purchases", "nav_stock", "nav_expenses", "nav_reports", "nav_analytics", "nav_settings", "orders_read", "orders_write", "orders_delete", "products_read", "products_write", "products_delete", "contacts_read", "contacts_write", "contacts_delete", "resolution_read", "resolution_write", "resolution_delete", "financials_read", "financials_write", "financials_delete", "dash_sales", "dash_profit", "dash_purchases", "dash_expenses", "dash_target"]
                : u.role === "CR Manager"
                ? ["nav_orders", "nav_resolution", "nav_reports", "orders_read", "orders_write", "resolution_read", "resolution_write", "reports"]
                : u.role === "CEO"
                ? ["nav_dashboard", "nav_reports", "nav_analytics", "dash_sales", "dash_profit", "dash_purchases", "dash_expenses", "dash_target", "reports", "analytics"]
                : ["nav_orders", "orders_read"];
              const currentPerms = u.permissions && u.permissions.length > 0 ? u.permissions : defaultPerms;

              return (
                <div
                  key={u.id}
                  className={cn(
                    "rounded-3xl border p-5 card-hover transition-all flex flex-col justify-between",
                    dark ? "border-white/10 bg-slate-900/80 hover:border-white/20" : "border-slate-200 bg-white hover:shadow-md"
                  )}
                >
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-blue-600 text-sm font-bold text-white shadow-lg select-none">
                        {u.avatar || "U"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold truncate leading-none mb-1">{u.name}</p>
                        <p className={cn("text-[10px] truncate font-medium", dark ? "text-slate-400" : "text-slate-500")}>
                          {u.role} &bull; {u.email}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3">
                      <p className={cn("text-[10px] font-bold uppercase tracking-wider mb-2", dark ? "text-slate-500" : "text-slate-400")}>
                        Granted Scopes ({currentPerms.length})
                      </p>
                      {u.role === "Admin" ? (
                        <span className={cn("inline-flex rounded-full bg-violet-500/10 border border-violet-500/25 px-2.5 py-0.5 text-[10px] font-semibold text-violet-400")}>
                          Full Access Control
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
                          {currentPerms.map((perm) => {
                            const labelMap: Record<string, string> = {
                              nav_dashboard: "Nav: Dashboard",
                              nav_orders: "Nav: Orders",
                              nav_packing: "Nav: Packing",
                              nav_resolution: "Nav: Resolution",
                              nav_products: "Nav: Products",
                              nav_contacts: "Nav: Contacts",
                              nav_purchases: "Nav: Purchases",
                              nav_stock: "Nav: Stock",
                              nav_expenses: "Nav: Expenses",
                              nav_reports: "Nav: Reports",
                              nav_analytics: "Nav: Analytics",
                              nav_settings: "Nav: Settings",
                              orders_read: "Read Orders",
                              orders_write: "Write Orders",
                              orders_delete: "Delete Orders",
                              products_read: "Read Products",
                              products_write: "Write Products",
                              products_delete: "Delete Products",
                              contacts_read: "Read Contacts",
                              contacts_write: "Write Contacts",
                              contacts_delete: "Delete Contacts",
                              resolution_read: "Read Resolution",
                              resolution_write: "Write Resolution",
                              resolution_delete: "Delete Resolution",
                              financials_read: "Read Financials",
                              financials_write: "Write Financials",
                              financials_delete: "Delete Financials",
                              dash_sales: "Sales Card",
                              dash_profit: "Profit Card",
                              dash_purchases: "Purchases Card",
                              dash_expenses: "Expenses Card",
                              dash_target: "Target Chart",
                            };
                            return (
                              <span key={perm} className={cn("rounded-full px-2 py-0.5 text-[9px] font-semibold border", dark ? "bg-slate-800 text-slate-350 border-white/5" : "bg-slate-100 text-slate-650 border-slate-200")}>
                                {labelMap[perm] || perm}
                              </span>
                            );
                          })}
                          {currentPerms.length === 0 && (
                            <span className="text-[10px] text-slate-500 italic">No access scopes allocated</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t dark:border-white/5 border-slate-100">
                    {u.role === "Admin" ? (
                      <span className={cn("block text-center text-xs font-medium italic", dark ? "text-slate-500" : "text-slate-400")}>
                        Protected Admin Account
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleStartConfigureUser(u)}
                        className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 hover:brightness-110 shadow-sm px-3 py-2 text-xs font-semibold text-white transition active:scale-95"
                      >
                        Configure Permissions
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Configure User Permissions Modal */}
      <AnimatePresence>
        {showUserPermModal && userToConfigure && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={cn("max-w-2xl w-full rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col max-h-[85vh]", dark ? "bg-slate-900 border border-white/10 text-white" : "bg-white border border-slate-200 text-slate-800")}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-violet-600 to-blue-600" />

              <div className="flex items-center justify-between mb-4 shrink-0">
                <div>
                  <h3 className="text-lg font-bold">Configure Access Permissions</h3>
                  <p className={cn("text-xs mt-0.5", dark ? "text-slate-400" : "text-slate-500")}>
                    Setting security permissions for <span className="font-bold text-violet-500">{userToConfigure.name}</span> ({userToConfigure.role})
                  </p>
                </div>
                <button onClick={() => { setShowUserPermModal(false); setUserToConfigure(null); }} className="text-slate-400 hover:text-slate-205"><X className="h-4 w-4" /></button>
              </div>

              {/* Scrollable Permissions List */}
              <div className="space-y-5 overflow-y-auto my-2 pr-2 flex-1">
                {PERM_CATEGORIES.map((cat) => (
                  <div key={cat.title} className="space-y-2.5">
                    <h4 className={cn("text-xs font-bold uppercase tracking-wider", dark ? "text-slate-400" : "text-slate-550")}>
                      {cat.title}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {cat.items.map((item) => {
                        const isChecked = configuredPermissions.includes(item.key);
                        return (
                          <label
                            key={item.key}
                            className={cn(
                              "flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer select-none transition-all duration-205",
                              isChecked
                                ? dark
                                  ? "border-violet-500/30 bg-violet-500/5 hover:bg-violet-500/10"
                                  : "border-violet-200 bg-violet-50/50 hover:bg-violet-50"
                                : dark
                                  ? "border-white/5 bg-slate-800 hover:bg-slate-800/60"
                                  : "border-slate-100 bg-slate-50 hover:bg-slate-100"
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setConfiguredPermissions([...configuredPermissions, item.key]);
                                } else {
                                  setConfiguredPermissions(configuredPermissions.filter((k) => k !== item.key));
                                }
                              }}
                              className="mt-0.5 rounded border-slate-350 text-violet-600 focus:ring-violet-500 focus:ring-offset-0"
                            />
                            <span className="text-xs font-bold leading-tight select-none">
                              {item.label}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Action buttons */}
              <div className="mt-4 pt-4 border-t dark:border-white/5 border-slate-100 flex justify-between items-center shrink-0">
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfiguredPermissions([
                      "nav_dashboard", "nav_orders", "nav_packing", "nav_resolution", "nav_products", "nav_contacts", "nav_purchases", "nav_stock", "nav_expenses", "nav_reports", "nav_analytics", "nav_settings", "orders_read", "orders_write", "orders_delete", "products_read", "products_write", "products_delete", "contacts_read", "contacts_write", "contacts_delete", "resolution_read", "resolution_write", "resolution_delete", "financials_read", "financials_write", "financials_delete", "dash_sales", "dash_profit", "dash_purchases", "dash_expenses", "dash_target"
                    ])}
                    className={cn("rounded-lg px-2.5 py-1.5 text-[10px] font-semibold", dark ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-slate-100 text-slate-650 hover:bg-slate-200")}
                  >
                    Select All
                  </button>
                  <button
                    onClick={() => setConfiguredPermissions([])}
                    className={cn("rounded-lg px-2.5 py-1.5 text-[10px] font-semibold", dark ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-slate-100 text-slate-650 hover:bg-slate-200")}
                  >
                    Clear All
                  </button>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => { setShowUserPermModal(false); setUserToConfigure(null); }} className={cn("rounded-xl px-4 py-2.5 text-xs font-semibold", dark ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-slate-100 text-slate-650 hover:bg-slate-200")}>
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveUserPermissions}
                    className="rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg hover:brightness-110 active:scale-95 transition"
                  >
                    Save Permissions
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
                  {roleToEdit ? "Edit Access Role" : "Add Access Role"}
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
                  <label className={labelCls}>Role Name *</label>
                  <input
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className={inputCls}
                    placeholder="e.g. Supervisor"
                  />
                </div>
                <div>
                  <label className={labelCls}>Role Description *</label>
                  <input
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className={inputCls}
                    placeholder="e.g. Standard review permissions"
                  />
                </div>
                <div>
                  <label className={labelCls}>Number of Users</label>
                  <input
                    type="number"
                    value={formUsers}
                    onChange={(e) => setFormUsers(Number(e.target.value))}
                    className={inputCls}
                    placeholder="e.g. 3"
                  />
                </div>
                <div>
                  <label className={labelCls}>Permission Scope (Comma-separated)</label>
                  <input
                    value={formPermissions}
                    onChange={(e) => setFormPermissions(e.target.value)}
                    className={inputCls}
                    placeholder="e.g. orders_view, actions, reports"
                  />
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
                  onClick={handleSaveRole}
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
            title="Delete Role"
            message="Are you sure you want to delete this administrative role? This might affect existing system users associated with this profile."
            confirmLabel="Delete"
            onConfirm={() => {
              updateRoles(roleList.filter((r) => r.id !== deleteId));
              setDeleteId(null);
            }}
            onClose={() => setDeleteId(null)}
          />
        )}
      </AnimatePresence>
    </AppShell>
  );
}
