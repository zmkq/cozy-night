'use client';

import { motion } from 'framer-motion';
import { Eye, Trophy, Zap } from 'lucide-react';
import { usePartyContext } from '@/hooks/PartyProvider';
import { cn } from '@/lib/utils';

const GAME_LABELS: Record<string, string> = {
  'saboteur': 'Saboteur',
  'rapid-fire': 'Rapid Fire',
  'most-likely': 'Most Likely',
  'shotcaller': 'Shot Caller',
  'heist': 'The Heist',
  'lie-rate': 'Lie Rate',
  'group-trial': 'Squad Trial',
};

const PHASE_LABELS: Record<string, string> = {
  playing: 'Live Round',
  voting: 'Voting Phase',
  results: 'Results',
  guessing: 'Guessing',
  evidence: 'Evidence Phase',
  defense: 'Defense Phase',
  sentencing: 'Verdict',
  'heist-planning': 'Mission Planning',
  'heist-voting': 'Vote Phase',
  'heist-execution': 'Execution',
  'heist-result': 'Mission Result',
};

export function SpectatorView() {
  const { state, players } = usePartyContext();

  const activePlayers = players.filter((p) => !p.isSpectator);
  const spectators = players.filter((p) => p.isSpectator);
  const sorted = [...activePlayers].sort((a, b) => b.score - a.score);

  const gameLabel = state.currentGame ? (GAME_LABELS[state.currentGame] ?? state.currentGame) : 'Game';
  const phaseLabel = PHASE_LABELS[state.phase] ?? state.phase;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 font-sans">
      {/* Spectator badge */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 12 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 bg-blue-500/20 border-2 border-blue-500/50 px-6 py-3 rounded-full shadow-lg shadow-blue-500/10">
          <Eye size={20} className="text-blue-400 animate-pulse" />
          <span className="text-blue-300 font-black uppercase tracking-widest text-sm">
            Spectator Mode
          </span>
        </div>
      </motion.div>

      {/* Game status card */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="w-full max-w-sm bg-white/5 border-2 border-white/10 rounded-3xl p-6 text-center mb-6 shadow-xl"
      >
        <div className="text-5xl mb-4">👀</div>
        <h1 className="text-2xl font-black text-white uppercase italic leading-tight mb-2">
          {gameLabel}
        </h1>
        <div className="flex items-center justify-center gap-2">
          <Zap size={14} className="text-yellow-400 animate-pulse" />
          <span className="text-yellow-400 font-black text-xs uppercase tracking-wider">
            {phaseLabel}
          </span>
          <Zap size={14} className="text-yellow-400 animate-pulse" />
        </div>
        <p className="text-white/40 text-xs font-bold mt-3 uppercase tracking-wide">
          Round {state.round} / {state.maxRounds}
        </p>
      </motion.div>

      {/* Live leaderboard */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="w-full max-w-sm bg-white/5 border border-white/10 rounded-3xl p-4 shadow-xl"
      >
        <div className="flex items-center gap-2 mb-4">
          <Trophy size={16} className="text-yellow-400" />
          <span className="text-white/60 text-xs font-black uppercase tracking-widest">
            Live Standings
          </span>
        </div>

        <div className="space-y-2">
          {sorted.map((p, i) => (
            <motion.div
              key={p.id}
              layout
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-2xl border transition-all',
                i === 0
                  ? 'bg-yellow-500/10 border-yellow-500/30'
                  : 'bg-white/5 border-white/5'
              )}
            >
              <span
                className={cn(
                  'w-6 text-center font-black text-sm',
                  i === 0 ? 'text-yellow-400' : 'text-white/30'
                )}
              >
                {i === 0 ? '👑' : `${i + 1}`}
              </span>
              <div className="w-8 h-8 rounded-full border border-white/20 overflow-hidden bg-white/10 flex items-center justify-center shrink-0">
                {p.avatar && p.avatar.startsWith('http') ? (
                  <img src={p.avatar} className="w-full h-full object-cover" alt={p.name} />
                ) : (
                  <span className="text-sm">{p.avatar || '👤'}</span>
                )}
              </div>
              <span className="flex-1 text-white font-bold text-sm truncate">{p.name}</span>
              <span className="text-yellow-400 font-black font-mono text-sm">{p.score}</span>
            </motion.div>
          ))}
        </div>

        {spectators.length > 1 && (
          <div className="mt-4 pt-3 border-t border-white/5">
            <p className="text-white/30 text-[10px] font-bold uppercase tracking-wider text-center">
              👀 {spectators.length} watching
            </p>
          </div>
        )}
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-white/20 text-xs font-bold uppercase tracking-wider mt-8 text-center"
      >
        You joined mid-game — you&apos;ll play next round!
      </motion.p>
    </div>
  );
}
