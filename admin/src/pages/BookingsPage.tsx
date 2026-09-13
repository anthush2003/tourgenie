import { AnimatePresence } from "framer-motion";
import { AlertCircle, Calendar, Pencil, RefreshCw, Save, Search, Trash2, User, XCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge, Card, ConfirmDialog, Inp, ModalShell, Pagination, Sel } from "../components/ui";
import { Booking, Hotel, TourBooking, User as UserType } from "../types";
import { API, authH, cls, fmt, fmtDate } from "../utils/helpers";

const ROOM_PRICE_MULTIPLIER: Record<string, number> = { standard: 1, deluxe: 1.6, suite: 2.5 };
const ROOM_GUEST_LIMITS: Record<string, number> = { standard: 2, deluxe: 4, suite: 6 };

export function BookingEditModal({ booking, onClose, onSave }: { booking: Booking; onClose: () => void; onSave: (patch: Partial<Booking>) => Promise<void> }) {
    const [status, setStatus] = useState(booking.status);
    const [checkIn, setCheckIn] = useState(booking.checkInDate?.split("T")[0] ?? "");
    const [checkOut, setCheckOut] = useState(booking.checkOutDate?.split("T")[0] ?? "");
    const [roomType, setRoomType] = useState(booking.roomType);
    const [guests, setGuests] = useState(booking.guests ?? 1);
    const [saving, setSaving] = useState(false);
    const save = async () => { setSaving(true); await onSave({ status, checkInDate: checkIn, checkOutDate: checkOut, roomType, guests }); setSaving(false); };
    return (
    <ModalShell title="Edit Booking" onClose={onClose}>
      <div className="space-y-4">
        <div className="p-4 rounded-2xl bg-sand-100 text-sm space-y-1">
          <div className="font-mono font-semibold text-ink-900">{booking.dummyReference}</div>
          <div className="text-ink-800/50">Guest: {typeof booking.userId === "object" ? `${booking.userId.name} (${booking.userId.email})` : String(booking.userId)}</div>
          <div className="text-ink-800/50">Hotel: {typeof booking.hotelId === "object" ? booking.hotelId.name : String(booking.hotelId)}</div>
        </div>
        <Sel label="Status" value={status} onChange={e => setStatus(e.target.value as "confirmed" | "cancelled")}>
          <option value="confirmed">Confirmed</option>
          <option value="cancelled">Cancelled</option>
        </Sel>
        <Sel label="Room Type" value={roomType} onChange={e => setRoomType(e.target.value as "standard" | "deluxe" | "suite")}>
          <option value="standard">Standard</option>
          <option value="deluxe">Deluxe</option>
          <option value="suite">Suite</option>
        </Sel>
        <div className="grid grid-cols-2 gap-4">
          <Inp label="Check-in Date" type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)} />
          <Inp label="Check-out Date" type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)} />
        </div>
        <Inp label="Guests" type="number" min="1" max="10" value={guests} onChange={e => setGuests(parseInt(e.target.value) || 1)} />
        <div className="flex justify-end gap-3 pt-2 border-t border-sand-200">
          <button onClick={onClose} className="px-5 py-3 rounded-2xl bg-sand-100 text-ink-800 text-sm font-medium hover:bg-sand-200 transition-colors">Cancel</button>
          <button onClick={save} disabled={saving}
            className="px-7 py-3 rounded-2xl bg-ink-900 text-sand-50 text-sm font-semibold hover:bg-leaf-700 transition-colors disabled:opacity-50 flex items-center gap-2">
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}Save Changes
          </button>
        </div>
      </div>
    </ModalShell>
    );
}

export function ManualBookingModal({ onClose, onSave, hotels, user }: { onClose: () => void; onSave: (b: Partial<Booking>) => Promise<void>; hotels: Hotel[]; user: { role?: string; allocatedHotel?: string } | null }) {
    const isReceptionist = user?.role === "receptionist";

    // Hotel
    const [hotelId, setHotelId] = useState(isReceptionist && user?.allocatedHotel ? user.allocatedHotel : "");
    const selectedHotel = hotels.find(h => (h._id || h.id) === hotelId);

    // Guest mode
    const [guestMode, setGuestMode] = useState<"registered" | "walkin">("registered");
    const [userSearch, setUserSearch] = useState("");
    const [userResults, setUserResults] = useState<UserType[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
    const [walkinName, setWalkinName] = useState("");
    const [walkinPhone, setWalkinPhone] = useState("");

    // Booking details
    const [roomType, setRoomType] = useState<"standard" | "deluxe" | "suite">("standard");
    const [checkIn, setCheckIn] = useState("");
    const [checkOut, setCheckOut] = useState("");
    const [guests, setGuests] = useState(1);
    const [numberOfRooms, setNumberOfRooms] = useState(1);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    // Search registered users with debounce
    useEffect(() => {
        if (guestMode !== "registered" || userSearch.length < 2) { setUserResults([]); return; }
        const t = setTimeout(async () => {
            setSearchLoading(true);
            try {
                const r = await fetch(`${API}/admin/users?search=${encodeURIComponent(userSearch)}&limit=8`, { headers: authH() });
                if (r.ok) { const data = await r.json(); setUserResults(Array.isArray(data) ? data : (data?.data ?? [])); }
            } catch { }
            setSearchLoading(false);
        }, 400);
        return () => clearTimeout(t);
    }, [userSearch, guestMode]);

    // Price calculation
    const nights = useMemo(() => {
        if (!checkIn || !checkOut) return 0;
        const diff = (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24);
        return diff > 0 ? Math.round(diff) : 0;
    }, [checkIn, checkOut]);

    const ROOM_MULTIPLIER: Record<string, number> = { standard: 1, deluxe: 1.6, suite: 2.5 };
    const MAX_GUESTS_PER_ROOM: Record<string, number> = { standard: 2, deluxe: 4, suite: 6 };
    const basePrice = selectedHotel?.pricePerNight ?? 0;
    const multiplier = ROOM_MULTIPLIER[roomType] ?? 1;
    const totalPrice = Math.round(basePrice * multiplier * nights * numberOfRooms);
    const maxGuests = (MAX_GUESTS_PER_ROOM[roomType] ?? 2) * numberOfRooms;
    const today = new Date().toISOString().split("T")[0];

    const validate = (): string => {
        if (!hotelId) return "Please select a hotel.";
        if (guestMode === "registered" && !selectedUser) return "Please search and select a registered guest.";
        if (guestMode === "walkin" && !walkinName.trim()) return "Please enter the walk-in guest's full name.";
        if (!checkIn) return "Please select a check-in date.";
        if (!checkOut) return "Please select a check-out date.";
        if (nights <= 0) return "Check-out date must be after check-in date.";
        if (guests > maxGuests) return `Max ${maxGuests} guests for ${numberOfRooms} ${roomType} room(s).`;
        return "";
    };

    const save = async () => {
        const err = validate();
        if (err) { setError(err); return; }
        setError("");
        setSaving(true);
        const payload: Partial<Booking> = {
            hotelId,
            status: "confirmed",
            checkInDate: checkIn,
            checkOutDate: checkOut,
            roomType,
            guests,
            numberOfRooms,
            totalPrice,
            ...(guestMode === "registered" && selectedUser ? { userId: selectedUser._id || selectedUser.id } : { userId: undefined }),
        };
        await onSave(payload);
        setSaving(false);
    };

    return (
    <ModalShell title="Manual Booking Entry" onClose={onClose}>
      <div className="space-y-5">

        {/* Hotel */}
        <Sel label="Hotel" value={hotelId} onChange={e => setHotelId(e.target.value)} disabled={isReceptionist}>
          <option value="">Select a hotel...</option>
          {(hotels || []).map(h => (<option key={h._id || h.id} value={h._id || h.id}>{h.name} - {h.location}</option>))}
        </Sel>
        {selectedHotel && (
          <div className="bg-leaf-700/10 rounded-2xl px-4 py-3 text-sm text-leaf-700 font-medium">
            Base rate: {fmt(selectedHotel.pricePerNight)}/night - -{selectedHotel.rating} - {selectedHotel.starRating}- hotel
          </div>
        )}

        {/* Guest Mode Toggle */}
        <div>
          <div className="text-xs font-semibold text-ink-800/60 uppercase tracking-widest mb-2">Guest Type</div>
          <div className="flex gap-2">
            {(["registered", "walkin"] as const).map(mode => (
              <button key={mode} onClick={() => { setGuestMode(mode); setSelectedUser(null); setUserSearch(""); }}
                className={cls("flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors", guestMode === mode ? "bg-ink-900 text-sand-50 border-ink-900" : "bg-sand-50 text-ink-800/60 border-sand-200 hover:border-ink-900")}>
                {mode === "registered" ? "Registered Guest" : "Walk-in Guest"}
              </button>
            ))}
          </div>
        </div>

        {/* Registered Guest Search */}
        {guestMode === "registered" && (
          <div>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-800/40" />
              <input value={userSearch} onChange={e => { setUserSearch(e.target.value); setSelectedUser(null); }}
                placeholder="Search guest by name or email-"
                className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-sand-50 border border-sand-200 text-sm focus:outline-none focus:border-leaf-600" />
              {searchLoading && <RefreshCw className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-ink-800/40" />}
            </div>
            {userResults.length > 0 && !selectedUser && (
              <div className="border border-sand-200 rounded-2xl mt-1 overflow-hidden shadow-sm">
                {(userResults || []).map(u => (
                  <button key={u._id || u.id} onClick={() => { setSelectedUser(u); setUserSearch(""); setUserResults([]); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-sand-100 transition-colors border-b border-sand-100 last:border-0">
                    <div className="w-8 h-8 rounded-full bg-leaf-700/20 flex items-center justify-center shrink-0 text-sm font-bold text-leaf-700">{u.name?.[0]?.toUpperCase()}</div>
                    <div><div className="text-sm font-medium text-ink-900">{u.name}</div><div className="text-xs text-ink-800/50">{u.email}</div></div>
                  </button>
                ))}
              </div>
            )}
            {selectedUser && (
              <div className="flex items-center justify-between bg-leaf-700/10 rounded-2xl px-4 py-3 mt-1">
                <div><div className="text-sm font-semibold text-ink-900">{selectedUser.name}</div><div className="text-xs text-ink-800/50">{selectedUser.email}</div></div>
                <button onClick={() => setSelectedUser(null)} className="text-xs text-red-500 hover:text-red-700 font-medium">Change</button>
              </div>
            )}
          </div>
        )}

        {/* Walk-in Guest Fields */}
        {guestMode === "walkin" && (
          <div className="grid grid-cols-2 gap-3">
            <Inp label="Guest Full Name *" value={walkinName} onChange={e => setWalkinName(e.target.value)} placeholder="e.g. Rajan Fernando" />
            <Inp label="Phone Number" value={walkinPhone} onChange={e => setWalkinPhone(e.target.value)} placeholder="+94 77 123 4567" />
          </div>
        )}

        {/* Room Type & Count */}
        <div className="grid grid-cols-2 gap-3">
          <Sel label="Room Type" value={roomType} onChange={e => { setRoomType(e.target.value as "standard" | "deluxe" | "suite"); setGuests(1); }}>
            <option value="standard">Standard{selectedHotel ? ` - ${fmt(Math.round(basePrice))}/night` : ""}</option>
            <option value="deluxe">Deluxe{selectedHotel ? ` - ${fmt(Math.round(basePrice * 1.6))}/night` : ""}</option>
            <option value="suite">Suite{selectedHotel ? ` - ${fmt(Math.round(basePrice * 2.5))}/night` : ""}</option>
          </Sel>
          <Inp label="No. of Rooms" type="number" min="1" max="10" value={numberOfRooms} onChange={e => setNumberOfRooms(Math.max(1, parseInt(e.target.value) || 1))} />
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3">
          <Inp label="Check-in Date" type="date" value={checkIn} min={today} onChange={e => { setCheckIn(e.target.value); if (checkOut && e.target.value >= checkOut) setCheckOut(""); }} />
          <Inp label="Check-out Date" type="date" value={checkOut} min={checkIn || today} onChange={e => setCheckOut(e.target.value)} />
        </div>

        {/* Guests */}
        <Inp label={`Guests (max ${maxGuests} for ${numberOfRooms} ${roomType} room${numberOfRooms > 1 ? "s" : ""})`} type="number" min="1" max={maxGuests} value={guests} onChange={e => setGuests(Math.min(parseInt(e.target.value) || 1, maxGuests))} />

        {/* Live Price Summary */}
        {nights > 0 && selectedHotel && (
          <div className="bg-sand-100 rounded-2xl p-4 space-y-1.5">
            <div className="flex justify-between text-sm text-ink-800/60">
              <span>Room rate</span><span>{fmt(Math.round(basePrice * multiplier))}/night</span>
            </div>
            <div className="flex justify-between text-sm text-ink-800/60">
              <span>{nights} night{nights > 1 ? "s" : ""} - {numberOfRooms} room{numberOfRooms > 1 ? "s" : ""}</span>
            </div>
            <div className="flex justify-between font-serif text-xl text-ink-900 font-bold pt-2 border-t border-sand-200">
              <span>Total</span><span>{fmt(totalPrice)}</span>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 shrink-0" />{error}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2 border-t border-sand-200">
          <button onClick={onClose} className="px-5 py-3 rounded-2xl bg-sand-100 text-ink-800 text-sm font-medium hover:bg-sand-200 transition-colors">Cancel</button>
          <button onClick={save} disabled={saving}
            className="px-7 py-3 rounded-2xl bg-ink-900 text-sand-50 text-sm font-semibold hover:bg-leaf-700 transition-colors disabled:opacity-50 flex items-center gap-2">
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}Confirm Booking
          </button>
        </div>
      </div>
    </ModalShell>
    );
}



export function TourBookingsTable({ onToast }: { onToast: (m: string, t: "success" | "error") => void }) {
    const [bookings, setBookings] = useState<TourBooking[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [confirm, setConfirm] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const PER_PAGE = 12;
    const load = useCallback(async () => {
            setLoading(true);
            try {
              const r = await fetch(`${API}/tour-bookings`, { headers: authH() });
              if (r.ok) {
                const data = await r.json();
                setBookings(Array.isArray(data) ? data : (data?.data ?? []));
              }
            } catch { }
            setLoading(false);
          }, []);
    useEffect(() => { load(); }, [load]);
    const filtered = bookings.filter(b => {
            const ref = b.dummyReference?.toLowerCase() ?? "";
            const user = typeof b.userId === "object" && b.userId ? `${b.userId.name} ${b.userId.email}`.toLowerCase() : "";
            return !search || ref.includes(search.toLowerCase()) || user.includes(search.toLowerCase()) || b.tourTitle?.toLowerCase().includes(search.toLowerCase());
          });
    const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
    const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
    const cancel = async (id: string) => {
            try {
              const r = await fetch(`${API}/tour-bookings/${id}/cancel`, { method: "PUT", headers: authH() });
              if (!r.ok) throw new Error((await r.json()).message);
              onToast("Tour booking cancelled", "success"); load();
            } catch (e: unknown) { onToast(e instanceof Error ? e.message : "Cancel failed", "error"); }
            setConfirm(null);
          };
    return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-800/40" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Ref, customer, tour-"
            className="pl-10 pr-4 py-2.5 rounded-2xl bg-sand-50 border border-sand-200 text-sm focus:outline-none focus:border-leaf-600 w-64" />
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
                  <th className="px-5 py-4 text-left font-semibold">Reference</th>
                  <th className="px-5 py-4 text-left font-semibold hidden lg:table-cell">Customer</th>
                  <th className="px-5 py-4 text-left font-semibold hidden md:table-cell">Tour</th>
                  <th className="px-5 py-4 text-left font-semibold hidden md:table-cell">Vehicle</th>
                  <th className="px-5 py-4 text-left font-semibold hidden md:table-cell">Guide</th>
                  <th className="px-5 py-4 text-left font-semibold">Travel Date</th>
                  <th className="px-5 py-4 text-left font-semibold hidden sm:table-cell">Amount</th>
                  <th className="px-5 py-4 text-left font-semibold">Status</th>
                  <th className="px-5 py-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
              {paged.length === 0 ? (
                <tr><td colSpan={9} className="px-5 py-8 text-center text-ink-800/40 text-sm">No data available</td></tr>
              ) : (paged || []).map(b => (
                    <tr key={b._id || b.id} className="border-t border-sand-200 hover:bg-sand-50/60 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-mono text-xs font-semibold text-ink-900">{b.dummyReference}</div>
                        <div className="text-[11px] text-ink-800/40 mt-0.5">{b.travelers ?? 1} traveler{(b.travelers ?? 1) > 1 ? "s" : ""}</div>
                      </td>
                      <td className="px-5 py-4 hidden lg:table-cell">
                        <div className="text-sm font-medium text-ink-900">{typeof b.userId === "object" && b.userId ? b.userId.name : "-"}</div>
                        <div className="text-[11px] text-ink-800/40">{typeof b.userId === "object" && b.userId ? b.userId.email : ""}</div>
                      </td>
                      <td className="px-5 py-4 text-ink-800/70 hidden md:table-cell">{typeof b.tourId === "object" && b.tourId ? b.tourId.title : (b.tourTitle || "-")}</td>
                      <td className="px-5 py-4 text-ink-800/70 hidden md:table-cell">
                        <div className="text-xs capitalize">{b.vehicleName || "-"}</div>
                      </td>
                      <td className="px-5 py-4 text-ink-800/60 text-xs">
                        <div className="text-xs capitalize">{b.guideName || "-"}</div>
                      </td>
                      <td className="px-5 py-4 text-ink-800/60 text-xs">
                        <div className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{fmtDate(b.travelDate)}</div>
                      </td>
                      <td className="px-5 py-4 font-semibold text-ink-900 hidden sm:table-cell">{fmt(b.totalPrice || 0)}</td>
                      <td className="px-5 py-4"><Badge status={b.status} /></td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setConfirm(b._id || b.id!)} className="w-9 h-9 rounded-xl bg-red-500/10 text-red-600 hover:bg-red-600 hover:text-white flex items-center justify-center transition-colors"><Trash2 className="w-4 h-4" /></button>
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
      {confirm && <ConfirmDialog message="This will cancel the tour + vehicle booking for the customer." onConfirm={() => cancel(confirm)} onCancel={() => setConfirm(null)} />}
    </div>
    );
}

export default function BookingsSection({ bookings, onRefresh, onToast, hotels, user }: { bookings: Booking[]; onRefresh: () => void; onToast: (m: string, t: "success" | "error") => void; hotels: Hotel[]; user: { role?: string; allocatedHotel?: string } | null }) {
    const [editing, setEditing] = useState<Booking | null>(null);
    const [adding, setAdding] = useState(false);
    const [confirm, setConfirm] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState("all");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [bookingKind, setBookingKind] = useState<"hotel" | "tour">("hotel");
    const PER_PAGE = 12;
    const filtered = bookings.filter(b => {
            const matchStatus = statusFilter === "all" || b.status === statusFilter;
            const ref = b.dummyReference?.toLowerCase() ?? "";
            const user = typeof b.userId === "object" && b.userId ? `${b.userId.name} ${b.userId.email}`.toLowerCase() : "";
            const hotel = typeof b.hotelId === "object" && b.hotelId ? b.hotelId.name.toLowerCase() : "";
            const matchSearch = !search || ref.includes(search.toLowerCase()) || user.includes(search.toLowerCase()) || hotel.includes(search.toLowerCase());
            return matchStatus && matchSearch;
          });
    const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
    const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
    const update = async (id: string, patch: Partial<Booking>) => {
            try {
              const r = await fetch(`${API}/admin/bookings/${id}`, { method: "PUT", headers: authH(), body: JSON.stringify(patch) });
              if (!r.ok) throw new Error((await r.json()).message);
              onToast("Booking updated", "success"); setEditing(null); onRefresh();
            } catch (e: unknown) { onToast(e instanceof Error ? e.message : "Update failed", "error"); }
          };
    const del = async (id: string) => {
            try {
              await fetch(`${API}/admin/bookings/${id}`, { method: "DELETE", headers: authH() });
              onToast("Booking deleted", "success"); onRefresh();
            } catch { onToast("Delete failed", "error"); }
            setConfirm(null);
          };
    const createManual = async (payload: Partial<Booking>) => {
            try {
              const r = await fetch(`${API}/admin/bookings`, { method: "POST", headers: authH(), body: JSON.stringify(payload) });
              if (!r.ok) throw new Error((await r.json()).message);
              onToast("Manual booking created", "success"); setAdding(false); onRefresh();
            } catch (e: unknown) { onToast(e instanceof Error ? e.message : "Creation failed", "error"); }
          };
    return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-serif text-4xl text-ink-900">Bookings</h1>
          <p className="text-ink-800/50 text-sm">
            {bookingKind === "hotel"
              ? `${bookings.length} total - ${bookings.filter(b => b.status === "confirmed").length} confirmed`
              : "Tour package + vehicle bookings"}
          </p>
        </div>
        {user?.role !== "receptionist" && (
          <div className="flex items-center gap-1 p-1 bg-sand-100 rounded-2xl">
            <button onClick={() => setBookingKind("hotel")}
              className={cls("px-4 py-2 rounded-xl text-sm font-semibold transition-colors", bookingKind === "hotel" ? "bg-white text-ink-900 shadow-sm" : "text-ink-800/50 hover:text-ink-900")}>
              Hotel Bookings
            </button>
            <button onClick={() => setBookingKind("tour")}
              className={cls("px-4 py-2 rounded-xl text-sm font-semibold transition-colors", bookingKind === "tour" ? "bg-white text-ink-900 shadow-sm" : "text-ink-800/50 hover:text-ink-900")}>
              Tour + Vehicle Bookings
            </button>
          </div>
        )}
      </div>

      {bookingKind === "tour" ? (
        <TourBookingsTable onToast={onToast} />
      ) : (
        <>
          <div className="flex justify-end gap-3 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-800/40" />
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Ref, guest, hotel-"
                className="pl-10 pr-4 py-2.5 rounded-2xl bg-sand-50 border border-sand-200 text-sm focus:outline-none focus:border-leaf-600 w-56" />
            </div>
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-4 py-2.5 rounded-2xl bg-sand-50 border border-sand-200 text-sm focus:outline-none appearance-none">
              <option value="all">All Status</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <button onClick={() => setAdding(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-ink-900 text-sand-50 text-sm font-semibold hover:bg-leaf-700 transition-colors">
              Manual Booking
            </button>
          </div>
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-sand-100 text-ink-800/60 text-[11px] uppercase tracking-widest">
                  <tr>
                    <th className="px-5 py-4 text-left font-semibold">Reference</th>
                    <th className="px-5 py-4 text-left font-semibold hidden lg:table-cell">Guest</th>
                    <th className="px-5 py-4 text-left font-semibold hidden md:table-cell">Hotel</th>
                    <th className="px-5 py-4 text-left font-semibold hidden md:table-cell">Room Details</th>
                    <th className="px-5 py-4 text-left font-semibold">Dates</th>
                    <th className="px-5 py-4 text-left font-semibold hidden sm:table-cell">Amount</th>
                    <th className="px-5 py-4 text-left font-semibold">Status</th>
                    <th className="px-5 py-4 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
              {paged.length === 0 ? (
                <tr><td colSpan={8} className="px-5 py-8 text-center text-ink-800/40 text-sm">No data available</td></tr>
              ) : (paged || []).map(b => (
                    <tr key={b._id || b.id} className="border-t border-sand-200 hover:bg-sand-50/60 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-mono text-xs font-semibold text-ink-900">{b.dummyReference}</div>
                        <div className="text-[11px] text-ink-800/40 mt-0.5">{b.roomType} - {b.guests ?? 1} guest{(b.guests ?? 1) > 1 ? "s" : ""}</div>
                      </td>
                      <td className="px-5 py-4 hidden lg:table-cell">
                        <div className="text-sm font-medium text-ink-900">{typeof b.userId === "object" && b.userId ? b.userId.name : "-"}</div>
                        <div className="text-[11px] text-ink-800/40">{typeof b.userId === "object" && b.userId ? b.userId.email : ""}</div>
                      </td>
                      <td className="px-5 py-4 text-ink-800/70 hidden md:table-cell">{typeof b.hotelId === "object" && b.hotelId ? b.hotelId.name : "-"}</td>
                      <td className="px-5 py-4 text-ink-800/70 hidden md:table-cell">
                        <div className="text-xs capitalize">{b.roomType || "Standard"}</div>
                        <div className="text-[11px] text-ink-800/50">{b.numberOfRooms || 1} Room(s) - {b.guests || 1} Guest(s)</div>
                      </td>
                      <td className="px-5 py-4 text-ink-800/60 text-xs">
                        <div className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{fmtDate(b.checkInDate)}</div>
                        <div className="text-ink-800/40 mt-0.5">&rarr; {fmtDate(b.checkOutDate)}</div>
                      </td>
                      <td className="px-5 py-4 font-semibold text-ink-900 hidden sm:table-cell">{fmt(b.totalPrice || 0)}</td>
                      <td className="px-5 py-4"><Badge status={b.status} /></td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setEditing(b)} className="w-9 h-9 rounded-xl bg-leaf-700/10 text-leaf-700 hover:bg-leaf-700 hover:text-sand-50 flex items-center justify-center transition-colors"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => setConfirm(b._id || b.id!)} className="w-9 h-9 rounded-xl bg-red-500/10 text-red-600 hover:bg-red-600 hover:text-white flex items-center justify-center transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
              </table>
            </div>
          <Pagination page={page} pages={pages} total={filtered.length} onPage={setPage} />
      </Card>
      <AnimatePresence>{editing && <BookingEditModal booking={editing} onClose={() => setEditing(null)} onSave={patch => update(editing._id || editing.id!, patch)} />}</AnimatePresence>
      <AnimatePresence>{adding && <ManualBookingModal onClose={() => setAdding(false)} onSave={createManual} hotels={hotels} user={user} />}</AnimatePresence>
      {confirm && <ConfirmDialog message="This will permanently delete this booking record." onConfirm={() => del(confirm)} onCancel={() => setConfirm(null)} />}
    </>
    )}
    </div>
    );
}
