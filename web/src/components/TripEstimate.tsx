import { useMemo, useState } from "react";
import { Fuel, ChevronDown } from "lucide-react";
import {
  VEHICLE_OPTIONS,
  VehicleCategory,
  VEHICLE_CATEGORY_LABELS,
  estimateFuelForRoute,
  formatLKR,
} from "../data/vehicleData";
import { useEffect } from "react";
import { API_ORIGIN } from "../services/config";

const CATEGORY_ORDER: VehicleCategory[] = ["car", "van", "bike", "threewheeler"];

interface TripEstimateProps {
  distanceMeters: number;
  transportMode: "driving" | "cycling" | "walking";
  isHillCountry?: boolean;
  defaultVehicleId?: string;
}

export default function TripEstimate({
  distanceMeters,
  transportMode,
  isHillCountry = false,
  defaultVehicleId,
}: TripEstimateProps) {
  const distanceKm = distanceMeters / 1000;

  const initialVehicle = useMemo(() => {
    if (defaultVehicleId) {
      const found = VEHICLE_OPTIONS.find((v) => v.id === defaultVehicleId);
      if (found) return found;
    }
    return transportMode === "cycling"
      ? VEHICLE_OPTIONS.find((v) => v.category === "bike")!
      : VEHICLE_OPTIONS.find((v) => v.id === "hybrid-hatch")!;
  }, [defaultVehicleId, transportMode]);

  const [vehicleId, setVehicleId] = useState(initialVehicle.id);
  const [pickerOpen, setPickerOpen] = useState(false);

  const vehicle = VEHICLE_OPTIONS.find((v) => v.id === vehicleId) ?? initialVehicle;

  const [livePrices, setLivePrices] = useState<{ petrol: number, diesel: number, electric?: number } | null>(null);

  useEffect(() => {
    fetch(`${API_ORIGIN}/api/fuel-prices`)
      .then(res => res.json())
      .then(data => {
        if (data && typeof data.petrol === 'number' && typeof data.diesel === 'number') {
          setLivePrices(data);
        }
      })
      .catch(() => {});
  }, []);

  const estimate = estimateFuelForRoute(vehicle, distanceKm, isHillCountry, livePrices);

  return (
    <div className="rounded-2xl bg-leaf-700/5 border border-leaf-700/15 p-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 text-leaf-700 text-xs font-semibold uppercase tracking-wide">
          <Fuel className="w-3.5 h-3.5" /> Fuel Estimate
        </div>

        {}
        <div className="relative">
          <button
            onClick={() => setPickerOpen((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-sand-200 text-xs font-medium text-ink-900 hover:border-leaf-600/40 transition-colors"
          >
            <span>{vehicle.emoji}</span> {vehicle.label} <ChevronDown className="w-3 h-3 opacity-50" />
          </button>
          {pickerOpen && (
            <div className="absolute right-0 top-full mt-1.5 z-20 w-64 max-h-72 overflow-y-auto rounded-2xl bg-white border border-sand-200 shadow-xl py-1.5">
              {CATEGORY_ORDER.map((cat) => {
                const options = VEHICLE_OPTIONS.filter((v) => v.category === cat);
                if (options.length === 0) return null;
                return (
                  <div key={cat} className="px-2 py-1">
                    <p className="text-[10px] uppercase tracking-wider text-ink-800/40 font-semibold px-2 py-1">
                      {VEHICLE_CATEGORY_LABELS[cat]}
                    </p>
                    {options.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => { setVehicleId(v.id); setPickerOpen(false); }}
                        className={`w-full flex items-center gap-2 px-2 py-2 rounded-xl text-left text-xs transition-colors ${
                          v.id === vehicleId ? "bg-leaf-700/10 text-leaf-700 font-semibold" : "hover:bg-sand-50 text-ink-800"
                        }`}
                      >
                        <span>{v.emoji}</span>
                        <span className="flex-1">
                          <span className="block font-medium">{v.label}</span>
                          <span className="block text-[10px] text-ink-800/45">{v.examples}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="text-lg font-bold text-ink-900">{estimate.avgKmPerL}</p>
          <p className="text-[10px] text-ink-800/45 uppercase tracking-wide">{estimate.fuelType === "electric" ? "km/kWh avg" : "km/L avg"}</p>
        </div>
        <div>
          <p className="text-lg font-bold text-ink-900">{estimate.litresUsed} {estimate.fuelType === "electric" ? "kWh" : "L"}</p>
          <p className="text-[10px] text-ink-800/45 uppercase tracking-wide">{estimate.fuelType} needed</p>
        </div>
        <div>
          <p className="text-lg font-bold text-leaf-700">{formatLKR(estimate.fuelCostLKR)}</p>
          <p className="text-[10px] text-ink-800/45 uppercase tracking-wide">est. cost</p>
        </div>
      </div>

      {isHillCountry && (
        <p className="text-[11px] text-ink-800/50 mt-3">
          Includes a mileage adjustment for hill-country terrain on this route.
        </p>
      )}
      <p className="text-[10px] text-ink-800/35 mt-2">
        Based on {vehicle.examples} ({vehicle.cityKmPerL[0]}–{vehicle.cityKmPerL[1]} {vehicle.fuelType === "electric" ? "km/kWh" : "km/L"} city, {vehicle.highwayKmPerL[0]}–{vehicle.highwayKmPerL[1]} {vehicle.fuelType === "electric" ? "km/kWh" : "km/L"} highway) at ~LKR {livePrices ? (livePrices[vehicle.fuelType as keyof typeof livePrices] ?? 100) : (vehicle.fuelType === "electric" ? 100 : 414)}/{vehicle.fuelType === "electric" ? "kWh" : "L"} {vehicle.fuelType}. Estimate only — actual mileage varies with load, traffic and driving style.
      </p>
    </div>
  );
}
