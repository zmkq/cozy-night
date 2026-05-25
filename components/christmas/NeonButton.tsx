"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";
import { Loader2 } from "lucide-react";

interface NeonButtonProps {
  children: ReactNode;
  variant?: "red" | "green" | "gold";
  size?: "sm" | "md" | "lg";
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
}

const variants = {
  red: "bg-cozy-red hover:bg-cozy-red/90 text-white shadow-[0_0_20px_rgba(255,77,106,0.4)] hover:shadow-[0_0_30px_rgba(255,77,106,0.6)]",
  green: "bg-pine-green hover:bg-pine-green/90 text-black shadow-[0_0_20px_rgba(46,204,113,0.4)] hover:shadow-[0_0_30px_rgba(46,204,113,0.6)]",
  gold: "bg-gold-glow hover:bg-gold-glow/90 text-black shadow-[0_0_20px_rgba(255,217,61,0.4)] hover:shadow-[0_0_30px_rgba(255,217,61,0.6)]",
};

const sizes = {
  sm: "h-10 px-4 text-sm rounded-xl",
  md: "h-12 px-6 text-base rounded-2xl",
  lg: "h-14 px-8 text-lg rounded-2xl",
};

export function NeonButton({
  children,
  variant = "green",
  size = "md",
  className,
  onClick,
  disabled,
  loading,
  fullWidth,
}: NeonButtonProps) {
  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.02 } : undefined}
      whileTap={!disabled ? { scale: 0.98 } : undefined}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        "font-bold uppercase tracking-wider",
        "flex items-center justify-center gap-2",
        "transition-all duration-300",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        fullWidth && "w-full",
        className
      )}
    >
      {loading ? <Loader2 className="animate-spin" size={20} /> : children}
    </motion.button>
  );
}
