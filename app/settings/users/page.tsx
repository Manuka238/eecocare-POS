"use client";
import { useState, useMemo, useEffect } from "react";
import { AppShell } from "@/components/app-shell";
import { useThemeMode } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import { systemUsers } from "@/lib/crh-data";
import { PlusCircle, Pencil, Trash2, X, Search, Filter } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { ConfirmationModal, ViewUserModal, FilterSelect } from "@/components/ui";

const DEFAULT_PERMISSIONS: Record<string, string[]> = {
  "Admin": ["nav_dashboard", "nav_orders", "nav_packing", "nav_resolution", "nav_products", "nav_contacts", "nav_purchases", "nav_stock", "nav_expenses", "nav_reports", "nav_analytics", "nav_settings", "orders_read", "orders_write", "orders_delete", "products_read", "products_write", "products_delete", "contacts_read", "contacts_write", "contacts_delete", "resolution_read", "resolution_write", "resolution_delete", "financials_read", "financials_write", "financials_delete", "dash_sales", "dash_profit", "dash_purchases", "dash_expenses", "dash_target"],
  "CR Manager": ["nav_orders", "nav_resolution", "nav_reports", "orders_read", "orders_write", "resolution_read", "resolution_write", "reports"],
  "CEO": ["nav_dashboard", "nav_reports", "nav_analytics", "dash_sales", "dash_profit", "dash_purchases", "dash_expenses", "dash_target", "reports", "analytics"],
  "Staff": ["nav_orders", "orders_read"]
};

export default function UsersPage() {
  const { dark } = useThemeMode();
  const [userList, setUserList] = useState<any[]>(systemUsers);
  const [showModal, setShowModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewUser, setViewUser] = useState<any | null>(null);

  // Form states for creating a new profile
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newShortName, setNewShortName] = useState("");
  const [newRole, setNewRole] = useState("CR Manager");
  const [newPassword, setNewPassword] = useState("");

  // Edit form states
  const [showEditModal, setShowEditModal] = useState(false);
  const [userToEdit, setUserToEdit] = useState<any | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editShortName, setEditShortName] = useState("");
  const [editRole, setEditRole] = useState("CR Manager");
  const [editStatus, setEditStatus] = useState("Active");
  const [editPassword, setEditPassword] = useState("");

  const handleStartEdit = (user: any) => {
    setUserToEdit(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditUsername(user.username || "");
    setEditShortName(user.shortName || "");
    setEditRole(user.role);
    setEditStatus(user.status || "Active");
    setEditPassword(user.password || "password123");
    setShowEditModal(true);
  };

  const handleEditRoleChange = (role: string) => {
    setEditRole(role);
  };

  const handleSaveEdit = () => {
    if (!editName.trim() || !editEmail.trim() || !editShortName.trim() || !editUsername.trim()) {
      alert("Please fill all required fields, including username!");
      return;
    }
    const updatedUsers = userList.map((u) => {
      if (u.id === userToEdit.id) {
        const roleChanged = u.role !== editRole;
        const newPerms = roleChanged 
          ? (DEFAULT_PERMISSIONS[editRole] || [])
          : (u.permissions || DEFAULT_PERMISSIONS[editRole] || []);

        return {
          ...u,
          name: editName.trim(),
          email: editEmail.trim(),
          username: editUsername.trim(),
          shortName: editShortName.trim().toUpperCase(),
          role: editRole,
          status: editStatus,
          avatar: editName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2),
          permissions: newPerms,
          password: editPassword.trim() || u.password || "password123"
        };
      }
      return u;
    });
    updateUsers(updatedUsers);
    setShowEditModal(false);
    setUserToEdit(null);
  };

  // Synchronize dynamic accounts with browser LocalStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("system_users");
      if (stored) {
        try {
          setUserList(JSON.parse(stored));
        } catch (e) {
          console.error("Failed to parse system_users", e);
        }
      } else {
        localStorage.setItem("system_users", JSON.stringify(systemUsers));
      }
    }
  }, []);

  const updateUsers = (newUsers: any[]) => {
    setUserList(newUsers);
    if (typeof window !== "undefined") {
      localStorage.setItem("system_users", JSON.stringify(newUsers));
    }
  };
  
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    return userList.filter((u) => {
      const q = search.toLowerCase();
      const matchSearch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
      const matchRole = !roleFilter || u.role === roleFilter;
      const matchStatus = !statusFilter || u.status === statusFilter;
      return matchSearch && matchRole && matchStatus;
    });
  }, [userList, search, roleFilter, statusFilter]);

  return (
    <AppShell title="User Management" description="Manage system users and access">
      <div className="space-y-4">
        {/* Toolbar */}
        <div className={cn("flex flex-col gap-3 rounded-3xl border p-4 md:flex-row md:items-center md:justify-between", dark ? "border-white/10 bg-slate-900/80" : "border-slate-200 bg-white")}>
          <div className="flex flex-1 items-center gap-3">
            <div className={cn("flex items-center gap-2 rounded-xl px-3 py-2 flex-1 max-w-sm", dark ? "bg-slate-800" : "bg-slate-100")}>
              <Search className="h-4 w-4 text-slate-400" />
              <input className="w-full bg-transparent text-sm outline-none" placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <button onClick={() => setShowFilters(!showFilters)} className={cn("rounded-xl p-2.5 transition-colors", showFilters ? "bg-violet-600 text-white" : dark ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}>
              <Filter className="h-4 w-4" />
            </button>
          </div>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl hover:brightness-110">
            <PlusCircle className="h-4 w-4" /> Add User
          </button>
        </div>

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className={cn("flex flex-wrap gap-3 rounded-2xl border p-4", dark ? "border-white/10 bg-slate-900/60" : "border-slate-200 bg-slate-50")}>
                <FilterSelect value={roleFilter} onChange={(v) => setRoleFilter(v)} placeholder="All Roles" options={[{ value: "Admin", label: "Admin" }, { value: "CR Manager", label: "CR Manager" }, { value: "CEO", label: "CEO" }, { value: "Staff", label: "Staff" }]} />
                <FilterSelect value={statusFilter} onChange={(v) => setStatusFilter(v)} placeholder="All Statuses" options={[{ value: "Active", label: "Active" }, { value: "Disabled", label: "Disabled" }]} />
                <button onClick={() => { setRoleFilter(""); setStatusFilter(""); setSearch(""); }} className={cn("rounded-xl px-3 py-2 text-sm transition-colors", dark ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-slate-200 text-slate-600 hover:bg-slate-300")}>Clear All</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div className={cn("rounded-3xl border overflow-hidden", dark ? "border-white/10 bg-slate-900/80" : "border-slate-200 bg-white")}>
          <table className="w-full text-sm">
            <thead><tr className={cn("text-left text-xs uppercase tracking-wider", dark ? "bg-slate-800 text-slate-400" : "bg-slate-50 text-slate-500")}>
              <th className="px-4 py-3 font-medium">User</th><th className="px-4 py-3 font-medium">Short Name</th><th className="px-4 py-3 font-medium">Email</th><th className="px-4 py-3 font-medium">Role</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 font-medium">Last Login</th><th className="px-4 py-3 font-medium">Actions</th>
            </tr></thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className={cn("border-t transition-colors", dark ? "border-white/5 hover:bg-white/5" : "border-slate-100 hover:bg-slate-50")}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-blue-600 text-xs font-bold text-white">
                        {u.avatar}
                      </div>
                      <div>
                        <span className="font-medium block">{u.name}</span>
                        {u.username && (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                            @{u.username}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs font-mono font-bold text-violet-500 dark:text-violet-400">{u.shortName || "-"}</td>
                  <td className="px-4 py-3 text-xs">{u.email}</td>
                  <td className="px-4 py-3"><span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", dark ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-600")}>{u.role}</span></td>
                  <td className="px-4 py-3"><span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", u.status === "Active" ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400")}>{u.status}</span></td>
                  <td className="px-4 py-3 text-xs">{new Date(u.lastLogin).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setViewUser(u)}
                        className="rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:brightness-110 shadow-sm hover:shadow-md px-3 py-1.5 text-xs font-semibold text-white transition-colors duration-150"
                      >
                        View
                      </button>
                      {u.role !== "Admin" ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleStartEdit(u)}
                            className="rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 hover:brightness-110 shadow-sm hover:shadow-md px-3 py-1.5 text-xs font-semibold text-white transition-colors duration-150"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteId(u.id)}
                            className="rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:brightness-110 shadow-sm hover:shadow-md px-3 py-1.5 text-xs font-semibold text-white transition-colors duration-150"
                          >
                            Delete
                          </button>
                        </>
                      ) : (
                        <span className={cn("text-xs font-semibold italic px-3 py-1.5 rounded-xl border border-dashed select-none", dark ? "text-slate-500 border-white/10" : "text-slate-400 border-slate-200")}>
                          System Admin
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <AnimatePresence>{showModal && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className={cn("max-w-md w-full rounded-3xl p-6", dark ? "bg-slate-900 border border-white/10" : "bg-white border border-slate-200")}>
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-bold">Add User</h3><button onClick={() => setShowModal(false)}><X className="h-4 w-4" /></button></div>
            <div className="space-y-3">
              <div>
                <label className={cn("block text-xs font-medium mb-1", dark ? "text-slate-400" : "text-slate-500")}>Name</label>
                <input value={newName} onChange={(e) => setNewName(e.target.value)} className={cn("w-full rounded-xl border px-4 py-2.5 text-sm outline-none", dark ? "border-white/10 bg-slate-800 text-white" : "border-slate-200 bg-slate-50")} placeholder="Enter full name" />
              </div>
              <div>
                <label className={cn("block text-xs font-medium mb-1", dark ? "text-slate-400" : "text-slate-500")}>Email</label>
                <input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className={cn("w-full rounded-xl border px-4 py-2.5 text-sm outline-none", dark ? "border-white/10 bg-slate-800 text-white" : "border-slate-200 bg-slate-50")} placeholder="email@crh.com" />
              </div>
              <div>
                <label className={cn("block text-xs font-medium mb-1", dark ? "text-slate-400" : "text-slate-500")}>Username</label>
                <input value={newUsername} onChange={(e) => setNewUsername(e.target.value)} className={cn("w-full rounded-xl border px-4 py-2.5 text-sm outline-none", dark ? "border-white/10 bg-slate-800 text-white" : "border-slate-200 bg-slate-50")} placeholder="Enter login username" />
              </div>
              <div>
                <label className={cn("block text-xs font-medium mb-1", dark ? "text-slate-400" : "text-slate-500")}>Short Name (for AI Parser & Sales Person)</label>
                <input value={newShortName} onChange={(e) => setNewShortName(e.target.value)} className={cn("w-full rounded-xl border px-4 py-2.5 text-sm outline-none", dark ? "border-white/10 bg-slate-800 text-white" : "border-slate-200 bg-slate-50")} placeholder="e.g. MD, RW, DR" />
              </div>
              <div>
                <label className={cn("block text-xs font-medium mb-1", dark ? "text-slate-400" : "text-slate-500")}>Role</label>
                <select value={newRole} onChange={(e) => setNewRole(e.target.value)} className={cn("w-full rounded-xl border px-4 py-2.5 text-sm outline-none", dark ? "border-white/10 bg-slate-800 text-white" : "border-slate-200 bg-slate-50")}>
                  <option>CR Manager</option>
                  <option>CEO</option>
                  <option>Staff</option>
                </select>
              </div>
              <div>
                <label className={cn("block text-xs font-medium mb-1", dark ? "text-slate-400" : "text-slate-500")}>Password</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={cn("w-full rounded-xl border px-4 py-2.5 text-sm outline-none", dark ? "border-white/10 bg-slate-800 text-white" : "border-slate-200 bg-slate-50")} placeholder="Enter access password" />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className={cn("rounded-xl px-4 py-2.5 text-sm", dark ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-650")}>Cancel</button>
              <button
                onClick={() => {
                  if (!newName.trim() || !newEmail.trim() || !newUsername.trim() || !newShortName.trim() || !newPassword.trim()) {
                    alert("Please fill all required fields, including username and password!");
                    return;
                  }
                  const newUser = {
                    id: `u-${Date.now()}`,
                    name: newName.trim(),
                    email: newEmail.trim(),
                    username: newUsername.trim(),
                    role: newRole,
                    status: "Active",
                    lastLogin: new Date().toISOString(),
                    avatar: newName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2),
                    shortName: newShortName.trim().toUpperCase(),
                    permissions: DEFAULT_PERMISSIONS[newRole] || [],
                    password: newPassword.trim()
                  };
                  updateUsers([...userList, newUser]);
                  setShowModal(false);
                  setNewName("");
                  setNewEmail("");
                  setNewUsername("");
                  setNewShortName("");
                  setNewPassword("");
                  setNewRole("CR Manager");
                }}
                className="rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:brightness-110 active:scale-95 transition"
              >
                Save User
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}</AnimatePresence>
      {/* Edit User & Permissions Modal */}
      <AnimatePresence>
        {showEditModal && userToEdit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className={cn("max-w-md w-full rounded-3xl p-6", dark ? "bg-slate-900 border border-white/10" : "bg-white border border-slate-200")}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Edit User & Permissions</h3>
                <button onClick={() => { setShowEditModal(false); setUserToEdit(null); }} className="text-slate-400 hover:text-slate-200"><X className="h-4 w-4" /></button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className={cn("block text-xs font-medium mb-1", dark ? "text-slate-400" : "text-slate-500")}>Name</label>
                  <input value={editName} onChange={(e) => setEditName(e.target.value)} className={cn("w-full rounded-xl border px-4 py-2.5 text-sm outline-none", dark ? "border-white/10 bg-slate-800 text-white" : "border-slate-200 bg-slate-50")} placeholder="Enter full name" />
                </div>
                <div>
                  <label className={cn("block text-xs font-medium mb-1", dark ? "text-slate-400" : "text-slate-500")}>Email</label>
                  <input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className={cn("w-full rounded-xl border px-4 py-2.5 text-sm outline-none", dark ? "border-white/10 bg-slate-800 text-white" : "border-slate-200 bg-slate-50")} placeholder="email@crh.com" />
                </div>
                <div>
                  <label className={cn("block text-xs font-medium mb-1", dark ? "text-slate-400" : "text-slate-500")}>Username</label>
                  <input value={editUsername} onChange={(e) => setEditUsername(e.target.value)} className={cn("w-full rounded-xl border px-4 py-2.5 text-sm outline-none", dark ? "border-white/10 bg-slate-800 text-white" : "border-slate-200 bg-slate-50")} placeholder="Enter login username" />
                </div>
                <div>
                  <label className={cn("block text-xs font-medium mb-1", dark ? "text-slate-400" : "text-slate-500")}>Short Name (for AI Parser & Sales Person)</label>
                  <input value={editShortName} onChange={(e) => setEditShortName(e.target.value)} className={cn("w-full rounded-xl border px-4 py-2.5 text-sm outline-none", dark ? "border-white/10 bg-slate-800 text-white" : "border-slate-200 bg-slate-50")} placeholder="e.g. MD, RW, DR" />
                </div>
                <div>
                  <label className={cn("block text-xs font-medium mb-1", dark ? "text-slate-400" : "text-slate-500")}>Password</label>
                  <input type="password" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} className={cn("w-full rounded-xl border px-4 py-2.5 text-sm outline-none", dark ? "border-white/10 bg-slate-800 text-white" : "border-slate-200 bg-slate-50")} placeholder="Enter access password" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={cn("block text-xs font-medium mb-1", dark ? "text-slate-400" : "text-slate-500")}>Role</label>
                    <select value={editRole} onChange={(e) => handleEditRoleChange(e.target.value)} className={cn("w-full rounded-xl border px-4 py-2.5 text-sm outline-none", dark ? "border-white/10 bg-slate-800 text-white" : "border-slate-200 bg-slate-50")}>
                      <option>CR Manager</option>
                      <option>CEO</option>
                      <option>Staff</option>
                    </select>
                  </div>
                  <div>
                    <label className={cn("block text-xs font-medium mb-1", dark ? "text-slate-400" : "text-slate-500")}>Status</label>
                    <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} className={cn("w-full rounded-xl border px-4 py-2.5 text-sm outline-none", dark ? "border-white/10 bg-slate-800 text-white" : "border-slate-200 bg-slate-50")}>
                      <option value="Active">Active</option>
                      <option value="Disabled">Disabled</option>
                    </select>
                  </div>
                </div>

              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button onClick={() => { setShowEditModal(false); setUserToEdit(null); }} className={cn("rounded-xl px-4 py-2.5 text-sm", dark ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-650")}>Cancel</button>
                <button
                  onClick={handleSaveEdit}
                  className="rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:brightness-110 active:scale-95 transition"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {deleteId && (
          <ConfirmationModal
            title="Delete User"
            message="Are you sure you want to delete this user? This action cannot be undone."
            confirmLabel="Delete"
            onConfirm={() => {
              updateUsers(userList.filter((u) => u.id !== deleteId));
              setDeleteId(null);
            }}
            onClose={() => setDeleteId(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewUser && (
          <ViewUserModal
            user={viewUser}
            onClose={() => setViewUser(null)}
          />
        )}
      </AnimatePresence>
    </AppShell>
  );
}
