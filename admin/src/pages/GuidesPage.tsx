import { AnimatePresence } from "framer-motion";
import { Pencil, Plus, RefreshCw, Save, Search, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Card, ConfirmDialog, ImageUploadWidget, Inp, ModalShell, Pagination, Txa } from "../components/ui";
import { Guide } from "../types";
import { API, authH, cls, fmt } from "../utils/helpers";

export function GuideModal({ guide, onClose, onSave }: { guide: Guide; onClose: () => void; onSave: (g: Guide) => Promise<void> }) {
    const [draft, setDraft] = useState<Guide>({ ...guide });
    const [saving, setSaving] = useState(false);
    const [langInput, setLangInput] = useState("");
    const [error, setError] = useState("");
    const isNew = !draft._id && !draft.id;
    const save = async () => { 
      if (!draft.name?.trim()) return setError("Name is required");
      if (draft.pricePerDay <= 0) return setError("Price per day must be greater than 0");
      const phoneRegex = /^\+?[\d\s-]{10,}$/;
      if (draft.phone && !phoneRegex.test(draft.phone)) return setError("Invalid phone format");
      setError("");
      setSaving(true); await onSave(draft); setSaving(false); 
    };
    const addLanguage = () => {
            const v = langInput.trim();
            if (v && !draft.languages.includes(v)) {
              setDraft(d => ({ ...d, languages: [...d.languages, v] }));
            }
            setLangInput("");
          };
    const removeLanguage = (lang: string) => setDraft(d => ({ ...d, languages: d.languages.filter(l => l !== lang) }));
    return (
    <ModalShell title={isNew ? "New Guide" : "Edit Guide"} onClose={onClose}>
      <div className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <Inp label="Guide Name *" value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} placeholder="Nadeesha Fernando" />
          <Inp label="Phone" value={draft.phone} onChange={e => setDraft(d => ({ ...d, phone: e.target.value }))} placeholder="+94 71 234 5678" />
        </div>
        <div>
          <label className="text-xs font-semibold text-ink-800/60 uppercase tracking-wider block mb-2">Languages</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {(draft.languages || []).map(lang => (
              <span key={lang} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-leaf-700/10 text-leaf-700 font-medium">
                {lang}
                <button onClick={() => removeLanguage(lang)} className="hover:text-red-600"><X className="w-3 h-3" /></button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={langInput} onChange={e => setLangInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addLanguage(); } }}
              placeholder="Add a language, press Enter"
              className="flex-1 px-4 py-2.5 rounded-xl bg-sand-50 border border-sand-200 text-sm focus:outline-none focus:border-leaf-600" />
            <button onClick={addLanguage} className="px-4 py-2.5 rounded-xl bg-sand-100 text-ink-800 text-sm font-medium hover:bg-sand-200">Add</button>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Inp label="Price Per Day (LKR) *" type="number" min="0" value={draft.pricePerDay}
            onChange={e => setDraft(d => ({ ...d, pricePerDay: parseFloat(e.target.value) || 0 }))} />
          <Inp label="Years of Experience" type="number" min="0" value={draft.yearsExperience}
            onChange={e => setDraft(d => ({ ...d, yearsExperience: parseInt(e.target.value) || 0 }))} />
        </div>
        <Txa label="Bio" value={draft.bio} onChange={e => setDraft(d => ({ ...d, bio: e.target.value }))} placeholder="Licensed local guide specializing in cultural heritage tours-" />
        <ImageUploadWidget category="guides" label="Guide Photo" urls={draft.photo ? [draft.photo] : []} onChange={photos => setDraft(d => ({ ...d, photo: photos[photos.length - 1] || "" }))} />
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <div className={cls("w-11 h-6 rounded-full transition-all", draft.isActive ? "bg-leaf-700" : "bg-sand-200")}
            onClick={() => setDraft(d => ({ ...d, isActive: !d.isActive }))}>
            <div className={cls("w-5 h-5 rounded-full bg-white shadow-md m-0.5 transition-all", draft.isActive ? "translate-x-5" : "translate-x-0")} />
          </div>
          <span className="text-sm font-medium text-ink-900">{draft.isActive ? "Available for booking" : "Unavailable"}</span>
        </label>
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <div className="flex justify-end gap-3 pt-2 border-t border-sand-200">
          <button onClick={onClose} className="px-5 py-3 rounded-2xl bg-sand-100 text-ink-800 text-sm font-medium hover:bg-sand-200 transition-colors">Cancel</button>
          <button onClick={save} disabled={saving || !draft.name || draft.pricePerDay < 0}
            className="px-7 py-3 rounded-2xl bg-ink-900 text-sand-50 text-sm font-semibold hover:bg-leaf-700 transition-colors disabled:opacity-50 flex items-center gap-2">
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isNew ? "Add Guide" : "Save Changes"}
          </button>
        </div>
      </div>
    </ModalShell>
    );
}

export default function GuidesCRUD({ onToast }: { onToast: (m: string, t: "success" | "error") => void }) {
    const [guides, setGuides] = useState<Guide[]>([]);
    const [editing, setEditing] = useState<Guide | null>(null);
    const [confirm, setConfirm] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const PER_PAGE = 12;
    const load = useCallback(async () => {
            setLoading(true);
            try {
              const r = await fetch(`${API}/guides?includeInactive=true`, { headers: authH() });
              if (r.ok) {
                const data = await r.json();
                setGuides(Array.isArray(data) ? data : (data?.data ?? []));
              }
            } catch { }
            setLoading(false);
          }, []);
    useEffect(() => { load(); }, [load]);
    const filtered = guides.filter(g => !search || g.name.toLowerCase().includes(search.toLowerCase()));
    const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
    const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
    const save = async (g: Guide) => {
            const isNew = !g._id && !g.id;
            const url = isNew ? `${API}/guides` : `${API}/guides/${g._id || g.id}`;
            try {
              const r = await fetch(url, { method: isNew ? "POST" : "PUT", headers: authH(), body: JSON.stringify(g) });
              if (!r.ok) throw new Error((await r.json()).message);
              onToast(isNew ? "Guide added" : "Guide updated", "success");
              setEditing(null); load();
            } catch (e: unknown) { onToast(e instanceof Error ? e.message : "Save failed", "error"); }
          };
    const del = async (id: string) => {
            try {
              const r = await fetch(`${API}/guides/${id}`, { method: "DELETE", headers: authH() });
              if (!r.ok) throw new Error((await r.json()).message);
              onToast("Guide deleted", "success"); load();
            } catch (e: unknown) { onToast(e instanceof Error ? e.message : "Delete failed", "error"); }
            setConfirm(null);
          };
    return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div><h1 className="font-serif text-4xl text-ink-900">Guides</h1><p className="text-ink-800/50 text-sm">{guides.length} on roster - shown to customers as an optional add-on when booking a tour</p></div>
        <div className="flex gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-800/40" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search guides-"
              className="pl-10 pr-4 py-2.5 rounded-2xl bg-sand-50 border border-sand-200 text-sm focus:outline-none focus:border-leaf-600 w-56" />
          </div>
          <button onClick={() => setEditing({ ...EMPTY_GUIDE })}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-ink-900 text-sand-50 text-sm font-semibold hover:bg-leaf-700 transition-colors">
            <Plus className="w-4 h-4" />Add Guide
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
                  <th className="px-5 py-4 text-left font-semibold">Guide</th>
                  <th className="px-5 py-4 text-left font-semibold hidden sm:table-cell">Languages</th>
                  <th className="px-5 py-4 text-left font-semibold hidden md:table-cell">Experience</th>
                  <th className="px-5 py-4 text-left font-semibold hidden md:table-cell">Price/Day</th>
                  <th className="px-5 py-4 text-left font-semibold">Status</th>
                  <th className="px-5 py-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
              {paged.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-ink-800/40 text-sm">No data available</td></tr>
              ) : (paged || []).map(g => (
                  <tr key={g._id || g.id} className="border-t border-sand-200 hover:bg-sand-50/60 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-medium text-ink-900">{g.name}</div>
                      <div className="text-xs text-ink-800/40 mt-0.5">{g.phone || "No phone on file"}</div>
                    </td>
                    <td className="px-5 py-4 hidden sm:table-cell text-ink-800/70">{g.languages?.join(", ") || "-"}</td>
                    <td className="px-5 py-4 hidden md:table-cell text-ink-800/70">{g.yearsExperience} yr{g.yearsExperience === 1 ? "" : "s"}</td>
                    <td className="px-5 py-4 hidden md:table-cell text-ink-800/70">{fmt(g.pricePerDay)}</td>
                    <td className="px-5 py-4">
                      <span className={cls("text-[11px] px-3 py-1.5 rounded-full font-semibold uppercase tracking-wide border",
                        g.isActive ? "bg-leaf-700/10 text-leaf-700 border-leaf-700/20" : "bg-sand-200 text-ink-800/50 border-sand-200")}>
                        {g.isActive ? "Available" : "Unavailable"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setEditing(g)} className="w-9 h-9 rounded-xl bg-leaf-700/10 text-leaf-700 hover:bg-leaf-700 hover:text-sand-50 flex items-center justify-center transition-colors"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => setConfirm(g._id || g.id!)} className="w-9 h-9 rounded-xl bg-red-500/10 text-red-600 hover:bg-red-600 hover:text-white flex items-center justify-center transition-colors"><Trash2 className="w-4 h-4" /></button>
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
      <AnimatePresence>{editing && <GuideModal guide={editing} onClose={() => setEditing(null)} onSave={save} />}</AnimatePresence>
      {confirm && <ConfirmDialog message="This will permanently delete this guide from the roster." onConfirm={() => del(confirm)} onCancel={() => setConfirm(null)} />}
    </div>
    );
}

export const EMPTY_GUIDE: Guide = {
      name: "", languages: ["English"], pricePerDay: 4000,
      phone: "", photo: "", bio: "", yearsExperience: 1, rating: 4.8, isActive: true,
    };
