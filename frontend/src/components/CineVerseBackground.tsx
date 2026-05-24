import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export default function CineVerseBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const cursorRingRef = useRef<HTMLDivElement | null>(null);
  const location = useLocation();

  // --- Particles & 3D Shapes Animation ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let W = (canvas.width = window.innerWidth);
    let H = (canvas.height = window.innerHeight);

    // 1. Tech Nodes & Connective Lines (AI network theme)
    const pts: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      r: number;
      c: string;
    }> = [];

    // 2. Translucent Glassy 3D Spheres (Organic floating video theme)
    const spheres: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      r: number;
      baseColor: string; // purple or cyan
      pulseSpeed: number;
      pulseFactor: number;
    }> = [];

    // 3. Rotating Sci-Fi Holographic Rings
    const rings = [
      { x: W * 0.15, y: H * 0.25, r: 160, speed: 0.0012, angle: 0, dash: [4, 12], color: '124,58,237' },
      { x: W * 0.85, y: H * 0.75, r: 240, speed: -0.0007, angle: 0, dash: [8, 16], color: '34,211,238' },
      { x: W * 0.5, y: H * 0.5, r: 320, speed: 0.0004, angle: 0, dash: [15, 25], color: '124,58,237' },
    ];

    const handleResize = () => {
      if (!canvas) return;
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
      
      // Re-position rings relative to the new dimensions
      rings[0].x = W * 0.15; rings[0].y = H * 0.25;
      rings[1].x = W * 0.85; rings[1].y = H * 0.75;
      rings[2].x = W * 0.5;  rings[2].y = H * 0.5;
    };

    window.addEventListener('resize', handleResize);

    // Initialize 80 Tech Nodes
    for (let i = 0; i < 80; i++) {
      pts.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        r: Math.random() * 1.5 + 0.5,
        c: Math.random() > 0.5 ? '124,58,237' : '34,211,238',
      });
    }

    // Initialize 6 Floating 3D Spheres (translucent glossy volume)
    for (let i = 0; i < 6; i++) {
      spheres.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.12,
        vy: (Math.random() - 0.5) * 0.12,
        r: Math.random() * 70 + 40,
        baseColor: i % 2 === 0 ? '124,58,237' : '34,211,238',
        pulseSpeed: 0.004 + Math.random() * 0.004,
        pulseFactor: Math.random() * Math.PI,
      });
    }

    const animPts = () => {
      ctx.clearRect(0, 0, W, H);

      // A. RENDER ROTATING HOLOGRAPHIC TECH RINGS
      rings.forEach((r) => {
        r.angle += r.speed;
        ctx.save();
        ctx.translate(r.x, r.y);
        ctx.rotate(r.angle);
        
        ctx.beginPath();
        ctx.arc(0, 0, r.r, 0, Math.PI * 2);
        ctx.setLineDash(r.dash);
        ctx.strokeStyle = `rgba(${r.color}, 0.06)`;
        ctx.lineWidth = 1;
        ctx.stroke();
        
        ctx.restore();
      });

      // B. RENDER FLOATING 3D GLASS SPHERES (Shaded with 3D light highlight)
      spheres.forEach((s) => {
        s.x += s.vx;
        s.y += s.vy;

        // Bounce back inside canvas boundaries smoothly
        if (s.x < -s.r) s.x = W + s.r;
        else if (s.x > W + s.r) s.x = -s.r;

        if (s.y < -s.r) s.y = H + s.r;
        else if (s.y > H + s.r) s.y = -s.r;

        s.pulseFactor += s.pulseSpeed;
        const currentR = s.r + Math.sin(s.pulseFactor) * 8;

        // 3D Glass shading - offset center of radial gradient to simulate light reflection
        const grad = ctx.createRadialGradient(
          s.x - currentR * 0.25,
          s.y - currentR * 0.25,
          0,
          s.x,
          s.y,
          currentR
        );
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.16)');
        grad.addColorStop(0.2, `rgba(${s.baseColor}, 0.09)`);
        grad.addColorStop(0.7, `rgba(${s.baseColor}, 0.01)`);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.beginPath();
        ctx.arc(s.x, s.y, currentR, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // 3D highlight rim stroke
        ctx.strokeStyle = `rgba(${s.baseColor}, 0.07)`;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      });

      // C. UPDATE & DRAW AI NETWORK NODES
      pts.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.c},.65)`;
        ctx.fill();
      });

      // D. DRAW NETWORK CONNECTION LINES (Optimized squared distance check)
      const maxDistance = 130;
      const maxDistanceSq = maxDistance * maxDistance;

      pts.forEach((a, i) => {
        pts.slice(i + 1).forEach((b) => {
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const distSq = dx * dx + dy * dy;

          if (distSq < maxDistanceSq) {
            const d = Math.sqrt(distSq);
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(124,58,237,${0.11 * (1 - d / maxDistance)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });

      animationFrameId = requestAnimationFrame(animPts);
    };

    animPts();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // --- Optimized Custom Cursor Positioning (Direct position update, CSS transition handles smooth lag) ---
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (cursorRef.current) {
        cursorRef.current.style.left = `${e.clientX}px`;
        cursorRef.current.style.top = `${e.clientY}px`;
      }
      if (cursorRingRef.current) {
        cursorRingRef.current.style.left = `${e.clientX}px`;
        cursorRingRef.current.style.top = `${e.clientY}px`;
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // --- IntersectionObserver for Scroll Reveal on Route Changes ---
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.12 }
    );

    // Timeout allows DOM to fully render after route changes
    const timer = setTimeout(() => {
      const revealElements = document.querySelectorAll('.reveal');
      revealElements.forEach((el) => observer.observe(el));
    }, 200);

    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, [location.pathname]); // Trigger whenever route changes

  return (
    <>
      {/* ─── Animated Background Container (position: fixed, inset: 0, z-index: -1, pointer-events: none) ─── */}
      <div
        id="cineverse-bg-container"
        className="fixed inset-0 pointer-events-none"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: -1,
          pointerEvents: 'none',
        }}
      >
        {/* Particles & 3D Vector Canvas */}
        <canvas
          ref={canvasRef}
          id="particles"
          className="absolute inset-0 w-full h-full opacity-60"
          style={{ pointerEvents: 'none', mixBlendMode: 'screen' }}
        />

        {/* Radial Cloud Backdrop & Grid overlay */}
        <div className="absolute inset-0 w-full h-full">
          {/* Glow backdrop layer with animated floating blobs */}
          <div className="absolute inset-0 overflow-hidden bg-[#0B0F17]">
            {/* Animated Blob 1: Purple Cosmic Glow */}
            <div 
              className="absolute rounded-full filter blur-[100px] opacity-60"
              style={{
                width: '650px',
                height: '650px',
                background: 'radial-gradient(circle, rgba(124, 58, 237, 0.22) 0%, transparent 75%)',
                top: '-15%',
                right: '5%',
                animation: 'floatBlob1 28s ease-in-out infinite alternate',
              }}
            />
            {/* Animated Blob 2: Cyan Neon Aura */}
            <div 
              className="absolute rounded-full filter blur-[100px] opacity-65"
              style={{
                width: '550px',
                height: '550px',
                background: 'radial-gradient(circle, rgba(34, 211, 238, 0.16) 0%, transparent 75%)',
                bottom: '-10%',
                left: '5%',
                animation: 'floatBlob2 35s ease-in-out infinite alternate',
              }}
            />
            {/* Animated Blob 3: Deep Pink Atmospheric Cloud */}
            <div 
              className="absolute rounded-full filter blur-[100px] opacity-45"
              style={{
                width: '600px',
                height: '600px',
                background: 'radial-gradient(circle, rgba(219, 39, 119, 0.1) 0%, transparent 75%)',
                top: '25%',
                left: '30%',
                animation: 'floatBlob3 24s ease-in-out infinite alternate',
              }}
            />
          </div>
          {/* Grid pattern layer */}
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
              backgroundSize: '60px 60px',
              opacity: 0.3
            }}
          />
        </div>
      </div>

      {/* ─── Custom Cursor Elements (remain on top) ─── */}
      <div
        ref={cursorRef}
        id="cursor"
        className="fixed pointer-events-none z-[9999] rounded-full -translate-x-1/2 -translate-y-1/2 transition-[width,height,background-color] duration-200"
        style={{
          width: '12px',
          height: '12px',
          backgroundColor: 'var(--cyan)',
          left: '-20px',
          top: '-20px',
        }}
      />
      <div
        ref={cursorRingRef}
        id="cursor-ring"
        className="fixed pointer-events-none z-[9998] rounded-full -translate-x-1/2 -translate-y-1/2 opacity-70 transition-all duration-[0.12s] ease-out"
        style={{
          width: '36px',
          height: '36px',
          border: '1.5px solid var(--accent)',
          left: '-50px',
          top: '-50px',
        }}
      />
    </>
  );
}
