"use client";

import { cn } from "@/lib/utils";
import { HTMLMotionProps, motion } from "framer-motion";
import React from "react";

interface GlassCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  variant?: "default" | "dark" | "gold";
  hoverEffect?: boolean;
}

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ children, className, variant = "default", hoverEffect = false, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={hoverEffect ? { scale: 1.02, y: -2 } : undefined}
        transition={{ duration: 0.3 }}
        className={cn(
          "relative overflow-hidden rounded-2xl border border-white/10 shadow-xl backdrop-blur-md",
          "bg-glass-card", // defined in tailwind config
          variant === "dark" && "bg-black/40 border-white/5",
          variant === "gold" && "border-gold-500/30 bg-gold-500/5",
          className
        )}
        {...props}
      >
        {/* Shine effect overlay */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-50" />
        
        {/* Content */}
        <div className="relative z-10">{children}</div>
      </motion.div>
    );
  }
);
GlassCard.displayName = "GlassCard";
