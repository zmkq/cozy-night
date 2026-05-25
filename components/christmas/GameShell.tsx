'use client';
import { useEffect, useState } from 'react';

import { StickerCard } from '@/components/christmas/StickerCard';
import { CartoonIconButton } from '@/components/christmas/CartoonButton';
import {
  ArrowLeft,
  Trophy,
  Flame,
  Settings,
  Info,
  Shield,
  Zap,
  Banknote,
  Gavel,
  Target,
  Brain,
  Hash,
} from 'lucide-react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { GameTutorialOverlay } from '@/components/games/GameTutorialOverlay';
import { LiveBadassGuide } from '@/components/games/LiveBadassGuide';
import { usePartyContext } from '@/hooks/PartyProvider';
import { useSound } from '@/hooks/useSound';
import { cn } from '@/lib/utils';

interface GameShellProps {
  title: string;
  gameId: string;
  score?: number;
  children: React.ReactNode;
}

const GAME_BRANDING: Record<
  string,
  { icon: any; color: string; label: string }
> = {
  heist: { icon: Banknote, color: '#F59E0B', label: 'THE HEIST' },
  'group-trial': { icon: Gavel, color: '#EF4444', label: 'THE TRIAL' },
  saboteur: { icon: Target, color: '#FF4D6A', label: 'SABOTEUR' },
  'rapid-fire': { icon: Zap, color: '#3B82F6', label: 'RAPID FIRE' },
  'most-likely': { icon: Shield, color: '#10B981', label: 'EXPOSED' },
  default: { icon: Hash, color: '#8B5CF6', label: 'PARTY MODE' },
};

export function GameShell({
  title,
  gameId,
  score = 0,
  children,
}: GameShellProps) {
  const { state, myPlayer } = usePartyContext();
  const { play } = useSound();
  const [isScrolled, setIsScrolled] = useState(false);
  const params = useParams();
  const roomCode = params?.roomCode as string | undefined;

  const branding =
    GAME_BRANDING[gameId as keyof typeof GAME_BRANDING] ||
    GAME_BRANDING.default;
  const BrandingIcon = branding.icon;

  useEffect(() => {
    play('swipe');
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [play]);

  return (
    <div className="min-h-screen flex flex-col font-arabic selection:bg-white/20 bg-midnight">
      {/* Dynamic Background Mesh - Simplified for performance */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-5">
        <div
          className="absolute inset-0 bg-repeat opacity-5"
          style={{
            backgroundImage:
              'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.1) 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />
      </div>

      {/* Ultra-Premium Cockpit Header */}
      <header
        className={cn(
          'sticky top-0 z-60 transition-all duration-700 px-2 sm:px-4 pt-4 sm:pt-6 pb-2 sm:pb-4',
          isScrolled ? 'scale-95 py-1' : 'scale-100'
        )}>
        <div className="relative max-w-6xl mx-auto rounded-3xl sm:rounded-4xl overflow-hidden border border-white/10 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] bg-midnight/95">
          {/* RGB Scanline Effect - Static/Low Opacity */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-5">
            <div className="absolute inset-x-0 h-px bg-white opacity-20" />
          </div>

          {/* Inner Glow Base */}
          <div className="absolute inset-0 pointer-events-none border border-white/5 rounded-3xl sm:rounded-4xl" />

          {/* Large Backdrop Icon (Branding) */}
          <div className="absolute -left-10 -top-10 opacity-5 pointer-events-none group transition-transform duration-1000">
            <BrandingIcon
              size={180}
              className="hidden sm:block"
              style={{ color: branding.color }}
            />
          </div>

          <div className="relative px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2 sm:gap-4">
            {/* Left Controls */}
            <div className="flex items-center gap-2 sm:gap-3">
              <Link href={roomCode ? `/${roomCode}/games` : '/games'}>
                <motion.div
                  whileHover={{ scale: 1.1, rotate: -5 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all group">
                  <ArrowLeft
                    size={18}
                    className="group-hover:-translate-x-1 transition-transform sm:size-[20px]"
                  />
                </motion.div>
              </Link>

              <div className="hidden sm:flex flex-col">
                <span className="text-[10px] font-black text-white/20 tracking-[0.3em] uppercase">
                  Status
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                  <span className="text-xs font-black text-green-500 uppercase tracking-widest leading-none">
                    Live
                  </span>
                </div>
              </div>
            </div>

            {/* Center Branding */}
            <div className="flex flex-col items-center flex-1 min-w-0">
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="flex items-center gap-2">
                <div
                  className="w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg flex items-center justify-center shadow-lg border border-white/10 shrink-0"
                  style={{ backgroundColor: branding.color + '20' }}>
                  <BrandingIcon
                    size={14}
                    style={{ color: branding.color }}
                    className="sm:size-[16px]"
                  />
                </div>
                <span className="text-[8px] sm:text-[10px] font-black tracking-[0.2em] sm:tracking-[0.4em] text-white/40 uppercase truncate">
                  {branding.label}
                </span>
              </motion.div>

              <h1 className="text-lg md:text-3xl font-black text-white uppercase tracking-tighter leading-none mt-0.5 sm:mt-1 truncate w-full text-center">
                {title}
              </h1>
            </div>

            {/* Right Display: Score/Power Badge */}
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="hidden lg:flex flex-col items-end">
                <span className="text-[10px] font-black text-white/20 tracking-[0.3em] uppercase">
                  Session
                </span>
                <span className="text-xs font-black text-white/60 uppercase tracking-widest">
                  Active
                </span>
              </div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                className="relative group cursor-default">
                <div className="absolute inset-0 bg-[#FFD93D] blur-xl opacity-0 group-hover:opacity-20 transition-opacity" />
                <div className="relative flex items-center gap-2 sm:gap-3 bg-white/5 border border-[#FFD93D]/30 px-3 sm:px-5 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl shadow-xl">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg bg-[#FFD93D] flex items-center justify-center text-black shadow-[0_0_15px_rgba(255,217,61,0.3)] shrink-0">
                    <Trophy
                      size={14}
                      strokeWidth={3}
                      className="sm:size-[16px]"
                    />
                  </div>
                  <div className="flex flex-col -space-y-1">
                    <span className="text-[8px] sm:text-[10px] font-black text-[#FFD93D]/60 uppercase tracking-wider">
                      Points
                    </span>
                    <span className="text-base sm:text-xl font-black text-white">
                      {score}
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Bottom Accent Bar */}
          <div
            className="h-[2px] w-full"
            style={{
              background: `linear-gradient(90deg, transparent, ${branding.color}, transparent)`,
            }}
          />
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 relative z-10 w-full max-w-7xl mx-auto px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="py-4 h-full">
          {children}
        </motion.div>
      </main>

      {/* Contextual Tools */}
      {state && (
        <LiveBadassGuide
          gameId={gameId}
          phase={state.phase}
          roundData={state.roundData}
          myPlayerId={myPlayer?.id}
        />
      )}

      <GameTutorialOverlay gameId={gameId} />

      <style jsx global>{`
        @keyframes scan {
          0% {
            transform: translateY(-100%);
          }
          100% {
            transform: translateY(500%);
          }
        }
      `}</style>
    </div>
  );
}
