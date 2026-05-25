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
  const isPlaying = state.phase === 'playing'; // Answering phase
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
      // Check if it's close (similar yes/no counts)
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

      // Check if current player was a perfect bluffer
      const myPerfectBluff = roundData.timeline?.find(
        (t: any) => t.type === 'perfect_bluff' && t.playerId === myPlayer?.id
      );

      if (myPerfectBluff) {
        triggerEpicWin(myPlayer?.name || 'You');
      } else {
        triggerResults();
      }

      // Persist score to permanent leaderboard!
      if (myPlayer?.score && myPlayer.score > 0) {
        import('@/app/actions').then(({ updateLeaderboardAction }) => {
          updateLeaderboardAction(roomCode, 'lie-rate', myPlayer.score);
        });
      }
    }
    if (!isResults) {
      hasTriggeredResults.current = false;
    }
  }, [
    isResults,
    roundData?.timeline,
    myPlayer,
    triggerEpicWin,
    triggerResults,
    myPlayer?.score,
  ]);

  // Reset on new round
  useEffect(() => {
    setHasAnswered(false);
    setGuesses({});
  }, [state.round]);

  // Celebration for undetected players
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
              accentColor="purple">
              <div className="text-6xl animate-bounce">🎭</div>
              <h2 className="text-2xl font-black text-white">
                Read your friends. Expose the liars.
              </h2>
              <p className="text-white/60 font-medium">
                Everyone answers Yes or No. Then guess who did what. Stay mysterious to score points.
              </p>
            </StickerCard>

            <StickerCard className="p-4" accentColor="white" hover={false}>
              <div className="text-xs text-white/40 mb-3 uppercase tracking-wider font-bold">
                Players ({players.length})
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
                    {p.ready && <Eye size={14} className="text-[#FF4D6A]" />}
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
                {myPlayer?.ready ? '✓ Ready!' : 'Ready Up'}
              </CartoonButton>

              {allReady && (
                <CartoonButton
                  variant="red"
                  size="lg"
                  fullWidth
                  onClick={() => startGame('lie-rate' as any)}>
                  🎭 Start Psychological Games
                </CartoonButton>
              )}
            </div>
          </motion.div>
        )}

        {/* PLAYING - Answer Phase */}
        {isPlaying && !hasAnswered && (
          <motion.div
            key="answer-phase"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6">
            {/* Prompt */}
            <StickerCard
              className="p-6 text-center"
              accentColor="purple"
              hover={false}>
              <p className="text-xs text-white/40 uppercase tracking-wider mb-3 font-bold border border-white/10 rounded-full px-3 py-1 inline-block">
                Question
              </p>
              <h2 className="text-xl font-black text-white leading-tight">
                "{prompt}"
              </h2>
            </StickerCard>

            {/* YES / NO Buttons */}
            <div className="grid grid-cols-2 gap-6 p-2 font-sans">
              <motion.button
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleAnswer('yes')}
                className="p-10 rounded-[2.5rem] bg-green-500/90 backdrop-blur-xl border-4 border-white/20 shadow-[0_20px_50px_-12px_rgba(34,197,94,0.5)] flex flex-col items-center gap-4 group overflow-hidden relative">
                <div className="absolute inset-0 bg-linear-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <ThumbsUp className="w-16 h-16 text-white drop-shadow-lg group-hover:rotate-12 transition-transform" />
                <span className="text-4xl font-black text-white uppercase tracking-tighter italic relative z-10">
                  Yes
                </span>
                <span className="text-[10px] text-white/60 font-black uppercase tracking-[0.2em] relative z-10">
                  It Happened
                </span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleAnswer('no')}
                className="p-10 rounded-[2.5rem] bg-red-600/90 backdrop-blur-xl border-4 border-white/20 shadow-[0_20px_50px_-12px_rgba(220,38,38,0.5)] flex flex-col items-center gap-4 group overflow-hidden relative">
                <div className="absolute inset-0 bg-linear-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <ThumbsDown className="w-16 h-16 text-white drop-shadow-lg group-hover:-rotate-12 transition-transform" />
                <span className="text-4xl font-black text-white uppercase tracking-tighter italic relative z-10">
                  No
                </span>
                <span className="text-[10px] text-white/60 font-black uppercase tracking-[0.2em] relative z-10">
                  Never
                </span>
              </motion.button>
            </div>

            <p className="text-white/40 text-sm text-center animate-pulse font-bold">
              Your answer is secret. Choose honestly (or not).
            </p>
          </motion.div>
        )}

        {/* PLAYING - Waiting for others */}
        {isPlaying && hasAnswered && (
          <motion.div
            key="waiting-answers"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center space-y-6 py-8">
            <div className="text-6xl animate-bounce">🤔</div>
            <h2 className="text-xl font-black text-white">Answer Submitted!</h2>
            <p className="text-white/60 font-medium">
              Waiting for confessions from the rest...
            </p>

            <div className="flex flex-wrap justify-center gap-2">
              {players.map((p) => (
                <div
                  key={p.id}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 border',
                    answers[p.id]
                      ? 'bg-[#2ECC71]/20 text-[#2ECC71] border-[#2ECC71]'
                      : 'bg-white/5 text-white/40 border-white/10'
                  )}>
                  <div
                    className={cn(
                      'w-5 h-5 rounded-full border border-white/20 overflow-hidden bg-white/10 flex items-center justify-center shrink-0',
                      !p.connected && 'opacity-40 grayscale'
                    )}>
                    {p.avatar && p.avatar.startsWith('http') ? (
                      <img
                        src={p.avatar}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs">{p.avatar || '👤'}</span>
                    )}
                  </div>
                  {answers[p.id] ? '✓' : '...'}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* GUESSING Phase */}
        {isGuessing && (
          <motion.div
            key="guessing-phase"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6">
            {/* Count Reveal */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring' }}>
              <StickerCard
                className="p-6 text-center"
                accentColor="gold"
                hover={false}>
                <p className="text-xs text-white/40 uppercase tracking-wider mb-3 font-bold">
                  The Results
                </p>
                <div className="flex justify-center gap-8 items-center">
                  <div className="text-center">
                    <div className="text-4xl font-black text-[#2ECC71]">
                      {yesCount}
                    </div>
                    <div className="text-sm text-white/60 font-bold">
                      said Yes
                    </div>
                  </div>
                  <div className="text-4xl text-white/20">/</div>
                  <div className="text-center">
                    <div className="text-4xl font-black text-[#FF4D6A]">
                      {noCount}
                    </div>
                    <div className="text-sm text-white/60 font-bold">
                      said No
                    </div>
                  </div>
                </div>
              </StickerCard>
            </motion.div>

            {/* Prompt Reminder */}
            <p className="text-center text-white/60 text-sm italic font-medium">
              "{prompt}"
            </p>

            {/* Guess Grid */}
            <div className="space-y-3">
              <p className="text-white/40 text-xs uppercase tracking-wider text-center font-bold">
                <Users size={12} className="inline mr-1" />
                Guess who said what
              </p>

              {players
                .filter((p) => p.id !== myPlayer?.id)
                .map((p) => (
                  <StickerCard
                    key={p.id}
                    className="p-3"
                    accentColor="white"
                    hover={false}>
                    <div className="flex items-center gap-4">
                      <div
                        className={cn(
                          'w-12 h-12 rounded-full border-2 border-white overflow-hidden bg-white/10 flex items-center justify-center shrink-0',
                          !p.connected && 'opacity-40 grayscale'
                        )}>
                        {p.avatar && p.avatar.startsWith('http') ? (
                          <img
                            src={p.avatar}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-2xl">{p.avatar || '👤'}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-black text-white">{p.name}</p>
                        {guesses[p.id] && (
                          <p className="text-xs text-white/40 font-bold">
                            Your guess:{' '}
                            <span
                              className={
                                guesses[p.id] === 'yes'
                                  ? 'text-[#2ECC71]'
                                  : 'text-[#FF4D6A]'
                              }>
                              {guesses[p.id] === 'yes' ? 'Yes' : 'No'}
                            </span>
                          </p>
                        )}
                      </div>
                      {!guesses[p.id] && (
                        <div className="flex gap-2">
                          <CartoonButton
                            variant="green"
                            size="sm"
                            onClick={() => handleGuess(p.id, 'yes')}>
                            <ThumbsUp size={16} />
                          </CartoonButton>
                          <CartoonButton
                            variant="red"
                            size="sm"
                            onClick={() => handleGuess(p.id, 'no')}>
                            <ThumbsDown size={16} />
                          </CartoonButton>
                        </div>
                      )}
                    </div>
                  </StickerCard>
                ))}
            </div>

            <p className="text-white/40 text-xs text-center font-bold">
              +2 points per correct guess • +3 points if undetected
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
            {/* Everyone's Answers Reveal */}
            <StickerCard className="p-4" accentColor="purple" hover={false}>
              <p className="text-xs text-white/40 uppercase tracking-wider mb-3 font-bold">
                🔓 The Truth
              </p>
              <p className="text-white text-sm mb-4 italic font-medium">
                "{prompt}"
              </p>
              <div className="grid grid-cols-2 gap-3">
                {players.map((p) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: players.indexOf(p) * 0.1 }}
                    className={cn(
                      'flex items-center gap-2 p-2 rounded-xl border-2',
                      answers[p.id] === 'yes'
                        ? 'bg-[#2ECC71]/20 border-[#2ECC71]'
                        : 'bg-[#FF4D6A]/20 border-[#FF4D6A]'
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
                    <div className="flex-1 overflow-hidden">
                      <p className="text-white font-bold text-sm truncate">
                        {p.name}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'text-xs font-black shrink-0',
                        answers[p.id] === 'yes'
                          ? 'text-[#2ECC71]'
                          : 'text-[#FF4D6A]'
                      )}>
                      {answers[p.id] === 'yes' ? 'Yes' : 'No'}
                    </span>
                  </motion.div>
                ))}
              </div>
            </StickerCard>

            {/* Undetected Players */}
            {roundData?.timeline?.filter((t: any) => t.type === 'perfect_bluff')
              .length > 0 && (
              <StickerCard className="p-4" accentColor="gold" hover={false}>
                <p className="text-xs text-white/40 uppercase tracking-wider mb-2 font-bold">
                  <Sparkles size={12} className="inline mr-1" /> Undetected
                </p>
                <div className="flex gap-2 flex-wrap">
                  {roundData.timeline
                    .filter((t: any) => t.type === 'perfect_bluff')
                    .map((t: any) => {
                      const p = players.find((pl) => pl.id === t.playerId);
                      return (
                        <motion.div
                          key={t.id}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="flex items-center gap-2 bg-[#FFD93D]/20 text-[#FFD93D] px-3 py-1 rounded-full border border-[#FFD93D]/30">
                          <div className="w-6 h-6 rounded-full border border-white/20 overflow-hidden bg-white/10 flex items-center justify-center shrink-0">
                            {p?.avatar && p.avatar.startsWith('http') ? (
                              <img
                                src={p.avatar}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-xs">{p?.avatar || '👤'}</span>
                            )}
                          </div>
                          <span className="font-bold text-sm">{p?.name}</span>
                          <span className="text-xs font-black">+3</span>
                        </motion.div>
                      );
                    })}
                </div>
              </StickerCard>
            )}

            {/* Scoreboard */}
            <StickerCard className="p-4" accentColor="white" hover={false}>
              <p className="text-xs text-white/40 uppercase tracking-wider mb-3 font-bold">
                Leaderboard
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

            <CartoonButton
              variant="green"
              size="lg"
              fullWidth
              onClick={nextRound}>
              {state.round >= 8 ? '🎭 The Ultimate Liar?' : 'Next Round →'}
            </CartoonButton>
          </motion.div>
        )}
      </AnimatePresence>
    </GameShell>
  );
}
