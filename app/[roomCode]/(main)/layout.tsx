import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData, getRoomSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { logoutAction } from '@/app/actions';
import Link from 'next/link';
import { LogOut, Home, Gamepad2, Trophy } from 'lucide-react';
import { PartyWrapper } from '@/components/christmas/PartyWrapper';
import { SpectatorGate } from '@/components/games/SpectatorGate';
import { getSystemSettings } from '@/lib/db';
import config from '@/data/config.json';

export default async function MainLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ roomCode: string }>;
}) {
  const { roomCode } = await params;
  const upperCode = roomCode.toUpperCase();
  
  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions
  );
  
  const roomSession = getRoomSession(session, upperCode);

  if (!roomSession.isLoggedIn || !roomSession.user) {
    redirect(`/${upperCode}`);
  }

  const settings = await getSystemSettings(upperCode);
  const isSiteOpen = settings.isOpen;

  // Extract plain values to pass to client component
  const userId = roomSession.user.id;
  const userName = roomSession.user.name;
  const userAvatar = roomSession.user.avatar || '🎄';

  const logout = logoutAction.bind(null, upperCode);

  return (
    <PartyWrapper userId={userId} userName={userName} userAvatar={userAvatar} roomCode={upperCode}>
      <div className="flex flex-col min-h-screen">
        {/* Top Bar - Dark Sticker Theme */}
        <header className="px-4 md:px-6 py-3 flex items-center justify-between z-50 sticky top-0 bg-[#0a0a12]/95 backdrop-blur-md border-b-2 border-white/10">
          <Link href={`/${upperCode}/home`} className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-[#FFD93D] border-2 border-white text-2xl flex items-center justify-center shadow-[3px_3px_0px_#1a1a1a] group-hover:translate-x-[-2px] group-hover:translate-y-[-2px] group-hover:shadow-[5px_5px_0px_#1a1a1a] transition-all">
              🎄
            </div>
            <span className="font-black text-white hidden md:block uppercase tracking-wider">
              {config.event.appName}
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <span className="text-xs md:text-sm text-white/50 hidden md:inline-block">
              Welcome,{' '}
              <span className="text-white font-bold">{roomSession.user.name}</span>
            </span>
            <form action={logout}>
              <button
                type="submit"
                className="w-9 h-9 rounded-xl bg-transparent border-2 border-white/20 text-white/50 hover:text-[#FF4D6A] hover:border-[#FF4D6A] flex items-center justify-center transition-all">
                <LogOut size={16} />
              </button>
            </form>
          </div>
        </header>

        <main className="flex-1 max-w-6xl mx-auto w-full pb-28 md:pb-8 px-4">
          <SpectatorGate>{children}</SpectatorGate>
        </main>

        {/* Mobile Bottom Nav - Dark Sticker Theme */}
        {isSiteOpen && (
          <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0a0a12]/95 backdrop-blur-xl border-t-2 border-white/10 p-2 flex justify-around z-50 pb-safe">
            <Link
              href={`/${upperCode}/home`}
              className="flex flex-col items-center gap-1 py-2 px-4 text-white/40 hover:text-[#FFD93D] transition-colors">
              <div className="w-10 h-10 rounded-xl bg-white/5 border-2 border-white/10 flex items-center justify-center hover:border-[#FFD93D]/50 hover:bg-[#FFD93D]/10 transition-all">
                <Home size={18} />
              </div>
              <span className="text-[10px] uppercase tracking-wider font-bold">
                Home
              </span>
            </Link>
            <Link
              href={`/${upperCode}/games`}
              className="flex flex-col items-center gap-1 py-2 px-4 text-white/40 hover:text-[#2ECC71] transition-colors">
              <div className="w-10 h-10 rounded-xl bg-white/5 border-2 border-white/10 flex items-center justify-center hover:border-[#2ECC71]/50 hover:bg-[#2ECC71]/10 transition-all">
                <Gamepad2 size={18} />
              </div>
              <span className="text-[10px] uppercase tracking-wider font-bold">
                Games
              </span>
            </Link>
            <Link
              href={`/${upperCode}/leaderboard`}
              className="flex flex-col items-center gap-1 py-2 px-4 text-white/40 hover:text-[#FF4D6A] transition-colors">
              <div className="w-10 h-10 rounded-xl bg-white/5 border-2 border-white/10 flex items-center justify-center hover:border-[#FF4D6A]/50 hover:bg-[#FF4D6A]/10 transition-all">
                <Trophy size={18} />
              </div>
              <span className="text-[10px] uppercase tracking-wider font-bold">
                Leaderboard
              </span>
            </Link>
          </nav>
        )}
      </div>
    </PartyWrapper>
  );
}
