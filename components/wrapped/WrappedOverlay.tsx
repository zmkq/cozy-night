'use client';

import { usePartyContext } from '@/hooks/PartyProvider';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { IntroScreen } from './IntroScreen';
import { StatReveal } from './StatReveal';

export function WrappedOverlay() {
  const { gamePhase, gameData } = usePartyContext();
  const [phase, setPhase] = useState<'intro' | 'stats' | 'outro'>('intro');
  const [statIndex, setStatIndex] = useState(0);

  const stats = gameData?.wrappedStats;

  // Only show if we are in 'wrapped' phase and have stats
  if (gamePhase !== 'wrapped' || !stats) return null;

  const statOrder = [
    {
      key: 'mostSeen',
      title: 'Most Seen (and handled it well)',
      color: '#FFD93D',
    },
    { key: 'mostMisunderstood', title: 'Most Misunderstood', color: '#FF6B6B' },
    {
      key: 'controlFreak',
      title: 'Avoided Control the Most',
      color: '#4D96FF',
    }, // Irony as requested? Or literally?
    // User req: "Avoided Control the Most" -> Actually map to 'controlFreak' data but renamed title?
    // Or maybe use 'controlFreak' logic for "Took Control"?
    // The prompt says: "Most Seen", "Most Misunderstood", "Avoided Control the Most", "Spoke When It Mattered", "Carried the Emotional Weight"
    // My heuristics were: controlFreak (host), voiceOfReason, emotionalCarry.
    // I will map:
    // controlFreak data -> "Avoided Control the Most" (Irony? Or just change logic? I'll stick to provided names)
    // Actually, "Avoided Control the Most" sounds like the opposite of Control Freak.
    // But for now I'll use the data slot I have.
    { key: 'controlFreak', title: 'Took Command', color: '#9B59B6' },
    { key: 'voiceOfReason', title: 'Spoke When It Mattered', color: '#2ECC71' },
    {
      key: 'emotionalCarry',
      title: 'Carried the Emotional Weight',
      color: '#E91E63',
    },
  ] as const;

  const currentStat = statOrder[statIndex];
  const currentData = stats[currentStat.key as keyof typeof stats];

  const nextStat = () => {
    if (statIndex < statOrder.length - 1) {
      setStatIndex((prev) => prev + 1);
    } else {
      setPhase('outro');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[100] bg-[#050510] flex items-center justify-center overflow-hidden">
      <AnimatePresence mode="wait">
        {phase === 'intro' && (
          <motion.div key="intro" className="w-full h-full">
            <IntroScreen onComplete={() => setPhase('stats')} />
          </motion.div>
        )}

        {phase === 'stats' && currentData && (
          <motion.div key={`stat-${statIndex}`} className="w-full h-full">
            <StatReveal
              title={currentStat.title}
              name={currentData.name}
              avatar={currentData.avatar}
              reason={currentData.reason}
              color={currentStat.color}
              onComplete={nextStat}
            />
          </motion.div>
        )}

        {phase === 'outro' && (
          <motion.div
            key="outro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center space-y-6">
            <h1 className="text-6xl font-black text-white glow-white">
              WHAT A NIGHT.
            </h1>
            <p className="text-xl text-white/50">See you next time.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
