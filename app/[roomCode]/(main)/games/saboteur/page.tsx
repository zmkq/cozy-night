'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams as useNextParams } from 'next/navigation';
import { StickerCard } from '@/components/christmas/StickerCard';
import { CartoonButton } from '@/components/christmas/CartoonButton';
import { GameShell } from '@/components/christmas/GameShell';
import { CountdownOverlay } from '@/components/games/CountdownOverlay';
import { WaitingOverlay } from '@/components/games/WaitingOverlay';
import { useGameTransitions } from '@/components/games/TransitionProvider';
import { usePartyContext } from '@/hooks/PartyProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Send, ThumbsUp, Crown, Sparkles, HelpCircle, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';

export default function SaboteurGame() {
  const params = useNextParams();
  const roomCode = (params?.roomCode as string) || '';
  const [answer, setAnswer] = useState('');
  const [showRole, setShowRole] = useState(true);
  const [hasGuessed, setHasGuessed] = useState(false);
  const [selectedGuess, setSelectedGuess] = useState('');
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

  const roundData = state.roundData as any;

  const {
    triggerVoting,
    triggerCaught,
    triggerEscaped,
    triggerFinalRound,
    isPlaying: isTransitionPlaying,
  } = useGameTransitions();

  const isLobby = state.phase === 'lobby' || state.currentGame !== 'saboteur';
  const isCountdown = state.phase === 'countdown';
  const isPlaying = state.phase === 'playing';
  const isVoting = state.phase === 'voting';
  const isResults = state.phase === 'results';
  const isSaboteur = myRole === 'saboteur';
  const allReady = players.length >= 2 && players.every((p) => p.ready);

  // Extract Chameleon Data from roleData
  const category = (roleData as any)?.category || 'General';
  const grid = (roleData as any)?.grid || [];
  const coords = (roleData as any)?.coords || '??';

  // Get index of the target word if innocent
  let targetWord = '';
  if (roleData && !isSaboteur && grid.length > 0 && coords !== '??') {
    const coordParts = coords.match(/\d+/g);
    if (coordParts && coordParts.length === 2) {
      const row = parseInt(coordParts[0]) - 1;
      const col = parseInt(coordParts[1]) - 1;
      const idx = row * 4 + col;
      targetWord = grid[idx] || '';
    }
  }

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

  // Trigger results transition
  useEffect(() => {
    if (
      isResults &&
      !hasTriggeredResults.current &&
      roundData?.saboteurId
    ) {
      hasTriggeredResults.current = true;

      const votes = Object.values(state.votes || {});
      const saboteurVotes = votes.filter(
        (v) => v === roundData?.saboteurId
      ).length;
      const wasCaught = saboteurVotes > votes.length / 2;

      const saboteurName =
        players.find((p) => p.id === roundData?.saboteurId)?.name ||
        'Unknown';

      if (wasCaught) {
        triggerCaught(saboteurName);
      } else {
        triggerEscaped(saboteurName);
      }

      // Persist score
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
    roundData?.saboteurId,
    state.votes,
    players,
    triggerCaught,
    triggerEscaped,
    myPlayer?.score,
    roomCode,
    myPlayer?.name,
  ]);

  // Reset state on round change
  useEffect(() => {
    setAnswer('');
    setHasGuessed(false);
    setSelectedGuess('');
  }, [state.round]);

  // Escape Guess Handler
  const handleSaboteurGuess = (word: string) => {
    if (hasGuessed) return;
    setSelectedGuess(word);
    setHasGuessed(true);
    // Send guess to the server via the generic submitAnswer payload option
    submitAnswer({ type: 'saboteur-guess', word });
    
    // Play sound/visuals locally
    const correctWord = roundData?.targetWord || '';
    if (word.toLowerCase().trim() === correctWord.toLowerCase().trim()) {
      confetti({
        particleCount: 80,
        spread: 80,
        colors: ['#FFD700', '#FF4D6A', '#2ECC71'],
      });
    }
  };

  // Accused check
  const votes = Object.values(state.votes || {});
  const saboteurVotes = votes.filter((v) => v === roundData?.saboteurId).length;
  const wasSaboteurCaught = saboteurVotes > votes.length / 2;

  return (
    <GameShell title="Saboteur 🕵️" gameId="saboteur" score={myPlayer?.score}>
      <CountdownOverlay count={countdown} show={isCountdown && countdown > 0} />

      {isPlaying && hasSubmitted && waitingFor.length > 0 && (
        <WaitingOverlay
          waitingFor={waitingFor}
          message="Waiting for players to submit clues..."
        />
      )}

      {/* Round HUD */}
      <div className="text-center mb-4 font-sans flex justify-between items-center px-4 max-w-md mx-auto">
        <p className="text-white/40 text-xs font-bold uppercase tracking-wider bg-white/5 border border-white/10 px-3 py-1 rounded-full">
          Round {state.round} / {state.maxRounds}
        </p>
        <p className="text-[#FFD93D] text-xs font-black uppercase tracking-wider bg-[#FFD93D]/10 border border-[#FFD93D]/20 px-3 py-1 rounded-full">
          Category: {category}
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
                <div className="absolute inset-0 bg-linear-to-br from-red-500/10 via-transparent to-rose-500/10 pointer-events-none" />
                <h2 className="text-4xl font-black text-white uppercase tracking-tighter italic leading-none">
                  THE CHAMELEON <span className="text-red-500 block text-2xl mt-1">SABOTEUR</span>
                </h2>
                <p className="text-white/60 font-bold leading-relaxed max-w-sm mx-auto uppercase tracking-wide text-xs">
                  Everyone knows the target word coordinate on the grid except the Saboteur. Blend in, write a single-word clue, and catch the imposter!
                </p>
              </StickerCard>
            </motion.div>

            {/* Squad List */}
            <StickerCard className="p-4" accentColor="gold" hover={false}>
              <div className="text-xs text-white/40 mb-3 uppercase tracking-wider font-bold">
                Squad Room ({players.length})
              </div>
              <div className="flex flex-wrap gap-2">
                {players.map((p) => (
                  <div
                    key={p.id}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all',
                      p.ready
                        ? 'bg-emerald-500/20 border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                        : 'bg-white/5 border-white/10'
                    )}>
                    <div className="w-8 h-8 rounded-full border border-white/20 overflow-hidden bg-white/10 flex items-center justify-center shrink-0">
                      {p.avatar && p.avatar.startsWith('http') ? (
                        <img src={p.avatar} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm">{p.avatar || '👤'}</span>
                      )}
                    </div>
                    <span className="text-white font-bold text-sm">{p.name}</span>
                    {p.ready && <ThumbsUp size={14} className="text-[#2ECC71]" />}
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
                  🚀 Launch Mission
                </CartoonButton>
              )}
            </div>
          </motion.div>
        )}

        {/* PLAYING - Answer Clue */}
        {isPlaying && !hasSubmitted && (
          <motion.div
            key="playing"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6 max-w-2xl mx-auto">
            
            {/* Secret Identity Card */}
            <StickerCard
              className="p-6 text-center relative overflow-hidden transition-all duration-500"
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
                    <div className="text-6xl mb-3">
                      {isSaboteur ? '🕵️‍♂️' : '😇'}
                    </div>
                    <h3 className={cn(
                      'text-3xl font-black mb-1 uppercase tracking-tighter italic leading-none',
                      isSaboteur ? 'text-red-500' : 'text-emerald-400'
                    )}>
                      {isSaboteur ? 'SABOTEUR' : 'INNOCENT'}
                    </h3>
                    <p className="text-white/60 text-xs font-bold max-w-sm">
                      {isSaboteur 
                        ? "You don't know the word. Coordinate: ?? Guess it from the grid!"
                        : `Your Coordinate: ${coords} (${targetWord})`}
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="role-hidden"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="py-6 flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/20">
                      <EyeOff size={24} />
                    </div>
                    <p className="text-white/20 font-black uppercase tracking-widest text-xs">
                      Role Hidden
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                onClick={() => setShowRole(!showRole)}
                className="absolute top-4 left-4 w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all z-20">
                {showRole ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </StickerCard>

            {/* Word Grid */}
            <div className="grid grid-cols-4 gap-2 md:gap-4 my-2">
              {grid.map((word: string, index: number) => {
                const row = Math.floor(index / 4) + 1;
                const col = (index % 4) + 1;
                const isTarget = !isSaboteur && coords === `Row ${row}, Col ${col}`;
                return (
                  <motion.div
                    key={word}
                    whileHover={{ scale: 1.03 }}
                    className={cn(
                      "aspect-square flex flex-col items-center justify-center p-1.5 md:p-3 rounded-2xl border-4 text-center font-black transition-all shadow-md select-none relative overflow-hidden",
                      isTarget 
                        ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.3)] animate-pulse" 
                        : "bg-black/40 border-white/10 text-white/80"
                    )}
                  >
                    <span className="text-[9px] text-white/20 absolute top-1.5 left-2">
                      R{row} C{col}
                    </span>
                    <span className="text-xs md:text-sm break-words leading-tight mt-1 px-1 font-mono tracking-tight">{word}</span>
                    {isTarget && (
                      <span className="text-[8px] font-black uppercase bg-[#2ECC71] text-black px-1.5 py-0.5 rounded-md absolute bottom-1.5 tracking-wider">
                        TARGET
                      </span>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Answer Input */}
            <div className="space-y-4 relative font-sans">
              <input
                type="text"
                value={answer}
                onChange={(e) => setAnswer(e.target.value.replace(/\s+/g, ''))} // No spaces
                maxLength={15}
                placeholder="Enter ONE descriptive word..."
                className="w-full h-16 bg-black/40 backdrop-blur-3xl border-4 border-white/10 focus:border-green-500 focus:ring-4 focus:ring-green-500/20 rounded-2xl text-center text-xl font-black text-white placeholder:text-white/20 outline-none px-6 transition-all"
              />
              <CartoonButton
                variant="green"
                size="lg"
                fullWidth
                className="h-14 text-lg"
                onClick={() => {
                  submitAnswer(answer);
                  setAnswer('');
                }}
                disabled={!answer.trim()}>
                <Send size={18} className="mr-2" /> Send Single-Word Clue
              </CartoonButton>
            </div>
          </motion.div>
        )}

        {/* VOTING - Accuse */}
        {isVoting && !hasVoted && (
          <motion.div
            key="voting"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 max-w-4xl mx-auto">
            <div className="text-center">
              <h2 className="text-3xl font-black text-white mb-1 uppercase tracking-tight">
                WHO IS THE CHAMELEON? 🕵️‍♂️
              </h2>
              <p className="text-white/60 text-xs font-bold uppercase tracking-widest bg-white/5 border border-white/10 px-3 py-1 rounded-full inline-block">
                Analyze the clues and find who has NO idea what the word is!
              </p>
            </div>

            {/* Word Grid Reference */}
            <StickerCard className="p-4" accentColor="gold" hover={false}>
              <div className="text-center text-xs text-white/40 font-bold uppercase tracking-widest mb-3">
                Reference Word Grid ({category})
              </div>
              <div className="grid grid-cols-4 gap-2">
                {grid.map((word: string, index: number) => {
                  const row = Math.floor(index / 4) + 1;
                  const col = (index % 4) + 1;
                  const isTarget = !isSaboteur && coords === `Row ${row}, Col ${col}`;
                  return (
                    <div
                      key={word}
                      className={cn(
                        "p-2 rounded-xl text-center text-[10px] font-black border",
                        isTarget 
                          ? "bg-emerald-500/20 border-emerald-500 text-emerald-400 font-bold shadow-[0_0_10px_rgba(16,185,129,0.2)]" 
                          : "bg-black/20 border-white/5 text-white/50"
                      )}
                    >
                      {word}
                    </div>
                  );
                })}
              </div>
            </StickerCard>

            {/* Answers & Accusations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {players.map((p) => (
                <motion.div
                  key={p.id}
                  whileHover={p.id !== myPlayer?.id ? { scale: 1.02 } : {}}
                  whileTap={p.id !== myPlayer?.id ? { scale: 0.98 } : {}}>
                  <StickerCard
                    className={cn(
                      'p-4 flex items-center gap-4 relative overflow-hidden group transition-all',
                      p.id === myPlayer?.id
                        ? 'opacity-40 grayscale'
                        : 'cursor-pointer hover:border-red-500/50'
                    )}
                    accentColor="red"
                    onClick={() => p.id !== myPlayer?.id && vote(p.id)}
                    hover={p.id !== myPlayer?.id}>
                    <div className="w-12 h-12 rounded-xl border border-white/10 overflow-hidden bg-black/20 flex items-center justify-center shrink-0">
                      {p.avatar && p.avatar.startsWith('http') ? (
                        <img src={p.avatar} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl">{p.avatar || '👤'}</span>
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-black text-white text-md leading-none">{p.name}</p>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className="text-[10px] text-white/30 uppercase font-bold">Clue:</span>
                        <span className="text-[#FFD93D] text-lg font-black italic tracking-wide">
                          "{state.submissions[p.id] as string || 'Waiting...'}"
                        </span>
                      </div>
                    </div>
                    {p.id !== myPlayer?.id && (
                      <div className="bg-red-500 text-white text-[10px] font-black px-3 py-1.5 rounded-lg border-2 border-white/10 shadow-xl opacity-0 group-hover:opacity-100 transition-all uppercase tracking-wider">
                        Accuse!
                      </div>
                    )}
                  </StickerCard>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* RESULTS */}
        {isResults && (
          <motion.div
            key="results"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6 text-center max-w-2xl mx-auto">
            
            {/* Identity Unmasked */}
            <StickerCard className="p-8 relative overflow-hidden" accentColor="red" hover={false}>
              <div className="absolute inset-0 bg-linear-to-b from-red-500/10 to-transparent pointer-events-none" />
              <div className="text-6xl mb-3">🕵️‍♂️</div>
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-4">
                The Chameleon Saboteur was...
              </h2>
              <div className="flex flex-col items-center justify-center gap-3">
                <div className="w-20 h-20 rounded-full border-4 border-[#FF4D6A] overflow-hidden shadow-[0_0_20px_rgba(255,77,106,0.3)] bg-white/10 flex items-center justify-center">
                  {(() => {
                    const saboteur = players.find(
                      (p) => p.id === roundData?.saboteurId
                    );
                    if (!saboteur) return null;
                    return saboteur.avatar && saboteur.avatar.startsWith('http') ? (
                      <img src={saboteur.avatar} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl">{saboteur.avatar || '👤'}</span>
                    );
                  })()}
                </div>
                <span className="text-2xl font-black text-[#FF4D6A] tracking-wide">
                  {players.find((p) => p.id === roundData?.saboteurId)?.name || 'Unknown'}!
                </span>
                <div className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs font-bold text-white/60">
                  Secret Word: <span className="text-emerald-400 font-black font-mono">{roundData?.targetWord}</span>
                </div>
              </div>
            </StickerCard>

            {/* Server Announcement Banner */}
            {roundData?.eventMessage && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-black/60 border-2 border-[#FFD93D]/30 p-4 rounded-2xl shadow-xl flex items-center justify-center gap-3 text-[#FFD93D] font-black text-sm uppercase tracking-wide font-sans">
                <Sparkles size={20} />
                <span>{roundData.eventMessage}</span>
              </motion.div>
            )}

            {/* SABOTEUR GUESS TO ESCAPE INTERFACE */}
            {roundData?.saboteurId === myPlayer?.id && wasSaboteurCaught && !hasGuessed && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bg-linear-to-b from-red-950/40 to-black/60 border-4 border-red-500/30 p-6 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                <div className="flex items-center justify-center gap-2 text-red-500 font-black uppercase text-xs mb-3 tracking-widest">
                  <ShieldAlert size={16} />
                  <span>Caught Red Handed!</span>
                </div>
                <h3 className="text-xl font-black text-white mb-1 uppercase tracking-tight">
                  CLUTCH ESCAPE ATTEMPT! 🏃‍♂️💨
                </h3>
                <p className="text-white/60 text-xs font-bold leading-normal mb-5 max-w-md mx-auto">
                  You were unmasked, but you can steal the win! Look at the clues and select the correct secret word from the grid:
                </p>

                <div className="grid grid-cols-4 gap-2">
                  {grid.map((word: string) => (
                    <button
                      key={word}
                      onClick={() => handleSaboteurGuess(word)}
                      className="p-2 rounded-xl bg-white/5 border border-white/10 hover:border-red-500/50 hover:bg-red-500/10 text-white text-[11px] font-black uppercase tracking-tight transition-all">
                      {word}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Other players waiting for escape */}
            {roundData?.saboteurId !== myPlayer?.id && wasSaboteurCaught && !roundData?.eventMessage && (
              <div className="p-6 rounded-[2rem] bg-black/30 border border-white/5 flex items-center justify-center gap-3 text-white/40 text-xs font-black uppercase tracking-widest">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                <span>The Saboteur is attempting a escape guess...</span>
              </div>
            )}

            {/* Scoreboard */}
            <StickerCard className="p-5" accentColor="gold" hover={false}>
              <p className="text-xs text-white/40 uppercase tracking-wider mb-4 font-bold">
                Standings
              </p>
              <div className="space-y-3">
                {[...players]
                  .sort((a, b) => b.score - a.score)
                  .map((p, i) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-3 bg-white/5 p-2.5 rounded-xl border border-white/5">
                      {i === 0 ? (
                        <Crown size={18} className="text-[#FFD93D]" />
                      ) : (
                        <span className="w-5 text-center text-white/30 font-black font-mono text-sm">{i + 1}</span>
                      )}
                      <div className="w-9 h-9 rounded-full border border-white/20 overflow-hidden bg-white/5 flex items-center justify-center shrink-0">
                        {p.avatar && p.avatar.startsWith('http') ? (
                          <img src={p.avatar} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-lg">{p.avatar || '👤'}</span>
                        )}
                      </div>
                      <span className="flex-1 text-white font-bold text-left text-sm">
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
              {state.round >= state.maxRounds ? 'Final Standings 🏁' : 'Next Round →'}
            </CartoonButton>
          </motion.div>
        )}
      </AnimatePresence>
    </GameShell>
  );
}
