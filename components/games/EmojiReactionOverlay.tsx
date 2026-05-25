'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePartyContext } from '@/hooks/PartyProvider';
import { Smile } from 'lucide-react';
import { useSound } from '@/hooks/useSound';

interface FloatingEmoji {
  id: string;
  emoji: string;
  x: number; // horizontal offset in %
  rotation: number;
  scale: number;
}

const EMOJIS = ['😂', '🔥', '😮', '👑', '💩', '❤️', '👍', '🎉'];

export function EmojiReactionOverlay() {
  const { sendReaction } = usePartyContext();
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const { play } = useSound();

  // Listen to the window event dispatched by useParty.ts
  useEffect(() => {
    const handleEmojiBlast = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { emoji, playerName } = customEvent.detail;
      
      const newEmoji: FloatingEmoji = {
        id: `${Date.now()}-${Math.random()}`,
        emoji,
        x: 20 + Math.random() * 60, // scatter between 20% and 80% width
        rotation: (Math.random() - 0.5) * 45, // -22.5 to 22.5 deg
        scale: 0.8 + Math.random() * 0.5,
      };

      setFloatingEmojis((prev) => [...prev, newEmoji]);
      
      // Play a subtle pop sound when reaction is received
      try {
        play('pop', 0.2);
      } catch (err) {
        // Sound error ignored
      }
    };

    window.addEventListener('cozy-emoji-blast', handleEmojiBlast);
    return () => window.removeEventListener('cozy-emoji-blast', handleEmojiBlast);
  }, [play]);

  // Clean up floating emojis after animation finishes (approx 2s)
  const removeEmoji = useCallback((id: string) => {
    setFloatingEmojis((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const handleSendReaction = (emoji: string) => {
    if (sendReaction) {
      sendReaction(emoji);
      try {
        play('click', 0.4);
      } catch (err) {}
    }
  };

  return (
    <>
      {/* Floating Canvas for rendering active emoji blasts */}
      <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
        <AnimatePresence>
          {floatingEmojis.map((item) => (
            <motion.div
              key={item.id}
              initial={{ y: '105vh', x: `${item.x}vw`, scale: 0, opacity: 0 }}
              animate={{
                y: '-10vh',
                x: `${item.x + (Math.random() - 0.5) * 15}vw`, // drift sideways
                scale: item.scale,
                opacity: [0, 1, 1, 0],
                rotate: item.rotation,
              }}
              transition={{
                duration: 2.2,
                ease: 'easeOut',
              }}
              exit={{ opacity: 0 }}
              onAnimationComplete={() => removeEmoji(item.id)}
              className="absolute text-4xl select-none select-none filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]">
              {item.emoji}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Floating Action Trigger Dock */}
      <div className="fixed bottom-6 right-6 z-[1000] flex flex-col items-end gap-2 font-sans select-none">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="flex items-center gap-1.5 bg-black/80 backdrop-blur-xl border-2 border-white/10 p-2 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
              {EMOJIS.map((emoji) => (
                <motion.button
                  key={emoji}
                  whileHover={{ scale: 1.25, rotate: 5 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleSendReaction(emoji)}
                  className="w-10 h-10 flex items-center justify-center text-2xl hover:bg-white/10 rounded-xl transition-colors outline-none cursor-pointer">
                  {emoji}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setIsOpen(!isOpen);
            try {
              play('swipe', 0.4);
            } catch (err) {}
          }}
          className="w-12 h-12 rounded-full bg-[#FFD93D] hover:bg-[#FFD93D]/90 text-black flex items-center justify-center shadow-lg border-2 border-black outline-none cursor-pointer transition-colors">
          <Smile size={22} className={isOpen ? 'rotate-12 transition-transform' : ''} />
        </motion.button>
      </div>
    </>
  );
}
