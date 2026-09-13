






import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Routes, Route, Link, Outlet, useLocation } from "react-router-dom";
import { Provider, useDispatch } from "react-redux";
import store from "./store";
import { setTours, setHotels, setFacilities, setVehicles } from "./store/slices/dataSlice";

import { API_BASE } from "./services/config";


// Detect mobile once at module level (avoids repeated media-query lookups)
const isMobileDevice = () => window.matchMedia("(max-width: 1023px)").matches;

import Navbar from "./components/Navbar";
import AuthModal from "./components/AuthModel";
import TourGenieLogo from "./components/TourGenieLogo";



import MobileBottomNav from "./components/MobileBottomNav";
import Hero from "./components/Hero";
import Destinations from "./components/Destinations";
import Experiences from "./components/Experiences";
import Itinerary from "./components/Itinerary";
import Footer from "./components/Footer";


import TourGenieAI from "./components/TourGenieAI";

import ToursPage from "./pages/ToursPage";
import TourDetailPage from "./pages/TourDetailPage";
import HotelsPage from "./pages/HotelsPage";
import HotelDetailPage from "./pages/HotelDetailPage";
import ProfilePage from "./pages/ProfilePage";
import DailyModePage from "./pages/DailyModePage";
import CreateTourPage from "./pages/CreateTourPage";
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";


function Loader() {
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-100 bg-ink-900 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-cover bg-center" style={{ backgroundImage: "url(/images/hero-sigiriya.jpg)" }} />
        <div className="absolute inset-0 bg-linear-to-t from-ink-900 via-ink-900/80 to-ink-900" />
        <div className="relative text-center">
          <div className="relative w-20 h-20 mx-auto mb-5">
            <TourGenieLogo size={80} iconClassName="text-leaf-700" />
          </div>
          <h1 className="font-serif text-5xl text-sand-50 tracking-wide mb-3">TourGenie</h1>
          <p className="text-[11px] tracking-[0.5em] uppercase text-sunset-300 mb-5">Ayubowan · Welcome to Sri Lanka</p>
          <div className="h-0.5 w-48 bg-linear-to-r from-transparent via-sunset-400 to-transparent mx-auto" />
        </div>
      </div>
    </AnimatePresence>
  );
}



function Layout() {
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authOpen, setAuthOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  const dispatch = useDispatch();


  // Global custom-event handler so any component (e.g. ReviewSection) can open the Auth modal
  useEffect(() => {
    const handler = (e: Event) => {
      const mode = (e as CustomEvent).detail?.mode || "login";
      setAuthMode(mode);
      setAuthOpen(true);
    };
    window.addEventListener("open-auth-modal", handler);
    return () => window.removeEventListener("open-auth-modal", handler);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(t);
  }, []);

  
  
  
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tours, hotels, facilities, vehicles] = await Promise.all([
          fetch(`${API_BASE}/tours`).then(r => r.json()),
          fetch(`${API_BASE}/hotels`).then(r => r.json()),
          fetch(`${API_BASE}/facilities`).then(r => r.json()).catch(() => []),
          fetch(`${API_BASE}/vehicles`).then(r => r.json()).catch(() => []),
        ]);

        const extractArray = (res: any) => {
          if (Array.isArray(res)) return res;
          if (res && Array.isArray(res.data)) return res.data;
          return [];
        };

        const toursArray = extractArray(tours);
        const hotelsArray = extractArray(hotels);
        const facilitiesArray = extractArray(facilities);
        const vehiclesArray = extractArray(vehicles);

        if (toursArray.length > 0) {
          dispatch(setTours(toursArray));
        } else {
          dispatch(setTours([]));
        }

        if (hotelsArray.length > 0) {
          dispatch(setHotels(hotelsArray));
        } else {
          dispatch(setHotels([]));
        }

        if (facilitiesArray.length > 0) {
          dispatch(setFacilities(facilitiesArray));
        }

        if (vehiclesArray.length > 0) {
          dispatch(setVehicles(vehiclesArray));
        }
      } catch (_error) {
        dispatch(setTours([]));
        dispatch(setHotels([]));
      }
    };

    fetchData();
    
  }, [dispatch]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.pathname]);


  const onAuth = (mode: "login" | "register") => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  return (
    <div className="relative min-h-screen bg-sand-50">
      {loading && <Loader />}
      <Navbar onAuth={onAuth} />
      {}
      <main className="pb-20 lg:pb-0">
        <Outlet />
      </main>
      <Footer />
      <AuthModal open={authOpen} initialMode={authMode} onClose={() => setAuthOpen(false)} />
      <MobileBottomNav onAuth={onAuth} />
      {}
      <TourGenieAI />
    </div>
  );
}

function HomePage() {
  return (
    <>
      <Hero />
      <Destinations />
      <Experiences />
      <Itinerary />
    </>
  );
}

/** On mobile (< 1024 px) the home route renders the Daily/Map page (Google-Maps style).
 *  On desktop it shows the regular marketing home page. */
function SmartHomePage() {
  const [isMobile, setIsMobile] = useState(isMobileDevice);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return isMobile ? <DailyModePage /> : <HomePage />;
}

export default function App() {
  return (
    <Provider store={store}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<SmartHomePage />} />
          <Route path="/tours" element={<ToursPage />} />
          <Route path="/tours/:id" element={<TourDetailPage />} />
          <Route path="/hotels" element={<HotelsPage />} />
          <Route path="/hotels/:id" element={<HotelDetailPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/daily" element={<DailyModePage />} />
          <Route path="/create-tour" element={<CreateTourPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
          <Route
            path="*"
            element={
              <div className="pt-32 pb-20 px-5 md:px-8 max-w-7xl mx-auto min-h-screen text-center">
                <h1 className="font-serif text-5xl md:text-7xl text-ink-900 mb-3">404</h1>
                <p className="text-ink-800/70 mb-8">The place you were looking for has wandered off...</p>
                <Link to="/" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-ink-900 text-sand-50 text-sm font-semibold hover:bg-leaf-700 transition-colors">
                  ← Back to Home
                </Link>
              </div>
            }
          />
        </Route>
      </Routes>
    </Provider>
  );
}
