'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { GameShell } from '@/components/christmas/GameShell';
import { StickerCard } from '@/components/christmas/StickerCard';
import { CartoonButton } from '@/components/christmas/CartoonButton';
import { useGameTransitions } from '@/components/games/TransitionProvider';
import { useToast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Users, ArrowRight, Crown } from 'lucide-react';
import { usePartyContext } from '@/hooks/PartyProvider';

export default function MostLikelyGame() {
  const params = useParams();
  const roomCode = params?.roomCode as string || '';
  const [myVote, setMyVote] = useState<string | null>(null);
  const hasTriggeredVoting = useRef(false);
  const hasTriggeredResults = useRef(false);

  const {
    state,
    players,
    myPlayer,
    startGame,
    vote,
    submitAnswer,
    leaveGame,
    setReady,
    nextRound,
  } = usePartyContext();

  const {
    triggerVoting,
    triggerResults,
    triggerEpicWin,
    triggerEpicFail,
    triggerRoundStart,
  } = useGameTransitions();

  const isLobby =
    state.phase === 'lobby' || state.currentGame !== 'most-likely';
  const isPlaying = state.phase === 'playing';
  const isVoting = state.phase === 'voting';
  const isResults = state.phase === 'results';

  const currentPrompt = state.roundData?.prompt as string;

  // Trigger voting transition
  useEffect(() => {
    if (
      (isPlaying || isVoting) &&
      !hasTriggeredVoting.current &&
      state.round > 0
    ) {
      hasTriggeredVoting.current = true;
      triggerVoting();
    }
    if (!isPlaying && !isVoting) {
      hasTriggeredVoting.current = false;
    }
  }, [isPlaying, isVoting, state.round, triggerVoting]);

  // Trigger results transition - epic win/fail for most voted
  useEffect(() => {
    if (isResults && !hasTriggeredResults.current) {
      hasTriggeredResults.current = true;

      // Check who got the most votes
      const votes = Object.values(state.votes || {});
      const voteCounts: Record<string, number> = {};
      votes.forEach((targetId: any) => {
        voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
      });

      const maxVotes = Math.max(0, ...Object.values(voteCounts));
      const winner = Object.keys(voteCounts).find(
        (id) => voteCounts[id] === maxVotes
      );
      const winnerPlayer = players.find((p) => p.id === winner);

      if (winnerPlayer) {
        // Being voted as "most likely" is a fun fail moment
        triggerEpicFail(winnerPlayer.name);
      } else {
        triggerResults();
      }

      // Persist score to permanent leaderboard!
      if (myPlayer?.score && myPlayer.score > 0) {
        import('@/app/actions').then(({ updateLeaderboardAction }) => {
          updateLeaderboardAction(roomCode, 'most-likely', myPlayer.score);
        });
      }
    }
    if (!isResults) {
      hasTriggeredResults.current = false;
    }
  }, [
    isResults,
    state.votes,
    players,
    triggerEpicFail,
    triggerResults,
    myPlayer?.score,
  ]);

  const handleVote = (targetId: string) => {
    setMyVote(targetId);
    vote(targetId);
  };

  return (
    <GameShell
      title="Most Likely To 👆"
      gameId="most-likely"
      score={myPlayer?.score || 0}>
      <div className="max-w-md mx-auto min-h-[60vh] flex flex-col justify-center p-4 w-full">
        {/* LOBBY */}
        {isLobby && (
          <div className="text-center space-y-6">
            <StickerCard
              className="p-10 flex flex-col items-center gap-6"
              accentColor="green">
              <div className="w-24 h-24 rounded-full bg-[#2ECC71]/20 flex items-center justify-center border-4 border-[#2ECC71]">
                <Users size={48} className="text-[#2ECC71] animate-bounce" />
              </div>
              <div>
                <h1 className="text-4xl font-black text-white mb-2">
                  Most Likely To 👆
                </h1>
                <p className="text-white/60 font-bold">
                  Expose your friends. Point at them.
                  <br />
                  No hard feelings. 😈
                </p>
              </div>

              <div className="w-full space-y-3 font-sans">
                <CartoonButton
                  variant={myPlayer?.ready ? 'green' : 'gold'}
                  fullWidth
                  onClick={() => setReady(!myPlayer?.ready)}>
                  {myPlayer?.ready ? '✓ Ready!' : 'Ready Up'}
                </CartoonButton>

                {players.every((p) => p.ready) && players.length > 1 && (
                  <CartoonButton
                    variant="red"
                    fullWidth
                    onClick={() => startGame('most-likely')}>
                    🔥 Expose Them
                  </CartoonButton>
                )}
              </div>
            </StickerCard>
          </div>
        )}

        {/* GAME: PLAYING (READING) & VOTING */}
        {(isPlaying || state.phase === 'voting') && (
          <div className="space-y-8 w-full">
            {/* Question */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 15 }}>
              <StickerCard
                className="p-8 text-center relative overflow-hidden group"
                accentColor="gold"
                hover={false}>
                <div className="absolute inset-0 bg-linear-to-b from-yellow-500/10 to-transparent opacity-30" />
                <p className="text-[10px] text-yellow-500 uppercase tracking-[0.4em] mb-4 font-black border border-yellow-500/20 rounded-full px-4 py-1.5 inline-block bg-yellow-500/5">
                  Accusation 😈
                </p>
                <h2 className="text-3xl md:text-4xl font-black text-white leading-tight italic tracking-tighter">
                  {currentPrompt || 'Waiting for question...'}
                </h2>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-linear-to-r from-transparent via-yellow-500/30 to-transparent" />
              </StickerCard>
            </motion.div>

            {/* Candidates (All Players) */}
            <div className="grid grid-cols-2 gap-4">
              {players.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="relative">
                  <motion.button
                    whileHover={{ scale: 1.05, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      if (state.phase === 'playing') {
                        submitAnswer('ready');
                      } else {
                        handleVote(p.id);
                      }
                    }}
                    disabled={myVote !== null && state.phase === 'voting'}
                    className={cn(
                      'w-full p-6 rounded-4xl border-4 flex flex-col items-center gap-4 transition-all relative overflow-hidden group shadow-xl',
                      myVote === p.id
                        ? 'bg-yellow-400 border-black text-black shadow-yellow-500/40 translate-y-[-5px]'
                        : 'bg-black/40 backdrop-blur-xl border-white/10 text-white hover:border-yellow-400/50'
                    )}>
                    <div className="absolute inset-0 bg-linear-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div
                      className={cn(
                        'w-20 h-20 rounded-2xl border-2 overflow-hidden flex items-center justify-center shrink-0 transition-all',
                        myVote === p.id
                          ? 'border-black/20 bg-black/5'
                          : 'border-white/10 bg-white/5 group-hover:border-yellow-400/20'
                      )}>
                      {p.avatar && p.avatar.startsWith('http') ? (
                        <img
                          src={p.avatar}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-4xl">{p.avatar || '👤'}</span>
                      )}
                    </div>
                    <span className="font-black text-xl italic tracking-tighter">
                      {p.name}
                    </span>

                    {myVote === p.id && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-2 right-2 bg-black text-white text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-widest border border-white/20">
                        Your Vote
                      </motion.div>
                    )}
                  </motion.button>
                </motion.div>
              ))}
            </div>

            <p className="text-center text-xs text-white/40 uppercase tracking-widest font-bold font-sans">
              {state.phase === 'playing'
                ? 'Pick the friend who fits best...'
                : 'Vote now!'}
            </p>
          </div>
        )}

        {/* RESULTS */}
        {isResults && (
          <div className="space-y-6 text-center w-full">
            <StickerCard className="p-8" accentColor="gold">
              <p className="text-xs uppercase tracking-widest text-[#FFD93D] mb-4 font-black">
                The Verdict 😂
              </p>

              {/* Show vote distribution */}
              <div className="space-y-3">
                {players.map((p) => {
                  const voteCount = Object.values(state.votes || {}).filter(
                    (v) => v === p.id
                  ).length;
                  const totalVotes = Object.keys(state.votes || {}).length;
                  const pct =
                    totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;

                  return (
                    <div
                      key={p.id}
                      className="relative h-14 bg-[#1a1a1a] rounded-xl overflow-hidden flex items-center px-4 border-2 border-white/10">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ type: 'spring', stiffness: 100 }}
                        className="absolute inset-y-0 left-0 bg-[#FFD93D]/30 border-r-4 border-[#FFD93D]"
                      />
                      <div className="relative z-10 w-8 h-8 rounded-full border border-white/20 overflow-hidden bg-white/10 flex items-center justify-center shrink-0 mr-3">
                        {p.avatar && p.avatar.startsWith('http') ? (
                          <img
                            src={p.avatar}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-lg">{p.avatar || '👤'}</span>
                        )}
                      </div>
                      <span className="relative z-10 font-black text-white flex-1 text-left">
                        {p.name}
                      </span>
                      <span className="relative z-10 font-mono text-[#FFD93D] font-bold">
                        {voteCount} {voteCount === 1 ? 'vote' : 'votes'}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 pt-6 border-t-2 border-white/10 font-sans">
                <CartoonButton
                  variant="green"
                  fullWidth
                  onClick={() => startGame('most-likely')}>
                  Next Target 😈
                </CartoonButton>
              </div>
            </StickerCard>
          </div>
        )}
      </div>
    </GameShell>
  );
}
