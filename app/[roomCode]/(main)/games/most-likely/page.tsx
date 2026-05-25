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
import { Users, Award, Flame, Coins, ShieldAlert, Sparkles } from 'lucide-react';
import { usePartyContext } from '@/hooks/PartyProvider';
import confetti from 'canvas-confetti';

export default function MostLikelyGame() {
  const params = useParams();
  const roomCode = params?.roomCode as string || '';
  
  const [chosenFriend, setChosenFriend] = useState<string | null>(null);
  const [roastText, setRoastText] = useState('');
  const [predictedWinner, setPredictedWinner] = useState<string | null>(null);
  const [betOutcome, setBetOutcome] = useState<'idle' | 'won' | 'lost'>('idle');

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
    triggerEpicFail,
  } = useGameTransitions();
  
  const { toast } = useToast();

  const isLobby = state.phase === 'lobby' || state.currentGame !== 'most-likely';
  const isPlaying = state.phase === 'playing'; // Roast entry phase
  const isVoting = state.phase === 'voting';
  const isResults = state.phase === 'results';

  const currentPrompt = state.roundData?.prompt as string;
  const allReady = players.length >= 2 && players.every((p) => p.ready);

  // Trigger voting transition
  useEffect(() => {
    if ((isPlaying || isVoting) && !hasTriggeredVoting.current && state.round > 0) {
      hasTriggeredVoting.current = true;
      triggerVoting();
    }
    if (!isPlaying && !isVoting) {
      hasTriggeredVoting.current = false;
    }
  }, [isPlaying, isVoting, state.round, triggerVoting]);

  // Determine winner and calculate bet payouts in Results
  useEffect(() => {
    if (isResults && !hasTriggeredResults.current) {
      hasTriggeredResults.current = true;

      // Calculate votes
      const votesList = Object.values(state.votes || {});
      const voteCounts: Record<string, number> = {};
      votesList.forEach((targetId: any) => {
        voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
      });

      const maxVotes = Math.max(0, ...Object.values(voteCounts));
      const winnerId = Object.keys(voteCounts).find((id) => voteCounts[id] === maxVotes);
      const winnerPlayer = players.find((p) => p.id === winnerId);

      if (winnerPlayer) {
        triggerEpicFail(winnerPlayer.name);
      } else {
        triggerResults();
      }

      // Check client bet
      if (predictedWinner) {
        if (predictedWinner === winnerId) {
          setBetOutcome('won');
          confetti({
            particleCount: 60,
            spread: 50,
            colors: ['#FFD93D', '#2ECC71'],
          });
          toast({ title: 'Bet Paid Out! 💰', description: '+200 points for correct prediction!' });
        } else {
          setBetOutcome('lost');
        }
      }

      // Save score
      if (myPlayer?.score && myPlayer.score > 0) {
        import('@/app/actions').then(({ updateLeaderboardAction }) => {
          updateLeaderboardAction(roomCode, 'most-likely', myPlayer.score);
        });
      }
    }
    if (!isResults) {
      hasTriggeredResults.current = false;
    }
  }, [isResults, state.votes, players, triggerEpicFail, triggerResults, myPlayer?.score, predictedWinner, roomCode]);

  // Reset inputs on round change
  useEffect(() => {
    setChosenFriend(null);
    setRoastText('');
    setPredictedWinner(null);
    setBetOutcome('idle');
  }, [state.round]);

  const handleSubmitRoast = () => {
    if (!chosenFriend || !roastText.trim() || !predictedWinner) return;
    
    // Package choices into the generic submission answer
    submitAnswer({
      targetId: chosenFriend,
      roast: roastText.trim(),
      betId: predictedWinner
    });
  };

  const handleVote = (targetId: string) => {
    vote(targetId);
  };

  return (
    <GameShell title="Most Likely To 👆" gameId="most-likely" score={myPlayer?.score || 0}>
      <div className="max-w-xl mx-auto min-h-[60vh] flex flex-col justify-center p-4 w-full">
        
        {/* LOBBY */}
        {isLobby && (
          <div className="text-center space-y-6 w-full">
            <StickerCard
              className="p-10 flex flex-col items-center gap-6 relative overflow-hidden"
              accentColor="green">
              <div className="absolute inset-0 bg-linear-to-br from-emerald-500/10 via-transparent to-green-500/10 pointer-events-none" />
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center border-4 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)] animate-pulse">
                <Flame size={40} className="text-emerald-400" />
              </div>
              <div>
                <h1 className="text-4xl font-black text-white mb-2 italic uppercase leading-none">
                  ROAST & BET ARENA
                </h1>
                <p className="text-white/60 text-xs font-bold leading-normal uppercase tracking-wider">
                  Accuse friends with custom roasts, place secret point predictions on who will get roasted, and vote anonymously on the best write-up!
                </p>
              </div>

              <div className="w-full space-y-3 font-sans">
                <CartoonButton
                  variant={myPlayer?.ready ? 'green' : 'gold'}
                  fullWidth
                  onClick={() => setReady(!myPlayer?.ready)}>
                  {myPlayer?.ready ? '✓ Locked In' : 'Enter Arena'}
                </CartoonButton>

                {allReady && (
                  <CartoonButton
                    variant="red"
                    fullWidth
                    onClick={() => startGame('most-likely')}>
                    🔥 Open the Roast Gates
                  </CartoonButton>
                )}
              </div>
            </StickerCard>
          </div>
        )}

        {/* PLAYING - Roast & Bet Submission */}
        {isPlaying && !state.submissions[myPlayer?.id || ''] && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6 w-full">
            
            {/* Prompt Card */}
            <StickerCard className="p-6 text-center relative overflow-hidden" accentColor="gold" hover={false}>
              <span className="text-[10px] text-yellow-500 font-black uppercase tracking-[0.4em] block mb-2">Accusation Sheet</span>
              <h2 className="text-2xl md:text-3xl font-black text-white italic tracking-tight leading-tight">
                "{currentPrompt || 'Waiting for prompt...'}"
              </h2>
            </StickerCard>

            {/* Target Selection */}
            <div className="space-y-2">
              <p className="text-xs text-white/50 font-black uppercase tracking-wider">1. Select Target Friend</p>
              <div className="grid grid-cols-3 gap-2">
                {players.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setChosenFriend(p.id)}
                    className={cn(
                      "p-2.5 rounded-xl border-2 flex flex-col items-center gap-1.5 transition-all text-xs font-black",
                      chosenFriend === p.id 
                        ? "bg-emerald-500/20 border-emerald-500 text-white" 
                        : "bg-black/40 border-white/5 text-white/40 hover:border-white/10"
                    )}>
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-white/10 shrink-0">
                      {p.avatar && p.avatar.startsWith('http') ? (
                        <img src={p.avatar} className="w-full h-full object-cover" />
                      ) : (
                        <span>{p.avatar || '👤'}</span>
                      )}
                    </div>
                    <span className="truncate w-full text-center leading-none mt-1">{p.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Roast Box */}
            {chosenFriend && (
              <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="space-y-2 font-sans">
                <p className="text-xs text-white/50 font-black uppercase tracking-wider">2. Type Your Custom Roast</p>
                <textarea
                  value={roastText}
                  onChange={(e) => setRoastText(e.target.value)}
                  placeholder={`Why is ${players.find(p => p.id === chosenFriend)?.name} most likely to do this? Be funny...`}
                  maxLength={120}
                  className="w-full h-20 bg-black/40 border-4 border-white/10 focus:border-green-500 rounded-xl text-white placeholder:text-white/20 outline-none p-3.5 font-bold resize-none text-sm transition-all"
                />
              </motion.div>
            )}

            {/* Predict Winner (Betting Board) */}
            {chosenFriend && roastText.trim() && (
              <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="space-y-2">
                <p className="text-xs text-white/50 font-black uppercase tracking-wider flex items-center gap-1">
                  <Coins size={14} className="text-yellow-500" />
                  <span>3. Place Secret Bet: Who gets the most votes?</span>
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {players.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setPredictedWinner(p.id)}
                      className={cn(
                        "p-2 rounded-xl border transition-all text-[11px] font-black uppercase",
                        predictedWinner === p.id 
                          ? "bg-yellow-500/20 border-yellow-500 text-yellow-400" 
                          : "bg-black/30 border-white/5 text-white/40"
                      )}>
                      {p.name}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Action propose */}
            <CartoonButton
              variant="green"
              size="lg"
              fullWidth
              onClick={handleSubmitRoast}
              disabled={!chosenFriend || !roastText.trim() || !predictedWinner}>
              🔒 File Accusation & Bet
            </CartoonButton>

          </motion.div>
        )}

        {/* PLAYING - Waiting state */}
        {isPlaying && !!state.submissions[myPlayer?.id || ''] && (
          <div className="text-center py-12 bg-black/20 border border-white/5 rounded-3xl space-y-3">
            <span className="text-4xl block animate-bounce">🔒</span>
            <h3 className="text-lg font-black text-white uppercase">Accusation Sealed!</h3>
            <p className="text-white/40 text-xs font-bold uppercase tracking-widest animate-pulse">Waiting for the jury roasts...</p>
          </div>
        )}

        {/* VOTING - Rate Roasts Anonymously */}
        {isVoting && !state.votes[myPlayer?.id || ''] && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 w-full font-sans">
            <div className="text-center">
              <h2 className="text-3xl font-black text-white leading-none uppercase tracking-tight italic">VOTE ON THE ROASTS</h2>
              <p className="text-white/50 text-[10px] font-black uppercase tracking-widest bg-white/5 border border-white/10 px-3 py-1 rounded-full inline-block mt-2">
                Click the funniest anonymous roast to target that player!
              </p>
            </div>

            <div className="space-y-3">
              {players.map((p) => {
                const sub = state.submissions[p.id] as any;
                if (!sub || !sub.roast) return null;

                return (
                  <motion.button
                    key={p.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleVote(p.id)}
                    className="w-full text-left p-5 rounded-2xl bg-black/50 border-2 border-white/10 hover:border-yellow-500/50 transition-all relative overflow-hidden group shadow-md flex items-center gap-3">
                    <div className="flex-1">
                      <span className="text-[10px] text-white/30 font-black uppercase tracking-widest block mb-1">Anonymous Roast:</span>
                      <p className="text-white text-md font-bold leading-normal italic">
                        "{sub.roast}"
                      </p>
                    </div>
                    <div className="bg-yellow-500/20 text-[#FFD93D] text-[9px] font-black px-2.5 py-1 rounded-md border border-[#FFD93D]/30 opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-wider">
                      Target!
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* VOTING - Waiting */}
        {isVoting && state.votes[myPlayer?.id || ''] && (
          <div className="text-center py-12 bg-black/20 border border-white/5 rounded-3xl space-y-2">
            <Award className="w-12 h-12 text-[#FFD93D] mx-auto animate-pulse" />
            <h3 className="text-lg font-black text-white uppercase tracking-tight">Verdict Cast!</h3>
            <p className="text-white/40 text-xs font-bold uppercase tracking-widest animate-pulse">Waiting for the final tallies...</p>
          </div>
        )}

        {/* RESULTS - Payouts & Roast Reveals */}
        {isResults && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6 w-full">
            
            {/* Bet Outcome Banner */}
            {betOutcome !== 'idle' && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={cn(
                  "p-4 rounded-2xl border-2 flex items-center justify-center gap-3 font-black uppercase text-sm tracking-wide shadow-xl",
                  betOutcome === 'won' 
                    ? "bg-[#2ECC71]/20 border-[#2ECC71] text-[#2ECC71]" 
                    : "bg-red-500/20 border-red-500 text-red-500"
                )}>
                <Coins size={18} />
                <span>{betOutcome === 'won' ? 'Secret Prediction Paid Out! +200 PTS' : 'Secret Prediction Lost!'}</span>
              </motion.div>
            )}

            {/* Verdict Roast details */}
            <StickerCard className="p-6" accentColor="gold" hover={false}>
              <p className="text-xs uppercase tracking-widest text-[#FFD93D] mb-4 font-bold text-center">
                Squad Roast Ledger
              </p>

              <div className="space-y-3 font-sans">
                {players.map((p) => {
                  const voteCount = Object.values(state.votes || {}).filter((v) => v === p.id).length;
                  const totalVotes = Object.keys(state.votes || {}).length;
                  const pct = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
                  const sub = state.submissions[p.id] as any;

                  return (
                    <div key={p.id} className="bg-black/30 border border-white/5 rounded-2xl p-4 relative overflow-hidden shadow-inner">
                      {/* Vote Progress Track */}
                      <div className="absolute inset-y-0 left-0 bg-[#FFD93D]/5 pointer-events-none" style={{ width: `${pct}%` }} />
                      
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-white/10">
                            {p.avatar && p.avatar.startsWith('http') ? (
                              <img src={p.avatar} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-sm">{p.avatar || '👤'}</span>
                            )}
                          </div>
                          <span className="text-white font-black text-sm uppercase leading-none">{p.name}</span>
                        </div>
                        <span className="text-[#FFD93D] font-black font-mono text-sm">{voteCount} Votes</span>
                      </div>

                      {sub && sub.roast && (
                        <p className="text-white/60 text-xs italic font-bold text-left leading-normal border-t border-white/5 pt-2 pl-2">
                          "{sub.roast}" — <span className="text-white/40 not-italic font-medium">Targeting {players.find(pl => pl.id === sub.targetId)?.name}</span>
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </StickerCard>

            <CartoonButton
              variant="green"
              size="lg"
              fullWidth
              onClick={nextRound}>
              Next Target 😈
            </CartoonButton>
          </motion.div>
        )}

      </div>
    </GameShell>
  );
}
