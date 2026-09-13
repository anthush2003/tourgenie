import { AnimatePresence, motion } from "framer-motion";
import { Building2, Car, Compass, FileText, LayoutDashboard, LogOut, Map as MapIcon, Printer, TrendingUp, UserCog, Users, Wrench } from "lucide-react";
import { cls } from "../../utils/helpers";

export default function Sidebar({ active, onSelect, onLogout, user, mobileOpen, onCloseMobile }: {
      active: string; onSelect: (k: string) => void; onLogout: () => void;
      user: { name: string, role?: string } | null; mobileOpen: boolean; onCloseMobile: () => void;
    }) {
    const filteredNav = NAV.filter(n => {
      if (user?.role === "receptionist" && n.key !== "dashboard" && n.key !== "bookings") return false;
      return true;
    });
    const inner = (
            <aside className="w-72 bg-ink-900 text-sand-50 min-h-screen p-6 flex flex-col">
              <div className="flex items-center gap-3 mb-10">
                <div className="w-10 h-10 rounded-2xl bg-linear-to-br from-sunset-400 to-sunset-600 flex items-center justify-center shadow-lg shrink-0">
                  <Compass className="w-5 h-5 text-ink-900" />
                </div>
                <div>
                  <div className="font-serif text-xl">TourGenie</div>
                  <div className="text-[10px] tracking-widest uppercase text-sand-50/40">Admin Console</div>
                </div>
              </div>
              <nav className="flex-1 space-y-1">
                {filteredNav.map(n => (
                  <button key={n.key} onClick={() => { onSelect(n.key); onCloseMobile(); }}
                    className={cls("w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all text-left",
                      active === n.key ? "bg-sand-50 text-ink-900 shadow-md" : "text-sand-50/60 hover:bg-sand-50/10 hover:text-sand-50")}>
                    <n.icon className="w-5 h-5 shrink-0" />{n.label}
                  </button>
                ))}
              </nav>
              {user && (
                <div className="border-t border-sand-50/10 pt-5 mb-3">
                  <div className="flex items-center gap-3 px-4 py-2">
                    <div className="w-9 h-9 rounded-full bg-sunset-500/30 flex items-center justify-center shrink-0">
                      <span className="text-sunset-400 font-semibold text-sm">{user.name?.[0]?.toUpperCase()}</span>
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{user.name}</div>
                      <div className="text-[10px] text-sand-50/40 uppercase tracking-wide">Administrator</div>
                    </div>
                  </div>
                </div>
              )}
              <button onClick={onLogout}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sand-50/60 hover:bg-red-900/30 hover:text-red-400 transition-all text-sm font-medium">
                <LogOut className="w-5 h-5" />Sign Out
              </button>
            </aside>
          );
    return (
    <>
      { }
      <div className="hidden lg:block sticky top-0 h-screen shrink-0">{inner}</div>
      { }
      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 lg:hidden" onClick={onCloseMobile}>
            <div className="absolute inset-0 bg-ink-900/60 backdrop-blur-sm" />
            <motion.div initial={{ x: -288 }} animate={{ x: 0 }} exit={{ x: -288 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative h-full w-72" onClick={e => e.stopPropagation()}>
              {inner}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
    );
}

export const NAV = [
      { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
      { key: "tours", label: "Tours", icon: MapIcon },
      { key: "hotels", label: "Hotels", icon: Building2 },
      { key: "vehicles", label: "Vehicles", icon: Car },
      { key: "guides", label: "Guides", icon: UserCog },
      { key: "facilities", label: "Facilities", icon: Wrench },
      { key: "bookings", label: "Bookings", icon: FileText },
      { key: "users", label: "Users", icon: Users },
      { key: "reports", label: "Reports", icon: Printer },
      { key: "analytics", label: "Analytics", icon: TrendingUp },
    ];
