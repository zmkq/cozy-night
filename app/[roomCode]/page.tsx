import { getAllUsers } from '@/lib/db';
import LobbyClientPage from './LobbyClientPage';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { StickerCard } from '@/components/christmas/StickerCard';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData, getRoomSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function RoomLobbyPage({
  params,
}: {
  params: Promise<{ roomCode: string }>;
}) {
  const { roomCode } = await params;
  const upperCode = roomCode.toUpperCase();
  
  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions
  );
  const roomSession = getRoomSession(session, upperCode);
  if (roomSession.isLoggedIn && roomSession.user) {
    redirect(`/${upperCode}/home`);
  }

  const users = await getAllUsers(upperCode);


  if (users.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#0a0914] text-center font-sans">
        <StickerCard className="p-8 max-w-sm" accentColor="red">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-3xl font-black text-white mb-2">Room Not Found</h1>
          <p className="text-white/60 font-bold mb-8">
            The room code <span className="text-[#FFD93D] font-mono">{upperCode}</span> does not exist or has expired.
          </p>
          <Link href="/" className="inline-flex items-center gap-2 text-[#FF4D6A] hover:underline font-black">
            <ArrowLeft size={16} /> Back to Home
          </Link>
        </StickerCard>
      </div>
    );
  }

  return <LobbyClientPage roomCode={upperCode} initialUsers={users} />;
}
