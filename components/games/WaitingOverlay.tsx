"use client";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

interface WaitingOverlayProps {
  waitingFor: string[];
  message?: string;
}

export function WaitingOverlay({ waitingFor, message }: WaitingOverlayProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40"
    >
      <div className="bg-midnight-light/90 backdrop-blur-lg border border-white/10 rounded-2xl px-6 py-4 flex items-center gap-3 shadow-xl">
        <Loader2 className="animate-spin text-gold-glow" size={20} />
        <div>
          <p className="text-cream font-bold text-sm">
            {message || "Waiting for..."}
          </p>
          <p className="text-frost/60 text-xs">
            {waitingFor.length > 0 
              ? waitingFor.join(", ") 
              : "All players ready!"}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
