'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CartoonButton } from '@/components/christmas/CartoonButton';
import { StickerCard } from '@/components/christmas/StickerCard';
import { FloatingProps } from '@/components/christmas/FloatingProps';
import { useToast } from '@/components/ui/use-toast';
import { registerAction, loginAction } from '@/app/actions';
import { User } from '@/lib/db';
import { ArrowLeft, Sparkles, UserPlus, Users } from 'lucide-react';
import Link from 'next/link';

const AVATARS = ['🎅', '🤶', '🧝', '🦌', '⛄', '🎁', '🎄', '🍪', '🔥', '🧦', '🧸', '🔔'];

interface LobbyClientPageProps {
  roomCode: string;
  initialUsers: User[];
}

export default function LobbyClientPage({ roomCode, initialUsers }: LobbyClientPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [activeForm, setActiveForm] = useState<'select' | 'new'>('select');

  // New Player Form State
  const [playerName, setPlayerName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('🎁');
  const [joining, setJoining] = useState(false);

  const handleNewPlayerJoin = async () => {
    if (!playerName.trim()) {
      toast({
        title: 'Name Required',
        description: 'Please type your name to join.',
        variant: 'destructive',
      });
      return;
    }

    const nameExists = users.some(
      (u) => u.name.toLowerCase() === playerName.trim().toLowerCase()
    );
    if (nameExists) {
      toast({
        title: 'Name Taken',
        description: 'Someone in this room already has that name!',
        variant: 'destructive',
      });
      return;
    }

    setJoining(true);
    const result = await registerAction(roomCode, playerName.trim(), selectedAvatar);
    setJoining(false);

    if (result.error) {
      toast({
        title: 'Error Joining',
        description: result.error,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Joined Room! 🎄',
        description: `Welcome to the party, ${playerName.trim()}!`,
      });
      router.push(`/${roomCode}/home`);
    }
  };

  const handleSelectPlayer = async (userId: string, userName: string) => {
    const result = await loginAction(roomCode, userId);
    if (result.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Welcome Back! 👋',
        description: `Logged in as ${userName}`,
      });
      router.push(`/${roomCode}/home`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-linear-to-b from-[#0f0c1b] via-[#0b0914] to-[#05040a] relative overflow-hidden font-sans">
      <FloatingProps variant="full" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-pink-900/10 blur-[120px] pointer-events-none z-0" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Lobby Header */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-white/60 hover:text-white font-bold transition-colors bg-black/40 px-4 py-2 rounded-full border border-white/10 hover:border-white text-xs">
            <ArrowLeft size={14} /> Back
          </Link>
          <div className="bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-xs font-black text-[#FFD93D] uppercase tracking-widest font-mono">
            Room: {roomCode}
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-white/5 border border-white/10 rounded-2xl p-1 shadow-inner">
          <button
            onClick={() => setActiveForm('select')}
            className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-300 ${
              activeForm === 'select'
                ? 'bg-[#FF4D6A] text-white shadow-md'
                : 'text-white/50 hover:text-white'
            }`}>
            Select Profile
          </button>
          <button
            onClick={() => setActiveForm('new')}
            className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-300 ${
              activeForm === 'new'
                ? 'bg-[#FF4D6A] text-white shadow-md'
                : 'text-white/50 hover:text-white'
            }`}>
            Create Profile
          </button>
        </div>

        {/* Form Screens */}
        {activeForm === 'select' ? (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4">
            <StickerCard className="p-6 text-center" accentColor="red">
              <div className="flex items-center justify-center gap-2 mb-6">
                <Users size={20} className="text-[#FF4D6A]" />
                <h3 className="text-lg font-black text-white uppercase tracking-wider">
                  Active Party Members
                </h3>
              </div>

              {/* Profiles list */}
              <div className="grid grid-cols-2 gap-3 max-h-[320px] overflow-y-auto pr-1">
                {users.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleSelectPlayer(user.id, user.name)}
                    className="flex flex-col items-center p-4 bg-white/5 border-2 border-white/10 hover:border-[#FF4D6A] hover:bg-[#FF4D6A]/10 rounded-2xl transition-all group relative">
                    <div className="text-4xl mb-2 filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.3)] group-hover:scale-110 transition-transform">
                      {user.avatar && user.avatar.startsWith('http') ? (
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-12 h-12 rounded-full object-cover border border-white/20"
                        />
                      ) : (
                        user.avatar || '👤'
                      )}
                    </div>
                    <span className="text-white font-black text-sm uppercase tracking-wide truncate max-w-full">
                      {user.name}
                    </span>
                    {user.isAdmin && (
                      <span className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-full bg-[#FFD93D] text-[8px] font-black text-black tracking-widest uppercase">
                        Host
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-white/10 text-white/40 text-xs font-bold font-sans">
                Select your name to log back in
              </div>
            </StickerCard>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4">
            <StickerCard className="p-6 text-left" accentColor="gold">
              <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2 uppercase tracking-wider">
                <UserPlus size={20} className="text-[#FFD93D]" /> Join Room Lobby
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-white/40 block mb-2">
                    Choose Your Display Name
                  </label>
                  <input
                    type="text"
                    maxLength={15}
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="e.g. Rudolph"
                    className="w-full h-12 bg-black/40 border-2 border-white/10 hover:border-white/30 focus:border-[#FFD93D] rounded-2xl px-4 text-white font-bold outline-none transition-all placeholder:text-white/20 text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-white/40 block mb-2">
                    Choose Your Avatar
                  </label>
                  <div className="grid grid-cols-6 gap-1.5 p-2 bg-black/30 rounded-2xl border border-white/5">
                    {AVATARS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setSelectedAvatar(emoji)}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all border-2 ${
                          selectedAvatar === emoji
                            ? 'bg-[#FFD93D]/20 border-[#FFD93D] scale-110 shadow-lg'
                            : 'bg-transparent border-transparent hover:bg-white/5 hover:scale-105'
                        }`}>
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <CartoonButton
                  variant="green"
                  fullWidth
                  loading={joining}
                  onClick={handleNewPlayerJoin}
                  className="mt-4">
                  Join Party 🎉
                </CartoonButton>
              </div>
            </StickerCard>
          </motion.div>
        )}
      </div>
    </div>
  );
}
