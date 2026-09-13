import { AnimatePresence } from "framer-motion";
import { Pencil, Plus, RefreshCw, Save, Search, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Badge, Card, ConfirmDialog, ImageUploadWidget, Inp, ModalShell, Pagination, Sel, Txa } from "../components/ui";
import { Vehicle } from "../types";
import { API, authH, cls, fmt } from "../utils/helpers";

export function VehicleModal({ vehicle, onClose, onSave }: { vehicle: Vehicle; onClose: () => void; onSave: (v: Vehicle) => Promise<void> }) {
    const [draft, setDraft] = useState<Vehicle>({ ...vehicle });
    const [saving, setSaving] = useState(false);
    const isNew = !draft._id && !draft.id;
    const save = async () => { setSaving(true); await onSave(draft); setSaving(false); };
    return (
    <ModalShell title={isNew ? "New Vehicle" : "Edit Vehicle"} onClose={onClose}>
      <div className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <Inp label="Vehicle Name *" value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} placeholder="Toyota KDH Van" />
          <Sel label="Type" value={draft.type} onChange={e => setDraft(d => ({ ...d, type: e.target.value as Vehicle["type"] }))}>
            {VEHICLE_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </Sel>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Inp label="Seating Capacity *" type="number" min="1" value={draft.capacity}
            onChange={e => setDraft(d => ({ ...d, capacity: parseInt(e.target.value) || 1 }))} />
          <Inp label="Price Per Day (LKR) *" type="number" min="0" value={draft.pricePerDay}
            onChange={e => setDraft(d => ({ ...d, pricePerDay: parseFloat(e.target.value) || 0 }))} />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Inp label="License Plate" value={draft.plateNumber} onChange={e => setDraft(d => ({ ...d, plateNumber: e.target.value }))} placeholder="WP CAB-1234" />
          <div className="flex items-end gap-6 pb-2.5">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <div className={cls("w-10 h-5.5 rounded-full transition-all", draft.acAvailable ? "bg-leaf-700" : "bg-sand-200")}
                onClick={() => setDraft(d => ({ ...d, acAvailable: !d.acAvailable }))}>
                <div className={cls("w-4.5 h-4.5 rounded-full bg-white shadow-md m-0.5 transition-all", draft.acAvailable ? "translate-x-4.5" : "translate-x-0")} />
              </div>
              <span className="text-xs font-medium text-ink-900">A/C</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <div className={cls("w-10 h-5.5 rounded-full transition-all", draft.driverIncluded ? "bg-leaf-700" : "bg-sand-200")}
                onClick={() => setDraft(d => ({ ...d, driverIncluded: !d.driverIncluded }))}>
                <div className={cls("w-4.5 h-4.5 rounded-full bg-white shadow-md m-0.5 transition-all", draft.driverIncluded ? "translate-x-4.5" : "translate-x-0")} />
              </div>
              <span className="text-xs font-medium text-ink-900">Driver Included</span>
            </label>
          </div>
        </div>
        {draft.driverIncluded && (
          <div className="grid sm:grid-cols-2 gap-4">
            <Inp label="Driver Name" value={draft.driverName} onChange={e => setDraft(d => ({ ...d, driverName: e.target.value }))} placeholder="Nimal Perera" />
            <Inp label="Driver Phone" value={draft.driverPhone} onChange={e => setDraft(d => ({ ...d, driverPhone: e.target.value }))} placeholder="+94 77 123 4567" />
          </div>
        )}
        <Txa label="Description" value={draft.description} onChange={e => setDraft(d => ({ ...d, description: e.target.value }))} placeholder="Comfortable air-conditioned van, ideal for families-" />
        <ImageUploadWidget category="vehicles" label="Vehicle Photos" urls={draft.photos} onChange={photos => setDraft(d => ({ ...d, photos }))} />
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <div className={cls("w-11 h-6 rounded-full transition-all", draft.isActive ? "bg-leaf-700" : "bg-sand-200")}
            onClick={() => setDraft(d => ({ ...d, isActive: !d.isActive }))}>
            <div className={cls("w-5 h-5 rounded-full bg-white shadow-md m-0.5 transition-all", draft.isActive ? "translate-x-5" : "translate-x-0")} />
          </div>
          <span className="text-sm font-medium text-ink-900">{draft.isActive ? "Available for booking" : "Unavailable"}</span>
        </label>
        <div className="flex justify-end gap-3 pt-2 border-t border-sand-200">
          <button onClick={onClose} className="px-5 py-3 rounded-2xl bg-sand-100 text-ink-800 text-sm font-medium hover:bg-sand-200 transition-colors">Cancel</button>
          <button onClick={save} disabled={saving || !draft.name || draft.capacity < 1}
            className="px-7 py-3 rounded-2xl bg-ink-900 text-sand-50 text-sm font-semibold hover:bg-leaf-700 transition-colors disabled:opacity-50 flex items-center gap-2">
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isNew ? "Add Vehicle" : "Save Changes"}
          </button>
        </div>
      </div>
    </ModalShell>
    );
}

export default function VehiclesCRUD({ onToast }: { onToast: (m: string, t: "success" | "error") => void }) {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [editing, setEditing] = useState<Vehicle | null>(null);
    const [confirm, setConfirm] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const PER_PAGE = 12;
    const load = useCallback(async () => {
            setLoading(true);
            try {
              const r = await fetch(`${API}/vehicles?includeInactive=true`, { headers: authH() });
              if (r.ok) {
                const data = await r.json();
                setVehicles(Array.isArray(data) ? data : (data?.data ?? []));
              }
            } catch { }
            setLoading(false);
          }, []);
    useEffect(() => { load(); }, [load]);
    const filtered = vehicles.filter(v => {
            const matchType = typeFilter === "all" || v.type === typeFilter;
            const matchSearch = !search || v.name.toLowerCase().includes(search.toLowerCase()) || v.plateNumber.toLowerCase().includes(search.toLowerCase());
            return matchType && matchSearch;
          });
    const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
    const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
    const save = async (v: Vehicle) => {
            const isNew = !v._id && !v.id;
            const url = isNew ? `${API}/vehicles` : `${API}/vehicles/${v._id || v.id}`;
            try {
              const r = await fetch(url, { method: isNew ? "POST" : "PUT", headers: authH(), body: JSON.stringify(v) });
              if (!r.ok) throw new Error((await r.json()).message);
              onToast(isNew ? "Vehicle added" : "Vehicle updated", "success");
              setEditing(null); load();
            } catch (e: unknown) { onToast(e instanceof Error ? e.message : "Save failed", "error"); }
          };
    const del = async (id: string) => {
            try {
              const r = await fetch(`${API}/vehicles/${id}`, { method: "DELETE", headers: authH() });
              if (!r.ok) throw new Error((await r.json()).message);
              onToast("Vehicle deleted", "success"); load();
            } catch (e: unknown) { onToast(e instanceof Error ? e.message : "Delete failed", "error"); }
            setConfirm(null);
          };
    return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div><h1 className="font-serif text-4xl text-ink-900">Vehicles</h1><p className="text-ink-800/50 text-sm">{vehicles.length} in fleet - shown to customers booking a tour package</p></div>
        <div className="flex gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-800/40" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search vehicles or plate..."
              className="pl-10 pr-4 py-2.5 rounded-2xl bg-sand-50 border border-sand-200 text-sm focus:outline-none focus:border-leaf-600 w-56" />
          </div>
          <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
            className="px-4 py-2.5 rounded-2xl bg-sand-50 border border-sand-200 text-sm focus:outline-none appearance-none">
            <option value="all">All Types</option>
            {VEHICLE_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
          <button onClick={() => setEditing({ ...EMPTY_VEHICLE })}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-ink-900 text-sand-50 text-sm font-semibold hover:bg-leaf-700 transition-colors">
            <Plus className="w-4 h-4" />Add Vehicle
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
                  <th className="px-5 py-4 text-left font-semibold">Vehicle</th>
                  <th className="px-5 py-4 text-left font-semibold hidden sm:table-cell">Type</th>
                  <th className="px-5 py-4 text-left font-semibold hidden md:table-cell">Capacity</th>
                  <th className="px-5 py-4 text-left font-semibold hidden md:table-cell">Price/Day</th>
                  <th className="px-5 py-4 text-left font-semibold">Status</th>
                  <th className="px-5 py-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
              {paged.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-ink-800/40 text-sm">No data available</td></tr>
              ) : (paged || []).map(v => (
                  <tr key={v._id || v.id} className="border-t border-sand-200 hover:bg-sand-50/60 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-medium text-ink-900">{v.name}</div>
                      <div className="text-xs text-ink-800/40 mt-0.5">{v.plateNumber || "No plate on file"}{v.driverIncluded && v.driverName ? ` - Driver: ${v.driverName}` : ""}</div>
                    </td>
                    <td className="px-5 py-4 hidden sm:table-cell"><Badge status={v.type} /></td>
                    <td className="px-5 py-4 hidden md:table-cell text-ink-800/70">{v.capacity} seats</td>
                    <td className="px-5 py-4 hidden md:table-cell text-ink-800/70">{fmt(v.pricePerDay)}</td>
                    <td className="px-5 py-4">
                      <span className={cls("text-[11px] px-3 py-1.5 rounded-full font-semibold uppercase tracking-wide border",
                        v.isActive ? "bg-leaf-700/10 text-leaf-700 border-leaf-700/20" : "bg-sand-200 text-ink-800/50 border-sand-200")}>
                        {v.isActive ? "Available" : "Unavailable"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setEditing(v)} className="w-9 h-9 rounded-xl bg-leaf-700/10 text-leaf-700 hover:bg-leaf-700 hover:text-sand-50 flex items-center justify-center transition-colors"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => setConfirm(v._id || v.id!)} className="w-9 h-9 rounded-xl bg-red-500/10 text-red-600 hover:bg-red-600 hover:text-white flex items-center justify-center transition-colors"><Trash2 className="w-4 h-4" /></button>
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
      <AnimatePresence>{editing && <VehicleModal vehicle={editing} onClose={() => setEditing(null)} onSave={save} />}</AnimatePresence>
      {confirm && <ConfirmDialog message="This will permanently delete this vehicle from the fleet." onConfirm={() => del(confirm)} onCancel={() => setConfirm(null)} />}
    </div>
    );
}

export const EMPTY_VEHICLE: Vehicle = {
      name: "", type: "van", capacity: 4, pricePerDay: 5000,
      driverIncluded: true, driverName: "", driverPhone: "",
      acAvailable: true, photos: [], description: "", plateNumber: "", isActive: true,
    };
export const VEHICLE_TYPES = ["car", "van", "suv", "minibus", "bus", "tuktuk", "motorbike"] as const;
