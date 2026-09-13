export type VehicleCategory = "car" | "bike" | "threewheeler" | "van" | "bus";

export interface VehicleOption {
  id: string;
  category: VehicleCategory;
  label: string;
  emoji: string;
  
  examples: string;
  
  cityKmPerL: [number, number];
  highwayKmPerL: [number, number];
  fuelType: "petrol" | "diesel" | "electric";
}

export const VEHICLE_OPTIONS: VehicleOption[] = [
  
  {
    id: "hybrid-hatch",
    category: "car",
    label: "Hybrid Hatchback",
    emoji: "🚗",
    examples: "Toyota Aqua / Axio",
    cityKmPerL: [16, 18],
    highwayKmPerL: [22, 25],
    fuelType: "petrol",
  },
  {
    id: "budget-hatch",
    category: "car",
    label: "Budget Hatchback",
    emoji: "🚗",
    examples: "Suzuki Wagon R / Alto",
    cityKmPerL: [13, 16],
    highwayKmPerL: [17, 22],
    fuelType: "petrol",
  },
  {
    id: "sedan-sub",
    category: "car",
    label: "Subcompact Sedan",
    emoji: "🚙",
    examples: "Toyota Vitz / Yaris",
    cityKmPerL: [11, 13],
    highwayKmPerL: [15, 17],
    fuelType: "petrol",
  },
  {
    id: "sedan-standard",
    category: "car",
    label: "Standard Sedan",
    emoji: "🚙",
    examples: "Honda Civic / Toyota Corolla",
    cityKmPerL: [9, 11],
    highwayKmPerL: [13, 15],
    fuelType: "petrol",
  },
  {
    id: "suv-crossover",
    category: "car",
    label: "SUV / Crossover",
    emoji: "🚐",
    examples: "Toyota Raize / Suzuki Fronx",
    cityKmPerL: [11, 13],
    highwayKmPerL: [15, 17],
    fuelType: "petrol",
  },
  {
    id: "suv-larger",
    category: "car",
    label: "Larger SUV",
    emoji: "🚐",
    examples: "Changan Alsvin / Baic X55",
    cityKmPerL: [9, 11],
    highwayKmPerL: [13, 16],
    fuelType: "petrol",
  },
  {
    id: "van-passenger",
    category: "van",
    label: "Passenger Van",
    emoji: "🚌",
    examples: "Toyota HiAce KDH",
    cityKmPerL: [8, 10],
    highwayKmPerL: [11, 13],
    fuelType: "diesel",
  },
  {
    id: "van-cab",
    category: "van",
    label: "Double Cab / Pickup",
    emoji: "🛻",
    examples: "Toyota Hilux",
    cityKmPerL: [8, 10],
    highwayKmPerL: [12, 14],
    fuelType: "diesel",
  },

  
  {
    id: "bike-commuter",
    category: "bike",
    label: "Budget Commuter",
    emoji: "🏍️",
    examples: "Bajaj CT100 / TVS Metro (100–110cc)",
    cityKmPerL: [50, 65],
    highwayKmPerL: [60, 75],
    fuelType: "petrol",
  },
  {
    id: "bike-scooter",
    category: "bike",
    label: "Standard Scooter",
    emoji: "🛵",
    examples: "Honda Dio / Activa (110–125cc)",
    cityKmPerL: [35, 45],
    highwayKmPerL: [42, 60],
    fuelType: "petrol",
  },
  {
    id: "bike-touring",
    category: "bike",
    label: "Executive / Touring Bike",
    emoji: "🏍️",
    examples: "Bajaj Pulsar 150 / Yamaha FZ-S",
    cityKmPerL: [35, 43],
    highwayKmPerL: [42, 50],
    fuelType: "petrol",
  },
  {
    id: "bike-adventure",
    category: "bike",
    label: "Premium / Adventure Bike",
    emoji: "🏍️",
    examples: "KTM Duke / Royal Enfield Classic (200–400cc)",
    cityKmPerL: [25, 35],
    highwayKmPerL: [32, 42],
    fuelType: "petrol",
  },

  
  {
    id: "tuktuk-petrol",
    category: "threewheeler",
    label: "Tuk-Tuk (Petrol)",
    emoji: "🛺",
    examples: "Bajaj RE / TVS King",
    cityKmPerL: [22, 26],
    highwayKmPerL: [28, 33],
    fuelType: "petrol",
  },
];

export const VEHICLE_CATEGORY_LABELS: Record<VehicleCategory, string> = {
  car: "Car",
  bike: "Bike",
  threewheeler: "Tuk-Tuk",
  van: "Van",
  bus: "Bus",
};



export const FUEL_PRICES_LKR: Record<"petrol" | "diesel" | "electric", number> = {
  petrol: 414,
  diesel: 382,
  electric: 90,
};


export const RIDE_HAILING_LKR_PER_KM: Record<string, [number, number]> = {
  tuktuk: [80, 100],
  budgetCar: [110, 130],
  sedan: [130, 160],
  van: [180, 250],
};

export const SELF_DRIVE_RENTAL_LKR_PER_DAY: Record<string, [number, number]> = {
  budgetHatch: [4000, 6500],
  hybridSub: [7000, 9500],
  suvSedan: [10000, 15000],
};

export const CHAUFFEUR_LKR_PER_DAY: Record<string, [number, number]> = {
  sedan: [50, 65],
  suvVan: [70, 90],
  largeVan: [90, 120],
};


export const EFFICIENCY_FACTORS = {
  
  pillionOrLuggagePenalty: 0.12, 
  
  automaticScooterPenalty: 0.175, 
  
  hillCountryPenalty: 0.15,
};

export interface FuelEstimate {
  vehicle: VehicleOption;
  distanceKm: number;
  
  avgKmPerL: number;
  litresUsed: number;
  fuelCostLKR: number;
  fuelType: "petrol" | "diesel" | "electric";
}


export function estimateFuelForRoute(vehicle: VehicleOption, distanceKm: number, isHillCountry = false, livePrices?: { petrol: number, diesel: number, electric?: number } | null): FuelEstimate {
  const cityAvg = (vehicle.cityKmPerL[0] + vehicle.cityKmPerL[1]) / 2;
  const hwyAvg = (vehicle.highwayKmPerL[0] + vehicle.highwayKmPerL[1]) / 2;

  
  const highwayWeight = distanceKm < 15 ? 0.15 : distanceKm < 50 ? 0.55 : 0.8;
  let avgKmPerL = cityAvg * (1 - highwayWeight) + hwyAvg * highwayWeight;

  if (isHillCountry) {
    avgKmPerL *= 1 - EFFICIENCY_FACTORS.hillCountryPenalty;
  }

  const litresUsed = distanceKm / avgKmPerL;
  const price = (livePrices && livePrices[vehicle.fuelType as keyof typeof livePrices]) ? livePrices[vehicle.fuelType as keyof typeof livePrices]! : FUEL_PRICES_LKR[vehicle.fuelType];
  const fuelCostLKR = litresUsed * price;

  return {
    vehicle,
    distanceKm,
    avgKmPerL: Math.round(avgKmPerL * 10) / 10,
    litresUsed: Math.round(litresUsed * 100) / 100,
    fuelCostLKR: Math.round(fuelCostLKR),
    fuelType: vehicle.fuelType,
  };
}

export function formatLKR(n: number): string {
  return `LKR ${Math.round(n).toLocaleString("en-LK")}`;
}
