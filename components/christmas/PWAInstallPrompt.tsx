'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StickerCard } from './StickerCard';
import { CartoonButton } from './CartoonButton';
import { Share, SquarePlus, X, Smartphone } from 'lucide-react';

export function PWAInstallPrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Check if it's iOS
    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

    // Check if already in standalone mode
    const isStandalone =
      (window.navigator as any).standalone ||
      window.matchMedia('(display-mode: standalone)').matches;

    // Check if dismissed before
    const isDismissed = localStorage.getItem('pwa_prompt_dismissed') === 'true';

    if (isIOS && !isStandalone && !isDismissed) {
      // Delay it slightly for impact (wow effect)
      const timer = setTimeout(() => setShow(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-9999 flex items-end justify-center p-6 bg-black/80 backdrop-blur-md sm:items-center">
          <motion.div
            initial={{ y: 200, scale: 0.9, rotate: 5 }}
            animate={{ y: 0, scale: 1, rotate: 0 }}
            exit={{ y: 200, scale: 0.9, rotate: -5 }}
            className="w-full max-w-sm">
            <StickerCard
              className="p-8 relative overflow-hidden font-sans"
              accentColor="gold">
              {/* Decorative Background Icon */}
              <div className="absolute -right-8 -top-8 text-white/5 rotate-12 pointer-events-none">
                <Smartphone size={160} />
              </div>

              <button
                onClick={handleDismiss}
                className="absolute top-4 left-4 text-white/40 hover:text-white transition-colors z-20"
                aria-label="Close">
                <X size={24} />
              </button>

              <div className="text-center space-y-6 relative z-10">
                <div className="text-7xl mb-2 animate-bounce drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]">
                  📱
                </div>

                <div className="space-y-2">
                  <h2 className="text-3xl font-black text-white leading-tight">
                    Install the App!
                  </h2>
                  <p className="text-white/70 font-bold text-lg">
                    Install to get the full screen experience with no browser bars.
                  </p>
                </div>

                <div className="space-y-4 bg-black/40 p-5 rounded-3xl border-2 border-white/10 text-left">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-[#FFD93D] flex items-center justify-center shrink-0 shadow-[0_4px_0px_#B89B2B]">
                      <Share size={20} className="text-black" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-white">
                        1. Press the Share button
                      </p>
                      <p className="text-[10px] text-white/40 uppercase font-bold">
                        Found at the bottom of the screen
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-[#2ECC71] flex items-center justify-center shrink-0 shadow-[0_4px_0px_#1E8449]">
                      <SquarePlus size={20} className="text-black" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-white">
                        2. Select "Add to Home Screen"
                      </p>
                      <p className="text-[10px] text-white/40 uppercase font-bold">
                        Add to Home Screen
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <CartoonButton
                    variant="green"
                    fullWidth
                    onClick={handleDismiss}
                    size="lg">
                    Got it, thanks!
                  </CartoonButton>
                </div>
              </div>
            </StickerCard>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
