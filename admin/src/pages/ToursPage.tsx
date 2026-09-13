import { AnimatePresence } from "framer-motion";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { ChevronDown, ChevronUp, Hash, ImageIcon, MapPin, Pencil, Plus, RefreshCw, Save, Search, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useEffect } from "react";
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { Card, ConfirmDialog, ImageUploadWidget, Inp, ModalShell, Pagination, TagInput, Txa } from "../components/ui";
import { PickMode, Tour, TourStop } from "../types";
import { API, authH, resolveMediaUrl } from "../utils/helpers";

export function MapClickCatcher({ onPick }: { onPick: (lat: number, lng: number) => void }) {
    useMapEvents({ click(e) { onPick(e.latlng.lat, e.latlng.lng); } });
    return null;
}

/** Forces the map viewport to follow the draft start pin when it changes */
export function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
    const map = useMap();
    useEffect(() => { map.setView([lat, lng], map.getZoom(), { animate: true }); }, [lat, lng, map]);
    return null;
}

export function TourMapPicker({
      draft, pickMode, onPickMode, onPickPoint,
    }: {
          draft: Tour;
          pickMode: PickMode;
          onPickMode: (m: PickMode) => void;
          onPickPoint: (lat: number, lng: number) => void;
        }) {
    const center: [number, number] = draft.startLat && draft.startLng ? [draft.startLat, draft.startLng] :
              draft.stops[0]?.lat && draft.stops[0]?.lng ? [draft.stops[0].lat, draft.stops[0].lng] :
                [7.8731, 80.7718];
    const routeLine: [number, number][] = [
            ...(draft.startLat && draft.startLng ? [[draft.startLat, draft.startLng] as [number, number]] : []),
            ...(draft.stops || []).filter(s => s.lat && s.lng).map(s => [s.lat, s.lng] as [number, number]),
          ];
    const validRoute = routeLine.filter(([la, ln]) => la !== 0 && ln !== 0);
    return (
    <div className="rounded-2xl overflow-hidden border border-sand-200" style={{ isolation: "isolate" }}>
      <div className="flex items-center justify-between px-4 py-2.5 bg-sand-100 border-b border-sand-200">
        <span className="text-xs font-semibold text-ink-800/70">
          Click the map to place: <span className="text-leaf-700">{pickMode === "start" ? "Start / Meeting Point" : `Stop ${(pickMode as number) + 1}`}</span>
        </span>
        <select
          value={pickMode === "start" ? "start" : String(pickMode)}
          onChange={e => onPickMode(e.target.value === "start" ? "start" : parseInt(e.target.value))}
          className="text-xs rounded-lg border border-sand-300 px-2 py-1.5 bg-white"
        >
          <option value="start">Start / Meeting Point</option>
          {(draft.stops || []).map((s, i) => (
            <option key={i} value={i}>Stop {i + 1}{s.stopName ? ` - ${s.stopName}` : ""}</option>
          ))}
        </select>
      </div>
      <div style={{ height: 340, position: "relative", zIndex: 0 }}>
        <MapContainer
          key={`${draft._id || "new"}`}
          center={center}
          zoom={draft.startLat && draft.startLng ? 11 : 7}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom
        >
          <TileLayer
            attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickCatcher onPick={onPickPoint} />
          {draft.startLat && draft.startLng && (
            <RecenterMap lat={draft.startLat} lng={draft.startLng} />
          )}
          {validRoute.length > 1 && (
            <Polyline positions={validRoute} pathOptions={{ color: "#2e6b57", weight: 4, opacity: 0.8, dashArray: "6 6" }} />
          )}
          {draft.startLat && draft.startLng && draft.startLat !== 0 && draft.startLng !== 0 && (
            <Marker position={[draft.startLat, draft.startLng]} icon={startPinIcon}>
              <Popup>{draft.startName || "Start / Meeting Point"}</Popup>
            </Marker>
          )}
          {(draft.stops || []).map((s, i) => s.lat && s.lng && s.lat !== 0 && s.lng !== 0 ? (
            <Marker key={i} position={[s.lat, s.lng]} icon={stopPinIcon(i + 1)}>
              <Popup>{s.stopName || `Stop ${i + 1}`}</Popup>
            </Marker>
          ) : null)}
        </MapContainer>
      </div>
    </div>
    );
}

export function TourModal({ tour, onClose, onSave }: { tour: Tour; onClose: () => void; onSave: (t: Tour) => Promise<void> }) {
    const [draft, setDraft] = useState<Tour>({ ...tour, stops: tour.stops?.map(s => ({ ...s })) ?? [] });
    const [saving, setSaving] = useState(false);
    const [stopOpen, setStopOpen] = useState<number | null>(null);
    const [pickMode, setPickMode] = useState<PickMode>("start");
    const isNew = !draft._id && !draft.id;
    const save = async () => { setSaving(true); await onSave(draft); setSaving(false); };
    const addStop = () => {
            setDraft(d => ({ ...d, stops: [...d.stops, { ...EMPTY_STOP }] }));
            setStopOpen(draft.stops.length);
            setPickMode(draft.stops.length);
          };
    const removeStop = (i: number) => setDraft(d => ({ ...d, stops: d.stops.filter((_, j) => j !== i) }));
    const updateStop = (i: number, patch: Partial<TourStop>) =>
            setDraft(d => ({ ...d, stops: d.stops.map((s, j) => j === i ? { ...s, ...patch } : s) }));
    const handleMapPick = (lat: number, lng: number) => {
            if (pickMode === "start") {
              setDraft(d => ({ ...d, startLat: lat, startLng: lng }));
            } else {
              updateStop(pickMode as number, { lat, lng });
            }
          };
    return (
    <ModalShell title={isNew ? "New Tour" : "Edit Tour"} onClose={onClose} wide>
      <div className="space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <Inp label="Title *" value={draft.title} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} placeholder="Ancient Wonders of Sigiriya" />
          <Inp label="Location" value={draft.location} onChange={e => setDraft(d => ({ ...d, location: e.target.value }))} placeholder="Sigiriya, Central Province" />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Inp label="Duration" value={draft.duration} onChange={e => setDraft(d => ({ ...d, duration: e.target.value }))} placeholder="Full Day - 8h" />
          <Inp label="Rating (0-5)" type="number" min="0" max="5" step="0.1" value={draft.rating}
            onChange={e => setDraft(d => ({ ...d, rating: parseFloat(e.target.value) || 0 }))} />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Inp label="Package Price (LKR) *" type="number" min="0" value={draft.price ?? 0}
            onChange={e => setDraft(d => ({ ...d, price: parseFloat(e.target.value) || 0 }))}
            placeholder="15000" />
          <Inp label="Start / Meeting Point Name" value={draft.startName ?? ""}
            onChange={e => setDraft(d => ({ ...d, startName: e.target.value }))}
            placeholder="Colombo Fort Railway Station" />
        </div>
        <Txa label="Description" value={draft.description} onChange={e => setDraft(d => ({ ...d, description: e.target.value }))} placeholder="Describe this tour-" />
        <TagInput label="Tags" value={draft.tags} onChange={tags => setDraft(d => ({ ...d, tags }))} />

        <div className="p-4 border border-sand-200 rounded-2xl bg-sand-50 space-y-4">
          <label className="text-xs uppercase tracking-widest text-ink-800/50 font-semibold block mb-2">
            Tour Info - Included & Good to Know
          </label>
          <TagInput 
            label="What's Included (Max 6)" 
            value={draft.included || []} 
            onChange={included => {
              if (included.length <= 6) {
                setDraft(d => ({ ...d, included }));
              } else {
                alert("Maximum 6 items allowed for What's Included");
              }
            }} 
          />
          <div className="grid sm:grid-cols-2 gap-4">
            <Inp label="Difficulty" value={draft.goodToKnow?.difficulty || ""} onChange={e => setDraft(d => ({ ...d, goodToKnow: { ...d.goodToKnow, difficulty: e.target.value } }))} placeholder="Moderate" />
            <Inp label="Start Time" value={draft.goodToKnow?.startTime || ""} onChange={e => setDraft(d => ({ ...d, goodToKnow: { ...d.goodToKnow, startTime: e.target.value } }))} placeholder="6:30 AM" />
            <Inp label="Group Size" value={draft.goodToKnow?.groupSize || ""} onChange={e => setDraft(d => ({ ...d, goodToKnow: { ...d.goodToKnow, groupSize: e.target.value } }))} placeholder="Private (1-8)" />
            <Inp label="Cancellation" value={draft.goodToKnow?.cancellation || ""} onChange={e => setDraft(d => ({ ...d, goodToKnow: { ...d.goodToKnow, cancellation: e.target.value } }))} placeholder="Free up to 24 hours" />
            <Inp label="Languages" value={draft.goodToKnow?.languages || ""} onChange={e => setDraft(d => ({ ...d, goodToKnow: { ...d.goodToKnow, languages: e.target.value } }))} placeholder="English, Tamil" />
          </div>
        </div>

        <div>
          <label className="text-xs uppercase tracking-widest text-ink-800/50 font-semibold block mb-1.5">
            Tour Packages (Tiers)
          </label>
          <div className="space-y-4">
            {["Budget", "Standard", "Luxury"].map(tierName => {
              const tierIndex = (draft.tiers || []).findIndex(t => t.name === tierName);
              const tier = tierIndex !== -1 ? draft.tiers![tierIndex] : { name: tierName as any, price: 0, enabled: false, inclusions: [] };
              
              const updateTier = (updates: any) => {
                const nextTiers = [...(draft.tiers || [])];
                if (tierIndex !== -1) nextTiers[tierIndex] = { ...tier, ...updates };
                else nextTiers.push({ ...tier, ...updates });
                setDraft(d => ({ ...d, tiers: nextTiers }));
              };

              return (
                <div key={tierName} className="p-4 border border-sand-200 rounded-2xl space-y-3 bg-white">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 font-semibold text-ink-900 cursor-pointer">
                      <input type="checkbox" className="accent-leaf-700 w-4 h-4" checked={tier.enabled} onChange={e => updateTier({ enabled: e.target.checked })} />
                      {tierName} Package
                    </label>
                    <div className="w-1/3">
                      <Inp label="Price/Person" type="number" value={tier.price} onChange={e => updateTier({ price: parseFloat(e.target.value) || 0, enabled: true })} />
                    </div>
                  </div>
                  {tier.enabled && (
                    <TagInput label="Inclusions" value={tier.inclusions} onChange={inclusions => updateTier({ inclusions })} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <ImageUploadWidget
          category="tours"
          label="Tour Photos (first image will be used as Cover)"
          urls={draft.photos?.length ? draft.photos : (draft.coverImage ? [draft.coverImage] : [])}
          onChange={urls => setDraft(d => ({ ...d, photos: urls, coverImage: urls[0] ?? "" }))}
        />

        <div>
          <label className="text-xs uppercase tracking-widest text-ink-800/50 font-semibold block mb-3">
            Route Map - Click to Pin Locations
          </label>
          <TourMapPicker draft={draft} pickMode={pickMode} onPickMode={setPickMode} onPickPoint={handleMapPick} />
          <p className="text-[11px] text-ink-800/40 mt-2">
            Choose what you're placing from the dropdown above the map, then click anywhere on the map to drop that pin. The route line updates automatically.
          </p>
        </div>

        {/* Tour stops */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs uppercase tracking-widest text-ink-800/50 font-semibold">Tour Stops ({draft.stops.length})</label>
            <button type="button" onClick={addStop}
              className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl bg-leaf-700/10 text-leaf-700 hover:bg-leaf-700 hover:text-sand-50 transition-colors font-semibold">
              <Plus className="w-3.5 h-3.5" />Add Stop
            </button>
          </div>
          <div className="space-y-3">
            {(draft.stops || []).map((stop, i) => (
              <div key={i} className="border border-sand-200 rounded-2xl overflow-hidden">
                <button type="button" onClick={() => { setStopOpen(stopOpen === i ? null : i); setPickMode(i); }}
                  className="w-full flex items-center justify-between px-5 py-3.5 bg-sand-100 hover:bg-sand-200 transition-colors text-sm font-medium text-ink-900">
                  <span className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-leaf-700/15 text-leaf-700 text-[11px] font-bold flex items-center justify-center">{i + 1}</span>
                    {stop.stopName || `Stop ${i + 1}`}
                    {stop.lat && stop.lng ? <MapPin className="w-3.5 h-3.5 text-leaf-700" /> : <span className="text-[10px] text-red-500 font-semibold uppercase">Not pinned</span>}
                  </span>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={e => { e.stopPropagation(); removeStop(i); }}
                      className="w-7 h-7 rounded-lg bg-red-100 text-red-600 hover:bg-red-600 hover:text-white flex items-center justify-center transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                    {stopOpen === i ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>
                {stopOpen === i && (
                  <div className="p-5 space-y-4 bg-white">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Inp label="Stop Name" value={stop.stopName} onChange={e => updateStop(i, { stopName: e.target.value })} placeholder="Lion's Rock Summit" />
                      <Inp label="Trigger Radius (m)" type="number" value={stop.triggerRadius} onChange={e => updateStop(i, { triggerRadius: parseInt(e.target.value) || 0 })} />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Inp label="Latitude" type="number" step="0.0001" value={stop.lat} onChange={e => updateStop(i, { lat: parseFloat(e.target.value) || 0 })} />
                      <Inp label="Longitude" type="number" step="0.0001" value={stop.lng} onChange={e => updateStop(i, { lng: parseFloat(e.target.value) || 0 })} />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Inp label="Arrives (minutes after tour start)" type="number" min="0" value={stop.arrivalOffsetMinutes ?? 0}
                        onChange={e => updateStop(i, { arrivalOffsetMinutes: parseInt(e.target.value) || 0 })} />
                      <Inp label="Time Spent Here (minutes)" type="number" min="0" value={stop.durationMinutes ?? 30}
                        onChange={e => updateStop(i, { durationMinutes: parseInt(e.target.value) || 0 })} />
                    </div>
                    <Txa maxLength={500} label="Description" value={stop.description} onChange={e => updateStop(i, { description: e.target.value })} />
                    <ImageUploadWidget category="tours" label="Stop Image" urls={stop.imageUrl ? [stop.imageUrl] : []}
                      onChange={urls => updateStop(i, { imageUrl: urls[urls.length - 1] ?? "" })} />
                  </div>
                )}
              </div>
            ))}
            {draft.stops.length === 0 && (
              <p className="text-sm text-ink-800/40 py-6 text-center border-2 border-dashed border-sand-200 rounded-2xl">
                No stops yet - add your first stop
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t border-sand-200">
          <button onClick={onClose} className="px-5 py-3 rounded-2xl bg-sand-100 text-ink-800 text-sm font-medium hover:bg-sand-200 transition-colors">Cancel</button>
          <button onClick={save} disabled={saving || !draft.title || !draft.price}
            className="px-7 py-3 rounded-2xl bg-ink-900 text-sand-50 text-sm font-semibold hover:bg-leaf-700 transition-colors disabled:opacity-50 flex items-center gap-2">
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isNew ? "Create Tour" : "Save Changes"}
          </button>
        </div>
      </div>
    </ModalShell>
    );
}

export default function ToursCRUD({ tours, onRefresh, onToast }: { tours: Tour[]; onRefresh: () => void; onToast: (m: string, t: "success" | "error") => void }) {
    const [editing, setEditing] = useState<Tour | null>(null);
    const [confirm, setConfirm] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const PER_PAGE = 10;
    const filtered = tours.filter(t =>
            t.title.toLowerCase().includes(search.toLowerCase()) ||
            (t.location ?? "").toLowerCase().includes(search.toLowerCase())
          );
    const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
    const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
    const save = async (tour: Tour) => {
            const isNew = !tour._id && !tour.id;
            const url = isNew ? `${API}/tours` : `${API}/tours/${tour._id || tour.id}`;
            try {
              const r = await fetch(url, { method: isNew ? "POST" : "PUT", headers: authH(), body: JSON.stringify(tour) });
              if (!r.ok) throw new Error((await r.json()).message);
              onToast(isNew ? "Tour created" : "Tour updated", "success");
              setEditing(null); onRefresh();
            } catch (e: unknown) { onToast(e instanceof Error ? e.message : "Save failed", "error"); }
          };
    const del = async (id: string) => {
            try {
              await fetch(`${API}/tours/${id}`, { method: "DELETE", headers: authH() });
              onToast("Tour deleted", "success"); onRefresh();
            } catch { onToast("Delete failed", "error"); }
            setConfirm(null);
          };
    return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div><h1 className="font-serif text-4xl text-ink-900">Tours</h1><p className="text-ink-800/50 text-sm">{tours.length} total tours</p></div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-800/40" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search tours-"
              className="pl-10 pr-4 py-2.5 rounded-2xl bg-sand-50 border border-sand-200 text-sm focus:outline-none focus:border-leaf-600 w-56" />
          </div>
          <button onClick={() => setEditing({ ...EMPTY_TOUR })}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-ink-900 text-sand-50 text-sm font-semibold hover:bg-leaf-700 transition-colors">
            <Plus className="w-4 h-4" />Add Tour
          </button>
        </div>
      </div>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-sand-100 text-ink-800/60 text-[11px] uppercase tracking-widest">
              <tr>
                <th className="px-5 py-4 text-left font-semibold">Tour</th>
                <th className="px-5 py-4 text-left font-semibold hidden md:table-cell">Location</th>
                <th className="px-5 py-4 text-left font-semibold hidden lg:table-cell">Duration</th>
                <th className="px-5 py-4 text-left font-semibold">Stops</th>
                <th className="px-5 py-4 text-left font-semibold hidden sm:table-cell">Rating</th>
                <th className="px-5 py-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-ink-800/40 text-sm">No data available</td></tr>
              ) : (paged || []).map(t => (
                <tr key={t._id || t.id} className="border-t border-sand-200 hover:bg-sand-50/60 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {t.coverImage ? (
                        <img src={resolveMediaUrl(t.coverImage)} alt="" className="w-10 h-10 rounded-xl object-cover bg-sand-200 shrink-0"
                          onError={e => (e.currentTarget.style.display = "none")} />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-sand-200 shrink-0 flex items-center justify-center"><ImageIcon className="w-4 h-4 text-ink-800/30" /></div>
                      )}
                      <div>
                        <div className="font-medium text-ink-900">{t.title}</div>
                        <div className="flex gap-1 mt-0.5 flex-wrap">
                          {(t.tags || []).slice(0, 2).map(tag => (
                            <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-leaf-700/10 text-leaf-700 font-medium">{tag}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-ink-800/60 hidden md:table-cell">{t.location || "-"}</td>
                  <td className="px-5 py-4 text-ink-800/60 hidden lg:table-cell">{t.duration || "-"}</td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-ocean-500/10 text-ocean-500 font-semibold">
                      <Hash className="w-3 h-3" />{t.stops?.length ?? 0}
                    </span>
                  </td>
                  <td className="px-5 py-4 hidden sm:table-cell"><span className="text-amber-600 font-semibold text-sm">-{t.rating}</span></td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setEditing(t)} className="w-9 h-9 rounded-xl bg-leaf-700/10 text-leaf-700 hover:bg-leaf-700 hover:text-sand-50 flex items-center justify-center transition-colors"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => setConfirm(t._id || t.id!)} className="w-9 h-9 rounded-xl bg-red-500/10 text-red-600 hover:bg-red-600 hover:text-white flex items-center justify-center transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={page} pages={pages} total={filtered.length} onPage={setPage} />
      </Card>
      <AnimatePresence>{editing && <TourModal tour={editing} onClose={() => setEditing(null)} onSave={save} />}</AnimatePresence>
      {confirm && <ConfirmDialog message="This will permanently delete the tour and all its stops. This cannot be undone." onConfirm={() => del(confirm)} onCancel={() => setConfirm(null)} />}
    </div>
    );
}

export const EMPTY_TOUR: Tour = { title: "", location: "", description: "", duration: "", rating: 4.5, coverImage: "", tags: [], stops: [], price: 0, startLat: undefined, startLng: undefined, startName: "", included: [], goodToKnow: { difficulty: "", startTime: "", groupSize: "", cancellation: "", languages: "" }, tiers: [{ name: "Budget", price: 0, enabled: false, inclusions: [] }, { name: "Standard", price: 0, enabled: true, inclusions: [] }, { name: "Luxury", price: 0, enabled: false, inclusions: [] }] };
export const EMPTY_STOP: TourStop = { stopName: "", lat: 7.87, lng: 80.77, triggerRadius: 50, description: "", imageUrl: "", arrivalOffsetMinutes: 0, durationMinutes: 30 };
export const startPinIcon = L.divIcon({
      className: "",
      html: `<div style="display:flex;flex-direction:column;align-items:center;">
    <div style="width:32px;height:32px;border-radius:50%;background:#14201d;display:flex;align-items:center;justify-content:center;font-size:15px;border:2.5px solid white;box-shadow:0 4px 12px rgba(0,0,0,0.35);">--</div>
  </div>`,
      iconSize: [32, 32], iconAnchor: [16, 32],
    });
export const stopPinIcon = (n: number) => L.divIcon({
      className: "",
      html: `<div style="width:28px;height:28px;border-radius:50%;background:#2e6b57;color:#fbf8f3;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;border:2.5px solid white;box-shadow:0 4px 12px rgba(0,0,0,0.35);">${n}</div>`,
      iconSize: [28, 28], iconAnchor: [14, 28],
    });
