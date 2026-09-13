import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Star, MapPin, Wifi, Coffee, Car, Utensils, Sparkles,
  ChevronRight, Filter, Search, ArrowUpDown,
  List, Map as MapIcon, X, Calendar, Users, Waves,
  TrendingUp, Heart
} from "lucide-react";
import { Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup as MapPopup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useAppDispatch, useAppSelector } from "../store";
import { updateUser } from "../store/slices/authSlice";
import { api, resolveMediaUrl } from "../services/api";
import type { Hotel } from "../store/slices/dataSlice";



function createHotelMapIcon(starRating: number, highlighted: boolean) {
  const bg = highlighted ? "#e8a87c" : "#14201d";
  const textColor = highlighted ? "#14201d" : "#fbf8f3";
  return L.divIcon({
    className: "",
    html: `<div style="background:${bg};color:${textColor};padding:4px 10px;border-radius:20px;font-size:11px;font-weight:700;font-family:Inter,sans-serif;white-space:nowrap;box-shadow:0 4px 12px rgba(0,0,0,0.3);border:2px solid ${highlighted ? "#d4956a" : "#2b4d36"};">LKR ${starRating}★</div>`,
    iconSize: [52, 28],
    iconAnchor: [26, 14],
  });
}

const amenityIcons: Record<string, any> = {
  wifi: Wifi,
  pool: Waves,
  spa: Sparkles,
  restaurant: Utensils,
  parking: Car,
  breakfast: Coffee,
  beach: Waves,
  bar: Coffee,
};

const amenityLabels: Record<string, string> = {
  wifi: "Free Wi-Fi",
  pool: "Pool",
  spa: "Spa",
  restaurant: "Restaurant",
  parking: "Parking",
  breakfast: "Breakfast",
  beach: "Beach",
  bar: "Bar",
};

const sortOptions = [
  { label: "Recommended", value: "recommended" },
  { label: "Price: Low to High", value: "price-asc" },
  { label: "Price: High to Low", value: "price-desc" },
  { label: "Highest Rated", value: "rating" },
  { label: "Star Rating", value: "stars" },
  { label: "Name A–Z", value: "name" },
];

const MAX_PRICE = 120000;

function getPriceTier(price: number): { label: string; color: string } {
  if (price >= 80000) return { label: "Luxury", color: "text-sunset-600 bg-sunset-400/10 border-sunset-400/30" };
  if (price >= 50000) return { label: "Premium", color: "text-leaf-700 bg-leaf-700/10 border-leaf-700/30" };
  if (price >= 25000) return { label: "Comfort", color: "text-ocean-500 bg-ocean-500/10 border-ocean-500/30" };
  return { label: "Budget", color: "text-ink-800/60 bg-sand-200 border-sand-200" };
}

function getRatingLabel(rating: number): string {
  if (rating >= 4.8) return "Exceptional";
  if (rating >= 4.5) return "Excellent";
  if (rating >= 4.0) return "Very Good";
  return "Good";
}

interface HotelCardProps {
  hotel: Hotel;
  index: number;
  wishlist: Set<string>;
  onToggleWishlist: (id: string) => Promise<void>;
  onHover: (id: string | null) => void;
  checkIn: string;
  checkOut: string;
  guests: number;
}

function HotelCard({ hotel, index, wishlist, onToggleWishlist, onHover, checkIn, checkOut, guests }: HotelCardProps) {
  const nights = Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 864e5));
  const totalPrice = hotel.pricePerNight * nights;
  const tier = getPriceTier(hotel.pricePerNight);

  return (
    <motion.div
      key={hotel.id}
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      onMouseEnter={() => onHover(hotel.id)}
      onMouseLeave={() => onHover(null)}
      className="group grid md:grid-cols-[260px_1fr] gap-0 rounded-[28px] bg-sand-100 hover:shadow-2xl transition-all duration-500 overflow-hidden"
    >
      {}
      <div className="relative h-52 md:h-auto overflow-hidden">
        <img src={resolveMediaUrl(hotel.photos[0])} alt={hotel.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[1500ms]" />
        <div className="absolute inset-0 bg-linear-to-t from-ink-900/30 to-transparent" />

        {}
        <div className="absolute top-3 left-3 flex items-center gap-1 bg-sand-50/95 backdrop-blur px-2.5 py-1 rounded-full text-xs font-semibold text-ink-900">
          {hotel.starRating}★
        </div>

        {}
        <div className={`absolute top-3 right-3 text-[10px] font-semibold px-2.5 py-1 rounded-full border backdrop-blur-sm ${tier.color}`}>
          {tier.label}
        </div>

        {}
        <button
          onClick={() => onToggleWishlist(hotel.id)}
          className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-sand-50/90 backdrop-blur flex items-center justify-center text-ink-800 hover:bg-sand-50 transition-colors shadow"
        >
          {wishlist.has(hotel.id) ? <Heart className="w-4 h-4 fill-sunset-500 text-sunset-500" /> : <Heart className="w-4 h-4" />}
        </button>
      </div>

      {}
      <div className="flex flex-col p-5 md:p-6">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-xs text-ink-800/50 mb-1.5">
              <MapPin className="w-3 h-3" />
              <span className="uppercase tracking-wide truncate">{hotel.location}</span>
            </div>
            <h3 className="font-serif text-2xl md:text-3xl text-ink-900 leading-tight">{hotel.name}</h3>
          </div>
          <div className="text-right shrink-0">
            <div className="flex items-center gap-1 justify-end text-sunset-600 font-semibold mb-0.5">
              <Star className="w-4 h-4 fill-sunset-600" />
              <span>{hotel.rating.toFixed(1)}</span>
            </div>
            <div className="text-[10px] text-ink-800/45 tracking-wider">{getRatingLabel(hotel.rating)}</div>
          </div>
        </div>

        <p className="text-sm text-ink-800/65 leading-relaxed mb-4 line-clamp-2">{hotel.description}</p>

        {}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {(hotel.amenities || []).slice(0, 5).map((a) => {
            const Icon = amenityIcons[a] || Sparkles;
            return (
              <span key={a} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sand-50 text-ink-800 text-[11px] font-medium capitalize border border-sand-200">
                <Icon className="w-3 h-3 text-leaf-700" />
                {amenityLabels[a] || a}
              </span>
            );
          })}
          {hotel.amenities.length > 5 && (
            <span className="px-2.5 py-1 rounded-full bg-sand-50 text-ink-800/50 text-[11px] border border-sand-200">
              +{hotel.amenities.length - 5} more
            </span>
          )}
        </div>

        {}
        <div className="mt-auto flex items-end justify-between pt-4 border-t border-sand-200/60">
          <div>
            <span className="font-serif text-2xl md:text-3xl text-ink-900">LKR {hotel.pricePerNight.toLocaleString()}</span>
            <span className="text-xs text-ink-800/45 ml-1.5">/ night</span>
            {nights > 1 && (
              <div className="text-xs text-ink-800/45 mt-0.5">
                LKR {totalPrice.toLocaleString()} total · {nights} nights · {guests} {guests === 1 ? "guest" : "guests"}
              </div>
            )}
          </div>
          <Link
            to={`/hotels/${hotel.id}?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-ink-900 text-sand-50 text-sm font-semibold hover:bg-leaf-700 transition-colors"
          >
            View & Book <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

export default function HotelsPage() {
  const hotels = useAppSelector((s) => s.data.hotels);

  const [priceRange, setPriceRange] = useState<[number, number]>([0, MAX_PRICE]);
  const [minStar, setMinStar] = useState(0);
  const [selectedAmenities, setSelectedAmenities] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("recommended");
  const [view, setView] = useState<"list" | "map">("list");
  const auth = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const wishlist = new Set(auth.user?.savedHotels?.map((h: any) => h.id || h._id) || []);
  const [hoveredHotel, setHoveredHotel] = useState<string | null>(null);

  const today = new Date().toISOString().split("T")[0];
  const tomorrow = new Date(Date.now() + 864e5).toISOString().split("T")[0];
  const [checkIn, setCheckIn] = useState(today);
  const [checkOut, setCheckOut] = useState(tomorrow);
  const [guests, setGuests] = useState(2);

  const allAmenities = useMemo(() => {
    const s = new Set<string>();
    hotels.forEach((h) => h.amenities.forEach((a) => s.add(a)));
    return Array.from(s);
  }, [hotels]);

  const allLocations = useMemo(() => {
    const locs = new Set<string>();
    hotels.forEach((h) => locs.add(h.location.split(",")[0].trim()));
    return Array.from(locs);
  }, [hotels]);

  const filtered = useMemo(() => {
    let result = hotels.filter((h) => {
      if (h.pricePerNight < priceRange[0] || h.pricePerNight > priceRange[1]) return false;
      if (h.starRating < minStar) return false;
      if (search && !h.name.toLowerCase().includes(search.toLowerCase()) && !h.location.toLowerCase().includes(search.toLowerCase())) return false;
      for (const a of selectedAmenities) { if (!h.amenities.includes(a)) return false; }
      
      // Dynamic Guest Capacity Filter
      if (guests > 0) {
        if (h.roomsPerType && Object.values(h.roomsPerType).some(v => v > 0)) {
          const standardCap = (h.roomsPerType.standard || 0) * 2;
          const deluxeCap = (h.roomsPerType.deluxe || 0) * 3;
          const suiteCap = (h.roomsPerType.suite || 0) * 5;
          const totalCapacity = standardCap + deluxeCap + suiteCap;
          
          if (guests > totalCapacity) return false;
        }
      }
      
      return true;
    });

    switch (sort) {
      case "price-asc": result = [...result].sort((a, b) => a.pricePerNight - b.pricePerNight); break;
      case "price-desc": result = [...result].sort((a, b) => b.pricePerNight - a.pricePerNight); break;
      case "rating": result = [...result].sort((a, b) => b.rating - a.rating); break;
      case "stars": result = [...result].sort((a, b) => b.starRating - a.starRating); break;
      case "name": result = [...result].sort((a, b) => a.name.localeCompare(b.name)); break;
    }

    return result;
  }, [hotels, priceRange, minStar, search, selectedAmenities, sort, guests]);

  const toggleAmenity = (a: string) => {
    const next = new Set(selectedAmenities);
    if (next.has(a)) next.delete(a); else next.add(a);
    setSelectedAmenities(next);
  };

  const toggleWishlist = async (id: string) => {
    if (!auth.isAuthenticated) {
      window.dispatchEvent(new CustomEvent("open-auth-modal", { detail: { mode: "login" } }));
      return;
    }
    try {
      const res = await api.toggleSavedPlace('hotel', id);
      dispatch(updateUser({ savedHotels: res.user.savedHotels as any[] }));
    } catch (err) {
      window.alert("Failed to save hotel.");
    }
  };

  const hasActiveFilters = priceRange[0] !== 0 || priceRange[1] !== MAX_PRICE || minStar !== 0 || search.length > 0 || selectedAmenities.size > 0;
  const clearFilters = () => { setPriceRange([0, MAX_PRICE]); setMinStar(0); setSelectedAmenities(new Set()); setSearch(""); };
  const nights = Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 864e5));
  const mapCenter: [number, number] = [7.8731, 80.7718];

  return (
    <div className="min-h-screen bg-sand-50 pt-32 pb-24">
      <div className="max-w-7xl mx-auto px-5 md:px-8">

        {}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-5 h-5 text-leaf-700" />
            <span className="text-[11px] tracking-[0.3em] uppercase text-leaf-700 font-medium">Curated Stays · Sri Lanka</span>
          </div>
          <h1 className="font-serif text-5xl md:text-6xl text-ink-900 leading-tight">
            Find your
            <br />
            <span className="italic text-sunset-600 font-light">perfect stay.</span>
          </h1>
          <p className="mt-5 text-ink-800/75 max-w-2xl leading-relaxed">
            From colonial-era forts to cliffside eco-lodges — every hotel personally reviewed by our team.
            Book with confidence — no credit card required.
          </p>
        </motion.div>

        {}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-8">
          <div className="flex flex-wrap gap-3 items-center">
            {}
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-sand-100 border border-sand-200 text-sm hover:border-leaf-600 transition-colors cursor-pointer">
              <Calendar className="w-4 h-4 text-leaf-700" />
              <div>
                <span className="text-[10px] uppercase tracking-wider text-ink-800/45 block leading-none">Check-in</span>
                <input type="date" value={checkIn} min={today} onChange={(e) => {
                  setCheckIn(e.target.value);
                  if (e.target.value >= checkOut) {
                    setCheckOut(new Date(new Date(e.target.value).getTime() + 864e5).toISOString().split("T")[0]);
                  }
                }} className="bg-transparent text-ink-900 font-medium text-sm focus:outline-none cursor-pointer" />
              </div>
            </div>

            <div className="text-sand-300 font-light">→</div>

            {}
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-sand-100 border border-sand-200 text-sm hover:border-leaf-600 transition-colors cursor-pointer">
              <Calendar className="w-4 h-4 text-leaf-700" />
              <div>
                <span className="text-[10px] uppercase tracking-wider text-ink-800/45 block leading-none">Check-out</span>
                <input type="date" value={checkOut} min={checkIn} onChange={(e) => setCheckOut(e.target.value)} className="bg-transparent text-ink-900 font-medium text-sm focus:outline-none cursor-pointer" />
              </div>
            </div>

            {}
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-sand-100 border border-sand-200">
              <Users className="w-4 h-4 text-leaf-700" />
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider text-ink-800/45">Guests</span>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setGuests(Math.max(1, guests - 1))} className="w-6 h-6 rounded-full bg-sand-200 text-ink-800 text-xs font-bold flex items-center justify-center hover:bg-sand-300 transition-colors">−</button>
                  <span className="text-sm font-semibold text-ink-900 w-4 text-center">{guests}</span>
                  <button onClick={() => setGuests(Math.min(8, guests + 1))} className="w-6 h-6 rounded-full bg-sand-200 text-ink-800 text-xs font-bold flex items-center justify-center hover:bg-sand-300 transition-colors">+</button>
                </div>
              </div>
            </div>

            <div className="text-sm text-ink-800/45">
              <span className="font-medium text-ink-900">{nights}</span> {nights === 1 ? "night" : "nights"} selected
            </div>
          </div>
        </motion.div>

        {}
        <div className="grid lg:grid-cols-[300px_1fr] gap-8">
          {}
          <motion.aside initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:sticky lg:top-28 h-fit">
            <div className="bg-sand-100 p-5 rounded-[28px] border border-sand-200 space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-ink-900">
                  <Filter className="w-4 h-4" /> Filters
                  <span className="text-ink-800/40 text-xs font-normal">({filtered.length} results)</span>
                </div>
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="text-xs text-sunset-600 font-semibold hover:underline flex items-center gap-1">
                    <X className="w-3 h-3" /> Clear
                  </button>
                )}
              </div>

              {}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-800/35" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Name or city…"
                  className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-sand-50 border border-sand-200 focus:border-leaf-600 focus:outline-none text-sm text-ink-900 placeholder:text-ink-800/35"
                />
                {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-800/35"><X className="w-3.5 h-3.5" /></button>}
              </div>

              {}
              <div>
                <label className="text-[11px] uppercase tracking-wider text-ink-800/50 font-semibold block mb-2">
                  Price per night
                </label>
                <div className="flex items-center justify-between text-xs text-leaf-700 font-semibold mb-2">
                  <span>LKR {priceRange[0].toLocaleString()}</span>
                  <span>LKR {priceRange[1].toLocaleString()}</span>
                </div>
                <div className="space-y-2">
                  <input type="range" min={0} max={MAX_PRICE} step={5000} value={priceRange[0]} onChange={(e) => setPriceRange([parseInt(e.target.value), priceRange[1]])} className="w-full accent-leaf-700 h-1" />
                  <input type="range" min={0} max={MAX_PRICE} step={5000} value={priceRange[1]} onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])} className="w-full accent-leaf-700 h-1" />
                </div>
                <div className="flex gap-2 mt-2">
                  {[20000, 50000, 100000].map((p) => (
                    <button key={p} onClick={() => setPriceRange([0, p])} className={`flex-1 py-1.5 rounded-lg text-[10px] font-semibold transition-all border ${priceRange[1] === p ? "bg-ink-900 text-sand-50 border-ink-900" : "bg-sand-50 text-ink-800/70 border-sand-200 hover:bg-sand-200"}`}>
                      ≤{(p / 1000).toFixed(0)}k
                    </button>
                  ))}
                </div>
              </div>

              {}
              <div>
                <label className="text-[11px] uppercase tracking-wider text-ink-800/50 font-semibold block mb-2">Min. Star Rating</label>
                <div className="flex gap-1.5">
                  {[0, 3, 4, 5].map((n) => (
                    <button key={n} onClick={() => setMinStar(n)}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${minStar === n ? "bg-ink-900 text-sand-50" : "bg-sand-50 text-ink-800 hover:bg-sand-200 border border-sand-200"}`}>
                      {n === 0 ? "Any" : `${n}★`}
                    </button>
                  ))}
                </div>
              </div>

              {}
              <div>
                <label className="text-[11px] uppercase tracking-wider text-ink-800/50 font-semibold block mb-2.5">Amenities</label>
                <div className="flex flex-wrap gap-1.5">
                  {allAmenities.map((a) => {
                    const Icon = amenityIcons[a] || Sparkles;
                    const active = selectedAmenities.has(a);
                    return (
                      <button key={a} onClick={() => toggleAmenity(a)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold capitalize transition-all ${active ? "bg-leaf-700 text-sand-50" : "bg-sand-50 text-ink-800 hover:bg-sand-200 border border-sand-200"}`}>
                        <Icon className="w-3 h-3" />
                        {amenityLabels[a] || a}
                      </button>
                    );
                  })}
                </div>
              </div>

              {}
              <div>
                <label className="text-[11px] uppercase tracking-wider text-ink-800/50 font-semibold block mb-2">Location</label>
                <div className="space-y-1">
                  {allLocations.slice(0, 6).map((loc) => {
                    const count = hotels.filter((h) => h.location.startsWith(loc)).length;
                    return (
                      <button key={loc} onClick={() => setSearch(search === loc ? "" : loc)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all ${search === loc ? "bg-ink-900 text-sand-50" : "text-ink-800/70 hover:bg-sand-200"}`}>
                        <span className="flex items-center gap-2"><MapPin className="w-3 h-3" />{loc}</span>
                        <span className={`text-[10px] ${search === loc ? "text-sand-50/60" : "text-ink-800/40"}`}>{count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.aside>

          {}
          <div>
            {}
            <div className="flex items-center gap-3 mb-5 flex-wrap">
              <p className="text-sm text-ink-800/55 flex-1">
                <span className="font-semibold text-ink-900">{filtered.length}</span> hotels available
                {checkIn && checkOut && <span className="ml-1">· {nights} {nights === 1 ? "night" : "nights"} · {guests} {guests === 1 ? "guest" : "guests"}</span>}
              </p>

              {}
              <div className="relative">
                <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-800/40 pointer-events-none" />
                <select value={sort} onChange={(e) => setSort(e.target.value)}
                  className="pl-8 pr-8 py-2.5 rounded-full bg-sand-100 border border-sand-200 focus:border-leaf-600 focus:outline-none text-sm text-ink-900 appearance-none cursor-pointer">
                  {sortOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>

              {}
              <div className="flex rounded-full bg-sand-100 border border-sand-200 p-1 gap-1">
                <button onClick={() => setView("list")} className={`p-2 rounded-full transition-all ${view === "list" ? "bg-ink-900 text-sand-50" : "text-ink-800/50 hover:text-ink-800"}`}>
                  <List className="w-4 h-4" />
                </button>
                <button onClick={() => setView("map")} className={`p-2 rounded-full transition-all ${view === "map" ? "bg-ink-900 text-sand-50" : "text-ink-800/50 hover:text-ink-800"}`}>
                  <MapIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            {}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2 mb-4">
                {search && (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-ink-900 text-sand-50 text-xs font-semibold">
                    "{search}" <button onClick={() => setSearch("")}><X className="w-3 h-3" /></button>
                  </span>
                )}
                {minStar > 0 && (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-ink-900 text-sand-50 text-xs font-semibold">
                    {minStar}★+ <button onClick={() => setMinStar(0)}><X className="w-3 h-3" /></button>
                  </span>
                )}
                {Array.from(selectedAmenities).map((a) => (
                  <span key={a} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-ink-900 text-sand-50 text-xs font-semibold capitalize">
                    {amenityLabels[a] || a} <button onClick={() => toggleAmenity(a)}><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
            )}

            {}
            {view === "map" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative isolate rounded-[28px] overflow-hidden shadow-xl mb-6" style={{ height: 560 }}>
                <MapContainer center={mapCenter} zoom={8} style={{ height: "100%", width: "100%" }}>
                  <TileLayer
                    attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                  />
                  {(filtered || []).map((hotel) => (
                    <Marker
                      key={hotel.id}
                      position={[hotel.lat || 0, hotel.lng || 0]}
                      icon={createHotelMapIcon(hotel.starRating, hoveredHotel === hotel.id)}
                    >
                      <MapPopup>
                        <div className="font-sans min-w-45">
                          <img src={resolveMediaUrl(hotel.photos[0])} alt={hotel.name} className="w-full h-24 object-cover rounded mb-2" />
                          <strong className="text-sm block">{hotel.name}</strong>
                          <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />{hotel.location}
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs font-semibold">LKR {hotel.pricePerNight.toLocaleString()}/night</span>
                            <div className="flex items-center gap-0.5 text-amber-500 text-xs font-semibold">
                              <Star className="w-3 h-3 fill-amber-400" />{hotel.rating.toFixed(1)}
                            </div>
                          </div>
                          <a href={`/hotels/${hotel.id}`} className="mt-2 block text-center text-xs bg-green-800 text-white rounded-full py-1.5 font-semibold">View & Book</a>
                        </div>
                      </MapPopup>
                    </Marker>
                  ))}
                </MapContainer>
              </motion.div>
            )}

            {}
            {view === "list" && (
              <div className="space-y-5">
                {filtered.length > 0 ? (
                  (filtered || []).map((hotel, i) => (
                    <HotelCard
                      key={hotel.id}
                      hotel={hotel}
                      index={i}
                      wishlist={wishlist}
                      onToggleWishlist={toggleWishlist}
                      onHover={setHoveredHotel}
                      checkIn={checkIn}
                      checkOut={checkOut}
                      guests={guests}
                    />
                  ))
                ) : (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 text-center">
                    <div className="w-14 h-14 rounded-full bg-sand-200 flex items-center justify-center mx-auto mb-4">
                      <Search className="w-6 h-6 text-ink-800/30" />
                    </div>
                    <p className="font-serif text-2xl italic text-ink-800/60 mb-2">No hotels match</p>
                    <p className="text-sm text-ink-800/40 mb-5">Try adjusting your filters</p>
                    <button onClick={clearFilters} className="px-6 py-3 rounded-full bg-ink-900 text-sand-50 text-sm font-semibold hover:bg-leaf-700 transition-colors">
                      Reset all filters
                    </button>
                  </motion.div>
                )}
              </div>
            )}

            {}
            {wishlist.size > 0 && view === "list" && (
              <div className="mt-14 pt-10 border-t border-sand-200">
                <div className="flex items-center gap-3 mb-6">
                  <Heart className="w-5 h-5 fill-sunset-500 text-sunset-500" />
                  <h2 className="font-serif text-2xl text-ink-900">Saved Hotels</h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-sunset-400/10 text-sunset-600 text-xs font-semibold border border-sunset-400/20">{wishlist.size}</span>
                </div>
                <div className="space-y-4">
                  {hotels.filter((h) => wishlist.has(h.id)).map((hotel, i) => (
                    <HotelCard key={hotel.id} hotel={hotel} index={i} wishlist={wishlist} onToggleWishlist={toggleWishlist} onHover={setHoveredHotel} checkIn={checkIn} checkOut={checkOut} guests={guests} />
                  ))}
                </div>
              </div>
            )}

            {}
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-16 p-8 rounded-[28px] bg-linear-to-br from-leaf-700 to-leaf-600 text-sand-50 relative overflow-hidden">
              <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-sand-50/10 blur-2xl" />
              <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-sunset-300" />
                    <span className="text-[10px] uppercase tracking-widest text-sand-50/60 font-medium">Personalised Recommendations</span>
                  </div>
                  <h3 className="font-serif text-2xl md:text-3xl mb-2">Not sure where to stay?</h3>
                  <p className="text-sm text-sand-50/70 leading-relaxed">Our AI matches you to hotels based on your tour route, travel style, and budget.</p>
                </div>
                <Link to="/tours" className="shrink-0 flex items-center gap-2 px-6 py-3.5 rounded-full bg-sand-50 text-ink-900 font-semibold hover:bg-sunset-300 transition-colors text-sm">
                  Browse Tours First <ArrowUpDown className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
