import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Quote, Star, ArrowRight, ArrowLeft, Check, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../services/api";

const Instagram = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" />
  </svg>
);
const X = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.5 3h3l-6.9 7.9L22 21h-6.1l-4.8-6.2L5.5 21H2.5l7.4-8.5L2 3h6.2l4.3 5.7L17.5 3Zm-1.1 16h1.7L7.4 5H5.6l10.8 14Z" />
  </svg>
);
const Youtube = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M23 7.5s-.2-1.5-.8-2.2c-.8-.8-1.7-.8-2.1-.9C17 4.1 12 4.1 12 4.1s-5 0-8.1.3c-.4.1-1.3.1-2.1.9C1.2 6 1 7.5 1 7.5S.8 9.4.8 11.3v1.4C.8 14.6 1 16.5 1 16.5s.2 1.5.8 2.2c.8.8 1.9.8 2.3.9 1.7.2 7.9.3 7.9.3s5 0 8.1-.3c.4-.1 1.3-.1 2.1-.9.6-.7.8-2.2.8-2.2s.2-1.9.2-3.8v-1.4C23.2 9.4 23 7.5 23 7.5ZM9.9 15.1V7.9l6.3 3.6-6.3 3.6Z" />
  </svg>
);

const testimonials = [
  {
    quote:
      "We came for a holiday and left with a piece of our soul in the hills of Ella. Serendib didn't plan a trip — they composed a meditation.",
    name: "Amara & Julian Whitfield",
    role: "London · 14 days · Tea Highlands",
    rating: 5,
  },
  {
    quote:
      "The leopard at dawn, the stilt fisherman at dusk, the warm rice and curry on a veranda overlooking the ocean. Every moment was unrepeatable.",
    name: "The Nakamura Family",
    role: "Tokyo · 11 days · Coast & Wildlife",
    rating: 5,
  },
  {
    quote:
      "A journey that felt written specifically for us. Our guide Kavi became family. We are already planning our return to the Fort at Galle.",
    name: "Isabella & Marco Rossi",
    role: "Milan · 9 days · Heritage Coast",
    rating: 5,
  },
];

export default function Testimonials() {
  const [idx, setIdx] = useState(0);
  const next = () => setIdx((i) => (i + 1) % testimonials.length);
  const prev = () => setIdx((i) => (i - 1 + testimonials.length) % testimonials.length);
  const t = testimonials[idx];

  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterStatus, setNewsletterStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [newsletterMessage, setNewsletterMessage] = useState("");

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = newsletterEmail.trim();
    if (!email) return;

    setNewsletterStatus("loading");
    try {
      const res = await api.subscribeNewsletter(email);
      setNewsletterStatus("success");
      setNewsletterMessage(res.alreadySubscribed ? "You're already on the list!" : "Subscribed! Check your inbox.");
      setNewsletterEmail("");
    } catch (err: any) {
      setNewsletterStatus("error");
      setNewsletterMessage(err?.message || "Something went wrong. Please try again.");
    }
  };

  return (
    <>
      <section id="stories" className="relative py-32 md:py-44 px-6 md:px-10 bg-gradient-to-b from-sand-100 to-sand-50 overflow-hidden">
        <div className="absolute top-20 left-1/2 -translate-x-1/2 opacity-[0.03] font-serif text-[260px] leading-none pointer-events-none text-ink-900 italic select-none">
          "
        </div>

        <div className="max-w-5xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="flex items-center gap-3 mb-8 justify-center"
          >
            <div className="h-px w-16 bg-leaf-700/40" />
            <span className="text-[11px] tracking-[0.4em] uppercase text-leaf-700">
              05 — Traveller Stories
            </span>
            <div className="h-px w-16 bg-leaf-700/40" />
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.1 }}
            className="font-serif text-4xl md:text-6xl text-center text-ink-900 leading-[1.05] mb-16"
          >
            Voices from the
            <br />
            <span className="italic text-sunset-600 font-light">veranda.</span>
          </motion.h2>

          <div className="relative min-h-[380px] flex items-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 40, rotateX: -15 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                exit={{ opacity: 0, y: -40, rotateX: 15 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="w-full text-center perspective-1000"
                style={{ transformStyle: "preserve-3d" }}
              >
                <Quote className="w-10 h-10 text-sunset-400 mx-auto mb-8" strokeWidth={1} />
                <p className="font-serif text-2xl md:text-4xl leading-[1.25] text-ink-900 max-w-3xl mx-auto italic font-light">
                  "{t.quote}"
                </p>
                <div className="flex justify-center gap-1 mt-10 mb-6">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-sunset-400 text-sunset-400" />
                  ))}
                </div>
                <p className="font-medium text-ink-900">{t.name}</p>
                <p className="text-sm text-ink-800/60 mt-1">{t.role}</p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4 mt-12">
            <button
              onClick={prev}
              className="w-12 h-12 rounded-full border border-ink-900/20 flex items-center justify-center hover:bg-ink-900 hover:text-sand-50 transition-colors"
              aria-label="Previous"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIdx(i)}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    i === idx ? "w-8 bg-ink-900" : "w-1.5 bg-ink-900/20"
                  }`}
                />
              ))}
            </div>
            <button
              onClick={next}
              className="w-12 h-12 rounded-full border border-ink-900/20 flex items-center justify-center hover:bg-ink-900 hover:text-sand-50 transition-colors"
              aria-label="Next"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative bg-ink-900 text-sand-50 overflow-hidden">
        {/* Wavy top */}
        <div className="relative h-24 overflow-hidden">
          <svg
            viewBox="0 0 1440 100"
            preserveAspectRatio="none"
            className="absolute bottom-0 left-0 w-[200%] h-full animate-wave"
          >
            <path
              d="M0,50 C240,90 480,10 720,50 C960,90 1200,10 1440,50 L1440,100 L0,100 Z"
              fill="#14201d"
            />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-6 md:px-10 pt-16 pb-10">
          <div className="grid md:grid-cols-[1.5fr_1fr_1fr_1fr] gap-12 mb-16">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="relative w-10 h-10">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-sunset-400 to-sunset-600 animate-sun-rotate" />
                  <div className="absolute inset-[3px] rounded-full bg-ink-900 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 text-leaf-400">
                      <path
                        fill="currentColor"
                        d="M12 2c0 5-4 6-4 10s2 6 4 10c2-4 4-6 4-10s-4-5-4-10z"
                      />
                    </svg>
                  </div>
                </div>
                <div>
                  <span className="font-serif text-xl tracking-wide">TourGenie</span>
                  <span className="block text-[10px] tracking-[0.3em] uppercase text-leaf-400 mt-0.5">
                    Sri Lanka
                  </span>
                </div>
              </div>
              <p className="text-sand-100/60 text-sm leading-relaxed max-w-xs">
                A slow-travel atelier crafting deeply personal journeys across
                the pearl of the Indian Ocean since 2012.
              </p>
              <div className="flex gap-3 mt-6">
                {[Instagram, X, Youtube].map((Icon, i) => (
                  <a
                    key={i}
                    href="#"
                    className="w-10 h-10 rounded-full border border-sand-100/15 flex items-center justify-center hover:bg-sunset-400 hover:text-ink-900 hover:border-sunset-400 transition-all"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-[11px] tracking-[0.3em] uppercase text-sunset-300 mb-5">
                Explore
              </h4>
              <ul className="space-y-3 text-sm text-sand-100/70">
                {["Destinations", "Experiences", "Journeys", "Stories", "About Us"].map((l) => (
                  <li key={l}>
                    <a href="#" className="hover:text-sunset-300 transition-colors">{l}</a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-[11px] tracking-[0.3em] uppercase text-sunset-300 mb-5">
                Island
              </h4>
              <ul className="space-y-3 text-sm text-sand-100/70">
                {["Heritage", "Highlands", "Coastline", "Wildlife", "Wellness"].map((l) => (
                  <li key={l}>
                    <a href="#" className="hover:text-sunset-300 transition-colors">{l}</a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-[11px] tracking-[0.3em] uppercase text-sunset-300 mb-5">
                Correspondence
              </h4>
              <p className="text-sm text-sand-100/70 leading-relaxed">
                42 Galle Road<br />
                Colombo 03, Sri Lanka
              </p>
              <p className="text-sm text-sand-100/70 mt-4">
                hello@serendib.lk<br />
                +94 11 234 5678
              </p>
              <form onSubmit={handleNewsletterSubmit} className="mt-5">
                <div className="flex items-center gap-2 border-b border-sand-100/20 pb-2">
                  <input
                    type="email"
                    required
                    value={newsletterEmail}
                    onChange={(e) => {
                      setNewsletterEmail(e.target.value);
                      if (newsletterStatus !== "idle") setNewsletterStatus("idle");
                    }}
                    placeholder="your@email.com"
                    disabled={newsletterStatus === "loading"}
                    className="bg-transparent text-sm placeholder:text-sand-100/30 flex-1 outline-none py-2 disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={newsletterStatus === "loading" || !newsletterEmail.trim()}
                    className="text-sunset-300 hover:text-sunset-400 transition-colors disabled:opacity-40"
                    aria-label="Subscribe to newsletter"
                  >
                    {newsletterStatus === "loading" ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : newsletterStatus === "success" ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <ArrowRight className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {newsletterMessage && (
                  <p className={`mt-2 text-xs ${newsletterStatus === "error" ? "text-red-300" : "text-leaf-400"}`}>
                    {newsletterMessage}
                  </p>
                )}
              </form>
            </div>
          </div>

          <div className="pt-8 border-t border-sand-100/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-sand-100/50">
            <p>© 2026 TourGenie Travels — All rights reserved.</p>
            <p className="italic font-serif text-sand-100/40">
              "Ayubowan" — may you live long
            </p>
            <div className="flex gap-6">
              <Link to="/privacy" className="hover:text-sunset-300">Privacy</Link>
              <Link to="/terms" className="hover:text-sunset-300">Terms</Link>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
