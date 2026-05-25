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
  Check,
  AlertTriangle,
} from 'lucide-react';
import { CountdownOverlay } from '@/components/games/CountdownOverlay';
import { cn } from '@/lib/utils';

export default function HeistGame() {
  const [showRole, setShowRole] = useState(false);
  const {
    state,
    players,
    myPlayer,
    startGame,
    nextRound,
    vote,
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
    if (confirm('FORCE NEXT PHASE? This will auto-complete voting/execution.')) {
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

  // Local state for proposal
  const [selectedOperatives, setSelectedOperatives] = useState<string[]>([]);

  // Local state for wiring puzzle
  const [connections, setConnections] = useState<Record<string, string>>({});
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);

  const leftWires = ['red', 'blue', 'green'];
  const rightWires = ['blue', 'green', 'red']; // Shuffled layout

  useEffect(() => {
    if (phase === 'briefing') {
      setSelectedOperatives([]);
    }
    if (phase === 'execution') {
      setConnections({});
      setSelectedLeft(null);
    }
  }, [heist?.currentMission?.id, phase]);

  const handleWireConnect = (leftColor: string, rightColor: string) => {
    const nextConns = { ...connections, [leftColor]: rightColor };
    setConnections(nextConns);
    setSelectedLeft(null);

    // If all wires connected
    if (Object.keys(nextConns).length === 3) {
      const allCorrect = Object.entries(nextConns).every(([l, r]) => l === r);
      if (allCorrect) {
        // Automatically submit success commit!
        sendHeistAction('commit');
      } else {
        // Failed wiring, try again after a small reset delay
        setTimeout(() => {
          setConnections({});
          setSelectedLeft(null);
        }, 800);
      }
    }
  };

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
            className="space-y-6 max-w-md mx-auto">
            <StickerCard
              className="p-8 text-center space-y-4 group relative overflow-hidden"
              accentColor="gold">
              <div className="absolute inset-0 bg-linear-to-br from-amber-500/10 via-transparent to-red-500/10 pointer-events-none" />
              <h2 className="text-4xl font-black text-white uppercase tracking-tighter leading-none italic">
                SQUAD HEIST <span className="text-amber-500 block text-2xl mt-1">THE TRAITOR RAT</span>
              </h2>
              <p className="text-white/60 text-xs font-bold leading-normal uppercase tracking-wider">
                Assemble mission teams to hack the vault. One of you is the Snitch trying to raise Heat and alarm the police. Unmask them!
              </p>
            </StickerCard>

            <StickerCard className="p-4" accentColor="gold" hover={false}>
              <div className="text-xs text-white/40 mb-3 uppercase tracking-wider font-bold">
                The Syndicate ({players.length})
              </div>
              <div className="flex flex-wrap gap-2">
                {players.map((p) => (
                  <div
                    key={p.id}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all',
                      p.ready
                        ? 'bg-amber-500/20 border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
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
                    {p.ready && <ThumbsUp size={14} className="text-[#FFD93D]" />}
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
                {myPlayer?.ready ? '✓ Ready to Steal' : 'Ready to Run'}
              </CartoonButton>

              {allReady && (
                <CartoonButton
                  variant="red"
                  size="lg"
                  fullWidth
                  onClick={() => startGame('heist')}>
                  🚀 Initiate Infiltration
                </CartoonButton>
              )}
            </div>
          </motion.div>
        )}

        {/* LOADING */}
        {isLoading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center min-h-[50vh] text-white text-center">
            <div className="text-4xl animate-spin mb-4">⚙️</div>
            <h2 className="text-xl font-bold mb-2">Syncing Vault Feeds...</h2>
            <p className="opacity-50 text-xs uppercase tracking-wider">Establishing secure server link</p>
          </motion.div>
        )}

        {/* PLAYING */}
        {!isLobby && !isLoading && heist && (
          <motion.div
            key="game"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6 max-w-2xl mx-auto">
            
            {/* Real-time Vault Meters */}
            <div className="grid grid-cols-2 gap-4">
              <StickerCard
                className="p-4 flex items-center justify-between relative overflow-hidden"
                accentColor="green"
                hover={false}>
                <div className="absolute inset-y-0 left-0 bg-emerald-500/10 pointer-events-none" style={{ width: `${(heist.meters.success / heist.meters.successTarget) * 100}%` }} />
                <div className="text-xs font-black text-emerald-400 uppercase tracking-widest relative z-10">
                  Loot Stolen
                </div>
                <div className="text-2xl font-black text-white relative z-10">
                  {heist.meters.success}/{heist.meters.successTarget}
                </div>
              </StickerCard>
              <StickerCard
                className="p-4 flex items-center justify-between relative overflow-hidden"
                accentColor="red"
                hover={false}>
                <div className="absolute inset-y-0 left-0 bg-red-500/10 pointer-events-none" style={{ width: `${(heist.meters.heat / heist.meters.heatMax) * 100}%` }} />
                <div className="text-xs font-black text-red-400 uppercase tracking-widest relative z-10">
                  Police Heat
                </div>
                <div className="text-2xl font-black text-white relative z-10">
                  {heist.meters.heat}/{heist.meters.heatMax}
                </div>
              </StickerCard>
            </div>

            {/* Current Stage */}
            <div className="text-center font-sans">
              <span className="bg-white/5 text-white/50 border border-white/10 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                STAGE {state.round}
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
                    <div className="text-xs text-amber-500 font-bold uppercase tracking-widest mb-2">
                      Target Intel
                    </div>
                    <h2 className="text-3xl font-black text-white mb-2 leading-none">
                      {heist.currentMission?.title}
                    </h2>
                    <p className="text-white/50 text-sm font-medium italic mb-6">
                      "{heist.currentMission?.brief}"
                    </p>
                    <div className="flex justify-center gap-2 text-xs font-bold text-white/60 uppercase">
                      <Users size={16} className="text-blue-400" />
                      <span>Proposed Team Size: {heist.currentMission?.operativesRequired}</span>
                    </div>
                  </StickerCard>

                  {isLeader ? (
                    <div className="space-y-4">
                      <p className="text-center text-white/60 text-xs font-bold uppercase tracking-wider">
                        You are the Mission Leader. Choose your operatives:
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {players.map((p) => {
                          const isSelected = selectedOperatives.includes(p.id);
                          return (
                            <button
                              key={p.id}
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedOperatives((prev) => prev.filter((id) => id !== p.id));
                                } else if (selectedOperatives.length < (heist.currentMission?.operativesRequired || 0)) {
                                  setSelectedOperatives((prev) => [...prev, p.id]);
                                }
                              }}
                              className={cn(
                                'p-3 rounded-2xl border-4 transition-all flex items-center gap-3',
                                isSelected
                                  ? 'bg-amber-500/20 border-amber-500 text-white'
                                  : 'bg-black/40 border-white/10 text-white/50'
                              )}>
                              <div className="w-8 h-8 rounded-full overflow-hidden bg-white/10 shrink-0">
                                {p.avatar && p.avatar.startsWith('http') ? (
                                  <img src={p.avatar} className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-sm">{p.avatar || '👤'}</span>
                                )}
                              </div>
                              <span className="font-bold text-sm truncate flex-1 text-left">{p.name}</span>
                              {isSelected && <Check size={16} className="text-amber-500" />}
                            </button>
                          );
                        })}
                      </div>
                      <CartoonButton
                        variant="gold"
                        fullWidth
                        disabled={selectedOperatives.length !== heist.currentMission?.operativesRequired}
                        onClick={() => sendHeistMissionSelect(selectedOperatives)}>
                        Propose Proposed Team
                      </CartoonButton>
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-black/20 border border-white/5 rounded-2xl">
                      <p className="text-sm font-bold text-white/40 uppercase tracking-widest animate-pulse">
                        Waiting for proposing leader ({players.find((p) => p.id === leaderId)?.name})...
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
                  className="space-y-6">
                  <div className="text-center space-y-3">
                    <h3 className="text-2xl font-black text-white uppercase tracking-tight">
                      PROPOSED MISSION CREW
                    </h3>
                    <div className="flex justify-center gap-2">
                      {heist.selectedOperatives.map((id) => {
                        const p = players.find((pl) => pl.id === id);
                        return (
                          <span
                            key={id}
                            className="px-4 py-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-500 rounded-full text-xs font-black uppercase">
                            {p?.name}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {!heist.votes[myPlayer?.id || ''] ? (
                    <div className="flex gap-4 max-w-sm mx-auto pt-4 font-sans">
                      <CartoonButton
                        variant="red"
                        className="flex-1"
                        onClick={() => sendHeistVote('reject')}>
                        <ThumbsDown size={18} className="mr-2" /> Reject Proposed Proposed Team
                      </CartoonButton>
                      <CartoonButton
                        variant="green"
                        className="flex-1"
                        onClick={() => sendHeistVote('approve')}>
                        <ThumbsUp size={18} className="mr-2" /> Approve Proposed Proposed Team
                      </CartoonButton>
                    </div>
                  ) : (
                    <div className="text-center py-6 bg-black/20 border border-white/5 rounded-2xl">
                      <p className="text-white/40 font-black uppercase tracking-widest animate-pulse text-xs">
                        Proposed Team proposals voted. Waiting for syndicate verdict...
                      </p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* EXECUTION (MINI-GAMES FOR OPERATIVES) */}
              {phase === 'execution' && (
                <motion.div
                  key="execution"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-6 text-center">
                  
                  {heist.selectedOperatives.includes(myPlayer?.id || '') ? (
                    <StickerCard className="p-6 relative overflow-hidden" accentColor="red" hover={false}>
                      {!heist.actions[myPlayer?.id || ''] ? (
                        <div className="space-y-6">
                          <div>
                            <span className="text-[10px] text-red-500 font-black uppercase tracking-widest block mb-1">Vault Subgrid Override</span>
                            <h3 className="text-xl font-black text-white uppercase">CONNECT MATCHING WIRES TO OVERRIDE</h3>
                          </div>

                          {/* The Interactive Wiring Game */}
                          <div className="bg-black/60 border border-white/10 rounded-3xl p-6 relative flex justify-between items-center max-w-xs mx-auto my-4 min-h-[160px]">
                            {/* Left Ports */}
                            <div className="flex flex-col gap-6">
                              {leftWires.map((color) => {
                                const isConnected = !!connections[color];
                                return (
                                  <button
                                    key={color}
                                    onClick={() => setSelectedLeft(color)}
                                    disabled={isConnected}
                                    className={cn(
                                      "w-8 h-8 rounded-full border-4 transition-all flex items-center justify-center text-xs font-black shadow-lg",
                                      color === 'red' && "border-red-500 bg-red-950 text-red-300",
                                      color === 'blue' && "border-blue-500 bg-blue-950 text-blue-300",
                                      color === 'green' && "border-emerald-500 bg-emerald-950 text-emerald-300",
                                      selectedLeft === color && "animate-ping",
                                      isConnected && "opacity-30 cursor-not-allowed scale-90"
                                    )}>
                                    L
                                  </button>
                                );
                              })}
                            </div>

                            {/* Center Connections visual */}
                            <div className="absolute inset-x-12 inset-y-6 pointer-events-none flex flex-col justify-around">
                              {Object.entries(connections).map(([left, right]) => (
                                <div
                                  key={left}
                                  className={cn(
                                    "h-1.5 rounded-full w-full",
                                    left === 'red' && "bg-red-500 shadow-[0_0_10px_red]",
                                    left === 'blue' && "bg-blue-500 shadow-[0_0_10px_blue]",
                                    left === 'green' && "bg-emerald-500 shadow-[0_0_10px_emerald]"
                                  )}
                                />
                              ))}
                            </div>

                            {/* Right Ports */}
                            <div className="flex flex-col gap-6">
                              {rightWires.map((color) => {
                                const isConnected = Object.values(connections).includes(color);
                                return (
                                  <button
                                    key={color}
                                    onClick={() => selectedLeft && handleWireConnect(selectedLeft, color)}
                                    disabled={!selectedLeft || isConnected}
                                    className={cn(
                                      "w-8 h-8 rounded-full border-4 transition-all flex items-center justify-center text-xs font-black shadow-lg",
                                      color === 'red' && "border-red-500 bg-red-950 text-red-300",
                                      color === 'blue' && "border-blue-500 bg-blue-950 text-blue-300",
                                      color === 'green' && "border-emerald-500 bg-emerald-950 text-emerald-300",
                                      !selectedLeft && "opacity-40 cursor-not-allowed",
                                      isConnected && "opacity-30 scale-90"
                                    )}>
                                    R
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* SNITCH SABOTAGE OVERRIDE */}
                          {isSnitch && (
                            <div className="pt-4 border-t border-white/10">
                              <CartoonButton
                                variant="red"
                                fullWidth
                                onClick={() => sendHeistAction('sabotage')}>
                                <div className="flex items-center justify-center gap-2">
                                  <Skull size={18} />
                                  <span>TRIGGER SYNDICATE TRAP (SABOTAGE)</span>
                                </div>
                              </CartoonButton>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="py-6 text-center space-y-2">
                          <Check className="w-12 h-12 text-[#2ECC71] mx-auto animate-bounce" />
                          <p className="font-black text-[#2ECC71] uppercase tracking-wider">Vault Feed Overridden!</p>
                          <p className="text-xs text-white/40 font-bold uppercase">Waiting for other operatives...</p>
                        </div>
                      )}
                    </StickerCard>
                  ) : (
                    <div className="p-8 border-2 border-white/5 rounded-3xl bg-black/20 text-center">
                      <div className="text-4xl animate-spin mb-4">⚙️</div>
                      <p className="text-white/40 font-black text-xs uppercase tracking-widest animate-pulse">
                        Syndicate Operatives Hacking Mainframe...
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
                  className="space-y-6 text-center max-w-sm mx-auto">
                  {!heist.lastOutcome.approved ? (
                    <StickerCard className="p-8" accentColor="red" hover={false}>
                      <ThumbsDown size={48} className="mx-auto text-red-500 mb-4 animate-bounce" />
                      <h2 className="text-3xl font-black text-white uppercase tracking-tight mb-2">
                        Proposed Team Rejected
                      </h2>
                      <p className="text-white/60 text-xs font-bold uppercase tracking-wider leading-relaxed">
                        The Syndicate rejected the proposed operatives. Police alert level increased!
                      </p>
                    </StickerCard>
                  ) : heist.lastOutcome.sabotaged ? (
                    <StickerCard className="p-8" accentColor="red" hover={false}>
                      <div className="text-6xl mb-4 animate-pulse">🚨</div>
                      <h2 className="text-4xl font-black text-red-500 mb-2 uppercase tracking-tighter leading-none">
                        SABOTAGED!
                      </h2>
                      <div className="flex justify-center gap-4 text-xs font-black uppercase text-white/50 mt-4">
                        <span className="text-red-400">Heat +{heist.lastOutcome.heatDelta}</span>
                        <span>•</span>
                        <span>Success +{heist.lastOutcome.successDelta}</span>
                      </div>
                    </StickerCard>
                  ) : (
                    <StickerCard className="p-8" accentColor="green" hover={false}>
                      <div className="text-6xl mb-4 animate-bounce">💎</div>
                      <h2 className="text-4xl font-black text-emerald-400 mb-2 uppercase tracking-tighter leading-none">
                        CLEAN JOB
                      </h2>
                      <div className="flex justify-center gap-4 text-xs font-black uppercase text-white/50 mt-4">
                        <span className="text-emerald-400">Success +{heist.lastOutcome.successDelta}</span>
                      </div>
                    </StickerCard>
                  )}
                  <CartoonButton
                    variant="gold"
                    fullWidth
                    onClick={sendHeistContinue}>
                    Resume Operation
                  </CartoonButton>
                </motion.div>
              )}

              {/* ACCUSATION */}
              {phase === 'accusation' && (
                <motion.div
                  key="accusation"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-6 text-center">
                  <div>
                    <h2 className="text-3xl font-black text-red-500 uppercase tracking-tight flex items-center justify-center gap-2">
                      <AlertTriangle size={28} className="animate-pulse" />
                      <span>ACCUSATION HOUR</span>
                    </h2>
                    <p className="text-white/60 text-xs font-bold uppercase tracking-wider bg-white/5 border border-white/10 px-3 py-1 rounded-full inline-block mt-2">
                      Expose the Snitch! A wrong choice adds Heat and alert level!
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
                    {players
                      .filter((p) => p.id !== myPlayer?.id)
                      .map((p) => (
                        <button
                          key={p.id}
                          onClick={() => sendHeistAccusation(p.id)}
                          className={cn(
                            'p-4 rounded-2xl border-4 flex flex-col items-center gap-3 transition-all',
                            heist.accusation.votes[myPlayer?.id || ''] === p.id
                              ? 'bg-red-500/20 border-red-500 text-white'
                              : 'bg-black/40 border-white/10 text-white/60 hover:border-white/20'
                          )}>
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-white/5">
                            {p.avatar && p.avatar.startsWith('http') ? (
                              <img src={p.avatar} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-sm">{p.avatar || '👤'}</span>
                            )}
                          </div>
                          <span className="font-black text-sm">{p.name}</span>
                        </button>
                      ))}
                  </div>
                </motion.div>
              )}

              {/* FINAL REVEAL / ENDED */}
              {(phase === 'finalReveal' || phase === 'ended') && (
                <motion.div
                  key="ended"
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center space-y-8 py-12 max-w-sm mx-auto">
                  {heist.meters.success >= heist.meters.successTarget ? (
                    <div>
                      <div className="text-7xl mb-4 animate-bounce">💰</div>
                      <h1 className="text-5xl font-black text-[#2ECC71] uppercase tracking-tighter leading-none">
                        CREW ESCAPED!
                      </h1>
                      <p className="text-white/60 text-xs font-bold uppercase tracking-wider mt-2">
                        The vault has been cleared. The snitch failed!
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div className="text-7xl mb-4 animate-pulse">🚨</div>
                      <h1 className="text-5xl font-black text-red-500 uppercase tracking-tighter leading-none">
                        HEIST BUSTED!
                      </h1>
                      <p className="text-white/60 text-xs font-bold uppercase tracking-wider mt-2">
                        The alarms triggered. The snitch wins!
                      </p>
                    </div>
                  )}

                  <div className="p-6 bg-black/40 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
                    <p className="text-xs font-black text-white/40 uppercase tracking-widest mb-4">
                      The Snitch was
                    </p>
                    {(() => {
                      const snitchId = Object.keys(heist.roles).find(
                        (id) => heist.roles[id] === 'snitch'
                      );
                      const snitch = players.find((p) => p.id === snitchId);
                      return (
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-20 h-20 rounded-full border-4 border-red-500 overflow-hidden shadow-[0_0_20px_rgba(239,68,68,0.4)]">
                            {snitch?.avatar && snitch.avatar.startsWith('http') ? (
                              <img src={snitch.avatar} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-white/10 flex items-center justify-center text-2xl">
                                {snitch?.avatar || '👤'}
                              </div>
                            )}
                          </div>
                          <div className="text-2xl font-black text-white uppercase italic">
                            {snitch?.name || 'Unknown'}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Secret Identity Hud */}
            <div className="fixed bottom-4 left-4 z-50 flex flex-col items-start gap-4 font-sans">
              <AnimatePresence>
                {showRole && (
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 20, opacity: 0 }}
                    className="mb-2">
                    <StickerCard
                      className="p-4 w-48 text-center shadow-2xl border-4 border-white/20"
                      accentColor={isSnitch ? 'red' : 'green'}
                      hover={false}>
                      <div className="text-[10px] font-black opacity-50 uppercase tracking-widest mb-1">
                        YOUR IDENTITY
                      </div>
                      <div className={cn(
                        'text-xl font-black uppercase italic leading-none',
                        isSnitch ? 'text-red-500' : 'text-emerald-400'
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
                  className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-2xl border-2 border-white/10 flex items-center justify-center text-white/60 shadow-xl active:scale-95 transition-transform">
                  <Eye size={20} />
                </button>

                {(phase === 'briefing' || phase === 'reveal') && heist.accusation.accusationsLeft > 0 && (
                  <CartoonButton
                    variant="red"
                    size="sm"
                    onClick={sendHeistStartAccusation}>
                    <span className="flex items-center gap-2 text-xs font-black">
                      <AlertTriangle size={14} />
                      <span>MEETING ({heist.accusation.accusationsLeft})</span>
                    </span>
                  </CartoonButton>
                )}

                {/* Admin Actions */}
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
