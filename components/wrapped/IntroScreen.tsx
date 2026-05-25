'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function IntroScreen({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Timeline of texts
    const times = [2000, 4000, 6000]; // Duration for each step

    const t1 = setTimeout(() => setStep(1), times[0]);
    const t2 = setTimeout(() => setStep(2), times[1]);
    const t3 = setTimeout(onComplete, times[2]);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onComplete]);

  return (
    <div className="flex flex-col items-center justify-center h-full text-center space-y-8 font-arabic">
      {step === 0 && (
        <motion.h1
          initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
          transition={{ duration: 1 }}
          className="text-4xl md:text-6xl font-black text-white/90">
          FLAGSHIP EXPERIENCE
          <br />
          <span className="text-xl md:text-3xl font-light opacity-70 mt-2 block">
            (CURATED FOR YOU)
          </span>
        </motion.h1>
      )}

      {step === 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="space-y-6">
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl md:text-5xl font-bold text-[#FFD93D]">
            “WHAT THE NIGHT REMEMBERS”
          </motion.p>
        </motion.div>
      )}

      {step === 2 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4">
          <p className="text-2xl md:text-4xl text-white/80">
            This isn’t a game.
          </p>
          <motion.p
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, type: 'spring' }}
            className="text-3xl md:text-6xl font-black text-white glow-white">
            It’s the frame.
          </motion.p>
        </motion.div>
      )}
    </div>
  );
}
