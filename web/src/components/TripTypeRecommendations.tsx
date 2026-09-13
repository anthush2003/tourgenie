import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, ChevronDown, ChevronUp, RefreshCw, Loader2,
  Users, Heart, Briefcase, Backpack, PartyPopper,
} from "lucide-react";
import { API_ORIGIN } from "../services/config";

export type TripType = "family" | "friends" | "couple" | "solo" | "business";

interface TripTypeOption {
  value: TripType;
  label: string;
  icon: string;
}

interface RouteInfo {
  origin: string;
  destination: string;
  distanceKm: number;
  durationHours: number;
  transportMode: "driving" | "cycling" | "walking";
}

interface POIFound {
  name: string;
  category: string;
  distanceFromStart: number;
}

interface TripRecommendation {
  type: "pacing" | "highlight" | "food" | "tip" | "warning";
  icon: string;
  title: string;
  description: string;
}

const FALLBACK_TRIP_TYPES: TripTypeOption[] = [
  { value: "family", label: "Family Trip", icon: "👨‍👩‍👧‍👦" },
  { value: "friends", label: "Trip with Friends", icon: "🎉" },
  { value: "couple", label: "Couple's Getaway", icon: "💑" },
  { value: "solo", label: "Solo Adventure", icon: "🎒" },
  { value: "business", label: "Business Trip", icon: "💼" },
];

const LUCIDE_ICON: Record<TripType, React.ComponentType<{ className?: string }>> = {
  family: Users,
  friends: PartyPopper,
  couple: Heart,
  solo: Backpack,
  business: Briefcase,
};

const COLOR_MAP: Record<string, string> = {
  pacing: "bg-blue-50 border-blue-200 text-blue-700",
  highlight: "bg-leaf-700/8 border-leaf-700/20 text-leaf-700",
  food: "bg-orange-50 border-orange-200 text-orange-700",
  tip: "bg-purple-50 border-purple-200 text-purple-700",
  warning: "bg-amber-50 border-amber-200 text-amber-700",
};

async function fetchTripTypes(): Promise<TripTypeOption[]> {
  const res = await fetch(`${API_ORIGIN}/api/ai/trip-types`);
  if (!res.ok) throw new Error("trip-types unavailable");
  const data = await res.json();
  return Array.isArray(data.tripTypes) && data.tripTypes.length ? data.tripTypes : FALLBACK_TRIP_TYPES;
}

async function fetchTripTypeRecommendations(
  tripType: TripType,
  route: RouteInfo,
  travelerCount: number,
  pois: POIFound[],
): Promise<TripRecommendation[]> {
  const res = await fetch(`${API_ORIGIN}/api/ai/trip-type-recommendations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tripType,
      origin: route.origin,
      destination: route.destination,
      distanceKm: route.distanceKm,
      durationHours: route.durationHours,
      transportMode: route.transportMode,
      travelerCount,
      pois: (pois || []).slice(0, 20).map((p) => ({
        name: p.name,
        category: p.category,
        distanceFromStart: p.distanceFromStart,
      })),
    }),
  });
  if (!res.ok) throw new Error("AI unavailable");
  const data = await res.json();
  return Array.isArray(data.recommendations) ? data.recommendations : [];
}

function TripTypeSelector({
  options,
  value,
  onChange,
}: {
  options: TripTypeOption[];
  value: TripType;
  onChange: (t: TripType) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const Icon = LUCIDE_ICON[opt.value] ?? Users;
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold border transition-all ${
              active
                ? "bg-leaf-700 border-leaf-700 text-white shadow-sm"
                : "bg-sand-50 border-sand-200 text-ink-800/70 hover:border-leaf-600/40 hover:text-ink-900"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function RecCard({ rec, index }: { rec: TripRecommendation; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay: index * 0.08 }}
      className={`flex items-start gap-3.5 p-4 rounded-2xl border ${COLOR_MAP[rec.type] || COLOR_MAP.tip}`}
    >
      <span className="text-2xl shrink-0 mt-0.5">{rec.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-ink-900 mb-1">{rec.title}</p>
        <p className="text-xs text-ink-800/65 leading-relaxed">{rec.description}</p>
      </div>
    </motion.div>
  );
}

interface TripTypeRecommendationsProps {
  route: RouteInfo;
  travelerCount?: number;
  pois?: POIFound[];
  onTripTypeChange?: (tripType: TripType) => void;
  initialTripType?: TripType;
  className?: string;
}

export default function TripTypeRecommendations({
  route,
  travelerCount = 2,
  pois = [],
  onTripTypeChange,
  initialTripType = "family",
  className = "",
}: TripTypeRecommendationsProps) {
  const [tripTypeOptions, setTripTypeOptions] = useState<TripTypeOption[]>(FALLBACK_TRIP_TYPES);
  const [tripType, setTripType] = useState<TripType>(initialTripType);
  const [recommendations, setRecommendations] = useState<TripRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);
  const [refreshCount, setRefreshCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetchTripTypes()
      .then((opts) => { if (!cancelled) setTripTypeOptions(opts); })
      .catch(() => {  });
    return () => { cancelled = true; };
  }, []);

  const activeMeta = useMemo(
    () => tripTypeOptions.find((o) => o.value === tripType) ?? FALLBACK_TRIP_TYPES[0],
    [tripTypeOptions, tripType],
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchTripTypeRecommendations(tripType, route, travelerCount, pois)
      .then((res) => { if (!cancelled) setRecommendations(res); })
      .catch(() => { if (!cancelled) setError("Couldn't load recommendations right now."); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [tripType, route.origin, route.destination, route.distanceKm, route.transportMode, travelerCount, pois, refreshCount]);

  const handleTripTypeChange = (t: TripType) => {
    setTripType(t);
    onTripTypeChange?.(t);
  };

  return (
    <div className={`rounded-3xl bg-white border border-sand-200 overflow-hidden ${className}`}>
      {}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 p-5 hover:bg-sand-50/50 transition-colors"
      >
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sunset-500 to-sunset-400 flex items-center justify-center shadow-sm shrink-0">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-semibold text-ink-900">
            Recommended for your {activeMeta.icon} {activeMeta.label}
          </p>
          <p className="text-xs text-ink-800/50">
            {loading ? "Tailoring tips to your trip…" : `${recommendations.length} tips for ${route.origin} → ${route.destination}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!loading && (
            <button
              onClick={(e) => { e.stopPropagation(); setRefreshCount((c) => c + 1); }}
              className="w-8 h-8 rounded-full hover:bg-sand-100 flex items-center justify-center transition-colors"
              title="Refresh recommendations"
            >
              <RefreshCw className="w-3.5 h-3.5 text-ink-800/50" />
            </button>
          )}
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-ink-800/40" />
          ) : (
            <ChevronDown className="w-4 h-4 text-ink-800/40" />
          )}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-4">
              {}
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-ink-800/45 font-semibold mb-2">
                  Who's travelling?
                </p>
                <TripTypeSelector
                  options={tripTypeOptions}
                  value={tripType}
                  onChange={handleTripTypeChange}
                />
              </div>

              {/* Recommendations */}
              {loading ? (
                <div className="flex items-center justify-center gap-2 py-8 text-ink-800/40 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Tailoring recommendations…
                </div>
              ) : error ? (
                <div className="text-center py-6 text-ink-800/40 text-sm italic">{error}</div>
              ) : (
                <div className="space-y-3">
                  {(recommendations || []).map((rec, i) => (
                    <RecCard key={`${tripType}-${i}-${rec.title}`} rec={rec} index={i} />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
