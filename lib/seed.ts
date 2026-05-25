import 'dotenv/config';
import { hashPassword } from '../lib/auth';
import { kv } from '@vercel/kv';
import config from '../data/config.json';

// Types matching lib/db.ts
interface User {
  id: string;
  name: string;
  avatar: string; // Emoji or URL
  hash?: string; // Bcrypt hash
  hints: string[];
  isAdmin?: boolean;
}

// KV Keys matching lib/db.ts
const KEYS = {
  users: 'mo-night:users',
  rsvp: 'mo-night:rsvp',
  leaderboard: 'mo-night:leaderboard',
  gameState: 'mo-night:gameState',
  memories: 'mo-night:memories',
  settings: 'mo-night:settings',
};

async function seed() {
  console.log('🎄 Seeding Cozy Night Database (Vercel KV)...');

  // Load and hash/resolve passwords from config
  const users: User[] = [];
  for (const u of config.users) {
    let hash = u.hash;
    if ((u as any).password) {
      hash = await hashPassword((u as any).password);
    }
    users.push({
      id: u.id,
      name: u.name,
      avatar: u.avatar,
      hash: hash || await hashPassword(u.id),
      hints: u.hints,
      isAdmin: u.isAdmin,
    });
  }

  // 1. Set Users
  console.log('Setting users...');
  await kv.set(KEYS.users, users);

  // 2. Reset/Init other keys if they don't exist
  console.log('Initializing collections...');
  await kv.set(KEYS.rsvp, {});
  await kv.set(KEYS.leaderboard, {});

  // Reset Game State
  await kv.set(KEYS.gameState, {
    gameId: null,
    status: 'LOBBY',
    phase: 'idle',
    players: {},
  });

  await kv.set(KEYS.memories, []);

  // System Settings
  await kv.set(KEYS.settings, { isOpen: false });

  console.log('✨ Database seeded successfully to Vercel KV!');
}

seed().catch(console.error);
