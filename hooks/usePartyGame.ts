"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import usePartySocket from "partysocket/react";

// Types matching server
export type GameId = "saboteur" | "quickdraw" | "rapid-fire" | "most-likely" | "trivia" | "bluff" | "snake" | "race" | "rhythm";
export type GamePhase = "lobby" | "countdown" | "playing" | "voting" | "results";

export interface Player {
  id: string;
  name: string;
  avatar: string;
  ready: boolean;
  connected: boolean;
  score: number;
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
    snakes?: Record<string, {x:number, y:number}[]>;
    dirs?: Record<string, {x:number, y:number}>;
    dead?: string[];
    scores?: Record<string, number>;
  } | null;
  submissions: Record<string, unknown>;
  votes: Record<string, string>;
}

interface UsePartyGameOptions {
  odersId: string;
  userName: string;
  userAvatar: string;
  room?: string;
}

const PARTYKIT_HOST = process.env.NEXT_PUBLIC_PARTYKIT_HOST || "127.0.0.1:1999";

export function usePartyGame({ odersId, userName, userAvatar, room = "night" }: UsePartyGameOptions) {
  const [state, setState] = useState<GameRoom>({
    players: {},
    currentGame: null,
    phase: "lobby",
    round: 0,
    maxRounds: 5,
    timer: 0,
    countdown: 0,
    roundData: null,
    submissions: {},
    votes: {},
  });
  const [connected, setConnected] = useState(false);
  const [myRole, setMyRole] = useState<string>("player");
  const [roleData, setRoleData] = useState<unknown>(null);
  const [countdown, setCountdown] = useState(0);
  const [revealData, setRevealData] = useState<unknown>(null);

  const socket = usePartySocket({
    host: PARTYKIT_HOST,
    room,
    id: odersId,
    onOpen() {
      setConnected(true);
      socket.send(JSON.stringify({
        type: "join",
        odersId,
        name: userName,
        avatar: userAvatar,
      }));
    },
    onClose() {
      setConnected(false);
    },
    onMessage(event) {
      try {
        const msg = JSON.parse(event.data);
        
        switch (msg.type) {
          case "sync":
            setState(msg.state);
            break;
          case "countdown":
            setCountdown(msg.count);
            break;
          case "role":
            setMyRole(msg.role);
            setRoleData(msg.data);
            break;
          case "reveal":
            setRevealData(msg.data);
            break;
        }
      } catch (e) {
        console.error("Parse error:", e);
      }
    },
  });

  const setReady = useCallback((ready: boolean) => {
    socket.send(JSON.stringify({ type: "ready", ready }));
  }, [socket]);

  const startGame = useCallback((gameId: GameId) => {
    socket.send(JSON.stringify({ type: "start-game", gameId }));
  }, [socket]);

  const submitAnswer = useCallback((answer: unknown) => {
    socket.send(JSON.stringify({ type: "submit", answer }));
  }, [socket]);

  const vote = useCallback((targetId: string) => {
    socket.send(JSON.stringify({ type: "vote", targetId }));
  }, [socket]);

  const nextRound = useCallback(() => {
    socket.send(JSON.stringify({ type: "next-round" }));
  }, [socket]);

  const leaveGame = useCallback(() => {
    socket.send(JSON.stringify({ type: "leave-game" }));
  }, [socket]);

  // Computed values
  const players = Object.values(state.players).filter(p => p.connected);
  const myPlayer = state.players[odersId];
  const allReady = players.length >= 2 && players.every(p => p.ready);
  const allSubmitted = Object.keys(state.submissions).length >= players.length;
  const allVoted = Object.keys(state.votes).length >= players.length;
  const hasSubmitted = !!state.submissions[odersId];
  const hasVoted = !!state.votes[odersId];
  const waitingFor = players.filter(p => !state.submissions[p.id]).map(p => p.name);

  return {
    connected,
    state,
    players,
    myPlayer,
    myRole,
    roleData,
    countdown,
    revealData,
    allReady,
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
  };
}
