import { Link, useLocation } from "react-router-dom";
import { MapPin, Compass, Building, Route, User } from "lucide-react";
import { useAppSelector } from "../store";

const tabs = [
  { label: "Explore",  href: "/daily",       icon: MapPin    },
  { label: "Tours",    href: "/tours",        icon: Compass   },
  { label: "Hotels",   href: "/hotels",       icon: Building  },
  { label: "Create",   href: "/create-tour",  icon: Route     },
  { label: "Profile",  href: "/profile",      icon: User      },
];

export default function MobileBottomNav({
  onAuth,
}: {
  onAuth: (mode: "login" | "register") => void;
}) {
  const location = useLocation();
  const auth = useAppSelector((s) => s.auth);

  // Treat the root "/" as "Explore" being active on mobile
  const effectivePath = location.pathname === "/" ? "/daily" : location.pathname;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-sand-50/98 backdrop-blur-xl border-t border-sand-200 lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex items-center justify-around px-1 pt-1 pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isProfile = tab.href === "/profile";
          const isExplore = tab.href === "/daily";
          const active = effectivePath.startsWith(tab.href) || (tab.href === "/daily" && location.pathname === "/");

          if (isProfile && !auth.isAuthenticated) {
            return (
              <button
                key={tab.label}
                onClick={() => onAuth("login")}
                className="flex flex-col items-center gap-0.5 px-3 py-1.5 min-w-[52px]"
              >
                <div className="relative">
                  <Icon className="w-5 h-5 text-ink-800/40 transition-colors" strokeWidth={1.8} />
                </div>
                <span className="text-[10px] text-ink-800/40 font-medium tracking-wide">
                  {tab.label}
                </span>
              </button>
            );
          }

          return (
            <Link
              key={tab.label}
              to={tab.href}
              className="flex flex-col items-center gap-0.5 px-3 py-1.5 min-w-[52px] transition-all"
            >
              <div className="relative">
                {active && (
                  <span className={`absolute -inset-1.5 rounded-xl ${isExplore ? "bg-leaf-700/15" : "bg-leaf-700/10"}`} />
                )}
                <Icon
                  className={`relative w-5 h-5 transition-colors ${
                    active ? "text-leaf-700" : "text-ink-800/40"
                  }`}
                  strokeWidth={active ? 2.2 : 1.8}
                />
                {active && (
                  <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-leaf-700" />
                )}
              </div>
              <span
                className={`text-[10px] font-medium tracking-wide transition-colors ${
                  active ? "text-leaf-700" : "text-ink-800/40"
                }`}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
