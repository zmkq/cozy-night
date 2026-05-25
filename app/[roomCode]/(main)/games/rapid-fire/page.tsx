'use client';

import { useState, useEffect, useRef } from 'react';
import { GameShell } from '@/components/christmas/GameShell';
import { StickerCard } from '@/components/christmas/StickerCard';
import { CartoonButton } from '@/components/christmas/CartoonButton';
import { RAPID_FIRE_QUESTIONS, SCORING } from '@/lib/games/rapidFire';
import { useGameTransitions } from '@/components/games/TransitionProvider';
import { useToast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Zap, RotateCcw, Home, Timer, Trophy } from 'lucide-react';
import Link from 'next/link';
import { usePartyContext } from '@/hooks/PartyProvider';
import usePartySocket from 'partysocket/react';
import { useParams } from 'next/navigation';

export default function RapidFireGame() {
  const params = useParams();
  const roomCode = ((params?.roomCode as string) || 'night').toUpperCase();
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answerState, setAnswerState] = useState<'correct' | 'wrong' | null>(
    null
  );
  const [opponentProgress, setOpponentProgress] = useState<
    Record<string, number>
  >({});
  const [startTime, setStartTime] = useState<number>(0);
  const hasTriggeredRoundStart = useRef(false);
  const hasTriggeredResults = useRef(false);

  const {
    state,
    players,
    myPlayer,
    startGame,
    submitAnswer,
    nextRound,
    leaveGame,
    setReady,
  } = usePartyContext();

  const {
    triggerRoundStart,
    triggerEpicWin,
    triggerResults,
    triggerFinalRound,
  } = useGameTransitions();
  const { toast } = useToast();
  const currentQ = RAPID_FIRE_QUESTIONS[currentQIndex];

  // Real-time progress updates
  usePartySocket({
    room: roomCode,
    onMessage(event) {
      const msg = JSON.parse(event.data);
      if (msg.type === 'progress_update') {
        setOpponentProgress((prev) => ({
          ...prev,
          [msg.playerId]: msg.data.index || 0,
        }));
      }
    },
  });

  const isLobby = state.phase === 'lobby' || state.currentGame !== 'rapid-fire';
  const isPlaying = state.phase === 'playing';
  const isResults = state.phase === 'results';

  // Trigger round start transition
  useEffect(() => {
    if (isPlaying && !hasTriggeredRoundStart.current && state.round > 0) {
      hasTriggeredRoundStart.current = true;
      if (state.round === state.maxRounds) {
        triggerFinalRound(state.round, state.maxRounds);
      } else {
        triggerRoundStart(state.round, state.maxRounds);
      }
    }
    if (!isPlaying) {
      hasTriggeredRoundStart.current = false;
    }
  }, [
    isPlaying,
    state.round,
    state.maxRounds,
    triggerRoundStart,
    triggerFinalRound,
  ]);

  // Trigger results transition - epic win for finishing first
  useEffect(() => {
    if (isResults && !hasTriggeredResults.current) {
      hasTriggeredResults.current = true;

      // Persist score to permanent leaderboard!
      if (score > 0) {
        import('@/app/actions').then(({ updateLeaderboardAction }) => {
          updateLeaderboardAction(params?.roomCode as string, 'rapid-fire', score);
        });
      }

      // Check if we were the first to finish
      const submissions = Object.entries(state.submissions || {});
      const sortedByTime = submissions
        .filter(([_, data]: any) => data?.done)
        .sort((a: any, b: any) => (a[1]?.time || 0) - (b[1]?.time || 0));

      if (sortedByTime.length > 0 && sortedByTime[0][0] === myPlayer?.id) {
        triggerEpicWin(myPlayer?.name || 'You');
      } else {
        triggerResults();
      }
    }
    if (!isResults) {
      hasTriggeredResults.current = false;
    }
  }, [
    isResults,
    state.submissions,
    myPlayer,
    triggerEpicWin,
    triggerResults,
    score,
  ]);

  // Reset when game starts
  useEffect(() => {
    if (
      isPlaying &&
      state.roundData?.startTime &&
      state.roundData.startTime !== startTime
    ) {
      setStartTime(state.roundData.startTime as number);
      setCurrentQIndex(0);
      setScore(0);
      setFinished(false);
      setOpponentProgress({});
      setAnswerState(null);
    }
  }, [isPlaying, state.roundData, startTime]);

  const handleAnswer = (optionIndex: number) => {
    if (answerState !== null || finished) return;

    const isCorrect = optionIndex === currentQ?.correctAnswer;

    setSelectedOption(optionIndex);
    setAnswerState(isCorrect ? 'correct' : 'wrong');

    if (isCorrect) {
      setScore((prev) => prev + SCORING.BASE_CORRECT);
    }

    setTimeout(() => {
      let nextIndex = currentQIndex;
      let isDone = false;

      if (currentQIndex < RAPID_FIRE_QUESTIONS.length - 1) {
        setCurrentQIndex((prev) => prev + 1);
        nextIndex = currentQIndex + 1;
      } else {
        setFinished(true);
        isDone = true;
        toast({ title: 'Finished! 🏁', description: 'Waiting for the rest of the players...' });
      }

      // Send progress to server
      submitAnswer({
        index: nextIndex + 1,
        score,
        done: isDone,
        time: Date.now(),
      });

      if (!isDone) {
        setAnswerState(null);
        setSelectedOption(null);
      }
    }, 500);
  };

  return (
    <GameShell title="Rapid Fire ⚡" gameId="rapid-fire" score={score}>
      <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-lg mx-auto w-full">
        {/* LOBBY */}
        {isLobby && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center space-y-6 w-full">
              <StickerCard
                className="p-10 flex flex-col items-center gap-6"
                accentColor="red">
                <div className="w-24 h-24 rounded-full bg-[#FF4D6A]/20 flex items-center justify-center border-4 border-[#FF4D6A]">
                  <Zap size={48} className="text-[#FF4D6A] animate-pulse" />
                </div>
                <div>
                  <h1 className="text-4xl font-black text-white mb-2">
                    Rapid Fire
                  </h1>
                  <p className="text-white/60 font-bold">
                    Race your friends in real-time.
                    <br />
                    First to finish wins!
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
                      onClick={() => startGame('rapid-fire')}>
                      🚀 Start the Race
                    </CartoonButton>
                  )}
                </div>
              </StickerCard>
            </motion.div>
          </AnimatePresence>
        )}

        {/* GAME */}
        {isPlaying && !finished && (
          <div className="w-full space-y-6">
            {/* Live Progress Bars */}
            <div className="relative p-6 bg-black/40 backdrop-blur-2xl rounded-[2.5rem] border-2 border-white/10 shadow-2xl overflow-hidden group w-full">
              <div className="absolute inset-0 bg-linear-to-b from-white/5 to-transparent pointer-events-none" />

              {/* Scanlines on progress area */}
              <div
                className="absolute inset-0 opacity-5 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-20"
                style={{ backgroundSize: '100% 4px, 3px 100%' }}
              />

              <p className="text-[10px] uppercase tracking-[0.4em] text-white/40 mb-6 font-black flex items-center gap-2 justify-center">
                <Timer size={14} className="animate-pulse text-yellow-500" />
                Live Network Progress
              </p>

              <div className="space-y-6 relative z-10">
                {players.map((p) => {
                  const progress =
                    p.id === myPlayer?.id
                      ? currentQIndex
                      : opponentProgress[p.id] || 0;
                  const pct = (progress / RAPID_FIRE_QUESTIONS.length) * 100;
                  const isCurrent = p.id === myPlayer?.id;

                  return (
                    <div key={p.id} className="space-y-1.5">
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              'w-8 h-8 rounded-full border-2 overflow-hidden flex items-center justify-center shrink-0',
                              isCurrent
                                ? 'border-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]'
                                : 'border-white/20'
                            )}>
                            {p.avatar && p.avatar.startsWith('http') ? (
                              <img
                                src={p.avatar}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-sm">{p.avatar || '👤'}</span>
                            )}
                          </div>
                          <span
                            className={cn(
                              'text-xs font-black uppercase tracking-widest',
                              isCurrent ? 'text-yellow-400' : 'text-white/60'
                            )}>
                            {p.name}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono font-black text-white/20">
                          {Math.round(pct)}%
                        </span>
                      </div>
                      <div className="h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/10 p-0.5 relative">
                        <motion.div
                          className={cn(
                            'h-full rounded-full transition-all duration-300 relative',
                            isCurrent
                              ? 'bg-linear-to-r from-yellow-400 to-yellow-600 shadow-[0_0_15px_rgba(234,179,8,0.3)]'
                              : 'bg-linear-to-r from-green-400/50 to-green-600/50'
                          )}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ type: 'spring', damping: 15 }}>
                          <div className="absolute inset-0 bg-linear-to-b from-white/20 to-transparent" />
                          <motion.div
                            animate={{ x: ['-100%', '200%'] }}
                            transition={{
                              duration: 1.5,
                              repeat: Infinity,
                              ease: 'linear',
                            }}
                            className="absolute inset-0 bg-linear-to-r from-transparent via-white/30 to-transparent w-8"
                          />
                        </motion.div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Question Area */}
            <StickerCard
              className="p-6 text-center"
              accentColor="gold"
              hover={false}>
              <p className="text-xs text-white/40 uppercase tracking-widest mb-4 font-bold border border-white/10 rounded-full px-3 py-1 inline-block">
                Question {currentQIndex + 1} / {RAPID_FIRE_QUESTIONS.length}
              </p>
              <h2 className="text-2xl md:text-3xl font-black text-white mb-8 leading-tight">
                {currentQ.text}
              </h2>

              <div className="grid grid-cols-1 gap-3 font-sans">
                {currentQ.options.map((opt, idx) => {
                  let stateClass =
                    'bg-[#1a1a1a] border-white/20 hover:border-white/50 text-white';
                  if (
                    answerState === 'correct' &&
                    idx === currentQ.correctAnswer
                  )
                    stateClass =
                      'bg-[#2ECC71] border-white text-black scale-105 shadow-[4px_4px_0px_#1a1a1a]';
                  if (answerState === 'wrong' && idx === selectedOption)
                    stateClass = 'bg-[#FF4D6A] border-white text-white shake';

                  return (
                    <button
                      key={idx}
                      onClick={() => handleAnswer(idx)}
                      disabled={answerState !== null}
                      className={cn(
                        'h-16 rounded-2xl border-4 font-black transition-all text-lg',
                        stateClass
                      )}>
                      {opt}
                    </button>
                  );
                })}
              </div>
            </StickerCard>
          </div>
        )}

        {/* FINISHED / RESULTS */}
        {(finished || isResults) && (
          <div className="text-center space-y-6 w-full">
            <StickerCard className="p-10" accentColor="gold">
              <div className="text-6xl mb-4 animate-bounce">🏁</div>
              <h2 className="text-3xl font-black text-white">Race Finished!</h2>
              <p className="text-white/60 mb-8 font-bold">
                You finished! Waiting for results...
              </p>

              {isResults && (
                <div className="space-y-2">
                  {[...players]
                    .sort((a, b) => b.score - a.score)
                    .map((p, i) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between p-3 bg-white/5 rounded-xl border-2 border-white/10">
                        <div className="flex items-center gap-3">
                          {i === 0 && (
                            <Trophy size={16} className="text-[#FFD93D]" />
                          )}
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
                          <span className="text-white font-bold">{p.name}</span>
                        </div>
                        <span className="font-mono font-black text-[#FFD93D] text-lg">
                          {p.score}
                        </span>
                      </div>
                    ))}
                </div>
              )}

              {isResults && (
                <div className="mt-8 pt-6 border-t-2 border-white/10 font-sans">
                  <CartoonButton
                    variant="green"
                    fullWidth
                    onClick={() => startGame('rapid-fire')}>
                    Play Again 🔄
                  </CartoonButton>
                </div>
              )}
            </StickerCard>
          </div>
        )}
      </div>
    </GameShell>
  );
}
