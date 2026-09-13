import { AnimatePresence } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";

import { AdminLayout } from "./components/layout/AdminLayout";
import AnalyticsSection from "./pages/AnalyticsPage";
import BookingsSection from "./pages/BookingsPage";
import Dashboard from "./pages/Dashboard";
import FacilitiesCRUD from "./pages/FacilitiesPage";
import GuidesCRUD from "./pages/GuidesPage";
import HotelsCRUD from "./pages/HotelsPage";
import Login from "./pages/Login";
import ReportsSection from "./pages/ReportsPage";
import ToursCRUD from "./pages/ToursPage";
import UsersSection from "./pages/UsersPage";
import VehiclesCRUD from "./pages/VehiclesPage";

import { Toast } from "./components/ui";
import { Booking, Hotel, Tour, User } from "./types";
import { API, authH } from "./utils/helpers";

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem("adminToken"));
  const [user, setUser] = useState<{ id: string; name: string; role: string } | null>(() => {
    try { const u = localStorage.getItem("adminUser"); return u ? JSON.parse(u) : null; } catch { return null; }
  });

  const [tours, setTours] = useState<Tour[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const navigate = useNavigate();

  const showToast = useCallback((msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const refresh = useCallback(async () => {
    if (!token) return;
    const h = { Authorization: `Bearer ${token}` };
    try {
      const [tRes, hoRes, bRes, uRes] = await Promise.all([
        fetch(`${API}/tours`),
        fetch(`${API}/hotels`),
        fetch(`${API}/admin/bookings`, { headers: h }),
        fetch(`${API}/admin/users`, { headers: h }),
      ]);

      if (bRes.status === 401 || uRes.status === 401) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        setToken(null);
        setUser(null);
        setTours([]); setHotels([]); setBookings([]); setUsers([]);
        showToast("Your session has expired — please sign in again.", "error");
        navigate("/login");
        return;
      }

      const [t, ho, b, u] = await Promise.all([
        tRes.ok ? tRes.json().catch(() => []) : [],
        hoRes.ok ? hoRes.json().catch(() => []) : [],
        bRes.ok ? bRes.json().catch(() => []) : [],
        uRes.ok ? uRes.json().catch(() => []) : [],
      ]);
      const extractArray = (res: any) => {
        if (Array.isArray(res)) return res;
        if (res && Array.isArray(res.data)) return res.data;
        return [];
      };

      setTours(extractArray(t));
      setHotels(extractArray(ho));
      setBookings(extractArray(b));
      setUsers(extractArray(u));
    } catch (e) {
      console.error("Refresh error:", e);
      showToast("Could not reach the server. Is the backend running?", "error");
    }
  }, [token, showToast, navigate]);

  useEffect(() => { if (token) refresh(); }, [token, refresh]);

  const login = (t: string, u: { id: string; name: string; role: string }) => { 
    setToken(t); 
    setUser(u);
    navigate("/");
  };
  const logout = async () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    setToken(null); setUser(null);
    setTours([]); setHotels([]); setBookings([]); setUsers([]);
    navigate("/login");
  };

  if (!token) return <Login onLogin={login} />;

  return (
    <>
      <Routes>
        <Route path="/login" element={<Login onLogin={login} />} />
        <Route path="/" element={<AdminLayout user={user} onLogout={logout} />}>
          <Route index element={<Dashboard tours={tours} hotels={hotels} bookings={bookings} users={users} user={user} />} />
          <Route path="bookings" element={<BookingsSection bookings={bookings} onRefresh={refresh} onToast={showToast} hotels={hotels} user={user} />} />
          {user?.role !== "receptionist" && (
            <>
              <Route path="tours" element={<ToursCRUD tours={tours} onRefresh={refresh} onToast={showToast} />} />
              <Route path="hotels" element={<HotelsCRUD hotels={hotels} onRefresh={refresh} onToast={showToast} />} />
              <Route path="vehicles" element={<VehiclesCRUD onToast={showToast} />} />
              <Route path="guides" element={<GuidesCRUD onToast={showToast} />} />
              <Route path="facilities" element={<FacilitiesCRUD onToast={showToast} />} />
              <Route path="users" element={<UsersSection onToast={showToast} currentUserId={user?.id ?? null} hotels={hotels} />} />
              <Route path="reports" element={<ReportsSection onToast={showToast} />} />
              <Route path="analytics" element={<AnalyticsSection tours={tours} hotels={hotels} bookings={bookings} users={users} />} />
            </>
          )}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
      <AnimatePresence>
        {toast && <Toast key="t" message={toast.msg} type={toast.type} />}
      </AnimatePresence>
    </>
  );
}