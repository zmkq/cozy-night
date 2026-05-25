import { getGameState, getLeaderboard, getRSVP } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roomCode = searchParams.get('roomCode')?.toUpperCase();
    
    if (!roomCode) {
      return NextResponse.json({ error: 'roomCode is required' }, { status: 400 });
    }

    const gameState = await getGameState(roomCode);
    const leaderboard = await getLeaderboard(roomCode);
    const rsvp = await getRSVP(roomCode);
    const { getAllUsers } = await import('@/lib/db');
    const users = await getAllUsers(roomCode);

    // Return only public sync data
    return NextResponse.json({
      gameState,
      leaderboard,
      rsvp,
      users,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Sync Failed' }, { status: 500 });
  }
}
