'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import usePartySocket from 'partysocket/react';

const PARTYKIT_HOST = process.env.NEXT_PUBLIC_PARTYKIT_HOST || '127.0.0.1:1999';

export function TajFasFartedOverlay({ userId, roomCode }: { userId: string; roomCode: string }) {
  const [isActive, setIsActive] = useState(false);

  // We connect a socket just to listen for this event
  usePartySocket({
    host: PARTYKIT_HOST,
    room: roomCode,
    id: userId,
    onMessage(event) {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'taj-fas-farted') {
          triggerEvent();
        }
      } catch (e) {
        // ignore
      }
    },
  });

  const triggerEvent = () => {
    setIsActive(true);
    // Hide after 8 seconds
    setTimeout(() => setIsActive(false), 8000);
  };

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-100 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-none overflow-hidden">
          {/* Animated red background pulsing */}
          <motion.div
            animate={{ opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 0.5, repeat: Infinity }}
            className="absolute inset-0 bg-red-900/50"
          />

          {/* Glitch effects */}
          <GlitchText text="TOXIC GAS ALERT" delay={0} />

          <div className="h-8" />

          <GlitchText text="GAS LEAK! RUN FOR YOUR LIVES!" delay={0.5} />

          {/* Shake effect container */}
          <motion.div
            className="absolute inset-0 border-20 border-red-600/30"
            animate={{
              x: [0, -10, 10, -10, 10, 0],
              y: [0, -10, 10, -5, 5, 0],
            }}
            transition={{ duration: 0.2, repeat: Infinity }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function GlitchText({
  text,
  delay,
  isArabic = false,
}: {
  text: string;
  delay: number;
  isArabic?: boolean;
}) {
  return (
    <motion.h1
      initial={{ scale: 0.5, opacity: 0, y: 50 }}
      animate={{ scale: [1, 1.2, 1], opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, type: 'spring' }}
      className={`text-6xl md:text-9xl font-black text-center text-[#FFD93D] drop-shadow-[0_0_15px_rgba(255,0,0,0.8)] ${
        isArabic ? 'font-arabic' : ''
      }`}
      style={{
        textShadow: '4px 4px 0px #FF0000, -4px -4px 0px #0000FF',
      }}>
      <motion.span
        animate={{
          x: [0, 2, -2, 0],
          skewX: [0, 10, -10, 0],
        }}
        transition={{
          duration: 0.1,
          repeat: Infinity,
          repeatDelay: Math.random() * 2,
        }}
        className="block">
        {text}
      </motion.span>
    </motion.h1>
  );
}
