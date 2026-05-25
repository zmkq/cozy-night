'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import usePartySocket from 'partysocket/react';

// Types matching server
export type GameId =
  | 'saboteur'
  | 'quickdraw'
  | 'rapid-fire'
  | 'most-likely'
  | 'trivia'
  | 'bluff'
  | 'snake'
  | 'race'
  | 'rhythm'
  | 'shotcaller'
  | 'lie-rate'
  | 'group-trial'
  | 'heist';

export type HeistRole = 'crew' | 'snitch';
export type HeistPhase =
  | 'lobby'
  | 'briefing'
  | 'voting'
  | 'execution'
  | 'reveal'
  | 'accusation'
  | 'finalReveal'
  | 'ended';

export interface HeistMission {
  id: string;
  title: string;
  brief: string;
  operativesRequired: 2 | 3;
  successDeltaOnClean: number;
  heatDeltaOnClean: number;
  successDeltaOnSabotage: number;
  heatDeltaOnSabotage: number;
}

export interface HeistState {
  status: 'lobby' | 'active' | 'ended';
  roles: Record<string, HeistRole>;
  leaderIndex: number;
  meters: {
    success: number;
    heat: number;
    successTarget: number;
    heatMax: number;
  };
  phase: HeistPhase;
  currentMission: HeistMission | null;
  selectedOperatives: string[];
  votes: Record<string, 'approve' | 'reject'>;
  actions: Record<string, 'commit' | 'sabotage'>;
  lastOutcome: {
    approved: boolean;
    sabotaged: boolean;
    successDelta: number;
    heatDelta: number;
  } | null;
  accusation: {
    accusationsLeft: number;
    votes: Record<string, string>;
    active: boolean;
  };
  log: Array<{
    time: string;
    type: string;
    message: string;
  }>;
}

export type GamePhase =
  | 'lobby'
  | 'countdown'
  | 'playing'
  | 'voting'
  | 'results'
  | 'guessing'
  | 'evidence'
  | 'defense'
  | 'sentencing'
  | 'wrapped'
  | 'heist-planning'
  | 'heist-voting'
  | 'heist-execution'
  | 'heist-result';

export interface Player {
  id: string;
  name: string;
  avatar: string;
  ready: boolean;
  connected: boolean;
  score: number;
  isSpectator?: boolean;
}

export interface GameRoom {
  players: Record<string, Player>;
  currentGame: GameId | null;
  phase: GamePhase;
  round: number;
  maxRounds: number;
  timer: number;
  countdown: number;
  roundData: {
    prompt?: string | { p: string; a: string };
    word?: string;
    saboteurId?: string;
    category?: string;
    grid?: string[];
    targetIndex?: number;
    coords?: string;
    targetWord?: string;
    drawerId?: string;
    fakeDrawerId?: string;
    guesserIds?: string[];
    startTime?: number;
    question?: { q: string; a: string };
    qIndex?: number;
    pIndex?: number;
    // Snake Data
    gridSize?: number;
    food?: { x: number; y: number };
    snakes?: Record<string, { x: number; y: number }[]>;
    dirs?: Record<string, { x: number; y: number }>;
    dead?: string[];
    scores?: Record<string, number>;
    // Heist Data
    heistState?: {
      plannerId: string;
      snitchId: string;
      meter: number;
      mission: { id: string; name: string; difficulty: string; reward: number };
      votes: Record<string, 'approve' | 'reject'>;
      actions: Record<string, 'success' | 'sabotage'>;
      actionResults: Record<string, 'success' | 'sabotage'>;
      kickVotes: Record<string, string>;
      missionHistory: {
        round: number;
        result: 'success' | 'fail';
        meterChange: number;
      }[];
    };
    wrappedStats?: {
      mostSeen: { id: string; name: string; avatar: string; reason: string };
      mostMisunderstood: {
        id: string;
        name: string;
        avatar: string;
        reason: string;
      };
      controlFreak: {
        id: string;
        name: string;
        avatar: string;
        reason: string;
      };
      voiceOfReason: {
        id: string;
        name: string;
        avatar: string;
        reason: string;
      };
      emotionalCarry: {
        id: string;
        name: string;
        avatar: string;
        reason: string;
      };
    } | null;
  } | null;
  heistState: HeistState | null;
  submissions: Record<string, unknown>;
  votes: Record<string, string>;
  hostId: string | null;
}

interface UsePartyOptions {
  userId: string;
  userName: string;
  userAvatar: string;
  room?: string;
}

const PARTYKIT_HOST = process.env.NEXT_PUBLIC_PARTYKIT_HOST || '127.0.0.1:1999';

export function useParty({
  userId,
  userName,
  userAvatar,
  room = 'night',
}: UsePartyOptions) {
  const [state, setState] = useState<GameRoom>({
    players: {},
    currentGame: null,
    phase: 'lobby',
    round: 0,
    maxRounds: 5,
    timer: 0,
    countdown: 0,
    roundData: null,
    submissions: {},
    votes: {},
    hostId: null,
    heistState: null,
  });
  const [connected, setConnected] = useState(false);
  const [myRole, setMyRole] = useState<string>('player');
  const [roleData, setRoleData] = useState<unknown>(null);
  const [countdown, setCountdown] = useState(0);
  const hasJoined = useRef(false);
  const router = useRouter();

  const socket = usePartySocket({
    host: PARTYKIT_HOST,
    room,
    id: userId,
    onOpen() {
      setConnected(true);
      // Join the room
      if (!hasJoined.current && userId) {
        hasJoined.current = true;
        socket.send(
          JSON.stringify({
            type: 'join',
            userId,
            name: userName,
            avatar: userAvatar,
          })
        );
      }
    },
    onClose() {
      setConnected(false);
      hasJoined.current = false;
    },
    onMessage(event) {
      try {
        const msg = JSON.parse(event.data);

        switch (msg.type) {
          case 'sync':
            if (msg.state) {
              setState({
                players: msg.state.players || {},
                currentGame: msg.state.currentGame || null,
                phase: msg.state.phase || 'lobby',
                round: msg.state.round || 0,
                maxRounds: msg.state.maxRounds || 5,
                timer: msg.state.timer || 0,
                countdown: msg.state.countdown || 0,
                roundData: msg.state.roundData || null,
                submissions: msg.state.submissions || {},
                votes: msg.state.votes || {},
                hostId: msg.state.hostId || null,
                heistState: msg.state.heistState || null,
              });
            }
            break;
          case 'countdown':
            setCountdown(msg.count);
            break;
          case 'role':
            setMyRole(msg.role);
            setRoleData(msg.data);
            break;
          case 'pong':
            // Connection is alive
            break;
          case 'emoji-blast':
            if (typeof window !== 'undefined') {
              window.dispatchEvent(
                new CustomEvent('cozy-emoji-blast', { detail: msg })
              );
            }
            break;
          case 'kicked':
            alert(msg.reason || 'You were removed from the room.');
            router.push('/');
            break;
        }
      } catch (e) {
        console.error('Failed to parse message:', e);
      }
    },
  });

  // Heartbeat ping every 15 seconds to keep connection alive
  useEffect(() => {
    if (!connected) return;

    const pingInterval = setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'ping' }));
      }
    }, 15000);

    return () => clearInterval(pingInterval);
  }, [connected, socket]);

  // Set ready status
  const setReady = useCallback(
    (ready: boolean) => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'ready', ready }));
      }
    },
    [socket]
  );

  // Start a game
  const startGame = useCallback(
    (gameId: GameId) => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'start-game', gameId }));
      }
    },
    [socket]
  );

  // Submit answer
  const submitAnswer = useCallback(
    (answer: any) => {
      if (socket.readyState === WebSocket.OPEN) {
        // If the answer object has a 'type' property, send it as a raw message
        // This allows specialized messages like { type: "trial-vote", ... }
        if (answer && typeof answer === 'object' && 'type' in answer) {
          socket.send(JSON.stringify(answer));
        } else {
          socket.send(JSON.stringify({ type: 'submit', answer }));
        }
      }
    },
    [socket]
  );

  // Vote
  const vote = useCallback(
    (targetId: string) => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'vote', targetId }));
      }
    },
    [socket]
  );

  // Next round
  const nextRound = useCallback(() => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'next-round' }));
    }
  }, [socket]);

  // Leave game
  const leaveGame = useCallback(() => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'leave-game' }));
    }
  }, [socket]);

  // Advance Trial Phase (Host only)
  const advanceTrial = useCallback(() => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'trial-next-phase' }));
    }
  }, [socket]);

  // Force Advance Phase (Host only)
  const forceAdvance = useCallback(() => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'force-advance' }));
    }
  }, [socket]);

  // Start Wrapped (Host only)
  const startWrapped = useCallback(() => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'start-wrapped' }));
    }
  }, [socket]);

  // Admin Trigger Event (Host only)
  const triggerAdminEvent = useCallback(
    (eventId: string) => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'admin-trigger-event', eventId }));
      }
    },
    [socket]
  );

  // Send reaction (Anyone)
  const sendReaction = useCallback(
    (emoji: string) => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'reaction', emoji }));
      }
    },
    [socket]
  );

  // Kick player (Host only)
  const kickPlayer = useCallback(
    (targetId: string) => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'host-kick', targetId }));
      }
    },
    [socket]
  );

  // Get online players - with safety checks
  const players = state?.players
    ? Object.values(state.players).filter((p) => p.connected !== false)
    : [];
  const playerCount = players.length;
  const myPlayer = state?.players?.[userId];
  const isEveryoneReady = playerCount >= 2 && players.every((p) => p.ready);
  const allSubmitted =
    players.length > 0 &&
    Object.keys(state.submissions || {}).length >= players.length;
  const allVoted =
    players.length > 0 &&
    Object.keys(state.votes || {}).length >= players.length;
  const hasSubmitted = !!state.submissions?.[userId];
  const hasVoted = !!state.votes?.[userId];
  const waitingFor = players
    .filter((p) => !state.submissions?.[p.id])
    .map((p) => p.name);

  return {
    connected,
    state,
    players,
    playerCount,
    currentGame: state.currentGame,
    gamePhase: state.phase,
    gameData: state.roundData,
    myPlayer,
    myRole,
    roleData,
    countdown,
    isEveryoneReady,
    allSubmitted,
    allVoted,
    hasSubmitted,
    hasVoted,
    waitingFor,
    setReady,
    startGame,
    submitAnswer,
    vote,
    nextRound,
    leaveGame,
    advanceTrial,
    forceAdvance,
    startWrapped,
    triggerAdminEvent,
    sendReaction,
    kickPlayer,
  };
}
