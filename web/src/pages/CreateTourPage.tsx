import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapContainer, TileLayer, Marker, Popup as MapPopup, Polyline, useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  MapPin, Navigation, X, ChevronRight, Route, Clock, Ruler,
  Fuel, Utensils, Coffee, RefreshCw, Hotel as HotelIcon,
  Car, Bike, Footprints, CheckCircle, AlertTriangle, Sparkles, Save,
  Calendar, Users, Star, Loader2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store";
import { addCustomTour, setFacilities } from "../store/slices/dataSlice";
import { api, resolveMediaUrl } from "../services/api";
import type { Facility, RoutePOI } from "../store/slices/dataSlice";
import AIRecommendations from "../components/AIRecommendations";
import AITourSuggestions from "../components/AITourSuggestions";
import TripTypeRecommendations, { type TripType } from "../components/TripTypeRecommendations";
import { findNearbyPOIs } from "../utils/overpass";
import TripEstimate from "../components/TripEstimate";



const POI_CATEGORIES = [
  { key: "fuel", label: "Fuel Stations", emoji: "⛽", icon: Fuel, color: "#c17b7b", query: "amenity=fuel" },
  { key: "restaurant", label: "Restaurants", emoji: "🍽️", icon: Utensils, color: "#e8a87c", query: "amenity=restaurant" },
  { key: "cafe", label: "Cafés", emoji: "☕", icon: Coffee, color: "#c8a97c", query: "amenity=cafe" },
] as const;

const pointIcon = (color: string, emoji: string) => L.divIcon({
  className: "",
  html: `<div style="display:flex;flex-direction:column;align-items:center;gap:2px;">
    <div style="width:30px;height:30px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;font-size:13px;border:2.5px solid white;box-shadow:0 4px 12px rgba(0,0,0,0.3);">LKR ${emoji}</div>
    <div style="width:2px;height:5px;background:${color};border-radius:1px;"></div>
  </div>`,
  iconSize: [30, 37],
  iconAnchor: [15, 37],
});

const endpointIcon = (label: string, color: string) => L.divIcon({
  className: "",
  html: `<div style="display:flex;flex-direction:column;align-items:center;gap:2px;">
    <div style="background:${color};color:#fbf8f3;padding:4px 12px;border-radius:20px;font-size:11px;font-weight:700;font-family:Inter,sans-serif;white-space:nowrap;box-shadow:0 4px 14px rgba(0,0,0,0.3);max-width:140px;overflow:hidden;text-overflow:ellipsis;">LKR ${label.length > 16 ? label.substring(0, 16) + "…" : label}</div>
    <div style="width:2px;height:8px;background:${color};border-radius:1px;"></div>
    <div style="width:10px;height:10px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>
  </div>`,
  iconSize: [140, 48],
  iconAnchor: [70, 48],
});

function haversine(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000;
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function fmtDist(m: number) {
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
}

function fmtTime(s: number) {
  if (s < 60) return "< 1 min";
  const mins = Math.round(s / 60);
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function localDateISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function todayLocalISO(): string {
  return localDateISO(new Date());
}
function addDaysISO(dateStr: string, n: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  dt.setDate(dt.getDate() + n);
  return localDateISO(dt);
}

interface SearchResult {
  lat: number;
  lon: number;
  display_name: string;
}

async function geocodeSearch(query: string): Promise<SearchResult[]> {
  if (!query.trim()) return [];
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=lk&addressdetails=0`;
  try {
    const res = await fetch(url, { headers: { "Accept-Language": "en" } });
    const data = await res.json();
    return data.map((r: { lat: string; lon: string; display_name: string }) => ({ lat: parseFloat(r.lat), lon: parseFloat(r.lon), display_name: r.display_name }));
    } catch (e) {
      console.error(e);
      return [];
  }
}

interface RouteResult {
  coords: [number, number][];
  distance: number;
  duration: number;
  bounds: [[number, number], [number, number]];
}

async function fetchRoute(
  sLat: number, sLng: number, eLat: number, eLng: number,
  mode: "walking" | "cycling" | "driving",
  waypoints: { lat: number; lng: number }[] = [],
): Promise<RouteResult | null> {
  const profile = mode === "walking" ? "foot" : mode === "cycling" ? "bike" : "car";
  const coordsStr = [
    `${sLng},${sLat}`,
    ...waypoints.map((w) => `${w.lng},${w.lat}`),
    `${eLng},${eLat}`,
  ].join(";");
  const url = `https://router.project-osrm.org/route/v1/${profile}/${coordsStr}?steps=false&geometries=geojson&overview=full`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.code !== "Ok" || !data.routes?.[0]) return null;
    const route = data.routes[0];
    const coords: [number, number][] = route.geometry.coordinates.map(([lng, lat]: [number, number]) => [lat, lng]);
    let minLat = Infinity, minLng = Infinity, maxLat = -Infinity, maxLng = -Infinity;
    for (const [la, ln] of coords) {
      if (la < minLat) minLat = la;
      if (la > maxLat) maxLat = la;
      if (ln < minLng) minLng = ln;
      if (ln > maxLng) maxLng = ln;
    }
    const bounds: [[number, number], [number, number]] = [
      [minLat, minLng],
      [maxLat, maxLng],
    ];
    return { coords, distance: route.distance, duration: route.duration, bounds };
  } catch {
    return null;
  }
}

async function fetchPOIsNear(lat: number, lng: number, radius = 1200) {
  return findNearbyPOIs(lat, lng, ["amenity=fuel", "amenity=restaurant", "amenity=cafe"], radius, 20);
}

function sampleRoute(coords: [number, number][], totalDistance: number, intervalMeters = 25000): { lat: number; lng: number; distanceFromStart: number }[] {
  if (coords.length === 0) return [];
  const samples: { lat: number; lng: number; distanceFromStart: number }[] = [];
  let acc = 0;
  let nextTarget = intervalMeters / 2;
  const maxSamples = 10;

  for (let i = 1; i < coords.length && samples.length < maxSamples; i++) {
    const segDist = haversine(coords[i - 1][0], coords[i - 1][1], coords[i][0], coords[i][1]);
    acc += segDist;
    if (acc >= nextTarget) {
      samples.push({ lat: coords[i][0], lng: coords[i][1], distanceFromStart: acc });
      nextTarget += intervalMeters;
    }
  }

  if (samples.length === 0 && totalDistance > 0) {
    const mid = coords[Math.floor(coords.length / 2)];
    samples.push({ lat: mid[0], lng: mid[1], distanceFromStart: totalDistance / 2 });
  }
  return samples;
}

function FitBounds({ bounds }: { bounds: [[number, number], [number, number]] }) {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13, animate: true });
  }, [bounds[0][0], bounds[0][1], bounds[1][0], bounds[1][1]]);
  return null;
}

function PlaceSearch({
  label, icon: Icon, value, onPick, color,
}: {
  label: string;
  icon: React.ElementType;
  value: { name: string; lat: number; lng: number } | null;
  onPick: (v: { name: string; lat: number; lng: number }) => void;
  color: string;
}) {
  const [query, setQuery] = useState(value?.name ?? "");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setQuery(value?.name ?? ""); }, [value?.name]);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!query.trim() || query === value?.name) { setResults([]); setOpen(false); return; }
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      const r = await geocodeSearch(query);
      setResults(r);
      setOpen(r.length > 0);
      setLoading(false);
    }, 400);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query]);

  return (
    <div className="relative">
      <label className="text-[10px] uppercase tracking-[0.3em] text-ink-800/45 font-semibold block mb-2">{label}</label>
      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white border border-sand-200 focus-within:border-leaf-600 focus-within:ring-2 focus-within:ring-leaf-600/15 transition-all">
        <Icon className="w-4 h-4 shrink-0" style={{ color }} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={`Search a place in Sri Lanka…`}
          className="flex-1 bg-transparent outline-none text-sm text-ink-900 placeholder:text-ink-800/35 min-w-0"
        />
        {loading && <RefreshCw className="w-4 h-4 text-leaf-700 animate-spin shrink-0" />}
        {query && !loading && (
          <button onClick={() => { setQuery(""); setResults([]); setOpen(false); }} className="shrink-0 text-ink-800/40 hover:text-ink-800">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      <AnimatePresence>
        {open && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl border border-sand-200 shadow-2xl shadow-ink-900/10 overflow-hidden z-30"
          >
            {results.map((r, i) => (
              <button
                key={i}
                onClick={() => {
                  const name = r.display_name.split(",")[0];
                  setQuery(name);
                  setOpen(false);
                  onPick({ name, lat: r.lat, lng: r.lon });
                }}
                className="w-full flex items-start gap-3 px-4 py-3 hover:bg-sand-50 transition-colors text-left border-b border-sand-100 last:border-0 group"
              >
                <MapPin className="w-3.5 h-3.5 text-leaf-700 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink-900 truncate">{r.display_name.split(",")[0]}</p>
                  <p className="text-xs text-ink-800/50 truncate mt-0.5">{r.display_name.split(",").slice(1, 3).join(",")}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-ink-800/20 group-hover:text-leaf-700 transition-colors shrink-0 mt-0.5" />
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function CreateTourPage() {
  const dispatch = useAppDispatch();
  const auth = useAppSelector((s) => s.auth);
  const hotels = useAppSelector((s) => s.data.hotels);
  const facilitiesCatalog = useAppSelector((s) => s.data.facilities);

  const [origin, setOrigin] = useState<{ name: string; lat: number; lng: number } | null>(null);
  const [destination, setDestination] = useState<{ name: string; lat: number; lng: number } | null>(null);
  const [transportMode, setTransportMode] = useState<"driving" | "cycling" | "walking">("driving");
  const [title, setTitle] = useState("");

  const [route, setRoute] = useState<RouteResult | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  
  const mapRef = useRef<L.Map>(null);
  const [activePOIKey, setActivePOIKey] = useState<number | null>(null);

  const [pois, setPois] = useState<RoutePOI[]>([]);
  const [poisLoading, setPoisLoading] = useState(false);
  const [activeCategories, setActiveCategories] = useState<Set<string>>(new Set(["fuel", "restaurant", "cafe"]));

  const [includeHotel, setIncludeHotel] = useState(false);
  const [selectedHotelId, setSelectedHotelId] = useState<string>("");
  const [selectedFacilityIds, setSelectedFacilityIds] = useState<Set<string>>(new Set());
  const [roomType, setRoomType] = useState<"standard" | "deluxe" | "suite">("standard");
  const [guests, setGuests] = useState(2);

  const [tripType, setTripType] = useState<TripType>("family");
  const today = todayLocalISO();
  const tomorrow = addDaysISO(today, 1);
  const [checkIn, setCheckIn] = useState(today);
  const [checkOut, setCheckOut] = useState(tomorrow);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [notes, setNotes] = useState("");
  const [travelDate, setTravelDate] = useState("");
  const [justAddedSuggestion, setJustAddedSuggestion] = useState<string | null>(null);

  useEffect(() => {
    if (facilitiesCatalog.length > 0) return;
    api.getFacilities().then((f) => dispatch(setFacilities(f as any))).catch(() => { });
  }, [dispatch, facilitiesCatalog.length]);

  useEffect(() => {
    if (origin && destination) {
      setTitle(`${origin.name} to ${destination.name}`);
    }
  }, [origin?.name, destination?.name]);

  const selectedHotel = hotels.find((h) => h.id === selectedHotelId) || null;
  const hotelFacilities: Facility[] = (selectedHotel?.facilities as Facility[] | undefined) ?? [];

  const planRoute = useCallback(async () => {
    if (!origin || !destination) {
      setRouteError("Please choose both an origin and a destination.");
      return;
    }
    setRouteLoading(true);
    setRouteError(null);
    setRoute(null);
    setPois([]);

    const result = await fetchRoute(origin.lat, origin.lng, destination.lat, destination.lng, transportMode);
    setRouteLoading(false);

    if (!result) {
      setRouteError("Could not calculate a route between these locations. Try different places.");
      return;
    }
    setRoute(result);

    setPoisLoading(true);
    const samples = sampleRoute(result.coords, result.distance, 25000);
    const cumulativeDistances = new Float64Array(result.coords.length);
    cumulativeDistances[0] = 0;
    for (let i = 1; i < result.coords.length; i++) {
      cumulativeDistances[i] = cumulativeDistances[i - 1] + haversine(result.coords[i - 1][0], result.coords[i - 1][1], result.coords[i][0], result.coords[i][1]);
    }

    const fetchPOIsForRadius = async (radius: number) => {
      const results = await Promise.all(
        samples.map((sample) => fetchPOIsNear(sample.lat, sample.lng, radius).then((elements) => ({ elements }))),
      );

      const foundPois: RoutePOI[] = [];
      const seenPois = new Set<number>();

      for (const { elements } of results) {
        for (const el of elements) {
          if (seenPois.has(el.id)) continue;
          seenPois.add(el.id);
          const category = el.tags?.amenity === "fuel" ? "fuel"
            : el.tags?.amenity === "restaurant" ? "restaurant"
              : el.tags?.amenity === "cafe" ? "cafe" : "other";

          let closestIndex = 0;
          let minDistance = Infinity;
          for (let i = 0; i < result.coords.length; i++) {
            const dist = haversine(el.lat, el.lon, result.coords[i][0], result.coords[i][1]);
            if (dist < minDistance) {
              minDistance = dist;
              closestIndex = i;
            }
          }

          foundPois.push({
            name: el.tags?.name ?? el.tags?.brand ?? el.tags?.operator ?? (category === "fuel" ? "Fuel Station" : category === "restaurant" ? "Restaurant" : "Café"),
            category,
            lat: el.lat,
            lng: el.lon,
            distanceFromStart: cumulativeDistances[closestIndex],
          });
        }
      }
      return foundPois;
    };

    let found = await fetchPOIsForRadius(1200);
    if (found.length < 7) {
      found = await fetchPOIsForRadius(5000);
    }
    if (found.length < 7) {
      found = await fetchPOIsForRadius(15000);
    }

    found.sort((a, b) => a.distanceFromStart - b.distanceFromStart);
    setPois(found.slice(0, 60));
    setPoisLoading(false);
  }, [origin, destination, transportMode]);

  useEffect(() => {
    if (origin && destination) {
      planRoute();
    }
  }, [origin, destination, transportMode, planRoute]);

  const toggleCategory = (key: string) => {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const toggleFacility = (id: string) => {
    setSelectedFacilityIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const visiblePois = pois.filter((p) => activeCategories.has(p.category));
  const mapCenter: [number, number] = origin ? [origin.lat, origin.lng] : [7.8731, 80.7718];

  const HILL_COUNTRY_TOWNS = ["ella", "nuwara eliya", "badulla", "haputale", "bandarawela", "kandy", "hatton", "adam's peak"];
  const isHillCountryRoute = [origin?.name, destination?.name].some((n) =>
    n ? HILL_COUNTRY_TOWNS.some((town) => n.toLowerCase().includes(town)) : false
  );

  const handleSave = async () => {
    if (!auth.isAuthenticated) {
      setSaveError("Please log in to save your custom tour.");
      return;
    }
    if (!origin || !destination || !route) {
      setSaveError("Please plan a route first.");
      return;
    }

    if (includeHotel && selectedHotelId && checkOut <= checkIn) {
      setSaveError("Check-out date must be after check-in date.");
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const payload = {
        title: title || `${origin.name} to ${destination.name}`,
        origin: { name: origin.name, lat: origin.lat, lng: origin.lng },
        destination: { name: destination.name, lat: destination.lat, lng: destination.lng },
        waypoints: [],
        transportMode,
        routeSummary: { distanceMeters: route.distance, durationSeconds: route.duration },
        routePOIs: pois,
        hotelPackage: includeHotel && selectedHotelId ? {
          hotel: selectedHotelId,
          selectedFacilities: Array.from(selectedFacilityIds),
          checkInDate: checkIn,
          checkOutDate: checkOut,
          roomType,
          guests,
        } : null,
        tripType,
        travelDate: travelDate ? new Date(travelDate).toISOString() : undefined,
        notes,
      };
      const created = await api.createCustomTour(payload);
      dispatch(addCustomTour(created as any));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (e: any) {
      setSaveError(e.message || "Could not save your tour. Please try again.");
    } finally {
      setSaving(false);
    }
  };

function POIMarker({ poi, index, activePOIKey, cat }: { poi: any, index: number, activePOIKey: number | null, cat: any }) {
  const markerRef = useRef<L.Marker>(null);
  useEffect(() => {
    if (activePOIKey === index && markerRef.current) {
      markerRef.current.openPopup();
    }
  }, [activePOIKey, index]);

  return (
    <Marker ref={markerRef} position={[poi.lat || 0, poi.lng || 0]} icon={pointIcon(cat?.color ?? "#999", cat?.emoji ?? "📍")}>
      <MapPopup>
        <div className="p-1.5 text-sm">
          <p className="font-semibold text-ink-900">{poi.name}</p>
          <p className="text-xs text-ink-800/55 mt-0.5">
            {cat?.label} · {fmtDist(poi.distanceFromStart)} from start
          </p>
        </div>
      </MapPopup>
    </Marker>
  );
}

  return (
    <div className="min-h-screen bg-sand-50 pt-32 pb-24">
      { }
      <div className="max-w-7xl mx-auto px-5 md:px-8 mb-8">
        <div className="flex items-center gap-2 text-[10px] tracking-[0.35em] uppercase text-leaf-700 font-semibold mb-2">
          <Route className="w-3.5 h-3.5" /> Plan Your Own Trip
        </div>
        <h1 className="font-serif text-4xl md:text-5xl text-ink-900 mb-3">Create Your Own Tour</h1>
        <p className="text-ink-800/65 max-w-2xl text-sm leading-relaxed">
          Pick a starting point and a destination — for example <strong className="text-ink-900">Colombo to Anuradhapura</strong> —
          and we'll map out the route, show fuel stations, restaurants and cafés you'll pass along the way,
          and let you optionally add a hotel package with the facilities you want.
        </p>
      </div>

      { }
      <div className="max-w-7xl mx-auto px-5 md:px-8 mb-8">
        <AIRecommendations limit={4} className="p-6 rounded-3xl bg-white border border-sand-200" />
      </div>

      <div className="max-w-7xl mx-auto px-5 md:px-8 grid gap-6 lg:grid-cols-[1fr_400px]">
        { }
        <div className="flex flex-col gap-5">

          { }
          <div className="p-5 rounded-3xl bg-white border border-sand-200 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <PlaceSearch label="From" icon={MapPin} value={origin} onPick={setOrigin} color="#2b4d36" />
              <PlaceSearch label="To" icon={Navigation} value={destination} onPick={setDestination} color="#b8774a" />
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-ink-800/45 font-semibold mb-2">Transport Mode</p>
              <div className="grid grid-cols-3 gap-2">
                {([
                  ["driving", "Drive", Car],
                  ["cycling", "Cycle", Bike],
                  ["walking", "Walk", Footprints],
                ] as const).map(([mode, label, Icon]) => (
                  <button
                    key={mode}
                    onClick={() => setTransportMode(mode)}
                    className={`p-3 rounded-2xl border-2 transition-all flex items-center justify-center gap-2 ${transportMode === mode
                        ? "border-leaf-700 bg-leaf-700/5 text-leaf-700"
                        : "border-sand-200 text-ink-800/60 hover:border-ink-900/20 hover:text-ink-900 bg-white"
                      }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-semibold">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {routeLoading && (
              <div className="flex items-center justify-center gap-2 text-sm text-leaf-700">
                <RefreshCw className="w-4 h-4 animate-spin" /> Calculating live route...
              </div>
            )}

            {routeError && (
              <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-sunset-400/10 border border-sunset-400/20 text-sm text-sunset-700">
                <AlertTriangle className="w-4 h-4 shrink-0" /> {routeError}
              </div>
            )}
          </div>

          { }
          <div className="relative isolate rounded-3xl overflow-hidden border border-sand-200 shadow-lg shadow-ink-900/8" style={{ height: "min(60vh, 560px)" }}>
            <MapContainer ref={mapRef} center={mapCenter} zoom={8} className="w-full h-full" zoomControl attributionControl={false}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='© OpenStreetMap contributors'
                maxZoom={19}
              />

              {origin && (
                <Marker position={[origin.lat || 0, origin.lng || 0]} icon={endpointIcon(origin.name, "#2b4d36")}>
                  <MapPopup><div className="p-1.5 text-sm font-semibold text-ink-900">{origin.name}</div></MapPopup>
                </Marker>
              )}
              {destination && (
                <Marker position={[destination.lat || 0, destination.lng || 0]} icon={endpointIcon(destination.name, "#b8774a")}>
                  <MapPopup><div className="p-1.5 text-sm font-semibold text-ink-900">{destination.name}</div></MapPopup>
                </Marker>
              )}

              {route && (
                <>
                  <Polyline positions={route.coords} color="#ffffff" weight={8} opacity={0.6} />
                  <Polyline positions={route.coords} color="#2b4d36" weight={5} opacity={0.9} />
                  <FitBounds bounds={route.bounds} />
                </>
              )}

              {visiblePois.map((poi, i) => (
                <POIMarker 
                  key={i} 
                  poi={poi} 
                  index={i} 
                  activePOIKey={activePOIKey} 
                  cat={POI_CATEGORIES.find((c) => c.key === poi.category)} 
                />
              ))}
            </MapContainer>
          </div>

          { }
          {route && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="p-5 rounded-3xl bg-white border border-sand-200">
              <div className="flex items-center gap-4 mb-5 flex-wrap">
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-leaf-700/8 text-leaf-700 text-sm font-semibold">
                  <Ruler className="w-4 h-4" /> {fmtDist(route.distance)}
                </div>
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-sunset-400/10 text-sunset-700 text-sm font-semibold">
                  <Clock className="w-4 h-4" /> {fmtTime(route.duration)}
                </div>
                {poisLoading && (
                  <div className="flex items-center gap-2 text-sm text-ink-800/55">
                    <RefreshCw className="w-4 h-4 animate-spin text-leaf-700" /> Finding fuel stations & restaurants along the route…
                  </div>
                )}
              </div>

              { }
              <div className="mb-5">
                <TripEstimate
                  distanceMeters={route.distance}
                  transportMode={transportMode}
                  isHillCountry={isHillCountryRoute}
                />
              </div>

              { }
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                {POI_CATEGORIES.map((cat) => {
                  const active = activeCategories.has(cat.key);
                  const count = pois.filter((p) => p.category === cat.key).length;
                  return (
                    <button
                      key={cat.key}
                      onClick={() => toggleCategory(cat.key)}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-semibold transition-all border ${active ? "bg-ink-900 text-sand-50 border-ink-900" : "bg-sand-50 text-ink-800/60 border-sand-200 hover:bg-sand-100"
                        }`}
                    >
                      <span>{cat.emoji}</span> {cat.label} <span className="opacity-60">({count})</span>
                    </button>
                  );
                })}
              </div>

              { }
              {!poisLoading && visiblePois.length === 0 && (
                <p className="text-sm text-ink-800/45 text-center py-6">
                  No services found along this route within the selected categories.
                </p>
              )}
              {visiblePois.length > 0 && (
                <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                  {visiblePois.map((poi, i) => {
                    const cat = POI_CATEGORIES.find((c) => c.key === poi.category);
                    return (
                      <button 
                        key={i} 
                        onClick={() => {
                          setActivePOIKey(i);
                          if (mapRef.current) {
                            mapRef.current.flyTo([poi.lat, poi.lng], 14, { animate: true, duration: 1.5 });
                          }
                        }}
                        className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-sand-50 transition-colors"
                      >
                        <span className="text-base shrink-0 w-8 h-8 rounded-full flex items-center justify-center" style={{ background: `${cat?.color}1A` }}>{cat?.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-ink-900 truncate">{poi.name}</p>
                          <p className="text-[11px] text-ink-800/45">{cat?.label}</p>
                        </div>
                        <span className="text-xs text-ink-800/50 shrink-0">{fmtDist(poi.distanceFromStart)} in</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </div>

        { }
        <div className="flex flex-col gap-5">
          <div className="p-5 rounded-3xl bg-white border border-sand-200 lg:sticky lg:top-28">
            <p className="text-[10px] uppercase tracking-[0.3em] text-ink-800/45 font-semibold mb-3">Tour Title</p>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Colombo to Anuradhapura"
              className="w-full px-4 py-3 rounded-2xl bg-sand-50 border border-sand-200 focus:border-leaf-600 focus:outline-none text-sm text-ink-900 placeholder:text-ink-800/35 mb-5"
            />

            { }
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <HotelIcon className="w-4 h-4 text-leaf-700" />
                <p className="text-sm font-semibold text-ink-900">Add a Hotel Package</p>
              </div>
              <button
                onClick={() => setIncludeHotel((v) => !v)}
                className={`relative w-11 h-6 rounded-full transition-colors ${includeHotel ? "bg-leaf-700" : "bg-sand-200"}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${includeHotel ? "translate-x-5" : ""}`} />
              </button>
            </div>
            <p className="text-xs text-ink-800/50 mb-4 leading-relaxed">
              Completely optional — choose a hotel and pick exactly which facilities you'd like included in your package.
            </p>

            <AnimatePresence>
              {includeHotel && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden space-y-4"
                >
                  {/* Hotel select */}
                  <div>
                    <label className="text-[10px] uppercase tracking-[0.3em] text-ink-800/45 font-semibold block mb-2">Select Hotel</label>
                    <select
                      value={selectedHotelId}
                      onChange={(e) => { setSelectedHotelId(e.target.value); setSelectedFacilityIds(new Set()); }}
                      className="w-full px-4 py-3 rounded-2xl bg-sand-50 border border-sand-200 focus:border-leaf-600 focus:outline-none text-sm text-ink-900 appearance-none"
                    >
                      <option value="">Choose a hotel…</option>
                      {hotels.map((h) => (
                        <option key={h.id} value={h.id}>{h.name} — {h.location}</option>
                      ))}
                    </select>
                  </div>

                  {selectedHotel && (
                    <>
                      {/* Hotel preview */}
                      <div className="flex items-center gap-3 p-3 rounded-2xl bg-sand-50 border border-sand-200">
                        {selectedHotel.photos?.[0] && (
                          <img src={resolveMediaUrl(selectedHotel.photos[0])} alt="" className="w-14 h-14 rounded-xl object-cover bg-sand-200 shrink-0" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-ink-900 truncate">{selectedHotel.name}</p>
                          <div className="flex items-center gap-1 text-xs text-ink-800/50">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {selectedHotel.rating.toFixed(1)} · LKR {selectedHotel.pricePerNight.toLocaleString()}/night
                          </div>
                        </div>
                        <Link to={`/hotels/${selectedHotel.id}`} className="shrink-0 text-xs text-leaf-700 font-semibold hover:underline">View</Link>
                      </div>

                      {/* Dates & guests */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] uppercase tracking-[0.3em] text-ink-800/45 font-semibold block mb-1.5 flex items-center gap-1"><Calendar className="w-3 h-3" /> Check-in</label>
                          {/* FIXED — previously had no logic to advance
                              checkOut when checkIn moved past it, so an
                              invalid range (checkOut <= checkIn) could be
                              silently saved. Now mirrors BookingModel.tsx's
                              correct behavior: pushing checkOut a day past
                              the new checkIn whenever it would otherwise be
                              invalid. */}
                          <input
                            type="date"
                            value={checkIn}
                            min={today}
                            onChange={(e) => {
                              const next = e.target.value;
                              setCheckIn(next);
                              if (next >= checkOut) setCheckOut(addDaysISO(next, 1));
                            }}
                            className="w-full px-3 py-2.5 rounded-xl bg-sand-50 border border-sand-200 text-sm focus:outline-none focus:border-leaf-600"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase tracking-[0.3em] text-ink-800/45 font-semibold block mb-1.5 flex items-center gap-1"><Calendar className="w-3 h-3" /> Check-out</label>
                          <input type="date" value={checkOut} min={addDaysISO(checkIn, 1)} onChange={(e) => setCheckOut(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-sand-50 border border-sand-200 text-sm focus:outline-none focus:border-leaf-600" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] uppercase tracking-[0.3em] text-ink-800/45 font-semibold block mb-1.5">Room Type</label>
                          <select value={roomType} onChange={(e) => setRoomType(e.target.value as "standard" | "deluxe" | "suite")} className="w-full px-3 py-2.5 rounded-xl bg-sand-50 border border-sand-200 text-sm focus:outline-none focus:border-leaf-600 appearance-none">
                            <option value="standard">Standard</option>
                            <option value="deluxe">Deluxe</option>
                            <option value="suite">Suite</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] uppercase tracking-[0.3em] text-ink-800/45 font-semibold block mb-1.5 flex items-center gap-1"><Users className="w-3 h-3" /> Guests</label>
                          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-sand-50 border border-sand-200">
                            <button onClick={() => setGuests(Math.max(1, guests - 1))} className="w-6 h-6 rounded-full bg-sand-200 text-ink-800 text-xs font-bold flex items-center justify-center">−</button>
                            <span className="flex-1 text-center text-sm font-semibold text-ink-900">{guests}</span>
                            <button onClick={() => setGuests(Math.min(10, guests + 1))} className="w-6 h-6 rounded-full bg-sand-200 text-ink-800 text-xs font-bold flex items-center justify-center">+</button>
                          </div>
                        </div>
                      </div>

                      { }
                      <div>
                        <label className="text-[10px] uppercase tracking-[0.3em] text-ink-800/45 font-semibold block mb-2">
                          Select Facilities for Your Package
                        </label>
                        {hotelFacilities.length === 0 ? (
                          <p className="text-xs text-ink-800/45 py-3 text-center border border-dashed border-sand-200 rounded-xl">
                            This hotel hasn't listed any optional facilities yet.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {hotelFacilities.map((f) => {
                              const checked = selectedFacilityIds.has(f.id);
                              return (
                                <label key={f.id} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${checked ? "border-leaf-700 bg-leaf-700/5" : "border-sand-200 hover:bg-sand-50"}`}>
                                  <input type="checkbox" checked={checked} onChange={() => toggleFacility(f.id)} className="mt-0.5 accent-leaf-700" />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                      <p className="text-sm font-medium text-ink-900">{f.name}</p>
                                      {f.extraPrice > 0 ? (
                                        <span className="text-xs font-semibold text-sunset-600 shrink-0">+LKR {f.extraPrice.toLocaleString()}</span>
                                      ) : (
                                        <span className="text-xs font-semibold text-leaf-700 shrink-0">Included</span>
                                      )}
                                    </div>
                                    <p className="text-xs text-ink-800/50 mt-0.5">{f.description}</p>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Travel Date */}
            <div className="mt-6 pt-5 border-t border-sand-200">
              <label className="text-[10px] uppercase tracking-[0.3em] text-ink-800/45 font-semibold block mb-2">
                Planned Travel Date (Optional)
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-800/40" />
                <input
                  type="date"
                  value={travelDate}
                  onChange={(e) => setTravelDate(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-white border border-sand-200 text-sm focus:border-leaf-500 focus:ring-1 focus:ring-leaf-500 outline-none transition-all"
                />
              </div>
            </div>

            {/* Save button */}
            <div className="mt-6">
              <button
                onClick={handleSave}
                disabled={!route || saving}
                className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-leaf-700 text-sand-50 text-sm font-semibold hover:bg-leaf-600 transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? "Saving…" : "Save My Tour"}
              </button>
              {!auth.isAuthenticated && (
                <p className="text-xs text-ink-800/45 text-center mt-2">You'll need to log in to save your tour.</p>
              )}
              {saveError && (
                <div className="flex items-center gap-2 mt-3 px-3 py-2.5 rounded-xl bg-sunset-400/10 border border-sunset-400/20 text-xs text-sunset-700">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {saveError}
                </div>
              )}
              <AnimatePresence>
                {saveSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                    className="flex items-center gap-2 mt-3 px-3 py-2.5 rounded-xl bg-leaf-700/10 border border-leaf-700/20 text-xs text-leaf-700"
                  >
                    <CheckCircle className="w-3.5 h-3.5 shrink-0" /> Tour saved! View it in your profile under "My Tours".
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          { }
          <div className="p-5 rounded-3xl bg-leaf-700/5 border border-leaf-700/15">
            <div className="flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-leaf-700 shrink-0 mt-0.5" />
              <p className="text-xs text-ink-800/65 leading-relaxed">
                <strong className="text-ink-900">Tip:</strong> Try a longer route like <em>Colombo to Anuradhapura</em> or
                <em> Galle to Ella</em> to see fuel stations and restaurants spread along the whole journey —
                we sample the route roughly every 25&nbsp;km to find nearby services.
              </p>
            </div>
          </div>
        </div>
      </div>

      { }
      {saveSuccess && route && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-7xl mx-auto px-5 md:px-8 mt-10 grid gap-6 lg:grid-cols-2"
        >
          { }
          <div className="relative">
            {justAddedSuggestion && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 px-4 py-1.5 rounded-full bg-leaf-700 text-sand-50 text-xs font-semibold shadow-lg whitespace-nowrap">
                ✓ Added "{justAddedSuggestion}" to notes
              </div>
            )}
            <AITourSuggestions
              route={{
                origin: origin?.name ?? "Start",
                destination: destination?.name ?? "End",
                distanceKm: route.distance / 1000,
                durationHours: route.duration / 3600,
                transportMode,
                tripType,
              }}
              pois={pois}
              onAddSuggestion={(s) => {
                setNotes((prev) => (prev ? `${prev}\n• ${s.title}` : `• ${s.title}`));
                setJustAddedSuggestion(s.title);
                setTimeout(() => setJustAddedSuggestion(null), 2500);
              }}
            />
          </div>

          { }

          { }
          <TripTypeRecommendations
            className="lg:col-span-2"
            route={{
              origin: origin?.name ?? "Start",
              destination: destination?.name ?? "End",
              distanceKm: route.distance / 1000,
              durationHours: route.duration / 3600,
              transportMode,
            }}
            travelerCount={guests}
            pois={pois}
            initialTripType={tripType}
            onTripTypeChange={setTripType}
          />
        </motion.div>
      )}
    </div>
  );
}
