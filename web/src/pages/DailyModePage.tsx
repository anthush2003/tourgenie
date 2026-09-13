import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapContainer, TileLayer, Marker, Popup as MapPopup,
  Polyline, useMap, useMapEvents, ScaleControl, ZoomControl,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Navigation, Home, Building2, Utensils, CreditCard,
  Toilet, Fuel, MapPin, Car, Bike, Footprints,
  X, ChevronRight, Clock, Ruler, AlertTriangle,
  LocateFixed, Route, Info, RefreshCw, Search,
  Layers, Maximize2, Minimize2, Coffee,
  Hospital, ShoppingBag, ParkingCircle, Compass,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store";
import { setCurrentLocation } from "../store/slices/dataSlice";
import WeatherWidget from "../components/WeatherWidget";
import { DailyModeAISuggestions } from "../components/AITourSuggestions";
import TripEstimate from "../components/TripEstimate";
import { findNearbyPOIsByCategory } from "../utils/overpass";



const TILE_LAYERS = {
  street: {
    label: "Street",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
    maxZoom: 20,
  },
  satellite: {
    label: "Satellite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "© Esri, Maxar, GeoEye, Earthstar Geographics",
    maxZoom: 19,
  },
  terrain: {
    label: "Terrain",
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution: '© <a href="https://opentopomap.org">OpenTopoMap</a>',
    maxZoom: 17,
  },
  dark: {
    label: "Dark",
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/">CARTO</a>',
    maxZoom: 20,
  },
} as const;
type TileLayerKey = keyof typeof TILE_LAYERS;

const userIcon = L.divIcon({
  className: "",
  html: `<div style="position:relative;width:22px;height:22px;">
    <div style="position:absolute;inset:0;border-radius:50%;background:rgba(43,77,54,0.2);animation:pulse-ring 2s ease-out infinite;"></div>
    <div style="position:absolute;inset:3px;border-radius:50%;background:#2b4d36;border:2.5px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4);"></div>
  </div>
  <style>@keyframes pulse-ring{0%{transform:scale(1);opacity:0.8}100%{transform:scale(2.8);opacity:0}}</style>`,
  iconSize:   [22, 22],
  iconAnchor: [11, 11],
});

const destIcon = (label: string) => L.divIcon({
  className: "",
  html: `<div style="display:flex;flex-direction:column;align-items:center;gap:2px;">
    <div style="background:#e8a87c;color:#14201d;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;font-family:Inter,sans-serif;white-space:nowrap;box-shadow:0 4px 14px rgba(0,0,0,0.3);border:2px solid #d4956a;max-width:120px;overflow:hidden;text-overflow:ellipsis;">LKR ${label.length > 14 ? label.substring(0, 14) + "…" : label}</div>
    <div style="width:2px;height:8px;background:#e8a87c;border-radius:1px;"></div>
    <div style="width:8px;height:8px;border-radius:50%;background:#e8a87c;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>
  </div>`,
  iconSize:   [120, 44],
  iconAnchor: [60, 44],
});

const poiIcon = (color: string, emoji: string) => L.divIcon({
  className: "",
  html: `<div style="display:flex;flex-direction:column;align-items:center;gap:2px;">
    <div style="width:36px;height:36px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;font-size:16px;border:2.5px solid white;box-shadow:0 4px 12px rgba(0,0,0,0.3);">LKR ${emoji}</div>
    <div style="width:2px;height:5px;background:${color};border-radius:1px;"></div>
  </div>`,
  iconSize:   [36, 43],
  iconAnchor: [18, 43],
});

const POI_CATEGORIES = [
  { key: "restaurant",  label: "Food",      emoji: "🍽️",  icon: Utensils,       color: "#e8a87c", query: "amenity=restaurant" },
  { key: "cafe",        label: "Café",      emoji: "☕",  icon: Coffee,         color: "#c8a97c", query: "amenity=cafe" },
  { key: "atm",         label: "ATM",       emoji: "💳",  icon: CreditCard,     color: "#6b9e7a", query: "amenity=atm" },
  { key: "toilets",     label: "Restroom",  emoji: "🚻",  icon: Toilet,         color: "#7b9ec1", query: "amenity=toilets" },
  { key: "fuel",        label: "Fuel",      emoji: "⛽",  icon: Fuel,           color: "#c17b7b", query: "amenity=fuel" },
  { key: "hospital",    label: "Medical",   emoji: "🏥",  icon: Hospital,       color: "#e07b7b", query: "amenity=hospital" },
  { key: "supermarket", label: "Shop",      emoji: "🛒",  icon: ShoppingBag,    color: "#9b7bc1", query: "shop=supermarket" },
  { key: "parking",     label: "Parking",   emoji: "🅿️",  icon: ParkingCircle,  color: "#7b8ec1", query: "amenity=parking" },
] as const;
type POIKey = typeof POI_CATEGORIES[number]["key"];

interface POI {
  id: number;
  lat: number;
  lon: number;
  tags: Record<string, string>;
  name: string;
  distance: number;
}

interface RouteStep {
  instruction: string;
  distance: number;
  duration: number;
  type?: string;
  location?: [number, number];
}

interface RouteResult {
  coords:   [number, number][];
  distance: number;
  duration: number;
  steps:    RouteStep[];
  bounds:   [[number, number], [number, number]];
}

interface SearchResult {
  lat: number;
  lon: number;
  display_name: string;
  type: string;
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

async function fetchRoute(
  sLat: number, sLng: number,
  eLat: number, eLng: number,
  mode: "walking" | "cycling" | "driving",
): Promise<RouteResult | null> {
  const profile = mode === "walking" ? "foot" : mode === "cycling" ? "bike" : "car";
  const url =
    `https://router.project-osrm.org/route/v1/${profile}` +
    `/${sLng},${sLat};${eLng},${eLat}?steps=true&geometries=geojson&overview=full`;
  try {
    const res  = await fetch(url);
    const data = await res.json();
    if (data.code !== "Ok" || !data.routes?.[0]) return null;
    const route = data.routes[0];
    const coords: [number, number][] = route.geometry.coordinates.map(
      ([lng, lat]: [number, number]) => [lat, lng],
    );
    const steps: RouteStep[] = (route.legs?.[0]?.steps ?? []).map((s: any) => ({
      instruction: s.maneuver?.instruction ?? s.name ?? "Continue",
      distance:    s.distance,
      duration:    s.duration,
      type:        s.maneuver?.type,
      location:    s.maneuver?.location ? [s.maneuver.location[1], s.maneuver.location[0]] : undefined,
    }));

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
    return { coords, distance: route.distance, duration: route.duration, steps, bounds };
  } catch {
    return null;
  }
}

async function fetchPOIs(lat: number, lng: number, query: string, radius = 2000): Promise<POI[]> {
  return findNearbyPOIsByCategory(lat, lng, query, radius, 20);
}

async function geocodeSearch(query: string, lat: number, lng: number): Promise<SearchResult[]> {
  if (!query.trim()) return [];
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&viewbox=${lng - 1},${lat - 1},${lng + 1},${lat + 1}&bounded=0&addressdetails=0`;
  try {
    const res  = await fetch(url, { headers: { "Accept-Language": "en" } });
    const data = await res.json();
    return data.map((r: any) => ({
      lat: parseFloat(r.lat),
      lon: parseFloat(r.lon),
      display_name: r.display_name,
      type: r.type,
    }));
  } catch {
    return [];
  }
}

function FitBounds({ bounds }: { bounds: [[number, number], [number, number]] }) {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16, animate: true, duration: 1 });
  }, [bounds[0][0], bounds[0][1], bounds[1][0], bounds[1][1]]);
  return null;
}

function FlyTo({ pos, zoom }: { pos: [number, number]; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(pos, zoom ?? map.getZoom(), { animate: true, duration: 1 });
  }, [pos[0], pos[1]]);
  return null;
}

function MapClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({ click(e) { onPick(e.latlng.lat, e.latlng.lng); } });
  return null;
}

function MapRefCapture({ onReady }: { onReady: (map: L.Map) => void }) {
  const map = useMap();
  useEffect(() => { onReady(map); }, [map]);
  return null;
}

export default function DailyModePage() {
  const dispatch  = useAppDispatch();
  const auth      = useAppSelector((s) => s.auth);
  const stored    = useAppSelector((s) => s.data.currentLocation);

  const savedHome = auth.user?.savedPlaces?.home ?? null;
  const savedWork = auth.user?.savedPlaces?.work ?? null;

  const [userPos, setUserPos]             = useState<[number, number]>([stored?.lat || 7.8731, stored?.lng || 80.7718]);
  const [gpsError, setGpsError]           = useState<string | null>(null);
  const [transportMode, setTransportMode] = useState<"walking" | "cycling" | "driving">("walking");
  const [searchParams] = useSearchParams();
  const initialDestLat = searchParams.get("destLat");
  const initialDestLng = searchParams.get("destLng");
  const initialDestName = searchParams.get("destName");

  const [destination, setDestination]     = useState<{ lat: number; lng: number; label: string } | null>(
    initialDestLat && initialDestLng && initialDestName
      ? { lat: parseFloat(initialDestLat), lng: parseFloat(initialDestLng), label: initialDestName }
      : null
  );
  const [routeResult, setRouteResult]     = useState<RouteResult | null>(null);
  const [routeLoading, setRouteLoading]   = useState(false);
  const [routeError, setRouteError]       = useState(false);
  const [pois, setPois]                   = useState<POI[]>([]);
  const [poisLoading, setPoisLoading]     = useState(false);
  const [activePOIKey, setActivePOIKey]   = useState<POIKey | null>(null);
  const [weatherAlert, setWeatherAlert]   = useState<{ active: boolean; msg: string }>({ active: false, msg: "" });
  const [showSteps, setShowSteps]         = useState(false);

  const coarsePos = useMemo<[number, number]>(
    () => [Math.round(userPos[0] * 1000) / 1000, Math.round(userPos[1] * 1000) / 1000],
    [userPos],
  );

  const activeStepIndex = useMemo(() => {
    if (!routeResult || !routeResult.steps.length) return -1;
    let minD = Infinity;
    let idx = -1;
    routeResult.steps.forEach((s, i) => {
      if (s.location && s.distance > 5) {
        const d = L.latLng(userPos[0], userPos[1]).distanceTo(L.latLng(s.location[0], s.location[1]));
        if (d < minD) {
          minD = d;
          idx = i;
        }
      }
    });
    return idx;
  }, [routeResult, userPos]);

  const [tileLayer, setTileLayer]         = useState<TileLayerKey>("street");
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [isFullscreen, setIsFullscreen]   = useState(false);
  const [flyTarget, setFlyTarget]         = useState<[number, number] | null>(null);
  const [fitBounds, setFitBounds]         = useState<[[number, number],[number,number]] | null>(null);

  const [searchQuery, setSearchQuery]     = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchDrop, setShowSearchDrop] = useState(false);
  const searchTimerRef                    = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mapRef = useRef<L.Map | null>(null);

  const watchIdRef = useRef<number | null>(null);

  const getUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsError("Geolocation not supported.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude: lat, longitude: lng } }) => {
        setUserPos([lat, lng]);
        setFlyTarget([lat, lng]);
        dispatch(setCurrentLocation({ lat, lng }));
        setGpsError(null);
      },
      (err) => setGpsError(err.message),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, [dispatch]);

  useEffect(() => {
    getUserLocation();

    if (!navigator.geolocation) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      ({ coords: { latitude: lat, longitude: lng } }) => {
        setUserPos([lat, lng]);
        dispatch(setCurrentLocation({ lat, lng }));
        setGpsError(null);
      },
      (err) => setGpsError(err.message),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 },
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [dispatch, getUserLocation]);

  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (!searchQuery.trim()) { setSearchResults([]); setShowSearchDrop(false); return; }
    searchTimerRef.current = setTimeout(async () => {
      setSearchLoading(true);
      const results = await geocodeSearch(searchQuery, userPos[0], userPos[1]);
      setSearchResults(results);
      setShowSearchDrop(results.length > 0);
      setSearchLoading(false);
    }, 400);
    return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current); };
  }, [searchQuery]);

  const navigateTo = useCallback(async (lat: number, lng: number, label: string) => {
    setDestination({ lat, lng, label });
    setRouteLoading(true);
    setRouteError(false);
    setRouteResult(null);
    setShowSteps(false);
    setShowSearchDrop(false);
    setSearchQuery("");
    setActivePOIKey(null);
    setPois([]);

    const result = await fetchRoute(userPos[0], userPos[1], lat, lng, transportMode);
    setRouteLoading(false);

    if (result) {
      setRouteResult(result);
      setFitBounds(result.bounds);
      setFlyTarget(null);
    } else {
      setRouteError(true);
      setFlyTarget([lat, lng]);
    }
  }, [userPos, transportMode]);

  useEffect(() => {
    if (destination) navigateTo(destination.lat, destination.lng, destination.label);
  }, [transportMode]);

  const findNearest = useCallback(async (key: POIKey) => {
    if (activePOIKey === key) { setActivePOIKey(null); setPois([]); return; }
    const cat = POI_CATEGORIES.find((c) => c.key === key)!;
    setActivePOIKey(key);
    setPoisLoading(true);
    setPois([]);
    const results = await fetchPOIs(userPos[0], userPos[1], cat.query, 10000);
    setPois(results.slice(0, 10));
    setPoisLoading(false);
    if (results.length > 0) setFlyTarget([results[0].lat, results[0].lon]);
  }, [userPos, activePOIKey]);

  const clearRoute = () => {
    setDestination(null);
    setRouteResult(null);
    setRouteError(false);
    setFitBounds(null);
    setActivePOIKey(null);
    setPois([]);
    setFlyTarget(userPos);
  };

  const toggleFullscreen = () => {
    setIsFullscreen((v) => !v);
    setTimeout(() => mapRef.current?.invalidateSize(), 350);
  };

  const activePOICat = POI_CATEGORIES.find((c) => c.key === activePOIKey);
  const tile = TILE_LAYERS[tileLayer];

  // On mobile: full-screen height (viewport - navbar - bottom-nav).
  // On desktop: respects the fullscreen toggle.
  const mapHeight = isFullscreen
    ? "calc(100vh - 64px)"
    : typeof window !== "undefined" && window.innerWidth < 1024
    ? "calc(100dvh - 220px)"  // mobile: nearly full screen below chips+search
    : "min(65vh, 640px)";

  return (
    <div className="min-h-screen bg-sand-50 pt-16 lg:pt-32 pb-20 lg:pb-0">

      {/* Page header — desktop only */}
      <div className="hidden lg:block max-w-7xl mx-auto px-8 pt-8 pb-5">
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="flex items-center gap-2 text-[10px] tracking-[0.35em] uppercase text-leaf-700 font-semibold mb-1">
              <Navigation className="w-3.5 h-3.5" /> Daily Mode
            </div>
            <h1 className="font-serif text-4xl md:text-5xl text-ink-900">Navigate &amp; Explore</h1>
          </div>
          <button
            onClick={getUserLocation}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-sand-100 border border-sand-200 hover:bg-sand-200 transition-colors text-sm text-ink-800"
          >
            <LocateFixed className="w-4 h-4 text-leaf-700" /> Update GPS
          </button>
        </div>
        <p className="text-ink-800/60 max-w-xl text-sm leading-relaxed">
          Turn-by-turn navigation, nearby services, and saved-place shortcuts — all from one page.
        </p>
      </div>

      {/* Mobile GPS update button — top-right corner */}
      <button
        onClick={getUserLocation}
        className="lg:hidden fixed top-20 right-4 z-30 w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-lg border border-sand-200 text-leaf-700"
        title="Update GPS"
      >
        <LocateFixed className="w-5 h-5" />
      </button>

      {}
      {gpsError && (
        <div className="max-w-7xl mx-auto px-5 md:px-8 mb-4">
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-sunset-400/10 border border-sunset-400/20 text-sm text-sunset-700">
            <AlertTriangle className="w-4 h-4 shrink-0" /> {gpsError} — using last known location.
          </div>
        </div>
      )}

      {}
      <AnimatePresence>
        {weatherAlert.active && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="max-w-7xl mx-auto px-5 md:px-8 mb-4 overflow-hidden"
          >
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-sunset-400/10 border border-sunset-400/20 text-sm text-sunset-700">
              <AlertTriangle className="w-4 h-4 shrink-0" /> {weatherAlert.msg}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search bar — sticky over map on mobile, inline on desktop */}
      <div className="max-w-7xl mx-auto px-3 md:px-8 mb-3 relative z-20">
        {/* Mobile quick-action chips above search bar */}
        <div className="flex items-center gap-2 mb-2 lg:hidden overflow-x-auto pb-1 scrollbar-none">
          <Link to="/tours" className="flex items-center gap-1.5 shrink-0 px-4 py-2 rounded-full bg-white shadow-md border border-sand-200 text-xs font-semibold text-ink-800 hover:border-leaf-600 transition-colors">
            <Compass className="w-3.5 h-3.5 text-leaf-700" /> Tours
          </Link>
          <Link to="/hotels" className="flex items-center gap-1.5 shrink-0 px-4 py-2 rounded-full bg-white shadow-md border border-sand-200 text-xs font-semibold text-ink-800 hover:border-leaf-600 transition-colors">
            <Building2 className="w-3.5 h-3.5 text-leaf-700" /> Hotels
          </Link>
          <Link to="/create-tour" className="flex items-center gap-1.5 shrink-0 px-4 py-2 rounded-full bg-white shadow-md border border-sand-200 text-xs font-semibold text-ink-800 hover:border-leaf-600 transition-colors">
            <Route className="w-3.5 h-3.5 text-leaf-700" /> Create Route
          </Link>
          <button
            onClick={() => findNearest("restaurant")}
            className="flex items-center gap-1.5 shrink-0 px-4 py-2 rounded-full bg-white shadow-md border border-sand-200 text-xs font-semibold text-ink-800 hover:border-leaf-600 transition-colors"
          >
            🍽️ Food
          </button>
          <button
            onClick={() => findNearest("fuel")}
            className="flex items-center gap-1.5 shrink-0 px-4 py-2 rounded-full bg-white shadow-md border border-sand-200 text-xs font-semibold text-ink-800 hover:border-leaf-600 transition-colors"
          >
            ⛽ Fuel
          </button>
          <button
            onClick={() => findNearest("hospital")}
            className="flex items-center gap-1.5 shrink-0 px-4 py-2 rounded-full bg-white shadow-md border border-sand-200 text-xs font-semibold text-ink-800 hover:border-leaf-600 transition-colors"
          >
            🏥 Medical
          </button>
        </div>

        <div className="relative">
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white border border-sand-200 shadow-md shadow-ink-900/5 focus-within:border-leaf-600 focus-within:ring-2 focus-within:ring-leaf-600/15 transition-all">
            <Search className="w-5 h-5 text-ink-800/40 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchResults.length > 0 && setShowSearchDrop(true)}
              placeholder="Search for a place, address, or landmark…"
              className="flex-1 bg-transparent outline-none text-sm text-ink-900 placeholder:text-ink-800/35"
            />
            {searchLoading && <RefreshCw className="w-4 h-4 text-leaf-700 animate-spin shrink-0" />}
            {searchQuery && !searchLoading && (
              <button onClick={() => { setSearchQuery(""); setShowSearchDrop(false); }} className="shrink-0 text-ink-800/40 hover:text-ink-800 transition-colors">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Search dropdown */}
          <AnimatePresence>
            {showSearchDrop && searchResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl border border-sand-200 shadow-2xl shadow-ink-900/10 overflow-hidden z-50"
              >
                {searchResults.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setShowSearchDrop(false);
                      navigateTo(r.lat, r.lon, r.display_name.split(",")[0]);
                    }}
                    className="w-full flex items-start gap-3 px-4 py-3.5 hover:bg-sand-50 transition-colors text-left border-b border-sand-100 last:border-0 group"
                  >
                    <MapPin className="w-4 h-4 text-leaf-700 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink-900 truncate">
                        {r.display_name.split(",")[0]}
                      </p>
                      <p className="text-xs text-ink-800/50 truncate mt-0.5">
                        {r.display_name.split(",").slice(1, 3).join(",")}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-ink-800/20 group-hover:text-leaf-700 transition-colors shrink-0 mt-0.5" />
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {}
      <div className="max-w-7xl mx-auto px-5 md:px-8">
        <div className={`grid gap-5 ${isFullscreen ? "" : "lg:grid-cols-[1fr_370px]"}`}>

          {}
          <div className="flex flex-col gap-0">
            {}
            <div
              className="relative isolate rounded-3xl overflow-hidden border border-sand-200 shadow-lg shadow-ink-900/8"
              style={{ height: mapHeight, transition: "height 0.3s ease" }}
            >
              {}
              <MapContainer
                center={userPos}
                zoom={14}
                className="w-full h-full"
                zoomControl={false}          
                attributionControl={false}   
              >
                <MapRefCapture onReady={(m) => { mapRef.current = m; }} />

                {}
                <TileLayer
                  url={tile.url}
                  attribution={tile.attribution}
                  maxZoom={tile.maxZoom}
                />

                {}
                <ZoomControl position="bottomright" />

                {}
                <ScaleControl position="bottomleft" imperial metric />

                {}
                <Marker position={userPos} icon={userIcon}>
                  <MapPopup>
                    <div className="p-1.5 text-sm">
                      <p className="font-semibold text-ink-900 mb-0.5">📍 You are here</p>
                      <p className="text-xs text-ink-800/60 font-mono">
                        {userPos[0].toFixed(5)}, {userPos[1].toFixed(5)}
                      </p>
                    </div>
                  </MapPopup>
                </Marker>

                {}
                {destination && (
                  <Marker position={[destination.lat || 0, destination.lng || 0]} icon={destIcon(destination.label)}>
                    <MapPopup>
                      <div className="p-1.5">
                        <p className="font-semibold text-sm text-ink-900">{destination.label}</p>
                        {routeResult && (
                          <p className="text-xs text-ink-800/60 mt-0.5">
                            {fmtDist(routeResult.distance)} · {fmtTime(routeResult.duration)}
                          </p>
                        )}
                      </div>
                    </MapPopup>
                  </Marker>
                )}

                {}
                {routeResult && (
                  <>
                    <Polyline positions={routeResult.coords} color="#ffffff" weight={8} opacity={0.6} />
                    <Polyline positions={routeResult.coords} color="#2b4d36" weight={5} opacity={0.9} />
                  </>
                )}

                {}
                {pois.map((poi) => (
                  <Marker
                    key={poi.id}
                    position={[poi.lat || 0, poi.lon || 0]}
                    icon={poiIcon(activePOICat?.color ?? "#e8a87c", activePOICat?.emoji ?? "📍")}
                  >
                    <MapPopup>
                      <div className="p-2">
                        <p className="font-semibold text-sm text-ink-900">{poi.name}</p>
                        <p className="text-xs text-ink-800/60 mb-2">
                          {activePOICat?.label} · {fmtDist(poi.distance)} away
                        </p>
                        <button
                          onClick={() => navigateTo(poi.lat, poi.lon, poi.name)}
                          className="flex items-center gap-1.5 text-xs font-semibold text-leaf-700 hover:text-leaf-600 transition-colors"
                        >
                          <Navigation className="w-3 h-3" /> Navigate here
                        </button>
                      </div>
                    </MapPopup>
                  </Marker>
                ))}

                {}
                {fitBounds && <FitBounds bounds={fitBounds} />}

                {}
                {flyTarget && !fitBounds && <FlyTo pos={flyTarget} zoom={15} />}

                {}
                <MapClickHandler
                  onPick={(lat, lng) =>
                    navigateTo(lat, lng, `${lat.toFixed(4)}, ${lng.toFixed(4)}`)
                  }
                />
              </MapContainer>

              {}
              <div className="absolute top-3 left-3 flex flex-col gap-2 z-400" onClick={(e) => e.stopPropagation()}>
                {}
                <div className="relative">
                  <button
                    onClick={() => setShowLayerMenu((v) => !v)}
                    title="Change map style"
                    className="w-10 h-10 rounded-xl bg-white/95 border border-sand-200 shadow-md flex items-center justify-center hover:bg-sand-50 transition-colors"
                  >
                    <Layers className="w-4.5 h-4.5 text-ink-800" />
                  </button>
                  <AnimatePresence>
                    {showLayerMenu && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.92, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, y: -4 }}
                        className="absolute left-0 top-12 bg-white rounded-2xl border border-sand-200 shadow-xl overflow-hidden w-36"
                      >
                        {(Object.entries(TILE_LAYERS) as [TileLayerKey, typeof TILE_LAYERS[TileLayerKey]][]).map(([key, layer]) => (
                          <button
                            key={key}
                            onClick={() => { setTileLayer(key); setShowLayerMenu(false); }}
                            className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left transition-colors ${
                              tileLayer === key
                                ? "bg-leaf-700/10 text-leaf-700 font-semibold"
                                : "text-ink-800 hover:bg-sand-50"
                            }`}
                          >
                            <span className="text-base">
                              {key === "street" ? "🗺️" : key === "satellite" ? "🛰️" : key === "terrain" ? "⛰️" : "🌑"}
                            </span>
                            {layer.label}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {}
                <button
                  onClick={toggleFullscreen}
                  title={isFullscreen ? "Exit fullscreen" : "Fullscreen map"}
                  className="w-10 h-10 rounded-xl bg-white/95 border border-sand-200 shadow-md flex items-center justify-center hover:bg-sand-50 transition-colors"
                >
                  {isFullscreen
                    ? <Minimize2 className="w-4 h-4 text-ink-800" />
                    : <Maximize2 className="w-4 h-4 text-ink-800" />}
                </button>

                {}
                <button
                  onClick={() => { setFitBounds(null); setFlyTarget([...userPos]); }}
                  title="Locate me"
                  className="w-10 h-10 rounded-xl bg-white/95 border border-sand-200 shadow-md flex items-center justify-center hover:bg-sand-50 transition-colors"
                >
                  <LocateFixed className="w-4 h-4 text-leaf-700" />
                </button>
              </div>

              {}
              {routeResult && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute bottom-3 left-3 right-14 bg-white/97 backdrop-blur-xl rounded-2xl border border-sand-200 shadow-xl px-4 py-3 flex items-center gap-3 z-400"
                >
                  <div className="w-9 h-9 rounded-xl bg-leaf-700/10 text-leaf-700 flex items-center justify-center shrink-0">
                    <Route className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-ink-900 text-sm truncate leading-snug">{destination?.label}</p>
                    <p className="text-xs text-ink-800/55 mt-0.5">
                      {fmtDist(routeResult.distance)} · {fmtTime(routeResult.duration)}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowSteps(!showSteps)}
                    className="shrink-0 flex items-center gap-1 text-xs text-leaf-700 font-semibold hover:text-leaf-600 transition-colors px-2.5 py-1.5 rounded-xl bg-leaf-700/8 hover:bg-leaf-700/15"
                  >
                    <Info className="w-3.5 h-3.5" /> Steps
                  </button>
                  <button
                    onClick={clearRoute}
                    className="shrink-0 w-8 h-8 rounded-full bg-sand-100 hover:bg-sand-200 flex items-center justify-center transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              )}

              {}
              {routeLoading && (
                <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] flex items-center justify-center z-450">
                  <div className="flex items-center gap-3 bg-white border border-sand-200 rounded-2xl px-5 py-3 shadow-lg">
                    <RefreshCw className="w-4 h-4 text-leaf-700 animate-spin" />
                    <span className="text-sm font-medium text-ink-900">Calculating route…</span>
                  </div>
                </div>
              )}

              {}
              <div className="absolute bottom-0 right-0 bg-white/80 text-[9px] text-ink-800/50 px-2 py-1 rounded-tl-lg z-400">
                {tile.attribution.replace(/<[^>]*>/g, "")}
              </div>
            </div>

            {}
            <AnimatePresence>
              {showSteps && routeResult && routeResult.steps.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 p-5 rounded-3xl bg-white border border-sand-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-serif text-lg text-ink-900 flex items-center gap-2">
                        <Navigation className="w-4 h-4 text-leaf-700" />
                        Directions
                      </h3>
                      <div className="flex items-center gap-4 text-xs text-ink-800/60">
                        <span className="flex items-center gap-1.5">
                          <Ruler className="w-3.5 h-3.5 text-leaf-700" />
                          {fmtDist(routeResult.distance)}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-leaf-700" />
                          {fmtTime(routeResult.duration)}
                        </span>
                        <button
                          onClick={() => setShowSteps(false)}
                          className="w-7 h-7 rounded-full hover:bg-sand-100 flex items-center justify-center transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {}
                    <div className="mb-4">
                      <TripEstimate
                        distanceMeters={routeResult.distance}
                        transportMode={transportMode}
                      />
                    </div>

                    <div className="space-y-0 max-h-72 overflow-y-auto pr-1">
                      {routeResult.steps.filter(s => s.distance > 5).map((step, origI) => {
                        const i = routeResult.steps.indexOf(step);
                        const isActive = i === activeStepIndex;
                        return (
                        <div
                          key={i}
                          className={`flex items-start gap-3 py-3 border-b border-sand-100 last:border-0 transition-colors ${isActive ? "bg-leaf-700/10 rounded-lg px-2" : ""}`}
                        >
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${isActive ? "bg-leaf-700 text-white shadow-md" : "bg-leaf-700/10 text-leaf-700"}`}>
                            {origI + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm leading-snug ${isActive ? "text-leaf-800 font-semibold" : "text-ink-900"}`}>{step.instruction}</p>
                            <p className="text-xs text-ink-800/45 mt-0.5">
                              {fmtDist(step.distance)} · {fmtTime(step.duration)}
                            </p>
                          </div>
                        </div>
                      )})}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {}
          {!isFullscreen && (
            <div className="flex flex-col gap-4">

              {}
              <WeatherWidget
                lat={coarsePos[0]}
                lng={coarsePos[1]}
                compact
                onAlertStatus={(active, msg) => setWeatherAlert({ active, msg })}
              />

              {}
              <div className="p-4 rounded-3xl bg-white border border-sand-200">
                <p className="text-[10px] uppercase tracking-[0.3em] text-ink-800/45 font-semibold mb-3">Transport Mode</p>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    ["walking", "Walk",  Footprints],
                    ["cycling", "Cycle", Bike],
                    ["driving", "Drive", Car],
                  ] as const).map(([mode, label, Icon]) => (
                    <button
                      key={mode}
                      onClick={() => setTransportMode(mode)}
                      className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-1.5 ${
                        transportMode === mode
                          ? "border-leaf-700 bg-leaf-700/5 text-leaf-700"
                          : "border-sand-200 text-ink-800/60 hover:border-ink-900/20 hover:text-ink-900 bg-white"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-xs font-semibold">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {}
              {(savedHome || savedWork || auth.isAuthenticated) && (
                <div className="p-4 rounded-3xl bg-white border border-sand-200">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-ink-800/45 font-semibold mb-3">Quick Navigate</p>
                  <div className="grid grid-cols-2 gap-2">
                    {savedHome ? (
                      <button
                        onClick={() => navigateTo(savedHome.lat, savedHome.lng, "Home")}
                        className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-leaf-700/5 border border-leaf-700/20 hover:bg-leaf-700/10 transition-colors text-left"
                      >
                        <Home className="w-5 h-5 text-leaf-700 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-leaf-700">Home</p>
                          <p className="text-[10px] text-ink-800/50 truncate">{savedHome.address || "Saved"}</p>
                        </div>
                      </button>
                    ) : (
                      <Link to="/profile" className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-sand-50 border border-dashed border-sand-300 hover:border-leaf-600/40 transition-colors">
                        <Home className="w-5 h-5 text-ink-800/30 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-ink-800/50">Add Home</p>
                          <p className="text-[10px] text-ink-800/30">Set in profile →</p>
                        </div>
                      </Link>
                    )}

                    {savedWork ? (
                      <button
                        onClick={() => navigateTo(savedWork.lat, savedWork.lng, "Work")}
                        className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-sunset-400/5 border border-sunset-400/20 hover:bg-sunset-400/10 transition-colors text-left"
                      >
                        <Building2 className="w-5 h-5 text-sunset-600 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-sunset-600">Work</p>
                          <p className="text-[10px] text-ink-800/50 truncate">{savedWork.address || "Saved"}</p>
                        </div>
                      </button>
                    ) : (
                      <Link to="/profile" className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-sand-50 border border-dashed border-sand-300 hover:border-sunset-500/40 transition-colors">
                        <Building2 className="w-5 h-5 text-ink-800/30 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-ink-800/50">Add Work</p>
                          <p className="text-[10px] text-ink-800/30">Set in profile →</p>
                        </div>
                      </Link>
                    )}
                  </div>
                  {!auth.isAuthenticated && (
                    <p className="text-[10px] text-ink-800/40 text-center mt-2">Sign in to save places</p>
                  )}
                </div>
              )}

              {}
              <div className="p-4 rounded-3xl bg-white border border-sand-200">
                <p className="text-[10px] uppercase tracking-[0.3em] text-ink-800/45 font-semibold mb-3">Find Nearest</p>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {POI_CATEGORIES.map((cat) => {
                    const active = activePOIKey === cat.key;
                    return (
                      <button
                        key={cat.key}
                        onClick={() => findNearest(cat.key)}
                        className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl border-2 transition-all text-center ${
                          active
                            ? "border-ink-900 bg-ink-900 text-sand-50"
                            : "border-sand-200 text-ink-800/60 hover:border-ink-900/20 hover:text-ink-900 bg-white"
                        }`}
                      >
                        <span className="text-base leading-none">{cat.emoji}</span>
                        <span className="text-[9px] font-semibold leading-tight">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>

                <AnimatePresence>
                  {poisLoading && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="flex items-center gap-2 py-2 text-sm text-ink-800/60">
                      <RefreshCw className="w-4 h-4 animate-spin text-leaf-700" /> Searching nearby…
                    </motion.div>
                  )}
                  {!poisLoading && pois.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-0.5 max-h-48 overflow-y-auto">
                        {pois.map((poi) => (
                          <button
                            key={poi.id}
                            onClick={() => navigateTo(poi.lat, poi.lon, poi.name)}
                            className="w-full flex items-center gap-3 px-2.5 py-2 rounded-xl hover:bg-sand-50 transition-colors text-left group"
                          >
                            <span className="text-sm shrink-0">{activePOICat?.emoji}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-ink-900 truncate">{poi.name}</p>
                              <p className="text-[10px] text-ink-800/50">{fmtDist(poi.distance)}</p>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-ink-800/20 group-hover:text-leaf-700 transition-colors shrink-0" />
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                  {!poisLoading && activePOIKey && pois.length === 0 && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="text-xs text-ink-800/50 py-2 text-center">
                      No results within 10 km
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {}
              {routeError && (
                <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-sunset-400/10 border border-sunset-400/20 text-sm text-sunset-700">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  Routing unavailable — tap another point or check your connection.
                </div>
              )}

              {}
              <DailyModeAISuggestions
                userLat={coarsePos[0]}
                userLng={coarsePos[1]}
                weatherCode={undefined}
              />

              {}
              {!destination && !routeError && (
                <div className="flex items-start gap-2.5 px-4 py-3 rounded-2xl bg-leaf-700/5 border border-leaf-700/15">
                  <MapPin className="w-4 h-4 text-leaf-700 shrink-0 mt-0.5" />
                  <p className="text-xs text-ink-800/65 leading-relaxed">
                    <strong className="text-ink-900">Tap anywhere on the map</strong> to set a destination
                    and get turn-by-turn directions, or use the search bar above.
                  </p>
                </div>
              )}

            </div>
          )}
        </div>
      </div>

      {}
      <style>{`
        .leaflet-container {
          font-family: inherit;
          border-radius: inherit;
        }
        /* Clamp all leaflet stacking contexts to stay inside the map box */
        .leaflet-pane,
        .leaflet-tile-pane,
        .leaflet-overlay-pane,
        .leaflet-shadow-pane,
        .leaflet-marker-pane,
        .leaflet-tooltip-pane,
        .leaflet-popup-pane {
          z-index: unset;
        }
        .leaflet-control-container .leaflet-top,
        .leaflet-control-container .leaflet-bottom {
          z-index: 400;
        }
        /* Scale bar styling */
        .leaflet-control-scale-line {
          background: rgba(255,255,255,0.9);
          border: 1.5px solid rgba(43,77,54,0.4);
          border-top: none;
          color: #1c2b27;
          font-size: 10px;
          font-family: Inter, sans-serif;
          padding: 1px 5px;
          border-radius: 0 0 6px 6px;
          backdrop-filter: blur(4px);
        }
        /* Zoom control styling */
        .leaflet-control-zoom {
          border: none !important;
          box-shadow: 0 4px 16px rgba(0,0,0,0.12) !important;
          border-radius: 14px !important;
          overflow: hidden;
        }
        .leaflet-control-zoom a {
          background: rgba(255,255,255,0.96) !important;
          color: #14201d !important;
          font-size: 16px !important;
          font-weight: 600 !important;
          width: 36px !important;
          height: 36px !important;
          line-height: 36px !important;
          border: none !important;
          border-bottom: 1px solid rgba(0,0,0,0.06) !important;
          transition: background 0.15s !important;
        }
        .leaflet-control-zoom a:last-child {
          border-bottom: none !important;
        }
        .leaflet-control-zoom a:hover {
          background: #f5ebe0 !important;
          color: #2b4d36 !important;
        }
        /* Popup styling */
        .leaflet-popup-content-wrapper {
          border-radius: 16px !important;
          border: 1px solid #ead9c2 !important;
          box-shadow: 0 8px 32px rgba(0,0,0,0.14) !important;
          padding: 0 !important;
          font-family: Inter, sans-serif;
          overflow: hidden;
        }
        .leaflet-popup-content {
          margin: 0 !important;
          min-width: 160px;
        }
        .leaflet-popup-tip {
          background: white !important;
        }
        .leaflet-popup-close-button {
          color: #1c2b27 !important;
          font-size: 18px !important;
          top: 6px !important;
          right: 8px !important;
        }
        /* Attribution */
        .leaflet-control-attribution {
          display: none;
        }
      `}</style>
    </div>
  );
}
