import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

const days = [
  {
    day: "Day 1–2",
    place: "Colombo → Kandy",
    title: "Arrive, exhale, acclimatise",
    details: [
      "Private transfer through palm-lined coastal roads",
      "Evening stroll by Kandy Lake at golden hour",
      "Candlelight dinner of traditional Kandyan cuisine",
    ],
    accent: "bg-sunset-400",
    icon: "🌴",
  },
  {
    day: "Day 3–4",
    place: "Sigiriya & Dambulla",
    title: "Climb the sky palace",
    details: [
      "Sunrise ascent of Sigiriya before the crowds",
      "Frescoes of the celestial maidens",
      "Cave temples of Dambulla at dusk",
    ],
    accent: "bg-leaf-500",
    icon: "🏛️",
  },
  {
    day: "Day 5–6",
    place: "Nuwara Eliya → Ella",
    title: "Tea, mist, and nine arches",
    details: [
      "Tour a working tea factory with the planter",
      "Iconic blue train through emerald valleys",
      "Sunset at the nine-arched colonial bridge",
    ],
    accent: "bg-leaf-600",
    icon: "🍵",
  },
  {
    day: "Day 7–8",
    place: "Yala National Park",
    title: "Safari at first light",
    details: [
      "Private jeep through leopard territory",
      "Picnic breakfast beneath a banyan tree",
      "Evening walk with a resident naturalist",
    ],
    accent: "bg-sunset-500",
    icon: "🐆",
  },
  {
    day: "Day 9–11",
    place: "Mirissa & Galle",
    title: "Slow the coastline",
    details: [
      "Blue whale watching at dawn",
      "Ayurveda spa & surf sessions",
      "Sunset cocktails atop the Galle Fort walls",
    ],
    accent: "bg-ocean-500",
    icon: "🐋",
  },
];

export default function Itinerary() {
  const containerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });
  const lineY = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <section
      id="book"
      ref={containerRef}
      className="relative py-32 md:py-44 px-6 md:px-10 bg-sand-50 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto">
        <div className="max-w-2xl mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="flex items-center gap-3 mb-6"
          >
            <span className="text-[11px] tracking-[0.4em] uppercase text-leaf-700">
              04 — Sample Journey
            </span>
            <div className="h-px w-16 bg-leaf-700/40" />
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.1, delay: 0.1 }}
            className="font-serif text-5xl md:text-7xl leading-[0.95] text-ink-900"
          >
            Eleven days,
            <br />
            <span className="italic text-leaf-700 font-light">unhurried.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.3 }}
            className="mt-6 text-ink-800/80 leading-relaxed"
          >
            A signature itinerary — every detail composed, every hour yours to
            spend as you wish. Private guides, heritage stays, and the freedom
            to linger.
          </motion.p>
        </div>

        {}
        <div className="relative">
          {}
          <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-sand-300/40 md:-translate-x-1/2">
            <motion.div
              style={{ height: lineY }}
              className="w-full bg-linear-to-b from-sunset-400 via-leaf-500 to-ocean-500"
            />
          </div>

          <div className="space-y-20">
            {(days || []).map((d, i) => (
              <motion.div
                key={d.day}
                initial={{ opacity: 0, y: 60 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.9, delay: 0.1 }}
                className={`relative grid md:grid-cols-2 gap-8 md:gap-16 items-center ${
                  i % 2 === 0 ? "" : "md:[&>*:first-child]:order-2"
                }`}
              >
                {}
                <div className="absolute left-4 md:left-1/2 top-0 md:-translate-x-1/2 -translate-y-2 z-10">
                  <div className={`w-8 h-8 rounded-full ${d.accent} flex items-center justify-center shadow-lg ring-4 ring-sand-50`}>
                    <span className="text-sm">{d.icon}</span>
                  </div>
                </div>

                {}
                <div
                  className={`pl-16 md:pl-0 ${
                    i % 2 === 0 ? "md:pr-20 md:text-right" : "md:pl-20 md:col-start-2"
                  }`}
                >
                  <span className="text-[11px] tracking-[0.3em] uppercase text-leaf-700">
                    {d.day} · {d.place}
                  </span>
                  <h3 className="font-serif text-4xl md:text-5xl text-ink-900 mt-2 mb-6 leading-tight">
                    {d.title}
                  </h3>
                  <ul
                    className={`space-y-3 ${
                      i % 2 === 0 ? "md:flex md:flex-col md:items-end" : ""
                    }`}
                  >
                    {(d.details || []).map((det) => (
                      <li
                        key={det}
                        className="flex items-start gap-3 text-ink-800/80 text-sm leading-relaxed"
                      >
                        {i % 2 !== 0 && (
                          <span className={`mt-1.5 w-1.5 h-1.5 rounded-full ${d.accent} shrink-0`} />
                        )}
                        <span>{det}</span>
                        {i % 2 === 0 && (
                          <span className={`mt-1.5 w-1.5 h-1.5 rounded-full ${d.accent} shrink-0 order-first`} />
                        )}
                      </li>
                    ))}
                  </ul>
                </div>

                {}
                <div className="hidden md:block" />
              </motion.div>
            ))}
          </div>
        </div>

        {}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="mt-32 relative rounded-[40px] overflow-hidden bg-linear-to-br from-ink-900 via-ink-800 to-leaf-700 p-10 md:p-20 text-center"
        >
          <div className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `url(/images/beach-mirissa.jpg)`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              mixBlendMode: "overlay",
            }}
          />
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full glow-sunset" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full glow-leaf" />

          <div className="relative">
            <h3 className="font-serif text-4xl md:text-6xl text-sand-50 leading-[1.05] mb-6">
              Your journey
              <br />
              <span className="italic text-sunset-300 font-light">begins here.</span>
            </h3>
            <p className="max-w-xl mx-auto text-sand-100/80 leading-relaxed mb-10">
              Tell us your dream — a temple sunrise, a leopard's gaze, a week of
              stillness. Our specialists will craft a journey just for you.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <a
                href="#"
                className="group px-8 py-4 rounded-full bg-sand-50 text-ink-900 font-medium hover:bg-sunset-400 transition-colors"
              >
                Begin Your Journey
              </a>
              <a
                href="#"
                className="px-8 py-4 rounded-full border border-sand-100/30 text-sand-50 hover:bg-sand-50/10 transition-colors"
              >
                Speak to a Specialist
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
