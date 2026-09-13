export interface POI {
  id: number;
  lat: number;
  lon: number;
  tags: Record<string, string>;
  name: string;
  distance: number;
}

export interface RouteResult {
  coords: { latitude: number; longitude: number }[];
  distance: number;
  duration: number;
  bounds: [ { latitude: number; longitude: number }, { latitude: number; longitude: number } ];
}

export interface SearchResult {
  lat: number;
  lon: number;
  display_name: string;
  type: string;
}

export async function fetchRoute(
  sLat: number, sLng: number,
  eLat: number, eLng: number,
  mode: "walking" | "cycling" | "driving"
): Promise<RouteResult | null> {
  const profile = mode === "walking" ? "foot" : mode === "cycling" ? "bike" : "car";
  const url = `https://router.project-osrm.org/route/v1/${profile}/${sLng},${sLat};${eLng},${eLat}?steps=false&geometries=geojson&overview=full`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.code !== "Ok" || !data.routes?.[0]) return null;
    const route = data.routes[0];
    
    const coords = route.geometry.coordinates.map(([lng, lat]: [number, number]) => ({
      latitude: lat,
      longitude: lng,
    }));
    
    let minLat = Infinity, minLng = Infinity, maxLat = -Infinity, maxLng = -Infinity;
    for (const c of coords) {
      if (c.latitude < minLat) minLat = c.latitude;
      if (c.latitude > maxLat) maxLat = c.latitude;
      if (c.longitude < minLng) minLng = c.longitude;
      if (c.longitude > maxLng) maxLng = c.longitude;
    }
    
    return { 
      coords, 
      distance: route.distance, 
      duration: route.duration, 
      bounds: [
        { latitude: minLat, longitude: minLng },
        { latitude: maxLat, longitude: maxLng }
      ] 
    };
  } catch {
    return null;
  }
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}

const OVERPASS_ENDPOINTS = [
  "https://lz4.overpass-api.de/api/interpreter",
  "https://z.overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter"
];

export async function fetchPOIs(lat: number, lng: number, query: string, radius = 5000): Promise<POI[]> {
  const overpassQuery = `
    [out:json][timeout:25];
    (
      node[${query}](around:${radius},${lat},${lng});
      way[${query}](around:${radius},${lat},${lng});
    );
    out center;
  `;
  
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { 
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "TourGenieApp/1.0"
        },
        body: "data=" + encodeURIComponent(overpassQuery),
      });
      if (!res.ok) {
        console.warn(`Overpass API (${endpoint}) returned status:`, res.status);
        continue;
      }
      const data = await res.json();
      return data.elements
        .map((e: any) => {
          const ptLat = e.lat || e.center?.lat;
          const ptLon = e.lon || e.center?.lon;
          return {
            id: e.id,
            lat: ptLat,
            lon: ptLon,
            tags: e.tags || {},
            name: e.tags?.name || "Unknown Place",
            distance: calculateDistance(lat, lng, ptLat, ptLon)
          };
        })
        .filter((e: any) => e.lat && e.lon)
        .sort((a: any, b: any) => a.distance - b.distance);
    } catch (error) {
      console.warn(`Overpass API error on ${endpoint}:`, error);
    }
  }
  return [];
}

export async function geocodeSearch(query: string, lat: number, lng: number): Promise<SearchResult[]> {
  if (!query.trim()) return [];
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&viewbox=${lng - 1},${lat - 1},${lng + 1},${lat + 1}&bounded=0&addressdetails=0`;
  try {
    const res = await fetch(url, { headers: { "Accept-Language": "en" } });
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
