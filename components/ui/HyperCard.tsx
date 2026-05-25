"use client";

import { cn } from "@/lib/utils";
import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from "framer-motion";
import React, { MouseEvent } from "react";

interface HyperCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: "glass" | "neon-santa" | "neon-elf" | "neon-blue" | "neon-gold";
}

export const HyperCard = ({ children, className, onClick, variant = "glass" }: HyperCardProps) => {
  // 3D Tilt Logic
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseX = useSpring(x, { stiffness: 500, damping: 100 });
  const mouseY = useSpring(y, { stiffness: 500, damping: 100 });

  function onMouseMove({ currentTarget, clientX, clientY }: MouseEvent) {
    const { left, top, width, height } = currentTarget.getBoundingClientRect();
    x.set(clientX - left - width / 2);
    y.set(clientY - top - height / 2);
  }

  function onMouseLeave() {
    x.set(0);
    y.set(0);
  }

  // Transform values for rotation
  const rotateX = useTransform(mouseY, [-300, 300], [10, -10]); // Reverse axis for tilt
  const rotateY = useTransform(mouseX, [-300, 300], [-10, 10]);
  
  // Highlight gradient moving with mouse
  const maskImage = useMotionTemplate`radial-gradient(400px at ${mouseX}px ${mouseY}px, white, transparent)`;

  // Variant Styles
  const variants = {
    glass: "border-white/10 hover:border-white/30 shadow-none",
    "neon-santa": "border-neon-santa/30 hover:border-neon-santa hover:shadow-[0_0_30px_-5px_var(--color-neon-santa)]",
    "neon-elf": "border-neon-elf/30 hover:border-neon-elf hover:shadow-[0_0_30px_-5px_var(--color-neon-elf)]",
    "neon-blue": "border-neon-blue/30 hover:border-neon-blue hover:shadow-[0_0_30px_-5px_var(--color-neon-blue)]",
    "neon-gold": "border-neon-gold/30 hover:border-neon-gold hover:shadow-[0_0_30px_-5px_var(--color-neon-gold)]",
  };

  return (
    <motion.div
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      style={{
        transformStyle: "preserve-3d",
        rotateX,
        rotateY,
      }}
      className={cn(
        "relative rounded-3xl border bg-black/40 backdrop-blur-xl transition-colors duration-500 group",
        variants[variant],
        className
      )}
    >
        {/* Shine Effect */}
        <div 
            className="absolute inset-0 z-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl mix-blend-overlay" 
            style={{
                background: "linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.2) 40%, transparent 60%)" 
            }}
        />
        
        {/* Content */}
        <div 
            style={{ transform: "translateZ(30px)" }} 
            className="relative z-10 h-full w-full"
        >
            {children}
        </div>
    </motion.div>
  );
};
