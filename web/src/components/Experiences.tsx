import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

const experiences = [
  { name: "Sunrise Hike", place: "Adam's Peak", icon: "🏔️" },
  { name: "Tea Tasting", place: "Nuwara Eliya", icon: "🍵" },
  { name: "Whale Watch", place: "Mirissa", icon: "🐋" },
  { name: "Safari Dawn", place: "Yala", icon: "🐆" },
  { name: "Temple Ritual", place: "Kandy", icon: "🪷" },
  { name: "Ayurveda Retreat", place: "Ahungalla", icon: "🌿" },
  { name: "Cooking Class", place: "Galle", icon: "🍛" },
  { name: "Surf Session", place: "Arugam Bay", icon: "🏄" },
];

export default function Experiences() {
  const containerRef = useRef<HTMLElement>(null);
  const cinematicRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress: marqueeProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const x1 = useTransform(marqueeProgress, [0, 1], [0, -200]);
  const x2 = useTransform(marqueeProgress, [0, 1], [-200, 0]);

  const { scrollYProgress: cinematicProgress } = useScroll({
    target: cinematicRef,
    offset: ["start end", "end start"],
  });
  const cinematicY = useTransform(cinematicProgress, [0, 1], [80, -80]);
  const cinematicScale = useTransform(cinematicProgress, [0, 0.5, 1], [1.1, 1, 1.1]);

  return (
    <>
      {}
      <section
        ref={containerRef}
        className="relative py-32 md:py-48 overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-sand-50 via-sand-100 to-sand-50" />

        {}
        <motion.div
          style={{ x: x1 }}
          className="absolute top-10 whitespace-nowrap font-serif text-[200px] md:text-[280px] text-leaf-700/5 leading-none pointer-events-none"
        >
          TourGenie · Ceylon · Taprobane ·
        </motion.div>
        <motion.div
          style={{ x: x2 }}
          className="absolute bottom-10 whitespace-nowrap font-serif text-[200px] md:text-[280px] text-sunset-500/5 leading-none pointer-events-none italic"
        >
          The Resplendent Isle ·
        </motion.div>

        <div
          ref={cinematicRef}
          className="relative max-w-5xl mx-auto px-6 md:px-10 text-center"
        >
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="text-[11px] tracking-[0.5em] uppercase text-leaf-700 mb-8"
          >
            A Philosophy of Slow Travel
          </motion.p>
          <motion.h2
            style={{ y: cinematicY }}
            className="font-serif text-4xl md:text-6xl lg:text-7xl leading-[1.05] text-ink-900"
          >
            We don't sell tours.
            <br />
            <span className="italic font-light text-leaf-700">
              We compose slow mornings,
            </span>
            <br />
            warm tuk-tuk rides, and conversations
            <br />
            with <span className="text-shimmer">strangers</span> who become
            <br />
            <span className="italic font-light text-sunset-600">friends.</span>
          </motion.h2>

          {/* Centered 3D rotating lotus */}
          <motion.div
            style={{ scale: cinematicScale }}
            className="mt-16 flex justify-center"
          >
            <motion.svg
              animate={{ rotate: 360 }}
              transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
              width="120"
              height="120"
              viewBox="0 0 120 120"
              fill="none"
              className="text-sunset-500"
            >
              <circle cx="60" cy="60" r="58" stroke="currentColor" strokeOpacity="0.25" strokeWidth="0.5" />
              <circle cx="60" cy="60" r="40" stroke="currentColor" strokeOpacity="0.25" strokeWidth="0.5" />
              {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
                <path
                  key={deg}
                  d="M60 60 Q 50 30 60 10 Q 70 30 60 60 Z"
                  fill="currentColor"
                  fillOpacity="0.12"
                  stroke="currentColor"
                  strokeOpacity="0.4"
                  strokeWidth="0.5"
                  transform={`rotate(${deg} 60 60)`}
                />
              ))}
              <circle cx="60" cy="60" r="3" fill="currentColor" fillOpacity="0.7" />
            </motion.svg>
          </motion.div>
        </div>
      </section>

      {/* Horizontal marquee of experiences */}
      <section className="py-20 md:py-28 bg-ink-900 overflow-hidden relative">
        <div className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #fbf8f3 1px, transparent 0)`,
            backgroundSize: "32px 32px",
          }}
        />
        <div className="max-w-7xl mx-auto px-6 md:px-10 mb-14 relative">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[11px] tracking-[0.4em] uppercase text-sunset-400">
              02 — Curated Experiences
            </span>
            <div className="h-px w-16 bg-sunset-400/40" />
          </div>
          <h2 className="font-serif text-4xl md:text-6xl text-sand-50 leading-[1.05] max-w-3xl">
            Moments you'll
            <br />
            <span className="italic text-sunset-300 font-light">keep forever.</span>
          </h2>
        </div>

        {}
        <motion.div
          style={{ x: x1 }}
          className="flex gap-6 mb-6 w-max"
        >
          {[...experiences, ...experiences].map((exp, i) => (
            <div
              key={i}
              className="group relative w-[340px] h-[200px] rounded-2xl bg-gradient-to-br from-ink-800 to-ink-900 border border-sand-100/10 p-7 flex flex-col justify-between hover:border-sunset-400/40 transition-all duration-500 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-sunset-500/0 to-sunset-500/0 group-hover:from-sunset-500/5 group-hover:to-leaf-500/5 transition-all duration-500" />
              <div className="relative flex items-start justify-between">
                <span className="text-5xl filter grayscale group-hover:grayscale-0 transition-all duration-500">
                  {exp.icon}
                </span>
                <span className="text-[10px] tracking-[0.3em] uppercase text-sand-100/40">
                  0{i % experiences.length + 1}
                </span>
              </div>
              <div className="relative">
                <h3 className="font-serif text-2xl text-sand-50 mb-1">
                  {exp.name}
                </h3>
                <p className="text-sm text-sand-100/60 italic">{exp.place}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {}
        <motion.div
          style={{ x: x2 }}
          className="flex gap-6 w-max"
        >
          {[...experiences.slice().reverse(), ...experiences.slice().reverse()].map((exp, i) => (
            <div
              key={i}
              className="group relative w-[340px] h-[200px] rounded-2xl bg-gradient-to-br from-sunset-500/10 to-leaf-500/5 border border-sand-100/10 p-7 flex flex-col justify-between hover:border-sunset-400/40 transition-all duration-500 overflow-hidden"
            >
              <div className="relative flex items-start justify-between">
                <span className="text-5xl filter grayscale group-hover:grayscale-0 transition-all duration-500">
                  {exp.icon}
                </span>
                <span className="text-[10px] tracking-[0.3em] uppercase text-sand-100/40">
                  0{(i % experiences.length) + 1}
                </span>
              </div>
              <div className="relative">
                <h3 className="font-serif text-2xl text-sand-50 mb-1">
                  {exp.name}
                </h3>
                <p className="text-sm text-sand-100/60 italic">{exp.place}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </section>
    </>
  );
}
