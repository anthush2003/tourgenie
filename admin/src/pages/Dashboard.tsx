import { useEffect, useState } from "react";
import { Building2, DollarSign, FileText, Map as MapIcon, Users } from "lucide-react";
import { Badge, Card } from "../components/ui";
import { Booking, Hotel, Tour, User, TourBooking } from "../types";
import { API, authH, cls, fmt, resolveMediaUrl } from "../utils/helpers";

export default function Dashboard({ tours, hotels, bookings, users, user }: { tours: Tour[]; hotels: Hotel[]; bookings: Booking[]; users: User[]; user: { role?: string } | null }) {
    const [tourBookings, setTourBookings] = useState<TourBooking[]>([]);
    useEffect(() => {
        fetch(`${API}/tour-bookings`, { headers: authH() })
            .then(res => res.json())
            .then(data => { 
                const arr = Array.isArray(data) ? data : (data?.data ?? []);
                setTourBookings(arr); 
            })
            .catch(() => {});
    }, []);

    const hotelRevenue = bookings.filter(b => b.status === "confirmed").reduce((s, b) => s + (b.totalPrice || 0), 0);
    const tourRevenue = tourBookings.filter(b => b.status === "confirmed").reduce((s, b) => s + (b.totalPrice || 0), 0);
    const revenue = hotelRevenue + tourRevenue;
    const totalBookingsCount = bookings.length + tourBookings.length;
    const totalConfirmedCount = bookings.filter(b => b.status === "confirmed").length + tourBookings.filter(b => b.status === "confirmed").length;
    const stats = [
            { label: "Tours", value: tours.length, icon: MapIcon, color: "bg-leaf-700", sub: "active experiences", hideForReceptionist: true },
            { label: "Hotels", value: hotels.length, icon: Building2, color: "bg-ocean-500", sub: "listed properties", hideForReceptionist: true },
            { label: "Bookings", value: totalBookingsCount, icon: FileText, color: "bg-sunset-500", sub: `${totalConfirmedCount} confirmed` },
            { label: "Revenue", value: fmt(revenue), icon: DollarSign, color: "bg-ink-800", sub: "confirmed bookings", hideForReceptionist: true },
            { label: "Users", value: users.length, icon: Users, color: "bg-leaf-600", sub: `${users.filter(u => u.role === "admin").length} admins`, hideForReceptionist: true },
          ].filter(s => !(user?.role === "receptionist" && s.hideForReceptionist));
    return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-4xl text-ink-900 mb-1">Dashboard</h1>
        <p className="text-ink-800/50 text-sm">Platform overview & quick stats</p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {(stats || []).map(s => (
          <Card key={s.label} className="p-6">
            <div className={cls("w-11 h-11 rounded-2xl flex items-center justify-center mb-4", s.color)}>
              <s.icon className="w-5 h-5 text-sand-50" />
            </div>
            <div className="text-[10px] uppercase tracking-widest text-ink-800/50 font-semibold mb-0.5">{s.label}</div>
            <div className="font-serif text-2xl text-ink-900 mb-1">{s.value}</div>
            <div className="text-[11px] text-ink-800/40">{s.sub}</div>
          </Card>
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-5">
        {user?.role !== "receptionist" && (
          <Card className="p-6">
            <h3 className="font-serif text-xl text-ink-900 mb-4">Recent Tours</h3>
            <div className="space-y-2">
              {(tours || []).slice(0, 6).map((t, i) => (
                <div key={t._id || t.id || `tour-${i}`} className="flex items-center gap-4 p-3 rounded-xl bg-sand-100">
                  {t.coverImage && (
                    <img src={resolveMediaUrl(t.coverImage)} alt="" className="w-10 h-10 rounded-xl object-cover shrink-0 bg-sand-200"
                      onError={e => (e.currentTarget.style.display = "none")} />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-ink-900 text-sm truncate">{t.title}</div>
                    <div className="text-xs text-ink-800/40">{t.location} - {t.stops?.length ?? 0} stops - -{t.rating}</div>
                  </div>
                </div>
              ))}
              {tours.length === 0 && <p className="text-sm text-ink-800/40 py-4 text-center">No tours yet</p>}
            </div>
          </Card>
        )}
        <Card className="p-6">
          <h3 className="font-serif text-xl text-ink-900 mb-4">Recent Bookings</h3>
          <div className="space-y-2">
            {(bookings || []).slice(0, 6).map((b, i) => (
              <div key={b._id || b.id || `booking-${i}`} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-sand-100">
                <div className="min-w-0">
                  <div className="font-mono text-xs text-ink-900 font-medium">{b.dummyReference}</div>
                  <div className="text-[11px] text-ink-800/40">
                    {typeof b.userId === "object" ? b.userId.name : "-"} - {b.roomType} - {fmt(b.totalPrice || 0)}
                  </div>
                </div>
                <Badge status={b.status} />
              </div>
            ))}
            {bookings.length === 0 && <p className="text-sm text-ink-800/40 py-4 text-center">No bookings yet</p>}
          </div>
        </Card>
      </div>
    </div>
    );
}
