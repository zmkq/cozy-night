'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSound } from '@/hooks/useSound';
import confetti from 'canvas-confetti';
import { Trophy, Crown, Sparkles } from 'lucide-react';
import { Player } from '@/hooks/useParty';

interface WinnerScreenProps {
  winner: Player;
  onClose: () => void;
}

export function WinnerScreen({ winner, onClose }: WinnerScreenProps) {
  const { play } = useSound();
  const firedRef = useRef(false);

  useEffect(() => {
    if (winner && !firedRef.current) {
      firedRef.current = true;
      play('win');
      play('tada');

      // Dramatic confetti
      const duration = 5 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = {
        startVelocity: 30,
        spread: 360,
        ticks: 60,
        zIndex: 9999,
      };

      const randomInRange = (min: number, max: number) =>
        Math.random() * (max - min) + min;

      const interval: any = setInterval(function () {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) {
          return clearInterval(interval);
        }
        const particleCount = 50 * (timeLeft / duration);
        // Since particles fall down, start a bit higher than random
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [winner, play]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl"
      onClick={onClose}>
      <div className="relative w-full max-w-md p-6 text-center select-none cursor-pointer">
        {/* Glowing Background Effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-yellow-500/20 rounded-full blur-[100px] animate-pulse" />

        <motion.div
          initial={{ scale: 0.5, y: 100, rotateX: 45 }}
          animate={{ scale: 1, y: 0, rotateX: 0 }}
          transition={{
            type: 'spring',
            damping: 12,
            stiffness: 100,
            delay: 0.2,
          }}
          className="relative z-10">
          {/* Crown */}
          <motion.div
            animate={{ y: [-10, 0, -10], rotate: [-5, 5, -5] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-24 left-1/2 -translate-x-1/2 text-yellow-400 drop-shadow-[0_0_30px_rgba(253,224,71,0.6)]">
            <Crown size={80} fill="currentColor" />
          </motion.div>

          {/* Avatar Container */}
          <div className="relative mx-auto w-48 h-48 mb-8">
            <div
              className="absolute inset-0 rounded-full border-4 border-yellow-400 animate-[spin_10s_linear_infinite]"
              style={{
                borderTopColor: 'transparent',
                borderLeftColor: 'transparent',
              }}
            />
            <div
              className="absolute inset-0 rounded-full border-4 border-yellow-400 animate-[spin_10s_linear_infinite_reverse]"
              style={{
                width: '110%',
                height: '110%',
                top: '-5%',
                left: '-5%',
                borderBottomColor: 'transparent',
                borderRightColor: 'transparent',
              }}
            />

            <img
              src={winner.avatar}
              alt={winner.name}
              className="w-full h-full object-cover rounded-full border-4 border-yellow-400 shadow-[0_0_50px_rgba(253,224,71,0.5)]"
            />

            <motion.div
              animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute -bottom-4 -right-4 bg-yellow-400 text-black p-3 rounded-full shadow-lg">
              <Trophy size={32} fill="currentColor" />
            </motion.div>
          </div>

          {/* Text */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 drop-shadow-[0_2px_10px_rgba(234,179,8,0.5)] mb-2">
            CHAMPION
          </motion.h1>

          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-4xl font-bold text-white mb-8">
            {winner.name}
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.2 }}
            className="inline-flex items-center gap-2 bg-white/10 px-6 py-3 rounded-full border border-white/20 hover:bg-white/20 transition-colors">
            <Sparkles className="text-yellow-400" />
            <span className="text-white font-bold">MO NIGHT LEGEND</span>
            <Sparkles className="text-yellow-400" />
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}
