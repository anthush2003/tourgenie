import { AnimatePresence } from "framer-motion";
import { ImageIcon, Mail, MapPin, Pencil, Phone, Plus, RefreshCw, Save, Search, Star, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Card, ConfirmDialog, ImageUploadWidget, Inp, ModalShell, Pagination, Sel, TagInput, Txa } from "../components/ui";
import { Facility, Hotel } from "../types";
import { API, authH, cls, fmt, resolveMediaUrl } from "../utils/helpers";

export function HotelModal({ hotel, onClose, onSave }: { hotel: Hotel; onClose: () => void; onSave: (h: Hotel) => Promise<void> }) {
    const [draft, setDraft] = useState<Hotel>({
            ...hotel,
            photos: [...(hotel.photos ?? [])],
            amenities: [...(hotel.amenities ?? [])],
            facilities: (hotel.facilities ?? []).map(f => typeof f === "string" ? f : (f._id || f.id || "")).filter(Boolean),
            roomsPerType: {
              standard: hotel.roomsPerType?.standard ?? 0,
              deluxe: hotel.roomsPerType?.deluxe ?? 0,
              suite: hotel.roomsPerType?.suite ?? 0,
            },
            roomTiers: hotel.roomTiers?.length ? hotel.roomTiers : [
              { tier: 'standard', price: hotel.pricePerNight || 0, enabled: true },
              { tier: 'deluxe', price: Math.round((hotel.pricePerNight || 0) * 1.5), enabled: false },
              { tier: 'suite', price: Math.round((hotel.pricePerNight || 0) * 2.5), enabled: false }
            ],
            contactInfo: {
              phone: hotel.contactInfo?.phone ?? "",
              email: hotel.contactInfo?.email ?? "",
            },
          });
    const [saving, setSaving] = useState(false);
    const [allFacilities, setAllFacilities] = useState<Facility[]>([]);
    const [facLoading, setFacLoading] = useState(true);
    const isNew = !draft._id && !draft.id;
    const save = async () => { setSaving(true); await onSave(draft); setSaving(false); };
    useEffect(() => {
    let active = true;
    (async () => {
      try {
        const r = await fetch(`${API}/facilities?includeInactive=true`, { headers: authH() });
        if (active && r.ok) setAllFacilities(await r.json());
      } catch { }
      if (active) setFacLoading(false);
    })();
    return () => { active = false; };
    }, []);
    const selectedFacilityIds = (draft.facilities ?? []).map(f => typeof f === "string" ? f : (f._id || f.id || ""));
    const toggleFacility = (id: string) => {
            setDraft(d => {
              const current = (d.facilities ?? []).map(f => typeof f === "string" ? f : (f._id || f.id || ""));
              const next = current.includes(id) ? current.filter(x => x !== id) : [...current, id];
              return { ...d, facilities: next };
            });
          };
    return (
    <ModalShell title={isNew ? "New Hotel" : "Edit Hotel"} onClose={onClose} wide>
      <div className="space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <Inp label="Hotel Name *" value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} placeholder="The Fortress Resort & Spa" />
          <Inp label="Location" value={draft.location} onChange={e => setDraft(d => ({ ...d, location: e.target.value }))} placeholder="Koggala, Southern Province" />
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <Inp label="Price/Night (LKR) *" type="number" value={draft.pricePerNight}
            onChange={e => setDraft(d => ({ ...d, pricePerNight: parseInt(e.target.value) || 0 }))} />
          <Inp label="Rating (0-5)" type="number" min="0" max="5" step="0.1" value={draft.rating}
            onChange={e => setDraft(d => ({ ...d, rating: parseFloat(e.target.value) || 0 }))} />
          <Sel label="Star Rating" value={draft.starRating} onChange={e => setDraft(d => ({ ...d, starRating: parseInt(e.target.value) }))}>
            {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} Star{n > 1 ? "s" : ""}</option>)}
          </Sel>
        </div>
        <Txa label="Description" value={draft.description} onChange={e => setDraft(d => ({ ...d, description: e.target.value }))} placeholder="Describe this hotel-" />

        {/* Room Packages & Pricing */}
        <div>
          <label className="text-xs uppercase tracking-widest text-ink-800/50 font-semibold block mb-1.5">
            Room Packages & Pricing
          </label>
          <div className="space-y-3">
            {(draft.roomTiers || []).map((t, idx) => (
              <div key={t.tier} className="flex flex-col sm:flex-row gap-3 items-center p-3 rounded-2xl border border-sand-200 bg-sand-50/50">
                <label className="flex items-center gap-2 font-medium capitalize w-full sm:w-32">
                  <input type="checkbox" checked={t.enabled} onChange={e => {
                    const nt = [...draft.roomTiers!];
                    nt[idx].enabled = e.target.checked;
                    setDraft(d => ({ ...d, roomTiers: nt }));
                  }} className="accent-leaf-700 w-4 h-4" />
                  {t.tier}
                </label>
                <div className="flex-1 w-full relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-800/40 text-sm">LKR</span>
                  <input type="number" min="0" value={t.price} onChange={e => {
                    const nt = [...draft.roomTiers!];
                    nt[idx].price = parseInt(e.target.value) || 0;
                    setDraft(d => ({ ...d, roomTiers: nt }));
                  }} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-sand-200 bg-white text-sm" disabled={!t.enabled} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs uppercase tracking-widest text-ink-800/50 font-semibold block mb-1.5">
            Room Inventory
          </label>
          <p className="text-xs text-ink-800/40 mb-2">
            Sets real availability limits per room type for guest bookings. Leave all at 0 to fall back to an estimated split.
          </p>
          <div className="grid sm:grid-cols-3 gap-4">
            <Inp label="Standard Rooms" type="number" min="0" value={draft.roomsPerType?.standard ?? 0}
              onChange={e => setDraft(d => ({ ...d, roomsPerType: { standard: parseInt(e.target.value) || 0, deluxe: d.roomsPerType?.deluxe ?? 0, suite: d.roomsPerType?.suite ?? 0 } }))} />
            <Inp label="Deluxe Rooms" type="number" min="0" value={draft.roomsPerType?.deluxe ?? 0}
              onChange={e => setDraft(d => ({ ...d, roomsPerType: { standard: d.roomsPerType?.standard ?? 0, deluxe: parseInt(e.target.value) || 0, suite: d.roomsPerType?.suite ?? 0 } }))} />
            <Inp label="Suite Rooms" type="number" min="0" value={draft.roomsPerType?.suite ?? 0}
              onChange={e => setDraft(d => ({ ...d, roomsPerType: { standard: d.roomsPerType?.standard ?? 0, deluxe: d.roomsPerType?.deluxe ?? 0, suite: parseInt(e.target.value) || 0 } }))} />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Inp label="Latitude" type="number" step="0.0001" value={draft.lat} onChange={e => setDraft(d => ({ ...d, lat: parseFloat(e.target.value) || 0 }))} />
          <Inp label="Longitude" type="number" step="0.0001" value={draft.lng} onChange={e => setDraft(d => ({ ...d, lng: parseFloat(e.target.value) || 0 }))} />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Inp label="Phone" type="tel" value={draft.contactInfo?.phone ?? ""}
            onChange={e => setDraft(d => ({ ...d, contactInfo: { ...(d.contactInfo || { phone: "", email: "" }), phone: e.target.value } }))} placeholder="+94 11 234 5678" />
          <Inp label="Email" type="email" value={draft.contactInfo?.email ?? ""}
            onChange={e => setDraft(d => ({ ...d, contactInfo: { ...(d.contactInfo || { phone: "", email: "" }), email: e.target.value } }))} placeholder="info@hotel.lk" />
        </div>
        <TagInput label="Amenities" value={draft.amenities} onChange={amenities => setDraft(d => ({ ...d, amenities }))} />

        {/* Facilities Offered */}
        <div>
          <label className="text-xs uppercase tracking-widest text-ink-800/50 font-semibold block mb-1.5">
            Facilities Offered ({selectedFacilityIds.length} selected)
          </label>
          {facLoading ? (
            <div className="flex items-center gap-2 text-sm text-ink-800/40 py-3"><RefreshCw className="w-4 h-4 animate-spin" />Loading facilities-</div>
          ) : allFacilities.length === 0 ? (
            <p className="text-sm text-ink-800/40 py-3 px-4 border-2 border-dashed border-sand-200 rounded-2xl">
              No facilities in the catalog yet - add some under Facilities first.
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-1">
              {(allFacilities || []).map(f => {
                const id = f._id || f.id || "";
                const checked = selectedFacilityIds.includes(id);
                return (
                  <label key={id} className={cls(
                    "flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border text-sm cursor-pointer transition-colors",
                    checked ? "bg-leaf-700/10 border-leaf-700/30 text-ink-900" : "bg-sand-100 border-sand-200 text-ink-800/70 hover:border-leaf-600/40")}>
                    <input type="checkbox" checked={checked} onChange={() => toggleFacility(id)} className="accent-leaf-700 w-4 h-4" />
                    <span className="flex-1 truncate">{f.name}</span>
                    {f.extraPrice > 0 && <span className="text-[11px] text-ink-800/40">{fmt(f.extraPrice)}</span>}
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <ImageUploadWidget
          category="hotels"
          label="Hotel Photos (upload from PC or paste URL)"
          urls={draft.photos}
          onChange={photos => setDraft(d => ({ ...d, photos }))}
        />
        <div className="flex justify-end gap-3 pt-2 border-t border-sand-200">
          <button onClick={onClose} className="px-5 py-3 rounded-2xl bg-sand-100 text-ink-800 text-sm font-medium hover:bg-sand-200 transition-colors">Cancel</button>
          <button onClick={save} disabled={saving || !draft.name || !draft.pricePerNight}
            className="px-7 py-3 rounded-2xl bg-ink-900 text-sand-50 text-sm font-semibold hover:bg-leaf-700 transition-colors disabled:opacity-50 flex items-center gap-2">
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isNew ? "Create Hotel" : "Save Changes"}
          </button>
        </div>
      </div>
    </ModalShell>
    );
}

export default function HotelsCRUD({ hotels, onRefresh, onToast }: { hotels: Hotel[]; onRefresh: () => void; onToast: (m: string, t: "success" | "error") => void }) {
    const [editing, setEditing] = useState<Hotel | null>(null);
    const [confirm, setConfirm] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const PER_PAGE = 10;
    const filtered = hotels.filter(h =>
            h.name.toLowerCase().includes(search.toLowerCase()) ||
            (h.location ?? "").toLowerCase().includes(search.toLowerCase())
          );
    const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
    const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
    const save = async (hotel: Hotel) => {
            const isNew = !hotel._id && !hotel.id;
            const url = isNew ? `${API}/hotels` : `${API}/hotels/${hotel._id || hotel.id}`;
            try {
              const r = await fetch(url, { method: isNew ? "POST" : "PUT", headers: authH(), body: JSON.stringify(hotel) });
              if (!r.ok) throw new Error((await r.json()).message);
              onToast(isNew ? "Hotel created" : "Hotel updated", "success");
              setEditing(null); onRefresh();
            } catch (e: unknown) { onToast(e instanceof Error ? e.message : "Save failed", "error"); }
          };
    const del = async (id: string) => {
            try {
              const r = await fetch(`${API}/hotels/${id}`, { method: "DELETE", headers: authH() });
              if (!r.ok) throw new Error((await r.json()).message);
              onToast("Hotel deleted", "success"); onRefresh();
            } catch (e: unknown) { onToast(e instanceof Error ? e.message : "Delete failed", "error"); }
            setConfirm(null);
          };
    return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div><h1 className="font-serif text-4xl text-ink-900">Hotels</h1><p className="text-ink-800/50 text-sm">{hotels.length} properties listed</p></div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-800/40" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search hotels-"
              className="pl-10 pr-4 py-2.5 rounded-2xl bg-sand-50 border border-sand-200 text-sm focus:outline-none focus:border-leaf-600 w-56" />
          </div>
          <button onClick={() => setEditing({ ...EMPTY_HOTEL })}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-ink-900 text-sand-50 text-sm font-semibold hover:bg-leaf-700 transition-colors">
            <Plus className="w-4 h-4" />Add Hotel
          </button>
        </div>
      </div>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-sand-100 text-ink-800/60 text-[11px] uppercase tracking-widest">
              <tr>
                <th className="px-5 py-4 text-left font-semibold">Hotel</th>
                <th className="px-5 py-4 text-left font-semibold hidden md:table-cell">Location</th>
                <th className="px-5 py-4 text-left font-semibold">Price / Night</th>
                <th className="px-5 py-4 text-left font-semibold hidden sm:table-cell">Stars</th>
                <th className="px-5 py-4 text-left font-semibold hidden lg:table-cell">Contact</th>
                <th className="px-5 py-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-ink-800/40 text-sm">No data available</td></tr>
              ) : (paged || []).map(h => (
                <tr key={h._id || h.id} className="border-t border-sand-200 hover:bg-sand-50/60 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {h.photos?.[0] ? (
                        <img src={resolveMediaUrl(h.photos[0])} alt="" className="w-10 h-10 rounded-xl object-cover bg-sand-200 shrink-0"
                          onError={e => (e.currentTarget.style.display = "none")} />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-sand-200 shrink-0 flex items-center justify-center"><ImageIcon className="w-4 h-4 text-ink-800/30" /></div>
                      )}
                      <div>
                        <div className="font-medium text-ink-900">{h.name}</div>
                        <div className="text-[11px] text-ink-800/40 mt-0.5">{h.amenities?.slice(0, 2).join(" - ") || "-"}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-ink-800/60 hidden md:table-cell">
                    <div className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 shrink-0" />{h.location || "-"}</div>
                  </td>
                  <td className="px-5 py-4 font-semibold text-ink-900">{fmt(h.pricePerNight)}</td>
                  <td className="px-5 py-4 hidden sm:table-cell">
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: Math.min(h.starRating || 0, 5) }).map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden lg:table-cell">
                    <div className="text-xs text-ink-800/50 space-y-0.5">
                      {h.contactInfo?.phone && <div className="flex items-center gap-1"><Phone className="w-3 h-3" />{h.contactInfo.phone}</div>}
                      {h.contactInfo?.email && <div className="flex items-center gap-1"><Mail className="w-3 h-3" />{h.contactInfo.email}</div>}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setEditing(h)} className="w-9 h-9 rounded-xl bg-leaf-700/10 text-leaf-700 hover:bg-leaf-700 hover:text-sand-50 flex items-center justify-center transition-colors"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => setConfirm(h._id || h.id!)} className="w-9 h-9 rounded-xl bg-red-500/10 text-red-600 hover:bg-red-600 hover:text-white flex items-center justify-center transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              </tbody>
          </table>
        </div>
        
        <Pagination page={page} pages={pages} total={filtered.length} onPage={setPage} />
      </Card>
      <AnimatePresence>{editing && <HotelModal hotel={editing} onClose={() => setEditing(null)} onSave={save} />}</AnimatePresence>
      {confirm && <ConfirmDialog message="This will permanently delete the hotel. Existing bookings will remain in the database." onConfirm={() => del(confirm)} onCancel={() => setConfirm(null)} />}
    </div>
    );
}

export const EMPTY_HOTEL: Hotel = {
      name: "", location: "", description: "", lat: 6.9271, lng: 79.8612,
      pricePerNight: 15000, rating: 4.5, starRating: 4,
      amenities: [], photos: [], contactInfo: { phone: "", email: "" },
      roomsPerType: { standard: 12, deluxe: 5, suite: 3 },
      roomTiers: [
        { tier: 'standard', price: 15000, enabled: true },
        { tier: 'deluxe', price: 22500, enabled: false },
        { tier: 'suite', price: 37500, enabled: false }
      ]
    };
