import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Send, Loader2, MapPin,
  Route, RotateCcw, ChevronRight, Navigation,
  Hotel as HotelIcon,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAppSelector } from "../store";
import { API_ORIGIN } from "../services/config";
import TourGenieLogo from "./TourGenieLogo";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  actions?: Action[];
  suggestions?: Suggestion[];
  sentiment?: "very_negative" | "negative" | "neutral" | "positive" | "very_positive";
}

interface Action {
  label: string;
  href: string;
  icon: React.ElementType;
}

interface Suggestion {
  title: string;
  subtitle: string;
  href: string;
}

const API_BASE = API_ORIGIN;

function getSessionId(): string {
  const KEY = "tg_ai_session_id";
  let id = sessionStorage.getItem(KEY);
  if (!id) {
    id = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem(KEY, id);
  }
  return id;
}

const QUICK_PROMPTS = [
  { label: "Best tours to visit?" },
  { label: "Plan a route for me" },
  { label: "Find hotels nearby" },
  { label: "Best time to visit?" },
  { label: "Local food to try?" },
  { label: "How do I create a tour?" },
];

const ACTION_HINT_MAP: Record<string, Action> = {
  "create-tour": { label: "Create Tour", href: "/create-tour", icon: Route },
  "daily-mode": { label: "Daily Mode", href: "/daily", icon: Navigation },
  "hotels": { label: "Browse Hotels", href: "/hotels", icon: HotelIcon },
  "tours": { label: "Browse Tours", href: "/tours", icon: MapPin },
  "profile": { label: "My Profile", href: "/profile", icon: MapPin },
};

function actionsFromHints(hints?: string[]): Action[] {
  if (!hints || hints.length === 0) return [];
  return (hints || []).map(h => ACTION_HINT_MAP[h]).filter(Boolean).slice(0, 2);
}

function parseActions(text: string): Action[] {
  const actions: Action[] = [];
  const lower = text.toLowerCase();
  if (lower.includes("create") && (lower.includes("tour") || lower.includes("route"))) {
    actions.push({ label: "Create Tour", href: "/create-tour", icon: Route });
  }
  if (lower.includes("daily mode") || lower.includes("navigate") || lower.includes("navigation")) {
    actions.push({ label: "Daily Mode", href: "/daily", icon: Navigation });
  }
  if (lower.includes("hotel") || lower.includes("stay") || lower.includes("accommodation")) {
    actions.push({ label: "Browse Hotels", href: "/hotels", icon: HotelIcon });
  }
  if ((lower.includes("tour") || lower.includes("browse")) && !lower.includes("create")) {
    actions.push({ label: "Browse Tours", href: "/tours", icon: MapPin });
  }
  return actions.slice(0, 2);
}

function parseSuggestions(text: string): Suggestion[] {
  const suggestions: Suggestion[] = [];
  const lower = text.toLowerCase();
  if (lower.includes("galle") || lower.includes("fort")) {
    suggestions.push({ title: "Galle Fort Sunset", subtitle: "Guided walking tour", href: "/tours" });
  }
  if (lower.includes("safari") || lower.includes("yala")) {
    suggestions.push({ title: "Yala Safari", subtitle: "Leopards & Sunrise", href: "/tours" });
  }
  if (lower.includes("kandy") || lower.includes("temple")) {
    suggestions.push({ title: "Kandy Temple", subtitle: "Evening & Cultural Show", href: "/tours" });
  }
  return suggestions.slice(0, 2);
}

function Bubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  const isConcerned = !isUser && (msg.sentiment === "negative" || msg.sentiment === "very_negative");
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      {!isUser && (
        <div className="shrink-0 mt-0.5">
          <TourGenieLogo size={28} />
        </div>
      )}
      <div className={`flex flex-col gap-2 max-w-[85%] ${isUser ? "items-end" : "items-start"}`}>
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${isUser
          ? "bg-leaf-700 text-white rounded-tr-sm"
          : isConcerned
            ? "bg-amber-50 border border-amber-200 text-ink-900 rounded-tl-sm shadow-sm"
            : "bg-white border border-sand-200 text-ink-900 rounded-tl-sm shadow-sm"
          }`}>
          {(msg.content || "").split("\n").map((line, i, arr) => (
            <span key={i}>
              {line.split(/\*\*(.*?)\*\*/g).map((part, j) =>
                j % 2 === 1 ? <strong key={j}>{part}</strong> : part
              )}
              {i < arr.length - 1 && <br />}
            </span>
          ))}
        </div>
        {msg.actions && msg.actions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {(msg.actions || []).map((a, i) => {
              const Icon = a.icon;
              return (
                <Link
                  key={i}
                  to={a.href}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-sand-200 text-ink-800 text-xs font-semibold hover:bg-leaf-700 hover:text-white hover:border-leaf-700 transition-all shadow-sm"
                >
                  <Icon className="w-3 h-3" /> {a.label}
                </Link>
              );
            })}
          </div>
        )}
        {msg.suggestions && msg.suggestions.length > 0 && (
          <div className="flex flex-col gap-1.5 w-full">
            {(msg.suggestions || []).map((s, i) => (
              <Link
                key={i}
                to={s.href}
                className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-sand-200 hover:border-leaf-600/30 hover:shadow-md transition-all group shadow-sm"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink-900 truncate">{s.title}</p>
                  <p className="text-xs text-ink-800/55 truncate">{s.subtitle}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-ink-800/20 group-hover:text-leaf-700 transition-colors shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function Typing() {
  return (
    <div className="flex gap-2.5">
      <TourGenieLogo size={28} />
      <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-white border border-sand-200 shadow-sm flex items-center gap-1">
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-leaf-700/40"
            animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>
    </div>
  );
}

export default function TourGenieAI() {
  const location = useLocation();
  const tours = useAppSelector(s => s.data.tours);
  const hotels = useAppSelector(s => s.data.hotels);
  const auth = useAppSelector(s => s.auth);
  const currentLocation = useAppSelector(s => s.data.currentLocation);

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 250);
  }, [open]);

  useEffect(() => {
    if (open && !loading) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [loading, open]);

  useEffect(() => {
    if (!auth.isAuthenticated) {
      setMessages([]);
      sessionStorage.removeItem("tg_ai_session_id");
    }
  }, [auth.isAuthenticated]);

  useEffect(() => {
    if (open && messages.length === 0) {
      const name = auth.user?.name?.split(" ")[0];
      setMessages([{
        id: "welcome",
        role: "assistant",
        content: `Ayubowan${name ? ` ${name}` : ""}! I'm your TourGenie AI assistant.\n\nI can help you discover Sri Lanka tours, plan routes, find hotels, and give local travel tips. What would you like to explore?`,
        actions: [
          { label: "Browse Tours", href: "/tours", icon: MapPin },
          { label: "Create Tour", href: "/create-tour", icon: Route },
        ],
      }]);
    }
  }, [open, messages.length, auth.user?.name]);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: trimmed };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: (updatedMessages || []).map(m => ({ role: m.role, content: m.content })),
          context: {
            page: location.pathname,
            userName: auth.user?.name || null,
            location: currentLocation || null,
            sessionId: getSessionId(),
            tours: (tours || []).slice(0, 10).map(t => ({
              title: t.title,
              location: t.location,
              duration: t.duration,
              rating: t.rating,
            })),
            hotels: (hotels || []).slice(0, 6).map(h => ({
              name: h.name,
              location: h.location,
              pricePerNight: h.pricePerNight,
              rating: h.rating,
            })),
          },
        }),
      });

      if (!res.ok) throw new Error("Server error");
      const data = await res.json();
      const reply = data.reply || "I couldn't get a response. Please try again!";
      const meta = data.meta as { actions?: string[]; suggestions?: Suggestion[]; sentiment?: { label?: Message["sentiment"] } } | undefined;

      const typingDelay = Math.min(1100, Math.max(280, reply.length * 4));
      await new Promise(r => setTimeout(r, typingDelay));

      const backendActions = actionsFromHints(meta?.actions);
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: reply,
        actions: backendActions.length > 0 ? backendActions : parseActions(reply),
        suggestions: meta?.suggestions?.length ? meta.suggestions : parseSuggestions(reply),
        sentiment: meta?.sentiment?.label,
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch {
      const offlineReplies: Record<string, string> = {
        default: "I'm having trouble connecting right now - make sure the TourGenie backend is running, then try again!",
      };
      const lower = trimmed.toLowerCase();
      let reply = offlineReplies.default;
      if (lower.includes("tour")) reply = "Browse the Tours page to see all available Sri Lanka tours!";
      if (lower.includes("hotel")) reply = "Check out the Hotels page for accommodation across Sri Lanka!";
      if (lower.includes("route") || lower.includes("create")) reply = "Use Create Tour to plan your custom Sri Lanka route!";

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: reply,
      }]);
    } finally {
      setLoading(false);
    }
  }, [messages, loading, location.pathname, auth.user, currentLocation, tours, hotels]);

  const handleSubmit = () => {
    if (input.trim()) { sendMessage(input); setInput(""); }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
  };

  const clearChat = () => {
    const name = auth.user?.name?.split(" ")[0];
    setMessages([{
      id: "welcome",
      role: "assistant",
      content: `Ayubowan${name ? ` ${name}` : ""}! I'm your TourGenie AI assistant.\n\nI can help you discover Sri Lanka tours, plan routes, find hotels, and give local travel tips. What would you like to explore?`,
      actions: [
        { label: "Browse Tours", href: "/tours", icon: MapPin },
        { label: "Create Tour", href: "/create-tour", icon: Route },
      ],
    }]);
    fetch(`${API_BASE}/api/ai/reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: getSessionId() }),
    }).catch(() => { });
    sessionStorage.removeItem("tg_ai_session_id");
  };

  return (
    <>
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}
            onClick={() => setOpen(true)}
            aria-label="Open AI Assistant"
            className="fixed bottom-6 right-6 z-[9000] w-14 h-14 rounded-full shadow-2xl shadow-leaf-700/40 flex items-center justify-center hover:scale-105 transition-transform"
          >
            <TourGenieLogo size={56} />
            <span className="absolute inset-0 rounded-full bg-leaf-700/20 animate-ping" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.93, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 16 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="fixed bottom-6 right-6 z-[9000] w-[370px] max-w-[calc(100vw-24px)] h-[560px] max-h-[calc(100vh-80px)] bg-sand-50 rounded-3xl shadow-2xl shadow-ink-900/20 border border-sand-200 flex flex-col overflow-hidden"
          >
            <div className="flex items-center gap-3 px-4 py-3.5 bg-white border-b border-sand-200 shrink-0">
              <TourGenieLogo size={36} />
              <div className="flex-1">
                <p className="text-sm font-semibold text-ink-900">TourGenie AI</p>
                <p className="text-[10px] text-ink-800/50 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                  Sri Lanka · Gemini AI
                </p>
              </div>
              <button onClick={clearChat} title="Clear chat" className="w-8 h-8 rounded-full hover:bg-sand-100 flex items-center justify-center text-ink-800/40 hover:text-ink-800 transition-colors">
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-full hover:bg-sand-100 flex items-center justify-center transition-colors">
                <X className="w-4 h-4 text-ink-800/60" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <div className="mx-auto mb-3">
                    <TourGenieLogo size={56} />
                  </div>
                  <p className="text-sm font-semibold text-ink-900 mb-1">TourGenie AI</p>
                  <p className="text-xs text-ink-800/50 mb-5">Your Sri Lanka travel expert</p>
                  <div className="flex flex-wrap gap-1.5 justify-center">
                    {QUICK_PROMPTS.map((p, i) => (
                      <button
                        key={i}
                        onClick={() => sendMessage(p.label)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white border border-sand-200 text-xs text-ink-800 hover:border-leaf-600/40 hover:bg-leaf-700/5 transition-all"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {(messages || []).map(m => <Bubble key={m.id} msg={m} />)}
              {loading && <Typing />}
              <div ref={bottomRef} />
            </div>

            {messages.length > 0 && messages.length < 3 && (
              <div className="px-4 pb-2 shrink-0 flex gap-1.5 overflow-x-auto">
                {QUICK_PROMPTS.slice(0, 4).map((p, i) => (
                  <button
                    key={i}
                    onClick={() => { sendMessage(p.label); }}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-white border border-sand-200 text-[11px] text-ink-800 whitespace-nowrap hover:bg-sand-50 transition-colors shrink-0"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            )}

            <div className="px-4 pb-4 pt-2 bg-white border-t border-sand-200 shrink-0">
              <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-2xl bg-sand-50 border border-sand-200 focus-within:border-leaf-600/50 focus-within:ring-2 focus-within:ring-leaf-600/10 transition-all">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Ask me anything about Sri Lanka…"
                  readOnly={loading}
                  className="flex-1 bg-transparent outline-none text-sm text-ink-900 placeholder:text-ink-800/35 read-only:opacity-50"
                />
                <button
                  onClick={handleSubmit}
                  disabled={!input.trim() || loading}
                  className="w-8 h-8 rounded-xl bg-leaf-700 text-white flex items-center justify-center hover:bg-leaf-600 transition-colors disabled:opacity-40 shrink-0"
                >
                  {loading
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <Send className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
