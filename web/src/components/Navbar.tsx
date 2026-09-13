import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Compass, Building, LayoutGrid, Navigation, Route } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAppSelector } from "../store";
import TourGenieLogo from "./TourGenieLogo";

const navLinks = [
  { label: "Discover", href: "/", icon: LayoutGrid },
  { label: "Tours", href: "/tours", icon: Compass },
  { label: "Hotels", href: "/hotels", icon: Building },
  { label: "Daily", href: "/daily", icon: Navigation },
  { label: "Create Tour", href: "/create-tour", icon: Route },
];

export default function Navbar({ onAuth }: { onAuth: (mode: "login" | "register") => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const auth = useAppSelector((s) => s.auth);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 left-0 right-0 z-60 transition-all duration-500 ${scrolled
          ? "bg-sand-50/90 backdrop-blur-xl border-b border-sand-200/60 py-3"
          : "py-5"
        }`}
    >
      <div className="max-w-7xl mx-auto px-5 md:px-8 flex items-center justify-between">
        { }
        <Link to="/" className="flex items-center gap-2.5 group">
          <TourGenieLogo size={40} animated />
          <div className="flex flex-col leading-none">
            <span className="font-serif text-xl tracking-wide text-ink-900">
              TourGenie
            </span>
            <span className="text-[9px] tracking-[0.25em] uppercase text-leaf-700 mt-0.5">
              Sri Lanka · AI Travel
            </span>
          </div>
        </Link>

        { }
        <nav className="hidden lg:flex items-center gap-7">
          {navLinks
            .map((l) => {
              const Icon = l.icon;
              const active = location.pathname === l.href;
              return (
                <Link
                  key={l.label}
                  to={l.href}
                  className={`relative flex items-center gap-1.5 text-sm font-medium transition-colors ${active ? "text-sunset-600" : "text-ink-800 hover:text-sunset-600"
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  {l.label}
                  {active && (
                    <span className="absolute -bottom-1.5 left-0 w-full h-0.5 bg-sunset-500 rounded-full" />
                  )}
                </Link>
              );
            })}
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          {auth.isAuthenticated ? (
            <Link
              to="/profile"
              className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-sand-100 hover:bg-sand-200 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-linear-to-br from-leaf-500 to-leaf-700 flex items-center justify-center text-sand-50 text-xs font-semibold">
                {auth.user?.name?.charAt(0).toUpperCase() || "U"}
              </div>
              <span className="text-sm font-medium text-ink-800">
                {auth.user?.name?.split(" ")[0] || "My Profile"}
              </span>
            </Link>
          ) : (
            <>
              <button
                onClick={() => onAuth("login")}
                className="px-5 py-2.5 rounded-full text-sm font-medium text-ink-800 hover:text-sunset-600 transition-colors"
              >
                Login
              </button>
              <button
                onClick={() => onAuth("register")}
                className="px-6 py-2.5 rounded-full bg-ink-900 text-sand-50 text-sm font-medium hover:bg-leaf-700 transition-colors shadow-lg shadow-ink-900/20"
              >
                Get Started
              </button>
            </>
          )}
        </div>

        { }
        <button
          onClick={() => setOpen(!open)}
          className="lg:hidden w-10 h-10 flex items-center justify-center rounded-full bg-ink-900/5 hover:bg-ink-900/10"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="lg:hidden overflow-hidden bg-sand-50/98 backdrop-blur-xl border-t border-sand-200"
          >
            <div className="px-6 py-6 flex flex-col gap-1">
              {navLinks
                .map((l) => {
                  const Icon = l.icon;
                  const active = location.pathname === l.href;
                  return (
                    <Link
                      key={l.label}
                      to={l.href}
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-3 py-3 px-4 rounded-xl font-medium transition-colors ${active
                          ? "bg-sunset-500/10 text-sunset-600"
                          : "text-ink-800 hover:bg-sand-100"
                        }`}
                    >
                      <Icon className="w-5 h-5" />
                      {l.label}
                    </Link>
                  );
                })}
              <div className="mt-4 pt-4 border-t border-sand-200 flex flex-col gap-2">
                {auth.isAuthenticated ? (
                  <Link
                    to="/profile"
                    onClick={() => setOpen(false)}
                    className="w-full px-5 py-3.5 rounded-full bg-ink-900 text-sand-50 text-sm font-medium text-center"
                  >
                    {auth.user?.name}
                  </Link>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setOpen(false);
                        onAuth("login");
                      }}
                      className="w-full px-5 py-3 rounded-full border border-ink-900/20 text-ink-800 text-sm font-medium"
                    >
                      Login
                    </button>
                    <button
                      onClick={() => {
                        setOpen(false);
                        onAuth("register");
                      }}
                      className="w-full px-5 py-3 rounded-full bg-ink-900 text-sand-50 text-sm font-medium"
                    >
                      Get Started
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}