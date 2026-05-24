import { useEffect } from "react";
import { motion, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion";

// Stable seed array of 40 multi-geometry particles scattered down the entire page height (0% to 100%)
const FULL_PAGE_PARTICLES = Array.from({ length: 42 }, (_, i) => {
  const x = ((i * 37) % 90) + 5; // bounds: 5% to 95%
  const y = ((i * 47) % 90) + 5; // bounds: 5% to 95% (height mapping)
  const size = ((i * 13) % 4) + 2.2; 
  const delay = -((i * 19) % 15);
  const duration = 5 + ((i * 7) % 6); // fast pacing: 5s to 11s
  const opacity = 0.25 + ((i * 11) % 5) * 0.08; // subtle solidness: 0.25 to 0.57

  const color = i % 3 === 0 
    ? "bg-cyan-500/40 shadow-[0_0_8px_rgba(0,255,255,0.45)]" 
    : i % 3 === 1 
      ? "bg-blue-500/50 shadow-[0_0_8px_rgba(0,120,255,0.55)]" 
      : "bg-purple-500/40 shadow-[0_0_8px_rgba(139,92,246,0.45)]";

  const animClass = i % 4 === 0 
    ? "animate-float-particle-1" 
    : i % 4 === 1 
      ? "animate-float-particle-2" 
      : i % 4 === 2 
        ? "animate-float-particle-3"
        : "animate-float-particle-4";

  let shapeClass = "rounded-full";
  let renderText = "";
  
  if (i % 5 === 0) {
    shapeClass = "rounded-none"; // square
  } else if (i % 5 === 1) {
    shapeClass = "rounded-none rotate-45"; // diamond
  } else if (i % 5 === 2) {
    shapeClass = "rounded-full w-[1.5px] h-[8px] bg-cyan-400/40 shadow-none"; // vertical dash
  } else if (i % 5 === 3) {
    shapeClass = "flex items-center justify-center font-mono font-bold select-none text-[8px] text-cyan-300/35 bg-transparent shadow-none"; 
    renderText = i % 2 === 0 ? "0" : "1";
  } else {
    shapeClass = "flex items-center justify-center font-mono select-none text-[7px] text-purple-300/35 bg-transparent shadow-none";
    renderText = i % 2 === 0 ? "x" : "♦";
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

// Stable seeded array of tech plus and visual markers to expand cybernetic complexity down the page height
const FULL_PAGE_GLYPHS = Array.from({ length: 16 }, (_, i) => {
  const x = ((i * 29) % 85) + 7.5; 
  const y = ((i * 31) % 85) + 7.5;  
  const size = ((i * 7) % 5) + 10; 
  const delay = -((i * 13) % 15); 
  const duration = 6 + ((i * 9) % 7); // extremely active: 6s to 13s
  const opacity = 0.08 + ((i * 3) % 4) * 0.035; 
  const rotateDir = i % 2 === 0 ? "animate-spin-slow" : "animate-spin-slow [animation-direction:reverse]";
  
  const glyph = i % 4 === 0 
    ? "+" 
    : i % 4 === 1 
      ? "x" 
      : i % 4 === 2 
        ? "♦" 
        : "■";
        
  const color = i % 2 === 0 ? "text-cyan-500" : "text-blue-500";

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

export function CyberGraffitiBackground() {
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
  const mouseMoveXStrong = useTransform(springX, [-0.5, 0.5], [-55, 55]);
  const mouseMoveYStrong = useTransform(springY, [-0.5, 0.5], [-55, 55]);

  // Normalized scroll parallax transforms across the full scrollable height
  const bgY = useTransform(scrollY, [0, 2000], [0, -180]);
  const deepBgY = useTransform(scrollY, [0, 2000], [0, -70]);
  const midBgY = useTransform(scrollY, [0, 2000], [0, -120]);
  const particlesY = useTransform(scrollY, [0, 2000], [0, -150]);

  // Listen to global mouse movements so tracking remains active across all sections
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) - 0.5;
      const y = (e.clientY / window.innerHeight) - 0.5;
      mouseX.set(x);
      mouseY.set(y);
    };

    window.addEventListener("mousemove", handleGlobalMouseMove);
    return () => window.removeEventListener("mousemove", handleGlobalMouseMove);
  }, [mouseX, mouseY]);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
      
      {/* 🌌 LAYER 1: Deep Ambient Glowing Blobs (Distributed vertically for continuous atmosphere - ultra-dark) */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top Section Ambient Glow */}
        <div className="absolute top-[8%] left-[20%] w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle_at_center,rgba(0,180,240,0.05),transparent_60%)] pointer-events-none" />
        {/* Mid Section Ambient Glow */}
        <div className="absolute top-[38%] right-[10%] w-[700px] h-[700px] rounded-full bg-[radial-gradient(circle_at_center,rgba(124,58,237,0.04),transparent_60%)] pointer-events-none" />
        {/* Lower Mid Section Ambient Glow */}
        <div className="absolute top-[65%] left-[5%] w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle_at_center,rgba(0,120,255,0.04),transparent_65%)] pointer-events-none" />
        {/* Bottom Section Ambient Glow */}
        <div className="absolute bottom-[8%] right-[15%] w-[650px] h-[650px] rounded-full bg-[radial-gradient(circle_at_center,rgba(236,72,153,0.035),transparent_60%)] pointer-events-none" />
      </div>

      {/* 🌌 LAYER 2: Circuit Pathways & Robotic Outlines (SVGs placed along scrollable height) */}
      <motion.div style={{ x: mouseMoveX, y: deepBgY }} className="absolute inset-0 pointer-events-none">
        
        {/* SVG 1: AI Cyber Circuit Traces (top-left, hero section edge) */}
        <svg className="absolute top-[6%] left-[-2%] w-[420px] h-[420px] text-cyan-500/6 pointer-events-none" viewBox="0 0 100 100">
          <path d="M 0 30 H 30 L 40 40 V 65 L 52 77 H 100" fill="none" stroke="currentColor" strokeWidth="0.3" strokeDasharray="1,1" />
          <path d="M 8 15 L 20 27 H 45 L 53 35 V 58 H 70 L 80 68" fill="none" stroke="currentColor" strokeWidth="0.2" />
          <circle cx="30" cy="30" r="0.8" fill="currentColor" />
          <circle cx="40" cy="40" r="0.6" fill="currentColor" className="animate-pulse" />
          <circle cx="52" cy="77" r="0.8" fill="currentColor" />
          <circle cx="53" cy="35" r="0.6" fill="currentColor" />
        </svg>

        {/* SVG 2: Robotic Tech Joint & HUD Rings (top-right, hero bottom-edge) */}
        <svg className="absolute top-[20%] right-[-6%] w-[480px] h-[480px] text-purple-500/7 pointer-events-none animate-spin-slow" viewBox="0 0 100 100" style={{ animationDuration: "35s" }}>
          <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="0.25" strokeDasharray="3,6" />
          <circle cx="50" cy="50" r="34" fill="none" stroke="currentColor" strokeWidth="0.4" />
          <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="0.15" strokeDasharray="1,3" />
          <path d="M 50 8 L 50 15 M 50 85 L 50 92 M 8 50 L 15 50 M 85 50 L 92 50" stroke="currentColor" strokeWidth="0.4" />
          <path d="M 20 20 L 25 25 M 75 75 L 80 80 M 20 80 L 25 75 M 75 20 L 80 25" stroke="currentColor" strokeWidth="0.3" />
        </svg>

        {/* SVG 3: Isometric 3D Wireframe Cube / Floating Mesh (middle-left, films section edge) */}
        <svg className="absolute top-[42%] left-[-4%] w-[340px] h-[340px] text-blue-500/6 pointer-events-none animate-spin-slow" viewBox="0 0 120 120" style={{ animationDuration: "28s" }}>
          <path d="M 60 22 L 92 40 L 92 78 L 60 96 L 28 78 L 28 40 Z" fill="none" stroke="currentColor" strokeWidth="0.3" />
          <path d="M 60 22 L 60 58 M 60 58 L 92 40 M 60 58 L 28 40" fill="none" stroke="currentColor" strokeWidth="0.25" />
          <path d="M 60 58 L 60 96" fill="none" stroke="currentColor" strokeWidth="0.3" strokeDasharray="1,1" />
          <circle cx="60" cy="22" r="1.2" fill="currentColor" />
          <circle cx="92" cy="40" r="1" fill="currentColor" />
          <circle cx="92" cy="78" r="1" fill="currentColor" />
          <circle cx="60" cy="96" r="1.2" fill="currentColor" />
          <circle cx="28" cy="78" r="1" fill="currentColor" />
          <circle cx="28" cy="40" r="1" fill="currentColor" />
          <circle cx="60" cy="58" r="1.2" fill="currentColor" className="animate-pulse" />
        </svg>

        {/* SVG 4: Futuristic AI Circuit Matrix & HUD Brackets (middle-right, assets section edge) */}
        <svg className="absolute top-[64%] right-[-3%] w-[420px] h-[420px] text-cyan-500/6 pointer-events-none" viewBox="0 0 100 100">
          <path d="M 8 8 H 25 V 25" fill="none" stroke="currentColor" strokeWidth="0.4" />
          <path d="M 92 8 H 75 V 25" fill="none" stroke="currentColor" strokeWidth="0.4" />
          <path d="M 8 92 H 25 V 75" fill="none" stroke="currentColor" strokeWidth="0.4" />
          <path d="M 92 92 H 75 V 75" fill="none" stroke="currentColor" strokeWidth="0.4" />
          <path d="M 20 50 H 80" fill="none" stroke="currentColor" strokeWidth="0.25" strokeDasharray="4,4" />
          <circle cx="20" cy="50" r="0.8" fill="currentColor" />
          <circle cx="80" cy="50" r="0.8" fill="currentColor" />
          <text x="32" y="47" fill="currentColor" fontSize="2.8" fontFamily="monospace" letterSpacing="0.5" opacity="0.5">SYS_MATRIX_ONLINE</text>
        </svg>

        {/* SVG 5: Robotic Arm Joint Wireframe & Isometric grid (bottom-left, near bottom) */}
        <svg className="absolute top-[82%] left-[-2%] w-[380px] h-[380px] text-purple-500/5 pointer-events-none" viewBox="0 0 100 100">
          <path d="M 10 30 L 30 10 L 70 10 L 90 30 L 90 70 L 70 90 L 30 90 L 10 70 Z" fill="none" stroke="currentColor" strokeWidth="0.2" />
          <circle cx="50" cy="50" r="20" fill="none" stroke="currentColor" strokeWidth="0.25" />
          <path d="M 50 10 L 50 90 M 10 50 L 90 50" stroke="currentColor" strokeWidth="0.15" strokeDasharray="2,2" />
          <polygon points="50,30 67,40 67,60 50,70 33,60 33,40" fill="none" stroke="currentColor" strokeWidth="0.2" />
        </svg>

      </motion.div>

      {/* 🌌 LAYER 3: Concentric Holographic Outlines / Spinning Rings */}
      <motion.div style={{ x: mouseMoveX, y: midBgY }} className="absolute inset-0 pointer-events-none">
        
        {/* Holographic Radar Circle in middle films section right side */}
        <svg className="absolute top-[35%] right-[2%] w-[300px] h-[300px] text-cyan-400/5 pointer-events-none animate-spin-slow" viewBox="0 0 100 100" style={{ animationDuration: "25s" }}>
          <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="0.3" strokeDasharray="2,4" />
          <circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" strokeWidth="0.15" />
          <path d="M 15 50 A 35 35 0 0 1 85 50" fill="none" stroke="currentColor" strokeWidth="0.5" />
          <circle cx="50" cy="50" r="4" fill="currentColor" opacity="0.3" />
        </svg>

        {/* Isometric Grid Floor outline at the bottom */}
        <svg className="absolute bottom-[5%] left-[10%] w-[500px] h-[250px] text-cyan-500/4 pointer-events-none opacity-20" viewBox="0 0 100 50">
          <path d="M 0 25 L 50 0 L 100 25 L 50 50 Z" fill="none" stroke="currentColor" strokeWidth="0.2" />
          <path d="M 10 20 L 50 40 L 90 20" fill="none" stroke="currentColor" strokeWidth="0.15" />
          <path d="M 20 15 L 50 30 L 80 15" fill="none" stroke="currentColor" strokeWidth="0.15" />
          <path d="M 30 10 L 50 20 L 70 10" fill="none" stroke="currentColor" strokeWidth="0.15" />
          <path d="M 40 5 L 50 10 L 60 5" fill="none" stroke="currentColor" strokeWidth="0.15" />
          <path d="M 50 0 L 50 50" fill="none" stroke="currentColor" strokeWidth="0.15" />
          <path d="M 25 12.5 L 75 37.5 M 75 12.5 L 25 37.5" fill="none" stroke="currentColor" strokeWidth="0.15" />
        </svg>

      </motion.div>

      {/* 🌌 LAYER 4: Continuous Cyber Sparks & Alternative Geometries (squares, diamonds, binary nodes) */}
      <motion.div style={{ x: mouseMoveXStrong, y: particlesY }} className="absolute inset-0 pointer-events-none">
        {FULL_PAGE_PARTICLES.map((p) => (
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

      {/* 🌌 LAYER 5: Spinning Cyber Constellation Tech Outlines (+, x, ♦, ■) */}
      <motion.div style={{ x: mouseMoveXStrong, y: particlesY }} className="absolute inset-0 pointer-events-none">
        {FULL_PAGE_GLYPHS.map((shape) => (
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

      {/* 🌌 LAYER 6: Subtle Dynamic Lines / Long Diagonal Futuristic Sweeps */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] overflow-hidden">
        <div className="absolute top-[15%] left-[-10%] w-[120%] h-[1px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent rotate-[15deg] blur-[1px]" />
        <div className="absolute top-[48%] right-[-10%] w-[120%] h-[1px] bg-gradient-to-r from-transparent via-purple-400 to-transparent -rotate-[10deg] blur-[1px]" />
        <div className="absolute top-[75%] left-[-10%] w-[120%] h-[1px] bg-gradient-to-r from-transparent via-blue-400 to-transparent rotate-[8deg] blur-[1.5px]" />
      </div>

    </div>
  );
}
