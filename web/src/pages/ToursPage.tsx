import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock, Star, MapPin, ChevronRight, Sparkles,
  Search, SlidersHorizontal, Grid3X3, List, X, TrendingUp,
  Award, Bookmark, BookmarkCheck,
  Mountain, Waves, Landmark, Camera, TreePine, Zap,
  Filter, ArrowUpDown, Users, Compass
} from "lucide-react";
import { Link } from "react-router-dom";
import { resolveMediaUrl, api } from "../services/api";
import type { Tour } from "../store/slices/dataSlice";
import { useAppDispatch, useAppSelector } from "../store";
import { updateUser } from "../store/slices/authSlice";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

function createTourIcon() {
  return L.divIcon({
    className: "",
    html: `<div style="display:flex;flex-direction:column;align-items:center;"><div style="width:34px;height:34px;border-radius:50%;background:#14201d;display:flex;align-items:center;justify-content:center;font-size:16px;border:3px solid #e8a87c;box-shadow:0 4px 14px rgba(0,0,0,0.35);">🚩</div></div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
  });
}

const tagIcons: Record<string, any> = {
  Heritage: Landmark,
  Nature: TreePine,
  Sunrise: Zap,
  Highlands: Mountain,
  Photography: Camera,
  Wildlife: TreePine,
  Beach: Waves,
  "Best Seller": Award,
  Adventure: Mountain,
  Culture: Landmark,
};

const sortOptions = [
  { label: "Featured", value: "featured" },
  { label: "Highest Rated", value: "rating" },
  { label: "Shortest First", value: "duration-asc" },
  { label: "Longest First", value: "duration-desc" },
  { label: "Most Stops", value: "stops" },
];

const durationGroups = [
  { label: "Half Day", value: "half", match: (d: string) => d.toLowerCase().includes("half") || d.toLowerCase().includes("4h") },
  { label: "Full Day", value: "full", match: (d: string) => d.toLowerCase().includes("full") || d.toLowerCase().includes("8h") },
  {
    label: "Multi-Day", value: "multi", match: (d: string) => {
      const m = d.match(/(\d+)\s+days?/i);
      return m ? parseInt(m[1], 10) >= 2 : d.toLowerCase().includes("multi");
    }
  },
];

const getDurationHours = (d: string) => {
  const str = d.toLowerCase();
  const mDay = str.match(/(\d+)\s*days?/);
  if (mDay) return parseInt(mDay[1], 10) * 24;
  const mHr = str.match(/(\d+)\s*h/);
  if (mHr) return parseInt(mHr[1], 10);
  if (str.includes("half")) return 4;
  if (str.includes("full")) return 8;
  return 0;
};

function TourCardGrid({ tour, saved, onToggleSave, index }: { tour: Tour; saved: boolean; onToggleSave: () => void; index: number; }) {
  const linkTo = `/tours/${tour.id}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.06 }}
      className="group relative"
    >
      <Link
        to={linkTo}
        className="block relative overflow-hidden rounded-[28px] bg-sand-100 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1"
      >
        { }
        <div className="aspect-16/10 overflow-hidden relative">
          <img
            src={resolveMediaUrl(tour.coverImage)}
            alt={tour.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1500 ease-out"
          />
          <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-ink-900/50" />

          { }
          <div className="absolute top-4 left-4 flex flex-wrap gap-1.5">
            {(tour.tags || []).slice(0, 2).map((tag) => {
              const Icon = tagIcons[tag] || Sparkles;
              return (
                <span key={tag} className="flex items-center gap-1 text-[10px] tracking-wider uppercase px-2.5 py-1 rounded-full bg-sand-50/90 text-ink-900 font-semibold backdrop-blur">
                  <Icon className="w-3 h-3" />
                  {tag}
                </span>
              );
            })}
          </div>

          { }
          <div className="absolute bottom-4 right-4 flex items-center gap-1.5 bg-ink-900/70 backdrop-blur px-2.5 py-1 rounded-full">
            <Star className="w-3.5 h-3.5 fill-sunset-400 text-sunset-400" />
            <span className="text-xs font-semibold text-sand-50">{tour.rating.toFixed(1)}</span>
          </div>

          { }
          <div className="absolute bottom-4 left-4 text-xs text-sand-50/80 font-medium">
            {(tour.stops || []).length} stops
          </div>
        </div>

        { }
        <div className="p-5">
          <div className="flex items-center gap-2 text-xs text-ink-800/55 mb-2 flex-wrap">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="tracking-wide uppercase truncate">{tour.location}</span>
            <span className="text-sand-300">·</span>
            <Clock className="w-3 h-3 shrink-0" />
            <span className="tracking-wide">{tour.duration}</span>
          </div>

          <h3 className="font-serif text-xl text-ink-900 mb-2 leading-tight line-clamp-2">
            {tour.title}
          </h3>
          <p className="text-sm text-ink-800/65 leading-relaxed line-clamp-2 mb-4">
            {tour.description}
          </p>

          <div className="flex items-center justify-between pt-3 border-t border-sand-200/60">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1.5">
                {[...Array(Math.min(3, (tour.stops || []).length))].map((_, i) => (
                  <div key={i} className="w-5 h-5 rounded-full bg-leaf-700/20 border-2 border-sand-100 flex items-center justify-center">
                    <span className="text-[8px] text-leaf-700 font-bold">{i + 1}</span>
                  </div>
                ))}
                {(tour.stops || []).length > 3 && (
                  <div className="w-5 h-5 rounded-full bg-sand-200 border-2 border-sand-100 flex items-center justify-center">
                    <span className="text-[8px] text-ink-800/60 font-bold">+{(tour.stops || []).length - 3}</span>
                  </div>
                )}
              </div>
              <span className="text-xs text-ink-800/55">curated stops</span>
            </div>
            <span className="flex items-center gap-1 text-xs font-semibold text-leaf-700 group-hover:text-sunset-600 transition-colors">
              Explore <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </Link>

      { }
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleSave(); }}
        className={`absolute top-4 right-4 z-10 w-9 h-9 rounded-full flex items-center justify-center shadow-lg transition-all ${saved ? "bg-leaf-700 text-sand-50" : "bg-sand-50/90 text-ink-800 hover:bg-sand-50 backdrop-blur"}`}
        title={saved ? "Saved" : "Save tour"}
      >
        {saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
      </button>
    </motion.div>
  );
}

function TourCardList({ tour, saved, onToggleSave, index }: { tour: Tour; saved: boolean; onToggleSave: () => void; index: number; }) {
  const linkTo = `/tours/${tour.id}`;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="group"
    >
      <Link
        to={linkTo}
        className="flex gap-5 p-4 rounded-3xl bg-sand-100 hover:shadow-xl transition-all duration-400 items-start"
      >
        <div className="relative w-44 h-32 shrink-0 rounded-2xl overflow-hidden">
          <img src={resolveMediaUrl(tour.coverImage)} alt={tour.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1200" />
          <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-ink-900/70 backdrop-blur px-2 py-0.5 rounded-full">
            <Star className="w-3 h-3 fill-sunset-400 text-sunset-400" />
            <span className="text-[10px] font-semibold text-sand-50">{tour.rating.toFixed(1)}</span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs text-ink-800/55 mb-1.5 flex-wrap">
            <MapPin className="w-3 h-3" />
            <span className="uppercase tracking-wide truncate">{tour.location}</span>
            <span>·</span>
            <Clock className="w-3 h-3" />
            <span>{tour.duration}</span>
            <span>·</span>
            <span className="text-leaf-700 font-semibold">{(tour.stops || []).length} stops</span>
          </div>
          <h3 className="font-serif text-2xl text-ink-900 mb-1 leading-tight">{tour.title}</h3>
          <p className="text-sm text-ink-800/65 leading-relaxed line-clamp-2 mb-3">{tour.description}</p>
          <div className="flex flex-wrap gap-1.5">
            {(tour.tags || []).map((tag) => {
              const Icon = tagIcons[tag] || Sparkles;
              return (
                <span key={tag} className="flex items-center gap-1 text-[10px] tracking-wider uppercase px-2 py-0.5 rounded-full bg-sand-200/80 text-ink-800/70 font-semibold">
                  <Icon className="w-2.5 h-2.5" />
                  {tag}
                </span>
              );
            })}
          </div>
        </div>

        <div className="shrink-0 flex flex-col items-end gap-3">
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleSave(); }}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${saved ? "bg-leaf-700 text-sand-50" : "bg-sand-200 text-ink-800 hover:bg-sand-300"}`}
          >
            {saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
          </button>
          <span className="flex items-center gap-1 text-sm font-semibold text-leaf-700 group-hover:text-sunset-600 transition-colors whitespace-nowrap">
            View Tour <ChevronRight className="w-4 h-4" />
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

export default function ToursPage() {
  const tours = useAppSelector((s) => s.data.tours);
  const auth = useAppSelector((s) => s.auth);

  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [durationFilter, setDurationFilter] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("featured");
  const [view, setView] = useState<"grid" | "list">("grid");
  const dispatch = useAppDispatch();
  const savedTours = new Set(auth.user?.savedTours?.map((t: any) => t.id || t._id) || []);
  const [showFilters, setShowFilters] = useState(false);

  // New filters and state
  const [minPrice, setMinPrice] = useState<number | "">("");
  const [maxPrice, setMaxPrice] = useState<number | "">("");
  const [minRating, setMinRating] = useState<number | null>(null);
  const [showMap, setShowMap] = useState<boolean>(false);

  const allTags = useMemo(() => {
    const tagCounts: Record<string, number> = {};
    tours.forEach((t) => t.tags.forEach((tag) => { tagCounts[tag] = (tagCounts[tag] || 0) + 1; }));
    return Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);
  }, [tours]);

  const recommended = useMemo(() =>
    auth.isAuthenticated
      ? (tours || []).filter((t) => t.tags.some((tag) => auth.user?.preferences?.interests?.includes(tag)))
      : [],
    [tours, auth]
  );

  const filtered = useMemo(() => {
    let result = (tours || []).filter((t) => {
      if (tagFilter === "Recommended") {
        if (!auth.user?.preferences?.interests?.some(interest => t.tags.includes(interest))) return false;
      } else if (tagFilter && !t.tags.includes(tagFilter)) return false;
      if (durationFilter) {
        const group = durationGroups.find((g) => g.value === durationFilter);
        if (group && !group.match(t.duration)) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        return (
          t.title.toLowerCase().includes(q) ||
          t.location.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.toLowerCase().includes(q))
        );
      }
      if (minPrice !== "" && t.price !== undefined && t.price < minPrice) return false;
      if (maxPrice !== "" && t.price !== undefined && t.price > maxPrice) return false;
      if (minRating !== null && t.rating < minRating) return false;
      return true;
    });

    switch (sort) {
      case "rating": result = [...result].sort((a, b) => b.rating - a.rating); break;
      case "duration-asc": result = [...result].sort((a, b) => getDurationHours(a.duration) - getDurationHours(b.duration)); break;
      case "duration-desc": result = [...result].sort((a, b) => getDurationHours(b.duration) - getDurationHours(a.duration)); break;
      case "stops": result = [...result].sort((a, b) => b.stops.length - a.stops.length); break;
    }

    return result;
  }, [tours, tagFilter, durationFilter, search, sort, minPrice, maxPrice, minRating]);

  const hasActiveFilters = tagFilter || durationFilter || search || minPrice !== "" || maxPrice !== "" || minRating !== null;
  const avgRating = tours.length > 0 ? (tours.reduce((s, t) => s + t.rating, 0) / tours.length).toFixed(1) : "—";
  const uniqueLocations = new Set((tours || []).map((t) => t.location.split("·")[0].trim())).size;

  const toggleSave = async (id: string) => {
    if (!auth.isAuthenticated) {
      window.dispatchEvent(new CustomEvent("open-auth-modal", { detail: { mode: "login" } }));
      return;
    }
    try {
      const res = await api.toggleSavedPlace('tour', id);
      dispatch(updateUser({ savedTours: res.user.savedTours as any[] }));
    } catch (err) {
      window.alert("Failed to save tour.");
    }
  };

  const clearFilters = () => {
    setTagFilter(null);
    setDurationFilter(null);
    setSearch("");
    setMinPrice("");
    setMaxPrice("");
    setMinRating(null);
  };

  return (
    <div className="min-h-screen bg-sand-50 pt-32 pb-24">
      { }
      <div className="max-w-7xl mx-auto px-5 md:px-8">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <Compass className="w-5 h-5 text-leaf-700" />
            <span className="text-[11px] tracking-[0.3em] uppercase text-leaf-700 font-medium">Curated · Guided Tours</span>
          </div>
          <h1 className="font-serif text-5xl md:text-6xl text-ink-900 leading-tight">
            Discover Sri Lanka
            <br />
            <span className="italic text-sunset-600 font-light">one stop at a time.</span>
          </h1>
          <p className="mt-5 text-ink-800/75 max-w-2xl leading-relaxed">
            Hand-crafted itineraries with proximity-triggered alerts, historic sunrise starts, and private local guides.
            {auth.isAuthenticated && recommended.length > 0 && (
              <span className="inline-flex items-center gap-1 ml-1 text-leaf-700 font-medium">
                <Sparkles className="inline w-4 h-4" />
                {recommended.length} tours match your interests.
              </span>
            )}
          </p>
        </motion.div>

        { }
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-3 gap-4 mb-10 p-5 rounded-3xl bg-sand-100 border border-sand-200"
        >
          {[
            { icon: Compass, value: tours.length.toString(), label: "Curated tours" },
            { icon: MapPin, value: uniqueLocations.toString(), label: "Destinations" },
            { icon: Star, value: avgRating, label: "Avg. rating" },
          ].map(({ icon: Icon, value, label }) => (
            <div key={label} className="text-center">
              <div className="flex justify-center mb-1"><Icon className="w-4 h-4 text-leaf-700" /></div>
              <div className="font-serif text-2xl text-ink-900">{value}</div>
              <div className="text-[11px] uppercase tracking-wider text-ink-800/50 font-medium">{label}</div>
            </div>
          ))}
        </motion.div>

        { }
        {auth.isAuthenticated && recommended.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mb-10 p-5 md:p-6 rounded-[28px] bg-linear-to-br from-leaf-700 via-leaf-600 to-sunset-500 text-sand-50 relative overflow-hidden"
          >
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-sand-50/10 blur-2xl" />
            <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="text-[10px] tracking-[0.3em] uppercase text-sand-50/70 font-medium mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> AI Recommendation Engine · Active
                </div>
                <p className="font-serif text-xl md:text-2xl">
                  Based on your interest in{" "}
                  <span className="font-bold">{auth.user?.preferences?.interests?.join(", ") || "Heritage & Nature"}</span>,{" "}
                  we found {recommended.length} tours you'll love.
                </p>
              </div>
              <Link
                to="#recommended"
                onClick={() => setTagFilter("Recommended")}
                className="shrink-0 px-5 py-2.5 rounded-full bg-sand-50 text-ink-900 text-sm font-semibold hover:bg-sunset-300 transition-colors"
              >
                Show My Tours
              </Link>
            </div>
          </motion.div>
        )}

        {/* ── Search + Controls bar ───────────────── */}
        <div className="flex flex-col md:flex-row gap-4 mb-6 bg-sand-100 p-2 rounded-full border border-sand-200 items-center">
          {/* Destination */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-800/40" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Where to?"
              className="w-full pl-10 pr-10 py-3 bg-transparent focus:outline-none text-sm text-ink-900 placeholder:text-ink-800/40"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-800/40 hover:text-ink-800">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* ── Sort & View Controls ───────────────── */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mb-6">
           <div className="flex items-center gap-2">
             <button
               onClick={() => setShowFilters(!showFilters)}
               className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold border transition-all ${hasActiveFilters ? "bg-ink-900 text-sand-50 border-ink-900" : "bg-sand-100 text-ink-800 border-sand-200 hover:bg-sand-200"}`}
             >
               <SlidersHorizontal className="w-4 h-4" />
               Filters
               {hasActiveFilters && (
                 <span className="w-5 h-5 rounded-full bg-sunset-400 text-ink-900 text-[10px] font-bold flex items-center justify-center">
                   {[tagFilter, durationFilter, search, minPrice !== "", maxPrice !== "", minRating !== null].filter(Boolean).length}
                 </span>
               )}
             </button>
           </div>
           
           <div className="flex items-center gap-3 w-full sm:w-auto">
             <div className="relative flex-1 sm:flex-none">
               <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-800/40 pointer-events-none" />
               <select
                 value={sort}
                 onChange={(e) => setSort(e.target.value)}
                 className="w-full pl-9 pr-8 py-2.5 rounded-full bg-sand-100 border border-sand-200 focus:border-leaf-600 focus:outline-none text-sm text-ink-900 appearance-none cursor-pointer"
               >
                 {sortOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
               </select>
             </div>
             
             {/* View toggle */}
             <div className="flex rounded-full bg-sand-100 border border-sand-200 p-1 gap-1 shrink-0">
               <button
                 onClick={() => { setView("grid"); setShowMap(false); }}
                 className={`p-2 rounded-full transition-all ${view === "grid" && !showMap ? "bg-ink-900 text-sand-50" : "text-ink-800/50 hover:text-ink-800"}`}
               >
                 <Grid3X3 className="w-4 h-4" />
               </button>
               <button
                 onClick={() => { setView("list"); setShowMap(false); }}
                 className={`p-2 rounded-full transition-all ${view === "list" && !showMap ? "bg-ink-900 text-sand-50" : "text-ink-800/50 hover:text-ink-800"}`}
               >
                 <List className="w-4 h-4" />
               </button>
               <button
                 onClick={() => setShowMap(true)}
                 className={`p-2 rounded-full transition-all ${showMap ? "bg-ink-900 text-sand-50" : "text-ink-800/50 hover:text-ink-800"}`}
               >
                 <MapPin className="w-4 h-4" />
               </button>
             </div>
           </div>
        </div>

        {/* ── Filter drawer ──────────────────────── */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-6"
            >
              <div className="p-5 rounded-3xl bg-sand-100 border border-sand-200 space-y-5">
                {/* Tag filters */}
                <div>
                  <label className="text-xs uppercase tracking-wider text-ink-800/50 font-semibold  mb-3 flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5" /> Tour Category
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setTagFilter(null)}
                      className={`px-3.5 py-1.5 rounded-full text-xs tracking-wider uppercase font-semibold transition-all border ${tagFilter === null ? "bg-ink-900 text-sand-50 border-ink-900" : "bg-sand-50 text-ink-800 border-sand-200 hover:bg-sand-200"}`}
                    >
                      All ({tours.length})
                    </button>
                    {(allTags || []).map(([tag, count]) => {
                      const Icon = tagIcons[tag] || Sparkles;
                      return (
                        <button
                          key={tag}
                          onClick={() => setTagFilter(tag === tagFilter ? null : tag)}
                          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs tracking-wider uppercase font-semibold transition-all border ${tagFilter === tag ? "bg-ink-900 text-sand-50 border-ink-900" : "bg-sand-50 text-ink-800 border-sand-200 hover:bg-sand-200"}`}
                        >
                          <Icon className="w-3 h-3" />{tag}
                          <span className="opacity-50">({count})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Duration filter */}
                <div>
                  <label className="text-xs uppercase tracking-wider text-ink-800/50 font-semibold mb-3 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> Duration
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setDurationFilter(null)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border ${durationFilter === null ? "bg-ink-900 text-sand-50 border-ink-900" : "bg-sand-50 text-ink-800 border-sand-200 hover:bg-sand-200"}`}
                    >
                      Any duration
                    </button>
                    {durationGroups.map((g) => (
                      <button
                        key={g.value}
                        onClick={() => setDurationFilter(g.value === durationFilter ? null : g.value)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border ${durationFilter === g.value ? "bg-ink-900 text-sand-50 border-ink-900" : "bg-sand-50 text-ink-800 border-sand-200 hover:bg-sand-200"}`}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price filter */}
                <div>
                  <label className="text-xs uppercase tracking-wider text-ink-800/50 font-semibold mb-3 flex items-center gap-1.5">
                    Price Range
                  </label>
                  <div className="flex items-center gap-2 max-w-sm">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-800/50 text-xs">LKR</span>
                      <input type="number" placeholder="Min" value={minPrice} onChange={(e) => setMinPrice(e.target.value ? Number(e.target.value) : "")} className="w-full pl-10 pr-3 py-2 rounded-lg bg-sand-50 border border-sand-200 text-sm focus:outline-none focus:border-leaf-600" />
                    </div>
                    <span className="text-ink-800/50">-</span>
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-800/50 text-xs">LKR</span>
                      <input type="number" placeholder="Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : "")} className="w-full pl-10 pr-3 py-2 rounded-lg bg-sand-50 border border-sand-200 text-sm focus:outline-none focus:border-leaf-600" />
                    </div>
                  </div>
                </div>

                {/* Rating filter */}
                <div>
                  <label className="text-xs uppercase tracking-wider text-ink-800/50 font-semibold mb-3 flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5" /> Minimum Rating
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[5, 4.5, 4, 3.5, 3].map((r) => (
                      <button
                        key={r}
                        onClick={() => setMinRating(minRating === r ? null : r)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border flex items-center gap-1 ${minRating === r ? "bg-ink-900 text-sand-50 border-ink-900" : "bg-sand-50 text-ink-800 border-sand-200 hover:bg-sand-200"}`}
                      >
                        {r}+ <Star className={`w-3 h-3 ${minRating === r ? "fill-sunset-400 text-sunset-400" : ""}`} />
                      </button>
                    ))}
                  </div>
                </div>

                {hasActiveFilters && (
                  <button onClick={clearFilters} className="flex items-center gap-2 text-sm text-sunset-600 font-semibold hover:text-sunset-500 transition-colors">
                    <X className="w-4 h-4" /> Clear all filters
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Results summary ────────────────────── */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-ink-800/55">
            Showing <span className="font-semibold text-ink-900">{filtered.length}</span> of {tours.length} tours
            {tagFilter && <span> · <span className="text-leaf-700 font-medium">{tagFilter}</span></span>}
            {durationFilter && <span> · {durationGroups.find((g) => g.value === durationFilter)?.label}</span>}
            {search && <span> · "{search}"</span>}
          </p>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="text-xs text-sunset-600 font-semibold hover:underline flex items-center gap-1">
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>

        {/* ── Tour grid / list / map ───────────────────── */}
        {filtered.length > 0 ? (
          showMap ? (
            <div className="w-full h-[600px] rounded-3xl overflow-hidden border border-sand-200 relative z-0">
              <MapContainer
                center={[7.8731, 80.7718]}
                zoom={7}
                style={{ width: "100%", height: "100%" }}
                scrollWheelZoom={false}
              >
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />
                {(filtered || []).map((tour) => {
                  const lat = tour.startLat || tour.stops[0]?.lat;
                  const lng = tour.startLng || tour.stops[0]?.lng;
                  if (!lat || !lng) return null;
                  return (
                    <Marker key={tour.id} position={[lat || 0, lng || 0]} icon={createTourIcon()}>
                      <Popup className="tour-popup" minWidth={250}>
                        <div className="p-1">
                          <img src={resolveMediaUrl(tour.coverImage)} alt={tour.title} className="w-full h-32 object-cover rounded-xl mb-3" />
                          <h4 className="font-serif text-lg leading-tight mb-1">{tour.title}</h4>
                          <p className="text-xs text-ink-800/60 mb-2">{tour.location}</p>
                          <div className="flex items-center justify-between mt-3">
                            <span className="font-semibold text-leaf-700">{tour.price ? `LKR ${tour.price.toLocaleString()}` : "Free"}</span>
                            <Link to={`/tours/${tour.id}`} className="text-xs bg-ink-900 text-sand-50 px-3 py-1.5 rounded-full hover:bg-leaf-700 transition-colors">
                              View
                            </Link>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
            </div>
          ) : view === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {(filtered || []).map((tour, i) => (
                <TourCardGrid
                  key={tour.id}
                  tour={tour}
                  index={i}
                  saved={savedTours.has(tour.id)}
                  onToggleSave={() => toggleSave(tour.id)}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {(filtered || []).map((tour, i) => (
                <TourCardList
                  key={tour.id}
                  tour={tour}
                  index={i}
                  saved={savedTours.has(tour.id)}
                  onToggleSave={() => toggleSave(tour.id)}
                />
              ))}
            </div>
          )
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-20 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-sand-200 flex items-center justify-center mx-auto mb-5">
              <Search className="w-7 h-7 text-ink-800/30" />
            </div>
            <p className="font-serif text-2xl italic text-ink-800/60 mb-2">No tours found</p>
            <p className="text-sm text-ink-800/45 mb-6">
              {search ? `No tours match "${search}"` : "Try a different filter combination"}
            </p>
            <button
              onClick={clearFilters}
              className="px-6 py-3 rounded-full bg-ink-900 text-sand-50 text-sm font-semibold hover:bg-leaf-700 transition-colors"
            >
              Show all tours
            </button>
          </motion.div>
        )}

        {/* ── Saved tours section ────────────────── */}
        {savedTours.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-16 pt-12 border-t border-sand-200"
          >
            <div className="flex items-center gap-3 mb-6">
              <BookmarkCheck className="w-5 h-5 text-leaf-700" />
              <h2 className="font-serif text-2xl text-ink-900">Saved Tours</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-leaf-700/10 text-leaf-700 text-xs font-semibold">{savedTours.size}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {(tours || []).filter((t) => savedTours.has(t.id)).map((tour, i) => (
                <TourCardGrid
                  key={tour.id}
                  tour={tour}
                  index={i}
                  saved={true}
                  onToggleSave={() => toggleSave(tour.id)}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* ── CTA strip ─────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-20 p-8 md:p-12 rounded-4xl bg-ink-900 text-sand-50 relative overflow-hidden"
        >
          <div className="absolute inset-0 opacity-15" style={{ backgroundImage: `url(/images/hero-sigiriya.jpg)`, backgroundSize: "cover", backgroundPosition: "center" }} />
          <div className="absolute inset-0 bg-linear-to-r from-ink-900 via-ink-900/90 to-transparent" />
          <div className="relative max-w-2xl">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-sunset-400" />
              <span className="text-[10px] tracking-[0.3em] uppercase text-sand-50/60 font-medium">Custom Itineraries</span>
            </div>
            <h2 className="font-serif text-3xl md:text-4xl mb-3 leading-tight">
              Can't find exactly what you want?
            </h2>
            <p className="text-sand-50/70 leading-relaxed mb-6 max-w-lg">
              Our local experts craft bespoke multi-day journeys to your exact preferences — niche heritage, wildlife corridors, culinary trails, and more.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/hotels" className="flex items-center gap-2 px-6 py-3 rounded-full bg-sunset-400 text-ink-900 font-semibold hover:bg-sunset-300 transition-colors text-sm">
                <Users className="w-4 h-4" /> Browse Hotels Too
              </Link>
              <Link to="/" className="flex items-center gap-2 px-6 py-3 rounded-full border border-sand-50/20 text-sand-50 font-semibold hover:bg-sand-50/10 transition-colors text-sm">
                View Island Map
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
