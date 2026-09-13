import { API_BASE, API_ORIGIN } from './config';
import { findNearbyPOIsByCategory } from '../utils/overpass';
export { API_ORIGIN };

export const resolveMediaUrl = (path: string): string => {
  if (!path) return undefined as unknown as string;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('/uploads/')) return `${API_ORIGIN}${path}`;
  return path;
};

const getToken = (): string | null => localStorage.getItem('token');

const getAuthHeader = (): Record<string, string> => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  const contentType = res.headers.get('content-type') || '';
  let data: unknown = null;
  if (contentType.includes('application/json')) {
    try {
      data = await res.json();
    } catch {
      data = null;
    }
  } else {
    try {
      const text = await res.text();
      data = text ? { message: text } : null;
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    const errMsg = (data as any)?.message || `HTTP error ${res.status}`;
    if (res.status === 403 && errMsg.toLowerCase().includes('deactivated')) {
      localStorage.removeItem('token');
      localStorage.removeItem('tourgenie_state_v1');
      window.location.href = '/login';
    }
    throw new Error(errMsg);
  }
  return data as T;
}

export const api = {
  async register(data: { name: string; email: string; password: string }) {
    return request<{ token: string; user: Record<string, unknown> }>(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  async login(data: { email: string; password: string }) {
    return request<{ token: string; user: Record<string, unknown> }>(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  async googleAuth(data: { token: string }) {
    return request<{ token: string; user: Record<string, unknown> }>(`${API_BASE}/auth/google-auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  async forgotPassword(data: { email: string }) {
    return request<{ message: string }>(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  async resetPassword(resetToken: string, data: { password: string }) {
    return request<{ token: string; user: Record<string, unknown> }>(`${API_BASE}/auth/reset-password/${resetToken}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  async changePassword(data: Record<string, string>) {
    return request<any>(`${API_BASE}/auth/me/password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
  },

  async updateUser(data: Record<string, unknown>) {
    return request<{ user: Record<string, unknown> }>(`${API_BASE}/auth/me`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
  },

  async toggleSavedPlace(type: 'tour' | 'hotel', id: string) {
    return request<{ user: Record<string, unknown> }>(`${API_BASE}/auth/saved/${type}/${id}`, {
      method: 'POST',
      headers: getAuthHeader(),
    });
  },

  async getTours() {
    return request<unknown[]>(`${API_BASE}/tours`);
  },

  async getTour(id: string) {
    return request<unknown>(`${API_BASE}/tours/${id}`);
  },

  async getHotels() {
    return request<unknown[]>(`${API_BASE}/hotels`);
  },

  async createBooking(data: Record<string, unknown>) {
    return request<unknown>(`${API_BASE}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
  },

  async getUserBookings() {
    return request<unknown[]>(`${API_BASE}/bookings/user`, {
      headers: getAuthHeader(),
    });
  },

  async cancelBooking(id: string) {
    return request<unknown>(`${API_BASE}/bookings/${id}/cancel`, {
      method: 'PUT',
      headers: getAuthHeader(),
    });
  },

  async getWeather(lat: number, lng: number) {
    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${lat}&longitude=${lng}` +
      `&current_weather=true` +
      `&daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_probability_max` +
      `&timezone=auto&forecast_days=5`;

    const res = await fetch(url);
    if (!res.ok) throw new Error('Weather fetch failed');
    return res.json() as Promise<{
      current_weather: { temperature: number; windspeed: number; weathercode: number };
      daily: {
        time: string[];
        temperature_2m_max: number[];
        temperature_2m_min: number[];
        weathercode: number[];
        precipitation_probability_max: number[];
      };
    }>;
  },

  async getRoute(
    startLat: number, startLng: number,
    endLat: number,   endLng: number,
    transportMode: 'walking' | 'cycling' | 'driving' = 'driving',
  ) {
    const profile = transportMode === 'walking' ? 'foot' : transportMode === 'cycling' ? 'bike' : 'car';
    const url =
      `https://router.project-osrm.org/route/v1/${profile}` +
      `/${startLng},${startLat};${endLng},${endLat}` +
      `?steps=true&geometries=geojson&overview=full`;

    const res = await fetch(url);
    if (!res.ok) throw new Error('Routing fetch failed');
    return res.json() as Promise<{
      code: string;
      routes: Array<{
        distance: number;
        duration: number;
        geometry: { coordinates: [number, number][] };
        legs: Array<{
          steps: Array<{
            distance: number;
            duration: number;
            name: string;
            maneuver: { instruction: string; type: string };
          }>;
        }>;
      }>;
    }>;
  },

  async getRouteViaBackend(
    startLat: number, startLng: number,
    endLat: number,   endLng: number,
    mode = 'driving-car',
  ) {
    return request<unknown>(
      `${API_BASE}/navigation/route?startLat=${startLat}&startLng=${startLng}&endLat=${endLat}&endLng=${endLng}&mode=${mode}`,
    );
  },

  async findNearbyPOIs(
    lat: number,
    lng: number,
    amenityQuery: string,
    radiusMetres = 1500,
  ) {
    return findNearbyPOIsByCategory(lat, lng, amenityQuery, radiusMetres, 20);
  },

  async getRecommendations() {
    return request<unknown[]>(`${API_BASE}/recommendations`, {
      headers: getAuthHeader(),
    });
  },

  async getFacilities() {
    return request<unknown[]>(`${API_BASE}/facilities`);
  },

  async createCustomTour(data: Record<string, unknown>) {
    return request<unknown>(`${API_BASE}/custom-tours`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
  },

  async getMyCustomTours(page = 1, limit = 20) {
    return request<{ data: Record<string, unknown>[]; total: number; page: number; pages: number }>(
      `${API_BASE}/custom-tours/mine?page=${page}&limit=${limit}`,
      { headers: getAuthHeader() },
    );
  },

  async getCustomTour(id: string) {
    return request<unknown>(`${API_BASE}/custom-tours/${id}`, { headers: getAuthHeader() });
  },

  async updateCustomTour(id: string, data: Record<string, unknown>) {
    return request<unknown>(`${API_BASE}/custom-tours/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
  },

  async deleteCustomTour(id: string) {
    return request<unknown>(`${API_BASE}/custom-tours/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });
  },

  async getVehicles() {
    return request<unknown[]>(`${API_BASE}/vehicles`);
  },

  async getVehicle(id: string) {
    return request<unknown>(`${API_BASE}/vehicles/${id}`);
  },

  async getGuides() {
    return request<unknown[]>(`${API_BASE}/guides`);
  },

  async getGuide(id: string) {
    return request<unknown>(`${API_BASE}/guides/${id}`);
  },

  async createTourBooking(data: { tourId: string; vehicleId?: string | null; guideId?: string | null; travelDate: string; travelers: number; tierName?: string }) {
    return request<unknown>(`${API_BASE}/tour-bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
  },

  async getUserTourBookings() {
    return request<unknown[]>(`${API_BASE}/tour-bookings/user`, {
      headers: getAuthHeader(),
    });
  },

  async cancelTourBooking(id: string) {
    return request<unknown>(`${API_BASE}/tour-bookings/${id}/cancel`, {
      method: 'PUT',
      headers: getAuthHeader(),
    });
  },

  async checkAvailability(date: string, tourId?: string) {
    const url = tourId 
      ? `${API_BASE}/tour-bookings/availability?date=${date}&tourId=${tourId}`
      : `${API_BASE}/tour-bookings/availability?date=${date}`;
    return request<{ bookedVehicleIds: string[]; bookedGuideIds: string[]; bookedSeats?: number }>(
      url
    );
  },

  async uploadPhotos(category: 'tours' | 'hotels' | 'facilities' | 'vehicles' | 'misc', files: FileList | File[]) {
    const formData = new FormData();
    Array.from(files).forEach((f) => formData.append('files', f));
    const res = await fetch(`${API_BASE}/upload/${category}`, {
      method: 'POST',
      headers: getAuthHeader(), 
      body: formData,
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.message || 'Upload failed');
    return data as { urls: string[]; count: number };
  },

  async subscribeNewsletter(email: string) {
    return request<{ message: string; alreadySubscribed?: boolean }>(`${API_BASE}/newsletter/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, source: 'footer' }),
    });
  },

  async getReviews(targetType: 'Tour' | 'Hotel', targetId: string) {
    return request<{ data: unknown[]; total: number; page: number; pages: number }>(`${API_BASE}/reviews/${targetType}/${targetId}`);
  },

  async createReview(data: { targetType: 'Tour' | 'Hotel'; targetId: string; rating: number; comment: string }) {
    return request<unknown>(`${API_BASE}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
  },

  async deleteReview(id: string) {
    return request<unknown>(`${API_BASE}/reviews/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });
  },
};
