'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StickerCard } from '@/components/christmas/StickerCard';
import {
  Info,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Zap,
  Target,
  Shield,
  MessageSquare,
  ThumbsUp,
  Gavel,
  Eye,
  Crown,
  Brain,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface GuidePrompt {
  title: string;
  message: string;
  icon: any;
  color: string;
}

const GAME_GUIDE: Record<string, Record<string, GuidePrompt>> = {
  'group-trial': {
    evidence: {
      title: 'Submit Evidence ✍️',
      message:
        'The accused is on the stand! Send a sentence or evidence to expose and incriminate them. Be sharp.',
      icon: MessageSquare,
      color: '#FFD93D',
    },
    defense: {
      title: 'Defend Yourself 🛡️',
      message:
        'Evidence is stacking up! If you are the accused, defend yourself. If you are a juror, listen closely to their story.',
      icon: Shield,
      color: '#2ECC71',
    },
    voting: {
      title: 'Verdict Time ⚖️',
      message: 'Innocent or guilty? Vote based on what you saw. Remember: your vote decides their fate.',
      icon: ThumbsUp,
      color: '#FF4D6A',
    },
    sentencing: {
      title: 'Final Verdict ⚖️',
      message: 'The court has ruled! Let\'s see if they got off clean or lost points.',
      icon: Gavel,
      color: '#DC2626',
    },
  },
  'lie-rate': {
    playing: {
      title: 'Confess! 🎭',
      message:
        'Answer honestly with "Yes" or "No". Your answer is secret, but everyone will try to guess what you said.',
      icon: Info,
      color: '#8B5CF6',
    },
    guessing: {
      title: 'Expose Them 🔍',
      message:
        'Results are in! Now it\'s your turn to guess what everyone answered. Think about who you know is a liar.',
      icon: Eye,
      color: '#EC4899',
    },
    results: {
      title: 'Who is Truthful? ✨',
      message: 'See the truth! If nobody guessed a player\'s answer, they get extra points for being mysterious.',
      icon: Crown,
      color: '#FFD93D',
    },
  },
  shotcaller: {
    playing: {
      title: 'Your Call 👑',
      message:
        'You are the Shotcaller! Pick a card and apply its effect to your target. Be ruthless.',
      icon: Zap,
      color: '#FFD93D',
    },
  },
  saboteur: {
    playing: {
      title: 'Sabotage the Game 🕵️',
      message:
        'If you are the saboteur, answer incorrectly without being caught. If you are crew, answer correctly and find the saboteur.',
      icon: Target,
      color: '#FF4D6A',
    },
    voting: {
      title: 'Who is the Saboteur? 👈',
      message: 'Vote for the player you suspect of sabotaging the answers. If you catch them, they lose points.',
      icon: MessageSquare,
      color: '#2ECC71',
    },
  },
  'rapid-fire': {
    playing: {
      title: 'Hurry Up! ⚡',
      message: 'No time! Answer before the line runs out. Every second counts for your score.',
      icon: Zap,
      color: '#FF4D6A',
    },
  },
  'most-likely': {
    voting: {
      title: 'Point at them 👆',
      message:
        'Who fits the prompt best? Select their photo and expose them to the squad.',
      icon: Target,
      color: '#FFD93D',
    },
  },
  heist: {
    'heist-planning': {
      title: 'Plan the Heist 🧠',
      message:
        'The Planner is choosing the mission. If you are not the planner, start questioning your friends.',
      icon: Brain,
      color: '#3B82F6',
    },
    'heist-voting': {
      title: 'Do you agree? 👍',
      message:
        'The plan is ready. Vote if you agree or if you suspect the planner is a snitch.',
      icon: ThumbsUp,
      color: '#FFD93D',
    },
    'heist-execution': {
      title: 'Execute the Heist 🏦',
      message:
        'Time to execute! If you are loyal crew, make the mission succeed. If you are the snitch... sabotage it without getting caught.',
      icon: Zap,
      color: '#FF4D6A',
    },
    'heist-result': {
      title: 'What Happened? 🚨',
      message:
        'See the result. Did the success meter go up or down? Discuss and find out who the snitch is.',
      icon: Eye,
      color: '#10B981',
    },
  },
};

interface LiveBadassGuideProps {
  gameId: string;
  phase: string;
  roundData?: any;
  myPlayerId?: string;
}

export function LiveBadassGuide({
  gameId,
  phase,
  roundData,
  myPlayerId,
}: LiveBadassGuideProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [lastPhase, setLastPhase] = useState(phase);

  // Auto-open on phase change
  useEffect(() => {
    if (phase !== lastPhase) {
      setIsOpen(true);
      setLastPhase(phase);
    }
  }, [phase, lastPhase]);

  const guide = GAME_GUIDE[gameId]?.[phase];

  if (!guide) return null;

  const Icon = guide.icon;

  return (
    <div className="fixed bottom-24 left-4 right-4 z-50 pointer-events-none">
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            initial={{ y: 100, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 100, opacity: 0, scale: 0.9 }}
            className="pointer-events-auto max-w-sm mx-auto">
            <StickerCard
              className="p-4 shadow-2xl relative border-2"
              accentColor="white"
              style={{ borderColor: guide.color + '40' }}>
              <button
                onClick={() => setIsOpen(false)}
                className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-black border-2 border-white/20 flex items-center justify-center text-white/40 hover:text-white transition-colors">
                <ChevronDown size={20} />
              </button>

              <div className="flex gap-4 items-start">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg border-2 border-white/20"
                  style={{ backgroundColor: guide.color }}>
                  <Icon size={24} className="text-white" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-white font-black text-sm uppercase tracking-wider flex items-center gap-2">
                    {guide.title}
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  </h4>
                  <p className="text-white/70 text-sm font-bold leading-relaxed">
                    {guide.message}
                  </p>
                </div>
              </div>

              {/* Progress tag */}
              <div className="absolute top-2 right-4">
                <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">
                  Live Guide
                </span>
              </div>
            </StickerCard>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="pointer-events-auto flex justify-end max-w-sm mx-auto">
            <button
              onClick={() => setIsOpen(true)}
              className="bg-black/80 backdrop-blur-md border-2 border-white/10 rounded-2xl p-3 text-white/60 hover:text-white hover:border-[#FFD93D]/50 transition-all flex items-center gap-2 shadow-xl">
              <Info size={18} className="text-[#FFD93D]" />
              <span className="text-xs font-black uppercase tracking-wider">
                Guide
              </span>
              <ChevronUp size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
