export interface OverpassPOI {
  id: number;
  lat: number;
  lon: number;
  tags: Record<string, string>;
  name: string;
  distance: number; 
}

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.openstreetmap.ru/api/interpreter',
];

export function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

async function queryOverpass(query: string, timeoutMs = 12000): Promise<any[]> {
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      const res = await fetch(endpoint, { method: 'POST', body: query, signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) continue;
      const data = await res.json();
      return Array.isArray(data.elements) ? data.elements : [];
    } catch {
      continue; 
    }
  }
  return []; 
}


export async function findNearbyPOIs(
  lat: number,
  lng: number,
  filters: string[],
  radiusMetres = 2000,
  rawLimit = 60,
): Promise<OverpassPOI[]> {
  const clauses = filters
    .map((f) => `nwr[${f}](around:${radiusMetres},${lat},${lng});`)
    .join('\n    ');

  const query = `[out:json][timeout:20];
  (
    ${clauses}
  );
  out center ${rawLimit};`;

  const elements = await queryOverpass(query);

  const pois: OverpassPOI[] = elements
    .map((el: any) => {
      const elLat = el.lat ?? el.center?.lat;
      const elLon = el.lon ?? el.center?.lon;
      if (elLat == null || elLon == null) return null;
      return {
        id: el.id,
        lat: elLat,
        lon: elLon,
        tags: el.tags ?? {},
        name: el.tags?.name ?? el.tags?.brand ?? el.tags?.operator ?? 'Unnamed',
        distance: haversineMeters(lat, lng, elLat, elLon),
      } as OverpassPOI;
    })
    .filter((p: OverpassPOI | null): p is OverpassPOI => p !== null)
    .sort((a, b) => a.distance - b.distance);

  return pois;
}

export async function findNearbyPOIsByCategory(
  lat: number,
  lng: number,
  amenityQuery: string,
  radiusMetres = 2000,
  limit = 20,
): Promise<OverpassPOI[]> {
  const all = await findNearbyPOIs(lat, lng, [amenityQuery], radiusMetres, 60);
  return all.slice(0, limit);
}
