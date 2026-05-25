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
  FolderOpen,
  AlertOctagon,
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

const EXHIBITS = [
  { id: 'burrito', name: 'Half-Eaten Burrito', emoji: '🌯', desc: 'Left in the crime scene sink' },
  { id: 'coffee', name: 'Spilled Mug', emoji: '☕', desc: 'Mystery puddle near the power strip' },
  { id: 'logs', name: 'Cringe Logs', emoji: '💬', desc: 'Damning screenshots of group chat' },
  { id: 'phone', name: 'Locked Phone', emoji: '📱', desc: 'Primary source of shady notifications' },
  { id: 'box', name: 'Empty Cookie Tin', emoji: '🍪', desc: 'Crumbs found on defendant\'s shirt' },
  { id: 'search', name: 'Incognito History', emoji: '🕵️‍♂️', desc: 'Extremely suspicious search queries' },
];

export default function GroupTrialGame() {
  const params = useParams();
  const roomCode = params?.roomCode as string || '';
  const [evidenceText, setEvidenceText] = useState('');
  const [selectedExhibit, setSelectedExhibit] = useState(EXHIBITS[0].id);
  const [defense, setDefense] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [showObjection, setShowObjection] = useState(false);
  const [activeFolder, setActiveFolder] = useState<string | null>(null);

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
  const isLobby = state.phase === 'lobby' || state.currentGame !== 'group-trial';
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

  // Trigger sentencing transition
  useEffect(() => {
    if (isSentencing && !hasTriggeredSentencing.current && accused) {
      hasTriggeredSentencing.current = true;

      const isGuilty =
        roundData?.eventMessage?.includes('GUILTY') &&
        !roundData?.eventMessage?.includes('NOT GUILTY');

      // Haptic feedback on verdict reveal
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        if (isGuilty) {
          navigator.vibrate([50, 30, 50, 30, 400, 100, 600]); // dramatic guilty gavel slam
        } else {
          navigator.vibrate([100, 50, 100]); // relief pulse for innocent
        }
      }

      if (isGuilty) {
        triggerCaught(accused.name);
      } else {
        triggerEscaped(accused.name);
      }

      // Persist score
      if (myPlayer?.score && myPlayer.score > 0) {
        import('@/app/actions').then(({ updateLeaderboardAction }) => {
          updateLeaderboardAction(roomCode, 'group-trial', myPlayer.score);
        });
      }
    }
    if (!isSentencing) {
      hasTriggeredSentencing.current = false;
    }
  }, [isSentencing, roundData?.eventMessage, accused, triggerCaught, triggerEscaped, myPlayer?.score, roomCode]);

  // Timer effect
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (isEvidence && roundData?.evidencePhaseEnd) {
      const updateTimer = () => {
        const remaining = Math.max(0, Math.ceil((roundData.evidencePhaseEnd - Date.now()) / 1000));
        setTimeLeft(remaining);
      };
      updateTimer();
      timerRef.current = setInterval(updateTimer, 100);
    } else if (isDefense && roundData?.defensePhaseEnd) {
      const updateTimer = () => {
        const remaining = Math.max(0, Math.ceil((roundData.defensePhaseEnd - Date.now()) / 1000));
        setTimeLeft(remaining);
      };
      updateTimer();
      timerRef.current = setInterval(updateTimer, 100);
    } else if (isVoting) {
      setTimeLeft(60);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isEvidence, isDefense, isVoting, roundData?.evidencePhaseEnd, roundData?.defensePhaseEnd]);

  // Celebration effects
  useEffect(() => {
    if (isSentencing && roundData?.eventMessage?.includes('NOT GUILTY') && isAccused) {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }
  }, [isSentencing, isAccused, roundData?.eventMessage]);

  const handleSubmitEvidence = () => {
    if (!evidenceText.trim()) return;
    const item = EXHIBITS.find((e) => e.id === selectedExhibit);
    const finalEvidence = `📁 Exhibit: ${item?.emoji} [${item?.name}] - ${evidenceText.trim()}`;
    submitAnswer({ type: 'trial-evidence', evidence: finalEvidence });
    setEvidenceText('');
  };

  const handleSubmitDefense = () => {
    submitAnswer({ type: 'trial-defense', defense: defense.trim() });
    setDefense('');
  };

  const handleVote = (verdict: 'guilty' | 'not-guilty') => {
    // Trigger local Objection splash on Guilty vote
    if (verdict === 'guilty') {
      setShowObjection(true);
      setTimeout(() => setShowObjection(false), 1200);
    }
    submitAnswer({ type: 'trial-vote', verdict });
  };

  return (
    <GameShell title="Squad Trial ⚖️" gameId="group-trial" score={myPlayer?.score}>
      <CountdownOverlay count={countdown} show={isCountdown && countdown > 0} />

      {/* Dramatic OBJECTION! Full-screen Splash */}
      <AnimatePresence>
        {showObjection && (
          <motion.div
            initial={{ scale: 0.2, rotate: -20, opacity: 0 }}
            animate={{ scale: [1, 1.2, 1], rotate: [5, -5, 0], opacity: 1 }}
            exit={{ scale: 2, opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none bg-red-600/40 backdrop-blur-xs">
            <div className="bg-red-700 border-8 border-yellow-400 text-yellow-400 font-extrabold text-6xl md:text-8xl italic uppercase px-12 py-6 rounded-2xl shadow-[0_0_50px_rgba(239,68,68,0.8)] tracking-widest leading-none drop-shadow-[5px_5px_0px_#000]">
              OBJECTION!
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
            <StickerCard className="p-8 text-center space-y-4 relative overflow-hidden" accentColor="red">
              <div className="absolute inset-0 bg-linear-to-b from-red-500/10 to-transparent pointer-events-none" />
              <div className="text-6xl animate-bounce">⚖️</div>
              <h2 className="text-3xl font-black text-white uppercase italic leading-none">
                COURT OF CHAOS
              </h2>
              <p className="text-white/60 text-xs font-bold leading-normal uppercase tracking-wide">
                Expose petty crimes and judge your friends. Jurors submit Exhibit folders, cross-examine defense claims, and slam the Gavel!
              </p>
            </StickerCard>

            <StickerCard className="p-4" accentColor="white" hover={false}>
              <div className="text-xs text-white/40 mb-3 uppercase tracking-wider font-bold">
                Jury Room ({players.length})
              </div>
              <div className="flex flex-wrap gap-2">
                {players.map((p) => (
                  <div
                    key={p.id}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all',
                      p.ready
                        ? 'bg-rose-500/20 border-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.2)]'
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
                    {p.ready && <Gavel size={14} className="text-[#FF4D6A] animate-pulse" />}
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
                {myPlayer?.ready ? '✓ Prepared' : 'Prepare Case'}
              </CartoonButton>

              {allReady && (
                <CartoonButton
                  variant="red"
                  size="lg"
                  fullWidth
                  onClick={() => startGame('group-trial' as any)}>
                  ⚖️ Summon Courtroom
                </CartoonButton>
              )}
            </div>
          </motion.div>
        )}

        {/* EVIDENCE COLLECTION */}
        {isEvidence && (
          <motion.div
            key="evidence"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-4 max-w-xl mx-auto">
            
            {/* Hot Seat Accused banner */}
            <div className="bg-linear-to-r from-red-600/10 via-black/40 to-red-600/10 border-2 border-red-500/30 p-6 rounded-3xl relative overflow-hidden text-center">
              <div className="absolute inset-0 bg-radial-to-b from-red-500/5 to-transparent pointer-events-none" />
              <span className="text-[10px] text-red-500 font-black uppercase tracking-[0.4em] block mb-3">
                DEFENDANT ON THE STAND
              </span>
              <div className="flex items-center justify-center gap-4">
                <div className="w-16 h-16 rounded-2xl border-4 border-red-500/40 overflow-hidden bg-white/10 shrink-0 shadow-lg">
                  {accused?.avatar && accused.avatar.startsWith('http') ? (
                    <img src={accused.avatar} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl">{accused?.avatar || '👤'}</span>
                  )}
                </div>
                <div className="text-left">
                  <h3 className="text-2xl font-black text-white leading-none uppercase italic">{accused?.name}</h3>
                  <p className="text-white/40 text-xs font-bold uppercase mt-1">Acquitted: {roundData?.acquittalCount?.[accusedId || ''] || 0} times</p>
                </div>
              </div>
            </div>

            {/* Crime Charge Sheet */}
            <StickerCard className="p-6 text-center relative overflow-hidden" accentColor="red" hover={false}>
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-xl">{CATEGORY_EMOJIS[charge?.category]}</span>
                <span
                  className="text-[10px] uppercase tracking-widest font-black px-2.5 py-0.5 rounded-full border border-current leading-none"
                  style={{ color: CATEGORY_COLORS[charge?.category] }}>
                  {charge?.category} • SEVERITY {charge?.severity}
                </span>
              </div>
              <h2 className="text-2xl font-black text-white leading-tight">
                "{charge?.text}"
              </h2>
            </StickerCard>

            {/* Timer HUD */}
            <div className="text-center font-mono">
              <div className={cn(
                'inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-lg font-black border-2 transition-colors',
                timeLeft <= 5 ? 'bg-red-500/20 text-red-500 border-red-500 animate-pulse' : 'bg-white/5 text-white/60 border-white/10'
              )}>
                ⏱️ Deliberation: {timeLeft}s
              </div>
            </div>

            {/* Evidence Exhibit Selector (Jurors) */}
            {!isAccused && !hasSubmittedEvidence && (
              <div className="space-y-4 bg-black/40 border border-white/10 p-5 rounded-3xl shadow-xl font-sans">
                <p className="text-white/80 text-sm font-black uppercase text-center tracking-wider">
                  Select Exhibit Item
                </p>
                
                {/* Visual grid of Exhibits */}
                <div className="grid grid-cols-3 gap-2">
                  {EXHIBITS.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedExhibit(item.id)}
                      className={cn(
                        "p-2 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all",
                        selectedExhibit === item.id 
                          ? "bg-purple-500/20 border-purple-500 text-white" 
                          : "bg-white/5 border-white/5 text-white/40 hover:border-white/10"
                      )}>
                      <span className="text-2xl">{item.emoji}</span>
                      <span className="text-[9px] font-black uppercase leading-tight truncate w-full">{item.name}</span>
                    </button>
                  ))}
                </div>

                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    value={evidenceText}
                    onChange={(e) => setEvidenceText(e.target.value)}
                    placeholder="Attach descriptive note to this exhibit..."
                    maxLength={70}
                    className="flex-1 h-12 bg-white/5 border-2 border-white/10 focus:border-[#FF4D6A] rounded-xl text-white placeholder:text-white/20 outline-none px-4 font-bold transition-all text-sm"
                  />
                  <CartoonButton
                    variant="red"
                    size="sm"
                    onClick={handleSubmitEvidence}
                    disabled={!evidenceText.trim()}>
                    <Send size={16} />
                  </CartoonButton>
                </div>
              </div>
            )}

            {/* Submitted & Waiting */}
            {!isAccused && hasSubmittedEvidence && (
              <div className="text-center py-6 bg-black/20 border border-white/5 rounded-3xl">
                <span className="text-emerald-400 font-black text-lg block mb-1">✓ Exhibit Proposed</span>
                <p className="text-white/40 text-xs font-bold uppercase tracking-wider animate-pulse">Waiting for jury logs...</p>
              </div>
            )}

            {isAccused && (
              <div className="text-center p-6 bg-black/40 border-2 border-white/15 rounded-3xl animate-pulse">
                <span className="text-4xl block mb-2">🤐</span>
                <p className="text-white font-black text-sm uppercase">The jury is logging evidence folders...</p>
                <p className="text-white/40 text-xs font-bold uppercase mt-1">Prepare your testimony.</p>
              </div>
            )}
          </motion.div>
        )}

        {/* DEFENSE PHASE */}
        {isDefense && (
          <motion.div
            key="defense"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 max-w-xl mx-auto font-sans">
            
            <div className="text-center mb-2">
              <span className="bg-[#2ECC71]/10 border border-[#2ECC71]/30 text-[#2ECC71] px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider animate-pulse">
                TESTIMONY HEARINGS
              </span>
            </div>

            {/* Interactive Exhibit Folders */}
            <StickerCard className="p-4" accentColor="purple" hover={false}>
              <p className="text-xs text-white/40 uppercase tracking-widest mb-3 font-bold border-b border-white/10 pb-2 flex items-center gap-1.5">
                <FolderOpen size={14} />
                <span>Exhibits In Evidence (Click folders to inspect)</span>
              </p>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(allEvidence).map(([jurorId, text]: [string, any], i) => {
                  const juror = players.find((p) => p.id === jurorId);
                  
                  // Parse exhibit emoji/name if formatted
                  const hasExhibitFormat = text.startsWith('📁 Exhibit:');
                  let displayEmoji = '📁';
                  let displayName = `Juror #${i + 1}`;
                  let description = text;

                  if (hasExhibitFormat) {
                    const match = text.match(/📁 Exhibit:\s*(.+?)\s*\[(.+?)\]\s*-\s*(.+)/);
                    if (match && match.length === 4) {
                      displayEmoji = match[1];
                      displayName = match[2];
                      description = match[3];
                    }
                  }

                  return (
                    <button
                      key={jurorId}
                      onClick={() => setActiveFolder(jurorId === activeFolder ? null : jurorId)}
                      className={cn(
                        "p-3 rounded-xl border text-left flex items-start gap-3 transition-all",
                        activeFolder === jurorId 
                          ? "bg-purple-500/20 border-purple-500 text-white" 
                          : "bg-white/5 border-white/5 text-white/60 hover:bg-white/10"
                      )}>
                      <span className="text-3xl shrink-0 mt-0.5">{displayEmoji}</span>
                      <div className="overflow-hidden">
                        <span className="text-[10px] text-white/30 font-black uppercase block leading-none mb-1">Exhibit:</span>
                        <span className="font-black text-sm uppercase block truncate">{displayName}</span>
                        {activeFolder === jurorId && (
                          <motion.p
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="text-xs font-bold text-[#FFD93D] leading-normal italic mt-2">
                            "{description}" — {juror?.name}
                          </motion.p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </StickerCard>

            {/* Defense Input (Accused) */}
            {isAccused && !hasSubmittedDefense && (
              <div className="space-y-3">
                <p className="text-white/60 text-xs font-black uppercase text-center tracking-wider">
                  Slam the jury with your defense statement:
                </p>
                <textarea
                  value={defense}
                  onChange={(e) => setDefense(e.target.value)}
                  placeholder="Tell your lies, state your case, or start gaslighting..."
                  maxLength={150}
                  className="w-full h-24 bg-black/40 border-4 border-white/10 focus:border-[#2ECC71] rounded-2xl text-white placeholder:text-white/20 outline-none p-4 resize-none font-bold transition-all text-sm"
                />
                <CartoonButton
                  variant="green"
                  size="lg"
                  fullWidth
                  onClick={handleSubmitDefense}>
                  🛡️ Log Oral Testimony
                </CartoonButton>
              </div>
            )}

            {isAccused && hasSubmittedDefense && (
              <div className="text-center py-6 bg-black/20 border border-white/5 rounded-3xl">
                <span className="text-emerald-400 font-black text-lg">✓ Testimony Logged</span>
              </div>
            )}

            {!isAccused && (
              <StickerCard className="p-4 text-center" accentColor="white" hover={false}>
                <Gavel className="w-8 h-8 mx-auto text-white/30 mb-2 animate-bounce" />
                <p className="text-white/60 font-bold uppercase tracking-wider text-xs">
                  Waiting for defendant's oral defense...
                </p>
              </StickerCard>
            )}
          </motion.div>
        )}

        {/* VOTING VERDICT */}
        {isVoting && (
          <motion.div
            key="voting"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 max-w-xl mx-auto">
            
            <div className="text-center mb-2">
              <span className="bg-[#9B59B6]/10 border border-[#9B59B6]/30 text-[#9B59B6] px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider">
                DELIBERATION & VERDICT
              </span>
            </div>

            {/* Juror Decisions */}
            {!isAccused && !hasVoted && (
              <div className="space-y-6">
                <h3 className="text-center text-white font-black text-4xl italic tracking-tighter uppercase leading-none">
                  CAST YOUR JUDGMENT
                </h3>
                <div className="grid grid-cols-2 gap-6 p-2">
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => handleVote('guilty')}
                    className="p-8 rounded-3xl bg-red-600 border-4 border-white/20 shadow-2xl flex flex-col items-center gap-4 group overflow-hidden relative">
                    <ThumbsDown className="w-16 h-16 text-white group-hover:-rotate-12 transition-transform" />
                    <span className="text-3xl font-black text-white uppercase tracking-tight italic">Guilty</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => handleVote('not-guilty')}
                    className="p-8 rounded-3xl bg-emerald-500 border-4 border-white/20 shadow-2xl flex flex-col items-center gap-4 group overflow-hidden relative">
                    <ThumbsUp className="w-16 h-16 text-white group-hover:rotate-12 transition-transform" />
                    <span className="text-3xl font-black text-white uppercase tracking-tight italic">Innocent</span>
                  </motion.button>
                </div>
              </div>
            )}

            {!isAccused && hasVoted && (
              <div className="text-center py-8 bg-black/20 border border-white/5 rounded-3xl">
                <Gavel className="w-12 h-12 mx-auto text-white/20 mb-3" />
                <p className="text-white font-black text-lg uppercase tracking-tight">Verdict Filed!</p>
                <p className="text-white/40 text-xs font-bold uppercase mt-1 animate-pulse">Waiting for final counts...</p>
              </div>
            )}

            {isAccused && (
              <div className="text-center py-8">
                <motion.div
                  animate={{ scale: [1, 1.08, 1], rotate: [-2, 2, -2] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="text-8xl mb-4">
                  😰
                </motion.div>
                <p className="text-white font-black text-lg uppercase tracking-tight">The jury is deciding your fate...</p>
              </div>
            )}

            {/* Host Controls */}
            {isHost && (isEvidence || isDefense || isVoting) && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8 border-t border-white/5 pt-6">
                <StickerCard className="p-4" accentColor="gold" hover={false}>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <Crown size={18} className="text-[#FFD93D]" />
                      <span className="text-xs font-black text-white uppercase tracking-widest">PRESIDING JUDGE OVERRIDE</span>
                    </div>
                    <CartoonButton variant="gold" fullWidth onClick={advanceTrial} size="sm">
                      {isEvidence ? 'Close Evidence ➡️' : isDefense ? 'Close Defense ➡️' : 'Force Sentence Gavel 🔨'}
                    </CartoonButton>
                  </div>
                </StickerCard>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* SENTENCING / VERDICT REVEAL */}
        {isSentencing && (
          <motion.div
            key="sentencing"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8 space-y-6 max-w-sm mx-auto">
            
            <div className="relative">
              <span className="bg-black/60 border border-white/10 px-3 py-1 rounded-full text-xs font-bold text-white/50 uppercase tracking-widest">
                VERDICT RESOLUTION
              </span>
            </div>

            <motion.div animate={{ rotate: [0, -5, 5, 0] }} transition={{ duration: 0.4 }}>
              <div className={cn(
                'text-6xl font-black uppercase italic drop-shadow-2xl',
                roundData?.eventMessage?.includes('NOT GUILTY') ? 'text-emerald-400' : 'text-red-500'
              )}>
                {roundData?.eventMessage?.includes('NOT GUILTY') ? 'INNOCENT!' : 'GUILTY!'}
              </div>
            </motion.div>

            <p className="text-white text-base font-bold italic leading-relaxed">
              {roundData?.eventMessage}
            </p>

            {/* Vote details */}
            <div className="flex justify-center gap-8 bg-black/40 border border-white/5 p-4 rounded-2xl shadow-xl">
              <div className="text-center">
                <div className="text-3xl font-black text-red-500">
                  {Object.values(verdicts).filter((v) => v === 'guilty').length}
                </div>
                <div className="text-[10px] text-white/40 font-bold uppercase tracking-wider mt-1">Guilty Votes</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-black text-emerald-400">
                  {Object.values(verdicts).filter((v) => v === 'not-guilty').length}
                </div>
                <div className="text-[10px] text-white/40 font-bold uppercase tracking-wider mt-1">Innocent Votes</div>
              </div>
            </div>
          </motion.div>
        )}

        {/* RESULTS & RECORDINGS */}
        {isResults && (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6 max-w-xl mx-auto">
            
            {/* Exhibits logs and save memory */}
            <div className="space-y-3 font-sans">
              <h3 className="text-white/40 text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <Quote size={14} />
                <span>Courtroom Exhibits Ledger</span>
              </h3>
              {Object.entries(allEvidence).map(([playerId, text]: [string, any]) => {
                const player = players.find((p) => p.id === playerId);
                return (
                  <div
                    key={playerId}
                    className="flex items-center justify-between p-3.5 bg-black/40 rounded-2xl border border-white/5 shadow-md">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                        {player?.avatar && player.avatar.startsWith('http') ? (
                          <img src={player.avatar} className="w-full h-full object-cover rounded-full" />
                        ) : (
                          <span className="text-sm">{player?.avatar || '👤'}</span>
                        )}
                      </div>
                      <div className="overflow-hidden text-left">
                        <span className="text-white text-xs font-black uppercase block leading-none mb-1">{player?.name}</span>
                        <p className="text-white/80 text-sm italic truncate">
                          {text}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        const { saveMemoryAction } = await import('@/app/actions');
                        const res = await saveMemoryAction(roomCode, `${player?.name}: ${text} (Squad Trial)`);
                        if (res?.success) alert('Saved to Memories!');
                      }}
                      className="p-2 hover:bg-yellow-500/20 rounded-full transition-colors shrink-0 group">
                      <Star size={16} className="text-white/20 group-hover:text-yellow-400 transition-all" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Scoreboard */}
            <StickerCard className="p-4" accentColor="gold" hover={false}>
              <p className="text-xs text-white/40 uppercase tracking-wider mb-3 font-bold">
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
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-white/10 flex items-center justify-center shrink-0">
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
              {state.round >= 8 ? '⚖️ Final Verdict 🏁' : 'Next Round →'}
            </CartoonButton>
          </motion.div>
        )}
      </AnimatePresence>
    </GameShell>
  );
}
