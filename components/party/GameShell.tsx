"use client";

import { Button } from "@/components/ui/button";
import { HyperCard } from "@/components/ui/HyperCard";
import { ArrowLeft, Trophy, Sparkles } from "lucide-react";
import Link from "next/link";
import { useGameSync } from "@/hooks/useGameSync";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface GameShellProps {
  title: string;
  gameId: string; 
  children: React.ReactNode;
  onExit?: () => void;
}

export function GameShell({ title, gameId, children, onExit }: GameShellProps) {
  const { gameState, leaderboard } = useGameSync();
  
  // Calculate total score for current user across all games or just this one?
  // For now, let's show the Global Score from leaderboard if available
  // We'll need user ID, but we can't get it easily in client without passing it down or context.
  // Let's just show a generic "Live Competition" badge for now.

  return (
    <div className="flex flex-col h-[calc(100vh-80px)]">
      {/* Game Header */}
      <HyperCard variant="glass" className="p-4 mb-6 flex items-center justify-between sticky top-0 z-40 !rounded-2xl !bg-black/60 !backdrop-blur-xl border-white/10 shadow-2xl">
        <Link href="/games">
             <Button variant="ghost" size="icon" className="text-white/50 hover:text-white hover:bg-white/10 rounded-full">
                <ArrowLeft />
             </Button>
        </Link>

        <div className="flex flex-col items-center">
             <h2 className="font-display font-bold text-2xl text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60 tracking-wide uppercase drop-shadow-sm">
                {title}
             </h2>
             <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] text-neon-blue uppercase">
                <Sparkles size={10} /> Live Zone
             </div>
        </div>

        <div className="flex items-center gap-2 text-neon-gold font-mono font-bold bg-neon-gold/10 px-3 py-1 rounded-full border border-neon-gold/20">
            <Trophy size={16} />
            {/* Placeholder for live score - would need UserContext */}
            <span>Rank #1</span> 
        </div>
      </HyperCard>

      {/* Game Content Area */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 relative overflow-y-auto overflow-x-hidden p-1"
      >
        {children}
      </motion.div>
    </div>
  );
}
