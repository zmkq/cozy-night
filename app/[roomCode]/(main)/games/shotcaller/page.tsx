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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function ShotcallerGame() {
  const params = useParams();
  const roomCode = params?.roomCode as string || '';
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [isRevealing, setIsRevealing] = useState(false);
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

  // Trigger round start transition
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

  // Trigger results reveal with epic win/fail
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

      // Persist score to permanent leaderboard!
      if (myPlayer?.score && myPlayer.score > 0) {
        import('@/app/actions').then(({ updateLeaderboardAction }) => {
          updateLeaderboardAction(roomCode, 'shotcaller', myPlayer.score);
        });
      }
    }
    if (!isResults) {
      hasTriggeredResults.current = false;
    }
  }, [
    isResults,
    roundData?.targetId,
    roundData?.outcomeIndex,
    players,
    decisionCard,
    triggerEpicWin,
    triggerEpicFail,
    myPlayer?.score,
  ]);

  // Dramatic reveal effect
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
          });
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isResults, roundData?.outcomeIndex, decisionCard]);

  const handleChooseTarget = () => {
    if (!selectedTarget || !isShotcaller) return;
    // Send to server via custom message
    submitAnswer({ type: 'shotcaller-choose', targetId: selectedTarget });
    setSelectedTarget(null);
  };

  const handleUseToken = (token: 'clutch' | 'sabotage' | 'shield') => {
    submitAnswer({ type: 'use-token', token, targetId: selectedTarget });
  };

  return (
    <GameShell title="Shotcaller 👑" gameId="shotcaller" score={myPlayer?.score}>
      <CountdownOverlay count={countdown} show={isCountdown && countdown > 0} />

      {/* Round Info */}
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
            className="space-y-6">
            <StickerCard
              className="p-6 text-center space-y-4"
              accentColor="purple">
              <div className="text-6xl animate-bounce">👑</div>
              <h2 className="text-2xl font-black text-white">
                Power. Paranoia. Chaos.
              </h2>
              <p className="text-white/60 font-medium">
                Each round, one player becomes the "Shotcaller". They decide the fate of everyone else. Good luck.
              </p>
            </StickerCard>

            {/* Players Ready */}
            <StickerCard className="p-4" accentColor="gold" hover={false}>
              <div className="text-xs text-white/40 mb-3 uppercase tracking-wider font-bold">
                Targets ({players.length})
              </div>
              <div className="flex flex-wrap gap-2">
                {players.map((p) => (
                  <div
                    key={p.id}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-xl border-2',
                      p.ready
                        ? 'bg-[#9B59B6]/20 border-[#9B59B6]'
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
                {myPlayer?.ready ? '✓ Ready for Chaos' : 'Ready Up'}
              </CartoonButton>

              {allReady && (
                <CartoonButton
                  variant="red"
                  size="lg"
                  fullWidth
                  onClick={() => startGame('shotcaller' as any)}>
                  👑 Start Shotcalling
                </CartoonButton>
              )}
            </div>
          </motion.div>
        )}

        {/* PLAYING - Shotcaller's Turn */}
        {isPlaying && isShotcaller && (
          <motion.div
            key="shotcaller-turn"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6">
            {/* Crown Banner */}
            <motion.div
              initial={{ y: -30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="relative group">
              <div className="absolute -inset-1 bg-linear-to-r from-purple-600 to-fuchsia-500 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
              <div className="relative px-7 py-8 bg-black/40 backdrop-blur-xl rounded-3xl border border-white/10 ring-1 ring-white/10 text-center">
                <Crown className="w-16 h-16 mx-auto text-purple-400 mb-4 animate-bounce drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]" />
                <h2 className="text-4xl font-black text-white uppercase tracking-tighter italic">
                  You are the Shotcaller
                </h2>
                <p className="text-purple-200/60 font-black uppercase tracking-[0.3em] text-[10px] mt-2">
                  Authority is Yours
                </p>
              </div>
            </motion.div>

            {/* Decision Card */}
            <motion.div
              initial={{ rotateY: 180, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              transition={{ delay: 0.3, type: 'spring' }}>
              <StickerCard
                className="p-6 text-center"
                accentColor="gold"
                hover={false}>
                <p className="text-xs text-white/40 uppercase tracking-wider mb-3 font-bold border border-white/10 rounded-full px-3 py-1 inline-block">
                  ⚡ Decision Card
                </p>
                <h2 className="text-xl md:text-2xl font-black text-white leading-tight">
                  {decisionCard?.text}
                </h2>

                {/* Possible Outcomes Preview */}
                <div className="mt-4 space-y-2">
                  {decisionCard?.outcomes?.map((o: any, i: number) => (
                    <div
                      key={i}
                      className={cn(
                        'text-xs px-3 py-1.5 rounded-full font-bold',
                        o.rare
                          ? 'bg-[#FFD93D]/20 text-[#FFD93D] border border-[#FFD93D]/30'
                          : 'bg-white/5 text-white/60'
                      )}>
                      {o.rare && <Sparkles size={10} className="inline mr-1" />}
                      {o.points > 0 ? `+${o.points}` : o.points} pts
                    </div>
                  ))}
                </div>
              </StickerCard>
            </motion.div>

            {/* Player Selection */}
            <div className="space-y-3">
              <p className="text-white/40 text-xs uppercase tracking-wider text-center font-bold">
                Choose your Target
              </p>
              {players
                .filter((p) => p.id !== myPlayer?.id)
                .map((p) => (
                  <motion.div
                    key={p.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}>
                    <StickerCard
                      className={cn(
                        'p-3 flex items-center gap-4 cursor-pointer transition-all',
                        selectedTarget === p.id
                          ? 'border-[#9B59B6] bg-[#9B59B6]/10'
                          : ''
                      )}
                      accentColor={
                        selectedTarget === p.id ? 'purple' : undefined
                      }
                      onClick={() => setSelectedTarget(p.id)}
                      hover>
                      <div className="w-12 h-12 rounded-full border border-white/20 overflow-hidden bg-white/10 flex items-center justify-center shrink-0">
                        {p.avatar && p.avatar.startsWith('http') ? (
                          <img
                            src={p.avatar}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-2xl">{p.avatar || '👤'}</span>
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-black text-white">{p.name}</p>
                        <p className="text-white/40 text-sm font-bold">
                          {p.score} pts
                        </p>
                      </div>
                      {selectedTarget === p.id && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-10 h-10 rounded-full bg-[#9B59B6] border-2 border-white flex items-center justify-center shadow-lg">
                          <Crosshair size={20} className="text-white" />
                        </motion.div>
                      )}
                    </StickerCard>
                  </motion.div>
                ))}
            </div>

            {/* Tokens */}
            <div className="flex gap-2 justify-center font-sans">
              {tokens.clutch && (
                <CartoonButton
                  variant="gold"
                  size="sm"
                  onClick={() => handleUseToken('clutch')}>
                  <Zap size={14} /> Clutch
                </CartoonButton>
              )}
              {tokens.shield && (
                <CartoonButton
                  variant="green"
                  size="sm"
                  onClick={() => handleUseToken('shield')}>
                  <Shield size={14} /> Shield
                </CartoonButton>
              )}
            </div>

            {/* Confirm Button */}
            <CartoonButton
              variant="red"
              size="lg"
              fullWidth
              onClick={handleChooseTarget}
              className="font-sans"
              disabled={!selectedTarget}>
              ⚡ Execute Decision
            </CartoonButton>
          </motion.div>
        )}

        {/* PLAYING - Waiting for Shotcaller */}
        {isPlaying && !isShotcaller && (
          <motion.div
            key="waiting-shotcaller"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center space-y-6 py-8">
            {/* Shotcaller Info */}
            <StickerCard className="p-6" accentColor="purple" hover={false}>
              <Crown className="w-16 h-16 mx-auto text-[#9B59B6] mb-4 animate-pulse" />
              <h2 className="text-xl font-bold text-white">
                The Shotcaller is deciding...
              </h2>
              <div className="flex items-center justify-center gap-3 mt-4">
                <div className="w-14 h-14 rounded-full border-2 border-[#9B59B6] overflow-hidden bg-white/10 flex items-center justify-center shrink-0">
                  {shotcaller?.avatar && shotcaller.avatar.startsWith('http') ? (
                    <img
                      src={shotcaller.avatar}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl">{shotcaller?.avatar || '👤'}</span>
                  )}
                </div>
                <span className="text-2xl font-black text-[#9B59B6]">
                  {shotcaller?.name}
                </span>
              </div>
            </StickerCard>

            {/* Card Preview if public */}
            {decisionCard?.showToAll && (
              <StickerCard className="p-4" accentColor="gold" hover={false}>
                <p className="text-xs text-white/40 uppercase tracking-wider mb-2 font-bold bg-white/5 inline-block px-2 py-0.5 rounded-full">
                  The Card
                </p>
                <p className="text-white font-black text-lg">
                  {decisionCard.text}
                </p>
              </StickerCard>
            )}

            {/* Your Tokens */}
            <StickerCard className="p-4" accentColor="white" hover={false}>
              <p className="text-xs text-white/40 uppercase tracking-wider mb-4 font-bold">
                Your Tokens
              </p>
              <div className="flex gap-3 justify-center">
                <div
                  className={cn(
                    'px-4 py-2 rounded-xl border-2 font-bold flex items-center gap-2',
                    tokens.clutch
                      ? 'bg-[#FFD93D]/20 text-[#FFD93D] border-[#FFD93D]'
                      : 'bg-white/5 text-white/30 border-white/10'
                  )}>
                  <Zap size={16} /> Clutch
                </div>
                <div
                  className={cn(
                    'px-4 py-2 rounded-xl border-2 font-bold flex items-center gap-2',
                    tokens.sabotage
                      ? 'bg-[#FF4D6A]/20 text-[#FF4D6A] border-[#FF4D6A]'
                      : 'bg-white/5 text-white/30 border-white/10'
                  )}>
                  <Crosshair size={16} /> Sabotage
                </div>
                <div
                  className={cn(
                    'px-4 py-2 rounded-xl border-2 font-bold flex items-center gap-2',
                    tokens.shield
                      ? 'bg-[#2ECC71]/20 text-[#2ECC71] border-[#2ECC71]'
                      : 'bg-white/5 text-white/30 border-white/10'
                  )}>
                  <Shield size={16} /> Shield
                </div>
              </div>
            </StickerCard>

            <p className="text-white/40 animate-pulse font-bold">
              Pray it is not your turn...
            </p>
          </motion.div>
        )}

        {/* RESULTS */}
        {isResults && (
          <motion.div
            key="results"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6">
            {/* Dramatic Reveal */}
            {isRevealing ? (
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center py-12">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 10, 0] }}
                  transition={{ repeat: Infinity, duration: 0.5 }}
                  className="text-8xl">
                  🎲
                </motion.div>
                <p className="text-white/60 mt-6 animate-pulse font-bold text-xl">
                  What is the outcome...
                </p>
              </motion.div>
            ) : (
              <>
                {/* Outcome Card */}
                <motion.div
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}>
                  <StickerCard
                    className="p-6 text-center"
                    accentColor={
                      decisionCard?.outcomes?.[roundData?.outcomeIndex]?.rare
                        ? 'gold'
                        : 'purple'
                    }
                    hover={false}>
                    {decisionCard?.outcomes?.[roundData?.outcomeIndex]
                      ?.rare && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="inline-block bg-[#FFD93D] text-black px-3 py-1 rounded-full text-xs font-black mb-4 border-2 border-white shadow-lg transform -rotate-3">
                        ⭐ Rare Outcome
                      </motion.div>
                    )}
                    <h2 className="text-2xl font-black text-white mb-4 leading-normal">
                      {roundData?.eventMessage}
                    </h2>
                    <div className="flex items-center justify-center gap-3 text-white/60 text-lg font-bold bg-white/5 p-3 rounded-xl border border-white/10">
                      <div className="w-10 h-10 rounded-full border border-white/20 overflow-hidden bg-white/10 flex items-center justify-center shrink-0">
                        {shotcaller?.avatar && shotcaller.avatar.startsWith('http') ? (
                          <img
                            src={shotcaller.avatar}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-lg">{shotcaller?.avatar || '👤'}</span>
                        )}
                      </div>
                      <span className="text-sm">chose</span>
                      <div className="w-10 h-10 rounded-full border border-white/20 overflow-hidden bg-white/10 flex items-center justify-center shrink-0">
                        {(() => {
                          const target = players.find(
                            (p) => p.id === roundData?.targetId
                          );
                          if (!target) return null;
                          return target.avatar && target.avatar.startsWith('http') ? (
                            <img
                              src={target.avatar}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-lg">{target.avatar || '👤'}</span>
                          );
                        })()}
                      </div>
                    </div>
                  </StickerCard>
                </motion.div>

                {/* Timeline Event */}
                {roundData?.timeline?.length > 0 && (
                  <StickerCard
                    className="p-4"
                    accentColor="white"
                    hover={false}>
                    <p className="text-xs text-white/40 uppercase tracking-wider mb-2 font-black flex items-center gap-2">
                      <span className="text-xl">📜</span> History Logs
                    </p>
                    <p className="text-white text-sm italic font-medium">
                      "
                      {
                        roundData.timeline[roundData.timeline.length - 1]
                          ?.message
                      }
                      "
                    </p>
                  </StickerCard>
                )}

                {/* Scoreboard */}
                <StickerCard className="p-5" accentColor="gold" hover={false}>
                  <p className="text-xs text-white/40 uppercase tracking-wider mb-4 font-bold">
                    Leaderboard
                  </p>
                  <div className="space-y-3">
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
                          <div className="w-10 h-10 rounded-full border border-white/20 overflow-hidden bg-white/10 flex items-center justify-center shrink-0">
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
                        </motion.div>
                      ))}
                  </div>
                </StickerCard>

                <CartoonButton
                  variant="green"
                  size="lg"
                  fullWidth
                  onClick={nextRound}
                  className="font-sans">
                  {state.round >= 6 ? 'Crown the Winner' : 'Next Round →'}
                </CartoonButton>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </GameShell>
  );
}
