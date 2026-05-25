'use client';

import { usePartyContext } from '@/hooks/PartyProvider';
import {
  motion,
  AnimatePresence,
} from 'framer-motion';
import {
  Zap,
  Users,
  PlayCircle,
  Clock,
  Trophy,
  Star,
  ChevronLeft,
  ChevronRight,
  Banknote,
  Target,
  Gavel,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useState, useRef, useEffect, useCallback } from 'react';
import { FloatingProps } from '@/components/christmas/FloatingProps';
import { CartoonButton } from '@/components/christmas/CartoonButton';
import config from '@/data/config.json';

const gameIcons: Record<string, { icon: React.ReactNode; bgIcon: React.ReactNode }> = {
  heist: {
    icon: <Banknote className="w-12 h-12" />,
    bgIcon: <Banknote className="w-full h-full" />,
  },
  'group-trial': {
    icon: <Gavel className="w-12 h-12" />,
    bgIcon: <Gavel className="w-full h-full" />,
  },
  saboteur: {
    icon: <Target className="w-12 h-12" />,
    bgIcon: <Target className="w-full h-full" />,
  },
  'rapid-fire': {
    icon: <Zap className="w-12 h-12" />,
    bgIcon: <Zap className="w-full h-full" />,
  },
  'most-likely': {
    icon: <Users className="w-12 h-12" />,
    bgIcon: <Users className="w-full h-full" />,
  },
};

const GAMES = config.games.map((g) => ({
  ...g,
  ...gameIcons[g.id],
}));

export default function GamesLobby() {
  const { connected, myPlayer } = usePartyContext();
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const params = useParams();
  const roomCode = params?.roomCode as string || '';

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const scrollLeft = containerRef.current.scrollLeft;
    const width = containerRef.current.offsetWidth;
    const newIndex = Math.round(scrollLeft / width);
    if (newIndex !== activeIndex && newIndex >= 0 && newIndex < GAMES.length) {
      setActiveIndex(newIndex);
    }
  }, [activeIndex]);

  const activeGame = GAMES[activeIndex];

  return (
    <div className="h-dvh w-full overflow-hidden selection:bg-white/20 relative">
      <FloatingProps variant="minimal" />

      {/* Cinematic Reactive Background */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeGame.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2 }}
          className="fixed inset-0 z-0">
          <div
            className="absolute inset-0 opacity-10 transition-colors duration-1000"
            style={{ backgroundColor: activeGame.color }}
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,rgba(0,0,0,0.9)_100%)]" />

          <motion.div
            initial={{ scale: 0.8, opacity: 0, rotate: -5 }}
            animate={{ scale: 1.1, opacity: 0.03, rotate: 0 }}
            className="absolute -right-20 -bottom-20 w-[600px] h-[600px] pointer-events-none overflow-hidden"
            style={{ color: activeGame.color }}>
            {activeGame.bgIcon}
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Ultra-Minimal Status HUD */}
      <header className="fixed top-0 inset-x-0 z-50 p-6 flex items-center justify-between pointer-events-none">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center gap-3 bg-black/40 backdrop-blur-2xl border border-white/5 px-4 py-2 rounded-2xl shadow-2xl pointer-events-auto">
          <div
            className={`w-2 h-2 rounded-full ${
              connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
            }`}
          />
          <span className="text-[10px] font-black text-white/40 tracking-[0.3em] uppercase">
            Live Arena
          </span>
        </motion.div>

        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center gap-3 bg-black/40 backdrop-blur-2xl border border-[#FFD93D]/20 px-4 py-2 rounded-2xl shadow-2xl pointer-events-auto">
          <Trophy size={16} className="text-[#FFD93D]" />
          <span className="text-sm font-black text-white">
            {myPlayer?.score || 0}
          </span>
        </motion.div>
      </header>

      {/* Main Snap Horizontal Carousel */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full w-full overflow-x-auto overflow-y-hidden flex snap-x snap-mandatory hide-scrollbar overscroll-x-contain">
        {GAMES.map((game, i) => (
          <section
            key={game.id}
            className="h-full w-full shrink-0 flex items-center justify-center snap-center px-4 py-20 lg:p-12">
            <GamePoster game={game} isActive={activeIndex === i} roomCode={roomCode} />
          </section>
        ))}
      </div>
      
      {/* Carousel Navigation UI */}
      <div className="fixed bottom-10 inset-x-0 z-50 flex flex-col items-center gap-6 pointer-events-none">
        <div className="flex gap-2.5 pointer-events-auto bg-white/5 backdrop-blur-xl p-2 rounded-full border border-white/10">
          {GAMES.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                if (containerRef.current) {
                  containerRef.current.scrollTo({
                    left: i * containerRef.current.offsetWidth,
                    behavior: 'smooth',
                  });
                }
              }}
              className={cn(
                'h-1.5 rounded-full transition-all duration-500',
                activeIndex === i
                  ? 'w-8 bg-white shadow-[0_0_15px_white]'
                  : 'w-1.5 bg-white/10'
              )}
            />
          ))}
        </div>

        <motion.div
          animate={{ x: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex items-center gap-3 text-white/20 font-black text-[9px] tracking-[0.6em] uppercase font-sans">
          <ChevronLeft size={14} />
          <span>Swipe to switch</span>
          <ChevronRight size={14} />
        </motion.div>
      </div>

      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

function GamePoster({ game, isActive, roomCode }: any) {
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={
        isActive ? { scale: 1, opacity: 1 } : { scale: 0.9, opacity: 0.3 }
      }
      className="relative w-full max-w-6xl h-full flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-20 z-10">
      {/* 1. Cartoonish Sticker Card (Poster) */}
      <div className="w-full max-w-[320px] lg:max-w-none lg:w-[400px] shrink-0">
        <Link href={`/${roomCode}/games/${game.id}`} className="block group relative">
          {/* Sticker Background / Shadow */}
          <div className="absolute inset-0 bg-white/10 rounded-4xl translate-x-3 translate-y-3 group-hover:translate-x-4 group-hover:translate-y-4 transition-transform duration-500 blur-2xl" />

          <div className="relative aspect-3/4 rounded-4xl bg-[#151515] border-[6px] border-white overflow-hidden shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] transition-all duration-500 group-hover:scale-105 group-hover:-rotate-1 group-hover:shadow-[0_40px_80px_-15px_rgba(0,0,0,0.8)]">
            {/* Visual Content */}
            <div
              className={cn(
                'absolute inset-0 bg-linear-to-br transition-opacity duration-700',
                game.gradient
              )}
            />
            <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px] group-hover:backdrop-blur-none transition-all duration-500" />

            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center sm:p-12">
              <motion.div
                animate={isActive ? { y: [0, -12, 0], rotate: [0, 2, 0] } : {}}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="w-24 h-24 lg:w-36 lg:h-36 rounded-4xl bg-white border-4 border-black/5 flex items-center justify-center shadow-2xl relative"
                style={{ color: game.color }}>
                <div className="text-5xl lg:text-7xl group-hover:scale-110 transition-transform duration-500">
                  {game.emoji}
                </div>
              </motion.div>

              <div className="mt-8 space-y-2">
                <h2 className="text-4xl lg:text-5xl font-black text-white uppercase tracking-tighter leading-tight drop-shadow-lg">
                  {game.name}
                </h2>
                <div className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-lg text-xs font-black uppercase tracking-widest text-white border border-white/20">
                  {game.tagline}
                </div>
              </div>
            </div>

            {/* Top Badge */}
            <div className="absolute top-6 left-6 flex gap-2">
              {game.isNew && (
                <div className="bg-[#FFD93D] text-black text-[9px] font-black px-3 py-1 rounded-lg border-2 border-black rotate-[-5deg] shadow-lg">
                  NEW
                </div>
              )}
              {game.isFlagship && (
                <div className="bg-white text-black text-[9px] font-black px-3 py-1 rounded-lg border-2 border-black rotate-[5deg] shadow-lg flex items-center gap-1">
                  <Star size={10} fill="currentColor" />
                  PREMIUM
                </div>
              )}
            </div>
          </div>
        </Link>
      </div>

      {/* 2. Info Section (Responsive) */}
      <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left max-w-md lg:max-w-none space-y-6 lg:space-y-10">
        <motion.div
          animate={isActive ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }}
          className="space-y-3">
          <div className="flex items-center justify-center lg:justify-start gap-3">
            <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.5em]">
              Description
            </span>
            <div className="h-0.5 w-10 bg-white/10" />
          </div>
          <p className="text-xl lg:text-3xl font-bold text-white leading-snug lg:leading-tight">
            {game.desc}
          </p>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          animate={isActive ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap justify-center lg:justify-start gap-3 lg:gap-5">
          <CompactStat
            icon={<Star size={14} />}
            label="Difficulty"
            value={game.difficulty}
            color={game.color}
          />
          <CompactStat
            icon={<Clock size={14} />}
            label="Duration"
            value={game.duration}
            color={game.color}
          />
          <CompactStat
            icon={<Trophy size={14} />}
            label="Points"
            value={game.points}
            color={game.color}
          />
        </motion.div>

        {/* Cartoon Play Button */}
        <motion.div
          animate={
            isActive ? { scale: 1, opacity: 1 } : { scale: 0.8, opacity: 0 }
          }
          transition={{ delay: 0.2 }}
          className="w-full lg:w-auto flex justify-center lg:justify-start">
          <Link href={`/${roomCode}/games/${game.id}`}>
            <CartoonButton variant="gold" className="px-12 h-16 text-lg">
              <PlayCircle size={22} />
              Play Now
            </CartoonButton>
          </Link>
        </motion.div>
      </div>
    </motion.div>
  );
}

function CompactStat({ icon, label, value, color }: any) {
  return (
    <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2.5 rounded-2xl group hover:border-white/20 transition-all">
      <div className="flex flex-col items-center lg:items-start">
        <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">
          {label}
        </span>
        <span className="text-sm font-black text-white">{value}</span>
      </div>
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center shadow-lg"
        style={{ backgroundColor: color + '20', color }}>
        {icon}
      </div>
    </div>
  );
}
