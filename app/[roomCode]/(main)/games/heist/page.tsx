'use client';

import { useState, useEffect, useRef } from 'react';
import { StickerCard } from '@/components/christmas/StickerCard';
import { CartoonButton } from '@/components/christmas/CartoonButton';
import { GameShell } from '@/components/christmas/GameShell';
import { usePartyContext } from '@/hooks/PartyProvider';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Timer,
  Shield,
  Zap,
  Swords,
  Skull,
  Eye,
  EyeOff,
  ThumbsUp,
  ThumbsDown,
  UserPlus,
  ShieldAlert,
  FastForward,
} from 'lucide-react';
import { CountdownOverlay } from '@/components/games/CountdownOverlay';
import { cn } from '@/lib/utils';
import { HeistPhase } from '@/hooks/useParty';

export default function HeistGame() {
  const [showRole, setShowRole] = useState(false);

  const {
    state,
    players,
    myPlayer,
    myRole, // generic role, ignore
    startGame,
    nextRound, // We might need custom next round logic
    vote, // generic vote
    submitAnswer,
    countdown,
    setReady,
  } = usePartyContext();

  const heist = state.heistState;
  const isHeist = state.currentGame === 'heist';

  // ---- ACTIONS ----
  const sendHeistMissionSelect = (operativeIds: string[]) => {
    submitAnswer({ type: 'heist-mission-select', operativeIds });
  };
  const sendHeistVote = (voteVal: 'approve' | 'reject') => {
    submitAnswer({ type: 'heist-vote', vote: voteVal });
  };
  const sendHeistAction = (action: 'commit' | 'sabotage') => {
    submitAnswer({ type: 'heist-action', action });
  };
  const sendHeistAccusation = (targetId: string) => {
    submitAnswer({ type: 'heist-accusation', targetId });
  };
  const sendHeistContinue = () => {
    submitAnswer({ type: 'heist-continue' });
  };
  const sendHeistStartAccusation = () => {
    submitAnswer({ type: 'heist-start-accusation' });
  };
  const sendAdminEndGame = () => {
    if (confirm('Are you sure you want to end the game for everyone?')) {
      submitAnswer({ type: 'admin-end-game' });
    }
  };
  const sendAdminForceNext = () => {
    if (
      confirm('FORCE NEXT PHASE? This will auto-complete voting/execution.')
    ) {
      submitAnswer({ type: 'admin-force-next' });
    }
  };

  // ---- STATE HELPERS ----
  const phase = heist?.phase;
  const myHeistRole = heist?.roles[myPlayer?.id || ''] || 'crew';
  const isSnitch = myHeistRole === 'snitch';
  const playerIds = heist ? Object.keys(heist.roles).sort() : [];
  const leaderId = heist ? playerIds[heist.leaderIndex] : null;
  const isLeader = myPlayer?.id === leaderId;
  const isHost = myPlayer?.id === state.hostId;

  // Local state for implementation
  const [selectedOperatives, setSelectedOperatives] = useState<string[]>([]);

  // Effect to reset selection on new round
  useEffect(() => {
    if (phase === 'briefing') setSelectedOperatives([]);
  }, [heist?.currentMission?.id, phase]);

  // ---- RENDER ----

  const isLobby = state.phase === 'lobby' || state.currentGame !== 'heist';
  const isCountdown = state.phase === 'countdown';
  const isLoading = !heist && !isLobby && !isCountdown;
  const allReady = players.length >= 2 && players.every((p) => p.ready);

  return (
    <GameShell title="The Heist 💰" gameId="heist" score={0}>
      <CountdownOverlay count={countdown} show={isCountdown} />

      <AnimatePresence mode="wait">
        {/* LOBBY VIEW */}
        {isLobby && (
          <motion.div
            key="lobby"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6">
            <div className="text-center mb-4">
              <p className="text-white/40 text-xs font-bold uppercase tracking-wider bg-white/5 border border-white/10 px-3 py-1 rounded-full inline-block">
                Lobby
              </p>
            </div>

            <StickerCard
              className="p-8 text-center space-y-4"
              accentColor="gold">
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter">
                The Heist
              </h2>
              <p className="text-white/40 text-xs font-bold uppercase tracking-wide max-w-sm mx-auto">
                One Snitch. A crew of thieves. Complete missions, minimal heat.
                Find the rat before it's too late.
              </p>
            </StickerCard>

            <StickerCard className="p-4" accentColor="gold" hover={false}>
              <div className="text-xs text-white/40 mb-3 uppercase tracking-wider font-bold">
                The Crew ({players.length})
              </div>
              <div className="flex flex-wrap gap-2">
                {players.map((p) => (
                  <div
                    key={p.id}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all',
                      p.ready
                        ? 'bg-green-500/20 border-green-500'
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
                      <ThumbsUp size={14} className="text-green-500" />
                    )}
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
                {myPlayer?.ready ? '✓ Ready to Steal' : 'Mark Ready'}
              </CartoonButton>

              {allReady && (
                <CartoonButton
                  variant="red"
                  size="lg"
                  fullWidth
                  onClick={() => startGame('heist')}>
                  🚀 Start Heist
                </CartoonButton>
              )}
            </div>
          </motion.div>
        )}

        {/* LOADING STATE - Only show if not lobby/countdown and heist state missing */}
        {isLoading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center min-h-[50vh] text-white text-center">
            <div className="text-4xl animate-spin mb-4">⚙️</div>
            <h2 className="text-xl font-bold mb-2">Loading Heist...</h2>
            <p className="opacity-50 text-xs">Waiting for server sync</p>
          </motion.div>
        )}

        {/* MAIN GAME View */}
        {!isLobby && !isLoading && heist && (
          <motion.div
            key="game"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6">
            {/* Meters Header */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <StickerCard
                className="p-3 flex items-center justify-between"
                accentColor="green"
                hover={false}>
                <div className="text-xs font-bold text-green-400 uppercase">
                  Success
                </div>
                <div className="text-2xl font-black text-white">
                  {heist.meters.success}/{heist.meters.successTarget}
                </div>
              </StickerCard>
              <StickerCard
                className="p-3 flex items-center justify-between"
                accentColor="red"
                hover={false}>
                <div className="text-xs font-bold text-red-400 uppercase">
                  Heat
                </div>
                <div className="text-2xl font-black text-white">
                  {heist.meters.heat}/{heist.meters.heatMax}
                </div>
              </StickerCard>
            </div>

            <div className="text-center mb-4">
              <span className="bg-white/10 text-white/60 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border border-white/5">
                Round {state.round}
              </span>
            </div>

            {/* GAME PHASES */}
            <AnimatePresence mode="wait">
              {/* BRIEFING */}
              {phase === 'briefing' && (
                <motion.div
                  key="briefing"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4">
                  <StickerCard
                    className="p-6 text-center"
                    accentColor="gold"
                    hover={false}>
                    <div className="text-xs text-gold-400 font-bold uppercase tracking-widest mb-2">
                      Current Mission
                    </div>
                    <h2 className="text-3xl font-black text-white mb-1">
                      {heist.currentMission?.title}
                    </h2>
                    <p className="text-white/50 text-sm font-medium italic mb-6">
                      "{heist.currentMission?.brief}"
                    </p>
                    <div className="flex justify-center gap-8 text-sm font-bold text-white/80">
                      <div className="flex flex-col items-center">
                        <UserPlus size={20} className="mb-1 text-blue-400" />
                        <span>
                          Need {heist.currentMission?.operativesRequired}
                        </span>
                      </div>
                    </div>
                  </StickerCard>

                  {isLeader ? (
                    <div className="space-y-4">
                      <p className="text-center text-white/60 text-xs font-bold uppercase">
                        You are the Leader. Select Operatives.
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {players.map((p) => {
                          const isSelected = selectedOperatives.includes(p.id);
                          return (
                            <button
                              key={p.id}
                              onClick={() => {
                                if (isSelected)
                                  setSelectedOperatives((prev) =>
                                    prev.filter((id) => id !== p.id)
                                  );
                                else if (
                                  selectedOperatives.length <
                                  (heist.currentMission?.operativesRequired ||
                                    0)
                                ) {
                                  setSelectedOperatives((prev) => [
                                    ...prev,
                                    p.id,
                                  ]);
                                }
                              }}
                              className={cn(
                                'p-3 rounded-xl border-2 transition-all flex items-center gap-2',
                                isSelected
                                  ? 'bg-blue-500/20 border-blue-500'
                                  : 'bg-white/5 border-white/10 hover:bg-white/10'
                              )}>
                              <div
                                className={cn(
                                  'w-4 h-4 rounded-full border flex items-center justify-center',
                                  isSelected
                                    ? 'bg-blue-500 border-blue-500'
                                    : 'border-white/20'
                                )}>
                                {isSelected && (
                                  <div className="w-2 h-2 bg-white rounded-full" />
                                )}
                              </div>
                              <span className="font-bold text-white text-sm truncate">
                                {p.name}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                      <CartoonButton
                        variant="gold"
                        fullWidth
                        disabled={
                          selectedOperatives.length !==
                          heist.currentMission?.operativesRequired
                        }
                        onClick={() =>
                          sendHeistMissionSelect(selectedOperatives)
                        }>
                        Propose Team
                      </CartoonButton>
                    </div>
                  ) : (
                    <div className="text-center py-8 opacity-50">
                      <p className="text-sm font-bold text-white">
                        Waiting for Leader (
                        {players.find((p) => p.id === leaderId)?.name}) to
                        select team...
                      </p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* VOTING */}
              {phase === 'voting' && (
                <motion.div
                  key="voting"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4">
                  <div className="text-center space-y-2">
                    <h3 className="text-xl font-black text-white">
                      Mission Proposed
                    </h3>
                    <div className="flex justify-center gap-2">
                      {heist.selectedOperatives.map((id) => {
                        const p = players.find((pl) => pl.id === id);
                        return (
                          <span
                            key={id}
                            className="px-3 py-1 bg-white/10 rounded-full text-xs font-bold border border-white/10">
                            {p?.name}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {!heist.votes[myPlayer?.id || ''] ? (
                    <div className="flex gap-4 pt-4">
                      <CartoonButton
                        variant="red"
                        className="flex-1"
                        onClick={() => sendHeistVote('reject')}>
                        <ThumbsDown size={20} className="mr-2" /> Reject
                      </CartoonButton>
                      <CartoonButton
                        variant="green"
                        className="flex-1"
                        onClick={() => sendHeistVote('approve')}>
                        <ThumbsUp size={20} className="mr-2" /> Approve
                      </CartoonButton>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-white/60 font-bold animate-pulse">
                        Waiting for others...
                      </p>
                    </div>
                  )}
                  <div className="flex flex-wrap justify-center gap-1 mt-4 opacity-50">
                    {players.map((p) => (
                      <div
                        key={p.id}
                        className={cn(
                          'w-2 h-2 rounded-full',
                          heist.votes[p.id] ? 'bg-white' : 'bg-white/20'
                        )}
                      />
                    ))}
                  </div>
                </motion.div>
              )}

              {/* EXECUTION */}
              {phase === 'execution' && (
                <motion.div
                  key="execution"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-6 text-center">
                  <h3 className="text-2xl font-black text-white uppercase italic">
                    Mission in Progress...
                  </h3>
                  {heist.selectedOperatives.includes(myPlayer?.id || '') ? (
                    <StickerCard className="p-6" accentColor="red">
                      {!heist.actions[myPlayer?.id || ''] ? (
                        <div className="space-y-4">
                          <p className="text-sm font-bold text-white/80">
                            You are on the mission. Choose your action.
                          </p>
                          <div className="grid grid-cols-1 gap-3">
                            <CartoonButton
                              variant="green"
                              onClick={() => sendHeistAction('commit')}>
                              <div className="flex items-center justify-center gap-2">
                                <ShieldAlert size={20} />
                                <div className="text-left">
                                  <div className="text-sm font-black">
                                    Success
                                  </div>
                                  <div className="text-[10px] opacity-80 font-medium">
                                    Help the crew win
                                  </div>
                                </div>
                              </div>
                            </CartoonButton>
                            {isSnitch && (
                              <CartoonButton
                                variant="red"
                                onClick={() => sendHeistAction('sabotage')}>
                                <div className="flex items-center justify-center gap-2">
                                  <Skull size={20} />
                                  <div className="text-left">
                                    <div className="text-sm font-black">
                                      Sabotage
                                    </div>
                                    <div className="text-[10px] opacity-80 font-medium">
                                      Add Heat + Fail
                                    </div>
                                  </div>
                                </div>
                              </CartoonButton>
                            )}
                          </div>
                        </div>
                      ) : (
                        <p className="font-bold text-green-400">
                          Action Locked In.
                        </p>
                      )}
                    </StickerCard>
                  ) : (
                    <div className="p-8 border-2 border-white/5 rounded-3xl bg-black/20">
                      <div className="text-4xl animate-spin mb-4">⚙️</div>
                      <p className="text-white/40 font-bold text-xs uppercase tracking-widest">
                        Operatives are working...
                      </p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* REVEAL */}
              {phase === 'reveal' && heist.lastOutcome && (
                <motion.div
                  key="reveal"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="space-y-6 text-center">
                  {!heist.lastOutcome.approved ? (
                    <StickerCard
                      className="p-8"
                      accentColor="red"
                      hover={false}>
                      <ThumbsDown
                        size={48}
                        className="mx-auto text-red-500 mb-4"
                      />
                      <h2 className="text-3xl font-black text-white mb-2">
                        Mission Rejected
                      </h2>
                      <p className="text-white/60 font-bold text-sm">
                        Heat increased by 1.
                      </p>
                    </StickerCard>
                  ) : heist.lastOutcome.sabotaged ? (
                    <StickerCard
                      className="p-8"
                      accentColor="red"
                      hover={false}>
                      <div className="text-6xl mb-4">🚨</div>
                      <h2 className="text-4xl font-black text-red-500 mb-2 uppercase tracking-tighter">
                        Sabotaged!
                      </h2>
                      <div className="flex justify-center gap-4 text-sm font-bold text-white/80 mt-4">
                        <span className="text-red-400">
                          Heat +{heist.lastOutcome.heatDelta}
                        </span>
                        <span className="text-white/40">•</span>
                        <span className="text-white/40">
                          Success +{heist.lastOutcome.successDelta}
                        </span>
                      </div>
                    </StickerCard>
                  ) : (
                    <StickerCard
                      className="p-8"
                      accentColor="green"
                      hover={false}>
                      <div className="text-6xl mb-4">💎</div>
                      <h2 className="text-4xl font-black text-green-400 mb-2 uppercase tracking-tighter">
                        Clean Job
                      </h2>
                      <div className="flex justify-center gap-4 text-sm font-bold text-white/80 mt-4">
                        <span className="text-green-400">
                          Success +{heist.lastOutcome.successDelta}
                        </span>
                      </div>
                    </StickerCard>
                  )}
                  <CartoonButton
                    variant="gold"
                    fullWidth
                    onClick={sendHeistContinue}>
                    Next Round
                  </CartoonButton>
                </motion.div>
              )}

              {/* ACCUSATION */}
              {phase === 'accusation' && (
                <motion.div
                  key="accusation"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4 text-center">
                  <h2 className="text-3xl font-black text-red-500 uppercase">
                    Emergency Meeting
                  </h2>
                  <p className="text-white/60 text-sm font-bold">
                    Vote to expose the Snitch. Wrong guess adds Heat.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {players
                      .filter((p) => p.id !== myPlayer?.id)
                      .map((p) => (
                        <button
                          key={p.id}
                          onClick={() => sendHeistAccusation(p.id)}
                          className={cn(
                            'p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all',
                            heist.accusation.votes[myPlayer?.id || ''] === p.id
                              ? 'bg-red-500/20 border-red-500'
                              : 'bg-white/5 border-white/10 hover:bg-white/10'
                          )}>
                          <div className="font-black text-white">{p.name}</div>
                        </button>
                      ))}
                  </div>
                </motion.div>
              )}

              {/* FINAL REVEAL */}
              {(phase === 'finalReveal' || phase === 'ended') && (
                <motion.div
                  key="ended"
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center space-y-8 py-12">
                  {heist.meters.success >= heist.meters.successTarget ? (
                    <div>
                      <div className="text-6xl mb-4">💰</div>
                      <h1 className="text-5xl font-black text-green-400 uppercase tracking-tighter mb-4">
                        Crew Wins!
                      </h1>
                      <p className="text-white/60 font-medium">
                        The Snitch failed to stop the heist.
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div className="text-6xl mb-4">🚨</div>
                      <h1 className="text-5xl font-black text-red-500 uppercase tracking-tighter mb-4">
                        Snitch Wins!
                      </h1>
                      <p className="text-white/60 font-medium">
                        The heat got too high.
                      </p>
                    </div>
                  )}
                  <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                    <p className="text-xs font-bold text-white/40 uppercase mb-4">
                      The Snitch was
                    </p>
                    {(() => {
                      const snitchId = Object.keys(heist.roles).find(
                        (id) => heist.roles[id] === 'snitch'
                      );
                      const snitch = players.find((p) => p.id === snitchId);
                      return (
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-20 h-20 rounded-full border-4 border-red-500 overflow-hidden">
                            {snitch?.avatar && snitch.avatar.startsWith('http') ? (
                              <img
                                src={snitch.avatar}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-white/10 flex items-center justify-center text-2xl">
                                {snitch?.avatar || '👤'}
                              </div>
                            )}
                          </div>
                          <div className="text-2xl font-black text-white">
                            {snitch?.name || 'Unknown'}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Secret Role Card - Visible in game only */}
            <div className="fixed bottom-4 left-4 z-50 flex flex-col items-start gap-4 font-sans">
              <AnimatePresence>
                {showRole && (
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 20, opacity: 0 }}
                    className="mb-2">
                    <StickerCard
                      className="p-4 w-48 text-center shadow-2xl border-2 border-white/20"
                      accentColor={isSnitch ? 'red' : 'green'}
                      hover={false}>
                      <div className="text-xs font-bold opacity-50 uppercase tracking-widest mb-1">
                        Your Role
                      </div>
                      <div
                        className={cn(
                          'text-xl font-black uppercase italic',
                          isSnitch ? 'text-red-500' : 'text-green-500'
                        )}>
                        {isSnitch ? 'The Snitch' : 'Crew Member'}
                      </div>
                    </StickerCard>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center gap-2">
                <button
                  onMouseDown={() => setShowRole(true)}
                  onMouseUp={() => setShowRole(false)}
                  onTouchStart={() => setShowRole(true)}
                  onTouchEnd={() => setShowRole(false)}
                  className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white/60 shadow-lg active:scale-95 transition-transform">
                  <Eye size={20} />
                </button>

                {(phase === 'briefing' || phase === 'reveal') &&
                  heist.accusation.accusationsLeft > 0 && (
                    <CartoonButton
                      variant="red"
                      size="sm"
                      onClick={sendHeistStartAccusation}>
                      <span className="flex items-center gap-2">
                        <span>🚨</span>
                        <span>
                          Call Meeting ({heist.accusation.accusationsLeft})
                        </span>
                      </span>
                    </CartoonButton>
                  )}

                {/* Admin Controls for Host */}
                {isHost && (
                  <div className="flex items-center gap-2 border-l border-white/10 pl-2">
                    <button
                      onClick={sendAdminForceNext}
                      className="w-12 h-12 rounded-full bg-blue-500/20 border border-blue-500/50 flex items-center justify-center text-blue-500 hover:bg-blue-500 hover:text-white transition-all shadow-lg backdrop-blur-md">
                      <FastForward size={20} />
                    </button>
                    <button
                      onClick={sendAdminEndGame}
                      className="w-12 h-12 rounded-full bg-red-500/20 border border-red-500/50 flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-lg backdrop-blur-md">
                      <Skull size={20} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </GameShell>
  );
}
