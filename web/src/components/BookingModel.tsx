import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Users, Bed, CreditCard, Sparkles, MapPin, AlertTriangle } from "lucide-react";
import { useAppSelector } from "../store";
import type { Hotel, Booking } from "../store/slices/dataSlice";
import { api, resolveMediaUrl } from '../services/api';

interface Props {
  open: boolean;
  hotel: Hotel;
  onClose: () => void;
  onConfirm: (booking: Booking) => void;
  onRequireAuth?: () => void;
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialRoomType?: "standard" | "deluxe" | "suite";
  initialGuests?: number;
}

const todayISO = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split("T")[0];
};
const addDays = (d: string, n: number) => new Date(new Date(d).getTime() + n * 864e5).toISOString().split("T")[0];
const nightsBetween = (a: string, b: string) => Math.max(1, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 864e5));

export default function BookingModal({ open, hotel, onClose, onConfirm, onRequireAuth, initialCheckIn, initialCheckOut, initialRoomType, initialGuests }: Props) {
  const auth = useAppSelector((s) => s.auth);
  const [step, setStep] = useState(1);
  const [checkIn, setCheckIn] = useState(initialCheckIn || todayISO());
  const [checkOut, setCheckOut] = useState(initialCheckOut || addDays(todayISO(), 2));
  const [roomType, setRoomType] = useState<"standard" | "deluxe" | "suite">(initialRoomType || "standard");
  const [guests, setGuests] = useState(initialGuests || 2);
  const [name, setName] = useState(auth.user?.name || "");
  const [email, setEmail] = useState(auth.user?.email || "");
  const [confirmed, setConfirmed] = useState<Booking | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setCheckIn(initialCheckIn || todayISO());
      setCheckOut(initialCheckOut || addDays(todayISO(), 2));
      setRoomType(initialRoomType || "standard");
      setGuests(initialGuests || 2);
      setStep(1);
      setConfirmed(null);
      setError(null);
    }
  }, [open, initialCheckIn, initialCheckOut, initialRoomType, initialGuests]);

  const reset = () => {
    setStep(1);
    setConfirmed(null);
    setError(null);
    setCheckIn(initialCheckIn || todayISO());
    setCheckOut(initialCheckOut || addDays(todayISO(), 2));
    setRoomType(initialRoomType || "standard");
    setGuests(initialGuests || 2);
  };

  const close = () => {
    onClose();
    setTimeout(reset, 300);
  };

  const getRoomPrice = (type: string) => {
    if (hotel.roomTiers && hotel.roomTiers.length > 0) {
      const tier = hotel.roomTiers.find(t => t.tier === type);
      if (tier) return tier.price;
    }
    const mult = type === "standard" ? 1 : type === "deluxe" ? 1.4 : 2.1;
    return Math.round(hotel.pricePerNight * mult);
  };

  const maxGuests = roomType === "standard" ? 2 : roomType === "deluxe" ? 4 : 6;
  const nights = nightsBetween(checkIn, checkOut);
  const totalPrice = Math.round(getRoomPrice(roomType) * nights);

  const finalize = async () => {
    if (!auth.isAuthenticated) {
      setError("Please sign in to complete your booking.");
      onRequireAuth?.();
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const saved: any = await api.createBooking({
        hotelId: hotel.id,
        hotelName: hotel.name,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        roomType,
        totalPrice,
        guests,
      });

      const booking: Booking = {
        id: saved.id || saved._id,
        hotelId: hotel.id,
        hotelName: hotel.name,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        roomType,
        totalPrice,
        status: "confirmed",
        dummyReference: saved.dummyReference,
        createdAt: saved.createdAt || new Date().toISOString(),
        guests,
      };

      setConfirmed(booking);
      setStep(3);
      onConfirm(booking);
    } catch (err: any) {
      setError(err.message || "Booking failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-90 flex items-center justify-center p-4 bg-ink-900/70 backdrop-blur-sm overflow-y-auto"
          onClick={close}
        >
          <motion.div
            initial={{ y: 50, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 50, opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl bg-sand-50 rounded-4xl shadow-2xl my-8 overflow-hidden"
          >
            { }
            <div className="relative h-32 bg-linear-to-br from-leaf-700 via-leaf-600 to-sunset-500 overflow-hidden">
              <div
                className="absolute inset-0 opacity-30"
                style={{ backgroundImage: `url(${resolveMediaUrl(hotel.photos[0])})`, backgroundSize: "cover", backgroundPosition: "center" }}
              />
              <div className="absolute inset-0 bg-linear-to-b from-transparent to-ink-900/40" />
              <button
                onClick={close}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-sand-50/20 backdrop-blur text-sand-50 font-semibold flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="absolute bottom-5 left-6 text-sand-50">
                <div className="flex items-center gap-2 text-sm text-sand-50/80 mb-1">
                  <MapPin className="w-3.5 h-3.5" /> {hotel.location}
                </div>
                <h2 className="font-serif text-2xl md:text-3xl">{hotel.name}</h2>
              </div>
            </div>

            { }
            <div className="px-8 py-4 border-b border-sand-200 flex items-center gap-2 bg-sand-100/50">
              {["Dates", "Details", "Confirmation"].map((label, i) => {
                const idx = i + 1;
                const active = step === idx;
                const done = step > idx;
                return (
                  <div key={label} className="flex items-center gap-2 flex-1">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${active
                          ? "bg-leaf-700 text-sand-50 scale-110"
                          : done
                            ? "bg-leaf-700/10 text-leaf-700 border-2 border-leaf-700"
                            : "bg-sand-200 text-ink-800/40"
                        }`}
                    >
                      {done ? "✓" : idx}
                    </div>
                    <span
                      className={`text-xs font-semibold hidden sm:block ${active ? "text-leaf-700" : done ? "text-ink-800/70" : "text-ink-800/40"
                        }`}
                    >
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="p-6 md:p-8 overflow-y-auto max-h-[60vh]">
              {!auth.isAuthenticated && step !== 3 && (
                <div className="mb-5 flex items-start gap-3 rounded-2xl bg-sunset-500/10 border border-sunset-500/30 px-4 py-3 text-sm text-ink-900">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-sunset-600" />
                  <span>You'll need to sign in before this booking can be confirmed. You can still fill in the details now.</span>
                </div>
              )}

              <AnimatePresence mode="wait">
                {/* ── Step 1: Dates & Room ──────────────────────────────────── */}
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    className="space-y-5"
                  >
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-ink-800/60 font-semibold uppercase tracking-wider block mb-2">
                          <Calendar className="w-4 h-4 inline-block mr-1.5" /> Check-in
                        </label>
                        <input
                          type="date"
                          value={checkIn}
                          min={todayISO()}
                          onChange={(e) => {
                            setCheckIn(e.target.value);
                            if (e.target.value >= checkOut) setCheckOut(addDays(e.target.value, 1));
                          }}
                          className="w-full px-4 py-3 rounded-2xl bg-sand-100 border border-sand-200 focus:border-leaf-600 focus:outline-none focus:ring-2 focus:ring-leaf-600/20 text-ink-900"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-ink-800/60 font-semibold uppercase tracking-wider block mb-2">
                          <Calendar className="w-4 h-4 inline-block mr-1.5" /> Check-out
                        </label>
                        <input
                          type="date"
                          value={checkOut}
                          min={addDays(checkIn, 1)}
                          onChange={(e) => setCheckOut(e.target.value)}
                          className="w-full px-4 py-3 rounded-2xl bg-sand-100 border border-sand-200 focus:border-leaf-600 focus:outline-none focus:ring-2 focus:ring-leaf-600/20 text-ink-900"
                        />
                      </div>
                    </div>

                    {/* Guests */}
                    <div>
                      <label className="text-xs text-ink-800/60 font-semibold uppercase tracking-wider block mb-2">
                        <Users className="w-4 h-4 inline-block mr-1.5" /> Guests
                      </label>
                      <div className="flex items-center gap-3 flex-wrap">
                        {[1, 2, 3, 4, 5, 6].filter(n => n <= maxGuests).map((n) => (
                          <button
                            key={n}
                            onClick={() => setGuests(n)}
                            className={`w-12 h-12 rounded-2xl font-semibold text-sm transition-all ${guests === n
                                ? "bg-leaf-700 text-sand-50 shadow-md shadow-leaf-700/30"
                                : "bg-sand-100 text-ink-800 hover:bg-sand-200"
                              }`}
                          >
                            {n}
                          </button>
                        ))}
                        <span className="text-sm text-ink-800/60 ml-1">guest{guests > 1 ? "s" : ""}</span>
                      </div>
                    </div>

                    {/* Room type */}
                    <div>
                      <label className="text-xs text-ink-800/60 font-semibold uppercase tracking-wider block mb-2">
                        <Bed className="w-4 h-4 inline-block mr-1.5" /> Room Type
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        {(["standard", "deluxe", "suite"] as const).map((type) => {
                          const price = getRoomPrice(type);
                          return (
                            <button
                              key={type}
                              onClick={() => {
                                setRoomType(type);
                                const limit = type === "standard" ? 2 : type === "deluxe" ? 4 : 6;
                                if (guests > limit) setGuests(limit);
                              }}
                              className={`p-3 rounded-2xl border-2 text-left transition-all ${roomType === type
                                  ? "border-leaf-600 bg-leaf-700/5"
                                  : "border-sand-200 hover:border-sand-300"
                                }`}
                            >
                              <div className="font-semibold text-sm capitalize text-ink-900">{type}</div>
                              <div className="text-xs text-ink-800/60 mt-0.5">LKR {price.toLocaleString()}/night</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Summary */}
                    <div className="rounded-2xl bg-sand-100 p-4 flex items-center justify-between">
                      <div>
                        <div className="text-xs text-ink-800/60 font-semibold uppercase tracking-wider">Total</div>
                        <div className="font-serif text-2xl text-ink-900 mt-0.5">
                          LKR {totalPrice.toLocaleString()}
                        </div>
                        <div className="text-xs text-ink-800/60 mt-0.5">{nights} night{nights > 1 ? "s" : ""} · {roomType}</div>
                      </div>
                      <button
                        onClick={() => setStep(2)}
                        className="px-6 py-3 rounded-2xl bg-leaf-700 text-sand-50 font-semibold text-sm hover:bg-leaf-600 transition-colors shadow-md shadow-leaf-700/20"
                      >
                        Continue →
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* ── Step 2: Guest Details ─────────────────────────────────── */}
                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    className="space-y-5"
                  >
                    <div>
                      <label className="text-xs text-ink-800/60 font-semibold uppercase tracking-wider block mb-2">Full Name</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your full name"
                        className="w-full px-4 py-3 rounded-2xl bg-sand-100 border border-sand-200 focus:border-leaf-600 focus:outline-none focus:ring-2 focus:ring-leaf-600/20 text-ink-900"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-ink-800/60 font-semibold uppercase tracking-wider block mb-2">Email</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="w-full px-4 py-3 rounded-2xl bg-sand-100 border border-sand-200 focus:border-leaf-600 focus:outline-none focus:ring-2 focus:ring-leaf-600/20 text-ink-900"
                      />
                    </div>

                    {/* Booking summary */}
                    <div className="rounded-2xl bg-sand-100 p-4 space-y-2">
                      <div className="font-semibold text-sm text-ink-900 mb-3 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-sunset-500" /> Booking Summary
                      </div>
                      {[
                        ["Hotel", hotel.name],
                        ["Check-in", checkIn],
                        ["Check-out", checkOut],
                        ["Nights", `${nights}`],
                        ["Room", roomType],
                        ["Guests", `${guests}`],
                        ["Total", `LKR ${totalPrice.toLocaleString()}`],
                      ].map(([k, v]) => (
                        <div key={k} className="flex justify-between text-sm">
                          <span className="text-ink-800/60">{k}</span>
                          <span className="font-semibold text-ink-900">{v}</span>
                        </div>
                      ))}
                    </div>

                    {error && (
                      <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
                        {error}
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button
                        onClick={() => setStep(1)}
                        className="flex-1 py-3 rounded-2xl border border-sand-200 text-ink-800 text-sm font-semibold hover:bg-sand-100 transition-colors"
                      >
                        ← Back
                      </button>
                      <button
                        onClick={finalize}
                        disabled={submitting || !name || !email}
                        className="flex-1 py-3 rounded-2xl bg-leaf-700 text-sand-50 font-semibold text-sm hover:bg-leaf-600 transition-colors shadow-md shadow-leaf-700/20 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {submitting ? "Confirming..." : (
                          <><CreditCard className="w-4 h-4 inline-block mr-1.5" /> Confirm Booking</>
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* ── Step 3: Confirmation ─────────────────────────────────── */}
                {step === 3 && confirmed && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-4 space-y-5"
                  >
                    <div className="w-20 h-20 mx-auto rounded-full bg-linear-to-br from-leaf-500 to-leaf-700 flex items-center justify-center text-sand-50 text-3xl shadow-xl shadow-leaf-700/30 mb-4">
                      ✓
                    </div>
                    <h3 className="font-serif text-2xl text-ink-900">Booking Confirmed!</h3>
                    <p className="text-ink-800/70 text-sm max-w-xs mx-auto">
                      Your reservation at {hotel.name} has been placed. Keep your reference number safe.
                    </p>
                    <div className="rounded-2xl bg-leaf-700/5 border border-leaf-700/20 p-4 inline-block">
                      <div className="text-xs text-ink-800/60 uppercase tracking-wider font-semibold mb-1">Reference</div>
                      <div className="font-mono text-xl font-bold text-leaf-700">{confirmed.dummyReference}</div>
                    </div>
                    <div className="text-xs text-ink-800/50">
                      {checkIn} → {checkOut} · {nights} night{nights > 1 ? "s" : ""} · {roomType}
                    </div>
                    <button
                      onClick={close}
                      className="px-8 py-3 rounded-2xl bg-ink-900 text-sand-50 font-semibold text-sm hover:bg-leaf-700 transition-colors"
                    >
                      Done
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
