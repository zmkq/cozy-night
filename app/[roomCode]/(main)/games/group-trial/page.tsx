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
  Gavel,
  Shield,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Zap,
  Crown,
  Quote,
  Send,
  Users,
  Star,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';

const CATEGORY_COLORS: Record<string, string> = {
  ego: '#FFD93D',
  chaos: '#FF4D6A',
  loyalty: '#8B5CF6',
  intelligence: '#3B82F6',
  delusion: '#EC4899',
};

const CATEGORY_EMOJIS: Record<string, string> = {
  ego: '👑',
  chaos: '🔥',
  loyalty: '🐍',
  intelligence: '🧠',
  delusion: '🌈',
};

export default function GroupTrialGame() {
  const params = useParams();
  const roomCode = params?.roomCode as string || '';
  const [evidence, setEvidence] = useState('');
  const [defense, setDefense] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hasTriggeredRound = useRef(false);
  const hasTriggeredVoting = useRef(false);
  const hasTriggeredSentencing = useRef(false);

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
    advanceTrial,
  } = usePartyContext();

  const isHost = myPlayer?.id === state.hostId;

  const {
    triggerRoundStart,
    triggerVoting,
    triggerCaught,
    triggerEscaped,
    triggerFinalRound,
  } = useGameTransitions();

  const roundData = state.roundData as any;
  const isLobby =
    state.phase === 'lobby' || state.currentGame !== 'group-trial';
  const isCountdown = state.phase === 'countdown';
  const isEvidence = state.phase === 'evidence';
  const isDefense = state.phase === 'defense';
  const isVoting = state.phase === 'voting';
  const isSentencing = state.phase === 'sentencing';
  const isResults = state.phase === 'results';
  const allReady = players.length >= 2 && players.every((p) => p.ready);

  const accusedId = roundData?.accusedId;
  const accused = players.find((p) => p.id === accusedId);
  const isAccused = myPlayer?.id === accusedId;
  const charge = roundData?.charge;
  const allEvidence = roundData?.evidence || {};
  const hasSubmittedEvidence = !!allEvidence[myPlayer?.id || ''];
  const hasSubmittedDefense = !!roundData?.defense;
  const verdicts = roundData?.verdicts || {};
  const hasVoted = !!verdicts[myPlayer?.id || ''];

  // Trigger round start (evidence phase)
  useEffect(() => {
    if (isEvidence && !hasTriggeredRound.current && state.round > 0) {
      hasTriggeredRound.current = true;
      if (state.round === 8) {
        triggerFinalRound(state.round, 8);
      } else {
        triggerRoundStart(state.round, 8);
      }
    }
    if (!isEvidence) {
      hasTriggeredRound.current = false;
    }
  }, [isEvidence, state.round, triggerRoundStart, triggerFinalRound]);

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

  // Trigger sentencing transition (guilty/not-guilty)
  useEffect(() => {
    if (isSentencing && !hasTriggeredSentencing.current && accused) {
      hasTriggeredSentencing.current = true;

      const isGuilty =
        roundData?.eventMessage?.includes('GUILTY') &&
        !roundData?.eventMessage?.includes('NOT GUILTY');

      if (isGuilty) {
        triggerCaught(accused.name);
      } else {
        triggerEscaped(accused.name);
      }

      // Persist score to permanent leaderboard!
      if (myPlayer?.score && myPlayer.score > 0) {
        import('@/app/actions').then(({ updateLeaderboardAction }) => {
          updateLeaderboardAction(roomCode, 'group-trial', myPlayer.score);
        });
      }
    }
    if (!isSentencing) {
      hasTriggeredSentencing.current = false;
    }
  }, [
    isSentencing,
    roundData?.eventMessage,
    accused,
    triggerCaught,
    triggerEscaped,
    myPlayer?.score,
  ]);

  // Timer effect
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (isEvidence && roundData?.evidencePhaseEnd) {
      const updateTimer = () => {
        const remaining = Math.max(
          0,
          Math.ceil((roundData.evidencePhaseEnd - Date.now()) / 1000)
        );
        setTimeLeft(remaining);
      };
      updateTimer();
      timerRef.current = setInterval(updateTimer, 100);
    } else if (isDefense && roundData?.defensePhaseEnd) {
      const updateTimer = () => {
        const remaining = Math.max(
          0,
          Math.ceil((roundData.defensePhaseEnd - Date.now()) / 1000)
        );
        setTimeLeft(remaining);
      };
      updateTimer();
      timerRef.current = setInterval(updateTimer, 100);
    } else if (isVoting) {
      // Voting phase 1-minute fallback
      setTimeLeft(60);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [
    isEvidence,
    isDefense,
    isVoting,
    roundData?.evidencePhaseEnd,
    roundData?.defensePhaseEnd,
  ]);

  // Celebration effects
  useEffect(() => {
    if (
      isSentencing &&
      roundData?.eventMessage?.includes('NOT GUILTY') &&
      isAccused
    ) {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }
  }, [isSentencing, isAccused, roundData?.eventMessage]);

  const handleSubmitEvidence = () => {
    if (!evidence.trim()) return;
    submitAnswer({ type: 'trial-evidence', evidence: evidence.trim() });
    setEvidence('');
  };

  const handleSubmitDefense = () => {
    submitAnswer({ type: 'trial-defense', defense: defense.trim() });
    setDefense('');
  };

  const handleVote = (verdict: 'guilty' | 'not-guilty') => {
    submitAnswer({ type: 'trial-vote', verdict });
  };

  return (
    <GameShell
      title="Squad Trial ⚖️"
      gameId="group-trial"
      score={myPlayer?.score}>
      <CountdownOverlay count={countdown} show={isCountdown && countdown > 0} />

      {/* Round Info */}
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
            className="space-y-6">
            <StickerCard
              className="p-6 text-center space-y-4"
              accentColor="red">
              <div className="text-6xl animate-bounce">⚖️</div>
              <h2 className="text-2xl font-black text-white">Court Is In Session</h2>
              <p className="text-white/60 font-medium">
                Each round, one player is accused. The rest submit evidence. The accused defends themselves. And then... the verdict.
              </p>
            </StickerCard>

            <StickerCard className="p-4" accentColor="white" hover={false}>
              <div className="text-xs text-white/40 mb-3 uppercase tracking-wider font-bold">
                Defendants ({players.length})
              </div>
              <div className="flex flex-wrap gap-2">
                {players.map((p) => (
                  <div
                    key={p.id}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-xl border-2',
                      p.ready
                        ? 'bg-[#FF4D6A]/20 border-[#FF4D6A]'
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
                    {p.ready && <Gavel size={14} className="text-[#FF4D6A]" />}
                  </div>
                ))}
              </div>
            </StickerCard>

            <div className="space-y-3">
              <CartoonButton
                variant={myPlayer?.ready ? 'green' : 'gold'}
                size="lg"
                fullWidth
                onClick={() => setReady(!myPlayer?.ready)}>
                {myPlayer?.ready ? '✓ Ready for Trial' : 'Prepare for Trial'}
              </CartoonButton>

              {allReady && (
                <CartoonButton
                  variant="red"
                  size="lg"
                  fullWidth
                  onClick={() => startGame('group-trial' as any)}>
                  ⚖️ Start the Trials
                </CartoonButton>
              )}
            </div>
          </motion.div>
        )}

        {/* EVIDENCE PHASE */}
        {isEvidence && (
          <motion.div
            key="evidence"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-4">
            {/* Discussion Badge */}
            <div className="flex justify-center">
              <div className="bg-[#FFD93D]/20 text-[#FFD93D] border-2 border-[#FFD93D]/50 px-4 py-1.5 rounded-2xl flex items-center gap-2 animate-bounce">
                <Users size={18} />
                <span className="font-black text-sm">
                  Discussion Time! Talk to each other
                </span>
              </div>
            </div>

            {/* Accused Banner */}
            <motion.div
              initial={{ y: -30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="relative group">
              <div className="absolute -inset-1 bg-linear-to-r from-red-600 to-[#FF4D6A] rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
              <div className="relative px-7 py-6 bg-black/40 backdrop-blur-xl rounded-3xl border border-white/10 ring-1 ring-white/10">
                <p className="text-[10px] text-red-500 uppercase tracking-[0.4em] mb-4 font-black text-center">
                  On the Hot Seat
                </p>
                <div className="flex items-center justify-center gap-4">
                  <div className="relative">
                    <div className="absolute -inset-2 bg-red-500/20 blur-xl rounded-full animate-pulse" />
                    <div className="w-20 h-20 rounded-2xl border-2 border-red-500/50 overflow-hidden bg-red-500/10 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(239,68,68,0.3)] relative z-10">
                      {accused?.avatar && accused.avatar.startsWith('http') ? (
                        <img
                          src={accused.avatar}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-5xl">{accused?.avatar || '👤'}</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-3xl font-black text-white italic tracking-tighter">
                      {accused?.name}
                    </span>
                    <p className="text-white/40 text-xs font-bold uppercase tracking-widest mt-1">
                      Primary Defendant
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Charge Card */}
            <motion.div initial={{ y: -20 }} animate={{ y: 0 }}>
              <StickerCard
                className="p-8 text-center relative overflow-hidden group"
                accentColor="red"
                hover={false}>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-2xl">
                    {CATEGORY_EMOJIS[charge?.category]}
                  </span>
                  <span
                    className="text-xs uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border border-current"
                    style={{ color: CATEGORY_COLORS[charge?.category] }}>
                    {charge?.category} • Severity {charge?.severity}
                  </span>
                </div>
                <h3 className="text-xl font-black text-white leading-tight">
                  "{charge?.text}"
                </h3>
                <div className="flex justify-center gap-1 mt-3">
                  {Array.from({ length: charge?.severity || 1 }).map((_, i) => (
                    <Zap key={i} size={16} className="text-[#FFD93D]" />
                  ))}
                </div>
              </StickerCard>
            </motion.div>

            {/* Timer */}
            <div className="text-center font-mono">
              <div
                className={cn(
                  'inline-flex items-center gap-2 px-4 py-2 rounded-full text-xl font-black border-2',
                  timeLeft <= 3
                    ? 'bg-[#FF4D6A]/30 text-[#FF4D6A] border-[#FF4D6A] animate-pulse'
                    : 'bg-white/10 text-white border-white/10'
                )}>
                ⏱️ {timeLeft}s
              </div>
            </div>

            {/* Evidence Input (for Jurors) */}
            {!isAccused && !hasSubmittedEvidence && (
              <div className="space-y-3">
                <p className="text-white/60 text-sm text-center font-bold">
                  <MessageSquare size={14} className="inline mr-1" />
                  Submit evidence against {accused?.name}
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={evidence}
                    onChange={(e) => setEvidence(e.target.value)}
                    placeholder="Type one piece of evidence..."
                    maxLength={100}
                    className="flex-1 h-12 bg-white/5 border-2 border-white/10 focus:border-[#FF4D6A] rounded-xl text-white placeholder:text-white/30 outline-none px-4 font-bold transition-all"
                  />
                  <CartoonButton
                    variant="red"
                    size="sm"
                    onClick={handleSubmitEvidence}
                    disabled={!evidence.trim()}>
                    <Send size={18} />
                  </CartoonButton>
                </div>
              </div>
            )}

            {/* Waiting states */}
            {!isAccused && hasSubmittedEvidence && (
              <div className="text-center py-4">
                <div className="text-[#2ECC71] font-black text-xl mb-2">
                  ✓ Evidence Submitted
                </div>
                <p className="text-white/40 text-sm font-bold">
                  Waiting for the rest...
                </p>
              </div>
            )}

            {isAccused && (
              <StickerCard
                className="p-4 text-center"
                accentColor="white"
                hover={false}>
                <Shield className="w-8 h-8 mx-auto text-white/40 mb-2" />
                <p className="text-white/60 font-medium">
                  The jury is gathering evidence against you...
                </p>
                <p className="text-white/40 text-sm mt-2 font-bold">
                  Prepare your defense.
                </p>
              </StickerCard>
            )}
          </motion.div>
        )}

        {/* DEFENSE PHASE */}
        {isDefense && (
          <motion.div
            key="defense"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4">
            {/* Discussion Badge */}
            <div className="flex justify-center">
              <div className="bg-[#2ECC71]/20 text-[#2ECC71] border-2 border-[#2ECC71]/50 px-4 py-1.5 rounded-2xl flex items-center gap-2 animate-bounce">
                <Shield size={18} />
                <span className="font-black text-sm">Hear the defendant's defense!</span>
              </div>
            </div>

            {/* Evidence Reveal */}
            <StickerCard className="p-4" accentColor="purple" hover={false}>
              <p className="text-xs text-white/40 uppercase tracking-wider mb-3 font-bold border-b border-white/10 pb-2">
                📜 Evidence Submitted
              </p>
              <div className="space-y-2">
                {Object.entries(allEvidence).map(([jurorId, text], i) => {
                  const juror = players.find((p) => p.id === jurorId);
                  return (
                    <motion.div
                      key={jurorId}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: i * 0.2 }}
                      className="flex items-start gap-3 bg-white/5 rounded-xl p-3 border border-white/5">
                      <div className="w-8 h-8 rounded-full border border-white/20 overflow-hidden bg-white/10 flex items-center justify-center shrink-0">
                        {juror?.avatar && juror.avatar.startsWith('http') ? (
                          <img
                            src={juror.avatar}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-lg">{juror?.avatar || '👤'}</span>
                        )}
                      </div>
                      <p className="text-white text-sm flex-1 font-medium leading-relaxed">
                        "{text as string}"
                      </p>
                    </motion.div>
                  );
                })}
              </div>
            </StickerCard>

            {/* Timer */}
            <div className="text-center font-mono">
              <div
                className={cn(
                  'inline-flex items-center gap-2 px-4 py-2 rounded-full text-xl font-black border-2',
                  timeLeft <= 3
                    ? 'bg-[#FF4D6A]/30 text-[#FF4D6A] border-[#FF4D6A] animate-pulse'
                    : 'bg-white/10 text-white border-white/10'
                )}>
                ⏱️ {timeLeft}s
              </div>
            </div>

            {/* Defense Input (for Accused) */}
            {isAccused && !hasSubmittedDefense && (
              <div className="space-y-3">
                <p className="text-white/60 text-sm text-center font-bold">
                  <Shield size={14} className="inline mr-1" />
                  Your defense, {myPlayer?.name}!
                </p>
                <textarea
                  value={defense}
                  onChange={(e) => setDefense(e.target.value)}
                  placeholder="Defend yourself..."
                  maxLength={150}
                  className="w-full h-32 bg-white/5 border-2 border-white/10 focus:border-[#2ECC71] rounded-xl text-white placeholder:text-white/30 outline-none p-4 resize-none font-medium transition-all"
                />
                <CartoonButton
                  variant="green"
                  size="lg"
                  fullWidth
                  onClick={handleSubmitDefense}>
                  🛡️ Submit Defense
                </CartoonButton>
              </div>
            )}

            {isAccused && hasSubmittedDefense && (
              <div className="text-center py-4">
                <div className="text-[#2ECC71] font-black text-xl">
                  ✓ Defense Submitted
                </div>
              </div>
            )}

            {!isAccused && (
              <StickerCard
                className="p-4 text-center"
                accentColor="white"
                hover={false}>
                <Gavel className="w-8 h-8 mx-auto text-white/40 mb-2" />
                <p className="text-white/60 font-bold">
                  Waiting for {accused?.name}'s defense...
                </p>
              </StickerCard>
            )}
          </motion.div>
        )}

        {/* VOTING PHASE */}
        {isVoting && (
          <motion.div
            key="voting"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4">
            {/* Discussion Badge */}
            <div className="flex justify-center">
              <div className="bg-[#9B59B6]/20 text-[#9B59B6] border-2 border-[#9B59B6]/50 px-4 py-1.5 rounded-2xl flex items-center gap-2 animate-bounce">
                <Gavel size={18} />
                <span className="font-black text-sm">Voting Time!</span>
              </div>
            </div>

            {/* Timer */}
            <div className="text-center font-mono">
              <div
                className={cn(
                  'inline-flex items-center gap-2 px-4 py-2 rounded-full text-xl font-black border-2',
                  timeLeft <= 3
                    ? 'bg-[#FF4D6A]/30 text-[#FF4D6A] border-[#FF4D6A] animate-pulse'
                    : 'bg-white/10 text-white border-white/10'
                )}>
                ⏱️ {timeLeft}s
              </div>
            </div>

            {/* Voting UI (for Jurors) */}
            {!isAccused && !hasVoted && (
              <div className="space-y-6">
                <h3 className="text-center text-white font-black text-4xl italic tracking-tighter uppercase">
                  What is your verdict?
                </h3>
                <div className="grid grid-cols-2 gap-6 p-2">
                  <motion.button
                    whileHover={{ scale: 1.05, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleVote('guilty')}
                    className="p-10 rounded-[2.5rem] bg-red-600 border-4 border-white/20 shadow-[0_20px_50px_-12px_rgba(220,38,38,0.5)] flex flex-col items-center gap-4 group overflow-hidden relative">
                    <div className="absolute inset-0 bg-linear-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <ThumbsDown className="w-16 h-16 text-white drop-shadow-lg group-hover:-rotate-12 transition-transform" />
                    <span className="text-3xl font-black text-white uppercase tracking-tighter italic relative z-10">
                      Guilty
                    </span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleVote('not-guilty')}
                    className="p-10 rounded-[2.5rem] bg-green-500 border-4 border-white/20 shadow-[0_20px_50px_-12px_rgba(34,197,94,0.5)] flex flex-col items-center gap-4 group overflow-hidden relative">
                    <div className="absolute inset-0 bg-linear-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <ThumbsUp className="w-16 h-16 text-white drop-shadow-lg group-hover:rotate-12 transition-transform" />
                    <span className="text-3xl font-black text-white uppercase tracking-tighter italic relative z-10">
                      Innocent
                    </span>
                  </motion.button>
                </div>
              </div>
            )}

            {!isAccused && hasVoted && (
              <div className="text-center py-8">
                <Gavel className="w-16 h-16 mx-auto text-white/20 mb-3" />
                <p className="text-white font-black text-xl">Voted!</p>
                <p className="text-white/40 text-sm font-bold">
                  Waiting for the court to finish...
                </p>
              </div>
            )}

            {/* Host Manual Advancement Controls */}
            {isHost && (isEvidence || isDefense || isVoting) && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="pt-6 border-t border-white/5 mt-8">
                <StickerCard className="p-4" accentColor="gold" hover={false}>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <Crown size={18} className="text-[#FFD93D]" />
                      <span className="text-sm font-black text-white uppercase tracking-wider">
                        Host Controls
                      </span>
                    </div>
                    <p className="text-white/60 text-xs font-bold leading-relaxed">
                      Finished talking? Click to advance the game to the next stage.
                    </p>
                    <CartoonButton
                      variant="gold"
                      fullWidth
                      onClick={advanceTrial}
                      size="sm">
                      {isEvidence
                        ? 'Advance to Defense ➡️'
                        : isDefense
                        ? 'Advance to Voting 🗳️'
                        : 'Calculate Verdict ⚖️'}
                    </CartoonButton>
                  </div>
                </StickerCard>
              </motion.div>
            )}

            {isAccused && (
              <div className="text-center py-8">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="text-8xl mb-4">
                  😰
                </motion.div>
                <p className="text-white font-black text-xl">
                  The jury is deliberating...
                </p>
                <p className="text-white/40 text-sm font-bold">Your fate is in their hands.</p>
              </div>
            )}
          </motion.div>
        )}

        {/* SENTENCING */}
        {isSentencing && (
          <motion.div
            key="sentencing"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8 space-y-6">
            {/* Plot Twist */}
            {roundData?.plotTwist && (
              <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bg-[#9B59B6]/20 rounded-2xl p-4 border-2 border-[#9B59B6]">
                <p className="text-lg font-black text-[#9B59B6]">
                  {roundData.plotTwist.text}
                </p>
              </motion.div>
            )}

            {/* Verdict Reveal */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.5 }}>
              <div
                className={cn(
                  'text-6xl font-black mb-4',
                  roundData?.eventMessage?.includes('NOT GUILTY')
                    ? 'text-[#2ECC71]'
                    : 'text-[#FF4D6A]'
                )}>
                {roundData?.eventMessage?.includes('NOT GUILTY')
                  ? '🎉 NOT GUILTY'
                  : '⚖️ GUILTY'}
              </div>
            </motion.div>

            <p className="text-white text-xl font-bold">
              {roundData?.eventMessage}
            </p>

            {/* Vote breakdown */}
            <div className="flex justify-center gap-8 mt-6">
              <div className="text-center">
                <div className="text-4xl font-black text-[#FF4D6A]">
                  {Object.values(verdicts).filter((v) => v === 'guilty').length}
                </div>
                <div className="text-xs text-white/40 font-bold uppercase tracking-wider">
                  Guilty
                </div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-black text-[#2ECC71]">
                  {
                    Object.values(verdicts).filter((v) => v === 'not-guilty')
                      .length
                  }
                </div>
                <div className="text-xs text-white/40 font-bold uppercase tracking-wider">
                  Innocent
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* RESULTS */}
        {isResults && (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6">
            {/* Evidence Used & Memory Saving */}
            <div className="space-y-3">
              <h3 className="text-white/40 text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                <Quote size={14} />
                Witness Testimonies
              </h3>
              {Object.entries(allEvidence).map(
                ([playerId, text]: [string, any]) => {
                  const player = players.find((p) => p.id === playerId);
                  return (
                    <div
                      key={playerId}
                      className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm">
                          {player?.avatar || '👤'}
                        </div>
                        <div>
                          <p className="text-white text-sm font-bold">
                            {player?.name}
                          </p>
                          <p className="text-white/70 text-xs italic">
                            "{text}"
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={async () => {
                          const { saveMemoryAction } = await import(
                            '@/app/actions'
                          );
                          const res = await saveMemoryAction(
                            roomCode,
                            `${player?.name}: ${text} (Squad Trial)`
                          );
                          if (res?.success) alert('Saved to Memories!');
                        }}
                        className="p-2 hover:bg-yellow-500/20 rounded-full transition-colors group"
                        title="Save to Memories">
                        <Star
                          size={16}
                          className="text-white/20 group-hover:text-yellow-400 transition-colors"
                        />
                      </button>
                    </div>
                  );
                }
              )}
            </div>
            {/* Scoreboard */}
            <StickerCard className="p-4" accentColor="gold" hover={false}>
              <p className="text-xs text-white/40 uppercase tracking-wider mb-3 font-bold">
                Current Standings
              </p>
              <div className="space-y-2">
                {[...players]
                  .sort((a, b) => b.score - a.score)
                  .map((p, i) => (
                    <motion.div
                      key={p.id}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center gap-3 bg-white/5 p-2 rounded-xl border border-white/5">
                      {i === 0 && (
                        <Crown size={16} className="text-[#FFD93D]" />
                      )}
                      {i > 0 && (
                        <span className="w-4 text-center text-white/20 font-bold text-sm">
                          {i + 1}
                        </span>
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
                      <span className="flex-1 text-white font-bold">
                        {p.name}
                      </span>
                      <span className="text-[#FFD93D] font-black font-mono">
                        {p.score}
                      </span>
                    </motion.div>
                  ))}
              </div>
            </StickerCard>

            {/* Top Quotes */}
            {roundData?.topQuotes?.length > 0 && (
              <StickerCard className="p-4" accentColor="purple" hover={false}>
                <p className="text-xs text-white/40 uppercase tracking-wider mb-2 font-bold">
                  <Quote size={12} className="inline mr-1" /> Top Quotes
                </p>
                {roundData.topQuotes.slice(-2).map((q: any, i: number) => {
                  const author = players.find((p) => p.id === q.playerId);
                  return (
                    <div
                      key={i}
                      className="text-sm text-white/60 italic mb-2 font-medium">
                      "{q.text}" —{' '}
                      <span className="text-white font-bold not-italic">
                        {author?.name}
                      </span>
                    </div>
                  );
                })}
              </StickerCard>
            )}

            <CartoonButton
              variant="green"
              size="lg"
              fullWidth
              onClick={nextRound}>
              {state.round >= 8 ? '⚖️ Final Verdict' : 'Next Round →'}
            </CartoonButton>
          </motion.div>
        )}
      </AnimatePresence>
    </GameShell>
  );
}
