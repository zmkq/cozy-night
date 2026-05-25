"use client";

import { useState, useEffect, useCallback } from "react";
import { GameState, LeaderboardEntry, RSVP, User } from "@/lib/db";

interface SyncData {
  gameState: GameState;
  leaderboard: Record<string, LeaderboardEntry>;
  rsvp: Record<string, RSVP>;
  users: User[];
}

export function useGameSync(roomCode?: string) {
  const [data, setData] = useState<SyncData | null>(null);
  const [error, setError] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!roomCode) return;
    try {
      const res = await fetch(`/api/sync?roomCode=${roomCode}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Sync Failed");
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [roomCode]);

  useEffect(() => {
    if (!roomCode) return;
    fetchData(); // Initial load
    const interval = setInterval(fetchData, 1000); // Poll every 1s
    return () => clearInterval(interval);
  }, [fetchData, roomCode]);

  return {
    gameState: data?.gameState,
    leaderboard: data?.leaderboard,
    rsvp: data?.rsvp,
    users: data?.users || [],
    isLoading: loading,
    isError: error,
    mutate: fetchData // Manual refresh function
  };
}
