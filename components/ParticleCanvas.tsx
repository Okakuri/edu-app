"use client";
import { useEffect, useRef } from "react";

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  radius: number;
  color: string;
  alpha: number;
  gravity: number;
  rotation: number;
  rotSpeed: number;
  shape: "circle" | "star" | "square";
}

const COLORS = ["#7c4dff","#e040fb","#ffc107","#29b6f6","#66bb6a","#ff7043","#ec407a","#26c6da"];

function randomBetween(a: number, b: number) { return a + Math.random() * (b - a); }

function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = (i * 4 * Math.PI) / 5 - Math.PI / 2;
    const b = ((i * 4 + 2) * Math.PI) / 5 - Math.PI / 2;
    if (i === 0) ctx.moveTo(x + r * Math.cos(a), y + r * Math.sin(a));
    else ctx.lineTo(x + r * Math.cos(a), y + r * Math.sin(a));
    ctx.lineTo(x + (r * 0.4) * Math.cos(b), y + (r * 0.4) * Math.sin(b));
  }
  ctx.closePath();
}

export interface ParticleCanvasRef {
  burst: (x?: number, y?: number, count?: number) => void;
}

interface Props {
  onRef?: (ref: ParticleCanvasRef) => void;
}

export default function ParticleCanvas({ onRef }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);
  const runningRef = useRef(false);

  const burst = (
    x = typeof window !== "undefined" ? window.innerWidth / 2 : 200,
    y = typeof window !== "undefined" ? window.innerHeight * 0.35 : 200,
    count = 60
  ) => {
    for (let i = 0; i < count; i++) {
      const angle = randomBetween(0, Math.PI * 2);
      const speed = randomBetween(4, 12);
      particlesRef.current.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - randomBetween(2, 6),
        radius: randomBetween(4, 9),
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        alpha: 1,
        gravity: randomBetween(0.2, 0.4),
        rotation: randomBetween(0, Math.PI * 2),
        rotSpeed: randomBetween(-0.15, 0.15),
        shape: (["circle", "star", "square"] as const)[Math.floor(Math.random() * 3)],
      });
    }
    if (!runningRef.current) startLoop();
  };

  const startLoop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    runningRef.current = true;

    const loop = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current = particlesRef.current.filter(p => p.alpha > 0.02);

      for (const p of particlesRef.current) {
        p.vy += p.gravity;
        p.vx *= 0.99;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotSpeed;
        p.alpha -= 0.018;

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);

        if (p.shape === "circle") {
          ctx.beginPath();
          ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === "star") {
          drawStar(ctx, 0, 0, p.radius);
          ctx.fill();
        } else {
          ctx.fillRect(-p.radius / 2, -p.radius / 2, p.radius, p.radius);
        }
        ctx.restore();
      }

      if (particlesRef.current.length > 0) {
        rafRef.current = requestAnimationFrame(loop);
      } else {
        runningRef.current = false;
      }
    };
    rafRef.current = requestAnimationFrame(loop);
  };

  useEffect(() => {
    if (onRef) onRef({ burst });
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="particle-canvas"
      style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 100 }}
    />
  );
}
