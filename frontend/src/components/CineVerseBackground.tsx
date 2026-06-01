import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

export default function CineVerseBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const location = useLocation();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let W = (canvas.width = window.innerWidth);
    let H = (canvas.height = window.innerHeight);
    let scrollY = window.scrollY;

    // Mouse Tracking (normal and smoothed)
    const mouse = { x: -1000, y: -1000, active: false, rx: -1000, ry: -1000 };

    // Spatial travel warp state variables
    let warpActive = false;
    let warpFactor = 0;
    let warpDir = 1; // 1 for forward, -1 for backward

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    };

    const handleMouseLeave = () => {
      mouse.active = false;
      mouse.x = -1000;
      mouse.y = -1000;
    };

    const handleScroll = () => {
      scrollY = window.scrollY;
    };

    const handleResize = () => {
      if (!canvas) return;
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };

    // Custom Event Listener to track transitions
    const handleTransition = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      warpDir = detail.direction;
      warpActive = true;
      warpFactor = 1.0; // Trigger full warp speed boost
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);
    window.addEventListener('cineverse-transition', handleTransition);

    // --- SYSTEM INITIALIZATIONS ---

    // 1. Digital Dust (120 particles)
    const dustParticles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      depth: number; // 0.1 to 1.0 (for parallax)
      opacity: number;
      color: string;
    }> = [];

    for (let i = 0; i < 120; i++) {
      const depth = Math.random() * 0.9 + 0.1;
      dustParticles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.15 * depth,
        vy: -(Math.random() * 0.3 + 0.1) * depth, // drift upwards
        size: Math.random() * 1.5 + 0.5,
        depth,
        opacity: Math.random() * 0.3 + 0.1,
        color: Math.random() > 0.4 ? '34,211,238' : '139,92,246', // cyan or purple
      });
    }

    // 2. AI Neural Nodes (90 nodes)
    const nodes: Array<{
      x: number;
      y: number;
      baseX: number;
      baseY: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      pulse: number;
      pulseSpeed: number;
      depth: number;
    }> = [];

    for (let i = 0; i < 90; i++) {
      const x = Math.random() * W;
      const y = Math.random() * H;
      nodes.push({
        x,
        y,
        baseX: x,
        baseY: y,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 3 + 1.5,
        color: Math.random() > 0.5 ? '0,240,255' : '139,92,246', // cyan or purple
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.02 + Math.random() * 0.03,
        depth: Math.random() * 0.6 + 0.4,
      });
    }

    // 3. Energy Pulses traveling along connections
    const energyPulses: Array<{
      startX: number;
      startY: number;
      endX: number;
      endY: number;
      progress: number;
      speed: number;
      color: string;
    }> = [];

    // 4. Data Streams (Binary digital rain, 20 columns)
    const dataStreams: Array<{
      x: number;
      y: number;
      speed: number;
      chars: string[];
      opacity: number;
      size: number;
    }> = [];

    for (let i = 0; i < 20; i++) {
      dataStreams.push({
        x: Math.random() * W,
        y: Math.random() * H - H,
        speed: Math.random() * 1.5 + 0.8,
        chars: Array.from({ length: 12 }, () => (Math.random() > 0.5 ? '1' : '0')),
        opacity: Math.random() * 0.25 + 0.08,
        size: Math.floor(Math.random() * 5) + 9, // font size 9px to 14px
      });
    }

    // 5. 3D Wireframe Cubes (4 cubes)
    const cubes3D: Array<{
      cx: number;
      cy: number;
      cz: number;
      size: number;
      rx: number;
      ry: number;
      rz: number;
      rvx: number;
      rvy: number;
      rvz: number;
      depth: number;
      color: string;
    }> = [];

    for (let i = 0; i < 4; i++) {
      cubes3D.push({
        cx: Math.random() * W,
        cy: Math.random() * H,
        cz: Math.random() * 400 + 200,
        size: Math.random() * 60 + 40,
        rx: Math.random() * Math.PI,
        ry: Math.random() * Math.PI,
        rz: Math.random() * Math.PI,
        rvx: (Math.random() - 0.5) * 0.008,
        rvy: (Math.random() - 0.5) * 0.008,
        rvz: (Math.random() - 0.5) * 0.008,
        depth: Math.random() * 0.5 + 0.5,
        color: i % 2 === 0 ? '0, 240, 255' : '139, 92, 246',
      });
    }

    // 6. 3D Wireframe Sphere (1 large central/mid sphere)
    const sphere3D = {
      cx: W * 0.5,
      cy: H * 0.6,
      cz: 500,
      radius: 120,
      rx: 0,
      ry: 0.002,
      rz: 0.001,
      color: '0, 240, 255',
    };

    // 7. Concentric Holographic Rings (3 rings)
    const holoRings = [
      { cx: W * 0.2, cy: H * 0.3, r: 150, speed: 0.001, angle: 0, color: '139,92,246', opacity: 0.1 },
      { cx: W * 0.8, cy: H * 0.7, r: 220, speed: -0.0006, angle: 1.2, color: '0,240,255', opacity: 0.08 },
      { cx: W * 0.5, cy: H * 0.45, r: 280, speed: 0.0003, angle: 0.5, color: '0,240,255', opacity: 0.05 },
    ];

    // 8. Procedural Circuit Traces
    const circuits: Array<{
      points: Array<{ x: number; y: number }>;
      progress: number;
      speed: number;
      opacity: number;
      color: string;
    }> = [];

    const spawnCircuit = () => {
      if (circuits.length > 8) return;
      const startX = Math.random() * W;
      const startY = Math.random() * H;
      const p = [{ x: startX, y: startY }];
      let currentX = startX;
      let currentY = startY;
      
      const segments = Math.floor(Math.random() * 4) + 3;
      for (let i = 0; i < segments; i++) {
        const len = Math.random() * 80 + 30;
        const dir = Math.random() > 0.5 ? 'H' : 'V';
        if (dir === 'H') {
          currentX += Math.random() > 0.5 ? len : -len;
        } else {
          currentY += Math.random() > 0.5 ? len : -len;
        }
        p.push({ x: currentX, y: currentY });
      }

      circuits.push({
        points: p,
        progress: 0,
        speed: 0.015 + Math.random() * 0.02,
        opacity: Math.random() * 0.3 + 0.1,
        color: Math.random() > 0.5 ? '0,240,255' : '139,92,246',
      });
    };

    // 9. Robotic Holographic Face Silhouettes (Low opacity, rare spawns)
    const roboticFace = {
      x: W * 0.5,
      y: H * 0.5,
      opacity: 0,
      targetOpacity: 0,
      fadeTimer: 0,
      scale: 1,
      lines: [
        // Outlines
        [[-40, -40], [40, -40], [50, -10], [30, 40], [0, 60], [-30, 40], [-50, -10], [-40, -40]],
        // Forehead circuits
        [[-20, -40], [-20, -25], [20, -25], [20, -40]],
        [[-10, -25], [-10, -15], [10, -15], [10, -25]],
        // Eye slots
        [[-30, -5], [-10, -5], [-15, 5], [-25, 5], [-30, -5]],
        [[10, -5], [[30, -5] as any], [25, 5], [15, 5], [10, -5]],
        // Nose bridge
        [[0, -15], [0, 15], [-8, 25], [8, 25]],
        // Cheek details
        [[-42, 0], [-32, 20]],
        [[42, 0], [32, 20]],
        // Mouth segment
        [[-15, 38], [15, 38]],
        [[-8, 45], [8, 45]],
      ],
    };

    // Spawn initial circuits
    for (let i = 0; i < 5; i++) {
      spawnCircuit();
    }

    // --- MAIN DRAW & ANIMATION LOOP ---
    const draw = () => {
      ctx.clearRect(0, 0, W, H);

      // Decelerate page transition warp factor smoothly
      if (warpActive) {
        warpFactor -= 0.025; // Warp duration is matched to page exit transition (~700ms)
        if (warpFactor <= 0) {
          warpActive = false;
          warpFactor = 0;
        }
      }

      // Smooth mouse coordinates interpolation
      if (mouse.rx === -1000) {
        mouse.rx = mouse.x;
        mouse.ry = mouse.y;
      } else {
        mouse.rx += (mouse.x - mouse.rx) * 0.08;
        mouse.ry += (mouse.y - mouse.ry) * 0.08;
      }

      // Parallax mouse offsets based on depth layers
      const getMouseOffset = (depth: number) => {
        if (!mouse.active) return { x: 0, y: 0 };
        const maxOffset = 45;
        const dx = (mouse.rx - W / 2) / (W / 2);
        const dy = (mouse.ry - H / 2) / (H / 2);
        return {
          x: dx * maxOffset * depth,
          y: dy * maxOffset * depth,
        };
      };

      // ─── LAYER 1: LARGE COSMIC GLOW BACKDROP ───
      // Handled primarily via hardware-accelerated CSS blobs

      // ─── LAYER 2: 3D PERSPECTIVE GRID (Scroll-reactive & Travel sliding) ───
      ctx.save();
      const gridY = H * 0.55; // Horizon
      
      // Vanishing point slides dynamically sideways on navigation to simulate camera panning!
      const warpXOffset = warpActive ? warpDir * warpFactor * 320 : 0;
      const vanishingPointX = W * 0.5 + (mouse.active ? (mouse.rx - W / 2) * 0.05 : 0) - warpXOffset;
      const vanishingPointY = gridY;

      // Horizon glow
      const horizonGlow = ctx.createLinearGradient(0, gridY - 50, 0, gridY + 200);
      horizonGlow.addColorStop(0, 'rgba(6, 11, 22, 0)');
      horizonGlow.addColorStop(0.2, 'rgba(0, 240, 255, 0.015)');
      horizonGlow.addColorStop(0.5, 'rgba(139, 92, 246, 0.008)');
      horizonGlow.addColorStop(1, 'rgba(2, 4, 8, 0)');
      ctx.fillStyle = horizonGlow;
      ctx.fillRect(0, gridY - 50, W, H - gridY + 50);

      // Vertical perspective lines
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.045)';
      ctx.lineWidth = 0.8;
      const lineCount = 38;
      for (let i = -lineCount / 2; i <= lineCount / 2; i++) {
        const progress = i / (lineCount / 2);
        const targetX = W / 2 + progress * (W * 0.95);
        ctx.beginPath();
        ctx.moveTo(vanishingPointX, vanishingPointY);
        ctx.lineTo(targetX, H);
        ctx.stroke();
      }

      // Horizontal compressing lines (warp speed boosts scroll velocity)
      const horizCount = 14;
      const warpScrollOffset = warpActive ? warpFactor * warpDir * 180 : 0;
      const scrollOffset = ((scrollY * 0.28) + warpScrollOffset) % 60;
      
      for (let i = 0; i < horizCount; i++) {
        const ratio = (i + scrollOffset / 60) / horizCount;
        const lineY = gridY + (H - gridY) * Math.pow(ratio, 2.3);

        ctx.strokeStyle = `rgba(0, 240, 255, ${0.05 * Math.pow(ratio, 2.2)})`;
        ctx.beginPath();
        ctx.moveTo(0, lineY);
        ctx.lineTo(W, lineY);
        ctx.stroke();
      }
      ctx.restore();

      // ─── LAYER 3: CONCENTRIC HOLOGRAPHIC TECH RINGS ───
      holoRings.forEach((r) => {
        r.angle += r.speed;
        const pOff = getMouseOffset(0.2);
        const ringWarpX = warpActive ? warpDir * warpFactor * 120 * 0.2 : 0;
        const finalX = r.cx + pOff.x - ringWarpX;
        const finalY = r.cy + pOff.y - scrollY * 0.15;

        ctx.save();
        ctx.translate(finalX, finalY);
        ctx.rotate(r.angle);

        // Core Ring
        ctx.beginPath();
        ctx.arc(0, 0, r.r, 0, Math.PI * 2);
        ctx.setLineDash([12, 18]);
        ctx.strokeStyle = `rgba(${r.color}, ${r.opacity})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Inner solid border ring
        ctx.beginPath();
        ctx.arc(0, 0, r.r - 12, 0, Math.PI * 2);
        ctx.setLineDash([40, 8, 4, 8]);
        ctx.strokeStyle = `rgba(${r.color}, ${r.opacity * 0.7})`;
        ctx.lineWidth = 0.6;
        ctx.stroke();

        ctx.restore();
      });

      // ─── LAYER 4: DIGITAL DATA STREAMS ───
      ctx.save();
      dataStreams.forEach((stream) => {
        const pOff = getMouseOffset(0.3);
        const streamWarpX = warpActive ? warpDir * warpFactor * 120 * 0.3 : 0;
        const finalX = stream.x + pOff.x - streamWarpX;
        const finalY = stream.y + pOff.y - scrollY * 0.1;

        ctx.font = `bold ${stream.size}px 'JetBrains Mono', monospace`;
        ctx.fillStyle = `rgba(0, 240, 255, ${stream.opacity})`;

        stream.chars.forEach((char, idx) => {
          const charY = finalY + idx * (stream.size + 4);
          if (charY > 0 && charY < H) {
            if (idx === stream.chars.length - 1) {
              ctx.fillStyle = `rgba(255, 255, 255, ${stream.opacity * 2.8})`;
            } else {
              ctx.fillStyle = `rgba(0, 240, 255, ${stream.opacity * (idx / stream.chars.length)})`;
            }
            ctx.fillText(char, finalX, charY);
          }
        });

        // Fast forward binary cascades during transition warp
        stream.y += stream.speed + (warpActive ? warpFactor * 9 : 0);
        if (stream.y > H) {
          stream.y = -200;
          stream.x = Math.random() * W;
        }
      });
      ctx.restore();

      // ─── LAYER 5: DIGITAL DUST PARTICLES (Motion Blur Streaking on warp) ───
      dustParticles.forEach((p) => {
        const pOff = getMouseOffset(p.depth * 0.4);
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = W;
        if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H;
        if (p.y > H) p.y = 0;

        const pWarpX = warpActive ? warpDir * warpFactor * 160 * p.depth : 0;
        const finalX = p.x + pOff.x - pWarpX;
        const finalY = (p.y + pOff.y - scrollY * p.depth * 0.3 + H) % H;

        ctx.beginPath();
        if (warpActive) {
          // Horizontal motion blur trail vector opposite to camera slide direction
          const blurLength = warpDir * warpFactor * 55 * p.depth;
          ctx.moveTo(finalX - blurLength, finalY);
          ctx.lineTo(finalX, finalY);
          ctx.strokeStyle = `rgba(${p.color}, ${p.opacity * (1 + warpFactor * 1.5)})`;
          ctx.lineWidth = p.size * (1 + warpFactor * 0.6);
          ctx.stroke();
        } else {
          ctx.arc(finalX, finalY, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${p.color}, ${p.opacity})`;
          ctx.fill();
        }
      });

      // ─── LAYER 6: PROCEDURAL CIRCUIT TRACES ───
      ctx.save();
      circuits.forEach((c, cIdx) => {
        c.progress += c.speed;
        if (c.progress >= c.points.length - 1) {
          circuits.splice(cIdx, 1);
          spawnCircuit();
          return;
        }

        ctx.strokeStyle = `rgba(${c.color}, ${c.opacity})`;
        ctx.lineWidth = 1.2;
        ctx.shadowColor = `rgba(${c.color}, 0.3)`;
        ctx.shadowBlur = 4;

        ctx.beginPath();
        ctx.moveTo(c.points[0].x, c.points[0].y - scrollY * 0.12);
        
        const currentSegment = Math.floor(c.progress);
        const segmentProgress = c.progress - currentSegment;

        for (let i = 1; i <= currentSegment; i++) {
          ctx.lineTo(c.points[i].x, c.points[i].y - scrollY * 0.12);
        }

        const pStart = c.points[currentSegment];
        const pEnd = c.points[currentSegment + 1];
        const currX = pStart.x + (pEnd.x - pStart.x) * segmentProgress;
        const currY = pStart.y + (pEnd.y - pStart.y) * segmentProgress;

        ctx.lineTo(currX, currY - scrollY * 0.12);
        ctx.stroke();
      });
      ctx.restore();

      // ─── LAYER 7: RARE ROBOTIC SILHOUETTE ───
      if (roboticFace.fadeTimer <= 0) {
        roboticFace.targetOpacity = roboticFace.targetOpacity === 0 ? 0.055 : 0;
        roboticFace.fadeTimer = Math.random() * 400 + 400;
        if (roboticFace.targetOpacity > 0) {
          roboticFace.x = W * 0.15 + Math.random() * (W * 0.7);
          roboticFace.y = H * 0.25 + Math.random() * (H * 0.5);
          roboticFace.scale = Math.random() * 0.4 + 0.8;
        }
      } else {
        roboticFace.fadeTimer--;
      }

      roboticFace.opacity += (roboticFace.targetOpacity - roboticFace.opacity) * 0.01;

      if (roboticFace.opacity > 0.001) {
        ctx.save();
        const pOff = getMouseOffset(0.25);
        const faceWarpX = warpActive ? warpDir * warpFactor * 120 * 0.25 : 0;
        ctx.translate(roboticFace.x + pOff.x - faceWarpX, roboticFace.y + pOff.y - scrollY * 0.15);
        ctx.scale(roboticFace.scale, roboticFace.scale);
        
        ctx.strokeStyle = `rgba(0, 240, 255, ${roboticFace.opacity})`;
        ctx.lineWidth = 0.85;

        roboticFace.lines.forEach((line) => {
          ctx.beginPath();
          ctx.moveTo(line[0][0], line[0][1]);
          for (let i = 1; i < line.length; i++) {
            ctx.lineTo(line[i][0], line[i][1]);
          }
          ctx.stroke();
        });
        ctx.restore();
      }

      // ─── LAYER 8: 3D WIREFRAME OBJECTS (Accelerated spin on warp) ───
      ctx.save();
      const project = (x: number, y: number, z: number, size: number) => {
        const focalLength = 380;
        const scale = focalLength / (z + focalLength);
        return {
          x: x * scale * size,
          y: y * scale * size,
          scale,
        };
      };

      // 8a. Floating Cubes
      cubes3D.forEach((cube) => {
        // Accelerate cube rotations during travel transitions!
        const spinSpeedX = cube.rvx + (warpActive ? warpDir * warpFactor * 0.045 : 0);
        const spinSpeedY = cube.rvy + (warpActive ? warpDir * warpFactor * 0.045 : 0);
        cube.rx += spinSpeedX;
        cube.ry += spinSpeedY;
        cube.rz += cube.rvz;

        const pOff = getMouseOffset(cube.depth * 0.5);
        const cubeWarpX = warpActive ? warpDir * warpFactor * 140 * cube.depth : 0;
        const finalCx = cube.cx + pOff.x - cubeWarpX;
        const finalCy = cube.cy + pOff.y - scrollY * cube.depth * 0.2;

        const vertices = [
          [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
          [-1, -1, 1],  [1, -1, 1],  [1, 1, 1],  [-1, 1, 1]
        ];

        const rotatedVertices = vertices.map(([x, y, z]) => {
          let y1 = y * Math.cos(cube.rx) - z * Math.sin(cube.rx);
          let z1 = y * Math.sin(cube.rx) + z * Math.cos(cube.rx);
          let x2 = x * Math.cos(cube.ry) + z1 * Math.sin(cube.ry);
          let z2 = -x * Math.sin(cube.ry) + z1 * Math.cos(cube.ry);
          let x3 = x2 * Math.cos(cube.rz) - y1 * Math.sin(cube.rz);
          let y3 = x2 * Math.sin(cube.rz) + y1 * Math.cos(cube.rz);

          return [x3, y3, z2];
        });

        const projVertices = rotatedVertices.map(([x, y, z]) => {
          const proj = project(x, y, z, cube.size);
          return [proj.x + finalCx, proj.y + finalCy];
        });

        const edges = [
          [0, 1], [1, 2], [2, 3], [3, 0],
          [4, 5], [5, 6], [6, 7], [7, 4],
          [0, 4], [1, 5], [2, 6], [3, 7]
        ];

        ctx.strokeStyle = `rgba(${cube.color}, 0.055)`;
        ctx.lineWidth = 0.75;
        edges.forEach(([u, v]) => {
          ctx.beginPath();
          ctx.moveTo(projVertices[u][0], projVertices[u][1]);
          ctx.lineTo(projVertices[v][0], projVertices[v][1]);
          ctx.stroke();
        });

        cube.cy += Math.sin(Date.now() * 0.0006 + cube.cx) * 0.15;
      });

      // 8b. Central Wireframe Sphere
      sphere3D.ry += 0.0015 + (warpActive ? warpDir * warpFactor * 0.03 : 0);

      const sphereOff = getMouseOffset(0.3);
      const sphereWarpX = warpActive ? warpDir * warpFactor * 120 * 0.3 : 0;
      const sphereFinalX = sphere3D.cx + sphereOff.x - sphereWarpX;
      const sphereFinalY = sphere3D.cy + sphereOff.y - scrollY * 0.18;

      ctx.strokeStyle = `rgba(${sphere3D.color}, 0.038)`;
      ctx.lineWidth = 0.65;

      const latSegments = 10;
      const lonSegments = 16;
      for (let i = 1; i < latSegments; i++) {
        const latAngle = (i * Math.PI) / latSegments;
        const r = sphere3D.radius * Math.sin(latAngle);
        const y = sphere3D.radius * Math.cos(latAngle);

        ctx.beginPath();
        for (let j = 0; j <= lonSegments; j++) {
          const lonAngle = (j * Math.PI * 2) / lonSegments;
          const xLocal = r * Math.cos(lonAngle);
          const zLocal = r * Math.sin(lonAngle);

          const rxLocal = xLocal * Math.cos(sphere3D.ry) + zLocal * Math.sin(sphere3D.ry);
          const rzLocal = -xLocal * Math.sin(sphere3D.ry) + zLocal * Math.cos(sphere3D.ry);

          const proj = project(rxLocal, y, rzLocal, 1);
          const finalX = proj.x + sphereFinalX;
          const finalY = proj.y + sphereFinalY;

          if (j === 0) ctx.moveTo(finalX, finalY);
          else ctx.lineTo(finalX, finalY);
        }
        ctx.stroke();
      }
      ctx.restore();

      // ─── LAYER 9: AI NEURAL NETWORK CLUSTERS (Spatial Parallax offsets) ───
      nodes.forEach((n) => {
        n.pulse += n.pulseSpeed;
        const sizePulse = n.size + Math.sin(n.pulse) * 0.8;

        n.baseX += n.vx;
        n.baseY += n.vy;

        if (n.baseX < 0 || n.baseX > W) n.vx *= -1;
        if (n.baseY < 0 || n.baseY > H) n.vy *= -1;

        let finalX = n.baseX;
        let finalY = n.baseY;

        if (mouse.active) {
          const dx = mouse.rx - n.baseX;
          const dy = mouse.ry - n.baseY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const interactRadius = 180;

          if (dist < interactRadius) {
            const pullForce = (interactRadius - dist) / interactRadius;
            finalX += dx * 0.28 * pullForce;
            finalY += dy * 0.28 * pullForce;
          }
        }

        const pOff = getMouseOffset(n.depth * 0.55);
        // Warp slide offsets the neural cluster according to depth to produce dynamic depth sliding!
        const nodeWarpX = warpActive ? warpDir * warpFactor * 140 * n.depth : 0;
        n.x = finalX + pOff.x - nodeWarpX;
        n.y = finalY + pOff.y - scrollY * n.depth * 0.2;

        ctx.beginPath();
        ctx.arc(n.x, n.y, sizePulse, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${n.color}, ${0.5 + Math.sin(n.pulse) * 0.2})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(n.x, n.y, sizePulse * 0.45, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      });

      const maxDistance = 145;
      const maxDistanceSq = maxDistance * maxDistance;

      nodes.forEach((a, i) => {
        nodes.slice(i + 1).forEach((b) => {
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const distSq = dx * dx + dy * dy;

          if (distSq < maxDistanceSq) {
            const dist = Math.sqrt(distSq);
            const opacity = 0.16 * (1 - dist / maxDistance);

            ctx.beginPath();
            ctx.moveTo(a.x, a.y);

            if (mouse.active) {
              const midX = (a.x + b.x) / 2;
              const midY = (a.y + b.y) / 2;
              const mDx = mouse.rx - midX;
              const mDy = mouse.ry - midY;
              const mDist = Math.sqrt(mDx * mDx + mDy * mDy);
              const bendRadius = 140;

              if (mDist < bendRadius) {
                const bendFactor = (bendRadius - mDist) / bendRadius;
                const ctrlX = midX + mDx * 0.35 * bendFactor;
                const ctrlY = midY + mDy * 0.35 * bendFactor;
                ctx.quadraticCurveTo(ctrlX, ctrlY, b.x, b.y);
              } else {
                ctx.lineTo(b.x, b.y);
              }
            } else {
              ctx.lineTo(b.x, b.y);
            }

            ctx.strokeStyle = `rgba(139, 92, 246, ${opacity})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });

      // Render traveling energy pulses
      energyPulses.forEach((p, idx) => {
        p.progress += p.speed;
        if (p.progress >= 1) {
          energyPulses.splice(idx, 1);
          return;
        }

        const currX = p.startX + (p.endX - p.startX) * p.progress;
        const currY = p.startY + (p.endY - p.startY) * p.progress;

        ctx.shadowColor = `rgba(${p.color}, 0.8)`;
        ctx.shadowBlur = 8;
        ctx.fillStyle = `rgba(${p.color}, 0.95)`;
        ctx.beginPath();
        ctx.arc(currX, currY, 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('cineverse-transition', handleTransition);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const [cursorState, setCursorState] = useState<'default' | 'hover' | 'button' | 'link' | 'chatbot'>('default');

  useEffect(() => {
    let cursorX = -100;
    let cursorY = -100;
    let targetX = -100;
    let targetY = -100;
    let active = false;

    const handleMouseMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
      active = true;
    };

    const handleMouseLeave = () => {
      active = false;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    let animId: number;
    const updatePosition = () => {
      if (active) {
        // High-end smooth easing interpolation (0.15 makes it float like a drone)
        const ease = 0.15;
        cursorX += (targetX - cursorX) * ease;
        cursorY += (targetY - cursorY) * ease;

        if (cursorRef.current) {
          cursorRef.current.style.left = `${cursorX}px`;
          cursorRef.current.style.top = `${cursorY}px`;
          cursorRef.current.style.opacity = '1';
        }
      } else {
        if (cursorRef.current) {
          cursorRef.current.style.opacity = '0';
        }
      }
      animId = requestAnimationFrame(updatePosition);
    };

    animId = requestAnimationFrame(updatePosition);

    // Track mouseover states for interaction morphing
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      if (
        target.closest('#chatbot-container') || 
        target.closest('.chatbot-trigger') || 
        target.closest('[id*="chatbot"]') || 
        target.closest('[class*="chatbot"]')
      ) {
        setCursorState('chatbot');
        return;
      }

      if (
        target.closest('button') || 
        target.closest('[role="button"]') || 
        target.closest('input[type="submit"]') || 
        target.closest('input[type="button"]')
      ) {
        setCursorState('button');
        return;
      }

      if (target.closest('a')) {
        setCursorState('link');
        return;
      }

      if (
        target.closest('input') || 
        target.closest('select') || 
        target.closest('textarea') || 
        target.closest('.cursor-pointer') ||
        target.style.cursor === 'pointer'
      ) {
        setCursorState('hover');
        return;
      }

      setCursorState('default');
    };

    document.addEventListener('mouseover', handleMouseOver);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseover', handleMouseOver);
      cancelAnimationFrame(animId);
    };
  }, []);

  const getRobotSVG = (state: string) => {
    let primary = '#00f0ff';
    let secondary = '#8b5cf6';
    let visorFill = '#00f0ff';
    let glow = 'rgba(0, 240, 255, 0.45)';
    let scale = 1.0;
    
    // Custom eye/pupil shapes based on state
    let eyes = (
      <>
        <circle cx="18" cy="22" r="2" fill="#ffffff" />
        <circle cx="30" cy="22" r="2" fill="#ffffff" />
      </>
    );
    
    let bracketsPath = (
      <>
        <path d="M6 10C6 10 2 14 2 18V26C2 30 6 34 6 34" stroke={secondary} strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
        <path d="M42 10C42 10 46 14 46 18V26C46 30 42 34 42 34" stroke={secondary} strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
      </>
    );

    switch (state) {
      case 'hover':
        primary = '#a855f7';
        secondary = '#00f0ff';
        visorFill = '#a855f7';
        glow = 'rgba(168, 85, 247, 0.65)';
        scale = 1.1;
        eyes = (
          <>
            <ellipse cx="18" cy="22" rx="2.5" ry="1.5" fill="#ffffff" />
            <ellipse cx="30" cy="22" rx="2.5" ry="1.5" fill="#ffffff" />
          </>
        );
        break;
      case 'button':
        primary = '#10b981';
        secondary = '#00f0ff';
        visorFill = '#10b981';
        glow = 'rgba(16, 185, 129, 0.75)';
        scale = 1.2;
        eyes = (
          <>
            <circle cx="24" cy="22" r="3" fill="#ffffff" />
            <circle cx="24" cy="22" r="6" stroke="#ffffff" strokeWidth="1" fill="none" className="animate-pulse" />
          </>
        );
        break;
      case 'link':
        primary = '#f43f5e';
        secondary = '#8b5cf6';
        visorFill = '#f43f5e';
        glow = 'rgba(244, 63, 94, 0.65)';
        scale = 1.15;
        eyes = (
          <>
            <line x1="14" y1="22" x2="34" y2="22" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
          </>
        );
        bracketsPath = (
          <>
            <path d="M4 14L1 22L4 30" stroke={secondary} strokeWidth="2" strokeLinecap="round" />
            <path d="M44 14L47 22L44 30" stroke={secondary} strokeWidth="2" strokeLinecap="round" />
          </>
        );
        break;
      case 'chatbot':
        primary = '#00f0ff';
        secondary = '#ec4899';
        visorFill = 'url(#chatbotVisorGrad)';
        glow = 'rgba(0, 240, 255, 0.8)';
        scale = 1.25;
        eyes = (
          <>
            <path d="M15 24C16 22 17 22 18 24" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M27 24C28 22 29 22 30 24" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" fill="none" />
          </>
        );
        break;
      default:
        break;
    }

    return (
      <svg 
        width="48" 
        height="48" 
        viewBox="0 0 48 48" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        style={{
          transform: `scale(${scale})`,
          transition: 'all 0.25s cubic-bezier(0.25, 0.8, 0.25, 1)',
          filter: `drop-shadow(0 0 8px ${glow})`,
          willChange: 'transform, filter',
        }}
      >
        <defs>
          <linearGradient id="chatbotVisorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00f0ff" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>

        {/* Decorative Outer HUD elements */}
        {bracketsPath}

        {/* Premium Metallic/Glassy Robot Head Shield */}
        <path 
          d="M14 12C14 10 16 8 19 8H29C32 8 34 10 34 12L38 18V28C38 31 36 33 33 35L27 39C25 40 23 40 21 39L15 35C12 33 10 31 10 28V18L14 12Z" 
          fill="rgba(5, 8, 16, 0.93)" 
          stroke={primary} 
          strokeWidth="2" 
          strokeLinejoin="round"
        />

        {/* Futuristic Robotic Visor Area */}
        <path 
          d="M12 18H36V26C36 27.5 35 29 33 30L26 33C25 33.5 23 33.5 22 33L15 30C13 29 12 27.5 12 26V18Z" 
          fill="rgba(10, 15, 30, 0.95)"
          stroke={primary} 
          strokeWidth="1"
        />
        
        {/* Dynamic Glowing Visor Background */}
        <rect x="13" y="19" width="22" height="6" rx="1.5" fill={visorFill} opacity="0.3" />

        {/* Dynamic Interactive Eyes */}
        {eyes}

        {/* Micro tech indicators/ears */}
        <rect x="8" y="20" width="2" height="6" rx="1" fill={secondary} />
        <rect x="38" y="20" width="2" height="6" rx="1" fill={secondary} />
        
        {/* Sub-core energy dot */}
        <circle cx="24" cy="36" r="1.5" fill={primary} className="animate-pulse" />
      </svg>
    );
  };

  return (
    <>
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
        <div className="absolute inset-0 overflow-hidden bg-[#020306]">
          <div className="absolute inset-0 bg-[#020306] opacity-100" />
          <div className="absolute inset-0 bg-radial-gradient from-transparent to-[#010204]/90" />

          {/* Animated Blob 1: Purple Cosmic Glow */}
          <div
            className="absolute rounded-full filter blur-[120px] opacity-25"
            style={{
              width: '850px',
              height: '850px',
              background: 'radial-gradient(circle, rgba(124, 58, 237, 0.16) 0%, transparent 75%)',
              top: '-15%',
              right: '5%',
              animation: 'floatBlob1 28s ease-in-out infinite alternate',
            }}
          />
          {/* Animated Blob 2: Cyan Neon Aura */}
          <div
            className="absolute rounded-full filter blur-[120px] opacity-20"
            style={{
              width: '750px',
              height: '750px',
              background: 'radial-gradient(circle, rgba(0, 240, 255, 0.12) 0%, transparent 75%)',
              bottom: '-10%',
              left: '5%',
              animation: 'floatBlob2 35s ease-in-out infinite alternate',
            }}
          />
          {/* Animated Blob 3: Deep Midnight Navy Atmospheric Cloud */}
          <div
            className="absolute rounded-full filter blur-[130px] opacity-35"
            style={{
              width: '900px',
              height: '900px',
              background: 'radial-gradient(circle, rgba(6, 11, 22, 0.28) 0%, transparent 80%)',
              top: '25%',
              left: '25%',
              animation: 'floatBlob3 24s ease-in-out infinite alternate',
            }}
          />
        </div>

        <canvas
          ref={canvasRef}
          id="particles"
          className="absolute inset-0 w-full h-full opacity-90"
          style={{ pointerEvents: 'none', mixBlendMode: 'screen' }}
        />
      </div>

      <div
        ref={cursorRef}
        id="cursor"
        className="fixed pointer-events-none z-[9999]"
        style={{
          position: 'fixed',
          left: '-100px',
          top: '-100px',
          transform: 'translate(-50%, -50%)',
          willChange: 'left, top, opacity',
          opacity: 0,
          transition: 'opacity 0.3s ease',
        }}
      >
        <div className="animate-robot-float">
          {getRobotSVG(cursorState)}
        </div>
      </div>
    </>
  );
}
