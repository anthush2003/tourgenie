import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sun, Cloud, CloudRain, CloudSnow, Zap, Wind, Droplets,
  AlertTriangle, ChevronDown, ChevronUp,
} from "lucide-react";

const WMO: Record<number, { label: string; icon: "sun" | "cloud" | "rain" | "snow" | "storm"; alert: boolean }> = {
  0:  { label: "Clear Sky",            icon: "sun",   alert: false },
  1:  { label: "Mainly Clear",         icon: "sun",   alert: false },
  2:  { label: "Partly Cloudy",        icon: "cloud", alert: false },
  3:  { label: "Overcast",             icon: "cloud", alert: false },
  45: { label: "Foggy",                icon: "cloud", alert: false },
  48: { label: "Icy Fog",              icon: "cloud", alert: false },
  51: { label: "Light Drizzle",        icon: "rain",  alert: false },
  53: { label: "Drizzle",              icon: "rain",  alert: false },
  55: { label: "Heavy Drizzle",        icon: "rain",  alert: true  },
  61: { label: "Light Rain",           icon: "rain",  alert: false },
  63: { label: "Moderate Rain",        icon: "rain",  alert: true  },
  65: { label: "Heavy Rain",           icon: "rain",  alert: true  },
  71: { label: "Light Snow",           icon: "snow",  alert: true  },
  73: { label: "Moderate Snow",        icon: "snow",  alert: true  },
  75: { label: "Heavy Snow",           icon: "snow",  alert: true  },
  80: { label: "Rain Showers",         icon: "rain",  alert: false },
  81: { label: "Heavy Showers",        icon: "rain",  alert: true  },
  82: { label: "Violent Showers",      icon: "rain",  alert: true  },
  95: { label: "Thunderstorm",         icon: "storm", alert: true  },
  96: { label: "Thunderstorm + Hail",  icon: "storm", alert: true  },
  99: { label: "Severe Thunderstorm",  icon: "storm", alert: true  },
};

function getWMO(code: number) {
  return WMO[code] ?? { label: "Variable", icon: "cloud" as const, alert: false };
}

function WIcon({ icon, className = "w-6 h-6" }: { icon: string; className?: string }) {
  switch (icon) {
    case "sun":   return <Sun className={className} />;
    case "rain":  return <CloudRain className={className} />;
    case "snow":  return <CloudSnow className={className} />;
    case "storm": return <Zap className={className} />;
    default:      return <Cloud className={className} />;
  }
}

interface CurrentWeather {
  temperature: number;
  windspeed: number;
  weathercode: number;
}

interface ForecastDay {
  date: string;
  maxTemp: number;
  minTemp: number;
  code: number;
  precipProb: number;
}

export interface WeatherWidgetProps {
  lat?: number;
  lng?: number;
  compact?: boolean;
  onAlertStatus?: (isAlert: boolean, message: string) => void;
  className?: string;
}

export default function WeatherWidget({
  lat = 7.8731,
  lng  = 80.7718,
  compact = false,
  onAlertStatus,
  className = "",
}: WeatherWidgetProps) {
  const [current, setCurrent]   = useState<CurrentWeather | null>(null);
  const [forecast, setForecast] = useState<ForecastDay[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(false);
  const [expanded, setExpanded] = useState(!compact);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);

    (async () => {
      try {
        const url =
          `https://api.open-meteo.com/v1/forecast` +
          `?latitude=${lat}&longitude=${lng}` +
          `&current_weather=true` +
          `&daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_probability_max` +
          `&timezone=auto&forecast_days=5`;

        const res = await fetch(url);
        if (!res.ok) throw new Error("weather fetch failed");
        const data = await res.json();
        if (cancelled) return;

        setCurrent(data.current_weather);

        const days: ForecastDay[] = (data.daily?.time ?? []).map((date: string, i: number) => ({
          date,
          maxTemp:    Math.round(data.daily.temperature_2m_max[i]),
          minTemp:    Math.round(data.daily.temperature_2m_min[i]),
          code:       data.daily.weathercode[i],
          precipProb: data.daily.precipitation_probability_max?.[i] ?? 0,
        }));
        setForecast(days);

        if (onAlertStatus && days.length > 0) {
          const todayInfo = getWMO(days[0].code);
          onAlertStatus(
            todayInfo.alert,
            todayInfo.alert
              ? `${todayInfo.label} forecast today — outdoor tours may be affected.`
              : "",
          );
        }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [lat, lng]);

  if (loading) {
    return (
      <div className={`p-5 rounded-[28px] bg-sand-100 border border-sand-200 animate-pulse ${className}`}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-sand-200" />
          <div className="space-y-2">
            <div className="h-7 w-20 bg-sand-200 rounded" />
            <div className="h-4 w-28 bg-sand-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !current) {
    return (
      <div className={`p-5 rounded-[28px] bg-sand-100 border border-sand-200 ${className}`}>
        <p className="text-sm text-ink-800/50 flex items-center gap-2">
          <Cloud className="w-4 h-4" /> Weather data unavailable
        </p>
      </div>
    );
  }

  const curInfo  = getWMO(current.weathercode);
  const today    = forecast[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-[28px] overflow-hidden border border-sand-200 bg-sand-50 ${className}`}
    >
      {}
      <div
        className={`p-5 flex items-center justify-between ${
          curInfo.alert
            ? "bg-linear-to-br from-sunset-500/10 to-transparent"
            : "bg-linear-to-br from-leaf-700/5 to-transparent"
        }`}
      >
        <div className="flex items-center gap-4">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
              curInfo.alert ? "bg-sunset-400/15 text-sunset-600" : "bg-leaf-700/10 text-leaf-700"
            }`}
          >
            <WIcon icon={curInfo.icon} className="w-7 h-7" />
          </div>
          <div>
            <p className="text-3xl font-semibold text-ink-900 leading-none">
              {Math.round(current.temperature)}°C
            </p>
            <p className="text-sm text-ink-800/65 mt-0.5">{curInfo.label}</p>
          </div>
        </div>

        <div className="text-right space-y-1">
          {today && (
            <p className="text-xs text-ink-800/50">
              {today.minTemp}° / {today.maxTemp}°
            </p>
          )}
          <div className="flex items-center justify-end gap-1.5 text-xs text-ink-800/50">
            <Wind className="w-3 h-3" />
            {Math.round(current.windspeed)} km/h
          </div>
          {today && today.precipProb > 20 && (
            <div className="flex items-center justify-end gap-1.5 text-xs text-blue-500">
              <Droplets className="w-3 h-3" />
              {today.precipProb}% rain
            </div>
          )}
          {compact && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-1 ml-auto flex items-center gap-1 text-[10px] text-ink-800/40 hover:text-ink-800 transition-colors"
            >
              {expanded ? (
                <><ChevronUp className="w-3.5 h-3.5" /> Hide</>
              ) : (
                <><ChevronDown className="w-3.5 h-3.5" /> Forecast</>
              )}
            </button>
          )}
        </div>
      </div>

      {}
      <AnimatePresence>
        {curInfo.alert && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-5 py-3 bg-sunset-400/10 border-t border-sunset-400/20 flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-sunset-600 shrink-0" />
              <p className="text-xs text-sunset-700 font-medium leading-relaxed">
                <strong>{curInfo.label}</strong> forecast — consider postponing outdoor activities
                or taking shelter precautions.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {}
      <AnimatePresence initial={false}>
        {(!compact || expanded) && forecast.length > 0 && (
          <motion.div
            initial={compact ? { height: 0, opacity: 0 } : false}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-4 border-t border-sand-200">
              <p className="text-[10px] uppercase tracking-[0.3em] text-ink-800/45 font-semibold mb-3">
                5-Day Forecast
              </p>
              <div className="grid grid-cols-5 gap-1">
                {(forecast || []).map((day, i) => {
                  const info = getWMO(day.code);
                  const d    = new Date(day.date + "T00:00:00");
                  const lbl  = i === 0 ? "Today" : d.toLocaleDateString("en", { weekday: "short" });
                  return (
                    <div
                      key={day.date}
                      className={`flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-xl transition-colors ${
                        i === 0 ? "bg-sand-100" : "hover:bg-sand-100/60"
                      }`}
                    >
                      <p className="text-[10px] font-semibold uppercase text-ink-800/50">{lbl}</p>
                      <WIcon
                        icon={info.icon}
                        className={`w-4 h-4 ${info.alert ? "text-sunset-500" : "text-leaf-700"}`}
                      />
                      <p className="text-xs font-semibold text-ink-900">{day.maxTemp}°</p>
                      <p className="text-[10px] text-ink-800/40">{day.minTemp}°</p>
                      {day.precipProb > 25 && (
                        <p className="text-[9px] text-blue-500 font-semibold">{day.precipProb}%</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
