'use server';

import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import {
  defaultSession,
  sessionOptions,
  getRoomSession,
  SessionData,
} from '@/lib/auth';
import {
  getUser,
  updateUserRSVP,
  User,
  getRSVP,
  updateLeaderboard,
  updateSystemSettings,
  getSystemSettings,
  resetLeaderboard,
} from '@/lib/db';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

// Helper to generate room code
function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// --- Auth Actions ---

export async function createRoomAction(hostName: string, hostAvatar: string) {
  try {
    const { createRoom } = await import('@/lib/db');
    const roomCode = generateRoomCode();
    
    const hostUser = await createRoom(roomCode, hostName, hostAvatar);
    
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
    if (!session.rooms) {
      session.rooms = {};
    }
    session.rooms[roomCode] = {
      user: {
        id: hostUser.id,
        name: hostUser.name,
        avatar: hostUser.avatar,
        isAdmin: true,
      },
      isLoggedIn: true,
    };
    // Legacy fallback
    session.user = {
      id: hostUser.id,
      name: hostUser.name,
      avatar: hostUser.avatar,
      isAdmin: true,
    };
    session.isLoggedIn = true;
    await session.save();
    
    return { success: true, roomCode };
  } catch (err: any) {
    console.error('Create Room Error:', err);
    return { error: 'Failed to create room.' };
  }
}

export async function registerAction(roomCode: string, name: string, avatar: string) {
  try {
    const { registerUser } = await import('@/lib/db');
    const user = await registerUser(roomCode, name, avatar);
    
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
    if (!session.rooms) {
      session.rooms = {};
    }
    session.rooms[roomCode] = {
      user: {
        id: user.id,
        name: user.name,
        avatar: user.avatar,
        isAdmin: user.isAdmin || false,
      },
      isLoggedIn: true,
    };
    // Legacy fallback
    session.user = {
      id: user.id,
      name: user.name,
      avatar: user.avatar,
      isAdmin: user.isAdmin || false,
    };
    session.isLoggedIn = true;
    await session.save();
    
    return { success: true, userId: user.id };
  } catch (err: any) {
    console.error('Register Action Error:', err);
    return { error: 'Failed to join room.' };
  }
}

export async function loginAction(roomCode: string, userId: string) {
  try {
    const user = await getUser(roomCode, userId);
    if (!user) {
      return { error: 'User not found.' };
    }

    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(
      cookieStore,
      sessionOptions
    );

    if (!session.rooms) {
      session.rooms = {};
    }
    session.rooms[roomCode] = {
      user: {
        id: user.id,
        name: user.name,
        avatar: user.avatar,
        isAdmin: user.isAdmin || false,
      },
      isLoggedIn: true,
    };
    // Legacy fallback
    session.user = {
      id: user.id,
      name: user.name,
      avatar: user.avatar,
      isAdmin: user.isAdmin || false,
    };
    session.isLoggedIn = true;
    await session.save();

    return { success: true };
  } catch (err: any) {
    console.error('Login Error:', err);
    return { error: 'Internal server error.' };
  }
}

export async function logoutAction(roomCode: string) {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(
    cookieStore,
    sessionOptions
  );
  if (session.rooms) {
    delete session.rooms[roomCode];
  }
  // Legacy cleanup
  session.user = defaultSession.user;
  session.isLoggedIn = false;
  await session.save();
  redirect(`/${roomCode}`);
}

export async function getSessionAction(roomCode: string) {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(
    cookieStore,
    sessionOptions
  );
  const roomSession = getRoomSession(session, roomCode);
  return {
    user: roomSession.user || null,
    isLoggedIn: !!roomSession.isLoggedIn,
  };
}

// --- RSVP Actions ---

export async function updateRSVPAction(
  roomCode: string,
  status: 'coming' | 'maybe' | 'no',
  note?: string
) {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(
    cookieStore,
    sessionOptions
  );
  const roomSession = getRoomSession(session, roomCode);
  if (!roomSession.isLoggedIn || !roomSession.user) return { error: 'Not logged in' };

  await updateUserRSVP(roomCode, roomSession.user.id, status, note);
  revalidatePath(`/${roomCode}/home`);
  return { success: true };
}

export async function getAttendeesAction(roomCode: string) {
  return await getRSVP(roomCode);
}

export async function updateLeaderboardAction(roomCode: string, gameId: string, points: number) {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(
    cookieStore,
    sessionOptions
  );
  const roomSession = getRoomSession(session, roomCode);
  if (!roomSession.isLoggedIn || !roomSession.user) return { error: 'Not logged in' };

  const { updateLeaderboard } = await import('@/lib/db');
  await updateLeaderboard(roomCode, roomSession.user.id, points, gameId);
  revalidatePath(`/${roomCode}/leaderboard`);
  return { success: true };
}

// --- Admin Actions ---

export async function toggleSiteOpenAction(roomCode: string, isOpen: boolean) {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(
      cookieStore,
      sessionOptions
    );
    const roomSession = getRoomSession(session, roomCode);

    if (!roomSession.isLoggedIn || !roomSession.user?.isAdmin) {
      console.log('toggleSiteOpenAction: Unauthorized', {
        isLoggedIn: roomSession.isLoggedIn,
        isAdmin: roomSession.user?.isAdmin,
      });
      return { error: 'Unauthorized' };
    }

    console.log('toggleSiteOpenAction: Updating settings to', isOpen);
    await updateSystemSettings(roomCode, { isOpen });
    console.log('toggleSiteOpenAction: Success');
    revalidatePath(`/${roomCode}`);
    revalidatePath(`/${roomCode}/home`);
    return { success: true };
  } catch (err: any) {
    console.error('toggleSiteOpenAction error:', err);
    return { error: err?.message || 'Failed to toggle site' };
  }
}

export async function resetLeaderboardAction(roomCode: string) {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(
    cookieStore,
    sessionOptions
  );
  const roomSession = getRoomSession(session, roomCode);

  if (!roomSession.isLoggedIn || !roomSession.user.isAdmin) {
    return { error: 'Unauthorized' };
  }

  await resetLeaderboard(roomCode);
  revalidatePath(`/${roomCode}/leaderboard`);
  return { success: true };
}

export async function getSystemStatusAction(roomCode: string) {
  return await getSystemSettings(roomCode);
}

export async function clearMemoriesAction(roomCode: string) {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(
    cookieStore,
    sessionOptions
  );
  const roomSession = getRoomSession(session, roomCode);

  if (!roomSession.isLoggedIn || !roomSession.user.isAdmin) {
    return { error: 'Unauthorized' };
  }

  const { clearAllMemories } = await import('@/lib/db');
  await clearAllMemories(roomCode);
  revalidatePath(`/${roomCode}/memories`);
  return { success: true };
}

export async function saveMemoryAction(roomCode: string, text: string) {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(
    cookieStore,
    sessionOptions
  );
  const roomSession = getRoomSession(session, roomCode);

  if (!roomSession.isLoggedIn || !roomSession.user) {
    return { error: 'Unauthorized' };
  }

  const { addMemory } = await import('@/lib/db');
  await addMemory(roomCode, text, roomSession.user.id);
  revalidatePath(`/${roomCode}/home`);
  revalidatePath(`/${roomCode}/memories`);
  return { success: true };
}

export async function resetAllRSVPAction(roomCode: string) {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(
    cookieStore,
    sessionOptions
  );
  const roomSession = getRoomSession(session, roomCode);

  if (!roomSession.isLoggedIn || !roomSession.user.isAdmin) {
    return { error: 'Unauthorized' };
  }

  const { resetAllRSVP } = await import('@/lib/db');
  await resetAllRSVP(roomCode);
  revalidatePath(`/${roomCode}/home`);
  return { success: true };
}

export async function getAdminStatsAction(roomCode: string) {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(
    cookieStore,
    sessionOptions
  );
  const roomSession = getRoomSession(session, roomCode);

  if (!roomSession.isLoggedIn || !roomSession.user.isAdmin) {
    return { error: 'Unauthorized' };
  }

  const { getLeaderboard, getRSVP, getMemories, getAllUsers } = await import(
    '@/lib/db'
  );

  const [leaderboard, rsvp, memories, users] = await Promise.all([
    getLeaderboard(roomCode),
    getRSVP(roomCode),
    getMemories(roomCode),
    getAllUsers(roomCode),
  ]);

  return {
    totalUsers: users.length,
    totalPoints: Object.values(leaderboard).reduce(
      (sum: number, entry: any) => sum + (entry.points || 0),
      0
    ),
    memoriesCount: memories.length,
    rsvpCounts: {
      coming: Object.values(rsvp).filter((r: any) => r.status === 'coming')
        .length,
      maybe: Object.values(rsvp).filter((r: any) => r.status === 'maybe')
        .length,
      no: Object.values(rsvp).filter((r: any) => r.status === 'no').length,
      pending: users.length - Object.keys(rsvp).length,
    },
  };
}

// --- Custom Prompts Actions ---

export async function savePromptsAction(roomCode: string, prompts: any) {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(
      cookieStore,
      sessionOptions
    );
    const roomSession = getRoomSession(session, roomCode);

    if (!roomSession.isLoggedIn || !roomSession.user.isAdmin) {
      return { error: 'Unauthorized' };
    }

    const { saveRoomPrompts } = await import('@/lib/db');
    await saveRoomPrompts(roomCode, prompts);
    return { success: true };
  } catch (err: any) {
    console.error('Save Prompts Error:', err);
    return { error: 'Failed to save prompts.' };
  }
}

export async function getPromptsAction(roomCode: string) {
  try {
    const { getRoomPrompts } = await import('@/lib/db');
    const prompts = await getRoomPrompts(roomCode);
    return { prompts };
  } catch (err: any) {
    console.error('Get Prompts Error:', err);
    return { error: 'Failed to fetch prompts.' };
  }
}

export async function listPublicRoomsAction() {
  try {
    const { listPublicRooms } = await import('@/lib/db');
    const rooms = await listPublicRooms();
    return { rooms };
  } catch (err: any) {
    console.error('List Public Rooms Error:', err);
    return { rooms: [] };
  }
}

export async function setRoomPublicAction(
  roomCode: string,
  isPublic: boolean,
  roomName?: string,
  hostName?: string,
  playerCount?: number
) {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
    const roomSession = getRoomSession(session, roomCode);

    if (!roomSession.isLoggedIn || !roomSession.user?.isAdmin) {
      return { error: 'Unauthorized' };
    }

    if (isPublic) {
      const { registerPublicRoom } = await import('@/lib/db');
      await registerPublicRoom({
        roomCode,
        name: roomName || `${hostName || 'Unknown'}'s Room`,
        hostName: hostName || roomSession.user.name,
        playerCount: playerCount || 1,
        isPlaying: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    } else {
      const { unregisterPublicRoom } = await import('@/lib/db');
      await unregisterPublicRoom(roomCode);
    }

    return { success: true };
  } catch (err: any) {
    console.error('Set Room Public Error:', err);
    return { error: 'Failed to update public status.' };
  }
}

export async function getMemoriesAction(roomCode: string) {
  try {
    const { getMemories } = await import('@/lib/db');
    const memories = await getMemories(roomCode.toUpperCase());
    return { memories };
  } catch (err: any) {
    console.error('Get Memories Error:', err);
    return { memories: [] };
  }
}

export async function deleteMemoryAction(roomCode: string, memoryId: string) {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
    const roomSession = getRoomSession(session, roomCode);

    if (!roomSession.isLoggedIn || !roomSession.user) {
      return { error: 'Unauthorized' };
    }

    const { getMemories } = await import('@/lib/db');
    const { Redis } = await import('@upstash/redis');
    const kv = new Redis({
      url: process.env.KV_REST_API_URL!,
      token: process.env.KV_REST_API_TOKEN!,
    });

    const memories = await getMemories(roomCode.toUpperCase());
    const updated = memories.filter((m: any) => m.id !== memoryId);
    await kv.set(`room:${roomCode.toUpperCase()}:memories`, updated);
    revalidatePath(`/${roomCode}/memories`);
    return { success: true };
  } catch (err: any) {
    console.error('Delete Memory Error:', err);
    return { error: 'Failed to delete memory.' };
  }
}
