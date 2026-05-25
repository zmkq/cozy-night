'use client';

import { motion } from 'framer-motion';

interface StatRevealProps {
  title: string;
  name: string;
  avatar: string;
  reason: string;
  color: string;
  onComplete: () => void;
}

export function StatReveal({
  title,
  name,
  avatar,
  reason,
  color,
  onComplete,
}: StatRevealProps) {
  // Auto advance after 5 seconds
  setTimeout(onComplete, 5000);

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-6 relative overflow-hidden">
      {/* Background Ambience */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.2, scale: 1.5 }}
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className="z-10 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12 max-w-2xl w-full shadow-2xl">
        <motion.h2
          initial={{ letterSpacing: '10px', opacity: 0 }}
          animate={{ letterSpacing: '2px', opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="text-lg md:text-2xl uppercase text-white/60 mb-8 font-bold tracking-widest">
          {title}
        </motion.h2>

        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', damping: 12 }}
          className="w-32 h-32 md:w-48 md:h-48 rounded-full bg-white/10 border-4 border-white/20 mx-auto mb-8 flex items-center justify-center overflow-hidden shadow-[0_0_50px_rgba(255,255,255,0.2)]">
          {avatar.startsWith('http') ? (
            <img
              src={avatar}
              alt={name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-6xl md:text-8xl">{avatar}</span>
          )}
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="text-4xl md:text-6xl font-black text-white mb-4">
          {name}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-xl md:text-2xl text-white/80 font-serif italic">
          "{reason}"
        </motion.p>
      </motion.div>
    </div>
  );
}
