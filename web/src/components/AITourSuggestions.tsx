import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, MapPin, Clock, ChevronDown, ChevronUp,
  Plus, Check, Loader2, Navigation, RefreshCw,
  ArrowRight, Lightbulb, AlertTriangle,
} from "lucide-react";
import { API_ORIGIN } from "../services/config";

interface RouteInfo {
  origin: string;
  destination: string;
  distanceKm: number;
  durationHours: number;
  transportMode: "driving" | "cycling" | "walking";
  tripType: string;
}

interface POIFound {
  name: string;
  category: string;
  distanceFromStart: number;
  emoji?: string;
}

interface AISuggestion {
  type: "stop" | "tip" | "warning" | "food" | "experience";
  icon: string;
  title: string;
  description: string;
  addable?: boolean;
  added?: boolean;
}

interface AITourSuggestionsProps {
  route: RouteInfo;
  pois?: POIFound[];
  className?: string;
  onAddSuggestion?: (suggestion: AISuggestion) => void;
}

async function fetchAISuggestions(
  route: RouteInfo,
  pois: POIFound[],
): Promise<AISuggestion[]> {
  const response = await fetch(`${API_ORIGIN}/api/ai/route-suggestions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      origin: route.origin,
      destination: route.destination,
      distanceKm: route.distanceKm,
      durationHours: route.durationHours,
      transportMode: route.transportMode,
      pois: (pois || []).slice(0, 20).map(p => ({
        name: p.name,
        category: p.category,
        distanceFromStart: p.distanceFromStart,
      })),
      tripType: route.tripType,
    }),
  });

  if (!response.ok) throw new Error("AI unavailable");
  const data = await response.json();
  return Array.isArray(data.suggestions) ? data.suggestions : [];
}

function SuggestionCard({
  suggestion,
  index,
  onAdd,
}: {
  suggestion: AISuggestion;
  index: number;
  onAdd?: (s: AISuggestion) => void;
}) {
  const [added, setAdded] = useState(false);

  const colorMap: Record<string, string> = {
    stop: "bg-leaf-700/8 border-leaf-700/20 text-leaf-700",
    tip: "bg-blue-50 border-blue-200 text-blue-700",
    warning: "bg-amber-50 border-amber-200 text-amber-700",
    food: "bg-orange-50 border-orange-200 text-orange-700",
    experience: "bg-purple-50 border-purple-200 text-purple-700",
  };

  const handleAdd = () => {
    setAdded(true);
    onAdd?.(suggestion);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay: index * 0.1 }}
      className={`flex items-start gap-3.5 p-4 rounded-2xl border ${colorMap[suggestion.type] || colorMap.tip}`}
    >
      <span className="text-2xl shrink-0 mt-0.5">{suggestion.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-ink-900 mb-1">{suggestion.title}</p>
        <p className="text-xs text-ink-800/65 leading-relaxed">{suggestion.description}</p>
      </div>
      {suggestion.addable && !added && (
        <button
          onClick={handleAdd}
          className="shrink-0 w-8 h-8 rounded-xl bg-white/70 hover:bg-white border border-current/20 flex items-center justify-center transition-all hover:scale-105"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      )}
      {added && (
        <div className="shrink-0 w-8 h-8 rounded-xl bg-leaf-700/15 flex items-center justify-center">
          <Check className="w-3.5 h-3.5 text-leaf-700" />
        </div>
      )}
    </motion.div>
  );
}

export default function AITourSuggestions({
  route,
  pois = [],
  className = "",
  onAddSuggestion,
}: AITourSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);
  const [refreshCount, setRefreshCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setSuggestions([]);

    fetchAISuggestions(route, pois)
      .then(res => {
        if (!cancelled) setSuggestions(res);
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load AI suggestions right now.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [route.origin, route.destination, route.distanceKm, route.transportMode, route.tripType, pois, refreshCount]); 

  return (
    <div className={`rounded-3xl bg-white border border-sand-200 overflow-hidden ${className}`}>
      {}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-3 p-5 hover:bg-sand-50/50 transition-colors"
      >
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-leaf-700 to-leaf-600 flex items-center justify-center shadow-sm shrink-0">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-semibold text-ink-900">AI Route Suggestions</p>
          <p className="text-xs text-ink-800/50">
            {loading ? "Analysing your route…" : `${suggestions.length} personalised tips for ${route.origin} → ${route.destination}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!loading && (
            <button
              onClick={(e) => { e.stopPropagation(); setRefreshCount(c => c + 1); }}
              className="w-8 h-8 rounded-full hover:bg-sand-100 flex items-center justify-center transition-colors"
              title="Refresh suggestions"
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
            <div className="px-5 pb-5 space-y-3">
              {}
              <div className="flex flex-wrap gap-2 pb-1">
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-leaf-700/8 text-leaf-700 text-xs font-semibold">
                  <MapPin className="w-3 h-3" /> {route.origin}
                </span>
                <ArrowRight className="w-4 h-4 text-ink-800/30 self-center" />
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sunset-400/10 text-sunset-700 text-xs font-semibold">
                  <Navigation className="w-3 h-3" /> {route.destination}
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sand-100 text-ink-800/60 text-xs font-semibold">
                  <Clock className="w-3 h-3" /> ~{route.durationHours.toFixed(1)}h
                </span>
              </div>

              {}
              {loading && (
                <div className="space-y-3">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="h-20 rounded-2xl bg-sand-100 animate-pulse" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                  <div className="flex items-center gap-2 text-xs text-ink-800/50">
                    <Sparkles className="w-3.5 h-3.5 text-leaf-700 animate-pulse" />
                    Analysing route between {route.origin} and {route.destination}…
                  </div>
                </div>
              )}

              {}
              {error && !loading && (
                <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-sand-100 border border-sand-200 text-sm text-ink-800/60">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                  {error}
                  <button
                    onClick={() => setRefreshCount(c => c + 1)}
                    className="ml-auto text-leaf-700 font-semibold text-xs hover:text-leaf-600"
                  >
                    Retry
                  </button>
                </div>
              )}

              {}
              {!loading && suggestions.length > 0 && (
                <div className="space-y-2.5">
                  {(suggestions || []).map((s, i) => (
                    <SuggestionCard
                      key={i}
                      suggestion={s}
                      index={i}
                      onAdd={onAddSuggestion}
                    />
                  ))}
                </div>
              )}

              {}
              {pois.length > 0 && !loading && (
                <div className="pt-2 border-t border-sand-100">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-ink-800/40 font-semibold mb-2">
                    Found along route
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {["⛽", "🍽️", "☕"].map(emoji => {
                      const count = pois.filter(p =>
                        (emoji === "⛽" && p.category === "fuel") ||
                        (emoji === "🍽️" && p.category === "restaurant") ||
                        (emoji === "☕" && p.category === "cafe")
                      ).length;
                      if (!count) return null;
                      return (
                        <span key={emoji} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-sand-100 text-xs text-ink-800/70">
                          {emoji} {count} {emoji === "⛽" ? "fuel" : emoji === "🍽️" ? "restaurants" : "cafés"}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function DailyModeAISuggestions({
  userLat,
  userLng,
  weatherCode,
  className = "",
}: {
  userLat: number;
  userLng: number;
  weatherCode?: number;
  className?: string;
}) {
  const [tips, setTips] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const hour = new Date().getHours();
  const timeContext = hour < 11 ? "morning" : hour < 14 ? "midday" : hour < 18 ? "afternoon" : "evening";
  const weatherContext = weatherCode !== undefined
    ? (weatherCode <= 2 ? "sunny" : weatherCode <= 49 ? "cloudy" : "rainy")
    : "unknown weather";

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setTips([]);

    fetch(`${API_ORIGIN}/api/ai/daily-tips`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lat: userLat,
        lng: userLng,
        hour,
        weatherCode,
      }),
    })
      .then(r => r.json())
      .then(data => { if (!cancelled) setTips(Array.isArray(data.tips) ? data.tips : []); })
      .catch(() => { if (!cancelled) setTips([]); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [hour, weatherCode, userLat, userLng]);

  const timeEmoji = hour < 11 ? "🌅" : hour < 14 ? "☀️" : hour < 18 ? "🌤️" : "🌙";

  return (
    <div className={`rounded-3xl bg-gradient-to-br from-leaf-700/8 to-leaf-700/4 border border-leaf-700/15 overflow-hidden ${className}`}>
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-3 p-4 text-left"
      >
        <span className="text-xl shrink-0">{timeEmoji}</span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-ink-900">AI Travel Tips</p>
          <p className="text-xs text-ink-800/50">{timeContext} · {weatherContext}</p>
        </div>
        {loading ? (
          <Loader2 className="w-4 h-4 text-leaf-700 animate-spin shrink-0" />
        ) : expanded ? (
          <ChevronUp className="w-4 h-4 text-ink-800/40 shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-ink-800/40 shrink-0" />
        )}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden px-4 pb-4"
          >
            {loading && (
              <div className="space-y-2">
                {[0, 1, 2].map(i => (
                  <div key={i} className="h-5 rounded-lg bg-leaf-700/10 animate-pulse" style={{ width: `${75 + i * 10}%` }} />
                ))}
              </div>
            )}
            {!loading && tips.length > 0 && (
              <div className="space-y-2">
                {(tips || []).map((tip, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-2 text-xs text-ink-800/75 leading-relaxed"
                  >
                    <Lightbulb className="w-3.5 h-3.5 text-leaf-700 shrink-0 mt-0.5" />
                    {tip}
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
