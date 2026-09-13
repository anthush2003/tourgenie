import { useRef, useState } from "react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";

type Destination = {
  name: string;
  region: string;
  tagline: string;
  description: string;
  image: string;
  stats: string[];
  accent: string;
};

const destinations: Destination[] = [
  {
    name: "Sigiriya",
    region: "Cultural Triangle",
    tagline: "The Eighth Wonder of the Ancient World",
    description:
      "A fifth-century sky palace carved atop a 200-metre column of red rock, rising silently from the jungle canopy.",
    image: "/images/hero-sigiriya.jpg",
    stats: ["UNESCO Heritage", "5th Century", "200m Ascent"],
    accent: "from-sunset-500/80 to-sunset-600/80",
  },
  {
    name: "Ella",
    region: "Highland Retreat",
    tagline: "Where the mist learns to breathe",
    description:
      "Endless emerald tea terraces, the nine-arched colonial railway bridge, and a horizon that softens the soul.",
    image: "/images/tea-hills.jpg",
    stats: ["1,600m Altitude", "Tea Country", "Train Rides"],
    accent: "from-leaf-500/80 to-leaf-700/80",
  },
  {
    name: "Mirissa",
    region: "Southern Coast",
    tagline: "The island's most tender shoreline",
    description:
      "A crescent of white sand, blue whale migrations offshore, and sunsets that dissolve into the Indian Ocean.",
    image: "/images/beach-mirissa.jpg",
    stats: ["Whale Watching", "Surf Breaks", "Palm Fringed"],
    accent: "from-ocean-400/80 to-ocean-600/80",
  },
  {
    name: "Kandy",
    region: "Hill Capital",
    tagline: "A kingdom wrapped in temple bells",
    description:
      "The sacred Temple of the Tooth, a mirrored lake at dusk, and Kandyan dancers spinning under starlight.",
    image: "/images/kandy-temple.jpg",
    stats: ["Temple of Tooth", "Royal Lakes", "Cultural Heart"],
    accent: "from-sunset-400/80 to-sunset-600/80",
  },
  {
    name: "Galle Fort",
    region: "Colonial South",
    tagline: "A living fortress on the sea",
    description:
      "Dutch-era ramparts, boutique hotels within coral-stone walls, and lighthouse sunsets over the harbour.",
    image: "/images/galle-fort.jpg",
    stats: ["UNESCO Fort", "400 Years", "Lighthouse"],
    accent: "from-leaf-600/80 to-ocean-600/80",
  },
  {
    name: "Yala",
    region: "Wilderness",
    tagline: "Where leopards walk like royalty",
    description:
      "The world's highest density of wild leopards, alongside elephants, sloth bears, and 215 species of birds.",
    image: "/images/yala-leopard.jpg",
    stats: ["Leopards", "Safari", "40 species/km²"],
    accent: "from-sunset-600/80 to-leaf-700/80",
  },
];

function TiltCard({ dest, index }: { dest: Destination; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [hover, setHover] = useState(false);

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    setTilt({ x: (py - 0.5) * -14, y: (px - 0.5) * 14 });
  };

  const reset = () => {
    setTilt({ x: 0, y: 0 });
    setHover(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.9, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="perspective-1800"
    >
      <div
        ref={ref}
        onMouseMove={onMouseMove}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={reset}
        style={{
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transition: "transform 0.25s cubic-bezier(0.22, 1, 0.36, 1)",
          transformStyle: "preserve-3d",
        }}
        className="relative group cursor-pointer rounded-3xl overflow-hidden aspect-[4/5]"
      >
        {}
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-[1200ms]"
          style={{
            backgroundImage: `url(${dest.image})`,
            transform: hover ? "scale(1.08)" : "scale(1)",
          }}
        />
        {}
        <div className={`absolute inset-0 bg-gradient-to-t ${dest.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/50 to-transparent" />

        {}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
          style={{
            background: `radial-gradient(400px circle at ${50 + tilt.y * 3}% ${50 - tilt.x * 3}%, rgba(255,255,255,0.18), transparent 60%)`,
          }}
        />

        {}
        <div
          className="absolute top-5 left-5 flex items-center gap-2 text-sand-50 text-[10px] tracking-[0.3em] uppercase"
          style={{ transform: "translateZ(40px)" }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-sunset-400" />
          {dest.region}
        </div>

        {}
        <div
          className="absolute inset-x-0 bottom-0 p-6 md:p-7 text-sand-50"
          style={{ transform: "translateZ(50px)" }}
        >
          <motion.h3
            className="font-serif text-4xl md:text-5xl leading-none mb-2"
            style={{ transform: "translateZ(20px)" }}
          >
            {dest.name}
          </motion.h3>
          <p className="text-sand-100/80 text-sm italic mb-4 font-light">
            {dest.tagline}
          </p>

          <p
            className="text-sand-100/80 text-sm leading-relaxed max-w-sm overflow-hidden max-h-0 group-hover:max-h-24 transition-all duration-700"
          >
            {dest.description}
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            {(dest.stats || []).map((s) => (
              <span
                key={s}
                className="text-[10px] tracking-wider uppercase px-3 py-1.5 rounded-full border border-sand-50/30 bg-sand-50/10 backdrop-blur-sm"
              >
                {s}
              </span>
            ))}
          </div>
        </div>

        {}
        <div
          className="absolute top-5 left-1/2 -translate-x-1/2 text-[120px] font-serif font-light text-sand-50/5 leading-none pointer-events-none"
          style={{ transform: "translateZ(-30px) translateX(-50%)" }}
        >
          0{index + 1}
        </div>
      </div>
    </motion.div>
  );
}

export default function Destinations() {
  const sectionRef = useRef<HTMLElement>(null);
  const headingInView = useInView(sectionRef, { once: true, margin: "-100px" });
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const bgY = useTransform(scrollYProgress, [0, 1], [0, -80]);

  return (
    <section
      id="destinations"
      ref={sectionRef}
      className="relative py-32 md:py-44 px-6 md:px-10 overflow-hidden bg-sand-50"
    >
      {}
      <motion.div
        style={{ y: bgY }}
        className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full glow-sunset opacity-60 pointer-events-none"
      />
      <div className="absolute top-1/3 -left-20 w-80 h-80 rounded-full glow-leaf opacity-40 pointer-events-none" />

      <div className="max-w-7xl mx-auto relative">
        {}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-20">
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={headingInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 1 }}
              className="flex items-center gap-3 mb-6"
            >
              <span className="text-[11px] tracking-[0.4em] uppercase text-leaf-700">
                01 — Destinations
              </span>
              <div className="h-px w-16 bg-leaf-700/40" />
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 40 }}
              animate={headingInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 1.1, delay: 0.15 }}
              className="font-serif text-5xl md:text-7xl leading-[0.95] text-ink-900"
            >
              Six worlds,
              <br />
              <span className="italic text-leaf-700 font-light">one island.</span>
            </motion.h2>
          </div>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={headingInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1, delay: 0.3 }}
            className="max-w-md text-ink-800/80 leading-relaxed"
          >
            From UNESCO rock fortresses to the world's finest leopard
            wilderness — each corner of Sri Lanka unfolds at its own quiet
            tempo.
          </motion.p>
        </div>

        {/* Grid of tilt cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {(destinations || []).map((d, i) => (
            <TiltCard key={d.name} dest={d} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
