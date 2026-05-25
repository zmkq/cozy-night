'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

// ============ TYPES ============
export type TransitionType =
  | 'round-start' // New round beginning
  | 'round-end' // Round finished
  | 'epic-win' // Someone dominated
  | 'epic-fail' // Someone failed hard
  | 'caught' // Saboteur/liar caught
  | 'escaped' // Saboteur/liar escaped
  | 'close-call' // Very close vote
  | 'final-round' // Last round drama
  | 'game-over' // Game finished
  | 'voting-start' // Voting phase
  | 'results-reveal'; // Results incoming

export interface TransitionConfig {
  type: TransitionType;
  playerName?: string;
  round?: number;
  maxRounds?: number;
  customText?: string;
  duration?: number; // ms
}

// ============ ENGLISH TEXT POOLS ============
const TEXT_POOLS: Record<TransitionType, string[]> = {
  'round-start': [
    'Let\'s go, squad! 💥',
    'Next round... Focus! 🎯',
    'Are you ready, legends? 😈',
    'Let\'s see who owns this round! 🔥',
    'Let\'s make some noise! ⚡',
  ],
  'round-end': [
    'Round finished! 🏁',
    'What just happened? 😂',
    'Unbelievable... 👀',
    'That was epic! 🎮',
  ],
  'epic-win': [
    'What absolute domination! 🎉',
    'King of the hill! 👑',
    'Oh my god... Legend! 🌟',
    'Unstoppable! 💪',
    'You possess magical powers! ✨',
  ],
  'epic-fail': [
    'Exposed big time! 😂',
    'What a disaster! 💀',
    'What a massive fail! 🤡',
    'Go to sleep, it\'s better for you 😴',
    'How embarrassing! 🙈',
  ],
  caught: [
    'Exposed and caught! 🔒',
    'We got you! 👮',
    'Where are you going to hide? 🚨',
    'Game over for you, player! 😈',
    'Busted in front of everyone! 📢',
  ],
  escaped: [
    'The target got away! 🏃',
    'Where did they go?! 😱',
    'Flew right under your noses! 💨',
    'Nobody could catch them! 🎭',
    'Master of escape! 🐍',
  ],
  'close-call': [
    'Honestly, we have no idea... 😰',
    'Too close! 🎲',
    'My heart... 💓',
    'What tense vibes! 😬',
    'By a hair! 🔥',
  ],
  'final-round': [
    'Final Round! 🔥',
    'Every player for themselves! ⚔️',
    'No turning back! 💀',
    'Let\'s crown the champion! 🏆',
    'Last chance, make it count! 🎯',
  ],
  'game-over': [
    'Game Over! 🎮',
    'Who is the boss? 👑',
    'Final scoreboard! 📊',
    'Let\'s see who is the best! 🏆',
  ],
  'voting-start': [
    'Time to vote! 🗳️',
    'Who is the suspect? 🤔',
    'Cast your votes, squad! 👆',
    'Expose each other! 😈',
  ],
  'results-reveal': [
    'And the result is... 🥁',
    'Let\'s see! 👀',
    'Truth is coming! ⚡',
    'Ready for the shock? 😱',
  ],
};

// ============ RANDOM HELPER ============
function getRandomText(type: TransitionType): string {
  const pool = TEXT_POOLS[type];
  return pool[Math.floor(Math.random() * pool.length)];
}

// ============ ANIMATION VARIANTS ============
const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const contentVariants: Record<
  TransitionType | 'default',
  {
    hidden: Record<string, unknown>;
    visible: Record<string, unknown>;
    exit: Record<string, unknown>;
  }
> = {
  'round-start': {
    hidden: { scale: 3, opacity: 0, rotate: -15 },
    visible: {
      scale: 1,
      opacity: 1,
      rotate: 0,
      transition: { type: 'spring', damping: 12, stiffness: 200 },
    },
    exit: { scale: 0, opacity: 0, rotate: 15 },
  },
  'round-end': {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -50 },
  },
  'epic-win': {
    hidden: { y: -200, opacity: 0, scale: 0.5 },
    visible: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: { type: 'spring', bounce: 0.5 },
    },
    exit: { y: 200, opacity: 0 },
  },
  'epic-fail': {
    hidden: { y: -100, opacity: 0, rotate: 0 },
    visible: {
      y: 0,
      opacity: 1,
      rotate: [0, -5, 5, -5, 0],
      transition: { duration: 0.5 },
    },
    exit: { y: 100, opacity: 0, scale: 0.8 },
  },
  caught: {
    hidden: { scaleX: 0, opacity: 0 },
    visible: {
      scaleX: 1,
      opacity: 1,
      transition: { type: 'spring', damping: 15 },
    },
    exit: { scaleY: 0, opacity: 0 },
  },
  escaped: {
    hidden: { x: -200, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: { type: 'spring', bounce: 0.4 },
    },
    exit: { x: 200, opacity: 0 },
  },
  'close-call': {
    hidden: { scale: 0.5, opacity: 0 },
    visible: {
      scale: [1, 1.1, 1, 1.05, 1],
      opacity: 1,
      transition: { duration: 0.8 },
    },
    exit: { scale: 0, opacity: 0 },
  },
  'final-round': {
    hidden: { opacity: 0, scale: 0.8, filter: 'blur(20px)' },
    visible: {
      opacity: 1,
      scale: 1,
      filter: 'blur(0px)',
      transition: { duration: 0.6 },
    },
    exit: { opacity: 0, scale: 1.2, filter: 'blur(10px)' },
  },
  'game-over': {
    hidden: { opacity: 0, rotateY: 90 },
    visible: {
      opacity: 1,
      rotateY: 0,
      transition: { duration: 0.5 },
    },
    exit: { opacity: 0, rotateY: -90 },
  },
  'voting-start': {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { type: 'spring', damping: 20 },
    },
    exit: { opacity: 0, scale: 1.1 },
  },
  'results-reveal': {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 },
    },
    exit: { opacity: 0, y: -30 },
  },
  default: {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -50 },
  },
};

// ============ BACKGROUND COLORS ============
const BG_COLORS: Record<TransitionType, string> = {
  'round-start': 'from-purple-900/95 via-black/95 to-purple-900/95',
  'round-end': 'from-slate-900/95 via-black/95 to-slate-900/95',
  'epic-win': 'from-yellow-900/95 via-amber-950/95 to-yellow-900/95',
  'epic-fail': 'from-red-950/95 via-black/95 to-red-950/95',
  caught: 'from-red-900/95 via-black/95 to-red-900/95',
  escaped: 'from-green-900/95 via-black/95 to-green-900/95',
  'close-call': 'from-orange-900/95 via-black/95 to-orange-900/95',
  'final-round': 'from-rose-950/95 via-black/95 to-rose-950/95',
  'game-over': 'from-violet-950/95 via-black/95 to-violet-950/95',
  'voting-start': 'from-blue-900/95 via-black/95 to-blue-900/95',
  'results-reveal': 'from-cyan-900/95 via-black/95 to-cyan-900/95',
};

// ============ ACCENT COLORS ============
const ACCENT_COLORS: Record<TransitionType, string> = {
  'round-start': '#A855F7',
  'round-end': '#64748B',
  'epic-win': '#FBBF24',
  'epic-fail': '#EF4444',
  caught: '#DC2626',
  escaped: '#22C55E',
  'close-call': '#F97316',
  'final-round': '#F43F5E',
  'game-over': '#8B5CF6',
  'voting-start': '#3B82F6',
  'results-reveal': '#06B6D4',
};

// ============ EMOJIS ============
const EMOJIS: Record<TransitionType, string> = {
  'round-start': '⚡',
  'round-end': '🏁',
  'epic-win': '👑',
  'epic-fail': '💀',
  caught: '🔒',
  escaped: '🏃',
  'close-call': '😰',
  'final-round': '🔥',
  'game-over': '🏆',
  'voting-start': '🗳️',
  'results-reveal': '🎭',
};

// ============ CONFETTI PARTICLE ============
function Particle({ delay, color }: { delay: number; color: string }) {
  return (
    <motion.div
      className="absolute w-3 h-3 rounded-sm"
      style={{ backgroundColor: color }}
      initial={{
        x: 0,
        y: 0,
        opacity: 1,
        rotate: 0,
        scale: 1,
      }}
      animate={{
        x: (Math.random() - 0.5) * 400,
        y: Math.random() * 300 + 100,
        opacity: 0,
        rotate: Math.random() * 720 - 360,
        scale: 0,
      }}
      transition={{
        duration: 1.5,
        delay,
        ease: 'easeOut',
      }}
    />
  );
}

// ============ MAIN COMPONENT ============
export function CinematicTransition({
  config,
  show,
  onComplete,
}: {
  config: TransitionConfig;
  show: boolean;
  onComplete?: () => void;
}) {
  const [text, setText] = useState('');
  const [particles, setParticles] = useState<
    { id: number; delay: number; color: string }[]
  >([]);

  const {
    type,
    playerName,
    round,
    maxRounds,
    customText,
    duration = 2000,
  } = config;

  useEffect(() => {
    if (show) {
      setText(customText || getRandomText(type));

      // Generate confetti for win transitions
      if (type === 'epic-win' || type === 'escaped') {
        const colors = ['#FBBF24', '#22C55E', '#A855F7', '#EC4899', '#3B82F6'];
        setParticles(
          Array.from({ length: 30 }, (_, i) => ({
            id: i,
            delay: Math.random() * 0.3,
            color: colors[Math.floor(Math.random() * colors.length)],
          }))
        );
      }

      // Auto-dismiss after duration
      const timer = setTimeout(() => {
        onComplete?.();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      setParticles([]);
    }
  }, [show, type, customText, duration, onComplete]);

  const variant = contentVariants[type] || contentVariants.default;
  const bgColor = BG_COLORS[type];
  const accentColor = ACCENT_COLORS[type];
  const emoji = EMOJIS[type];

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className={cn(
            'fixed inset-0 z-[100] flex items-center justify-center',
            'bg-gradient-to-br',
            bgColor
          )}
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ duration: 0.3 }}>
          {/* Animated Background Pattern */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              className="absolute inset-0"
              style={{
                backgroundImage: `radial-gradient(circle at 50% 50%, ${accentColor}20 0%, transparent 50%)`,
              }}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </div>

          {/* Confetti Particles */}
          {particles.length > 0 && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              {particles.map((p) => (
                <Particle key={p.id} delay={p.delay} color={p.color} />
              ))}
            </div>
          )}

          {/* Main Content */}
          <motion.div
            className="relative text-center px-8"
            variants={variant as any}
            initial="hidden"
            animate="visible"
            exit="exit"
            dir="ltr">
            {/* Round Number */}
            {(type === 'round-start' || type === 'final-round') && round && (
              <motion.div
                className="mb-4"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}>
                <span
                  className="text-6xl font-black"
                  style={{
                    color: accentColor,
                    textShadow: `0 0 30px ${accentColor}80`,
                  }}>
                  {round}
                </span>
                <span className="text-2xl text-white/60 ml-2">
                  / {maxRounds}
                </span>
              </motion.div>
            )}

            {/* Big Emoji */}
            <motion.div
              className="text-8xl mb-6"
              animate={{
                scale: [1, 1.2, 1],
                rotate: type === 'epic-fail' ? [0, -10, 10, -10, 0] : 0,
              }}
              transition={{
                duration: 0.5,
                delay: 0.3,
                repeat: type === 'epic-win' ? 2 : 0,
              }}>
              {emoji}
            </motion.div>

            {/* Player Name (if applicable) */}
            {playerName && (
              <motion.div
                className="mb-4"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}>
                <span
                  className="text-3xl font-black px-6 py-2 rounded-2xl inline-block"
                  style={{
                    backgroundColor: `${accentColor}30`,
                    color: accentColor,
                    border: `3px solid ${accentColor}`,
                  }}>
                  {playerName}
                </span>
              </motion.div>
            )}

            {/* Main Text */}
            <motion.h1
              className="text-4xl md:text-6xl font-black text-white mb-4 max-w-lg"
              style={{
                textShadow: `0 4px 20px ${accentColor}50`,
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}>
              {text}
            </motion.h1>

            {/* Subtext */}
            <motion.p
              className="text-white/50 text-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}>
              {type === 'round-start' && 'Get ready...'}
              {type === 'voting-start' && 'Pick the suspect!'}
              {type === 'final-round' && 'Last chance!'}
              {type === 'game-over' && 'Thanks for playing!'}
            </motion.p>

            {/* Loading Dots for Results */}
            {type === 'results-reveal' && (
              <motion.div className="flex justify-center gap-2 mt-6">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: accentColor }}
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 0.6,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                  />
                ))}
              </motion.div>
            )}
          </motion.div>

          {/* Corner Accents */}
          <div
            className="absolute top-0 left-0 w-32 h-32 border-l-4 border-t-4 rounded-tl-3xl"
            style={{ borderColor: accentColor }}
          />
          <div
            className="absolute top-0 right-0 w-32 h-32 border-r-4 border-t-4 rounded-tr-3xl"
            style={{ borderColor: accentColor }}
          />
          <div
            className="absolute bottom-0 left-0 w-32 h-32 border-l-4 border-b-4 rounded-bl-3xl"
            style={{ borderColor: accentColor }}
          />
          <div
            className="absolute bottom-0 right-0 w-32 h-32 border-r-4 border-b-4 rounded-br-3xl"
            style={{ borderColor: accentColor }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============ HOOK FOR EASY USAGE ============
export function useTransition() {
  const [transitionConfig, setTransitionConfig] =
    useState<TransitionConfig | null>(null);
  const [showTransition, setShowTransition] = useState(false);

  const trigger = useCallback((config: TransitionConfig) => {
    setTransitionConfig(config);
    setShowTransition(true);
  }, []);

  const dismiss = useCallback(() => {
    setShowTransition(false);
  }, []);

  return {
    transitionConfig,
    showTransition,
    trigger,
    dismiss,
    TransitionComponent: transitionConfig ? (
      <CinematicTransition
        config={transitionConfig}
        show={showTransition}
        onComplete={dismiss}
      />
    ) : null,
  };
}

export default CinematicTransition;
