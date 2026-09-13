import { AlertTriangle, CheckCircle, DollarSign, RefreshCw, TrendingUp, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Card } from "../components/ui";
import { Analytics, Booking, Hotel, Tour, User } from "../types";
import { API, authH, cls, fmt, MONTHS, safeMax } from "../utils/helpers";

export function BarChart({ data, max, label, color }: { data: { label: string; value: number }[]; max: number; label: string; color: string }) {
    if (!data || data.length === 0) {
    return (
      <div>
        <div className="text-xs uppercase tracking-widest text-ink-800/50 font-semibold mb-4">{label}</div>
        <p className="text-ink-800/40 text-sm py-4 text-center">No data yet</p>
      </div>
    );
    }

    const safeMax = max > 0 ? max : 1;
    return (
    <div>
      <div className="text-xs uppercase tracking-widest text-ink-800/50 font-semibold mb-4">{label}</div>
      <div className="space-y-2.5">
        {(data || []).map(d => {
          const pct = Math.max(4, ((d.value ?? 0) / safeMax) * 100);
          return (
            <div key={d.label} className="flex items-center gap-3">
              <div className="w-24 text-xs text-ink-800/60 text-right shrink-0 truncate">{d.label}</div>
              <div className="flex-1 bg-sand-200 rounded-full h-7 overflow-hidden">
                <div className={cls("h-full rounded-full flex items-center px-3 transition-all duration-700", color)}
                  style={{ width: `${pct}%` }}>
                  <span className="text-xs font-semibold text-white truncate">{d.value}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
    );
}

export default function AnalyticsSection({ tours, hotels, bookings, users }: { tours: Tour[]; hotels: Hotel[]; bookings: Booking[]; users: User[] }) {
    const [analytics, setAnalytics] = useState<Analytics | null>(null);
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
    setLoading(true); setError(false);
    fetch(`${API}/admin/analytics`, { headers: authH() })
      .then(async r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(data => setAnalytics({
        totalUsers: typeof data.totalUsers === "number" ? data.totalUsers : 0,
        totalTours: typeof data.totalTours === "number" ? data.totalTours : 0,
        totalHotels: typeof data.totalHotels === "number" ? data.totalHotels : 0,
        totalBookings: typeof data.totalBookings === "number" ? data.totalBookings : 0,
        activeBookings: typeof data.activeBookings === "number" ? data.activeBookings : 0,
        cancelledBookings: typeof data.cancelledBookings === "number" ? data.cancelledBookings : 0,
        totalRevenue: typeof data.totalRevenue === "number" ? data.totalRevenue : 0,
        totalCustomTours: typeof data.totalCustomTours === "number" ? data.totalCustomTours : 0,
        bookingsByMonth: Array.isArray(data.bookingsByMonth) ? data.bookingsByMonth : [],
        topHotels: Array.isArray(data.topHotels) ? data.topHotels : [],
        roomTypeStats: Array.isArray(data.roomTypeStats) ? data.roomTypeStats : [],
      }))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
    }, []);
    const monthData = (analytics?.bookingsByMonth ?? []).map(m => ({ label: `${MONTHS[(m._id?.month ?? 1) - 1]} ${String(m._id?.year ?? "").slice(2)}`, value: m.count ?? 0 }));
    const roomData = (analytics?.roomTypeStats ?? []).map(r => ({ label: r._id ?? "Unknown", value: r.count ?? 0 }));
    const hotelData = (analytics?.topHotels ?? []).map(h => ({ label: h.name ?? "Unknown", value: h.count ?? 0 }));
    const revenue = analytics?.totalRevenue ?? 0;
    const active = analytics?.activeBookings ?? 0;
    const cancelled = analytics?.cancelledBookings ?? 0;
    const total = analytics?.totalBookings ?? 0;
    const cancelRate = total > 0 ? `${Math.round((cancelled / total) * 100)}%` : "0%";
    const avgValue = active > 0 ? fmt(revenue / active) : fmt(0);
    if (loading) return (
    <div className="space-y-8">
      <div><h1 className="font-serif text-4xl text-ink-900">Analytics</h1></div>
      <div className="flex items-center justify-center py-32 text-ink-800/40"><RefreshCw className="w-8 h-8 animate-spin mr-3" /><span className="text-lg">Loading...</span></div>
    </div>
    );
    return (
    <div className="space-y-8">
      <div><h1 className="font-serif text-4xl text-ink-900">Analytics</h1><p className="text-ink-800/50 text-sm">Platform performance overview</p></div>
      {error && (
        <div className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0 text-amber-500" />Could not load detailed analytics. Showing local data only.
        </div>
      )}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Revenue", value: fmt(revenue), icon: DollarSign, color: "bg-leaf-700" },
          { label: "Active Bookings", value: active, icon: CheckCircle, color: "bg-ocean-500" },
          { label: "Cancellation Rate", value: cancelRate, icon: XCircle, color: "bg-sunset-500" },
          { label: "Avg Booking Value", value: avgValue, icon: TrendingUp, color: "bg-ink-800" },
        ].map(s => (
          <Card key={s.label} className="p-6">
            <div className={cls("w-11 h-11 rounded-2xl flex items-center justify-center mb-4", s.color)}>
              <s.icon className="w-5 h-5 text-sand-50" />
            </div>
            <div className="text-[10px] uppercase tracking-widest text-ink-800/50 font-semibold mb-0.5">{s.label}</div>
            <div className="font-serif text-2xl text-ink-900">{s.value}</div>
          </Card>
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-5">
        <Card className="p-6"><BarChart data={monthData} max={safeMax(...(monthData || []).map(d => d.value), 1)} label="Bookings by Month" color="bg-leaf-700" /></Card>
        <Card className="p-6"><BarChart data={hotelData} max={safeMax(...(hotelData || []).map(d => d.value), 1)} label="Top Hotels by Bookings" color="bg-ocean-500" /></Card>
        <Card className="p-6"><BarChart data={roomData} max={safeMax(...(roomData || []).map(d => d.value), 1)} label="Room Type Distribution" color="bg-sunset-500" /></Card>
        <Card className="p-6">
          <div className="text-xs uppercase tracking-widest text-ink-800/50 font-semibold mb-4">Platform Summary</div>
          <div className="space-y-4">
            {[
              { label: "Tours listed", value: analytics?.totalTours ?? tours.length, max: Math.max(50, (analytics?.totalTours ?? tours.length) + 10) },
              { label: "Hotels listed", value: analytics?.totalHotels ?? hotels.length, max: Math.max(30, (analytics?.totalHotels ?? hotels.length) + 10) },
              { label: "Total users", value: analytics?.totalUsers ?? users.length, max: Math.max(200, (analytics?.totalUsers ?? users.length) + 50) },
              { label: "Total bookings", value: analytics?.totalBookings ?? bookings.length, max: Math.max(100, (analytics?.totalBookings ?? bookings.length) + 20) },
              { label: "Custom tours", value: analytics?.totalCustomTours ?? 0, max: Math.max(50, (analytics?.totalCustomTours ?? 0) + 10) },
            ].map(r => {
              const pct = Math.max(4, (r.value / r.max) * 100);
              return (
                <div key={r.label} className="flex items-center gap-3">
                  <div className="w-28 text-xs text-ink-800/60 shrink-0">{r.label}</div>
                  <div className="flex-1 bg-sand-200 rounded-full h-6 overflow-hidden">
                    <div className="h-full rounded-full bg-ink-800 flex items-center px-3 transition-all duration-700" style={{ width: `${pct}%` }}>
                      <span className="text-xs font-semibold text-sand-50">{r.value}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
    );
}
