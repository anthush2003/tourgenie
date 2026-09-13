import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowDown, MapPin } from "lucide-react";

export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const imgY = useTransform(scrollYProgress, [0, 1], [0, 220]);
  const imgScale = useTransform(scrollYProgress, [0, 1], [1, 1.25]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const overlayOpacity = useTransform(scrollYProgress, [0, 1], [0.2, 0.8]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      setMouse({ x, y });
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <section
      ref={ref}
      className="relative h-svh min-h-180 w-full overflow-hidden"
    >
      {}
      <motion.div
        style={{ y: imgY, scale: imgScale }}
        className="absolute inset-0"
      >
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url(/images/hero-sigiriya.jpg)",
            transform: `translate3d(${mouse.x * -15}px, ${mouse.y * -10}px, 0)`,
            transition: "transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        />
      </motion.div>

      {}
      <motion.div
        style={{ opacity: overlayOpacity }}
        className="absolute inset-0 bg-linear-to-b from-ink-900/30 via-ink-900/20 to-ink-900/90"
      />
      <div className="absolute inset-0 bg-linear-to-r from-ink-900/70 via-ink-900/10 to-transparent" />

      {}
      <motion.div
        animate={{
          x: mouse.x * 30,
          y: mouse.y * 20,
        }}
        transition={{ type: "spring", stiffness: 50, damping: 20 }}
        className="absolute top-[18%] right-[12%] w-56 h-56 md:w-72 md:h-72 rounded-full glow-sunset pointer-events-none"
      />

      {}
      <motion.div
        animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[30%] left-[8%] hidden md:block pointer-events-none"
      >
        <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
          <circle cx="30" cy="30" r="28" stroke="#e8a87c" strokeOpacity="0.4" strokeWidth="1" />
          <circle cx="30" cy="30" r="18" stroke="#e8a87c" strokeOpacity="0.3" strokeWidth="1" />
          <circle cx="30" cy="30" r="3" fill="#e8a87c" fillOpacity="0.6" />
        </svg>
      </motion.div>

      <motion.div
        animate={{ y: [0, 25, 0], rotate: [0, -8, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[25%] right-[10%] hidden md:block pointer-events-none"
      >
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
          <path
            d="M40 10 Q 20 30, 40 70 Q 60 30, 40 10 Z"
            stroke="#d9bfa0"
            strokeOpacity="0.5"
            strokeWidth="1"
            fill="#d9bfa0"
            fillOpacity="0.08"
          />
        </svg>
      </motion.div>

      {}
      <motion.div
        style={{ y: textY, opacity: textOpacity }}
        className="relative z-10 h-full flex flex-col justify-end pb-24 md:pb-32 px-6 md:px-10 max-w-7xl mx-auto"
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.3 }}
          className="flex items-center gap-3 mb-6"
        >
          <div className="h-px w-12 bg-sunset-400" />
          <span className="text-xs tracking-[0.4em] uppercase text-sunset-300 font-medium">
            The Pearl of the Indian Ocean
          </span>
        </motion.div>

        <h1 className="font-serif text-[clamp(3rem,9vw,8.5rem)] leading-[0.92] tracking-tight text-sand-50 max-w-5xl">
          <motion.span
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, delay: 0.5 }}
            className="block"
          >
            Serene shores,
          </motion.span>
          <motion.span
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, delay: 0.7 }}
            className="block italic font-light text-sunset-300"
          >
            sacred summits,
          </motion.span>
          <motion.span
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, delay: 0.9 }}
            className="block"
          >
            timeless <span className="text-shimmer">soul.</span>
          </motion.span>
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 1.2 }}
          className="mt-8 max-w-xl text-sand-100/90 text-base md:text-lg leading-relaxed"
        >
          Journey through emerald tea highlands, sun-warmed colonial forts, and
          misty ancient kingdoms — curated slowly, experienced deeply.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 1.4 }}
          className="mt-10 flex flex-wrap items-center gap-4"
        >
          <a
            href="#destinations"
            className="group relative px-8 py-4 rounded-full bg-sand-50 text-ink-900 font-medium overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-2">
              Explore the Island
              <ArrowDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
            </span>
            <span className="absolute inset-0 bg-sunset-400 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
          </a>
          <a
            href="#book"
            className="px-8 py-4 rounded-full border border-sand-100/40 text-sand-50 font-medium hover:bg-sand-50/10 transition-colors"
          >
            Plan a Private Journey
          </a>
        </motion.div>

        {}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5, delay: 1.8 }}
          className="absolute bottom-8 right-6 md:right-10 flex items-center gap-6 text-sand-50/80 text-xs"
        >
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span className="tracking-wider">6.9271° N, 79.8612° E</span>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-sunset-400 animate-pulse" />
            <span className="tracking-wider uppercase">Now 28°C · Clear</span>
          </div>
        </motion.div>
      </motion.div>

      {}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="absolute bottom-8 left-6 md:left-10 z-10 flex flex-col items-center gap-2 text-sand-50/70"
      >
        <span className="text-[10px] tracking-[0.3em] uppercase rotate-90 origin-center translate-y-10">
          Scroll
        </span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-px h-16 bg-linear-to-b from-sand-50/80 to-transparent mt-16"
        />
      </motion.div>
    </section>
  );
}
