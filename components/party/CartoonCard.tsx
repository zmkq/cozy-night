"use client";

import { cn } from "@/lib/utils";
import { HTMLMotionProps, motion } from "framer-motion";
import React from "react";

interface CartoonCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  variant?: "default" | "santa" | "elf" | "gold";
  hoverEffect?: boolean;
}

export const CartoonCard = React.forwardRef<HTMLDivElement, CartoonCardProps>(
  ({ children, className, variant = "default", hoverEffect = false, ...props }, ref) => {
    
    // Variant styles for borders/shadows
    const variants = {
      default: "bg-coal border-white/20 shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]",
      santa: "bg-coal border-santa shadow-[4px_4px_0px_0px_rgba(255,59,48,1)]",
      elf: "bg-coal border-elf shadow-[4px_4px_0px_0px_rgba(76,217,100,1)]",
      gold: "bg-coal border-gold shadow-[4px_4px_0px_0px_rgba(255,204,0,1)]",
    };

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={hoverEffect ? { y: -5, scale: 1.02 } : undefined}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className={cn(
          "relative overflow-hidden rounded-3xl border-4 backdrop-blur-sm",
          variants[variant],
          className
        )}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
CartoonCard.displayName = "CartoonCard";
