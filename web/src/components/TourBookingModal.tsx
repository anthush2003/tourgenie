import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Users, Car, CreditCard, Sparkles, MapPin, Check, Fuel, UserCheck, Languages, Ban } from "lucide-react";
import { useAppSelector } from "../store";
import type { Tour, TourBooking, Vehicle, Guide, TourTier } from "../store/slices/dataSlice";
import { api, resolveMediaUrl } from "../services/api";

interface Props {
  open: boolean;
  tour: Tour;
  onClose: () => void;
  onConfirm: (booking: TourBooking) => void;
  onRequireAuth?: () => void;
  selectedTier?: "Budget" | "Standard" | "Luxury";
  initialDate?: string;
  initialPassengers?: number;
}

const todayISO = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split("T")[0];
};

const VEHICLE_ICON: Record<string, string> = {
  car: "🚗", van: "🚐", suv: "🚙", minibus: "🚌", bus: "🚍", tuktuk: "🛺", motorbike: "🏍️",
};

export default function TourBookingModal({ open, tour, selectedTier: initialTier = "Standard", initialDate, initialPassengers, onClose, onConfirm, onRequireAuth }: Props) {
  const auth = useAppSelector((s) => s.auth);
  const [step, setStep] = useState(1);
  const [travelDate, setTravelDate] = useState(initialDate || todayISO());
  const [travelers, setTravelers] = useState(initialPassengers || 2);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [wantsVehicle, setWantsVehicle] = useState(true);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [guidesLoading, setGuidesLoading] = useState(true);
  const [selectedGuideId, setSelectedGuideId] = useState<string | null>(null);
  const [wantsGuide, setWantsGuide] = useState(false);
  
  const [bookedVehicleIds, setBookedVehicleIds] = useState<Set<string>>(new Set());
  const [bookedGuideIds, setBookedGuideIds] = useState<Set<string>>(new Set());
  const [bookedSeatsCount, setBookedSeatsCount] = useState(0);
  const [confirmed, setConfirmed] = useState<TourBooking | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTier, setSelectedTier] = useState<"Budget" | "Standard" | "Luxury">(initialTier);
  const [paymentMethod, setPaymentMethod] = useState<"Credit Card" | "Digital Wallet" | "BNPL">("Credit Card");

  useEffect(() => {
    if (open) {
      setTravelDate(initialDate || todayISO());
      setTravelers(initialPassengers || 2);
    }
  }, [open, initialDate, initialPassengers]);

  useEffect(() => {
    setSelectedTier(initialTier);
  }, [initialTier]);

  useEffect(() => {
    if (!open || !travelDate) return;
    api.checkAvailability(travelDate, tour.id).then((res: any) => {
      setBookedVehicleIds(new Set(res.bookedVehicleIds || []));
      setBookedGuideIds(new Set(res.bookedGuideIds || []));
      setBookedSeatsCount(res.bookedSeats || 0);
      
      if (selectedVehicleId && res.bookedVehicleIds?.includes(selectedVehicleId)) setSelectedVehicleId(null);
      if (selectedGuideId && res.bookedGuideIds?.includes(selectedGuideId)) setSelectedGuideId(null);
    }).catch(console.error);
  }, [open, travelDate, tour.id]);

  useEffect(() => {
    if (!open) return;
    setVehiclesLoading(true);
    api.getVehicles()
      .then((list) => setVehicles((list || []).map((v: any) => ({ ...v, id: v.id || v._id }))))
      .catch(() => setVehicles([]))
      .finally(() => setVehiclesLoading(false));
    setGuidesLoading(true);
    api.getGuides()
      .then((list) => setGuides((list || []).map((g: any) => ({ ...g, id: g.id || g._id }))))
      .catch(() => setGuides([]))
      .finally(() => setGuidesLoading(false));
  }, [open]);

  const reset = () => {
    setStep(1);
    setConfirmed(null);
    setError(null);
    setTravelDate(todayISO());
    setTravelers(2);
    setSelectedVehicleId(null);
    setWantsVehicle(true);
    setSelectedGuideId(null);
    setWantsGuide(false);
    setSelectedTier(initialTier);
    setPaymentMethod("Credit Card");
  };

  const close = () => {
    onClose();
    setTimeout(reset, 300);
  };

  const suitableVehicles = vehicles.filter((v) => v.isActive && v.capacity >= travelers);
  const activeGuides = guides.filter((g) => g.isActive);

  useEffect(() => {
    if (selectedVehicleId) {
      const vehicle = vehicles.find((v) => v.id === selectedVehicleId);
      if (vehicle && vehicle.capacity < travelers) {
        setSelectedVehicleId(null);
      }
    }
  }, [travelers, vehicles, selectedVehicleId]);

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId) || null;
  const selectedGuide = guides.find((g) => g.id === selectedGuideId) || null;
  const defaultTiers: TourTier[] = [
    { name: "Budget", price: (tour.price || 0) * 0.8, enabled: true, inclusions: ["Basic Guide"] },
    { name: "Standard", price: (tour.price || 0), enabled: true, inclusions: ["Premium Guide", "Entry Tickets"] },
    { name: "Luxury", price: (tour.price || 0) * 1.5, enabled: true, inclusions: ["Premium Guide", "Entry Tickets", "Priority Access"] },
  ];
  
  const allTiers = (tour.tiers && tour.tiers.length > 0) ? tour.tiers : defaultTiers;
  // If tour has tiers but they're old schema without `enabled` property, we just show them
  // If they have `enabled`, we filter them. If none enabled, fallback to default.
  let availableTiers = allTiers.filter(t => t.enabled !== false);
  if (availableTiers.length === 0 && (!tour.tiers || tour.tiers.length === 0)) availableTiers = defaultTiers;

  const selectedTierObj = availableTiers.find(t => t.name === selectedTier) || availableTiers[0];

  const basePrice = (selectedTierObj?.price || tour.price || 0) * travelers;
  const taxes = basePrice * 0.1;

  let tourDays = 1;
  const strD = String(tour?.duration || "").toLowerCase();
  const mDay = strD.match(/(\d+)\s*days?/);
  const mWk = strD.match(/(\d+)\s*week/);
  if (mDay) tourDays = parseInt(mDay[1], 10);
  else if (mWk) tourDays = parseInt(mWk[1], 10) * 7;
  else if (strD.includes('multi')) tourDays = 3;

  const vehicleTotal = wantsVehicle ? (selectedVehicle?.pricePerDay || 0) * tourDays : 0;
  const guideTotal = wantsGuide ? (selectedGuide?.pricePerDay || 0) * tourDays : 0;
  const addonsPrice = vehicleTotal + guideTotal;
  const estimatedTotal = basePrice + taxes + addonsPrice;
  const canContinue = (!wantsVehicle || !!selectedVehicleId) && (!wantsGuide || !!selectedGuideId);

  const finalize = async () => {
    if (!auth.isAuthenticated) {
      setError("Please sign in to complete your booking.");
      onRequireAuth?.();
      return;
    }
    if (wantsVehicle && !selectedVehicleId) {
      setError("Please select a vehicle to continue, or choose self-drive.");
      return;
    }
    if (wantsGuide && !selectedGuideId) {
      setError("Please select a guide to continue, or skip the guide.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const saved: any = await api.createTourBooking({
        tourId: tour.id,
        vehicleId: wantsVehicle ? selectedVehicleId : null,
        guideId: wantsGuide ? selectedGuideId : null,
        travelDate,
        travelers,
        tierName: selectedTier,
      });

      const booking: TourBooking = {
        id: saved.id || saved._id,
        tourId: tour.id,
        tourTitle: tour.title,
        vehicleId: wantsVehicle ? selectedVehicleId : null,
        vehicleName: (wantsVehicle ? selectedVehicle?.name : "") || saved.vehicleName || "",
        guideId: wantsGuide ? selectedGuideId : null,
        guideName: (wantsGuide ? selectedGuide?.name : "") || saved.guideName || "",
        travelDate,
        travelers,
        tierName: selectedTier,
        tourPrice: saved.tourPrice ?? basePrice,
        vehiclePrice: saved.vehiclePrice ?? vehicleTotal,
        guidePrice: saved.guidePrice ?? guideTotal,
        totalPrice: saved.totalPrice,
        status: "confirmed",
        dummyReference: saved.dummyReference,
        createdAt: saved.createdAt || new Date().toISOString(),
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
                style={{ backgroundImage: `url(${resolveMediaUrl(tour.coverImage)})`, backgroundSize: "cover", backgroundPosition: "center" }}
              />
              <div className="absolute inset-0 bg-linear-to-b from-transparent to-ink-900/40" />
              <button onClick={close} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-sand-50/20 backdrop-blur text-sand-50 font-semibold flex items-center justify-center">
                <X className="w-5 h-5" />
              </button>
              <div className="absolute bottom-5 left-6 text-sand-50">
                <div className="flex items-center gap-2 text-sm text-sand-50/80 mb-1">
                  <MapPin className="w-3.5 h-3.5" /> {tour.location}
                </div>
                <h2 className="font-serif text-2xl md:text-3xl">{tour.title}</h2>
              </div>
            </div>

            { }
            <div className="px-8 py-4 border-b border-sand-200 flex items-center gap-2 bg-sand-100/50">
              {["Vehicle & Date", "Confirm", "Done"].map((label, i) => {
                const idx = i + 1;
                const active = step === idx;
                const done = step > idx;
                return (
                  <div key={label} className="flex items-center gap-2 flex-1">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${active ? "bg-leaf-700 text-sand-50 scale-110" : done ? "bg-leaf-700/10 text-leaf-700 border-2 border-leaf-700" : "bg-sand-200 text-ink-800/40"
                      }`}>
                      {done ? "✓" : idx}
                    </div>
                    <span className={`text-xs font-medium hidden sm:inline ${active ? "text-ink-900" : "text-ink-800/50"}`}>{label}</span>
                    {idx < 3 && <div className="flex-1 h-px bg-sand-200" />}
                  </div>
                );
              })}
            </div>

            <div className="p-6 md:p-8 max-h-[65vh] overflow-y-auto">
              <AnimatePresence mode="wait">
                { }
                {step === 1 && (
                  <motion.div key="step1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-ink-800/60 font-semibold uppercase tracking-wider block mb-2">
                          <Calendar className="w-4 h-4 inline-block mr-1.5" /> Travel Date
                        </label>
                        <input type="date" value={travelDate} min={todayISO()} onChange={(e) => setTravelDate(e.target.value)}
                          className="w-full px-4 py-3 rounded-2xl bg-sand-100 border border-sand-200 focus:border-leaf-600 focus:outline-none focus:ring-2 focus:ring-leaf-600/20 text-ink-900" />
                      </div>
                      <div>
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-xs text-ink-800/60 font-semibold uppercase tracking-wider block">
                              <Users className="w-4 h-4 inline-block mr-1.5" /> Travelers
                            </label>
                            {tour.availableSeats != null && (
                              <span className="text-xs font-semibold text-sunset-500 bg-sunset-50 px-2 py-0.5 rounded-full">
                                {Math.max(0, tour.availableSeats - bookedSeatsCount)} seats left
                              </span>
                            )}
                          </div>
                          {(tour.availableSeats != null && tour.availableSeats - bookedSeatsCount <= 0) ? (
                            <div className="text-sm font-semibold text-red-600 bg-red-50 p-2 rounded-xl text-center">Sold Out</div>
                          ) : (
                            <div className="flex items-center gap-3">
                              <button onClick={() => setTravelers(Math.max(1, travelers - 1))} className="w-9 h-9 flex items-center justify-center rounded-xl bg-sand-100 hover:bg-sand-200 text-ink-900 font-bold text-lg leading-none pb-0.5">-</button>
                              <input 
                                type="number" 
                                value={travelers} 
                                min={1}
                                max={tour.availableSeats != null ? Math.max(1, tour.availableSeats - bookedSeatsCount) : 30}
                                onChange={e => {
                                  const val = parseInt(e.target.value) || 1;
                                  const maxAllowed = tour.availableSeats != null ? Math.max(1, tour.availableSeats - bookedSeatsCount) : 30;
                                  setTravelers(Math.min(maxAllowed, Math.max(1, val)));
                                }}
                                className="w-16 h-9 text-center bg-sand-100 rounded-xl border border-sand-200 focus:outline-none focus:ring-2 focus:ring-leaf-600/50 font-semibold text-ink-900"
                              />
                              <button onClick={() => {
                                const maxAllowed = tour.availableSeats != null ? Math.max(1, tour.availableSeats - bookedSeatsCount) : 30;
                                setTravelers(Math.min(maxAllowed, travelers + 1));
                              }} className="w-9 h-9 flex items-center justify-center rounded-xl bg-sand-100 hover:bg-sand-200 text-ink-900 font-bold text-lg leading-none pb-0.5">+</button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-ink-800/60 font-semibold uppercase tracking-wider block mb-2">
                        <Sparkles className="w-4 h-4 inline-block mr-1.5" /> Package Tier
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {availableTiers.map((t) => (
                          <button
                            key={t.name}
                            onClick={() => setSelectedTier(t.name as any)}
                            className={`p-3 rounded-2xl border text-left transition-all ${selectedTier === t.name ? "border-leaf-600 bg-leaf-700/10" : "border-sand-200 bg-sand-100 hover:border-sand-300"}`}
                          >
                            <div className="font-semibold text-sm text-ink-900 flex justify-between items-center">
                              {t.name}
                              <span className="text-leaf-700">Rs {t.price.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                            </div>
                            <div className="text-xs text-ink-800/60 mt-1 line-clamp-2">{t.inclusions.join(", ")}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-xs text-ink-800/60 font-semibold uppercase tracking-wider">
                          <Car className="w-4 h-4 inline-block mr-1.5" /> Choose a Vehicle
                        </label>
                        <button
                          type="button"
                          onClick={() => { setWantsVehicle((w) => !w); if (wantsVehicle) setSelectedVehicleId(null); }}
                          className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${!wantsVehicle ? "border-leaf-600 bg-leaf-700/10 text-leaf-700" : "border-sand-200 text-ink-800/50 hover:bg-sand-100"}`}
                        >
                          <Ban className="w-3.5 h-3.5" /> Self-drive / no vehicle
                        </button>
                      </div>
                      {!wantsVehicle ? (
                        <div className="text-sm text-ink-800/50 py-6 text-center bg-sand-100 rounded-2xl">
                          You'll make your own way to each stop. You can still book a guide below.
                        </div>
                      ) : vehiclesLoading ? (
                        <div className="text-sm text-ink-800/50 py-8 text-center">Loading available vehicles…</div>
                      ) : suitableVehicles.length === 0 ? (
                        <div className="text-sm text-ink-800/50 py-8 px-4 text-center bg-sand-100 rounded-2xl flex flex-col items-center gap-3">
                          <p>No vehicles available for {travelers} travelers. Try reducing your party size or continue with self-drive.</p>
                          <button type="button" onClick={() => setWantsVehicle(false)} className="px-4 py-2 bg-leaf-700/10 text-leaf-700 rounded-xl font-semibold text-xs hover:bg-leaf-700/20 transition-colors">Switch to Self-drive</button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {(suitableVehicles || []).map((v) => {
                            const isBooked = bookedVehicleIds.has(v.id);
                            return (
                              <button key={v.id} onClick={() => !isBooked && setSelectedVehicleId(v.id)}
                                disabled={isBooked}
                                className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${isBooked ? "opacity-50 cursor-not-allowed bg-sand-100/50 border-sand-200" : selectedVehicleId === v.id ? "border-leaf-600 bg-leaf-700/5" : "border-sand-200 hover:border-sand-300"
                                  }`}>
                                <div className="w-14 h-14 rounded-xl bg-sand-100 flex items-center justify-center text-2xl shrink-0 overflow-hidden">
                                  {v.photos?.[0] ? <img src={resolveMediaUrl(v.photos[0])} alt={v.name} className="w-full h-full object-cover" /> : VEHICLE_ICON[v.type] || "🚗"}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-sm text-ink-900 flex items-center gap-2">
                                    {v.name}
                                    {isBooked && <span className="text-[10px] uppercase tracking-wider bg-sand-200 text-ink-500 px-2 py-0.5 rounded-full">Booked Out</span>}
                                    {selectedVehicleId === v.id && <Check className="w-4 h-4 text-leaf-700" />}
                                  </div>
                                  <div className="flex items-center gap-3 text-xs text-ink-800/55 mt-1 flex-wrap">
                                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{v.capacity} seats</span>
                                    {v.acAvailable && <span className="flex items-center gap-1"><Fuel className="w-3 h-3" />A/C</span>}
                                    {v.driverIncluded && <span className="flex items-center gap-1"><UserCheck className="w-3 h-3" />Driver included</span>}
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <div className="font-serif text-lg text-ink-900">LKR {v.pricePerDay.toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
                                  <div className="text-[10px] text-ink-800/45 uppercase tracking-wide">per day</div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-xs text-ink-800/60 font-semibold uppercase tracking-wider">
                          <UserCheck className="w-4 h-4 inline-block mr-1.5" /> Add a Private Guide
                        </label>
                        <button
                          type="button"
                          onClick={() => { setWantsGuide((w) => !w); if (wantsGuide) setSelectedGuideId(null); }}
                          className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${wantsGuide ? "border-leaf-600 bg-leaf-700/10 text-leaf-700" : "border-sand-200 text-ink-800/50 hover:bg-sand-100"}`}
                        >
                          {wantsGuide ? <Check className="w-3.5 h-3.5" /> : null} {wantsGuide ? "Guide added" : "Add optional guide"}
                        </button>
                      </div>
                      {!wantsGuide ? (
                        <div className="text-sm text-ink-800/50 py-4 text-center bg-sand-100 rounded-2xl">
                          Explore at your own pace with our in-app guide — no private guide needed.
                        </div>
                      ) : guidesLoading ? (
                        <div className="text-sm text-ink-800/50 py-8 text-center">Loading available guides…</div>
                      ) : activeGuides.length === 0 ? (
                        <div className="text-sm text-ink-800/50 py-8 text-center bg-sand-100 rounded-2xl">
                          No guides available right now.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {(activeGuides || []).map((g) => {
                            const isBooked = bookedGuideIds.has(g.id);
                            return (
                            <button key={g.id} onClick={() => !isBooked && setSelectedGuideId(g.id)}
                              disabled={isBooked}
                              className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${isBooked ? "opacity-50 cursor-not-allowed bg-sand-100/50 border-sand-200" : selectedGuideId === g.id ? "border-leaf-600 bg-leaf-700/5" : "border-sand-200 hover:border-sand-300"
                                }`}>
                              <div className="w-14 h-14 rounded-xl bg-sand-100 flex items-center justify-center text-2xl shrink-0 overflow-hidden">
                                {g.photo ? <img src={resolveMediaUrl(g.photo)} alt={g.name} className="w-full h-full object-cover" /> : "🧭"}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-sm text-ink-900 flex items-center gap-2">
                                  {g.name}
                                  {isBooked && <span className="text-[10px] uppercase tracking-wider bg-sand-200 text-ink-500 px-2 py-0.5 rounded-full">Booked Out</span>}
                                  {selectedGuideId === g.id && <Check className="w-4 h-4 text-leaf-700" />}
                                </div>
                                <div className="flex items-center gap-3 text-xs text-ink-800/55 mt-1 flex-wrap">
                                  <span className="flex items-center gap-1"><Languages className="w-3 h-3" />{g.languages?.join(", ") || "English"}</span>
                                  <span className="flex items-center gap-1"><Sparkles className="w-3 h-3" />{g.yearsExperience} yrs exp.</span>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <div className="font-serif text-lg text-ink-900">LKR {g.pricePerDay.toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
                                <div className="text-[10px] text-ink-800/45 uppercase tracking-wide">per day</div>
                              </div>
                            </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="rounded-2xl bg-sand-100 p-4 flex items-center justify-between">
                      <div>
                        <div className="text-xs text-ink-800/60 font-semibold uppercase tracking-wider">Estimated Total</div>
                        <div className="font-serif text-2xl text-ink-900 mt-0.5">LKR {estimatedTotal.toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
                        <div className="text-xs text-ink-800/60 mt-0.5">Tour package{wantsVehicle ? " + vehicle" : ""}{wantsGuide ? " + guide" : ""} for the day</div>
                      </div>
                      <button onClick={() => setStep(2)} disabled={!canContinue}
                        className="px-6 py-3 rounded-2xl bg-leaf-700 text-sand-50 font-semibold text-sm hover:bg-leaf-600 transition-colors shadow-md shadow-leaf-700/20 disabled:opacity-50 disabled:cursor-not-allowed">
                        Continue →
                      </button>
                    </div>
                  </motion.div>
                )}

                { }
                {step === 2 && (
                  <motion.div key="step2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-5">
                    <div className="rounded-2xl bg-sand-100 p-4 space-y-2">
                      <div className="font-semibold text-sm text-ink-900 mb-3 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-sunset-500" /> Booking Summary
                      </div>
                      {[
                        ["Tour", tour.title],
                        ["Travel Date", travelDate],
                        ["Travelers", `${travelers}`],
                        ["Package Tier", selectedTier],
                        ["Vehicle", wantsVehicle ? (selectedVehicle?.name ?? "—") : "Self-drive"],
                        ...(wantsGuide ? [["Guide", selectedGuide?.name ?? "—"]] : []),
                        ["Base Price", `LKR ${basePrice.toLocaleString('en-US', { maximumFractionDigits: 0 })}`],
                        ["Taxes (10%)", `LKR ${taxes.toLocaleString('en-US', { maximumFractionDigits: 0 })}`],
                        ...(addonsPrice > 0 ? [["Add-ons", `LKR ${addonsPrice.toLocaleString('en-US', { maximumFractionDigits: 0 })}`]] : []),
                        ["Total", `LKR ${estimatedTotal.toLocaleString('en-US', { maximumFractionDigits: 0 })}`],
                      ].map(([k, v]) => (
                        <div key={k} className="flex justify-between text-sm">
                          <span className="text-ink-800/60">{k}</span>
                          <span className="font-semibold text-ink-900">{v}</span>
                        </div>
                      ))}
                    </div>

                    <div className="rounded-2xl bg-sand-100 p-4 space-y-3">
                      <div className="font-semibold text-sm text-ink-900 flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-leaf-700" /> Payment Method
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {(["Credit Card", "Digital Wallet", "BNPL"] as const).map(method => (
                          <button
                            key={method}
                            onClick={() => setPaymentMethod(method)}
                            className={`p-2 rounded-xl border text-sm font-medium transition-all ${paymentMethod === method ? "border-leaf-600 bg-leaf-700/10 text-leaf-700" : "border-sand-200 bg-sand-50 text-ink-800/70 hover:bg-sand-200"}`}
                          >
                            {method}
                          </button>
                        ))}
                      </div>
                    </div>

                    {error && (
                      <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">{error}</div>
                    )}

                    <div className="flex gap-3">
                      <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-2xl border border-sand-200 text-ink-800 text-sm font-semibold hover:bg-sand-100 transition-colors">
                        ← Back
                      </button>
                      <button onClick={finalize} disabled={submitting}
                        className="flex-1 py-3 rounded-2xl bg-leaf-700 text-sand-50 font-semibold text-sm hover:bg-leaf-600 transition-colors shadow-md shadow-leaf-700/20 disabled:opacity-60 disabled:cursor-not-allowed">
                        {submitting ? "Confirming..." : <><CreditCard className="w-4 h-4 inline-block mr-1.5" /> Confirm Booking</>}
                      </button>
                    </div>
                  </motion.div>
                )}

                { }
                {step === 3 && confirmed && (
                  <motion.div key="step3" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4 space-y-5">
                    <div className="w-20 h-20 mx-auto rounded-full bg-linear-to-br from-leaf-500 to-leaf-700 flex items-center justify-center text-sand-50 text-3xl shadow-xl shadow-leaf-700/30 mb-4">✓</div>
                    <h3 className="font-serif text-2xl text-ink-900">Booking Confirmed!</h3>
                    <p className="text-ink-800/70 text-sm max-w-xs mx-auto">
                      Your {tour.title} tour{confirmed.vehicleName ? ` with ${confirmed.vehicleName}` : ""}{confirmed.guideName ? ` and guide ${confirmed.guideName}` : ""} is booked. Keep your reference number safe.
                    </p>
                    <div className="rounded-2xl bg-leaf-700/5 border border-leaf-700/20 p-4 inline-block">
                      <div className="text-xs text-ink-800/60 uppercase tracking-wider font-semibold mb-1">Reference</div>
                      <div className="font-mono text-xl font-bold text-leaf-700">{confirmed.dummyReference}</div>
                    </div>
                    <div className="text-xs text-ink-800/50">{travelDate} · {travelers} traveler{travelers > 1 ? "s" : ""} · {confirmed.vehicleName || "Self-drive"}</div>
                    <button onClick={close} className="px-8 py-3 rounded-2xl bg-ink-900 text-sand-50 font-semibold text-sm hover:bg-leaf-700 transition-colors">
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
