import { motion, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { ROUTE_PATHS } from "@/lib/index";
import { useState, useEffect, useLayoutEffect, useRef } from "react";

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

const premiumBrandEase = [0.22, 1, 0.36, 1] as const;
const BRAND_NAME = "Voxeli.AI";
const BRAND_LETTERS = BRAND_NAME.split("");
const BRAND_GRADIENT =
  "linear-gradient(96deg, #27e6ff 0%, #12dbe6 28%, #28bde9 48%, #557df4 72%, #8b6dff 100%)";
const BRAND_LETTER_COLORS = [
  "#27e6ff",
  "#27e6ff",
  "#12dbe6",
  "#12dbe6",
  "#28bde9",
  "#28bde9",
  "#557df4",
  "#557df4",
  "#8b6dff",
];
const getBrandRevealDelay = (index: number) => {
  return 0.18 + index * 0.055;
};

export default function Hero() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [brandAnimationCycle, setBrandAnimationCycle] = useState(0);
  const brandHeadingRef = useRef<HTMLHeadingElement>(null);
  const location = useLocation();

  useLayoutEffect(() => {
    const previousScrollRestoration = window.history.scrollRestoration;

    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    const scrollToBrand = () => {
      const brandRect = brandHeadingRef.current?.getBoundingClientRect();
      const brandTop = brandRect ? window.scrollY + brandRect.top - 112 : 0;

      window.scrollTo({
        top: Math.max(0, brandTop),
        left: 0,
        behavior: "auto",
      });
    };

    scrollToBrand();
    requestAnimationFrame(scrollToBrand);

    return () => {
      if ("scrollRestoration" in window.history) {
        window.history.scrollRestoration = previousScrollRestoration;
      }
    };
  }, [location.key]);

  useEffect(() => {
    const scrollTimer = window.setTimeout(() => {
      const brandRect = brandHeadingRef.current?.getBoundingClientRect();

      if (!brandRect) {
        return;
      }

      window.scrollTo({
        top: Math.max(0, window.scrollY + brandRect.top - 112),
        left: 0,
        behavior: "auto",
      });

      setBrandAnimationCycle((cycle) => cycle + 1);
    }, 50);

    return () => window.clearTimeout(scrollTimer);
  }, [location.key]);

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

        <h1 ref={brandHeadingRef} className="min-h-[120px] md:min-h-[156px] select-none font-orbitron leading-none flex items-center justify-center">
          <motion.span
            key={`brand-lockup-${location.key}-${brandAnimationCycle}`}
            aria-label={BRAND_NAME}
            initial={{ opacity: 0, y: 24, scale: 0.97, filter: "blur(4px) brightness(0.76)" }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              filter:
                "blur(0px) brightness(1) drop-shadow(0 0 14px rgba(39, 230, 255, 0.42)) drop-shadow(0 0 28px rgba(85, 125, 244, 0.22))",
            }}
            transition={{
              opacity: { duration: 0.95, ease: premiumBrandEase },
              y: { duration: 1.12, ease: premiumBrandEase },
              scale: { duration: 1.12, ease: premiumBrandEase },
              filter: { duration: 1.08, ease: premiumBrandEase },
            }}
            whileHover={!prefersReducedMotion ? { y: -2 } : undefined}
              className="relative inline-flex items-center justify-center gap-4 sm:gap-5 overflow-hidden px-3 py-5 will-change-transform"
            style={{
              WebkitTextStrokeColor: "rgba(39, 230, 255, 0.34)",
              WebkitTextStrokeWidth: "0.28px",
              textShadow:
                "0 0 9px rgba(39, 230, 255, 0.48), 0 0 22px rgba(40, 189, 233, 0.28), 0 0 38px rgba(139, 109, 255, 0.18)",
            }}
          >
            {!prefersReducedMotion && (
              <motion.span
                aria-hidden="true"
                initial={{ x: "-150%", opacity: 0 }}
                animate={{ x: "580%", opacity: [0, 0.95, 0] }}
                transition={{ duration: 1.42, delay: 0.58, ease: premiumBrandEase }}
                className="pointer-events-none absolute inset-y-3 -left-10 z-20 w-16 -skew-x-12"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, rgba(39,230,255,0.85), rgba(18,219,230,0.75), rgba(139,109,255,0.35), transparent)",
                  mixBlendMode: "screen",
                }}
              />
            )}

            <motion.span
              aria-hidden="true"
              initial={{
                opacity: 0,
                y: prefersReducedMotion ? 0 : 22,
                scale: prefersReducedMotion ? 1 : 0.86,
                filter: prefersReducedMotion ? "blur(0px)" : "blur(3px) brightness(0.72)",
              }}
              animate={{
                opacity: 1,
                y: prefersReducedMotion ? 0 : [18, -4, 0],
                scale: prefersReducedMotion ? 1 : [0.82, 1.04, 1],
                filter: "blur(0px) brightness(1)",
              }}
              transition={{
                opacity: { duration: 0.82, delay: 0.08, ease: premiumBrandEase },
                y: { duration: 1.12, delay: 0.08, ease: premiumBrandEase },
                scale: { duration: 1.12, delay: 0.08, ease: premiumBrandEase },
                filter: { duration: 1, delay: 0.08, ease: premiumBrandEase },
              }}
              className="relative flex h-[58px] w-[50px] sm:h-[74px] sm:w-[64px] md:h-[86px] md:w-[74px] shrink-0 items-end justify-center"
            >
              <motion.svg
                viewBox="0 0 82 94"
                fill="none"
                className="h-full w-full overflow-visible"
                animate={!prefersReducedMotion ? { y: [0, -2.5, 0] } : undefined}
                transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
              >
                <defs>
                  <linearGradient id="heroRobotShell" x1="13" y1="5" x2="69" y2="85" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#f8fbff" />
                    <stop offset="0.3" stopColor="#a9bfff" />
                    <stop offset="0.68" stopColor="#344574" />
                    <stop offset="1" stopColor="#111827" />
                  </linearGradient>
                  <linearGradient id="heroRobotFace" x1="23" y1="30" x2="59" y2="52" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#081322" />
                    <stop offset="1" stopColor="#0d1630" />
                  </linearGradient>
                  <linearGradient id="heroRobotGlow" x1="22" y1="30" x2="60" y2="74" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#27e6ff" />
                    <stop offset="1" stopColor="#8b6dff" />
                  </linearGradient>
                  <radialGradient id="heroRobotBloom" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(41 89) rotate(90) scale(11 29)">
                    <stop stopColor="#27e6ff" stopOpacity="0.65" />
                    <stop offset="1" stopColor="#27e6ff" stopOpacity="0" />
                  </radialGradient>
                </defs>
                <ellipse cx="41" cy="89" rx="28" ry="6.5" fill="url(#heroRobotBloom)" />
                <path d="M31 58H51C58 58 63 63.2 63 70V77C63 84 57.7 88 50.5 88H31.5C24.3 88 19 84 19 77V70C19 63.2 24 58 31 58Z" fill="url(#heroRobotShell)" stroke="rgba(206,236,255,0.7)" strokeWidth="1.5" />
                <path d="M28 62C25 64.5 23.5 68 23.5 73V77C23.5 80 25.2 82.5 28 83.8" stroke="rgba(255,255,255,0.34)" strokeWidth="1.2" strokeLinecap="round" />
                <rect x="21" y="14" width="40" height="43" rx="19" fill="url(#heroRobotShell)" stroke="rgba(226,244,255,0.82)" strokeWidth="1.6" />
                <path d="M30 13C32.5 6.5 49.5 6.5 52 13C48 15.8 34 15.8 30 13Z" fill="rgba(255,255,255,0.58)" />
                <rect x="25" y="28" width="32" height="21" rx="9" fill="url(#heroRobotFace)" stroke="rgba(39,230,255,0.58)" strokeWidth="1.2" />
                <path d="M28 30.5C31 28.5 51 28.5 54 30.5" stroke="rgba(255,255,255,0.18)" strokeLinecap="round" />
                <rect x="11" y="31" width="9" height="21" rx="4.5" fill="url(#heroRobotShell)" stroke="rgba(187,225,255,0.58)" strokeWidth="1.2" />
                <rect x="62" y="31" width="9" height="21" rx="4.5" fill="url(#heroRobotShell)" stroke="rgba(187,225,255,0.58)" strokeWidth="1.2" />
                <circle cx="34" cy="38.5" r="4" fill="#27e6ff" filter="drop-shadow(0 0 5px rgba(39,230,255,0.85))" />
                <circle cx="48" cy="38.5" r="4" fill="#27e6ff" filter="drop-shadow(0 0 5px rgba(39,230,255,0.85))" />
                <path d="M35 47C37.8 49 44.2 49 47 47" stroke="url(#heroRobotGlow)" strokeWidth="1.8" strokeLinecap="round" />
                <rect x="34" y="69" width="14" height="4" rx="2" fill="url(#heroRobotGlow)" />
                <circle cx="41" cy="64" r="2" fill="#27e6ff" opacity="0.9" />
                <path d="M24 70L15 74M58 70L67 74" stroke="rgba(39,230,255,0.52)" strokeWidth="2" strokeLinecap="round" />
              </motion.svg>
            </motion.span>

            <span className="relative inline-flex items-baseline text-[clamp(2.45rem,8.4vw,5.85rem)] font-medium tracking-[0.035em]">
              {BRAND_LETTERS.map((char, index) => (
                <motion.span
                  key={`${char}-${index}`}
                  aria-hidden="true"
                  initial={{
                    opacity: 0,
                    y: prefersReducedMotion ? 0 : 56,
                    scale: prefersReducedMotion ? 1 : 0.86,
                    clipPath: prefersReducedMotion ? "inset(0% 0% 0% 0%)" : "inset(82% 0% 0% 0%)",
                    filter: prefersReducedMotion
                      ? "blur(0px)"
                      : "blur(3px) brightness(0.72)",
                  }}
                  animate={{
                    opacity: 1,
                    y: prefersReducedMotion ? 0 : [46, -8, 0],
                    scale: prefersReducedMotion ? 1 : [0.86, 1.06, 1],
                    clipPath: "inset(0% 0% 0% 0%)",
                    filter: [
                      "blur(3px) brightness(0.72)",
                      "blur(0px) brightness(1.35)",
                      "blur(0px) brightness(1)",
                    ],
                  }}
                  transition={{
                    opacity: {
                      duration: 0.82,
                      delay: prefersReducedMotion ? 0 : getBrandRevealDelay(index),
                      ease: premiumBrandEase,
                    },
                    y: {
                      duration: 1.08,
                      delay: prefersReducedMotion ? 0 : getBrandRevealDelay(index),
                      ease: premiumBrandEase,
                    },
                    scale: {
                      duration: 1.08,
                      delay: prefersReducedMotion ? 0 : getBrandRevealDelay(index),
                      ease: premiumBrandEase,
                    },
                    clipPath: {
                      duration: 1,
                      delay: prefersReducedMotion ? 0 : getBrandRevealDelay(index),
                      ease: premiumBrandEase,
                    },
                    filter: {
                      duration: 1.18,
                      delay: prefersReducedMotion ? 0 : getBrandRevealDelay(index),
                      ease: [0.16, 1, 0.3, 1],
                    },
                  }}
                  className="inline-block"
                  style={{
                    backgroundImage: BRAND_GRADIENT,
                    backgroundSize: `${BRAND_LETTERS.length * 100}% 100%`,
                    backgroundPosition: `${index * (100 / Math.max(BRAND_LETTERS.length - 1, 1))}% center`,
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                    color: BRAND_LETTER_COLORS[index],
                  WebkitTextFillColor: "transparent",
                  textShadow:
                      "0 0 7px rgba(39,230,255,0.52), 0 0 16px rgba(40,189,233,0.34), 0 0 28px rgba(139,109,255,0.2)",
                  }}
                >
                  {char}
                </motion.span>
              ))}
            </span>

            {!prefersReducedMotion && (
              <motion.span
                aria-hidden="true"
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: [0, 1, 0.92], opacity: [0, 1, 0.6] }}
                transition={{ duration: 1.22, delay: 0.64, ease: premiumBrandEase }}
                className="pointer-events-none absolute bottom-2 left-[9%] right-[9%] h-px origin-center"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, rgba(39,230,255,0.2), rgba(18,219,230,0.95), rgba(139,109,255,0.68), transparent)",
                  boxShadow:
                    "0 0 18px rgba(39,230,255,0.72), 0 0 38px rgba(40,189,233,0.32)",
                }}
              />
            )}
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
