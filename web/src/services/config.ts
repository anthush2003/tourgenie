export const API_ORIGIN: string =
  (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.replace(/\/$/, "")) ||
  "http://localhost:5000";

export const API_BASE = `${API_ORIGIN}/api`;
