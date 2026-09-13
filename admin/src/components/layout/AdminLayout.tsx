import { Compass, Menu } from "lucide-react";
import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";

export function AdminLayout({ user, onLogout }: { user: any, onLogout: () => void }) {
  const [mobileNav, setMobileNav] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab = location.pathname.substring(1) || "dashboard";

  const handleSelect = (key: string) => {
    navigate(`/${key === "dashboard" ? "" : key}`);
  };

  return (
    <div className="flex min-h-screen bg-sand-100">
      <Sidebar
        active={activeTab}
        onSelect={handleSelect}
        onLogout={onLogout}
        user={user}
        mobileOpen={mobileNav}
        onCloseMobile={() => setMobileNav(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <div className="lg:hidden sticky top-0 z-30 bg-sand-50 border-b border-sand-200 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setMobileNav(true)} className="w-10 h-10 rounded-xl bg-sand-100 flex items-center justify-center hover:bg-sand-200 transition-colors">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-sunset-400 to-sunset-600 flex items-center justify-center">
              <Compass className="w-4 h-4 text-ink-900" />
            </div>
            <span className="font-serif text-lg text-ink-900">TourGenie Admin</span>
          </div>
        </div>

        <main className="flex-1 p-5 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
