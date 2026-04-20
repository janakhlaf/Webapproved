import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Hero3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const animationFrameRef = useRef<number>();
  const particlesRef = useRef<Array<{
    x: number;
    y: number;
    z: number;
    vx: number;
    vy: number;
    vz: number;
    size: number;
    opacity: number;
  }>>([]);
  const cameraRef = useRef({ x: 0, y: 0, z: 0, rotationY: 0 });
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const particleCount = 200;
    particlesRef.current = Array.from({ length: particleCount }, () => ({
      x: (Math.random() - 0.5) * 2000,
      y: (Math.random() - 0.5) * 2000,
      z: Math.random() * 2000 - 1000,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      vz: (Math.random() - 0.5) * 0.5,
      size: Math.random() * 2 + 1,
      opacity: Math.random() * 0.5 + 0.3,
    }));

    const animate = () => {
      if (!ctx || !canvas) return;

      timeRef.current += 0.01;

      ctx.fillStyle = 'rgba(10, 10, 10, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      cameraRef.current.rotationY = Math.sin(timeRef.current * 0.2) * 0.3;
      cameraRef.current.y = Math.sin(timeRef.current * 0.3) * 50;

      particlesRef.current.forEach((particle) => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.z += particle.vz;

        if (Math.abs(particle.x) > 1000) particle.vx *= -1;
        if (Math.abs(particle.y) > 1000) particle.vy *= -1;
        if (particle.z > 1000 || particle.z < -1000) particle.vz *= -1;

        const rotatedX = particle.x * Math.cos(cameraRef.current.rotationY) - particle.z * Math.sin(cameraRef.current.rotationY);
        const rotatedZ = particle.x * Math.sin(cameraRef.current.rotationY) + particle.z * Math.cos(cameraRef.current.rotationY);

        const perspective = 800;
        const scale = perspective / (perspective + rotatedZ);

        const screenX = rotatedX * scale + canvas.width / 2;
        const screenY = (particle.y - cameraRef.current.y) * scale + canvas.height / 2;

        if (rotatedZ > -perspective && scale > 0) {
          const size = particle.size * scale;
          const opacity = particle.opacity * Math.max(0, 1 - rotatedZ / 1000);

          const gradient = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, size * 2);
          gradient.addColorStop(0, `rgba(0, 217, 255, ${opacity})`);
          gradient.addColorStop(0.5, `rgba(168, 85, 247, ${opacity * 0.5})`);
          gradient.addColorStop(1, 'rgba(0, 217, 255, 0)');

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(screenX, screenY, size * 2, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      const connectionDistance = 150;
      ctx.strokeStyle = 'rgba(0, 217, 255, 0.1)';
      ctx.lineWidth = 1;

      for (let i = 0; i < particlesRef.current.length; i++) {
        for (let j = i + 1; j < particlesRef.current.length; j++) {
          const p1 = particlesRef.current[i];
          const p2 = particlesRef.current[j];

          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dz = p1.z - p2.z;
          const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (distance < connectionDistance) {
            const rotatedX1 = p1.x * Math.cos(cameraRef.current.rotationY) - p1.z * Math.sin(cameraRef.current.rotationY);
            const rotatedZ1 = p1.x * Math.sin(cameraRef.current.rotationY) + p1.z * Math.cos(cameraRef.current.rotationY);
            const scale1 = 800 / (800 + rotatedZ1);
            const screenX1 = rotatedX1 * scale1 + canvas.width / 2;
            const screenY1 = (p1.y - cameraRef.current.y) * scale1 + canvas.height / 2;

            const rotatedX2 = p2.x * Math.cos(cameraRef.current.rotationY) - p2.z * Math.sin(cameraRef.current.rotationY);
            const rotatedZ2 = p2.x * Math.sin(cameraRef.current.rotationY) + p2.z * Math.cos(cameraRef.current.rotationY);
            const scale2 = 800 / (800 + rotatedZ2);
            const screenX2 = rotatedX2 * scale2 + canvas.width / 2;
            const screenY2 = (p2.y - cameraRef.current.y) * scale2 + canvas.height / 2;

            if (rotatedZ1 > -800 && rotatedZ2 > -800) {
              ctx.beginPath();
              ctx.moveTo(screenX1, screenY1);
              ctx.lineTo(screenX2, screenY2);
              ctx.stroke();
            }
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    setIsLoaded(true);
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const scrollToContent = () => {
    window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-background">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />

      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/20 to-background" />

      <div className="relative z-10 flex flex-col items-center justify-center h-full px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 30 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="space-y-6"
        >
          <motion.div
            className="inline-block px-6 py-2 mb-4 rounded-full bg-primary/10 border border-primary/20"
            whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(0, 217, 255, 0.3)' }}
          >
            <span className="text-sm font-medium text-primary">Graduation Project 2026</span>
          </motion.div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Human Mind
            </span>
            <br />
            <span className="text-foreground">&</span>
            <br />
            <span className="bg-gradient-to-r from-accent via-primary to-accent bg-clip-text text-transparent">
              AI Logic
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground">
            Explore the cinematic intersection of AI, memory, creativity, and interactive 3D experiences
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
            <Button
              size="lg"
              className="group relative overflow-hidden bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg"
            >
              <span className="relative z-10">Explore Films</span>
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent opacity-0 group-hover:opacity-100 transition-opacity" />
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="group border-primary/50 hover:border-primary hover:bg-primary/10 px-8 py-6 text-lg"
            >
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent group-hover:from-accent group-hover:to-primary">
                Explore 3D Assets
              </span>
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isLoaded ? 1 : 0 }}
          transition={{ duration: 1, delay: 2 }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2"
        >
          <button
            onClick={scrollToContent}
            className="flex flex-col items-center gap-2 text-muted-foreground hover:text-primary transition-colors group"
          >
            <span className="text-sm font-medium">Scroll to explore</span>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <ChevronDown className="w-6 h-6 group-hover:text-primary" />
            </motion.div>
          </button>
        </motion.div>
      </div>

      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
    </div>
  );
}
