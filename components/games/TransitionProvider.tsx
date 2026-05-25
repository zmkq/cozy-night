'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import {
  CinematicTransition,
  TransitionConfig,
  TransitionType,
} from '@/components/games/CinematicTransition';

interface TransitionContextType {
  trigger: (config: TransitionConfig) => Promise<void>;
  triggerRoundStart: (round: number, maxRounds: number) => Promise<void>;
  triggerVoting: () => Promise<void>;
  triggerResults: () => Promise<void>;
  triggerCaught: (playerName: string) => Promise<void>;
  triggerEscaped: (playerName: string) => Promise<void>;
  triggerEpicWin: (playerName: string) => Promise<void>;
  triggerEpicFail: (playerName: string) => Promise<void>;
  triggerCloseCall: () => Promise<void>;
  triggerFinalRound: (round: number, maxRounds: number) => Promise<void>;
  triggerGameOver: () => Promise<void>;
  isPlaying: boolean;
}

const TransitionContext = createContext<TransitionContextType | null>(null);

export function TransitionProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<TransitionConfig | null>(null);
  const [show, setShow] = useState(false);
  const [resolvePromise, setResolvePromise] = useState<(() => void) | null>(
    null
  );

  const trigger = useCallback(
    (transitionConfig: TransitionConfig): Promise<void> => {
      return new Promise((resolve) => {
        setConfig(transitionConfig);
        setShow(true);
        setResolvePromise(() => resolve);
      });
    },
    []
  );

  const handleComplete = useCallback(() => {
    setShow(false);
    if (resolvePromise) {
      resolvePromise();
      setResolvePromise(null);
    }
  }, [resolvePromise]);

  // Convenience methods
  const triggerRoundStart = useCallback(
    (round: number, maxRounds: number) => {
      return trigger({
        type: round === maxRounds ? 'final-round' : 'round-start',
        round,
        maxRounds,
        duration: round === maxRounds ? 2500 : 2000,
      });
    },
    [trigger]
  );

  const triggerVoting = useCallback(() => {
    return trigger({ type: 'voting-start', duration: 1500 });
  }, [trigger]);

  const triggerResults = useCallback(() => {
    return trigger({ type: 'results-reveal', duration: 1500 });
  }, [trigger]);

  const triggerCaught = useCallback(
    (playerName: string) => {
      return trigger({ type: 'caught', playerName, duration: 2500 });
    },
    [trigger]
  );

  const triggerEscaped = useCallback(
    (playerName: string) => {
      return trigger({ type: 'escaped', playerName, duration: 2500 });
    },
    [trigger]
  );

  const triggerEpicWin = useCallback(
    (playerName: string) => {
      return trigger({ type: 'epic-win', playerName, duration: 2500 });
    },
    [trigger]
  );

  const triggerEpicFail = useCallback(
    (playerName: string) => {
      return trigger({ type: 'epic-fail', playerName, duration: 2000 });
    },
    [trigger]
  );

  const triggerFinalRound = useCallback(
    (round: number, maxRounds: number) => {
      return trigger({ type: 'final-round', round, maxRounds, duration: 2500 });
    },
    [trigger]
  );

  const triggerCloseCall = useCallback(() => {
    return trigger({ type: 'close-call', duration: 2000 });
  }, [trigger]);

  const triggerGameOver = useCallback(() => {
    return trigger({ type: 'game-over', duration: 2000 });
  }, [trigger]);

  return (
    <TransitionContext.Provider
      value={{
        trigger,
        triggerRoundStart,
        triggerVoting,
        triggerResults,
        triggerCaught,
        triggerEscaped,
        triggerEpicWin,
        triggerEpicFail,
        triggerCloseCall,
        triggerFinalRound,
        triggerGameOver,
        isPlaying: show,
      }}>
      {children}
      {config && (
        <CinematicTransition
          config={config}
          show={show}
          onComplete={handleComplete}
        />
      )}
    </TransitionContext.Provider>
  );
}

export function useGameTransitions() {
  const context = useContext(TransitionContext);
  if (!context) {
    throw new Error(
      'useGameTransitions must be used within a TransitionProvider'
    );
  }
  return context;
}

export default TransitionProvider;
