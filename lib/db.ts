import { Redis } from '@upstash/redis';

const kv = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

// Types
export interface User {
  id: string;
  name: string;
  avatar: string; // Emoji or URL
  hash?: string; // Bcrypt hash
  hints: string[];
  isAdmin?: boolean;
}

export interface RSVP {
  status: 'coming' | 'maybe' | 'no' | 'pending';
  note?: string;
  updatedAt: number;
}

export interface LeaderboardEntry {
  points: number;
  badges: string[];
  history: { gameId: string; points: number; note?: string }[];
}

export interface GameState {
  gameId: string | null; // 'rapid-fire', 'most-likely', etc.
  status: 'LOBBY' | 'PLAYING' | 'RESULTS';
  phase: string; // 'question-1', 'vote', 'reveal'
  timerStart?: number; // Timestamp for synced timers
  players: Record<
    string,
    {
      ready: boolean;
      score: number;
      answer?: string | null;
    }
  >;
}

export interface Memory {
  id: string;
  text: string;
  authorId?: string;
  timestamp: number;
}

export interface SystemSettings {
  isOpen: boolean;
}

// KV Keys
export const getKeys = (roomCode: string) => ({
  users: `room:${roomCode}:users`,
  rsvp: `room:${roomCode}:rsvp`,
  leaderboard: `room:${roomCode}:leaderboard`,
  gameState: `room:${roomCode}:gameState`,
  memories: `room:${roomCode}:memories`,
  settings: `room:${roomCode}:settings`,
  prompts: `room:${roomCode}:prompts`,
});

// Default data for initial seeding (fallback)
import config from '@/data/config.json';

const DEFAULT_USERS: User[] = config.users;

// --- Room Creation & Dynamic Registration ---
export async function createRoom(roomCode: string, hostName: string, hostAvatar: string): Promise<User> {
  const keys = getKeys(roomCode);
  const hostId = hostName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'host';
  const hostUser: User = {
    id: hostId,
    name: hostName,
    avatar: hostAvatar,
    hints: ['The Room Creator / Host'],
    isAdmin: true,
  };
  await kv.set(keys.users, [hostUser]);
  await kv.set(keys.settings, { isOpen: true }); // Open by default for private rooms
  await kv.set(keys.rsvp, {});
  await kv.set(keys.leaderboard, {});
  await kv.set(keys.gameState, {
    gameId: null,
    status: 'LOBBY',
    phase: 'idle',
    players: {},
  });
  await kv.set(keys.memories, []);
  return hostUser;
}

export async function registerUser(roomCode: string, name: string, avatar: string): Promise<User> {
  const keys = getKeys(roomCode);
  const userId = name.toLowerCase().replace(/[^a-z0-9]/g, '') || 'player';
  const newUser: User = {
    id: userId,
    name,
    avatar,
    hints: ['Joined dynamic lobby'],
  };
  const users = (await kv.get<User[]>(keys.users)) || [];
  if (!users.some((u) => u.id === userId)) {
    users.push(newUser);
    await kv.set(keys.users, users);
  }
  return newUser;
}

// --- User Functions ---
export async function getUser(roomCode: string, id: string): Promise<User | undefined> {
  const keys = getKeys(roomCode);
  const users = await kv.get<User[]>(keys.users);
  if (!users || users.length === 0) {
    return undefined;
  }
  return users.find((u) => u.id === id);
}

export async function getAllUsers(roomCode: string): Promise<User[]> {
  const keys = getKeys(roomCode);
  const users = await kv.get<User[]>(keys.users);
  return users || [];
}

// --- RSVP Functions ---
export async function updateUserRSVP(
  roomCode: string,
  userId: string,
  status: RSVP['status'],
  note?: string
) {
  const keys = getKeys(roomCode);
  const rsvp = (await kv.get<Record<string, RSVP>>(keys.rsvp)) || {};
  rsvp[userId] = {
    status,
    note: note || rsvp[userId]?.note || '',
    updatedAt: Date.now(),
  };
  await kv.set(keys.rsvp, rsvp);
}

export async function getRSVP(roomCode: string): Promise<Record<string, RSVP>> {
  const keys = getKeys(roomCode);
  return (await kv.get<Record<string, RSVP>>(keys.rsvp)) || {};
}

export async function resetAllRSVP(roomCode: string) {
  const keys = getKeys(roomCode);
  await kv.set(keys.rsvp, {});
}

// --- Leaderboard Functions ---
export async function updateLeaderboard(
  roomCode: string,
  userId: string,
  points: number,
  gameId?: string
) {
  const keys = getKeys(roomCode);
  const leaderboard =
    (await kv.get<Record<string, LeaderboardEntry>>(keys.leaderboard)) || {};

  if (!leaderboard[userId]) {
    leaderboard[userId] = { points: 0, badges: [], history: [] };
  }

  leaderboard[userId].points += points;
  if (gameId) {
    leaderboard[userId].history.push({ gameId, points });
  }

  await kv.set(keys.leaderboard, leaderboard);
}

export async function getLeaderboard(roomCode: string): Promise<
  Record<string, LeaderboardEntry>
> {
  const keys = getKeys(roomCode);
  return (
    (await kv.get<Record<string, LeaderboardEntry>>(keys.leaderboard)) || {}
  );
}

export async function resetLeaderboard(roomCode: string) {
  const keys = getKeys(roomCode);
  await kv.set(keys.leaderboard, {});
}

// --- Memory Functions ---
export async function addMemory(roomCode: string, text: string, authorId?: string) {
  const keys = getKeys(roomCode);
  const memories = (await kv.get<Memory[]>(keys.memories)) || [];
  memories.push({
    id: crypto.randomUUID(),
    text,
    authorId,
    timestamp: Date.now(),
  });
  await kv.set(keys.memories, memories);
}

export async function getMemories(roomCode: string): Promise<Memory[]> {
  const keys = getKeys(roomCode);
  return (await kv.get<Memory[]>(keys.memories)) || [];
}

export async function clearAllMemories(roomCode: string) {
  const keys = getKeys(roomCode);
  await kv.set(keys.memories, []);
}

// --- System Settings ---
export async function getSystemSettings(roomCode: string): Promise<SystemSettings> {
  const keys = getKeys(roomCode);
  const settings = await kv.get<SystemSettings>(keys.settings);
  if (!settings) {
    const defaultSettings = { isOpen: true }; // Open by default for private rooms
    await kv.set(keys.settings, defaultSettings);
    return defaultSettings;
  }
  return settings;
}

export async function updateSystemSettings(roomCode: string, settings: Partial<SystemSettings>) {
  const keys = getKeys(roomCode);
  const current = await getSystemSettings(roomCode);
  const updated = { ...current, ...settings };
  await kv.set(keys.settings, updated);
}

// --- Game State (optional - may use PartyKit instead) ---
export async function getGameState(roomCode: string): Promise<GameState> {
  const keys = getKeys(roomCode);
  const state = await kv.get<GameState>(keys.gameState);
  if (!state) {
    const defaultState: GameState = {
      gameId: null,
      status: 'LOBBY',
      phase: 'idle',
      players: {},
    };
    await kv.set(keys.gameState, defaultState);
    return defaultState;
  }
  return state;
}

export async function updateGameState(roomCode: string, state: Partial<GameState>) {
  const keys = getKeys(roomCode);
  const current = await getGameState(roomCode);
  const updated = { ...current, ...state };
  await kv.set(keys.gameState, updated);
}

// --- Custom Prompts Decks ---
export async function getRoomPrompts(roomCode: string): Promise<any> {
  const keys = getKeys(roomCode);
  return await kv.get<any>(keys.prompts);
}

export async function saveRoomPrompts(roomCode: string, prompts: any) {
  const keys = getKeys(roomCode);
  await kv.set(keys.prompts, prompts);
}

// --- Public Room Registry ---

export interface PublicRoomEntry {
  roomCode: string;
  name: string;
  hostName: string;
  playerCount: number;
  isPlaying: boolean;
  createdAt: number;
  updatedAt: number;
}

const PUBLIC_ROOMS_KEY = 'global:public-rooms';

export async function registerPublicRoom(entry: PublicRoomEntry) {
  const rooms = (await kv.get<Record<string, PublicRoomEntry>>(PUBLIC_ROOMS_KEY)) || {};
  rooms[entry.roomCode] = { ...entry, updatedAt: Date.now() };
  await kv.set(PUBLIC_ROOMS_KEY, rooms);
}

export async function unregisterPublicRoom(roomCode: string) {
  const rooms = (await kv.get<Record<string, PublicRoomEntry>>(PUBLIC_ROOMS_KEY)) || {};
  delete rooms[roomCode];
  await kv.set(PUBLIC_ROOMS_KEY, rooms);
}

export async function listPublicRooms(): Promise<PublicRoomEntry[]> {
  const rooms = (await kv.get<Record<string, PublicRoomEntry>>(PUBLIC_ROOMS_KEY)) || {};
  // Filter out stale rooms (not updated in 2 hours)
  const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
  return Object.values(rooms)
    .filter((r) => r.updatedAt > twoHoursAgo)
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

