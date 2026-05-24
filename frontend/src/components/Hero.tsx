import { motion, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion";
import { Link } from "react-router-dom";
import { ROUTE_PATHS } from "@/lib/index";

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
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-transparent text-white"
    >
      {/* 🌌 ADVANCED ANIMATED CINEMATIC BACKGROUND LAYER (z-index lower than everything, z-0) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        
        {/* 1. Concentric Holographic Ripple Waves (center-aligned cyber ripples) */}
        <motion.div style={{ x: mouseMoveX, y: bgY }} className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="absolute w-[220px] h-[220px] rounded-full border border-cyan-500/25 animate-ripple-1 shadow-[0_0_15px_rgba(0,255,255,0.15)]" />
          <div className="absolute w-[440px] h-[440px] rounded-full border border-blue-500/15 animate-ripple-2 shadow-[0_0_15px_rgba(0,100,255,0.1)]" style={{ animationDelay: "-2.3s" }} />
          <div className="absolute w-[660px] h-[660px] rounded-full border border-indigo-500/15 animate-ripple-3 shadow-[0_0_15px_rgba(139,92,246,0.1)]" style={{ animationDelay: "-4.6s" }} />
        </motion.div>

        {/* 2. Breathing central ambient glow (Futuristic AI cinematic palette - Ultra-Dark for high-contrast balance) */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,180,240,0.06),transparent_48%)] animate-pulse-glow" />

        {/* 3. Cyber Grid Matrix background layer responding to mouse hover & scroll */}
        <motion.div 
          style={{ x: mouseMoveX, y: bgY }}
          className="absolute inset-0 opacity-[0.05] bg-[linear-gradient(rgba(0,240,255,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(0,240,255,0.12)_1px,transparent_1px)] bg-[size:45px_45px] [mask-image:radial-gradient(ellipse_at_center,black_60%,transparent_100%)] pointer-events-none" 
        />

        {/* 4. Slow-moving Cinematic Gradient Blobs (ultra-dark, custom blending for rich colors) */}
        <motion.div style={{ x: mouseMoveX, y: deepBgY }} className="absolute inset-0">
          <div className="absolute top-[5%] left-[12%] w-[480px] h-[480px] rounded-full bg-gradient-to-br from-cyan-950/4 to-indigo-950/3 blur-[120px] animate-float-blob-1" style={{ mixBlendMode: "plus-lighter" as any }} />
          <div className="absolute bottom-[5%] right-[10%] w-[550px] h-[550px] rounded-full bg-gradient-to-tr from-blue-950/3 to-purple-950/4 blur-[130px] animate-float-blob-2" style={{ mixBlendMode: "plus-lighter" as any }} />
        </motion.div>

        <motion.div style={{ x: mouseMoveX, y: midBgY }} className="absolute inset-0">
          <div className="absolute top-[35%] left-[30%] w-[380px] h-[380px] rounded-full bg-gradient-to-r from-purple-950/3 to-cyan-950/3 blur-[110px] animate-float-blob-3" style={{ mixBlendMode: "plus-lighter" as any }} />
        </motion.div>

        {/* 5. Original slow-spinning orbits (wrapped in scroll & mouse parallax layer - dimmed opacity) */}
        <motion.div style={{ x: mouseMoveX, y: deepBgY }} className="absolute inset-0 opacity-15">
          <div className="absolute w-[600px] h-[600px] rounded-full border border-cyan-500/20 top-[-200px] left-[-100px] animate-spin-slow" />
          <div className="absolute w-[500px] h-[500px] rounded-full border border-blue-500/20 bottom-[-180px] right-[-100px] animate-spin-slow" />
        </motion.div>

        {/* 6. Subtle Parallax Floating Shapes (thin rings & glassmorphism abstract shapes) */}
        <motion.div style={{ x: mouseMoveX, y: midBgY }} className="absolute inset-0 opacity-40">
          <div className="absolute top-[30%] right-[25%] w-[120px] h-[120px] rounded-full border border-cyan-500/8 backdrop-blur-[2px] animate-float-blob-1" style={{ animationDelay: '-5s' }} />
          <div className="absolute bottom-[25%] left-[20%] w-[180px] h-[180px] rounded-full border border-blue-500/8 backdrop-blur-[3px] animate-float-blob-2" style={{ animationDelay: '-12s' }} />
          <div className="absolute top-[60%] left-[10%] w-[80px] h-[80px] rounded-full border border-cyan-500/4 animate-float-blob-1" style={{ animationDelay: '-8s' }} />
        </motion.div>

        {/* 7. Floating Cinematic Particle System (custom GPU-driven geometric particles with scroll & strong mouse parallax) */}
        <motion.div style={{ x: mouseMoveXStrong, y: particlesY }} className="absolute inset-0">
          {PARTICLES.map((p) => (
            <div
              key={p.id}
              className={`absolute ${p.shapeClass} ${p.color} ${p.animClass}`}
              style={{
                width: p.size,
                height: p.size,
                top: p.y,
                left: p.x,
                opacity: p.opacity,
                animationDuration: p.duration,
                animationDelay: p.delay,
              }}
            >
              {p.renderText}
            </div>
          ))}
        </motion.div>

        {/* 8. Subtle Sweeping Light Streaks */}
        <div className="absolute inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-600/10 to-transparent blur-[2px] animate-streak-1" />
        <div className="absolute inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-blue-600/8 to-transparent blur-[3px] animate-streak-2" style={{ animationDelay: '-8s' }} />

        {/* 9. Rotating Cybernetic Tech Geometries (+, x, ♦, ■) floating in the backdrop */}
        <motion.div style={{ x: mouseMoveXStrong, y: particlesY }} className="absolute inset-0">
          {TECH_SHAPES.map((shape) => (
            <div
              key={shape.id}
              className={`absolute font-mono select-none ${shape.color} ${shape.rotateDir}`}
              style={{
                top: shape.y,
                left: shape.x,
                fontSize: shape.size,
                opacity: shape.opacity,
                animationDuration: shape.duration,
                animationDelay: shape.delay,
              }}
            >
              {shape.glyph}
            </div>
          ))}
        </motion.div>

        {/* 10. Soft Animated Noise Overlay (film grain effect with jitter translation) */}
        <div className="absolute inset-[-5%] w-[110%] h-[110%] noise-overlay animate-noise-jitter" />
      </div>

      {/* Content (Completely Untouched as Requested) */}
      <motion.div
        initial={{ opacity: 0, y: 35 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="relative z-10 text-center px-6"
      >
        <div className="inline-block mb-6 px-6 py-2 rounded-full border border-cyan-400/50 bg-cyan-400/10 text-cyan-300 text-sm">
          Graduation Project 2026
        </div>

        <h1 className="text-6xl md:text-8xl font-extrabold leading-tight">
          <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Human Mind
          </span>
          <br />
          <span className="text-white">&</span>
          <br />
          <span className="bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent">
            AI Logic
          </span>
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
