import { useState, useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { supabase } from "../lib/supabase";
import { IMAGES } from "@/assets/images";
import { Play, Calendar, Eye, ArrowRight, ShieldCheck } from "lucide-react";

interface SlideData {
  id: string | number;
  media_type: "image" | "video";
  media_url: string;
  title?: string;
  description?: string;
  active?: boolean;
  tag?: string;
}

// Fallback high-fidelity slider data if Supabase returns empty or fails
const FALLBACK_SLIDES: SlideData[] = [
  {
    id: "fb-1",
    media_type: "image",
    media_url: IMAGES.ABOUT_BG_1,
    title: "Quantum Neural Matrix",
    description: "Venturing deep into abstract brain structures and synthesized logic networks.",
    tag: "Artificial Intelligence"
  },
  {
    id: "fb-2",
    media_type: "image",
    media_url: IMAGES.HERO_BG_6,
    title: "Cinematic AI Control Center",
    description: "Visualizing high-density interactive environments and 3D modeling streams.",
    tag: "Digital Creativity"
  },
  {
    id: "fb-3",
    media_type: "image",
    media_url: IMAGES.HERO_BG_9,
    title: "Human Mind & Logic",
    description: "Mapping the neural connections where organic memory merges with silicon logic.",
    tag: "3D Animation"
  }
];

export default function Slider() {
  const [slides, setSlides] = useState<SlideData[]>([]);
  const [current, setCurrent] = useState(0);
  const [ready, setReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Motion values for smooth 3D Tilt
  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);

  const springTiltX = useSpring(tiltX, { stiffness: 80, damping: 18 });
  const springTiltY = useSpring(tiltY, { stiffness: 80, damping: 18 });

  // Tilt transforms (15 degrees max tilt)
  const rotateX = useTransform(springTiltY, [-0.5, 0.5], [10, -10]);
  const rotateY = useTransform(springTiltX, [-0.5, 0.5], [-10, 10]);

  // Glow reflection coordinates
  const reflectionX = useTransform(springTiltX, [-0.5, 0.5], ["0%", "100%"]);
  const reflectionY = useTransform(springTiltY, [-0.5, 0.5], ["0%", "100%"]);

  // Dynamic glare reflection background declared at top level
  const glareBackground = useTransform(
    [reflectionX, reflectionY],
    ([rx, ry]) => `radial-gradient(circle at ${rx} ${ry}, rgba(125, 235, 255, 0.055) 0%, rgba(125, 235, 255, 0.018) 22%, transparent 58%)`
  );

  useEffect(() => {
    fetchSlides();
  }, []);

  async function fetchSlides() {
    try {
      const { data, error } = await supabase
        .from("sliders")
        .select("*")
        .eq("active", true);

      if (error) throw error;

      if (data && data.length > 0) {
        setSlides(data);
      } else {
        setSlides(FALLBACK_SLIDES);
      }
    } catch (err) {
      console.warn("Using high-fidelity fallback slide deck due to: ", err);
      setSlides(FALLBACK_SLIDES);
    } finally {
      setTimeout(() => setReady(true), 600);
    }
  }

  useEffect(() => {
    if (!ready || slides.length <= 1) return;

    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 4500); // Premium cinematic delay

    return () => clearInterval(interval);
  }, [ready, slides]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    
    // Normalized position relative to center: range [-0.5, 0.5]
    const mouseX = (e.clientX - rect.left) / rect.width - 0.5;
    const mouseY = (e.clientY - rect.top) / rect.height - 0.5;

    tiltX.set(mouseX);
    tiltY.set(mouseY);
  };

  const handleMouseLeave = () => {
    tiltX.set(0);
    tiltY.set(0);
  };

  if (!slides.length) return null;

  const activeSlide = slides[current];

  return (
    <div 
      className="relative w-full py-8 select-none"
      style={{ perspective: "1200px" }} // Root perspective context
    >
      <motion.div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d"
        }}
        className="relative w-full aspect-[21/6.5] md:aspect-[21/5.5] overflow-hidden rounded-2xl border border-cyan-500/20 bg-[#080c14]/90 backdrop-blur-xl group transition-all duration-300 shadow-[0_30px_90px_rgba(0,0,0,0.85)] cursor-none hover:border-cyan-400/50"
      >
        {/* ─── Edge Lighting Inner Glow ─── */}
        <div className="absolute inset-0 rounded-2xl pointer-events-none z-40 border border-cyan-400/0 group-hover:border-cyan-400/30 group-hover:shadow-[inset_0_0_25px_rgba(0,240,255,0.18)] transition-all duration-500" />

        {/* ─── 3D Ambient Outer Glow ─── */}
        <div className="absolute -inset-12 bg-gradient-to-r from-cyan-500/10 via-transparent to-purple-600/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

        {/* ─── Dynamic Glare Reflection Overlay ─── */}
        <motion.div
          style={{
            background: glareBackground
          }}
          className="absolute inset-0 z-30 pointer-events-none mix-blend-screen opacity-70"
        />

        {/* ─── Slide Media Layers ─── */}
        {slides.map((s, i) => (
          <div
            key={s.id || i}
            className={`
              absolute inset-0 transform-gpu
              transition-all duration-800 ease-in-out
              ${
                i === current
                  ? "opacity-100 scale-100 z-10 blur-0"
                  : "opacity-0 scale-105 z-0 blur-sm pointer-events-none"
              }
            `}
          >
            {s.media_type === "video" ? (
              <video
                src={s.media_url}
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-full object-cover opacity-100 scale-105 saturate-125 contrast-105 brightness-105"
              />
            ) : (
              <img
                src={s.media_url}
                alt={s.title}
                loading="eager"
                className="w-full h-full object-cover opacity-100 scale-105 saturate-125 contrast-105 brightness-105"
              />
            )}
          </div>
        ))}

        {/* ─── Glassmorphic HUD Text Panel (Preserves 3D depth) ─── */}
        <div
          className="absolute left-5 bottom-5 md:left-8 md:bottom-7 z-20 pointer-events-none"
          style={{ transform: "translateZ(50px) scale(0.95)" }} // Pops out forward
        >
          <div className="relative space-y-1.5">
            {activeSlide.tag && (
              <div
                className="inline-flex items-center gap-1.5 text-cyan-200 text-[9px] md:text-[10px] font-semibold uppercase tracking-wider"
                style={{ textShadow: "0 1px 10px rgba(0, 0, 0, 0.95), 0 0 12px rgba(0, 240, 255, 0.45)" }}
              >
                <ShieldCheck className="w-3 h-3 text-cyan-300" />
                {activeSlide.tag}
              </div>
            )}

            <div className="flex items-center gap-4">
              <span
                className="text-[9px] md:text-[10px] font-mono text-cyan-300/70 uppercase tracking-widest flex items-center gap-1.5"
                style={{ textShadow: "0 1px 10px rgba(0, 0, 0, 0.95), 0 0 12px rgba(0, 240, 255, 0.45)" }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                Core AI Subsystem Active
              </span>
            </div>
          </div>
        </div>

        {/* ─── Glassmorphic Borders & Highlights ─── */}
        <div className="absolute inset-0 pointer-events-none z-20 border border-white/5 rounded-2xl" />

        {/* ─── Holographic Telemetry corner lines ─── */}
        <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-cyan-400/60 z-30 pointer-events-none" />
        <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-cyan-400/60 z-30 pointer-events-none" />
        <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-cyan-400/60 z-30 pointer-events-none" />
        <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-cyan-400/60 z-30 pointer-events-none" />

        {/* ─── Interactive Indicator dots (replaces simple dots) ─── */}
        <div 
          className="absolute bottom-6 right-8 flex gap-2.5 z-40"
          style={{ transform: "translateZ(30px)" }}
        >
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`
                h-1.5 transition-all duration-300 rounded-full border border-cyan-400/40 pointer-events-auto cursor-none
                ${
                  i === current
                    ? "w-8 bg-cyan-400 shadow-[0_0_10px_rgba(0,240,255,0.7)]"
                    : "w-2.5 bg-white/20 hover:bg-white/40"
                }
              `}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
