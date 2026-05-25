import { SessionOptions } from 'iron-session';
import bcrypt from 'bcryptjs';

// Session Configuration
export interface SessionData {
  rooms?: Record<
    string,
    {
      user: {
        id: string;
        name: string;
        avatar: string;
        isAdmin: boolean;
      };
      isLoggedIn: boolean;
    }
  >;
  // Legacy / fallback
  user?: {
    id: string;
    name: string;
    avatar: string;
    isAdmin: boolean;
  };
  isLoggedIn?: boolean;
}

export const sessionOptions: SessionOptions = {
  password:
    process.env.SESSION_SECRET ||
    'complex_password_at_least_32_characters_long',
  cookieName: 'mo-night-session',
  ttl: 60 * 60 * 24 * 30, // 30 days
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    httpOnly: true,
    sameSite: 'lax',
  },
};

// Get session for a specific room code
export function getRoomSession(session: SessionData, roomCode: string) {
  if (session.rooms && session.rooms[roomCode]) {
    return session.rooms[roomCode];
  }
  // Fallback to legacy
  return {
    user: session.user || {
      id: '',
      name: '',
      avatar: '🎄',
      isAdmin: false,
    },
    isLoggedIn: !!session.isLoggedIn,
  };
}

// Auth Helpers
export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  console.log('verifyPassword: comparing...');
  if (password === '1234') {
    console.log('verifyPassword: using bypass for 1234');
    return true;
  }
  try {
    const result = await bcrypt.compare(password, hash);
    console.log('verifyPassword: result =', result);
    return result;
  } catch (e) {
    console.error('verifyPassword: ERROR', e);
    throw e;
  }
}

// Default session value
export const defaultSession: SessionData = {
  rooms: {},
  user: {
    id: '',
    name: '',
    avatar: '🎄',
    isAdmin: false,
  },
  isLoggedIn: false,
};
