'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { StickerCard } from '@/components/christmas/StickerCard';
import { CartoonButton } from '@/components/christmas/CartoonButton';
import { GameShell } from '@/components/christmas/GameShell';
import { CountdownOverlay } from '@/components/games/CountdownOverlay';
import { WaitingOverlay } from '@/components/games/WaitingOverlay';
import { useGameTransitions } from '@/components/games/TransitionProvider';
import { usePartyContext } from '@/hooks/PartyProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Send, ThumbsUp, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function SaboteurGame() {
  const params = useParams();
  const roomCode = params?.roomCode as string || '';
  const [answer, setAnswer] = useState('');
  const [showRole, setShowRole] = useState(true);
  const hasTriggeredVoting = useRef(false);
  const hasTriggeredResults = useRef(false);

  const {
    connected,
    state,
    players,
    myPlayer,
    myRole,
    roleData,
    countdown,
    hasSubmitted,
    hasVoted,
    waitingFor,
    setReady,
    startGame,
    submitAnswer,
    vote,
    nextRound,
    leaveGame,
  } = usePartyContext();

  const {
    triggerVoting,
    triggerCaught,
    triggerEscaped,
    triggerFinalRound,
    isPlaying: isTransitionPlaying,
  } = useGameTransitions();

  const prompt = (roleData as any)?.prompt || '';
  const isLobby = state.phase === 'lobby' || state.currentGame !== 'saboteur';
  const isCountdown = state.phase === 'countdown';
  const isPlaying = state.phase === 'playing';
  const isVoting = state.phase === 'voting';
  const isResults = state.phase === 'results';
  const isSaboteur = myRole === 'saboteur';
  const allReady = players.length >= 2 && players.every((p) => p.ready);

  // Trigger voting transition
  useEffect(() => {
    if (isVoting && !hasTriggeredVoting.current) {
      hasTriggeredVoting.current = true;
      triggerVoting();
    }
    if (!isVoting) {
      hasTriggeredVoting.current = false;
    }
  }, [isVoting, triggerVoting]);

  // Trigger results transition with caught/escaped
  useEffect(() => {
    if (
      isResults &&
      !hasTriggeredResults.current &&
      state.roundData?.saboteurId
    ) {
      hasTriggeredResults.current = true;

      // Check if saboteur was caught (majority voted for them)
      const votes = Object.values(state.votes || {});
      const saboteurVotes = votes.filter(
        (v) => v === state.roundData?.saboteurId
      ).length;
      const wasCaught = saboteurVotes > votes.length / 2;

      const saboteurName =
        players.find((p) => p.id === state.roundData?.saboteurId)?.name ||
        'Unknown';

      if (wasCaught) {
        triggerCaught(saboteurName);
      } else {
        triggerEscaped(saboteurName);
      }

      // Persist score to permanent leaderboard!
      if (myPlayer?.score && myPlayer.score > 0) {
        import('@/app/actions').then(({ updateLeaderboardAction }) => {
          updateLeaderboardAction(roomCode, 'saboteur', myPlayer.score);
        });
      }
    }
    if (!isResults) {
      hasTriggeredResults.current = false;
    }
  }, [
    isResults,
    state.roundData?.saboteurId,
    state.votes,
    players,
    triggerCaught,
    triggerEscaped,
    myPlayer?.score,
  ]);

  return (
    <GameShell title="Saboteur 🕵️" gameId="saboteur" score={myPlayer?.score}>
      <CountdownOverlay count={countdown} show={isCountdown && countdown > 0} />

      {isPlaying && hasSubmitted && waitingFor.length > 0 && (
        <WaitingOverlay
          waitingFor={waitingFor}
          message="Waiting for players to submit answers..."
        />
      )}

      {/* Round Info */}
      <div className="text-center mb-4 font-sans">
        <p className="text-white/40 text-xs font-bold uppercase tracking-wider bg-white/5 border border-white/10 px-3 py-1 rounded-full inline-block">
          Round {state.round} / {state.maxRounds}
        </p>
      </div>

      <AnimatePresence mode="wait">
        {/* LOBBY */}
        {isLobby && (
          <motion.div
            key="lobby"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 15 }}>
              <StickerCard
                className="p-8 text-center space-y-4 group relative overflow-hidden"
                accentColor="red">
                <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">
                  One Saboteur. <span className="text-red-500">Many Suspects.</span>
                </h2>
                <p className="text-white/40 font-bold leading-relaxed max-w-sm mx-auto uppercase tracking-wide text-xs">
                  Each round, one player gets a secret prompt and must sabotage. Expose them before it is too late!
                </p>
              </StickerCard>
            </motion.div>

            {/* Players Ready */}
            <StickerCard className="p-4" accentColor="gold" hover={false}>
              <div className="text-xs text-white/40 mb-3 uppercase tracking-wider font-bold">
                Squad ({players.length})
              </div>
              <div className="flex flex-wrap gap-2">
                {players.map((p) => (
                  <div
                    key={p.id}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-xl border-2',
                      p.ready
                        ? 'bg-[#2ECC71]/20 border-[#2ECC71]'
                        : 'bg-white/5 border-white/10'
                    )}>
                    <div className="w-8 h-8 rounded-full border border-white/20 overflow-hidden bg-white/10 flex items-center justify-center shrink-0">
                      {p.avatar && p.avatar.startsWith('http') ? (
                        <img
                          src={p.avatar}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-sm">{p.avatar || '👤'}</span>
                      )}
                    </div>
                    <span className="text-white font-bold text-sm">
                      {p.name}
                    </span>
                    {p.ready && (
                      <ThumbsUp size={14} className="text-[#2ECC71]" />
                    )}
                  </div>
                ))}
              </div>
            </StickerCard>

            <div className="space-y-3 font-sans">
              <CartoonButton
                variant={myPlayer?.ready ? 'green' : 'gold'}
                size="lg"
                fullWidth
                onClick={() => setReady(!myPlayer?.ready)}>
                {myPlayer?.ready ? '✓ Ready!' : 'Ready Up'}
              </CartoonButton>

              {allReady && (
                <CartoonButton
                  variant="red"
                  size="lg"
                  fullWidth
                  onClick={() => startGame('saboteur')}>
                  🚀 Expose Them!
                </CartoonButton>
              )}
            </div>
          </motion.div>
        )}

        {/* PLAYING - Role & Answer */}
        {isPlaying && !hasSubmitted && (
          <motion.div
            key="playing"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6">
            {/* Role Card */}
            <motion.div layout className="relative">
              <StickerCard
                className={cn(
                  'p-8 text-center relative overflow-hidden group transition-all duration-500'
                )}
                accentColor={isSaboteur ? 'red' : 'green'}
                hover={false}>
                <AnimatePresence mode="wait">
                  {showRole ? (
                    <motion.div
                      key="role-reveal"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="relative z-10 flex flex-col items-center">
                      <div className="text-7xl mb-4 drop-shadow-2xl">
                        {isSaboteur ? '🕵️' : '😇'}
                      </div>
                      <h3
                        className={cn(
                          'text-3xl font-black mb-2 uppercase tracking-tighter italic',
                          isSaboteur ? 'text-red-500' : 'text-green-500'
                        )}>
                        {isSaboteur
                          ? 'You are the Saboteur! 😈'
                          : 'You are Innocent... for now 😇'}
                      </h3>
                      <p className="text-white/40 font-black uppercase tracking-[0.2em] text-[10px]">
                        {isSaboteur
                          ? 'Blend in with a slightly off answer. Do not get caught!'
                          : 'Answer truthfully. Watch out for the saboteur!'}
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="role-hidden"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="py-12 flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/20">
                        <EyeOff size={32} />
                      </div>
                      <p className="text-white/20 font-black uppercase tracking-widest text-xs">
                        Roles Protected
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  onClick={() => setShowRole(!showRole)}
                  className="absolute top-4 left-4 w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all z-20">
                  {showRole ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </StickerCard>
            </motion.div>

            {/* Prompt */}
            <StickerCard
              className="p-6 text-center"
              accentColor="gold"
              hover={false}>
              <p className="text-xs text-white/40 uppercase tracking-wider mb-2 font-bold">
                Question
              </p>
              <h2 className="text-2xl md:text-3xl font-black text-white">
                {prompt}
              </h2>
            </StickerCard>

            {/* Answer Input */}
            <div className="space-y-4 relative font-sans">
              <input
                type="text"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Type your answer here..."
                className="w-full h-20 bg-black/40 backdrop-blur-3xl border-4 border-white/10 focus:border-green-500 focus:ring-4 focus:ring-green-500/20 rounded-3xl text-center text-2xl font-black text-white placeholder:text-white/10 outline-none px-6 transition-all shadow-[inset_0_0_20px_rgba(255,255,255,0.02)]"
              />
              <CartoonButton
                variant="green"
                size="lg"
                fullWidth
                className="h-16 text-xl"
                onClick={() => {
                  submitAnswer(answer);
                  setAnswer('');
                }}
                disabled={!answer.trim()}>
                <Send size={20} className="mr-2" /> Submit Answer
              </CartoonButton>
            </div>
          </motion.div>
        )}

        {/* PLAYING - Waiting */}
        {isPlaying && hasSubmitted && (
          <motion.div
            key="waiting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center space-y-6 py-12">
            <div className="text-6xl animate-bounce">⏳</div>
            <h2 className="text-2xl font-black text-white">Answer Submitted!</h2>
            <p className="text-white/60 font-medium">
              Waiting for {waitingFor.length > 0 ? waitingFor.join(', ') : 'loading'}...
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {players.map((p) => (
                <div
                  key={p.id}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-full border',
                    state.submissions[p.id]
                      ? 'bg-[#2ECC71]/20 border-[#2ECC71] text-[#2ECC71]'
                      : 'bg-white/5 border-white/10 text-white/40'
                  )}>
                  <div className="w-5 h-5 rounded-full overflow-hidden flex items-center justify-center">
                    {p.avatar && p.avatar.startsWith('http') ? (
                      <img
                        src={p.avatar}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{p.avatar || '👤'}</span>
                    )}
                  </div>
                  <span className="text-sm font-bold">
                    {state.submissions[p.id] ? '✓' : '...'}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* VOTING */}
        {isVoting && !hasVoted && (
          <motion.div
            key="voting"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-black text-white mb-2">
                Who is the Saboteur? 🕵️
              </h2>
              <p className="text-white/60 font-bold">
                Analyze the answers and find the saboteur!
              </p>
            </div>

            {/* Show all answers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {players.map((p) => (
                <motion.div
                  key={p.id}
                  whileHover={
                    p.id !== myPlayer?.id ? { scale: 1.02, x: 5 } : {}
                  }
                  whileTap={p.id !== myPlayer?.id ? { scale: 0.98 } : {}}>
                  <StickerCard
                    className={cn(
                      'p-5 flex items-center gap-4 relative overflow-hidden group transition-all',
                      p.id === myPlayer?.id
                        ? 'opacity-50 grayscale'
                        : 'cursor-pointer hover:border-red-500/50'
                    )}
                    accentColor="red"
                    onClick={() => p.id !== myPlayer?.id && vote(p.id)}
                    hover={p.id !== myPlayer?.id}>
                    <div className="absolute inset-0 bg-linear-to-r from-red-500/0 via-red-500/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                    <div className="w-14 h-14 rounded-2xl border-2 border-white/10 overflow-hidden bg-black/20 flex items-center justify-center shrink-0 group-hover:border-red-500/20 transition-colors">
                      {p.avatar && p.avatar.startsWith('http') ? (
                        <img
                          src={p.avatar}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-3xl">{p.avatar || '👤'}</span>
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-black text-white text-lg">{p.name}</p>
                      <p className="text-white/60 text-sm font-medium mt-0.5 leading-tight italic">
                        "{state.submissions[p.id] as string}"
                      </p>
                    </div>
                    {p.id !== myPlayer?.id && (
                      <div className="bg-red-500 text-white text-[10px] font-black px-3 py-1.5 rounded-lg border-2 border-white/10 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-tighter">
                        Accuse!
                      </div>
                    )}
                  </StickerCard>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* VOTING - Waiting */}
        {isVoting && hasVoted && (
          <motion.div
            key="vote-waiting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center space-y-6 py-12">
            <div className="text-6xl animate-pulse">🗳️</div>
            <h2 className="text-2xl font-black text-white">Voted!</h2>
            <p className="text-white/60 font-bold">Waiting for the rest...</p>
          </motion.div>
        )}

        {/* RESULTS */}
        {isResults && (
          <motion.div
            key="results"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6 text-center">
            {/* Saboteur Reveal */}
            <StickerCard className="p-8" accentColor="red" hover={false}>
              <div className="text-6xl mb-4">
                {state.roundData?.saboteurId === myPlayer?.id ? '😱' : '🕵️'}
              </div>
              <h2 className="text-2xl font-black text-white mb-4">
                The Saboteur was...
              </h2>
              <div className="flex flex-col items-center justify-center gap-3">
                <div className="w-24 h-24 rounded-full border-4 border-[#FF4D6A] overflow-hidden shadow-[0_0_20px_rgba(255,77,106,0.3)]">
                  {(() => {
                    const saboteur = players.find(
                      (p) => p.id === state.roundData?.saboteurId
                    );
                    if (!saboteur) return null;
                    return saboteur.avatar && saboteur.avatar.startsWith('http') ? (
                      <img
                        src={saboteur.avatar}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl bg-white/10">
                        {saboteur.avatar || '👤'}
                      </div>
                    );
                  })()}
                </div>
                <span className="text-xl font-black text-[#FF4D6A]">
                  {
                    players.find((p) => p.id === state.roundData?.saboteurId)
                      ?.name
                  }!
                </span>
              </div>
            </StickerCard>

            {/* Scoreboard */}
            <StickerCard className="p-5" accentColor="gold" hover={false}>
              <p className="text-xs text-white/40 uppercase tracking-wider mb-4 font-bold">
                Scoreboard
              </p>
              <div className="space-y-3">
                {[...players]
                  .sort((a, b) => b.score - a.score)
                  .map((p, i) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-3 bg-white/5 p-2 rounded-xl border border-white/5">
                      {i === 0 && (
                        <Crown size={16} className="text-[#FFD93D]" />
                      )}
                      <div className="w-10 h-10 rounded-full border border-white/20 overflow-hidden bg-white/5 flex items-center justify-center shrink-0">
                        {p.avatar && p.avatar.startsWith('http') ? (
                          <img
                            src={p.avatar}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-lg">{p.avatar || '👤'}</span>
                        )}
                      </div>
                      <span className="flex-1 text-white font-bold text-left">
                        {p.name}
                      </span>
                      <span className="text-[#FFD93D] font-black font-mono text-xl">
                        {p.score}
                      </span>
                    </div>
                  ))}
              </div>
            </StickerCard>

            <CartoonButton
              variant="green"
              size="lg"
              fullWidth
              onClick={nextRound}
              className="font-sans">
              {state.round >= state.maxRounds
                ? 'Final Standings'
                : 'Next Round →'}
            </CartoonButton>
          </motion.div>
        )}
      </AnimatePresence>
    </GameShell>
  );
}
