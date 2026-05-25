'use client';

import { useState, useEffect, useRef } from 'react';
import { GameShell } from '@/components/christmas/GameShell';
import { StickerCard } from '@/components/christmas/StickerCard';
import { CartoonButton } from '@/components/christmas/CartoonButton';
import { useGameTransitions } from '@/components/games/TransitionProvider';
import { useToast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Zap, Timer, Trophy, CheckCircle, XCircle } from 'lucide-react';
import { useParams } from 'next/navigation';
import { usePartyContext } from '@/hooks/PartyProvider';
import usePartySocket from 'partysocket/react';
import confetti from 'canvas-confetti';

// 5 micro-challenges configuration
interface Challenge {
  id: string;
  type: 'tap' | 'slider' | 'dont-click' | 'type-reverse' | 'shake';
  instruction: string;
  subInstruction: string;
  duration: number; // in seconds
}

const CHALLENGES: Challenge[] = [
  { id: '1', type: 'tap', instruction: 'TAP SANTA 10 TIMES!', subInstruction: 'Find Santa and tap him fast!', duration: 5 },
  { id: '2', type: 'slider', instruction: 'DRAG SLIDER TO 69%!', subInstruction: 'Release within 67% - 71%', duration: 5 },
  { id: '3', type: 'dont-click', instruction: 'DON\'T CLICK!', subInstruction: 'Avoid clicking the giant button!', duration: 5 },
  { id: '4', type: 'type-reverse', instruction: 'TYPE "MERRY" BACKWARDS!', subInstruction: 'Type "YRREM" and hit enter', duration: 7 },
  { id: '5', type: 'shake', instruction: 'FRANTICALLY TAP THE BOX!', subInstruction: 'Tap 15 times to break it!', duration: 5 },
];

export default function RapidFireGame() {
  const params = useParams();
  const roomCode = ((params?.roomCode as string) || 'night').toUpperCase();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [localScore, setLocalScore] = useState(0);
  const [finished, setFinished] = useState(false);
  
  // Game states
  const [challengeState, setChallengeState] = useState<'intro' | 'active' | 'success' | 'fail'>('intro');
  const [timeRemaining, setTimeRemaining] = useState(5);
  const [shakeCount, setShakeCount] = useState(0);
  const [santaPos, setSantaPos] = useState({ x: 50, y: 50 });
  const [santaTaps, setSantaTaps] = useState(0);
  const [sliderVal, setSliderVal] = useState(50);
  const [textInput, setTextInput] = useState('');
  const [dontClickText, setDontClickText] = useState('DON\'T CLICK!');
  const [opponentProgress, setOpponentProgress] = useState<Record<string, number>>({});
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
  const currentQ = CHALLENGES[currentIdx];

  // Real-time progress updates via socket
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

  // Trigger round transitions
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
  }, [isPlaying, state.round, state.maxRounds, triggerRoundStart, triggerFinalRound]);

  // Trigger results transition
  useEffect(() => {
    if (isResults && !hasTriggeredResults.current) {
      hasTriggeredResults.current = true;

      // Save score
      if (localScore > 0) {
        import('@/app/actions').then(({ updateLeaderboardAction }) => {
          updateLeaderboardAction(roomCode, 'rapid-fire', localScore);
        });
      }

      // Check if first
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
  }, [isResults, state.submissions, myPlayer, triggerEpicWin, triggerResults, localScore, roomCode]);

  // Reset when game starts
  useEffect(() => {
    if (
      isPlaying &&
      state.roundData?.startTime &&
      state.roundData.startTime !== startTime
    ) {
      setStartTime(state.roundData.startTime as number);
      setCurrentIdx(0);
      setLocalScore(0);
      setFinished(false);
      setOpponentProgress({});
      initChallenge(0);
    }
  }, [isPlaying, state.roundData, startTime]);

  // Micro-game Loop Timer
  useEffect(() => {
    if (!isPlaying || finished || challengeState !== 'active') return;

    if (timeRemaining <= 0) {
      // Time is up! Check win/loss condition
      evaluateChallengeResult();
      return;
    }

    const timer = setTimeout(() => {
      setTimeRemaining((prev) => +(prev - 0.1).toFixed(1));
    }, 100);

    return () => clearTimeout(timer);
  }, [timeRemaining, challengeState, isPlaying, finished]);

  // Initialize a challenge state
  const initChallenge = (idx: number) => {
    const ch = CHALLENGES[idx];
    if (!ch) return;

    setChallengeState('intro');
    setTimeRemaining(ch.duration);
    setShakeCount(0);
    setSantaTaps(0);
    setSliderVal(50);
    setTextInput('');
    
    // Randomize Santa Position
    setSantaPos({
      x: Math.floor(Math.random() * 70) + 15,
      y: Math.floor(Math.random() * 70) + 15,
    });

    // Special trigger for Reverse Click
    if (ch.type === 'dont-click') {
      const isReverse = Math.random() > 0.5;
      setDontClickText(isReverse ? 'CLICK ME QUICK!' : 'DON\'T CLICK!');
    }

    // Auto-start after 1.5s intro
    setTimeout(() => {
      setChallengeState('active');
    }, 1500);
  };

  // Evaluate success or failure
  const evaluateChallengeResult = (forcedFail = false) => {
    const ch = CHALLENGES[currentIdx];
    let isSuccess = false;

    if (!forcedFail) {
      if (ch.type === 'tap') {
        isSuccess = santaTaps >= 10;
      } else if (ch.type === 'slider') {
        isSuccess = sliderVal >= 67 && sliderVal <= 71;
      } else if (ch.type === 'dont-click') {
        // If they survived the timer without clicking, is it success?
        // Success if it said "DON'T CLICK" and they didn't, or click me and they did (handled immediately on click)
        isSuccess = dontClickText === 'DON\'T CLICK!';
      } else if (ch.type === 'type-reverse') {
        isSuccess = textInput.toUpperCase() === 'YRREM';
      } else if (ch.type === 'shake') {
        isSuccess = shakeCount >= 15;
      }
    }

    setChallengeState(isSuccess ? 'success' : 'fail');
    const scoreAdd = isSuccess ? 500 : 0;
    const newScore = localScore + scoreAdd;
    if (isSuccess) {
      setLocalScore(newScore);
    }

    setTimeout(() => {
      advanceToNext(newScore);
    }, 1000);
  };

  const advanceToNext = (scoreToSubmit: number) => {
    let nextIdx = currentIdx;
    let isDone = false;

    if (currentIdx < CHALLENGES.length - 1) {
      setCurrentIdx((prev) => prev + 1);
      nextIdx = currentIdx + 1;
      initChallenge(nextIdx);
    } else {
      setFinished(true);
      isDone = true;
      toast({ title: 'Finished! 🏁', description: 'Waiting for the squad...' });
    }

    // Send real-time progress update
    submitAnswer({
      index: nextIdx + (isDone ? 1 : 0),
      score: scoreToSubmit,
      done: isDone,
      time: Date.now(),
    });
  };

  // Click Handler for "Don't Click"
  const handleDontClickInteract = () => {
    if (challengeState !== 'active') return;

    if (dontClickText === 'CLICK ME QUICK!') {
      // Success!
      setChallengeState('success');
      const newScore = localScore + 500;
      setLocalScore(newScore);
      setTimeout(() => advanceToNext(newScore), 1000);
    } else {
      // Fail!
      evaluateChallengeResult(true);
    }
  };

  // Santa Taps
  const handleSantaTap = () => {
    if (challengeState !== 'active') return;
    const nextCount = santaTaps + 1;
    setSantaTaps(nextCount);
    
    if (nextCount >= 10) {
      setChallengeState('success');
      const newScore = localScore + 500;
      setLocalScore(newScore);
      setTimeout(() => advanceToNext(newScore), 1000);
    } else {
      // Move Santa
      setSantaPos({
        x: Math.floor(Math.random() * 70) + 15,
        y: Math.floor(Math.random() * 70) + 15,
      });
    }
  };

  // Shake Box clicker
  const handleShakeBox = () => {
    if (challengeState !== 'active') return;
    const nextCount = shakeCount + 1;
    setShakeCount(nextCount);

    if (nextCount >= 15) {
      setChallengeState('success');
      const newScore = localScore + 500;
      setLocalScore(newScore);
      setTimeout(() => advanceToNext(newScore), 1000);
    }
  };

  return (
    <GameShell title="Rapid Fire ⚡" gameId="rapid-fire" score={localScore}>
      <div className="flex flex-col items-center justify-center min-h-[65vh] max-w-lg mx-auto w-full">
        {/* LOBBY */}
        {isLobby && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center space-y-6 w-full">
              <StickerCard
                className="p-10 flex flex-col items-center gap-6 relative overflow-hidden"
                accentColor="red">
                <div className="absolute inset-0 bg-linear-to-br from-red-500/10 via-transparent to-orange-500/10 pointer-events-none" />
                <div className="w-20 h-20 rounded-full bg-[#FF4D6A]/20 flex items-center justify-center border-4 border-[#FF4D6A] shadow-[0_0_20px_rgba(255,77,106,0.3)]">
                  <Zap size={40} className="text-[#FF4D6A] animate-pulse" />
                </div>
                <div>
                  <h1 className="text-4xl font-black text-white mb-2 leading-none uppercase italic">
                    RAPID MICRO-GAMES
                  </h1>
                  <p className="text-white/60 text-xs font-bold leading-normal uppercase tracking-wider">
                    5 seconds per task. Speed run through absolute chaos. Tap, slide, avoid, spell, and shake your way to first place!
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
                      🚀 Go Full Chaos
                    </CartoonButton>
                  )}
                </div>
              </StickerCard>
            </motion.div>
          </AnimatePresence>
        )}

        {/* ACTIVE GAME */}
        {isPlaying && !finished && currentQ && (
          <div className="w-full space-y-4">
            
            {/* Live Racing Progress Tracks */}
            <div className="p-4 bg-black/40 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl relative">
              <p className="text-[9px] uppercase tracking-[0.4em] text-white/40 mb-3 text-center font-black">
                Live Micro-Game Race
              </p>
              
              <div className="space-y-4">
                {players.map((p) => {
                  const progress = p.id === myPlayer?.id ? currentIdx : opponentProgress[p.id] || 0;
                  const pct = (progress / CHALLENGES.length) * 100;
                  const isCurrent = p.id === myPlayer?.id;

                  return (
                    <div key={p.id} className="relative flex items-center h-8">
                      {/* Track Background */}
                      <div className="absolute inset-x-0 h-1.5 bg-white/5 rounded-full border border-white/5" />
                      
                      {/* Racing Avatar */}
                      <motion.div
                        style={{ left: `calc(${pct}% - 16px)` }}
                        className={cn(
                          "absolute w-8 h-8 rounded-full border-2 bg-black/80 flex items-center justify-center transition-all z-10",
                          isCurrent ? "border-yellow-500 shadow-[0_0_12px_rgba(234,179,8,0.6)] scale-110" : "border-white/20"
                        )}
                        layout
                      >
                        {p.avatar && p.avatar.startsWith('http') ? (
                          <img src={p.avatar} className="w-full h-full object-cover rounded-full" />
                        ) : (
                          <span className="text-xs">{p.avatar || '👤'}</span>
                        )}
                      </motion.div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Micro-game Arena */}
            <div className="relative aspect-4/3 md:aspect-16/10 w-full rounded-[2.5rem] bg-[#0c0c0e] border-4 border-white/10 overflow-hidden shadow-2xl flex flex-col items-center justify-center p-6">
              <div className="absolute inset-0 bg-radial-to-b from-[#111116] to-transparent pointer-events-none" />

              {/* Time Progress Bar */}
              {challengeState === 'active' && (
                <div className="absolute top-0 inset-x-0 h-2 bg-white/5 overflow-hidden">
                  <motion.div
                    initial={{ width: '100%' }}
                    animate={{ width: `${(timeRemaining / currentQ.duration) * 100}%` }}
                    transition={{ ease: 'linear', duration: 0.1 }}
                    className={cn(
                      "h-full",
                      timeRemaining <= 2 ? "bg-red-500 animate-pulse" : "bg-gradient-to-r from-yellow-400 to-amber-500"
                    )}
                  />
                </div>
              )}

              <AnimatePresence mode="wait">
                {/* 1. INTRO SPLASH */}
                {challengeState === 'intro' && (
                  <motion.div
                    key="intro"
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 1.2, opacity: 0 }}
                    className="text-center space-y-2 z-10">
                    <Zap className="w-12 h-12 text-[#FFD93D] mx-auto animate-bounce" />
                    <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter leading-none select-none">
                      {currentQ.instruction}
                    </h2>
                    <p className="text-white/40 text-xs font-bold uppercase tracking-wider">
                      {currentQ.subInstruction}
                    </p>
                  </motion.div>
                )}

                {/* 2. SUCCESS SCREEN */}
                {challengeState === 'success' && (
                  <motion.div
                    key="success"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center space-y-2 z-10 text-[#2ECC71]">
                    <CheckCircle className="w-16 h-16 mx-auto animate-ping" />
                    <h2 className="text-3xl font-black uppercase tracking-tight">SUCCESS!</h2>
                    <p className="text-xs text-white/50 font-bold uppercase tracking-widest">+500 PTS</p>
                  </motion.div>
                )}

                {/* 3. FAIL SCREEN */}
                {challengeState === 'fail' && (
                  <motion.div
                    key="fail"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center space-y-2 z-10 text-red-500">
                    <XCircle className="w-16 h-16 mx-auto animate-bounce" />
                    <h2 className="text-3xl font-black uppercase tracking-tight">FAILED!</h2>
                    <p className="text-xs text-white/50 font-bold uppercase tracking-widest">+0 PTS</p>
                  </motion.div>
                )}

                {/* 4. ACTIVE GAMEPLAY INTERFACES */}
                {challengeState === 'active' && (
                  <motion.div
                    key="active-gameplay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="w-full h-full flex flex-col items-center justify-center relative z-10">
                    
                    {/* A. TAP SANTA GAME */}
                    {currentQ.type === 'tap' && (
                      <div className="absolute inset-0">
                        <motion.button
                          onClick={handleSantaTap}
                          style={{ left: `${santaPos.x}%`, top: `${santaPos.y}%` }}
                          whileTap={{ scale: 0.8 }}
                          className="absolute -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-red-600 border-4 border-white flex items-center justify-center text-3xl shadow-xl select-none">
                          🎅
                        </motion.button>
                        <div className="absolute bottom-4 left-0 right-0 text-center font-black text-white/60 text-lg uppercase tracking-tight">
                          Taps: {santaTaps} / 10
                        </div>
                      </div>
                    )}

                    {/* B. RANGE SLIDER GAME */}
                    {currentQ.type === 'slider' && (
                      <div className="w-full max-w-sm text-center space-y-6">
                        <div className="relative h-12 bg-white/5 rounded-full border border-white/10 flex items-center justify-center p-0.5 overflow-hidden">
                          {/* Success Zone overlay */}
                          <div className="absolute inset-y-0 w-[10%] bg-emerald-500/20 border-x-2 border-emerald-500/50" style={{ left: '67%' }} />
                          <span className="relative font-mono font-black text-xl text-white">
                            {sliderVal}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={sliderVal}
                          onChange={(e) => setSliderVal(parseInt(e.target.value))}
                          className="w-full accent-yellow-400 cursor-pointer h-2 bg-white/10 rounded-lg appearance-none"
                        />
                        <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest">
                          Target Zone: 67% - 71%
                        </p>
                      </div>
                    )}

                    {/* C. DON'T CLICK GAME */}
                    {currentQ.type === 'dont-click' && (
                      <div className="space-y-4 text-center">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleDontClickInteract}
                          className={cn(
                            "w-44 h-44 rounded-full border-8 font-black uppercase text-xl transition-all shadow-2xl",
                            dontClickText === 'DON\'T CLICK!' 
                              ? "bg-red-600 border-red-500 text-white shadow-red-500/20 hover:bg-red-500" 
                              : "bg-[#2ECC71] border-emerald-500 text-black shadow-emerald-500/30 hover:bg-emerald-400"
                          )}
                        >
                          {dontClickText}
                        </motion.button>
                        <p className="text-white/40 text-xs font-bold uppercase tracking-widest">
                          Watch the command carefully!
                        </p>
                      </div>
                    )}

                    {/* D. SPELL BACKWARD GAME */}
                    {currentQ.type === 'type-reverse' && (
                      <div className="w-full max-w-sm text-center space-y-4">
                        <div className="p-3 bg-white/5 border border-white/10 rounded-2xl">
                          <span className="text-xs text-white/30 uppercase tracking-widest block font-bold">Word to Reverse</span>
                          <span className="text-3xl font-black text-white tracking-widest">MERRY</span>
                        </div>
                        <input
                          type="text"
                          value={textInput}
                          onChange={(e) => setTextInput(e.target.value.replace(/\s+/g, ''))}
                          placeholder="Type reverse here..."
                          className="w-full h-14 bg-black/50 border-4 border-white/10 focus:border-yellow-400 rounded-xl text-center text-xl font-mono uppercase font-black text-white outline-none"
                          autoFocus
                        />
                        <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">
                          Type "YRREM"
                        </p>
                      </div>
                    )}

                    {/* E. SHAKE CLICKER GAME */}
                    {currentQ.type === 'shake' && (
                      <div className="space-y-4 text-center">
                        <motion.button
                          animate={shakeCount > 0 ? { rotate: [0, -3, 3, -3, 3, 0], scale: [1, 1.05, 1] } : {}}
                          transition={{ duration: 0.15 }}
                          onClick={handleShakeBox}
                          className="w-36 h-36 bg-linear-to-br from-yellow-400 to-amber-600 rounded-3xl border-4 border-white flex items-center justify-center text-4xl shadow-xl select-none font-black">
                          📦
                        </motion.button>
                        <div className="h-6 w-full bg-white/5 rounded-full overflow-hidden border border-white/10 p-0.5 max-w-[200px] mx-auto">
                          <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${(shakeCount / 15) * 100}%` }} />
                        </div>
                        <p className="text-white/60 font-black text-sm uppercase">
                          Hits: {shakeCount} / 15
                        </p>
                      </div>
                    )}

                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* FINISHED / RESULTS */}
        {(finished || isResults) && (
          <div className="text-center space-y-6 w-full">
            <StickerCard className="p-8 relative overflow-hidden" accentColor="gold">
              <div className="absolute inset-0 bg-linear-to-b from-yellow-500/10 to-transparent pointer-events-none" />
              <div className="text-6xl mb-3 animate-bounce">🏁</div>
              <h2 className="text-3xl font-black text-white uppercase tracking-tight">Race Finished!</h2>
              <p className="text-white/60 text-xs font-bold leading-normal mb-8 max-w-sm mx-auto">
                You speed ran the challenges! Let's see who is the ultimate speed demon...
              </p>

              {isResults && (
                <div className="space-y-2">
                  {[...players]
                    .sort((a, b) => b.score - a.score)
                    .map((p, i) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                        <div className="flex items-center gap-3">
                          {i === 0 ? (
                            <Trophy size={18} className="text-[#FFD93D]" />
                          ) : (
                            <span className="w-5 text-center text-white/30 font-black text-sm font-mono">{i + 1}</span>
                          )}
                          <div className="w-8 h-8 rounded-full border border-white/20 overflow-hidden bg-white/5 flex items-center justify-center shrink-0">
                            {p.avatar && p.avatar.startsWith('http') ? (
                              <img src={p.avatar} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-sm">{p.avatar || '👤'}</span>
                            )}
                          </div>
                          <span className="text-white font-bold text-sm">{p.name}</span>
                        </div>
                        <span className="font-mono font-black text-[#FFD93D] text-lg">
                          {p.score}
                        </span>
                      </div>
                    ))}
                </div>
              )}

              {isResults && (
                <div className="mt-8 pt-6 border-t border-white/10 font-sans">
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
