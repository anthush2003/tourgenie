import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Clock, Star, MapPin, ChevronRight,
  Navigation, ChevronLeft, Share2, Bookmark,
  BookmarkCheck, CheckCircle, Award,
  Users, Calendar, ArrowRight, Info, Camera, X
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup as MapPopup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useAppDispatch, useAppSelector } from "../store";
import { api, resolveMediaUrl } from "../services/api";
import { addTourBooking } from "../store/slices/dataSlice";
import { updateUser } from "../store/slices/authSlice";
import TourBookingModal from "../components/TourBookingModal";
import ReviewSection from "../components/ReviewSection";
import AuthModal from "../components/AuthModel";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function createStopIcon(idx: number) {
  return L.divIcon({
    className: "",
    html: `<div style="width:32px;height:32px;border-radius:50%;background:#fbf8f3;color:#14201d;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;border:2.5px solid #d9bfa0;box-shadow:0 4px 12px rgba(0,0,0,0.25);font-family:Inter,sans-serif;">${idx + 1}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

function createStartIcon() {
  return L.divIcon({
    className: "",
    html: `<div style="display:flex;flex-direction:column;align-items:center;"><div style="width:34px;height:34px;border-radius:50%;background:#14201d;display:flex;align-items:center;justify-content:center;font-size:16px;border:3px solid #e8a87c;box-shadow:0 4px 14px rgba(0,0,0,0.35);">🚩</div></div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
  });
}



export default function TourDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const tours = useAppSelector((s) => s.data.tours);
  const auth = useAppSelector((s) => s.auth);
  const tour = tours.find((t) => t.id === id);


  const saved = auth.user?.savedTours?.some((t: any) => (t.id || t._id) === tour?.id) || false;
  
  const handleToggleSave = async () => {
    if (!auth.isAuthenticated) {
      window.dispatchEvent(new CustomEvent("open-auth-modal", { detail: { mode: "login" } }));
      return;
    }
    if (!tour) return;
    try {
      const res = await api.toggleSavedPlace('tour', tour.id);
      dispatch(updateUser({ savedTours: res.user.savedTours as any[] }));
    } catch (err) {
      window.alert("Failed to save tour.");
    }
  };
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"info" | "itinerary" | "gallery" | "reviews">("info");
  const [copied, setCopied] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!tour) {
    return (
      <div className="min-h-screen bg-sand-50 pt-32 pb-24 flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-serif italic text-ink-800/70 mb-4">Tour not found.</p>
          <Link to="/tours" className="text-leaf-700 font-semibold underline">← Back to all tours</Link>
        </div>
      </div>
    );
  }

  const stopImages = (tour.stops || []).map((s) => s.imageUrl).filter(Boolean);
  const allPhotos = [tour.coverImage, ...stopImages].filter((v, i, a) => a.indexOf(v) === i);

  const mapCenter: [number, number] = tour.stops && tour.stops.length > 0 ? [
    tour.stops.reduce((s, t) => s + t.lat, 0) / tour.stops.length,
    tour.stops.reduce((s, t) => s + t.lng, 0) / tour.stops.length,
  ] : [7.8731, 80.7718];

  const routePoints: [number, number][] = [
    ...(tour.startLat != null && tour.startLng != null ? [[tour.startLat, tour.startLng] as [number, number]] : []),
    ...(tour.stops || []).map((s) => [s.lat, s.lng] as [number, number]),
  ];

  return (
    <div className="min-h-screen bg-sand-50 pt-[88px]">
      <div className="max-w-7xl mx-auto px-5 md:px-8 py-3 mb-2">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-ink-900/60 text-xs font-medium">
          <button onClick={() => navigate(-1)} className="hover:text-ink-900 transition-colors flex items-center gap-1">
            <ChevronLeft className="w-3.5 h-3.5" /> Tours
          </button>
          <ChevronRight className="w-3 h-3" />
          <span className="text-ink-900 truncate">{tour.title}</span>
        </motion.div>
      </div>

      { }
      <div className="relative h-[55vh] min-h-[400px] overflow-hidden">
        <img src={resolveMediaUrl(tour.coverImage)} alt={tour.title} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-linear-to-b from-ink-900/55 via-ink-900/20 to-ink-900/95" />

        <div className="relative h-full max-w-7xl mx-auto px-5 md:px-8 flex flex-col justify-end pb-12 pt-12">
          { }

          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {(tour.tags || []).map((tag) => (
                <span key={tag} className="text-[10px] tracking-wider uppercase px-3 py-1.5 rounded-full bg-sand-50/15 text-sand-50 backdrop-blur border border-sand-50/20 font-semibold">{tag}</span>
              ))}
            </div>

            <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-sand-50/75 text-sm mb-4">
              <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" />{tour.location}</span>
              <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{tour.duration}</span>
              <span className="flex items-center gap-1.5"><Star className="w-4 h-4 fill-sunset-400 text-sunset-400" />{tour.rating.toFixed(1)}</span>
              <span className="flex items-center gap-1.5"><Navigation className="w-4 h-4" />{tour.stops.length} stops</span>
            </div>

            <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl text-sand-50 leading-tight max-w-4xl mb-4">
              {tour.title}
            </h1>
            <p className="text-base md:text-lg text-sand-50/75 max-w-3xl leading-relaxed">{tour.description}</p>

            { }
            <div className="mt-8 flex flex-wrap items-center gap-3">
              {tour.price ? (
                <button
                  onClick={() => auth.isAuthenticated ? setBookingOpen(true) : setAuthOpen(true)}
                  className="flex items-center gap-2 px-6 py-3.5 rounded-full bg-leaf-600 text-sand-50 font-semibold hover:bg-leaf-500 transition-colors shadow-2xl shadow-leaf-900/30 text-sm"
                >
                  <Users className="w-4 h-4" /> Book This Tour + Vehicle
                </button>
              ) : null}
              <Link to={`/hotels`} className="flex items-center gap-2 px-6 py-3.5 rounded-full border border-sand-50/30 text-sand-50 font-semibold hover:bg-sand-50/10 transition-colors text-sm">
                Find Nearby Hotels <ChevronRight className="w-4 h-4" />
              </Link>
              <div className="flex items-center gap-2 ml-auto">
                <button onClick={handleToggleSave} className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${saved ? "bg-sand-50 text-leaf-700 border-sand-50" : "border-sand-50/30 text-sand-50 hover:bg-sand-50/10"}`}>
                  {saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                </button>
                <button onClick={handleShare} className="flex items-center gap-1.5 px-4 py-2.5 rounded-full border border-sand-50/30 text-sand-50 hover:bg-sand-50/10 transition-all text-sm font-medium">
                  <Share2 className="w-4 h-4" />
                  {copied ? "Copied!" : "Share"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      { }
      <div className="bg-ink-900 text-sand-50">
        <div className="max-w-7xl mx-auto px-5 md:px-8 py-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Navigation, label: "Stops", value: `${tour.stops.length} curated` },
            { icon: Clock, label: "Duration", value: tour.duration },
            { icon: Star, label: "Rating", value: `${tour.rating.toFixed(1)} / 5.0` },
            { icon: Users, label: "Guide", value: "Optional add-on" },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-sand-50/10 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-sunset-400" />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-sand-50/50">{label}</div>
                <div className="text-sm font-semibold">{value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      { }
      <div className="max-w-7xl mx-auto px-5 md:px-8 py-12 grid lg:grid-cols-[1fr_380px] gap-10">
        { }
        <div>
          { }
          <div className="flex items-center gap-1.5 p-1 bg-sand-200/50 rounded-2xl mb-8 overflow-x-auto scrollbar-none">
            {(["info", "itinerary", "gallery", "reviews"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`shrink-0 px-5 py-2.5 rounded-xl text-sm font-semibold capitalize transition-all ${activeTab === tab ? "bg-ink-900 text-sand-50 shadow-sm" : "text-ink-800/60 hover:text-ink-800"}`}
              >
                {tab === "itinerary" ? "Itinerary" : tab === "info" ? "Tour Info" : tab === "reviews" ? "Reviews" : "Gallery"}
              </button>
            ))}
          </div>

          { }
          {activeTab === "itinerary" && (
            <div>
              { }
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="relative isolate rounded-[28px] overflow-hidden shadow-xl mb-10" style={{ height: 420 }}>
                <MapContainer
                  center={mapCenter}
                  zoom={11}
                  style={{ height: "100%", width: "100%" }}
                  zoomControl={true}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                  />

                  { }
                  <Polyline
                    positions={routePoints}
                    color="#e8a87c"
                    weight={3}
                    dashArray="8, 6"
                    opacity={0.9}
                  />

                  { }
                  {tour.startLat != null && tour.startLng != null && (
                    <Marker position={[tour.startLat || 0, tour.startLng || 0]} icon={createStartIcon()}>
                      <MapPopup>
                        <div className="font-sans p-1">
                          <div className="text-xs uppercase tracking-wider text-gray-400 mb-0.5">Start / Meeting Point</div>
                          <strong className="text-sm">{tour.startName || "Tour Starting Point"}</strong>
                        </div>
                      </MapPopup>
                    </Marker>
                  )}

                  { }
                  {(tour.stops || []).map((stop, idx) => {
                    return (
                      <Marker
                        key={stop.id}
                        position={[stop.lat || 0, stop.lng || 0]}
                        icon={createStopIcon(idx)}
                      >
                        <MapPopup>
                          <div className="font-sans p-1">
                            <div className="text-xs uppercase tracking-wider text-gray-400 mb-0.5">Stop {idx + 1}</div>
                            <strong className="text-sm">{stop.stopName}</strong>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{stop.description}</p>
                          </div>
                        </MapPopup>
                      </Marker>
                    );
                  })}
                </MapContainer>
              </motion.div>

              { }
              <h2 className="font-serif text-3xl text-ink-900 mb-6">The Itinerary</h2>
              <div className="relative">
                <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-sand-200" />
                <div className="space-y-4">
                  {(tour.stops || []).map((stop, idx) => {
                    return (
                      <motion.div
                        key={stop.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.07 }}
                        className={`relative pl-14 pr-5 py-5 rounded-2xl transition-all bg-sand-100 border border-sand-200 hover:border-ink-900/25 hover:shadow-md`}
                      >
                        { }
                        <div className={`absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs z-10 ring-4 ring-sand-50 bg-sand-200 text-ink-900 border border-sand-300`}>
                          {idx + 1}
                        </div>

                        <div className="flex flex-col md:flex-row md:items-start gap-4">
                          {stop.imageUrl && (
                            <div className="w-full md:w-28 h-20 rounded-xl overflow-hidden shrink-0">
                              <img src={resolveMediaUrl(stop.imageUrl)} alt={stop.stopName} className="w-full h-full object-cover" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 text-xs text-ink-800/45 mb-1 flex-wrap">
                              <MapPin className="w-3 h-3" />
                              <span className="font-mono">{stop.lat.toFixed(3)}, {stop.lng.toFixed(3)}</span>
                            </div>
                            <h3 className="font-serif text-xl text-ink-900 mb-1">{stop.stopName}</h3>
                            <p className="text-sm text-ink-800/65 leading-relaxed line-clamp-3">{stop.description}</p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          { }
          {activeTab === "info" && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              {(!tour.included || tour.included.length === 0) && (!tour.goodToKnow || Object.values(tour.goodToKnow).every(v => !v)) ? (
                <div className="p-12 rounded-3xl border-2 border-dashed border-sand-200 text-center">
                  <Info className="w-8 h-8 text-sand-300 mx-auto mb-3" />
                  <p className="text-ink-800/60 font-medium">No info found for this tour.</p>
                </div>
              ) : (
                <>
                  {tour.included && tour.included.length > 0 && (
                    <div className="p-6 rounded-3xl bg-sand-100 border border-sand-200">
                      <h2 className="font-serif text-2xl text-ink-900 mb-5 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-leaf-700" /> What's Included
                      </h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {tour.included.map((item: string) => (
                          <div key={item} className="flex items-center gap-3 text-sm text-ink-800/80">
                            <div className="w-5 h-5 rounded-full bg-leaf-700/15 flex items-center justify-center shrink-0">
                              <CheckCircle className="w-3 h-3 text-leaf-700" />
                            </div>
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {tour.goodToKnow && Object.values(tour.goodToKnow).some(v => !!v) && (
                    <div className="p-6 rounded-3xl bg-sand-100 border border-sand-200">
                      <h2 className="font-serif text-2xl text-ink-900 mb-5 flex items-center gap-2">
                        <Info className="w-5 h-5 text-sunset-500" /> Good to Know
                      </h2>
                      <div className="space-y-3">
                        {[
                          { label: "Difficulty", value: tour.goodToKnow.difficulty },
                          { label: "Start time", value: tour.goodToKnow.startTime },
                          { label: "Group size", value: tour.goodToKnow.groupSize },
                          { label: "Cancellation", value: tour.goodToKnow.cancellation },
                          { label: "Languages", value: tour.goodToKnow.languages },
                        ].filter(item => !!item.value).map(({ label, value }) => (
                          <div key={label} className="flex items-start gap-3 py-2.5 border-b border-sand-200/60 last:border-0">
                            <span className="text-xs uppercase tracking-wider text-ink-800/45 font-semibold w-28 shrink-0 pt-0.5">{label}</span>
                            <span className="text-sm text-ink-900">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Tour highlights */}
              <div className="p-6 rounded-3xl bg-linear-to-br from-ink-900 to-ink-800 text-sand-50 relative overflow-hidden">
                <div className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-sunset-400/10 blur-3xl" />
                <h2 className="font-serif text-2xl mb-5 flex items-center gap-2">
                  <Award className="w-5 h-5 text-sunset-400" /> Tour Highlights
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative">
                  {(tour.stops || []).map((stop) => (
                    <div key={stop.id} className="flex items-center gap-2 text-sm text-sand-50/80">
                      <div className="w-1.5 h-1.5 rounded-full bg-sunset-400 shrink-0" />
                      {stop.stopName}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── GALLERY TAB ── */}
          {/* REVIEWS */}
          {activeTab === "reviews" && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <ReviewSection targetType="Tour" targetId={tour.id} />
            </motion.div>
          )}

          {activeTab === "gallery" && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center gap-2 mb-5">
                <Camera className="w-4 h-4 text-leaf-700" />
                <h2 className="font-serif text-2xl text-ink-900">Tour Gallery</h2>
                <span className="text-sm text-ink-800/45">({allPhotos.length} photos)</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {(allPhotos || []).map((photo, i) => (
                  <motion.button
                    key={photo + i}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.06 }}
                    onClick={() => setSelectedPhoto(photo)}
                    className={`${i === 0 ? "col-span-2 md:col-span-2 row-span-2" : ""} relative rounded-2xl overflow-hidden aspect-square group`}
                  >
                    <img src={resolveMediaUrl(photo)} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-ink-900/0 group-hover:bg-ink-900/20 transition-colors flex items-center justify-center">
                      <Camera className="w-6 h-6 text-sand-50 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* Lightbox */}
              <AnimatePresence>
                {selectedPhoto && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setSelectedPhoto(null)}
                    className="fixed inset-0 z-90 bg-ink-900/95 flex items-center justify-center p-4"
                  >
                    <button onClick={() => setSelectedPhoto(null)} className="absolute top-5 right-5 w-10 h-10 rounded-full bg-sand-50/10 text-sand-50 flex items-center justify-center hover:bg-sand-50/20 transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                    <motion.img
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0.9 }}
                      src={selectedPhoto}
                      alt=""
                      className="max-w-full max-h-full rounded-2xl object-contain shadow-2xl"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </div>

        {/* ── Right sidebar ───────────────────────── */}
        <aside className="space-y-5">

          {/* Tour details quick-ref */}
          <div className="p-5 rounded-3xl bg-sand-100 border border-sand-200 space-y-3">
            <h4 className="font-serif text-lg text-ink-900">Tour Details</h4>
            {[
              { label: "Duration", value: tour.duration, icon: Clock },
              { label: "Stops", value: `${tour.stops.length} curated`, icon: Navigation },
              { label: "Rating", value: `${tour.rating.toFixed(1)} / 5.0`, icon: Star },
              { label: "Location", value: tour.location, icon: MapPin },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex items-center gap-3 py-2 border-b border-sand-200/60 last:border-0">
                <Icon className="w-4 h-4 text-leaf-700 shrink-0" />
                <div className="flex-1">
                  <span className="text-xs text-ink-800/45 uppercase tracking-wider">{label}</span>
                  <p className="text-sm text-ink-900 font-medium leading-tight">{value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Add-to-itinerary */}
          <div className="p-5 rounded-3xl bg-sand-100 border border-sand-200">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-leaf-700" />
              <h4 className="font-serif text-lg text-ink-900">Plan Your Visit</h4>
            </div>
            <p className="text-sm text-ink-800/65 mb-4 leading-relaxed">Pair this tour with a stay nearby. Hand-picked hotels along the route.</p>
            <Link
              to="/hotels"
              className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-ink-900 text-sand-50 text-sm font-semibold hover:bg-leaf-700 transition-colors"
            >
              Browse Hotels <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Similar tours */}
          <div>
            <h4 className="font-serif text-xl text-ink-900 mb-4">You Might Also Like</h4>
            <div className="space-y-3">
              {(tours || []).filter((t) => t.id !== tour.id).slice(0, 3).map((t) => (
                <Link to={`/tours/${t.id}`} key={t.id} className="flex gap-3 p-3.5 rounded-2xl bg-sand-100 hover:bg-sand-200/60 transition-colors group">
                  <img src={resolveMediaUrl(t.coverImage)} alt={t.title} className="w-20 h-16 rounded-xl object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h5 className="font-serif text-base text-ink-900 leading-tight line-clamp-2 group-hover:text-leaf-700 transition-colors">{t.title}</h5>
                    <div className="flex items-center gap-1 text-xs text-ink-800/50 mt-1">
                      <Star className="w-3 h-3 fill-sunset-400 text-sunset-400" />
                      {t.rating.toFixed(1)} · {t.duration}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-ink-800/30 group-hover:text-leaf-700 transition-colors mt-1 shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </div>



      {/* Tour + vehicle booking flow */}
      <TourBookingModal
        open={bookingOpen}
        tour={tour}
        onClose={() => setBookingOpen(false)}
        onConfirm={(booking) => dispatch(addTourBooking(booking))}
        onRequireAuth={() => { setBookingOpen(false); setAuthOpen(true); }}
      />
      <AuthModal open={authOpen} initialMode="login" onClose={() => setAuthOpen(false)} />
    </div>
  );
}
