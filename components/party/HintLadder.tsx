"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, Unlock, Sparkles, ArrowRight, Loader2, Eye, EyeOff, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface HintLadderProps {
  hints: string[];
  onUnlock: (password: string) => void;
  isLoading?: boolean;
}

// Floating particle for hint reveal
const Particle = ({ delay }: { delay: number }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0, y: 0 }}
    animate={{ 
      opacity: [0, 1, 0], 
      scale: [0, 1, 0.5],
      y: [-20, -100],
      x: [0, (Math.random() - 0.5) * 200]
    }}
    transition={{ duration: 1.5, delay, ease: "easeOut" }}
    className="absolute w-2 h-2 rounded-full bg-neon-gold"
    style={{ left: `${Math.random() * 100}%` }}
  />
);

export function HintLadder({ hints, onUnlock, isLoading }: HintLadderProps) {
  const [level, setLevel] = useState(0);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showingHint, setShowingHint] = useState<number | null>(null);
  const [particles, setParticles] = useState<number[]>([]);

  const revealNextHint = () => {
    if (level < hints.length) {
      setShowingHint(level);
      // Spawn particles
      setParticles(Array.from({ length: 20 }, (_, i) => i));
      
      setTimeout(() => {
        setLevel(prev => prev + 1);
        setShowingHint(null);
        setParticles([]);
      }, 2000);
    }
  };

  return (
    <div className="w-full space-y-8">
      {/* Password Input Section */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
      >
        <div className="absolute -inset-4 bg-gradient-to-r from-neon-santa/20 via-neon-gold/20 to-neon-elf/20 rounded-3xl blur-xl opacity-50" />
        
        <div className="relative bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 space-y-6">
          <div className="flex items-center justify-center gap-3">
            <Lock className="text-neon-santa w-6 h-6" />
            <h3 className="font-black text-2xl text-white uppercase tracking-[0.2em]">
              Password
            </h3>
          </div>

          <div className="relative">
            <Input 
              type={showPassword ? "text" : "password"}
              placeholder="Enter the secret code..."
              className="w-full h-16 bg-black/60 border-2 border-white/10 focus:border-neon-elf rounded-2xl text-2xl text-center tracking-[0.3em] text-white placeholder:text-white/20 font-mono"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onUnlock(password)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onUnlock(password)}
            disabled={isLoading}
            className="w-full h-14 rounded-2xl bg-gradient-to-r from-neon-elf to-neon-blue text-black font-black text-lg uppercase tracking-wider flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(0,255,148,0.3)] hover:shadow-[0_0_50px_rgba(0,255,148,0.5)] transition-shadow disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="animate-spin" size={24} />
            ) : (
              <>
                <Zap size={20} /> Unlock Access
              </>
            )}
          </motion.button>
        </div>
      </motion.div>

      {/* Hint Reveal Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-center gap-2 text-white/30">
          <Sparkles size={14} />
          <span className="text-xs font-bold uppercase tracking-[0.3em]">Need a hint?</span>
          <Sparkles size={14} />
        </div>

        <div className="space-y-4">
          {hints.map((hint, index) => (
            <div key={index} className="relative">
              <AnimatePresence mode="wait">
                {index < level ? (
                  // Revealed hint - Big and dramatic
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, rotateX: -20 }}
                    animate={{ opacity: 1, scale: 1, rotateX: 0 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-neon-gold/10 to-transparent rounded-2xl" />
                    <div className="relative bg-black/30 backdrop-blur-md border border-neon-gold/30 rounded-2xl p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-neon-gold/20 flex items-center justify-center flex-shrink-0">
                          <Unlock className="text-neon-gold" size={20} />
                        </div>
                        <div>
                          <div className="text-[10px] text-neon-gold/60 uppercase tracking-widest mb-1">
                            Hint #{index + 1} Unlocked
                          </div>
                          <p className="text-xl font-bold text-white leading-relaxed">
                            "{hint}"
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : index === level ? (
                  // Next hint button - Big chunky playful
                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={revealNextHint}
                    disabled={showingHint !== null}
                    className="w-full relative group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-neon-santa/20 via-neon-gold/20 to-neon-elf/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative bg-white/5 backdrop-blur-md border-2 border-dashed border-white/20 group-hover:border-neon-gold/50 rounded-2xl p-6 transition-all">
                      <div className="flex items-center justify-center gap-3 text-white/50 group-hover:text-neon-gold transition-colors">
                        <motion.div
                          animate={{ rotate: [0, 10, -10, 0] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                        >
                          <Sparkles size={24} />
                        </motion.div>
                        <span className="text-lg font-black uppercase tracking-wider">
                          Reveal Hint #{index + 1}
                        </span>
                        <motion.div
                          animate={{ rotate: [0, -10, 10, 0] }}
                          transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}
                        >
                          <Sparkles size={24} />
                        </motion.div>
                      </div>
                    </div>
                  </motion.button>
                ) : (
                  // Locked hints
                  <div className="bg-white/5 rounded-2xl p-4 flex items-center justify-center gap-2 text-white/10">
                    <Lock size={16} />
                    <span className="text-sm font-bold uppercase tracking-wider">Hint #{index + 1} Locked</span>
                  </div>
                )}
              </AnimatePresence>

              {/* Particle explosion on reveal */}
              {showingHint === index && (
                <div className="absolute inset-0 pointer-events-none">
                  {particles.map((_, i) => (
                    <Particle key={i} delay={i * 0.02} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Brain Score Warning */}
      <AnimatePresence>
        {level > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center"
          >
            <p className="text-xs text-neon-santa/60 font-bold uppercase tracking-widest">
              ⚠️ {level} hint{level > 1 ? 's' : ''} revealed • Brain Score -{ level * 5 } pts
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
