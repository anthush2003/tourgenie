import { AnimatePresence } from "framer-motion";
import { Pencil, Plus, RefreshCw, Save, Search, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Badge, Card, ConfirmDialog, Inp, ModalShell, Pagination, Sel, Txa } from "../components/ui";
import { Facility } from "../types";
import { API, authH, cls, fmt } from "../utils/helpers";

export function FacilityModal({ facility, onClose, onSave }: { facility: Facility; onClose: () => void; onSave: (f: Facility) => Promise<void> }) {
    const [draft, setDraft] = useState<Facility>({ ...facility });
    const [saving, setSaving] = useState(false);
    const isNew = !draft._id && !draft.id;
    const save = async () => { setSaving(true); await onSave(draft); setSaving(false); };
    return (
    <ModalShell title={isNew ? "New Facility" : "Edit Facility"} onClose={onClose}>
      <div className="space-y-4">
        <Inp label="Facility Name *" value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} placeholder="Spa Access" />
        <div className="grid sm:grid-cols-2 gap-4">
          <Sel label="Category" value={draft.category} onChange={e => setDraft(d => ({ ...d, category: e.target.value as Facility["category"] }))}>
            {FAC_CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </Sel>
          <Inp label="Icon (lucide-react key)" value={draft.icon} onChange={e => setDraft(d => ({ ...d, icon: e.target.value }))} placeholder="sparkles" />
        </div>
        <Txa label="Description" value={draft.description} onChange={e => setDraft(d => ({ ...d, description: e.target.value }))} placeholder="Describe this facility…" />
        <Inp label="Extra Price (LKR, 0 = included)" type="number" min="0" value={draft.extraPrice}
          onChange={e => setDraft(d => ({ ...d, extraPrice: parseInt(e.target.value) || 0 }))} />
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <div className={cls("w-11 h-6 rounded-full transition-all", draft.isActive ? "bg-leaf-700" : "bg-sand-200")}
            onClick={() => setDraft(d => ({ ...d, isActive: !d.isActive }))}>
            <div className={cls("w-5 h-5 rounded-full bg-white shadow-md m-0.5 transition-all", draft.isActive ? "translate-x-5" : "translate-x-0")} />
          </div>
          <span className="text-sm font-medium text-ink-900">{draft.isActive ? "Active" : "Inactive"}</span>
        </label>
        <div className="flex justify-end gap-3 pt-2 border-t border-sand-200">
          <button onClick={onClose} className="px-5 py-3 rounded-2xl bg-sand-100 text-ink-800 text-sm font-medium hover:bg-sand-200 transition-colors">Cancel</button>
          <button onClick={save} disabled={saving || !draft.name}
            className="px-7 py-3 rounded-2xl bg-ink-900 text-sand-50 text-sm font-semibold hover:bg-leaf-700 transition-colors disabled:opacity-50 flex items-center gap-2">
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isNew ? "Create Facility" : "Save Changes"}
          </button>
        </div>
      </div>
    </ModalShell>
    );
}

export default function FacilitiesCRUD({ onToast }: { onToast: (m: string, t: "success" | "error") => void }) {
    const [facilities, setFacilities] = useState<Facility[]>([]);
    const [editing, setEditing] = useState<Facility | null>(null);
    const [confirm, setConfirm] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [catFilter, setCatFilter] = useState("all");
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const PER_PAGE = 12;
    const load = useCallback(async () => {
            setLoading(true);
            try {
              const r = await fetch(`${API}/facilities?includeInactive=true`, { headers: authH() });
              if (r.ok) {
                const data = await r.json();
                setFacilities(Array.isArray(data) ? data : (data?.data ?? []));
              }
            } catch { }
            setLoading(false);
          }, []);
    useEffect(() => { load(); }, [load]);
    const filtered = facilities.filter(f => {
            const matchCat = catFilter === "all" || f.category === catFilter;
            const matchSearch = !search || f.name.toLowerCase().includes(search.toLowerCase());
            return matchCat && matchSearch;
          });
    const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
    const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
    const save = async (fac: Facility) => {
            const isNew = !fac._id && !fac.id;
            const url = isNew ? `${API}/facilities` : `${API}/facilities/${fac._id || fac.id}`;
            try {
              const r = await fetch(url, { method: isNew ? "POST" : "PUT", headers: authH(), body: JSON.stringify(fac) });
              if (!r.ok) throw new Error((await r.json()).message);
              onToast(isNew ? "Facility created" : "Facility updated", "success");
              setEditing(null); load();
            } catch (e: unknown) { onToast(e instanceof Error ? e.message : "Save failed", "error"); }
          };
    const del = async (id: string) => {
            try {
              const r = await fetch(`${API}/facilities/${id}`, { method: "DELETE", headers: authH() });
              if (!r.ok) throw new Error((await r.json()).message);
              onToast("Facility deleted", "success"); load();
            } catch (e: unknown) { onToast(e instanceof Error ? e.message : "Delete failed", "error"); }
            setConfirm(null);
          };
    const toggleActive = async (fac: Facility) => {
            await save({ ...fac, isActive: !fac.isActive });
          };
    return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div><h1 className="font-serif text-4xl text-ink-900">Facilities</h1><p className="text-ink-800/50 text-sm">{facilities.length} in catalog</p></div>
        <div className="flex gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-800/40" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search facilities…"
              className="pl-10 pr-4 py-2.5 rounded-2xl bg-sand-50 border border-sand-200 text-sm focus:outline-none focus:border-leaf-600 w-52" />
          </div>
          <select value={catFilter} onChange={e => { setCatFilter(e.target.value); setPage(1); }}
            className="px-4 py-2.5 rounded-2xl bg-sand-50 border border-sand-200 text-sm focus:outline-none appearance-none">
            <option value="all">All Categories</option>
            {FAC_CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </select>
          <button onClick={() => setEditing({ ...EMPTY_FACILITY })}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-ink-900 text-sand-50 text-sm font-semibold hover:bg-leaf-700 transition-colors">
            <Plus className="w-4 h-4" />Add Facility
          </button>
        </div>
      </div>
      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-ink-800/40"><RefreshCw className="w-6 h-6 animate-spin mr-3" />Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-sand-100 text-ink-800/60 text-[11px] uppercase tracking-widest">
                <tr>
                  <th className="px-5 py-4 text-left font-semibold">Facility</th>
                  <th className="px-5 py-4 text-left font-semibold hidden sm:table-cell">Category</th>
                  <th className="px-5 py-4 text-left font-semibold hidden md:table-cell">Extra Price</th>
                  <th className="px-5 py-4 text-left font-semibold">Status</th>
                  <th className="px-5 py-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
              {paged.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-ink-800/40 text-sm">No data available</td></tr>
              ) : (paged || []).map(f => (
                  <tr key={f._id || f.id} className="border-t border-sand-200 hover:bg-sand-50/60 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-medium text-ink-900">{f.name}</div>
                      <div className="text-xs text-ink-800/40 mt-0.5 truncate max-w-xs">{f.description || "—"}</div>
                    </td>
                    <td className="px-5 py-4 hidden sm:table-cell"><Badge status={f.category} /></td>
                    <td className="px-5 py-4 hidden md:table-cell text-ink-800/70">
                      {f.extraPrice > 0 ? fmt(f.extraPrice) : <span className="text-leaf-700 font-medium text-xs">Included</span>}
                    </td>
                    <td className="px-5 py-4">
                      <button onClick={() => toggleActive(f)}
                        className={cls("text-[11px] px-3 py-1.5 rounded-full font-semibold uppercase tracking-wide border transition-colors",
                          f.isActive ? "bg-leaf-700/10 text-leaf-700 border-leaf-700/20 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                            : "bg-sand-200 text-ink-800/50 border-sand-200 hover:bg-leaf-700/10 hover:text-leaf-700 hover:border-leaf-700/20")}>
                        {f.isActive ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setEditing(f)} className="w-9 h-9 rounded-xl bg-leaf-700/10 text-leaf-700 hover:bg-leaf-700 hover:text-sand-50 flex items-center justify-center transition-colors"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => setConfirm(f._id || f.id!)} className="w-9 h-9 rounded-xl bg-red-500/10 text-red-600 hover:bg-red-600 hover:text-white flex items-center justify-center transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        { }
        {!loading && <Pagination page={page} pages={pages} total={filtered.length} onPage={setPage} />}
      </Card>
      <AnimatePresence>{editing && <FacilityModal facility={editing} onClose={() => setEditing(null)} onSave={save} />}</AnimatePresence>
      {confirm && <ConfirmDialog message="This will delete the facility and remove it from all hotels." onConfirm={() => del(confirm)} onCancel={() => setConfirm(null)} />}
    </div>
    );
}

export const EMPTY_FACILITY: Facility = { name: "", category: "general", icon: "sparkles", description: "", extraPrice: 0, isActive: true };
export const FAC_CATEGORIES = ["wellness", "dining", "transport", "recreation", "business", "general"] as const;
