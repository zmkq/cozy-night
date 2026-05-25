'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StickerCard } from '@/components/christmas/StickerCard';
import { CartoonButton } from '@/components/christmas/CartoonButton';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Zap,
  Users,
  Gavel,
  Eye,
  Crown,
  Banknote,
  Brain,
  Skull,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TutorialStep {
  title: string;
  desc: string;
  icon: any;
  color: string;
}

const TUTORIALS: Record<string, TutorialStep[]> = {
  saboteur: [
    {
      title: 'The Saboteur 🕵️',
      desc: 'There is a saboteur among you, and their mission is to ruin it for everyone.',
      icon: Ghost,
      color: '#FF4D6A',
    },
    {
      title: 'How to Play?',
      desc: 'Everyone sees a question, but the saboteur must answer incorrectly without anyone noticing.',
      icon: Sparkles,
      color: '#FFD93D',
    },
    {
      title: 'What is the Goal?',
      desc: 'The rest of the squad must identify the saboteur and vote them out before they succeed in their sabotage!',
      icon: Users,
      color: '#2ECC71',
    },
  ],
  'rapid-fire': [
    {
      title: 'Hurry Up ⚡',
      desc: 'There is no time to think, only for the fast and smart.',
      icon: Zap,
      color: '#FF4D6A',
    },
    {
      title: 'Speed is Key',
      desc: 'You have only a few seconds per question. Answer quickly to earn more points.',
      icon: Clock,
      color: '#FFD93D',
    },
    {
      title: 'Don\'t Freeze!',
      desc: 'If you delay, you lose out. Keep focused and watch the timer.',
      icon: Flame,
      color: '#2ECC71',
    },
  ],
  'most-likely': [
    {
      title: 'Expose the Squad 👆',
      desc: 'It is time for truth and endless roasts.',
      icon: Users,
      color: '#2ECC71',
    },
    {
      title: 'Point at them!',
      desc: 'Read the prompt and think who fits the description best.',
      icon: Target,
      color: '#FFD93D',
    },
    {
      title: 'The Big Reveal',
      desc: 'The player with the most votes wins the title (and the embarrassment).',
      icon: Sparkles,
      color: '#FF4D6A',
    },
  ],
  shotcaller: [
    {
      title: 'The Shotcaller 👑',
      desc: 'One player controls the fate of everyone. Power is sweet but scary.',
      icon: Crown,
      color: '#8B5CF6',
    },
    {
      title: 'Your Choice Rules',
      desc: 'The Shotcaller picks a card, and its outcome applies to everyone immediately.',
      icon: Zap,
      color: '#FFD93D',
    },
    {
      title: 'Negotiate!',
      desc: 'Try to convince the Shotcaller to make a choice in your favor, or wait for your turn to get revenge.',
      icon: MessageSquare,
      color: '#2ECC71',
    },
  ],
  'lie-rate': [
    {
      title: 'Lie Detector 🤥',
      desc: 'Not everything you hear is true. This is a game of intuition.',
      icon: Eye,
      color: '#EC4899',
    },
    {
      title: 'Yes or No?',
      desc: 'Everyone answers honestly (or lies). Your job is to guess who is lying and who is telling the truth.',
      icon: HelpCircle,
      color: '#FFD93D',
    },
    {
      title: 'Collect Points',
      desc: 'The more lies you expose, the more points you get to become the champion.',
      icon: Trophy,
      color: '#2ECC71',
    },
  ],
  'group-trial': [
    {
      title: 'Squad Trial ⚖️',
      desc: 'Judgment day is here, and no one is above the law.',
      icon: Gavel,
      color: '#DC2626',
    },
    {
      title: 'Submit Evidence',
      desc: 'One player is accused and the rest are jurors. Send text or logs to incriminate the accused.',
      icon: MessageSquare,
      color: '#FFD93D',
    },
    {
      title: 'Final Verdict',
      desc: 'Hear the defense of the accused, then vote: innocent or guilty. Justice for all!',
      icon: Shield,
      color: '#2ECC71',
    },
  ],
  heist: [
    {
      title: 'The Heist 💰',
      desc: 'A big robbery operation! But the problem is not the job, it\'s who you\'re with.',
      icon: Banknote,
      color: '#F59E0B',
    },
    {
      title: 'The Planner & The Crew 🧠',
      desc: 'The planner selects a mission and the crew votes. Everyone must agree to start.',
      icon: Brain,
      color: '#3B82F6',
    },
    {
      title: 'The Traitor 🐀',
      desc: 'There is a snitch whose goal is to sabotage the mission. If it fails, someone is a traitor!',
      icon: Skull,
      color: '#EF4444',
    },
  ],
};

import {
  Ghost,
  Clock,
  Flame,
  Target,
  MessageSquare,
  HelpCircle,
  Trophy,
  Shield,
} from 'lucide-react';

interface GameTutorialOverlayProps {
  gameId: string;
}

export function GameTutorialOverlay({ gameId }: GameTutorialOverlayProps) {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);
  const steps = TUTORIALS[gameId] || [];

  useEffect(() => {
    const viewed = localStorage.getItem(`tutorial_viewed_${gameId}`);
    if (!viewed) {
      setShow(true);
    }
  }, [gameId]);

  const handleClose = () => {
    setShow(false);
    localStorage.setItem(`tutorial_viewed_${gameId}`, 'true');
  };

  const nextStep = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      handleClose();
    }
  };

  const prevStep = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  if (!show || steps.length === 0) return null;

  const currentStep = steps[step];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
        className="fixed inset-0 z-100 flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl"
        dir="ltr">
        <motion.div
          initial={{ scale: 0.8, y: 20, rotate: -5 }}
          animate={{ scale: 1, y: 0, rotate: 0 }}
          exit={{ scale: 0.8, y: 20, rotate: 5 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md">
          <StickerCard
            className="p-8 space-y-8 relative overflow-hidden"
            accentColor="white">
            {/* Background Icon Glow */}
            <div
              className="absolute -right-20 -top-20 w-64 h-64 rounded-full blur-[100px] opacity-20 pointer-events-none"
              style={{ backgroundColor: currentStep.color }}
            />

            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-white/20 hover:text-white transition-colors z-10">
              <X size={24} />
            </button>

            <div className="text-center space-y-6 relative z-10">
              <motion.div
                key={step}
                initial={{ scale: 0.5, opacity: 0, rotate: -20 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                className="w-24 h-24 mx-auto rounded-3xl flex items-center justify-center shadow-2xl relative"
                style={{ backgroundColor: currentStep.color }}>
                <currentStep.icon size={48} className="text-white" />
                <div className="absolute inset-0 rounded-3xl animate-pulse bg-white/20" />
              </motion.div>

              <div className="space-y-3">
                <motion.h2
                  key={`title-${step}`}
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="text-3xl font-black text-white">
                  {currentStep.title}
                </motion.h2>
                <motion.p
                  key={`desc-${step}`}
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-white/70 text-lg font-bold leading-relaxed">
                  {currentStep.desc}
                </motion.p>
              </div>

              {/* Progress Dots */}
              <div className="flex justify-center gap-2">
                {steps.map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'h-2 rounded-full transition-all duration-300',
                      i === step ? 'w-8 bg-white' : 'w-2 bg-white/20'
                    )}
                  />
                ))}
              </div>

              <div className="flex gap-4 pt-4">
                {step > 0 && (
                  <CartoonButton variant="outline" fullWidth onClick={prevStep}>
                    <ChevronLeft size={20} className="mr-2" />
                    Back
                  </CartoonButton>
                )}
                <CartoonButton variant="gold" fullWidth onClick={nextStep}>
                  {step === steps.length - 1 ? 'Got it!' : 'Next'}
                  {step < steps.length - 1 && (
                    <ChevronRight size={20} className="ml-2" />
                  )}
                </CartoonButton>
              </div>
            </div>
          </StickerCard>

          <p className="text-center mt-6 text-white/40 text-sm font-bold animate-pulse">
            Click anywhere to skip
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
