"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function SplashPage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [transitioning, setTransitioning] = useState(false);

  // Handle particle grid matrix canvas rendering (high-tech cinematic effect)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      color: string;
    }> = [];

    // Create custom particles
    const particleCount = Math.min(Math.floor(width / 15), 80);
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 2 + 1,
        color: i % 2 === 0 ? "rgba(139, 92, 246, 0.25)" : "rgba(59, 130, 246, 0.25)",
      });
    }

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Mouse movement interaction parameters
    let mouse = { x: -1000, y: -1000 };
    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    window.addEventListener("mousemove", handleMouseMove);

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Render organic connections
      ctx.lineWidth = 0.5;
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        p1.x += p1.vx;
        p1.y += p1.vy;

        // Boundary bounce
        if (p1.x < 0 || p1.x > width) p1.vx *= -1;
        if (p1.y < 0 || p1.y > height) p1.vy *= -1;

        // Draw particle node
        ctx.beginPath();
        ctx.arc(p1.x, p1.y, p1.radius, 0, Math.PI * 2);
        ctx.fillStyle = p1.color;
        ctx.fill();

        // Connect nodes inside radius
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
          if (dist < 110) {
            ctx.strokeStyle = `rgba(139, 92, 246, ${0.12 * (1 - dist / 110)})`;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }

        // Connect to mouse cursor if close
        const mDist = Math.hypot(p1.x - mouse.x, p1.y - mouse.y);
        if (mDist < 160) {
          ctx.strokeStyle = `rgba(59, 130, 246, ${0.25 * (1 - mDist / 160)})`;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  // Handle auto-redirection after 2.5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("splash-completed", "true");
      }
      setTransitioning(true);
      const routeTimeout = setTimeout(() => {
        router.push("/login");
      }, 1200);
      return () => clearTimeout(routeTimeout);
    }, 2500);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-[#02040A] text-white overflow-hidden select-none">
      
      {/* ── HIGH-TECH CANVAS INTERACTIVE MATRIX ── */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none opacity-80" />

      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/4 w-[35vw] h-[35vw] rounded-full bg-violet-600/10 blur-[120px] animate-pulse" style={{ animationDuration: "10s" }} />
      <div className="absolute bottom-1/4 right-1/4 w-[40vw] h-[40vw] rounded-full bg-blue-600/10 blur-[130px] animate-pulse" style={{ animationDuration: "14s" }} />

      {/* Cyber scanning sweep lines */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-500/5 to-transparent h-[40vh] w-full animate-scanline pointer-events-none" />

      {/* Grid overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
          backgroundSize: "45px 45px"
        }}
      />

      {/* ── CINEMATIC SPLASH CONTENT ── */}
      <AnimatePresence mode="wait">
        {!transitioning ? (
          <motion.div
            key="splash-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ 
              opacity: 0,
              scale: 2.2,
              filter: "blur(15px)",
              transition: { duration: 1.0, ease: [0.16, 1, 0.3, 1] } 
            }}
            className="flex flex-col items-center relative z-10 w-full max-w-2xl px-6"
          >
            {/* Business Logo Section */}
            <div className="relative mb-8 group cursor-pointer">
              
              {/* Outer neon sweep circle */}
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 16, ease: "linear" }}
                className="absolute -inset-8 rounded-full border border-dashed border-violet-500/30 group-hover:border-violet-500/60 transition-colors duration-500"
              />

              {/* Inner fast cyber radar circle */}
              <motion.div 
                animate={{ rotate: -360 }}
                transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                className="absolute -inset-4 rounded-full border border-transparent border-t-blue-500/40 border-b-fuchsia-500/40 blur-[1px]"
              />

              {/* Glowing ring glow bloom */}
              <div className="absolute inset-0 rounded-3xl bg-blue-500/20 blur-xl group-hover:scale-110 transition duration-500" />
              
              {/* Centered Business Logo */}
              <motion.div
                initial={{ scale: 0.4, opacity: 0, rotate: -20 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 90, 
                  damping: 14,
                  delay: 0.2
                }}
                className="relative h-32 w-32 rounded-3xl border border-white/10 bg-white p-3 shadow-2xl shadow-blue-500/10 flex items-center justify-center active:scale-95 transition-transform"
              >
                <img src="/logo.png" alt="EECO GROUP Logo" className="h-full w-full object-contain animate-wiggle" />
              </motion.div>
            </div>

            {/* Typography */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
              className="text-center"
            >
              <h1 className="text-3xl md:text-4.5xl font-black tracking-[0.22em] uppercase bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-violet-300 to-fuchsia-400 drop-shadow-sm leading-none">
                EECO GROUP
              </h1>
              <div className="mt-4 flex items-center justify-center">
                <span className="px-3.5 py-1.5 rounded-full border border-white/10 bg-white/5 text-[10px] md:text-xs font-bold uppercase tracking-[0.25em] text-slate-350 shadow-sm flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block animate-pulse shrink-0" />
                  POS System Version 1.0
                </span>
              </div>
            </motion.div>
          </motion.div>
        ) : (
          /* CINEMATIC CAMERA SHUTTER IRIS EXPOSE */
          <motion.div
            key="iris-shutter"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none"
          >
            {/* Shutter explosion light flare */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.1 }}
              animate={{ opacity: [0, 1, 0], scale: [0.1, 4, 8] }}
              transition={{ duration: 1.1, ease: "easeInOut" }}
              className="absolute h-96 w-96 rounded-full bg-white blur-[50px]"
            />
            {/* Smooth deep black transition shutter */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="absolute inset-0 bg-[#02040A]"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
