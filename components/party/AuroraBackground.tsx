"use client";

import { useEffect, useRef } from "react";

export function AuroraBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener("resize", resize);

    // Floating ornaments
    const ornaments: { x: number; y: number; size: number; color: string; speed: number; phase: number }[] = [];
    const ornamentColors = ["#FF2A5D", "#00FF94", "#FFD600", "#00F0FF", "#FF6B9D"];
    for (let i = 0; i < 12; i++) {
      ornaments.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: Math.random() * 20 + 10,
        color: ornamentColors[Math.floor(Math.random() * ornamentColors.length)],
        speed: Math.random() * 0.3 + 0.1,
        phase: Math.random() * Math.PI * 2,
      });
    }

    // Stars
    const stars: { x: number; y: number; size: number; twinkle: number }[] = [];
    for (let i = 0; i < 100; i++) {
      stars.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: Math.random() * 2 + 0.5,
        twinkle: Math.random() * Math.PI * 2,
      });
    }

    // Snowflakes
    const snowflakes: { x: number; y: number; r: number; speed: number; opacity: number; wobble: number }[] = [];
    for (let i = 0; i < 100; i++) {
      snowflakes.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        r: Math.random() * 3 + 1,
        speed: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.6 + 0.2,
        wobble: Math.random() * Math.PI * 2,
      });
    }

    const draw = () => {
      time += 0.008;

      // Deep cozy gradient base
      const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      bgGradient.addColorStop(0, "#0a0515");
      bgGradient.addColorStop(0.5, "#0d0820");
      bgGradient.addColorStop(1, "#150a25");
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Aurora blobs - more vibrant, larger, slower movement
      const blobs = [
        { x: canvas.width * 0.15, y: canvas.height * 0.25, color: [255, 42, 93], size: 500, intensity: 0.25 },
        { x: canvas.width * 0.85, y: canvas.height * 0.15, color: [0, 255, 148], size: 450, intensity: 0.2 },
        { x: canvas.width * 0.5, y: canvas.height * 0.85, color: [0, 240, 255], size: 550, intensity: 0.18 },
        { x: canvas.width * 0.75, y: canvas.height * 0.55, color: [255, 214, 0], size: 400, intensity: 0.15 },
        { x: canvas.width * 0.25, y: canvas.height * 0.7, color: [255, 107, 157], size: 350, intensity: 0.12 },
      ];

      blobs.forEach((blob, i) => {
        const offsetX = Math.sin(time * 0.5 + i * 1.2) * 80;
        const offsetY = Math.cos(time * 0.4 + i * 1.5) * 60;
        const pulseFactor = 1 + Math.sin(time + i) * 0.1;
        
        const gradient = ctx.createRadialGradient(
          blob.x + offsetX, blob.y + offsetY, 0,
          blob.x + offsetX, blob.y + offsetY, blob.size * pulseFactor
        );
        gradient.addColorStop(0, `rgba(${blob.color.join(",")}, ${blob.intensity})`);
        gradient.addColorStop(0.5, `rgba(${blob.color.join(",")}, ${blob.intensity * 0.5})`);
        gradient.addColorStop(1, "transparent");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      });

      // Twinkling stars
      stars.forEach((star) => {
        const twinkle = Math.sin(time * 3 + star.twinkle) * 0.5 + 0.5;
        ctx.globalAlpha = twinkle * 0.8;
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      // Floating ornaments with glow
      ornaments.forEach((orb, i) => {
        const floatY = Math.sin(time * orb.speed + orb.phase) * 30;
        const floatX = Math.cos(time * orb.speed * 0.5 + orb.phase) * 15;
        
        // Glow
        const glow = ctx.createRadialGradient(
          orb.x + floatX, orb.y + floatY, 0,
          orb.x + floatX, orb.y + floatY, orb.size * 3
        );
        glow.addColorStop(0, orb.color + "40");
        glow.addColorStop(1, "transparent");
        ctx.fillStyle = glow;
        ctx.fillRect(orb.x + floatX - orb.size * 3, orb.y + floatY - orb.size * 3, orb.size * 6, orb.size * 6);
        
        // Ornament ball
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = orb.color;
        ctx.beginPath();
        ctx.arc(orb.x + floatX, orb.y + floatY, orb.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Shine
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(orb.x + floatX - orb.size * 0.3, orb.y + floatY - orb.size * 0.3, orb.size * 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      // Snowflakes with glow
      snowflakes.forEach((flake) => {
        ctx.globalAlpha = flake.opacity;
        
        // Subtle glow
        const snowGlow = ctx.createRadialGradient(flake.x, flake.y, 0, flake.x, flake.y, flake.r * 3);
        snowGlow.addColorStop(0, "rgba(255,255,255,0.3)");
        snowGlow.addColorStop(1, "transparent");
        ctx.fillStyle = snowGlow;
        ctx.beginPath();
        ctx.arc(flake.x, flake.y, flake.r * 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Core
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(flake.x, flake.y, flake.r, 0, Math.PI * 2);
        ctx.fill();

        flake.y += flake.speed;
        flake.x += Math.sin(time * 2 + flake.wobble) * 0.5;
        if (flake.y > canvas.height + 10) {
          flake.y = -10;
          flake.x = Math.random() * canvas.width;
        }
      });
      ctx.globalAlpha = 1;

      // Cinematic vignette
      const vignette = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, canvas.height * 0.4,
        canvas.width / 2, canvas.height / 2, canvas.height
      );
      vignette.addColorStop(0, "transparent");
      vignette.addColorStop(1, "rgba(0, 0, 0, 0.5)");
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      aria-hidden="true"
    />
  );
}
