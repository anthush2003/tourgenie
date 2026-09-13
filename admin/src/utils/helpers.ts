export const API_ORIGIN = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/$/, "") : "http://localhost:5000";
export const API = `${API_ORIGIN}/api`;
export const tok = () => localStorage.getItem("adminToken") ?? "";
export const authH = () => ({ Authorization: `Bearer ${tok()}`, "Content-Type": "application/json" });
export const authHFile = () => ({ Authorization: `Bearer ${tok()}` });
export const resolveMediaUrl = (p: string): string => {
      if (!p) return p;
      if (p.startsWith("http://") || p.startsWith("https://")) return p;
      if (p.startsWith("/uploads/")) {
        const baseUrl = import.meta.env.VITE_MEDIA_URL;
        if (baseUrl) return `${baseUrl.replace(/\/$/, "")}${p.replace(/^\/uploads/, "")}`;
        return `${API_ORIGIN}${p}`;
      }
      return p;
    };
export const fmt = (n: number) => {
      if (typeof n !== "number" || isNaN(n)) return "LKR 0";
      return new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR", maximumFractionDigits: 0 }).format(n);
    };
export const fmtDate = (d: string) =>
      d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "-";
export const cls = (...c: (string | false | undefined | null)[]) => c.filter(Boolean).join(" ");
export const safeMax = (...nums: number[]) => {
      const v = nums.filter(n => isFinite(n) && !isNaN(n) && n > 0);
      return v.length ? Math.max(...v) : 1;
    };
export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
