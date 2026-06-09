import { motion, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion";
import { Link } from "react-router-dom";
import { ROUTE_PATHS } from "@/lib/index";
import { useState, useEffect } from "react";
import MascotV3D from "./MascotV3D";

// Stable, deterministic seed array of multi-geometry nodes (squares, diamonds, dashes, glyphs) to avoid hydration mismatch.
const PARTICLES = Array.from({ length: 48 }, (_, i) => {
  const x = ((i * 37) % 95) + 2.5; // percentage bounds: 2.5% to 97.5%
  const y = ((i * 43) % 90) + 5;   // percentage bounds: 5% to 95%
  const size = ((i * 13) % 4) + 2.4; // size: 2.4px to 6.4px
  const delay = -((i * 17) % 15); // starts instantly
  const duration = 5 + ((i * 7) % 5); // super fast pacing: 5s to 9s

  // MUCH LESS TRANSPARENCY (Higher solidness & intense glow box shadow for massive popup contrast!)
  const opacity = 0.45 + ((i * 11) % 5) * 0.09; // opacity bounds: 0.45 to 0.81
  const color = i % 3 === 0 
    ? "bg-cyan-400 shadow-[0_0_12px_rgba(0,255,255,0.7)]" 
    : i % 3 === 1 
      ? "bg-blue-400 shadow-[0_0_12px_rgba(0,120,255,0.8)]" 
      : "bg-indigo-400 shadow-[0_0_12px_rgba(139,92,246,0.7)]";

  // Assign to one of four fast chaotic paths
  const animClass = i % 4 === 0 
    ? "animate-float-particle-1" 
    : i % 4 === 1 
      ? "animate-float-particle-2" 
      : i % 4 === 2 
        ? "animate-float-particle-3"
        : "animate-float-particle-4";

  // Seed alternative geometries to phase out standard circles
  let shapeClass = "rounded-full";
  let renderText = "";
  
  if (i % 5 === 0) {
    shapeClass = "rounded-none"; // Perfect Cyber Square
  } else if (i % 5 === 1) {
    shapeClass = "rounded-none rotate-45"; // Perfect Cyber Diamond
  } else if (i % 5 === 2) {
    shapeClass = "rounded-full w-[2px] h-[10px] bg-cyan-400 shadow-[0_0_10px_rgba(0,255,255,0.5)]"; // Shooting vertical data line/dash
  } else if (i % 5 === 3) {
    shapeClass = "flex items-center justify-center font-mono font-bold select-none text-[10px] text-cyan-300 bg-transparent shadow-none"; // Binary code node (solid!)
    renderText = i % 2 === 0 ? "0" : "1";
  } else {
    shapeClass = "flex items-center justify-center font-mono font-semibold select-none text-[9px] text-purple-300 bg-transparent shadow-none"; // Tech glyph square/diamond
    renderText = i % 2 === 0 ? "■" : "♦";
  }

  return {
    id: i,
    x: `${x}%`,
    y: `${y}%`,
    size: `${size}px`,
    delay: `${delay}s`,
    duration: `${duration}s`,
    opacity,
    color,
    animClass,
    shapeClass,
    renderText,
  };
});

// Stable seeded array of tech plus and visual markers to expand cybernetic complexity without hydration mismatch.
const TECH_SHAPES = Array.from({ length: 22 }, (_, i) => {
  const x = ((i * 29) % 85) + 7.5; // percentage bounds: 7.5% to 92.5%
  const y = ((i * 31) % 80) + 10;  // percentage bounds: 10% to 90%
  const size = ((i * 7) % 6) + 11; // size: 11px to 16px
  const delay = -((i * 13) % 15); // offsets start phase
  const duration = 4 + ((i * 9) % 7); // extremely active: 4s to 10s
  const opacity = 0.12 + ((i * 3) % 4) * 0.045; // highly visible glyphs: 0.12 to 0.25
  const rotateDir = i % 2 === 0 ? "animate-spin-slow" : "animate-spin-slow [animation-direction:reverse]";
  
  // Diverse set of tech glyph geometries
  const glyph = i % 4 === 0 
    ? "+" 
    : i % 4 === 1 
      ? "x" 
      : i % 4 === 2 
        ? "♦" 
        : "■";
        
  const color = i % 2 === 0 ? "text-cyan-400" : "text-blue-500";

  return {
    id: i,
    x: `${x}%`,
    y: `${y}%`,
    size: `${size}px`,
    delay: `${delay}s`,
    duration: `${duration}s`,
    opacity,
    rotateDir,
    glyph,
    color,
  };
});

export default function Hero() {
  const [mascotState, setMascotState] = useState<'init' | 'assemble' | 'showcase' | 'docking' | 'idle'>('init');
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  const scrollToContent = () => {
    window.scrollTo({ top: window.innerHeight, behavior: "smooth" });
  };

  const { scrollY } = useScroll();

  // Mouse coordinate values for spring tracking
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth springs to eliminate sudden jumps and execute directly on the GPU
  const springX = useSpring(mouseX, { stiffness: 45, damping: 25 });
  const springY = useSpring(mouseY, { stiffness: 45, damping: 25 });

  // Map spring outputs to translation shifts
  const mouseMoveX = useTransform(springX, [-0.5, 0.5], [-35, 35]);
  const mouseMoveY = useTransform(springY, [-0.5, 0.5], [-35, 35]);
  
  // Stronger displacement for closer/dynamic foreground layers
  const mouseMoveXStrong = useTransform(springX, [-0.5, 0.5], [-50, 50]);
  const mouseMoveYStrong = useTransform(springY, [-0.5, 0.5], [-50, 50]);

  // Normalized scroll parallax transforms
  const bgY = useTransform(scrollY, [0, 1000], [0, -120]);
  const deepBgY = useTransform(scrollY, [0, 1000], [0, -40]);
  const midBgY = useTransform(scrollY, [0, 1000], [0, -75]);
  const particlesY = useTransform(scrollY, [0, 1000], [0, -110]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <section 
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative min-h-[66vh] md:min-h-[70vh] py-12 md:py-16 flex items-center justify-center overflow-hidden bg-transparent text-white"
    >
      {/* 3D Mascot Canvas Overlay */}
      <MascotV3D onStateChange={setMascotState} prefersReducedMotion={prefersReducedMotion} />

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 35 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="relative z-10 text-center px-6"
      >
        <div className="inline-block mb-6 px-6 py-2 rounded-full border border-cyan-400/50 bg-cyan-400/10 text-cyan-300 text-sm">
          Graduation Project 2026
        </div>

        <h1 className="text-6xl md:text-8xl font-extrabold tracking-tight select-none flex items-center justify-center gap-2.5 min-h-[90px] md:min-h-[140px] font-orbitron">
          {/* Animatable Brand SVG Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={
              mascotState === 'idle'
                ? { opacity: 1, scale: 1, y: [0, -4, 0] }
                : mascotState === 'docking' || mascotState === 'showcase' || mascotState === 'assemble'
                  ? { opacity: 1, scale: 1 }
                  : { opacity: 0, scale: 0.5 }
            }
            transition={
              mascotState === 'idle'
                ? { y: { duration: 4.5, repeat: Infinity, ease: "easeInOut" } }
                : { duration: 1 }
            }
            className="flex-shrink-0"
          >
            <svg className="w-12 h-12 md:w-20 md:h-20 text-cyan-400 drop-shadow-[0_0_12px_rgba(34,211,238,0.55)]" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 6 L16 9 L10 12 L4 9 Z" fill="#0891b2" opacity="0.8"/>
              <path d="M4 9 L10 12 V18 L4 15 Z" fill="#0369a1" opacity="0.8"/>
              <path d="M10 12 L16 9 V15 L10 18 Z" fill="#0284c7" opacity="0.8"/>
              <path d="M22 6 L28 9 L22 12 L16 9 Z" fill="#a855f7" opacity="0.8"/>
              <path d="M16 9 L22 12 V18 L16 15 Z" fill="#7e22ce" opacity="0.8"/>
              <path d="M22 12 L28 9 V15 L22 18 Z" fill="#6b21a8" opacity="0.8"/>
              <path d="M16 11 L22 14.5 L16 18 L10 14.5 Z" fill="#22d3ee"/>
              <path d="M10 14.5 L16 18 V25 L10 21.5 Z" fill="#0891b2"/>
              <path d="M16 18 L22 14.5 V21.5 L16 25 Z" fill="#0e7490"/>
            </svg>
          </motion.div>

          {/* Combined Brand Name Wrapper (Floats together as a single unit) */}
          <motion.span 
            animate={mascotState === 'idle' ? { y: [0, -5, 0] } : {}}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="flex items-center gap-1"
          >
            {/* Symmetrical Mascot placeholder at the start of the text to represent the letter V */}
            <span id="mascot-placeholder" className="relative inline-block text-left flex-shrink-0 select-none">
              <motion.span
                initial={{ opacity: 0, scale: 0.5 }}
                animate={
                  mascotState === 'idle'
                    ? { opacity: 0, scale: 0.8 } // Voxel V has fully morphed, hide the text letter
                    : mascotState === 'docking'
                      ? { opacity: 0.15, scale: 0.95 }
                      : mascotState === 'showcase' || mascotState === 'assemble'
                        ? { opacity: 0.55, scale: 1 } // visible in blue/cyan during assembly/showcase
                        : { opacity: 0, scale: 0.5 }
                }
                transition={{ duration: 0.5 }}
                className="bg-gradient-to-r from-cyan-400 via-blue-200 to-purple-400 bg-clip-text text-transparent inline-block"
              >
                v
              </motion.span>
            </span>

            {/* Full Brand Text with Zero-Gravity Float and Power-Up shockwave ripple */}
            <span className="flex overflow-hidden">
              {"oxeli.ai".split("").map((char, index) => (
                <motion.span
                  key={index}
                  initial={{ opacity: 0, y: 35, filter: "brightness(0.5) contrast(0.8) blur(8px)" }}
                  animate={
                    mascotState === 'idle'
                      ? {
                          opacity: 1,
                          filter: ["brightness(1) contrast(1) blur(0px)", "brightness(1.95) contrast(1.2) blur(0px)", "brightness(1) contrast(1) blur(0px)"],
                          scale: [1, 1.15, 1],
                          y: [0, -8, 0],
                        }
                      : mascotState === 'docking' || mascotState === 'showcase' || mascotState === 'assemble'
                        ? { 
                            opacity: 1, 
                            y: 0, 
                            filter: "brightness(1) contrast(1) blur(0px)",
                            scale: 1,
                          }
                        : { opacity: 0, y: 35, filter: "brightness(0.5) contrast(0.8) blur(8px)" }
                  }
                  transition={
                    mascotState === 'idle'
                      ? {
                          y: { delay: index * 0.08, duration: 0.5, ease: "easeOut" },
                          scale: { delay: index * 0.08, duration: 0.5, ease: "easeOut" },
                          filter: { delay: index * 0.08, duration: 0.5, ease: "easeOut" },
                        }
                      : { delay: index * 0.08, duration: 0.8 }
                  }
                  className={`bg-gradient-to-r from-cyan-400 via-blue-200 to-purple-400 bg-clip-text text-transparent ${
                    mascotState === 'idle' ? "animate-shimmer" : ""
                  }`}
                  style={{
                    backgroundSize: "200% auto",
                  }}
                >
                  {char}
                </motion.span>
              ))}
            </span>
          </motion.span>
        </h1>

        <p className="mt-8 max-w-2xl mx-auto text-gray-400 text-lg">
          Explore the cinematic intersection of AI, memory, creativity, and
          interactive 3D experiences
        </p>

        <div className="mt-10 flex justify-center gap-4 flex-wrap">
          <Link to={ROUTE_PATHS.FILMS}>
            <button className="px-8 py-3 rounded-lg bg-cyan-400 text-black font-semibold shadow-[0_0_25px_rgba(0,255,255,0.45)] hover:scale-105 transition cursor-none">
              Explore Films
            </button>
          </Link>

          <Link to={ROUTE_PATHS.ASSETS}>
            <button className="px-8 py-3 rounded-lg border border-cyan-400 text-cyan-300 hover:bg-cyan-400/10 transition cursor-none">
              Explore 3D Assets
            </button>
          </Link>
        </div>

        <button 
          onClick={scrollToContent} 
          className="mt-16 text-sm text-gray-500 hover:text-cyan-400 transition cursor-none block mx-auto bg-transparent border-none outline-none"
        >
          Scroll to explore
        </button>
      </motion.div>
    </section>
  );
}
