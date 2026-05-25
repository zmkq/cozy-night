'use client';

import { useState, useEffect, useRef } from 'react';
import { StickerCard } from '@/components/christmas/StickerCard';
import { CartoonButton } from '@/components/christmas/CartoonButton';
import { GameShell } from '@/components/christmas/GameShell';
import { CountdownOverlay } from '@/components/games/CountdownOverlay';
import { useGameTransitions } from '@/components/games/TransitionProvider';
import { usePartyContext } from '@/hooks/PartyProvider';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Crown,
  Zap,
  Shield,
  Crosshair,
  Sparkles,
  ArrowLeft,
  Coins,
  Skull,
  Play,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';
import { useParams } from 'next/navigation';

export default function ShotcallerGame() {
  const params = useParams();
  const roomCode = params?.roomCode as string || '';
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [isRevealing, setIsRevealing] = useState(false);
  const [isCardHovered, setIsCardHovered] = useState(false);
  const hasTriggeredRoundStart = useRef(false);
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
    triggerEpicWin,
    triggerEpicFail,
    triggerFinalRound,
  } = useGameTransitions();

  const roundData = state.roundData as any;
  const isLobby = state.phase === 'lobby' || state.currentGame !== 'shotcaller';
  const isCountdown = state.phase === 'countdown';
  const isPlaying = state.phase === 'playing';
  const isResults = state.phase === 'results';
  const allReady = players.length >= 2 && players.every((p) => p.ready);

  const isShotcaller = myPlayer?.id === roundData?.shotcallerId;
  const shotcaller = players.find((p) => p.id === roundData?.shotcallerId);
  const decisionCard = roundData?.decisionCard;
  const tokens = roundData?.tokens?.[myPlayer?.id || ''] || {
    clutch: false,
    sabotage: false,
    shield: false,
  };

  // Trigger round transitions
  useEffect(() => {
    if (isPlaying && !hasTriggeredRoundStart.current && state.round > 0) {
      hasTriggeredRoundStart.current = true;
      if (state.round === 6) {
        triggerFinalRound(state.round, 6);
      } else {
        triggerRoundStart(state.round, 6);
      }
    }
    if (!isPlaying) {
      hasTriggeredRoundStart.current = false;
    }
  }, [isPlaying, state.round, triggerRoundStart, triggerFinalRound]);

  // Trigger results reveal
  useEffect(() => {
    if (isResults && !hasTriggeredResults.current && roundData?.targetId) {
      hasTriggeredResults.current = true;

      const targetPlayer = players.find((p) => p.id === roundData.targetId);
      const outcome = decisionCard?.outcomes?.[roundData?.outcomeIndex];

      if (targetPlayer && outcome) {
        if (outcome.points > 200 || outcome.rare) {
          triggerEpicWin(targetPlayer.name);
        } else if (outcome.points < -200) {
          triggerEpicFail(targetPlayer.name);
        }
      }

      // Save score
      if (myPlayer?.score && myPlayer.score > 0) {
        import('@/app/actions').then(({ updateLeaderboardAction }) => {
          updateLeaderboardAction(roomCode, 'shotcaller', myPlayer.score);
        });
      }
    }
    if (!isResults) {
      hasTriggeredResults.current = false;
    }
  }, [isResults, roundData?.targetId, roundData?.outcomeIndex, players, decisionCard, triggerEpicWin, triggerEpicFail, myPlayer?.score, roomCode]);

  // Spin/Flipping animations in results
  useEffect(() => {
    if (isResults && roundData?.outcomeIndex !== undefined) {
      setIsRevealing(true);
      const isRare = decisionCard?.outcomes?.[roundData.outcomeIndex]?.rare;

      const timer = setTimeout(() => {
        setIsRevealing(false);
        if (isRare) {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#FFD93D', '#9B59B6', '#FF4D6A'],
          });
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isResults, roundData?.outcomeIndex, decisionCard]);

  const handleChooseTarget = () => {
    if (!selectedTarget || !isShotcaller) return;
    submitAnswer({ type: 'shotcaller-choose', targetId: selectedTarget });
    setSelectedTarget(null);
  };

  const handleUseToken = (token: 'clutch' | 'sabotage' | 'shield') => {
    submitAnswer({ type: 'use-token', token, targetId: selectedTarget });
  };

  return (
    <GameShell title="Shotcaller 👑" gameId="shotcaller" score={myPlayer?.score}>
      <CountdownOverlay count={countdown} show={isCountdown && countdown > 0} />

      {/* Round HUD */}
      <div className="text-center mb-4 font-sans">
        <p className="text-white/40 text-xs font-bold uppercase tracking-wider bg-white/5 border border-white/10 px-3 py-1 rounded-full inline-block">
          Round {state.round} / 6
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
              <div className="absolute inset-0 bg-linear-to-br from-purple-600/15 via-transparent to-fuchsia-600/15 pointer-events-none" />
              <div className="text-6xl animate-bounce">👑</div>
              <h2 className="text-3xl font-black text-white uppercase italic leading-none">
                SQUAD SHOTCALLER
              </h2>
              <p className="text-white/60 text-xs font-bold leading-normal uppercase tracking-wide">
                Draw Chaos Cards to modify the scores of the squad. Play counter tokens to shield negative effects or double down on point swaps!
              </p>
            </StickerCard>

            <StickerCard className="p-4" accentColor="gold" hover={false}>
              <div className="text-xs text-white/40 mb-3 uppercase tracking-wider font-bold">
                Syndicate Candidates ({players.length})
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
                    {p.ready && <Crown size={14} className="text-[#9B59B6]" />}
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
                {myPlayer?.ready ? '✓ Armed for Chaos' : 'Enter Lobby'}
              </CartoonButton>

              {allReady && (
                <CartoonButton
                  variant="red"
                  size="lg"
                  fullWidth
                  onClick={() => startGame('shotcaller' as any)}>
                  👑 Initiate Decree
                </CartoonButton>
              )}
            </div>
          </motion.div>
        )}

        {/* PLAYING - Shotcaller choosing target */}
        {isPlaying && isShotcaller && (
          <motion.div
            key="shotcaller-turn"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6 max-w-lg mx-auto font-sans">
            
            {/* Interactive Floating Card */}
            <motion.div
              animate={isCardHovered ? { y: -8, scale: 1.02, rotate: 1 } : { y: 0, scale: 1, rotate: 0 }}
              onMouseEnter={() => setIsCardHovered(true)}
              onMouseLeave={() => setIsCardHovered(false)}
              className="relative cursor-pointer group">
              <div className="absolute -inset-1.5 bg-linear-to-r from-yellow-500 to-amber-500 rounded-[2.5rem] blur opacity-30 group-hover:opacity-60 transition duration-500" />
              <StickerCard
                className="p-8 text-center bg-[#0d0d11] border-4 border-[#FFD93D] shadow-2xl relative overflow-hidden"
                accentColor="gold"
                hover={false}>
                <div className="absolute inset-0 bg-radial-to-b from-yellow-500/10 to-transparent pointer-events-none" />
                <span className="text-[10px] text-yellow-400 font-black uppercase tracking-[0.4em] block mb-3">
                  Chaos Lord Decree
                </span>
                
                <h2 className="text-2xl md:text-3xl font-black text-white leading-tight uppercase italic drop-shadow-md">
                  {decisionCard?.text}
                </h2>

                <div className="mt-6 flex justify-center gap-3">
                  {decisionCard?.outcomes?.map((o: any, i: number) => (
                    <div
                      key={i}
                      className={cn(
                        'text-[10px] font-black uppercase px-3 py-1.5 rounded-full border',
                        o.rare
                          ? 'bg-[#FFD93D]/20 text-[#FFD93D] border-[#FFD93D]/30 shadow-[0_0_10px_rgba(255,217,61,0.2)]'
                          : 'bg-white/5 text-white/50 border-white/5'
                      )}>
                      {o.rare && <Sparkles size={10} className="inline mr-1" />}
                      {o.points > 0 ? `+${o.points}` : o.points} pts
                    </div>
                  ))}
                </div>
              </StickerCard>
            </motion.div>

            {/* Target Select board */}
            <div className="space-y-3">
              <p className="text-white/40 text-xs font-black uppercase tracking-widest text-center">
                Select Target Candidate
              </p>
              
              <div className="space-y-2">
                {players
                  .filter((p) => p.id !== myPlayer?.id)
                  .map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedTarget(p.id)}
                      className={cn(
                        'w-full p-4 rounded-2xl border-4 transition-all flex items-center gap-4 relative overflow-hidden',
                        selectedTarget === p.id
                          ? 'bg-purple-500/20 border-purple-500 text-white shadow-xl'
                          : 'bg-black/40 border-white/10 text-white/60 hover:border-white/20'
                      )}>
                      <div className="w-10 h-10 rounded-full border-2 border-white/25 overflow-hidden bg-white/10 shrink-0">
                        {p.avatar && p.avatar.startsWith('http') ? (
                          <img src={p.avatar} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-lg">{p.avatar || '👤'}</span>
                        )}
                      </div>
                      
                      <div className="flex-1 text-left">
                        <p className="font-black text-sm uppercase leading-none">{p.name}</p>
                        <p className="text-white/40 text-xs font-bold uppercase mt-1">{p.score} Points</p>
                      </div>

                      {selectedTarget === p.id && (
                        <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center border-2 border-white shadow-md">
                          <Crosshair size={16} className="text-white" />
                        </div>
                      )}
                    </button>
                  ))}
              </div>
            </div>

            {/* Skill Tokens bar */}
            <div className="flex gap-2 justify-center font-sans border-t border-white/5 pt-4">
              {tokens.clutch && (
                <CartoonButton
                  variant="gold"
                  size="sm"
                  onClick={() => handleUseToken('clutch')}>
                  <Zap size={14} className="mr-1" /> Clutch Card
                </CartoonButton>
              )}
              {tokens.shield && (
                <CartoonButton
                  variant="green"
                  size="sm"
                  onClick={() => handleUseToken('shield')}>
                  <Shield size={14} className="mr-1" /> Shield Card
                </CartoonButton>
              )}
            </div>

            <CartoonButton
              variant="red"
              size="lg"
              fullWidth
              onClick={handleChooseTarget}
              disabled={!selectedTarget}>
              ⚡ Execute Chaos Decree
            </CartoonButton>
          </motion.div>
        )}

        {/* PLAYING - Waiting for Shotcaller */}
        {isPlaying && !isShotcaller && (
          <motion.div
            key="waiting-shotcaller"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center space-y-6 py-8 max-w-md mx-auto font-sans">
            
            <StickerCard className="p-6 relative overflow-hidden" accentColor="purple" hover={false}>
              <div className="absolute inset-0 bg-linear-to-b from-purple-500/10 to-transparent pointer-events-none" />
              <Crown className="w-16 h-16 mx-auto text-purple-400 mb-4 animate-pulse" />
              <h2 className="text-xl font-black text-white uppercase tracking-tight">
                THE SHOTCALLER IS DECIDING
              </h2>
              
              <div className="flex items-center justify-center gap-3 mt-4">
                <div className="w-12 h-12 rounded-full border-2 border-purple-500 overflow-hidden bg-white/10 shrink-0">
                  {shotcaller?.avatar && shotcaller.avatar.startsWith('http') ? (
                    <img src={shotcaller.avatar} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl">{shotcaller?.avatar || '👤'}</span>
                  )}
                </div>
                <span className="text-xl font-black text-purple-400 uppercase italic">
                  {shotcaller?.name}
                </span>
              </div>
            </StickerCard>

            {/* Public details card */}
            {decisionCard?.showToAll && (
              <StickerCard className="p-4" accentColor="gold" hover={false}>
                <span className="text-[10px] text-yellow-500 font-black uppercase tracking-widest bg-yellow-500/10 border border-yellow-500/20 px-3 py-1 rounded-full mb-3 inline-block">
                  Active Chaos Card
                </span>
                <p className="text-white font-black text-lg italic leading-tight">
                  "{decisionCard.text}"
                </p>
              </StickerCard>
            )}

            {/* Skills Status */}
            <StickerCard className="p-4 bg-black/40 border border-white/10 shadow-2xl rounded-2xl" hover={false}>
              <p className="text-xs text-white/40 uppercase tracking-widest mb-4 font-black">
                Active Deck Tokens
              </p>
              <div className="flex gap-2 justify-center text-xs font-black uppercase">
                <div className={cn(
                  'px-3.5 py-2 rounded-xl border flex items-center gap-1.5 transition-all',
                  tokens.clutch ? 'bg-[#FFD93D]/20 text-[#FFD93D] border-[#FFD93D]/30' : 'bg-white/5 text-white/20 border-white/5'
                )}>
                  <Zap size={14} /> Clutch
                </div>
                <div className={cn(
                  'px-3.5 py-2 rounded-xl border flex items-center gap-1.5 transition-all',
                  tokens.sabotage ? 'bg-red-500/20 text-red-500 border-red-500/30' : 'bg-white/5 text-white/20 border-white/5'
                )}>
                  <Skull size={14} /> Sabotage
                </div>
                <div className={cn(
                  'px-3.5 py-2 rounded-xl border flex items-center gap-1.5 transition-all',
                  tokens.shield ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-white/5 text-white/20 border-white/5'
                )}>
                  <Shield size={14} /> Shield
                </div>
              </div>
            </StickerCard>
          </motion.div>
        )}

        {/* RESULTS */}
        {isResults && (
          <motion.div
            key="results"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6 max-w-md mx-auto">
            
            {/* Spinning/flipping suspense */}
            {isRevealing ? (
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center py-12 space-y-4">
                <motion.div
                  animate={{ rotateY: [0, 180, 360], scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 0.6 }}
                  className="text-7xl">
                  🎭
                </motion.div>
                <p className="text-white/40 text-xs font-black uppercase tracking-widest animate-pulse">
                  Unveiling Decree Outcomes...
                </p>
              </motion.div>
            ) : (
              <>
                {/* Result Card */}
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                  <StickerCard
                    className="p-6 text-center relative overflow-hidden"
                    accentColor={decisionCard?.outcomes?.[roundData?.outcomeIndex]?.rare ? 'gold' : 'purple'}
                    hover={false}>
                    {decisionCard?.outcomes?.[roundData?.outcomeIndex]?.rare && (
                      <div className="inline-block bg-[#FFD93D] text-black px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider mb-4 border-2 border-white shadow-lg transform -rotate-3">
                        ⭐ Rare Event
                      </div>
                    )}
                    <h2 className="text-2xl font-black text-white leading-normal uppercase italic mb-6">
                      {roundData?.eventMessage}
                    </h2>
                    
                    <div className="flex items-center justify-center gap-3 text-white/50 text-xs font-black bg-black/40 border border-white/5 p-3 rounded-2xl">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-white/10 shrink-0">
                        {shotcaller?.avatar && shotcaller.avatar.startsWith('http') ? (
                          <img src={shotcaller.avatar} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-sm">{shotcaller?.avatar || '👤'}</span>
                        )}
                      </div>
                      <span className="uppercase tracking-widest text-[10px]">decreed</span>
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-white/10 shrink-0">
                        {(() => {
                          const target = players.find((p) => p.id === roundData?.targetId);
                          if (!target) return null;
                          return target.avatar && target.avatar.startsWith('http') ? (
                            <img src={target.avatar} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-sm">{target.avatar || '👤'}</span>
                          );
                        })()}
                      </div>
                    </div>
                  </StickerCard>
                </motion.div>

                {/* Timeline Ledger */}
                {roundData?.timeline?.length > 0 && (
                  <StickerCard className="p-4" accentColor="white" hover={false}>
                    <p className="text-xs text-white/40 uppercase tracking-widest mb-2 font-black flex items-center gap-1.5 justify-center">
                      <span>📜</span>
                      <span>Decree Log</span>
                    </p>
                    <p className="text-white text-sm italic font-bold text-center">
                      "{roundData.timeline[roundData.timeline.length - 1]?.message}"
                    </p>
                  </StickerCard>
                )}

                {/* Leaderboard standings */}
                <StickerCard className="p-5" accentColor="gold" hover={false}>
                  <p className="text-xs text-white/40 uppercase tracking-widest mb-4 font-black text-center">
                    Current Standings
                  </p>
                  <div className="space-y-3 font-sans">
                    {[...players]
                      .sort((a, b) => b.score - a.score)
                      .map((p, i) => (
                        <div
                          key={p.id}
                          className="flex items-center gap-3 bg-white/5 p-2 rounded-xl border border-white/5">
                          {i === 0 ? (
                            <Crown size={16} className="text-[#FFD93D]" />
                          ) : (
                            <span className="w-4 text-center text-white/20 font-black text-sm font-mono">{i + 1}</span>
                          )}
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-white/5 flex items-center justify-center shrink-0">
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
                  onClick={nextRound}
                  className="font-sans">
                  {state.round >= 6 ? 'Declare Champion 👑' : 'Next Decree →'}
                </CartoonButton>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </GameShell>
  );
}
