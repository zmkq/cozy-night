'use client';

import { motion } from 'framer-motion';

interface FloatingPropsProps {
  variant?: 'full' | 'minimal';
}

const fullProps = [
  {
    emoji: '🍕',
    position: 'top-10 left-[5%]',
    size: 'text-[8rem]',
    animation: { rotate: [0, 15, -15, 0], y: [0, -30, 0] },
    duration: 7,
    opacity: 'opacity-15',
  },
  {
    emoji: '🎮',
    position: 'top-1/2 right-[5%]',
    size: 'text-[6rem]',
    animation: { rotate: -360 },
    duration: 25,
    opacity: 'opacity-10',
  },
  {
    emoji: '❄️',
    position: 'bottom-20 left-1/4',
    size: 'text-[10rem]',
    animation: { y: [0, 60, 0], x: [0, 30, 0] },
    duration: 15,
    opacity: 'opacity-[0.05]',
  },
  {
    emoji: '⭐',
    position: 'top-1/4 right-1/4',
    size: 'text-[5rem]',
    animation: { scale: [1, 1.2, 1], rotate: [0, -10, 10, 0] },
    duration: 8,
    opacity: 'opacity-[0.08]',
  },
  {
    emoji: '🎄',
    position: 'bottom-1/4 right-[10%]',
    size: 'text-[7rem]',
    animation: { rotate: [0, 5, -5, 0] },
    duration: 6,
    opacity: 'opacity-[0.06]',
  },
];

const minimalProps = [
  {
    emoji: '⭐',
    position: 'top-20 right-[10%]',
    size: 'text-[4rem]',
    animation: { scale: [1, 1.2, 1] },
    duration: 4,
    opacity: 'opacity-10',
  },
  {
    emoji: '🎄',
    position: 'bottom-20 left-[10%]',
    size: 'text-[5rem]',
    animation: { rotate: [0, 3, -3, 0] },
    duration: 5,
    opacity: 'opacity-[0.08]',
  },
];

export function FloatingProps({ variant = 'full' }: FloatingPropsProps) {
  const props = variant === 'full' ? fullProps : minimalProps;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden select-none z-0">
      {props.map((prop, index) => (
        <motion.div
          key={index}
          animate={prop.animation}
          transition={{
            repeat: Infinity,
            duration: prop.duration,
            ease: prop.animation.rotate === -360 ? 'linear' : 'easeInOut',
          }}
          className={`absolute ${prop.position} ${prop.size} ${prop.opacity} filter blur-[0.5px]`}>
          {prop.emoji}
        </motion.div>
      ))}

      {/* Comic text effects - only for full variant */}
      {variant === 'full' && (
        <>
          <div className="absolute top-[10%] right-[8%] transform rotate-12 opacity-10 hidden md:block">
            <span className="text-7xl font-black text-white/20 border-4 border-white/10 px-4 py-1 rounded-xl">
              BOOM!
            </span>
          </div>
          <div className="absolute bottom-[15%] left-[5%] transform -rotate-6 opacity-[0.06] hidden md:block">
            <span className="text-8xl font-black text-white/10 border-4 border-white/5 px-4 py-1 rounded-xl">
              POW!
            </span>
          </div>
        </>
      )}
    </div>
  );
}
