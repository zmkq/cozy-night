'use client';

import { useState, useEffect } from 'react';
import { StickerCard } from '@/components/christmas/StickerCard';
import { CartoonButton } from '@/components/christmas/CartoonButton';
import { FloatingProps } from '@/components/christmas/FloatingProps';
import {
  updateRSVPAction,
  getSessionAction,
  getSystemStatusAction,
} from '@/app/actions';
import { useGameSync } from '@/hooks/useGameSync';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import {
  Play,
  Trophy,
  Calendar,
  MapPin,
  Shirt,
  Users,
  Check,
  HelpCircle,
  X,
  Gamepad2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ClosedView } from '@/components/christmas/ClosedView';
import { AdminControls } from '@/components/christmas/AdminControls';
import config from '@/data/config.json';

type RsvpStatus = 'coming' | 'maybe' | 'no' | 'pending';

export default function HomePage() {
  const [user, setUser] = useState<{
    id: string;
    name: string;
    avatar?: string;
    isAdmin?: boolean;
  } | null>(null);
  const [myRsvp, setMyRsvp] = useState<RsvpStatus>('pending');
  const [loading, setLoading] = useState(true);
  const [isSiteOpen, setIsSiteOpen] = useState(false);
  const router = useRouter();
  const params = useParams();
  const roomCode = ((params?.roomCode as string) || '').toUpperCase();

  // Real-time sync for group status
  const { rsvp: groupRsvp, users: MEMBERS, isLoading: syncLoading } = useGameSync(roomCode);

  useEffect(() => {
    const loadSession = async () => {
      try {
        setLoading(true);
        console.log('HomePage: loading session...');

        // Load session first
        const session = await getSessionAction(roomCode);
        console.log('HomePage: session loaded', !!session.user);

        if (!session.isLoggedIn || !session.user) {
          console.log('HomePage: not logged in, redirecting...');
          router.push('/');
          return;
        }

        setUser(session.user);

        // Load status separately
        try {
          const settings = await getSystemStatusAction(roomCode);
          setIsSiteOpen(settings.isOpen);
        } catch (sErr) {
          console.error('Failed to load system settings:', sErr);
          setIsSiteOpen(true); // default to open on error
        }

        setLoading(false);
      } catch (err) {
        console.error('HomePage: critical load error', err);
        // If critical error, redirect home just in case
        router.push('/');
      }
    };
    loadSession();
  }, [router]);

  // Update my RSVP from sync data
  useEffect(() => {
    if (user && groupRsvp && groupRsvp[user.id]) {
      setMyRsvp(groupRsvp[user.id].status);
    }
  }, [groupRsvp, user]);

  const handleRsvp = async (status: RsvpStatus) => {
    if (status === 'pending') return;
    setMyRsvp(status);
    await updateRSVPAction(roomCode, status);
  };

  const statusConfig = {
    coming: {
      color: 'bg-pine-green',
      icon: Check,
      label: 'Coming!',
      glow: 'green' as const,
    },
    maybe: {
      color: 'bg-gold-glow',
      icon: HelpCircle,
      label: 'Maybe',
      glow: 'gold' as const,
    },
    no: {
      color: 'bg-cozy-red',
      icon: X,
      label: "Can't Make It",
      glow: 'red' as const,
    },
    pending: {
      color: 'bg-white/20',
      icon: HelpCircle,
      label: 'Pending',
      glow: 'none' as const,
    },
  };

  // Dynamic users list from game sync

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white/60 animate-pulse font-bold">
          Checking Naughty List...
        </div>
      </div>
    );
  }

  // --- GATEKEEPER LOGIC ---
  if (!isSiteOpen && !user?.isAdmin) {
    return <ClosedView user={user!} initialRsvp={myRsvp} roomCode={roomCode} />;
  }

  return (
    <div className="min-h-screen p-6 pt-12 space-y-8 max-w-2xl mx-auto pb-32">
      <FloatingProps variant="minimal" />

      {/* Welcome Header */}
      <div className="text-center space-y-4">
        <div className="w-24 h-24 mx-auto rounded-full border-[6px] border-white overflow-hidden bg-white shadow-[6px_6px_0px_#1a1a1a]">
          {user?.avatar?.startsWith('http') ? (
            <img src={user.avatar} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl bg-gray-200">
              {user?.avatar || '👤'}
            </div>
          )}
        </div>
        <div>
          <h1 className="text-4xl font-black text-white">
            Welcome, {user?.name}!
          </h1>
          <p className="text-white/60 font-bold mt-1">Tonight awaits you.</p>
        </div>
      </div>

      {/* Invitation Card */}
      <StickerCard
        className="p-6 text-center space-y-4"
        accentColor="gold"
        rotate={-1}>
        <div className="text-5xl">🎄</div>
        <h2 className="text-2xl font-bold text-white">{config.event.eventTitle} Invitation</h2>

        <div className="flex flex-wrap justify-center gap-4 text-white/80 text-sm font-medium">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-[#FF4D6A]" />
            <span>{config.event.date}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-[#2ECC71]" />
            <span>{config.event.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <Shirt size={16} className="text-[#FFD93D]" />
            <span>{config.event.dressCode}</span>
          </div>
        </div>

        <div className="pt-2 border-t border-white/20 text-white/50 text-xs font-bold">
          Official {config.event.hostName} Summit
        </div>
      </StickerCard>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href={`/${roomCode}/games`}>
          <StickerCard className="p-5 h-full" accentColor="green" rotate={-1}>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-[#2ECC71]/30 border-2 border-[#2ECC71] flex items-center justify-center">
                <Gamepad2 size={28} className="text-[#2ECC71]" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Games</h3>
                <p className="text-white/60 text-sm font-medium">Enter the Arena</p>
              </div>
            </div>
          </StickerCard>
        </Link>

        <Link href={`/${roomCode}/leaderboard`}>
          <StickerCard className="p-5 h-full" accentColor="gold" rotate={1}>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-[#FFD93D]/30 border-2 border-[#FFD93D] flex items-center justify-center">
                <Trophy size={28} className="text-[#FFD93D]" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Leaderboard</h3>
                <p className="text-white/60 text-sm font-medium">
                  See who is #1
                </p>
              </div>
            </div>
          </StickerCard>
        </Link>
      </div>

      {/* Guests Status */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-white/60">
          <Users size={16} />
          <span className="text-sm font-bold uppercase tracking-wider">
            Guests
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {MEMBERS.map((member) => {
            const memberRsvp = groupRsvp?.[member.id];
            const status = (memberRsvp?.status || 'pending') as RsvpStatus;
            const configObj = statusConfig[status];

            return (
              <div
                key={member.id}
                className="bg-[#1a1a1a] border-2 border-white/20 rounded-xl p-4 transition-all hover:scale-105 active:scale-95">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full border-2 border-white/50 overflow-hidden bg-white/10 shrink-0">
                      {member.avatar && member.avatar.startsWith('http') ? (
                        <img
                          src={member.avatar}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl">
                          {member.avatar}
                        </div>
                      )}
                    </div>
                    <div
                      className={cn(
                        'absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-black flex items-center justify-center shadow-sm',
                        status === 'coming' && 'bg-[#2ECC71]',
                        status === 'maybe' && 'bg-[#FFD93D]',
                        status === 'no' && 'bg-[#FF4D6A]',
                        status === 'pending' && 'bg-white/20'
                      )}>
                      {status !== 'pending' && (
                        <configObj.icon
                          size={10}
                          className={cn(
                            status === 'coming' && 'text-black',
                            status === 'maybe' && 'text-black',
                            status === 'no' && 'text-white'
                          )}
                        />
                      )}
                    </div>
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-bold text-white text-sm truncate">
                      {member.name}
                    </p>
                    <p
                      className={cn(
                        'text-[10px] uppercase tracking-wider truncate',
                        status === 'coming' && 'text-[#2ECC71]',
                        status === 'maybe' && 'text-[#FFD93D]',
                        status === 'no' && 'text-[#FF4D6A]',
                        status === 'pending' && 'text-white/40'
                      )}>
                      {configObj.label}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ADMIN CONTROLS */}
      {user?.isAdmin && (
        <AdminControls isOpen={isSiteOpen} onToggle={setIsSiteOpen} roomCode={roomCode} />
      )}
    </div>
  );
}
