import { AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Plus, RefreshCw, Save, Search, Trash2, UserCog } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Badge, Card, ConfirmDialog, Inp, ModalShell, Pagination, Sel } from "../components/ui";
import { Hotel, User } from "../types";
import { API, authH, fmtDate } from "../utils/helpers";

export function UserModal({ user, hotels, onClose, onSave }: { user: Partial<User> & { password?: string; allocatedHotel?: string }; hotels: Hotel[]; onClose: () => void; onSave: (u: Partial<User> & { password?: string }) => Promise<void> }) {
    const [draft, setDraft] = useState({ ...user });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const save = async () => { 
      setError("");
      const payload = { ...draft };
      if (payload.role !== "receptionist") {
        delete payload.allocatedHotel;
      }
      setSaving(true); await onSave(payload); setSaving(false); 
    };
    return (
    <ModalShell title={"Edit User Role & Status"} onClose={onClose}>
      <div className="space-y-4">
        <div className="bg-sand-100 p-4 rounded-xl mb-4">
          <p className="text-sm font-semibold text-ink-900">{draft.name}</p>
          <p className="text-sm text-ink-800/60">{draft.email}</p>
        </div>

        <Sel label="Account Status" value={draft.status ?? "active"} onChange={e => setDraft(d => ({ ...d, status: e.target.value as any }))}>
          <option value="active">Active</option>
          <option value="deactivated">Deactivated</option>
        </Sel>
        
        <Sel label="Role" value={draft.role ?? "user"} onChange={e => setDraft(d => ({ ...d, role: e.target.value as "user" | "admin" | "receptionist" }))}>
          <option value="user">User</option>
          <option value="receptionist">Receptionist</option>
          <option value="admin">Admin</option>
        </Sel>
        
        {draft.role === "receptionist" && (
          <Sel label="Allocated Hotel *" value={draft.allocatedHotel ?? ""} onChange={e => setDraft(d => ({ ...d, allocatedHotel: e.target.value }))}>
            <option value="">Select a hotel...</option>
            {(hotels || []).map(h => (
              <option key={h._id || h.id} value={h._id || h.id}>{h.name}</option>
            ))}
          </Sel>
        )}
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <div className="flex justify-end gap-3 pt-2 border-t border-sand-200">
          <button onClick={onClose} className="px-5 py-3 rounded-2xl bg-sand-100 text-ink-800 text-sm font-medium hover:bg-sand-200 transition-colors">Cancel</button>
          <button onClick={save} disabled={saving || (draft.role === "receptionist" && !draft.allocatedHotel)}
            className="px-7 py-3 rounded-2xl bg-ink-900 text-sand-50 text-sm font-semibold hover:bg-leaf-700 transition-colors disabled:opacity-50 flex items-center gap-2">
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      </div>
    </ModalShell>
    );
}

export default function UsersSection({ onToast, currentUserId, hotels }: { onToast: (m: string, t: "success" | "error") => void; currentUserId: string | null; hotels: Hotel[] }) {
    const [users, setUsers] = useState<User[]>([]);
    const [editing, setEditing] = useState<(Partial<User> & { password?: string }) | null>(null);
    const [confirm, setConfirm] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const PER_PAGE = 12;
    const load = useCallback(async () => {
            setLoading(true);
            try {
              const r = await fetch(`${API}/admin/users`, { headers: authH() });
              if (r.ok) { const d = await r.json(); setUsers(Array.isArray(d) ? d : d.data ?? []); }
            } catch { }
            setLoading(false);
          }, []);
    const adminUser = (() => { try { return JSON.parse(localStorage.getItem("adminUser") || "{}"); } catch { return {}; } })();
    const isReceptionist = adminUser?.role === "receptionist";
    useEffect(() => { load(); }, [load]);
    const filtered = users.filter(u => {
            const matchRole = roleFilter === "all" || u.role === roleFilter;
            const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
            return matchRole && matchSearch;
          });
    const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
    const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
    const save = async (user: Partial<User> & { password?: string }) => {
            const isNew = !(user._id || user.id);
            const userId = user._id || user.id;
            const url = isNew ? `${API}/admin/users` : `${API}/admin/users/${userId}`;
            try {
              const body = { ...user };
              if (!isNew && !body.password) delete body.password;
              const r = await fetch(url, { method: isNew ? "POST" : "PUT", headers: authH(), body: JSON.stringify(body) });
              if (!r.ok) throw new Error((await r.json()).message);
              onToast(isNew ? "User created" : "User updated", "success");
              setEditing(null); load();
            } catch (e: unknown) { onToast(e instanceof Error ? e.message : "Save failed", "error"); }
          };
    const del = async (id: string) => {
            try {
              const r = await fetch(`${API}/admin/users/${id}`, { method: "DELETE", headers: authH() });
              if (!r.ok) throw new Error((await r.json()).message);
              onToast("User deleted", "success"); load();
            } catch (e: unknown) { onToast(e instanceof Error ? e.message : "Delete failed", "error"); }
            setConfirm(null);
          };
    return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div><h1 className="font-serif text-4xl text-ink-900">Users</h1><p className="text-ink-800/50 text-sm">{users.length} registered - {users.filter(u => u.role === "admin").length} admins</p></div>
        <div className="flex gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-800/40" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search users-"
              className="pl-10 pr-4 py-2.5 rounded-2xl bg-sand-50 border border-sand-200 text-sm focus:outline-none focus:border-leaf-600 w-52" />
          </div>
          <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
            className="px-4 py-2.5 rounded-2xl bg-sand-50 border border-sand-200 text-sm focus:outline-none appearance-none">
            <option value="all">All Roles</option>
            <option value="user">Users</option>
            <option value="receptionist">Receptionists</option>
            <option value="admin">Admins</option>
          </select>
        </div>
      </div>
      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-ink-800/40"><RefreshCw className="w-6 h-6 animate-spin mr-3" />Loading users-</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-sand-100 text-ink-800/60 text-[11px] uppercase tracking-widest">
                <tr>
                  <th className="px-5 py-4 text-left font-semibold">User</th>
                  <th className="px-5 py-4 text-left font-semibold hidden md:table-cell">Email</th>
                  <th className="px-5 py-4 text-left font-semibold">Role</th>
                  <th className="px-5 py-4 text-left font-semibold">Status</th>
                  <th className="px-5 py-4 text-left font-semibold hidden lg:table-cell">Joined</th>
                  <th className="px-5 py-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-ink-800/40 text-sm">No data available</td></tr>
              ) : (paged || []).map(u => (
                  <tr key={u._id || u.id} className="border-t border-sand-200 hover:bg-sand-50/60 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-linear-to-br from-leaf-700/20 to-ocean-500/20 flex items-center justify-center shrink-0">
                          <span className="text-sm font-semibold text-ink-900">{u.name[0]?.toUpperCase()}</span>
                        </div>
                        <span className="font-medium text-ink-900">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-ink-800/60 hidden md:table-cell">{u.email}</td>
                    <td className="px-5 py-4"><Badge status={u.role} /></td>
                    <td className="px-5 py-4"><Badge status={u.status === "deactivated" ? "pending" : "active"} /></td>
                    <td className="px-5 py-4 text-ink-800/40 text-xs hidden lg:table-cell">{fmtDate(u.createdAt)}</td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setEditing({ ...u, password: "" })} className="w-9 h-9 rounded-xl bg-leaf-700/10 text-leaf-700 hover:bg-leaf-700 hover:text-sand-50 flex items-center justify-center transition-colors"><UserCog className="w-4 h-4" /></button>
                        {(u._id === currentUserId || u.id === currentUserId || (isReceptionist && u.role === "admin")) ? (
                          <span
                            title="You can't delete this account"
                            className="w-9 h-9 rounded-xl bg-sand-200 text-ink-800/30 flex items-center justify-center cursor-not-allowed"
                          >
                            <Trash2 className="w-4 h-4" />
                          </span>
                        ) : (
                          <button onClick={() => setConfirm(u._id || u.id || null)} className="w-9 h-9 rounded-xl bg-red-500/10 text-red-600 hover:bg-red-600 hover:text-white flex items-center justify-center transition-colors"><Trash2 className="w-4 h-4" /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {!loading && <Pagination page={page} pages={pages} total={filtered.length} onPage={setPage} />}
      </Card>
      <AnimatePresence>{editing && <UserModal user={editing} hotels={hotels} onClose={() => setEditing(null)} onSave={save} />}</AnimatePresence>
      {confirm && <ConfirmDialog message="This will permanently delete this user account. Their bookings will remain in the database." onConfirm={() => del(confirm)} onCancel={() => setConfirm(null)} />}
    </div>
    );
}

export const EMPTY_USER = { name: "", email: "", password: "", role: "user" as const };
