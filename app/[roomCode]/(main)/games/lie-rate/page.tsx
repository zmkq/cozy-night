'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { StickerCard } from '@/components/christmas/StickerCard';
import { CartoonButton } from '@/components/christmas/CartoonButton';
import { GameShell } from '@/components/christmas/GameShell';
import { CountdownOverlay } from '@/components/games/CountdownOverlay';
import { useGameTransitions } from '@/components/games/TransitionProvider';
import { usePartyContext } from '@/hooks/PartyProvider';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ThumbsUp,
  ThumbsDown,
  Eye,
  Users,
  Crown,
  Sparkles,
  Heart,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';

export default function LieRateGame() {
  const params = useParams();
  const roomCode = params?.roomCode as string || '';
  const [hasAnswered, setHasAnswered] = useState(false);
  const [guesses, setGuesses] = useState<Record<string, 'yes' | 'no'>>({});
  const hasTriggeredGuessing = useRef(false);
  const hasTriggeredResults = useRef(false);

  const {
    connected,
    state,
    players,
    myPlayer,
    countdown,
    setReady,
    startGame,
    submitAnswer,
    nextRound,
    leaveGame,
  } = usePartyContext();

  const {
    triggerRoundStart,
    triggerResults,
    triggerEpicWin,
    triggerCloseCall,
  } = useGameTransitions();

  const roundData = state.roundData as any;
  const isLobby = state.phase === 'lobby' || state.currentGame !== 'lie-rate';
  const isCountdown = state.phase === 'countdown';
  const isPlaying = state.phase === 'playing';
  const isGuessing = state.phase === 'guessing';
  const isResults = state.phase === 'results';
  const allReady = players.length >= 2 && players.every((p) => p.ready);

  const prompt = roundData?.lieRatePrompt || '';
  const yesCount = roundData?.yesCount || 0;
  const noCount = roundData?.noCount || 0;
  const answers = roundData?.answers || {};
  const allGuesses = roundData?.guesses || {};

  // Trigger guessing phase transition
  useEffect(() => {
    if (isGuessing && !hasTriggeredGuessing.current) {
      hasTriggeredGuessing.current = true;
      if (Math.abs(yesCount - noCount) <= 1 && yesCount + noCount > 2) {
        triggerCloseCall();
      }
    }
    if (!isGuessing) {
      hasTriggeredGuessing.current = false;
    }
  }, [isGuessing, yesCount, noCount, triggerCloseCall]);

  // Trigger results transition
  useEffect(() => {
    if (isResults && !hasTriggeredResults.current && roundData?.timeline) {
      hasTriggeredResults.current = true;

      const myPerfectBluff = roundData.timeline?.find(
        (t: any) => t.type === 'perfect_bluff' && t.playerId === myPlayer?.id
      );

      if (myPerfectBluff) {
        triggerEpicWin(myPlayer?.name || 'You');
      } else {
        triggerResults();
      }

      if (myPlayer?.score && myPlayer.score > 0) {
        import('@/app/actions').then(({ updateLeaderboardAction }) => {
          updateLeaderboardAction(roomCode, 'lie-rate', myPlayer.score);
        });
      }
    }
    if (!isResults) {
      hasTriggeredResults.current = false;
    }
  }, [isResults, roundData?.timeline, myPlayer, triggerEpicWin, triggerResults, myPlayer?.score, roomCode]);

  // Reset inputs on round change
  useEffect(() => {
    setHasAnswered(false);
    setGuesses({});
  }, [state.round]);

  // Heartbeat haptics during confession reading
  useEffect(() => {
    if (isPlaying && !hasAnswered) {
      const interval = setInterval(() => {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([80, 120, 80]); // double pulse heartbeat
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isPlaying, hasAnswered]);

  // Celebration for bluffs
  useEffect(() => {
    if (
      isResults &&
      roundData?.timeline?.some(
        (t: any) => t.type === 'perfect_bluff' && t.playerId === myPlayer?.id
      )
    ) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });
    }
  }, [isResults, myPlayer, roundData?.timeline]);

  const handleAnswer = (answer: 'yes' | 'no') => {
    submitAnswer(answer);
    setHasAnswered(true);
  };

  const handleGuess = (targetId: string, guessedAnswer: 'yes' | 'no') => {
    setGuesses((prev) => ({ ...prev, [targetId]: guessedAnswer }));
    submitAnswer({ type: 'lie-rate-guess', targetId, guessedAnswer });
  };

  return (
    <GameShell title="Lie Rate 🎭" gameId="lie-rate" score={myPlayer?.score}>
      <CountdownOverlay count={countdown} show={isCountdown && countdown > 0} />

      {/* Round HUD */}
      <div className="text-center mb-4 font-sans">
        <p className="text-white/40 text-xs font-bold uppercase tracking-wider bg-white/5 border border-white/10 px-3 py-1 rounded-full inline-block">
          Round {state.round} / 8
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
            className="space-y-6 max-w-md mx-auto">
            <StickerCard className="p-8 text-center space-y-4 relative overflow-hidden" accentColor="purple">
              <div className="absolute inset-0 bg-linear-to-b from-purple-500/10 to-transparent pointer-events-none" />
              <div className="text-6xl animate-bounce">🎭</div>
              <h2 className="text-3xl font-black text-white uppercase italic leading-none">
                POLYGRAPH SHOWDOWN
              </h2>
              <p className="text-white/60 text-xs font-bold leading-normal uppercase tracking-wide">
                Answer secret questions, monitor heart rates, and bid points on whether your friends are stating verified facts or dirty fabrications!
              </p>
            </StickerCard>

            <StickerCard className="p-4" accentColor="white" hover={false}>
              <div className="text-xs text-white/40 mb-3 uppercase tracking-wider font-bold">
                Suspects ({players.length})
              </div>
              <div className="flex flex-wrap gap-2">
                {players.map((p) => (
                  <div
                    key={p.id}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all',
                      p.ready
                        ? 'bg-purple-500/20 border-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.2)]'
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
                    {p.ready && <Eye size={14} className="text-purple-400 animate-pulse" />}
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
                {myPlayer?.ready ? '✓ Strapped In' : 'Enter Polygraph'}
              </CartoonButton>

              {allReady && (
                <CartoonButton
                  variant="red"
                  size="lg"
                  fullWidth
                  onClick={() => startGame('lie-rate' as any)}>
                  🎭 Calibrate Sensors
                </CartoonButton>
              )}
            </div>
          </motion.div>
        )}

        {/* PLAYING - Secret Answer Form */}
        {isPlaying && !hasAnswered && (
          <motion.div
            key="answer-phase"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6 max-w-lg mx-auto font-sans">
            
            {/* Terminal Scanlines Prompt */}
            <StickerCard className="p-6 text-center relative overflow-hidden" accentColor="purple" hover={false}>
              <div className="absolute inset-0 bg-linear-to-b from-purple-500/10 to-transparent pointer-events-none" />
              <p className="text-[10px] text-purple-400 uppercase tracking-widest mb-3 font-black border border-purple-500/20 rounded-full px-3 py-1 inline-block">
                Interrogation Sheet
              </p>
              <h2 className="text-2xl font-black text-white leading-tight italic">
                "{prompt}"
              </h2>
            </StickerCard>

            {/* Glowing EKG Grid Pulse Animation */}
            <div className="relative h-20 bg-black/60 rounded-3xl border border-white/10 overflow-hidden flex items-center justify-center shadow-inner">
              <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(0,255,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,3px_100%] pointer-events-none" />
              
              <svg className="w-full h-full text-emerald-500 stroke-2" viewBox="0 0 400 100" fill="none">
                <motion.path
                  d="M0,50 L100,50 L110,40 L120,60 L130,10 L140,90 L150,50 L160,50 L170,40 L180,60 L190,10 L200,90 L210,50 L300,50 L310,30 L320,70 L330,50 L400,50"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  animate={{
                    strokeDasharray: ['20,400', '400,400'],
                    strokeDashoffset: [0, -400]
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: 'linear'
                  }}
                />
              </svg>

              <div className="absolute flex items-center gap-1.5 text-emerald-400 text-xs font-black uppercase tracking-wider">
                <Heart size={14} className="animate-pulse" />
                <span>Sensors Calibrated</span>
              </div>
            </div>

            {/* Interactive Switches (YES/NO) */}
            <div className="grid grid-cols-2 gap-4">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => handleAnswer('yes')}
                className="p-8 rounded-3xl bg-emerald-500/90 border-4 border-white/20 shadow-lg flex flex-col items-center gap-3 relative overflow-hidden group">
                <ThumbsUp className="w-12 h-12 text-white group-hover:rotate-12 transition-transform" />
                <span className="text-3xl font-black text-white uppercase tracking-tight italic">Yes</span>
                <span className="text-[10px] text-white/50 font-black uppercase tracking-wider">True Statement</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => handleAnswer('no')}
                className="p-8 rounded-3xl bg-red-600/95 border-4 border-white/20 shadow-lg flex flex-col items-center gap-3 relative overflow-hidden group">
                <ThumbsDown className="w-12 h-12 text-white group-hover:-rotate-12 transition-transform" />
                <span className="text-3xl font-black text-white uppercase tracking-tight italic">No</span>
                <span className="text-[10px] text-white/50 font-black uppercase tracking-wider">Fabrication</span>
              </motion.button>
            </div>

            <p className="text-white/40 text-center text-xs font-bold uppercase tracking-wider animate-pulse">
              Confession will be masked. State your case.
            </p>
          </motion.div>
        )}

        {/* PLAYING - Waiting confessions */}
        {isPlaying && hasAnswered && (
          <motion.div
            key="waiting-answers"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center space-y-6 py-8 max-w-md mx-auto">
            <div className="text-6xl animate-pulse">🤫</div>
            <h2 className="text-xl font-black text-white uppercase tracking-tight">Confession Encrypted!</h2>
            <p className="text-white/60 text-xs font-bold uppercase tracking-wider">Waiting for other suspects to file answers...</p>

            <div className="flex flex-wrap justify-center gap-2">
              {players.map((p) => (
                <div
                  key={p.id}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 border',
                    answers[p.id]
                      ? 'bg-emerald-500/20 text-[#2ECC71] border-emerald-500'
                      : 'bg-white/5 text-white/40 border-white/10'
                  )}>
                  <div className="w-5 h-5 rounded-full overflow-hidden bg-white/10 flex items-center justify-center shrink-0">
                    {p.avatar && p.avatar.startsWith('http') ? (
                      <img src={p.avatar} className="w-full h-full object-cover" />
                    ) : (
                      <span>{p.avatar || '👤'}</span>
                    )}
                  </div>
                  {answers[p.id] ? '✓' : '...'}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* GUESSING - Polygraph analysts report */}
        {isGuessing && (
          <motion.div
            key="guessing-phase"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 max-w-xl mx-auto font-sans">
            
            {/* Global response meter */}
            <StickerCard className="p-6" accentColor="gold" hover={false}>
              <p className="text-xs text-white/40 uppercase tracking-wider mb-3 font-bold text-center">
                Squad Response Ratio
              </p>
              <div className="flex justify-center gap-8 items-center">
                <div className="text-center">
                  <div className="text-4xl font-black text-emerald-400">{yesCount}</div>
                  <div className="text-xs text-white/60 font-bold uppercase tracking-wider mt-1">Confirmed YES</div>
                </div>
                <div className="text-3xl text-white/10 font-mono">VS</div>
                <div className="text-center">
                  <div className="text-4xl font-black text-red-500">{noCount}</div>
                  <div className="text-xs text-white/60 font-bold uppercase tracking-wider mt-1">Confirmed NO</div>
                </div>
              </div>
            </StickerCard>

            {/* Prompt Reminder */}
            <p className="text-center text-white/60 text-xs italic font-bold">
              "{prompt}"
            </p>

            {/* Suspect Toggles */}
            <div className="space-y-3">
              <p className="text-white/40 text-[10px] uppercase tracking-widest text-center font-black">
                <Users size={12} className="inline mr-1" /> ANALYZE STATEMENTS
              </p>

              {players
                .filter((p) => p.id !== myPlayer?.id)
                .map((p) => (
                  <StickerCard
                    key={p.id}
                    className="p-3.5 relative overflow-hidden"
                    accentColor="white"
                    hover={false}>
                    <div className="flex items-center gap-4 relative z-10">
                      <div className="w-12 h-12 rounded-full border-2 border-white/20 overflow-hidden bg-white/10 shrink-0">
                        {p.avatar && p.avatar.startsWith('http') ? (
                          <img src={p.avatar} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xl">{p.avatar || '👤'}</span>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <p className="font-black text-white uppercase text-sm tracking-tight">{p.name}</p>
                        {guesses[p.id] ? (
                          <p className="text-[10px] text-white/40 font-bold mt-0.5">
                            YOUR ANALYSIS:{' '}
                            <span className={guesses[p.id] === 'yes' ? 'text-emerald-400' : 'text-red-500'}>
                              {guesses[p.id] === 'yes' ? 'TRUTH' : 'LIE'}
                            </span>
                          </p>
                        ) : (
                          <p className="text-[9px] text-[#2ECC71] font-bold mt-0.5 flex items-center gap-1 animate-pulse">
                            <TrendingUp size={10} />
                            <span>Awaiting telemetry...</span>
                          </p>
                        )}
                      </div>

                      {!guesses[p.id] && (
                        <div className="flex gap-2">
                          <CartoonButton
                            variant="green"
                            size="sm"
                            onClick={() => handleGuess(p.id, 'yes')}>
                            TRUTH
                          </CartoonButton>
                          <CartoonButton
                            variant="red"
                            size="sm"
                            onClick={() => handleGuess(p.id, 'no')}>
                            LIE
                          </CartoonButton>
                        </div>
                      )}
                    </div>
                  </StickerCard>
                ))}
            </div>
          </motion.div>
        )}

        {/* RESULTS - Polygraph stamps */}
        {isResults && (
          <motion.div
            key="results"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6 max-w-xl mx-auto font-sans">
            
            {/* The Truth reveals */}
            <StickerCard className="p-4" accentColor="purple" hover={false}>
              <p className="text-xs text-white/40 uppercase tracking-widest mb-3 font-bold text-center">
                🔓 SENSOR DECLASSIFICATION
              </p>
              <p className="text-white text-xs mb-4 italic font-bold text-center">
                "{prompt}"
              </p>
              
              <div className="grid grid-cols-2 gap-3">
                {players.map((p, i) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-2xl border-4 relative overflow-hidden',
                      answers[p.id] === 'yes'
                        ? 'bg-emerald-500/10 border-emerald-500/50'
                        : 'bg-red-500/10 border-red-500/50'
                    )}>
                    <div className="w-9 h-9 rounded-full border border-white/20 overflow-hidden bg-white/5 flex items-center justify-center shrink-0">
                      {p.avatar && p.avatar.startsWith('http') ? (
                        <img src={p.avatar} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm">{p.avatar || '👤'}</span>
                      )}
                    </div>
                    <div className="flex-1 overflow-hidden text-left">
                      <p className="text-white font-black text-sm leading-none truncate uppercase tracking-tight">{p.name}</p>
                      <span className={cn(
                        'text-[9px] font-black uppercase mt-1 inline-block px-1.5 py-0.5 rounded-md leading-none border',
                        answers[p.id] === 'yes' ? 'bg-[#2ECC71] text-black border-emerald-500' : 'bg-red-500 text-white border-red-400'
                      )}>
                        {answers[p.id] === 'yes' ? 'FACT' : 'FABRICATION'}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </StickerCard>

            {/* Perfect Bluffers (Undetected) */}
            {roundData?.timeline?.filter((t: any) => t.type === 'perfect_bluff').length > 0 && (
              <StickerCard className="p-4" accentColor="gold" hover={false}>
                <p className="text-xs text-[#FFD93D] uppercase tracking-wider mb-3 font-bold text-center flex items-center justify-center gap-1">
                  <Sparkles size={14} />
                  <span>MASTER DECEIVERS (UNDETECTED)</span>
                </p>
                <div className="flex gap-2 justify-center flex-wrap">
                  {roundData.timeline
                    .filter((t: any) => t.type === 'perfect_bluff')
                    .map((t: any) => {
                      const p = players.find((pl) => pl.id === t.playerId);
                      return (
                        <div
                          key={t.id}
                          className="flex items-center gap-2 bg-[#FFD93D]/20 text-[#FFD93D] px-3.5 py-1.5 rounded-full border border-[#FFD93D]/30">
                          <div className="w-6 h-6 rounded-full overflow-hidden bg-white/10 shrink-0">
                            {p?.avatar && p.avatar.startsWith('http') ? (
                              <img src={p.avatar} className="w-full h-full object-cover" />
                            ) : (
                              <span>{p?.avatar || '👤'}</span>
                            )}
                          </div>
                          <span className="font-black text-xs uppercase tracking-tight">{p?.name}</span>
                          <span className="text-xs font-black">+3</span>
                        </div>
                      );
                    })}
                </div>
              </StickerCard>
            )}

            {/* Scoreboard */}
            <StickerCard className="p-4" accentColor="white" hover={false}>
              <p className="text-xs text-white/40 uppercase tracking-widest mb-3 font-bold text-center">
                Standings
              </p>
              <div className="space-y-2">
                {[...players]
                  .sort((a, b) => b.score - a.score)
                  .map((p, i) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-3 bg-white/5 p-2 rounded-xl border border-white/5">
                      {i === 0 ? (
                        <Crown size={16} className="text-[#FFD93D]" />
                      ) : (
                        <span className="w-4 text-center text-white/20 font-bold text-sm">{i + 1}</span>
                      )}
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-white/10 shrink-0">
                        {p.avatar && p.avatar.startsWith('http') ? (
                          <img src={p.avatar} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-sm">{p.avatar || '👤'}</span>
                        )}
                      </div>
                      <span className="flex-1 text-white font-bold text-left text-sm">{p.name}</span>
                      <span className="text-[#FFD93D] font-black font-mono">{p.score}</span>
                    </div>
                  ))}
              </div>
            </StickerCard>

            <CartoonButton
              variant="green"
              size="lg"
              fullWidth
              onClick={nextRound}>
              {state.round >= 8 ? '🎭 Final Standings 🏁' : 'Next Question →'}
            </CartoonButton>
          </motion.div>
        )}
      </AnimatePresence>
    </GameShell>
  );
}
