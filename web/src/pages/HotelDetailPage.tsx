import { useParams, useNavigate, Link } from "react-router-dom";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star, MapPin, Wifi, Coffee, Car, Utensils, Sparkles,
  Calendar, ChevronLeft, Navigation, X, ChevronRight,
  Phone, Mail, Heart, Share2, Camera,
  CheckCircle, Award, Info, Bed, Building,
  ArrowRight, Clock
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup as MapPopup, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useAppDispatch, useAppSelector } from "../store";
import { api, resolveMediaUrl } from "../services/api";
import { addBooking } from "../store/slices/dataSlice";
import { updateUser } from "../store/slices/authSlice";
import BookingModal from "../components/BookingModel";
import ReviewSection from "../components/ReviewSection";
import { QRCodeSVG } from "qrcode.react";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function createHotelPin() {
  return L.divIcon({
    className: "",
    html: `<div style="width:40px;height:40px;border-radius:50% 50% 50% 0;background:#2b4d36;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;box-shadow:0 6px 20px rgba(0,0,0,0.3);"><span style="transform:rotate(45deg);font-size:16px;">🏨</span></div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
  });
}

const amenityIcons: Record<string, any> = {
  wifi: Wifi, pool: Sparkles, spa: Sparkles, restaurant: Utensils,
  parking: Car, breakfast: Coffee, beach: Sparkles, bar: Coffee,
};
const amenityLabels: Record<string, string> = {
  wifi: "Free Wi-Fi", pool: "Swimming Pool", spa: "Spa & Wellness",
  restaurant: "Restaurant", parking: "Free Parking", breakfast: "Breakfast Included",
  beach: "Private Beach", bar: "Bar / Lounge",
};

const roomTypes = [
  {
    type: "standard" as const,
    label: "Standard Room",
    description: "Tastefully appointed with garden or pool views, king bed, and modern amenities.",
    multiplier: 1,
    icon: Bed,
    features: ["King bed", "Garden view", "32\" Smart TV", "En-suite bathroom"],
  },
  {
    type: "deluxe" as const,
    label: "Deluxe Room",
    description: "Elevated comfort with sea or mountain views, premium bedding, and a private balcony.",
    multiplier: 1.4,
    icon: Building,
    features: ["King bed + sofa", "Private balcony", "Panoramic view", "Premium minibar"],
  },
  {
    type: "suite" as const,
    label: "Luxury Suite",
    description: "Expansive living space with plunge pool, butler service, and curated welcome amenities.",
    multiplier: 2.1,
    icon: Award,
    features: ["2 bedrooms", "Private plunge pool", "Butler service", "Complimentary transfers"],
  },
];

const amenityCategories: Record<string, string[]> = {
  "Connectivity": ["wifi"],
  "Dining & Drinks": ["restaurant", "breakfast", "bar"],
  "Recreation": ["pool", "spa", "beach"],
  "Facilities": ["parking"],
};

function getRatingLabel(r: number) {
  if (r >= 4.8) return "Exceptional";
  if (r >= 4.5) return "Excellent";
  if (r >= 4.0) return "Very Good";
  return "Good";
}

function getPriceTier(price: number) {
  if (price >= 80000) return { label: "Luxury", color: "text-sunset-600" };
  if (price >= 50000) return { label: "Premium", color: "text-leaf-700" };
  if (price >= 25000) return { label: "Comfort", color: "text-ocean-500" };
  return { label: "Budget", color: "text-ink-800/60" };
}

export default function HotelDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const hotels = useAppSelector((s) => s.data.hotels);
  const tours = useAppSelector((s) => s.data.tours);
  const auth = useAppSelector((s) => s.auth);
  const hotel = hotels.find((h) => h.id === id);

  const [bookingOpen, setBookingOpen] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<any>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [selectedPhotoIdx, setSelectedPhotoIdx] = useState(0);
  const [selectedRoom, setSelectedRoom] = useState<"standard" | "deluxe" | "suite">("standard");
  const [activeTab, setActiveTab] = useState<"overview" | "rooms" | "amenities" | "reviews" | "location">("overview");
  const wishlist = auth.user?.savedHotels?.some((h: any) => (h.id || h._id) === hotel?.id) || false;
  
  const handleToggleWishlist = async () => {
    if (!auth.isAuthenticated) {
      window.dispatchEvent(new CustomEvent("open-auth-modal", { detail: { mode: "login" } }));
      return;
    }
    if (!hotel) return;
    try {
      const res = await api.toggleSavedPlace('hotel', hotel.id);
      dispatch(updateUser({ savedHotels: res.user.savedHotels as any[] }));
    } catch (err) {
      window.alert("Failed to save hotel.");
    }
  };
  const [copied, setCopied] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const [checkIn, setCheckIn] = useState(today);
  const [checkOut, setCheckOut] = useState(new Date(Date.now() + 2 * 864e5).toISOString().split("T")[0]);
  const [guests, setGuests] = useState(2);

  const availableTiers = useMemo(() => {
    if (hotel?.roomTiers && hotel.roomTiers.length > 0) {
      const active = hotel.roomTiers.filter(t => t.enabled);
      if (active.length > 0) return active;
    }
    // Fallback to old multiplier logic
    return [
      { tier: "standard", price: hotel?.pricePerNight || 0, enabled: true },
      { tier: "deluxe", price: Math.round((hotel?.pricePerNight || 0) * 1.4), enabled: true },
      { tier: "suite", price: Math.round((hotel?.pricePerNight || 0) * 2.1), enabled: true }
    ];
  }, [hotel]);

  const nights = Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 864e5));
  const selectedTier = availableTiers.find((t) => t.tier === selectedRoom) || availableTiers[0];
  const totalPrice = selectedTier ? selectedTier.price * nights : 0;
  const nearbyTours = useMemo(() => {
    if (!hotel) return [];
    return tours.filter((t) => {
      return t.stops.some((s) => {
        const d = Math.sqrt((s.lat - hotel.lat) ** 2 + (s.lng - hotel.lng) ** 2);
        return d < 1.5; 
      });
    }).slice(0, 3);
  }, [tours, hotel]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  if (!hotel) {
    return (
      <div className="min-h-screen bg-sand-50 pt-32 flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-serif italic text-ink-800/70 mb-4">Hotel not found.</p>
          <Link to="/hotels" className="text-leaf-700 font-semibold underline">← Back to all hotels</Link>
        </div>
      </div>
    );
  }

  const tier = getPriceTier(hotel.pricePerNight);
  const allPhotos = hotel.photos.length >= 4 ? hotel.photos : [...hotel.photos, hotel.photos[0], hotel.photos[0], hotel.photos[0]].slice(0, 5);
  const reviews = [
    { name: "Alexandra R.", country: "🇩🇪 Germany", rating: 5, date: "Apr 2025", text: "Absolutely breathtaking property. The staff anticipated our every need and the breakfast was extraordinary. Already planning our return." },
    { name: "Rohan K.", country: "🇮🇳 India", rating: 5, date: "Mar 2025", text: "Perfect location for exploring the region. The room upgrade was a lovely surprise and the views from the balcony were worth every rupee." },
    { name: "Sarah M.", country: "🇦🇺 Australia", rating: 4, date: "Feb 2025", text: "Lovely property with exceptional service. The spa treatment was divine. WiFi could be faster but a minor quibble in an otherwise perfect stay." },
    { name: "Kenji T.", country: "🇯🇵 Japan", rating: 5, date: "Jan 2025", text: "Outstanding hotel. The heritage architecture blended beautifully with modern comforts. The guided tour arranged by the concierge was excellent." },
  ];

  return (
    <div className="min-h-screen bg-sand-50">
      {}
      <div className="pt-32 pb-0">
        <div className="max-w-7xl mx-auto px-5 md:px-8 mb-3">
          {}
          <div className="flex items-center gap-2 text-sm text-ink-800/50 mb-4">
            <button onClick={() => navigate(-1)} className="hover:text-ink-900 flex items-center gap-1 transition-colors">
              <ChevronLeft className="w-4 h-4" /> Hotels
            </button>
            <ChevronRight className="w-3 h-3" />
            <span className="text-ink-900 font-medium truncate">{hotel.name}</span>
          </div>
        </div>

        {}
        <div className="max-w-7xl mx-auto px-5 md:px-8 pb-8">
          <div className="grid grid-cols-4 gap-2 md:gap-3 rounded-4xl overflow-hidden h-80 md:h-120">
            {}
            <button
              onClick={() => { setSelectedPhoto(allPhotos[0]); setSelectedPhotoIdx(0); }}
              className="col-span-4 md:col-span-3 row-span-2 relative overflow-hidden group"
            >
              <img src={resolveMediaUrl(allPhotos[0])} alt={hotel.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1500" />
              <div className="absolute inset-0 bg-ink-900/0 group-hover:bg-ink-900/10 transition-colors" />
              <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-ink-900/60 backdrop-blur px-3 py-1.5 rounded-full">
                <Camera className="w-3.5 h-3.5 text-sand-50" />
                <span className="text-xs text-sand-50 font-medium">{allPhotos.length} photos</span>
              </div>
            </button>
            {}
            {allPhotos.slice(1, 3).map((photo, i) => (
              <button
                key={i}
                onClick={() => { setSelectedPhoto(photo); setSelectedPhotoIdx(i + 1); }}
                className="col-span-2 md:col-span-1 relative overflow-hidden group hidden sm:block"
              >
                <img src={resolveMediaUrl(photo)} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1500" />
                <div className="absolute inset-0 bg-ink-900/0 group-hover:bg-ink-900/15 transition-colors" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {}
      <div className="max-w-7xl mx-auto px-5 md:px-8 mb-8">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 text-ink-800/50 text-sm mb-2">
              <MapPin className="w-4 h-4" />{hotel.location}
            </div>
            <h1 className="font-serif text-4xl md:text-5xl text-ink-900 mb-3">{hotel.name}</h1>
            <div className="flex items-center flex-wrap gap-3">
              <span className="flex items-center gap-1.5 text-sunset-600 font-semibold">
                <Star className="w-5 h-5 fill-sunset-600" />{hotel.rating.toFixed(1)}
                <span className="text-ink-800/50 text-sm font-normal">{getRatingLabel(hotel.rating)}</span>
              </span>
              <span className="text-ink-800/30">·</span>
              <span className="text-sunset-600 font-medium tracking-wide">{"★".repeat(hotel.starRating)}</span>
              <span className="text-ink-800/30">·</span>
              <span className={`text-sm font-semibold ${tier.color}`}>{tier.label}</span>
              <span className="text-ink-800/30">·</span>
              <span className="text-ink-800/50 text-sm">{reviews.length} reviews</span>
            </div>
          </div>

          <div className="flex items-center gap-3 md:flex-col md:items-end">
            <div className="text-right">
              <div className="font-serif text-4xl text-ink-900">LKR {hotel.pricePerNight.toLocaleString()}</div>
              <div className="text-sm text-ink-800/50">per night · from</div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleToggleWishlist} className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${wishlist ? "bg-sunset-400/10 border-sunset-400/30 text-sunset-500" : "border-sand-200 text-ink-800/50 hover:border-sand-300"}`}>
                <Heart className={`w-4 h-4 ${wishlist ? "fill-sunset-500" : ""}`} />
              </button>
              <button onClick={handleShare} className="flex items-center gap-1.5 px-4 py-2.5 rounded-full border border-sand-200 text-ink-800/60 hover:border-sand-300 transition-all text-sm">
                <Share2 className="w-4 h-4" />
                {copied ? "Copied!" : "Share"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {}
      <div className="max-w-7xl mx-auto px-5 md:px-8 pb-20 grid lg:grid-cols-[1fr_380px] gap-10">
        {}
        <div>
          {}
          <div className="flex gap-1 mb-8 p-1 rounded-2xl bg-sand-100 border border-sand-200 overflow-x-auto scrollbar-none">
            {(["overview", "rooms", "amenities", "reviews", "location"] as const).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`shrink-0 px-4 py-2.5 rounded-xl text-sm font-semibold capitalize transition-all whitespace-nowrap ${activeTab === tab ? "bg-ink-900 text-sand-50 shadow-sm" : "text-ink-800/55 hover:text-ink-800"}`}>
                {tab}
              </button>
            ))}
          </div>

          {}
          {activeTab === "overview" && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              <div>
                <h2 className="font-serif text-2xl text-ink-900 mb-4">About This Property</h2>
                <p className="text-ink-800/75 leading-relaxed text-lg">{hotel.description}</p>
              </div>

              {}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { icon: Star, label: "Rating", value: hotel.rating.toFixed(1) + "/5.0" },
                  { icon: Building, label: "Category", value: tier.label },
                  { icon: Sparkles, label: "Amenities", value: `${hotel.amenities.length} included` },
                  { icon: Award, label: "Reviews", value: `${reviews.length} guests` },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="p-4 rounded-2xl bg-sand-100 border border-sand-200 text-center">
                    <Icon className="w-5 h-5 text-leaf-700 mx-auto mb-2" />
                    <div className="font-semibold text-ink-900 text-sm">{value}</div>
                    <div className="text-[10px] uppercase tracking-wider text-ink-800/45 mt-0.5">{label}</div>
                  </div>
                ))}
              </div>

              {}
              <div>
                <h2 className="font-serif text-2xl text-ink-900 mb-4">Amenities Highlights</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                  {hotel.amenities.slice(0, 6).map((a) => {
                    const Icon = amenityIcons[a] || Sparkles;
                    return (
                      <div key={a} className="flex items-center gap-3 p-3.5 rounded-2xl bg-sand-100 border border-sand-200">
                        <div className="w-9 h-9 rounded-full bg-leaf-700/10 text-leaf-700 flex items-center justify-center shrink-0">
                          <Icon className="w-4.5 h-4.5" />
                        </div>
                        <span className="text-sm text-ink-900 font-medium">{amenityLabels[a] || a}</span>
                      </div>
                    );
                  })}
                </div>
                {hotel.amenities.length > 6 && (
                  <button onClick={() => setActiveTab("amenities")} className="text-sm text-leaf-700 font-semibold hover:underline flex items-center gap-1">
                    View all {hotel.amenities.length} amenities <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>

              {}
              {nearbyTours.length > 0 && (
                <div>
                  <h2 className="font-serif text-2xl text-ink-900 mb-4 flex items-center gap-2">
                    <Navigation className="w-5 h-5 text-leaf-700" /> Tours Nearby
                  </h2>
                  <div className="space-y-3">
                    {nearbyTours.map((t) => (
                      <Link to={`/tours/${t.id}`} key={t.id} className="flex gap-4 p-4 rounded-2xl bg-sand-100 hover:bg-sand-200/60 transition-colors group border border-sand-200">
                        <img src={resolveMediaUrl(t.coverImage)} alt={t.title} className="w-20 h-16 rounded-xl object-cover shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h5 className="font-serif text-base text-ink-900 leading-tight group-hover:text-leaf-700 transition-colors line-clamp-1">{t.title}</h5>
                          <div className="flex items-center gap-2 text-xs text-ink-800/50 mt-1">
                            <Clock className="w-3 h-3" />{t.duration}
                            <span>·</span>
                            <Star className="w-3 h-3 fill-sunset-400 text-sunset-400" />{t.rating.toFixed(1)}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-ink-800/30 group-hover:text-leaf-700 transition-colors mt-1 shrink-0" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {}
          {activeTab === "rooms" && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <h2 className="font-serif text-2xl text-ink-900">Choose Your Room</h2>
              {availableTiers.map((tierData) => {
                const room = roomTypes.find(r => r.type === tierData.tier) || roomTypes[0];
                const price = tierData.price;
                const isSelected = selectedRoom === tierData.tier;
                const Icon = room.icon;
                return (
                  <div
                    key={tierData.tier}
                    onClick={() => setSelectedRoom(tierData.tier as any)}
                    className={`p-5 rounded-3xl border-2 cursor-pointer transition-all ${isSelected ? "border-leaf-700 bg-leaf-700/5 shadow-lg shadow-leaf-700/10" : "border-sand-200 bg-sand-100 hover:border-sand-300"}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${isSelected ? "bg-leaf-700 text-sand-50" : "bg-sand-200 text-ink-800"}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-serif text-xl text-ink-900">{room.label}</h3>
                            {isSelected && <CheckCircle className="w-4 h-4 text-leaf-700" />}
                          </div>
                          <p className="text-sm text-ink-800/65 mb-3 leading-relaxed">{room.description}</p>
                          <div className="flex flex-wrap gap-2">
                            {room.features.map((f) => (
                              <span key={f} className="text-[11px] px-2.5 py-1 rounded-full bg-sand-200/80 text-ink-800/70 font-medium">{f}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-serif text-2xl text-ink-900">LKR {price.toLocaleString()}</div>
                        <div className="text-xs text-ink-800/45">per night</div>
                        {room.multiplier > 1 && (
                          <div className="text-[10px] text-leaf-700 font-medium mt-0.5 uppercase tracking-wide">{room.type === "suite" ? "Best value" : ""}</div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="p-5 rounded-3xl bg-ink-900/5 border border-sand-200 text-sm text-ink-800/60 leading-relaxed">
                <Info className="inline w-4 h-4 mr-1.5 text-leaf-700" />
                All room types include complimentary breakfast, free Wi-Fi, and access to hotel facilities. Rates are per room per night and may vary by season.
              </div>
            </motion.div>
          )}

          {}
          {activeTab === "amenities" && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-7">
              <h2 className="font-serif text-2xl text-ink-900">All Amenities</h2>
              {Object.entries(amenityCategories).map(([category, amenityKeys]) => {
                const available = amenityKeys.filter((a) => hotel.amenities.includes(a));
                if (available.length === 0) return null;
                return (
                  <div key={category}>
                    <h3 className="text-xs uppercase tracking-wider text-ink-800/50 font-semibold mb-3">{category}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {available.map((a) => {
                        const Icon = amenityIcons[a] || Sparkles;
                        return (
                          <div key={a} className="flex items-center gap-4 p-4 rounded-2xl bg-sand-100 border border-sand-200">
                            <div className="w-10 h-10 rounded-2xl bg-leaf-700/10 text-leaf-700 flex items-center justify-center shrink-0">
                              <Icon className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-ink-900">{amenityLabels[a] || a}</div>
                              <div className="text-xs text-ink-800/45 mt-0.5">Included with your stay</div>
                            </div>
                            <CheckCircle className="w-4 h-4 text-leaf-700 ml-auto shrink-0" />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              {}
              <div>
                <h3 className="text-xs uppercase tracking-wider text-ink-800/45 font-semibold mb-3">Not Available</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.values(amenityLabels).filter((_, i) => !hotel.amenities.includes(Object.keys(amenityLabels)[i])).map((label) => (
                    <span key={label} className="text-xs px-3 py-1.5 rounded-full bg-sand-100 border border-sand-200 text-ink-800/35 line-through">{label}</span>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {}
          {activeTab === "reviews" && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <ReviewSection targetType="Hotel" targetId={hotel.id} />
            </motion.div>
          )}

          {}
          {activeTab === "location" && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div>
                <h2 className="font-serif text-2xl text-ink-900 mb-2">Location</h2>
                <p className="text-sm text-ink-800/60 mb-5">{hotel.name}, {hotel.location} · {(hotel.lat ?? 0).toFixed(4)}°N, {(hotel.lng ?? 0).toFixed(4)}°E</p>
              </div>

              {}
              <div className="relative isolate rounded-3xl overflow-hidden shadow-xl" style={{ height: 420 }}>
                <MapContainer center={[hotel.lat ?? 0, hotel.lng ?? 0]} zoom={14} style={{ height: "100%", width: "100%" }}>
                  <TileLayer
                    attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                  />
                  <Marker position={[hotel.lat ?? 0, hotel.lng ?? 0]} icon={createHotelPin()}>
                    <MapPopup>
                      <div className="font-sans min-w-40">
                        <img src={resolveMediaUrl(hotel.photos[0])} alt={hotel.name} className="w-full h-20 object-cover rounded mb-2" />
                        <strong className="text-sm">{hotel.name}</strong>
                        <p className="text-xs text-gray-500">{hotel.location}</p>
                      </div>
                    </MapPopup>
                  </Marker>
                  <Circle center={[hotel.lat ?? 0, hotel.lng ?? 0]} radius={300} color="#2b4d36" fillColor="#2b4d36" fillOpacity={0.08} weight={1.5} />
                </MapContainer>
              </div>

              {}
              <div className="p-5 rounded-3xl bg-sand-100 border border-sand-200">
                <h3 className="font-serif text-lg text-ink-900 mb-4">Getting There</h3>
                <div className="space-y-3 text-sm">
                  {[
                    { label: "From Colombo", value: "~3.5 hours by expressway" },
                    { label: "Nearest airport", value: "Bandaranaike Int'l (CMB)" },
                    { label: "Nearest train", value: "Regional station · 20 min" },
                    { label: "Taxi / tuk-tuk", value: "Available on request" },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center gap-3 py-2 border-b border-sand-200/50 last:border-0">
                      <span className="text-xs uppercase tracking-wider text-ink-800/40 font-semibold w-36 shrink-0">{label}</span>
                      <span className="text-ink-900">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {}
              <div className="p-5 rounded-3xl bg-ink-900 text-sand-50">
                <h3 className="font-serif text-lg mb-4">Contact The Property</h3>
                <div className="space-y-3">
                  {hotel.contactInfo?.phone && (
                    <a href={`tel:${hotel.contactInfo.phone}`} className="flex items-center gap-3 text-sm text-sand-50/80 hover:text-sand-50 transition-colors">
                      <Phone className="w-4 h-4 text-sunset-400" />{hotel.contactInfo.phone}
                    </a>
                  )}
                  {hotel.contactInfo?.email && (
                    <a href={`mailto:${hotel.contactInfo.email}`} className="flex items-center gap-3 text-sm text-sand-50/80 hover:text-sand-50 transition-colors">
                      <Mail className="w-4 h-4 text-sunset-400" />{hotel.contactInfo.email}
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {}
        <motion.aside initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="lg:sticky lg:top-28 space-y-5 h-fit">
          {}
          <div className="p-6 rounded-[28px] bg-sand-100 border border-sand-200">
            <div className="flex items-center gap-2 mb-5">
              <Calendar className="w-5 h-5 text-leaf-700" />
              <h3 className="font-serif text-xl text-ink-900">Book Your Stay</h3>
            </div>

            {}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="p-3 rounded-xl bg-sand-50 border border-sand-200">
                <div className="text-[10px] uppercase tracking-wider text-ink-800/45 mb-1">Check-in</div>
                <input type="date" value={checkIn} min={today} onChange={(e) => {
                  setCheckIn(e.target.value);
                  if (e.target.value >= checkOut) {
                    setCheckOut(new Date(new Date(e.target.value).getTime() + 864e5).toISOString().split("T")[0]);
                  }
                }} className="w-full bg-transparent text-ink-900 text-sm font-semibold focus:outline-none cursor-pointer" />
              </div>
              <div className="p-3 rounded-xl bg-sand-50 border border-sand-200">
                <div className="text-[10px] uppercase tracking-wider text-ink-800/45 mb-1">Check-out</div>
                <input type="date" value={checkOut} min={new Date(new Date(checkIn).getTime() + 864e5).toISOString().split("T")[0]} onChange={(e) => setCheckOut(e.target.value)} className="w-full bg-transparent text-ink-900 text-sm font-semibold focus:outline-none cursor-pointer" />
              </div>
            </div>

            {}
            <div className="p-3 rounded-xl bg-sand-50 border border-sand-200 mb-3">
              <div className="flex items-center justify-between mb-2.5">
                <div className="text-[10px] uppercase tracking-wider text-ink-800/45">Guests</div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setGuests(Math.max(1, guests - 1))} className="w-6 h-6 rounded-full bg-sand-200 text-ink-900 text-xs font-bold flex items-center justify-center hover:bg-sand-300">−</button>
                  <span className="text-sm font-semibold w-4 text-center text-ink-900">{guests}</span>
                  <button onClick={() => setGuests(Math.min(8, guests + 1))} className="w-6 h-6 rounded-full bg-sand-200 text-ink-900 text-xs font-bold flex items-center justify-center hover:bg-sand-300">+</button>
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-ink-800/45 mb-1.5">Room Type</div>
                <div className="flex gap-1.5">
                  {availableTiers.map((r) => (
                    <button key={r.tier} onClick={() => setSelectedRoom(r.tier as any)}
                      className={`flex-1 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${selectedRoom === r.tier ? "bg-ink-900 text-sand-50" : "bg-sand-200 text-ink-800 hover:bg-sand-300"}`}>
                      {r.tier.charAt(0).toUpperCase() + r.tier.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {}
            <div className="p-4 rounded-xl bg-sand-50 border border-sand-200 mb-4 space-y-2">
              <div className="flex justify-between text-sm text-ink-800/60">
                <span>LKR {(selectedTier?.price || hotel.pricePerNight).toLocaleString()} × {nights} {nights === 1 ? "night" : "nights"}</span>
                <span>LKR {totalPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm text-ink-800/60">
                <span>Taxes & fees</span>
                <span>Included</span>
              </div>
              <div className="flex justify-between font-semibold text-ink-900 pt-2 border-t border-sand-200">
                <span>Total</span>
                <span className="font-serif text-2xl">LKR {totalPrice.toLocaleString()}</span>
              </div>
            </div>

            <p className="text-xs text-ink-800/50 mb-4 leading-relaxed">
              Simulated booking — no real payment required. You'll receive a unique reference code & QR.
            </p>

            {!confirmedBooking ? (
              <button
                onClick={() => auth.isAuthenticated ? setBookingOpen(true) : navigate("/hotels")}
                disabled={!auth.isAuthenticated}
                className="w-full py-4 rounded-full bg-linear-to-r from-leaf-700 to-leaf-600 text-sand-50 font-semibold hover:from-leaf-600 hover:to-leaf-700 transition-all shadow-lg shadow-leaf-700/25 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {auth.isAuthenticated ? "Reserve Now — Simulated" : "Sign in to book"}
              </button>
            ) : (
              <div className="p-4 rounded-2xl bg-leaf-700 text-sand-50 text-center">
                <CheckCircle className="w-5 h-5 mx-auto mb-1" />
                <p className="text-sm font-semibold">Booking Confirmed!</p>
                <p className="text-[10px] uppercase tracking-widest text-sand-50/65 mt-0.5">Ref: {confirmedBooking.dummyReference}</p>
              </div>
            )}
          </div>

          {/* QR Code after confirmed */}
          {confirmedBooking && (
            <div className="p-6 rounded-[28px] bg-sand-50 border-2 border-leaf-700/25 text-center">
              <h4 className="font-serif text-lg text-ink-900 mb-3">Confirmation QR</h4>
              <div className="flex justify-center p-4 bg-sand-50 rounded-2xl">
                <QRCodeSVG value={confirmedBooking.dummyReference} size={150} bgColor="#fbf8f3" fgColor="#14201d" includeMargin />
              </div>
              <p className="text-[11px] text-ink-800/50 mt-3 leading-relaxed">
                Show at reception · ref <span className="font-mono font-semibold text-ink-900">{confirmedBooking.dummyReference}</span>
              </p>
            </div>
          )}

          {/* Property contact quick-ref */}
          {(hotel.contactInfo?.phone || hotel.contactInfo?.email) && (
            <div className="p-5 rounded-3xl bg-sand-100 border border-sand-200 space-y-3">
              <h4 className="font-medium text-ink-900 text-sm flex items-center gap-2"><Phone className="w-4 h-4 text-leaf-700" /> Direct Contact</h4>
              {hotel.contactInfo.phone && (
                <a href={`tel:${hotel.contactInfo.phone}`} className="flex items-center gap-2 text-sm text-ink-800/70 hover:text-leaf-700 transition-colors">
                  <Phone className="w-3.5 h-3.5" />{hotel.contactInfo.phone}
                </a>
              )}
              {hotel.contactInfo.email && (
                <a href={`mailto:${hotel.contactInfo.email}`} className="flex items-center gap-2 text-sm text-ink-800/70 hover:text-leaf-700 transition-colors">
                  <Mail className="w-3.5 h-3.5" />{hotel.contactInfo.email}
                </a>
              )}
            </div>
          )}

          {/* Browse tours CTA */}
          <Link to="/tours" className="block p-5 rounded-3xl bg-linear-to-br from-sunset-500 to-sunset-600 text-sand-50 hover:from-sunset-400 hover:to-sunset-500 transition-all">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-sand-50/60 font-medium mb-1">Discover More</div>
                <h4 className="font-serif text-lg leading-tight mb-1">Tours near this hotel</h4>
                <p className="text-xs text-sand-50/70">Hand-picked routes from the doorstep.</p>
              </div>
              <ArrowRight className="w-5 h-5 shrink-0 mt-1" />
            </div>
          </Link>
        </motion.aside>
      </div>

      {/* ── Photo Lightbox ────────────────────────── */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-90 bg-ink-900/97 flex items-center justify-center p-4"
            onClick={() => setSelectedPhoto(null)}
          >
            {/* Navigation */}
            <button
              onClick={(e) => { e.stopPropagation(); const prev = (selectedPhotoIdx - 1 + allPhotos.length) % allPhotos.length; setSelectedPhotoIdx(prev); setSelectedPhoto(allPhotos[prev]); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-sand-50/10 text-sand-50 flex items-center justify-center hover:bg-sand-50/20 transition-colors z-10"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); const next = (selectedPhotoIdx + 1) % allPhotos.length; setSelectedPhotoIdx(next); setSelectedPhoto(allPhotos[next]); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-sand-50/10 text-sand-50 flex items-center justify-center hover:bg-sand-50/20 transition-colors z-10"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-5 right-5 w-10 h-10 rounded-full bg-sand-50/10 text-sand-50 flex items-center justify-center hover:bg-sand-50/20 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <motion.img
              key={selectedPhoto}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              src={resolveMediaUrl(selectedPhoto ?? "")}
              alt=""
              className="max-w-full max-h-full rounded-2xl object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            {/* Counter */}
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-sand-50/10 backdrop-blur text-sand-50 text-sm font-medium">
              {selectedPhotoIdx + 1} / {allPhotos.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <BookingModal
        open={bookingOpen}
        hotel={hotel}
        initialCheckIn={checkIn}
        initialCheckOut={checkOut}
        initialRoomType={selectedRoom}
        initialGuests={guests}
        onClose={() => setBookingOpen(false)}
        onConfirm={(booking) => {
          dispatch(addBooking(booking));
          setConfirmedBooking(booking);
          setBookingOpen(false);
        }}
      />
    </div>
  );
}