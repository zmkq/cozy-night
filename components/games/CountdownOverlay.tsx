"use client";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface CountdownOverlayProps {
  count: number;
  show: boolean;
}

export function CountdownOverlay({ count, show }: CountdownOverlayProps) {
  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-midnight/90 backdrop-blur-lg"
      >
        <motion.div
          key={count}
          initial={{ scale: 2, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={{ type: "spring", damping: 10 }}
          className={cn(
            "text-[150px] font-black",
            count === 3 && "text-cozy-red",
            count === 2 && "text-gold-glow",
            count === 1 && "text-pine-green",
            count === 0 && "text-cream"
          )}
        >
          {count === 0 ? "GO!" : count}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
