'use client';

import { useEffect, useRef } from 'react';

export function ChristmasBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    // Resize handler with High-DPI support
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);

    // Stars - Reduced density for performance
    const stars: {
      x: number;
      y: number;
      size: number;
      twinkle: number;
      speed: number;
    }[] = [];
    for (let i = 0; i < 100; i++) {
      stars.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: Math.random() * 1.5 + 0.5,
        twinkle: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.03,
      });
    }

    // Snowflakes - Balanced for quality/speed
    const snow: {
      x: number;
      y: number;
      r: number;
      speed: number;
      wobble: number;
      opacity: number;
    }[] = [];
    for (let i = 0; i < 60; i++) {
      snow.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        r: Math.random() * 2 + 1,
        speed: Math.random() * 1.0 + 0.5,
        wobble: Math.random() * Math.PI * 2,
        opacity: Math.random() * 0.4 + 0.2,
      });
    }

    // Neon light bulbs - simplified
    const bulbs = Array.from({ length: 15 }, (_, i) => ({
      x: (window.innerWidth / 15) * i + window.innerWidth / 30,
      color: ['#FF4D6A', '#2ECC71', '#FFD93D', '#00BFFF'][i % 4],
      phase: i * 0.5,
    }));

    // Floating emojis - ambient movement
    const floaters = [
      { emoji: '🎄', x: 0.1, y: 0.2, speed: 0.2, size: 40 },
      { emoji: '⭐', x: 0.85, y: 0.15, speed: 0.3, size: 30 },
      { emoji: '🎁', x: 0.15, y: 0.75, speed: 0.25, size: 35 },
      { emoji: '☕', x: 0.9, y: 0.8, speed: 0.2, size: 30 },
      { emoji: '❄️', x: 0.5, y: 0.1, speed: 0.35, size: 25 },
    ];

    const draw = () => {
      time += 0.005;
      const w = window.innerWidth;
      const h = window.innerHeight;

      // Background gradient - Simplified
      ctx.fillStyle = '#050510'; // Solid base is faster than gradient
      ctx.fillRect(0, 0, w, h);

      // Draw twinkling stars
      ctx.fillStyle = '#fff';
      stars.forEach((star) => {
        const twinkle = Math.sin(time * 2 + star.twinkle) * 0.5 + 0.5;
        ctx.globalAlpha = twinkle * 0.6;

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();

        star.y -= star.speed;
        if (star.y < 0) star.y = h;
      });
      ctx.globalAlpha = 1;

      // Draw neon string lights (Simplified)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, 25);
      for (let i = 0; i <= 15; i++) {
        const x = (w / 15) * i;
        const y = 25 + Math.sin(i * 0.5) * 5;
        ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Bulbs (Solid glows are cheaper)
      bulbs.forEach((bulb) => {
        const bulbX = (w / 15) * (bulbs.indexOf(bulb) + 0.5);
        const y = 25 + Math.sin((bulbX / w) * 10) * 5;
        const glow = Math.sin(time * 3 + bulb.phase) * 0.3 + 0.7;

        ctx.fillStyle = bulb.color;
        ctx.globalAlpha = glow * 0.5;
        ctx.beginPath();
        ctx.arc(bulbX, y + 10, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(bulbX, y + 10, 4, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw snowflakes (Solid circles, no radial gradients)
      ctx.fillStyle = '#fff';
      snow.forEach((flake) => {
        ctx.globalAlpha = flake.opacity;
        ctx.beginPath();
        ctx.arc(flake.x, flake.y, flake.r, 0, Math.PI * 2);
        ctx.fill();

        flake.y += flake.speed;
        flake.x += Math.sin(time + flake.wobble) * 0.3;
        if (flake.y > h + 10) {
          flake.y = -10;
          flake.x = Math.random() * w;
        }
      });
      ctx.globalAlpha = 1;

      // Draw floating emojis (Ambient only)
      ctx.textAlign = 'center';
      floaters.forEach((f) => {
        ctx.font = `${f.size}px serif`;
        const floatY = Math.sin(time * f.speed) * 10;
        ctx.globalAlpha = 0.2;
        ctx.fillText(f.emoji, f.x * w, f.y * h + floatY);
      });
      ctx.globalAlpha = 1;

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
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
