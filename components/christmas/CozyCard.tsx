"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface CozyCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: "red" | "green" | "gold" | "purple" | "none";
  onClick?: () => void;
  hover?: boolean;
}

const glowColors = {
  red: "hover:border-cozy-red/50 hover:shadow-[0_0_30px_rgba(255,77,106,0.3)]",
  green: "hover:border-pine-green/50 hover:shadow-[0_0_30px_rgba(46,204,113,0.3)]",
  gold: "hover:border-gold-glow/50 hover:shadow-[0_0_30px_rgba(255,217,61,0.3)]",
  purple: "hover:border-purple-500/50 hover:shadow-[0_0_30px_rgba(168,85,247,0.3)]",
  none: "",
};

export function CozyCard({ 
  children, 
  className, 
  glowColor = "red",
  onClick,
  hover = true 
}: CozyCardProps) {
  return (
    <motion.div
      whileHover={hover ? { y: -4, scale: 1.01 } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      onClick={onClick}
      className={cn(
        "bg-white/5 backdrop-blur-xl border-2 border-white/10 rounded-3xl",
        "shadow-[0_8px_32px_rgba(0,0,0,0.3)]",
        "transition-all duration-300",
        hover && glowColors[glowColor],
        onClick && "cursor-pointer",
        className
      )}
    >
      {children}
    </motion.div>
  );
}
