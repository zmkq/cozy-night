'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { CartoonButton } from '@/components/christmas/CartoonButton';
import { StickerCard } from '@/components/christmas/StickerCard';
import { FloatingProps } from '@/components/christmas/FloatingProps';
import { Sparkles, Gamepad2, ArrowRight, Plus } from 'lucide-react';
import { createRoomAction } from '@/app/actions';
import { useToast } from '@/components/ui/use-toast';

const AVATARS = ['🎅', '🤶', '🧝', '🦌', '⛄', '🎁', '🎄', '🍪', '🔥', '🧦', '🧸', '🔔'];

export default function GlobalLandingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  
  // Create Room State
  const [hostName, setHostName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('🎅');
  const [creating, setCreating] = useState(false);
  
  // Join Room State
  const [roomCode, setRoomCode] = useState('');

  const handleCreateRoom = async () => {
    if (!hostName.trim()) {
      toast({
        title: 'Name Required',
        description: 'Please enter your name to host a room.',
        variant: 'destructive',
      });
      return;
    }
    
    setCreating(true);
    const result = await createRoomAction(hostName.trim(), selectedAvatar);
    setCreating(false);

    if (result?.error) {
      toast({
        title: 'Error Creating Room',
        description: result.error,
        variant: 'destructive',
      });
    } else if (result?.roomCode) {
      toast({
        title: 'Room Created! 🎊',
        description: `Your room code is ${result.roomCode}`,
      });
      router.push(`/${result.roomCode}/home`);
    }
  };

  const handleJoinRoom = () => {
    const cleanCode = roomCode.trim().toUpperCase();
    if (!cleanCode || cleanCode.length < 3) {
      toast({
        title: 'Invalid Code',
        description: 'Please enter a valid room code.',
        variant: 'destructive',
      });
      return;
    }
    router.push(`/${cleanCode}`);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-linear-to-b from-[#0f0c1b] via-[#0b0914] to-[#05040a] relative overflow-hidden font-sans">
      <FloatingProps variant="full" />
      
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-purple-900/10 blur-[120px] pointer-events-none z-0" />

      <div className="w-full max-w-md relative z-10 space-y-8 text-center">
        {/* Logo / Header */}
        <div className="space-y-3">
          <motion.div
            initial={{ scale: 0, rotate: -15 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', damping: 10 }}
            className="inline-flex items-center gap-2 bg-[#FF4D6A] text-white px-5 py-2 rounded-full text-sm font-black border-3 border-white shadow-[4px_4px_0px_#1a1a1a]">
            <Sparkles size={16} className="animate-spin-slow" /> GLOBAL MULTIPLAYER
          </motion.div>
          
          <motion.h1 
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-5xl md:text-6xl font-black text-white tracking-tighter uppercase drop-shadow-[4px_4px_0px_#1a1a1a] leading-none">
            COZY NIGHT
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-white/60 font-bold text-lg">
            Party games with your friends. Anytime, anywhere.
          </motion.p>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-white/5 border border-white/10 rounded-2xl p-1 shadow-inner relative z-10">
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-3 text-sm font-black uppercase tracking-wider rounded-xl transition-all duration-300 ${
              activeTab === 'create' 
                ? 'bg-[#FFD93D] text-black shadow-md' 
                : 'text-white/50 hover:text-white'
            }`}>
            Host Room
          </button>
          <button
            onClick={() => setActiveTab('join')}
            className={`flex-1 py-3 text-sm font-black uppercase tracking-wider rounded-xl transition-all duration-300 ${
              activeTab === 'join' 
                ? 'bg-[#FFD93D] text-black shadow-md' 
                : 'text-white/50 hover:text-white'
            }`}>
            Join Room
          </button>
        </div>

        {/* Action Card */}
        <AnimatePresence mode="wait">
          {activeTab === 'create' ? (
            <motion.div
              key="create-card"
              initial={{ opacity: 0, x: -30, rotateY: 15 }}
              animate={{ opacity: 1, x: 0, rotateY: 0 }}
              exit={{ opacity: 0, x: 30, rotateY: -15 }}
              transition={{ duration: 0.25 }}
              className="w-full">
              <StickerCard className="p-6 text-left" accentColor="gold">
                <h3 className="text-xl font-black text-white mb-4 flex items-center gap-2">
                  <Plus size={20} className="text-[#FFD93D]" /> Start a new party
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-black uppercase tracking-wider text-white/40 block mb-2">
                      Your Display Name
                    </label>
                    <input
                      type="text"
                      maxLength={15}
                      value={hostName}
                      onChange={(e) => setHostName(e.target.value)}
                      placeholder="e.g. Santa Claus"
                      className="w-full h-14 bg-black/40 border-2 border-white/10 hover:border-white/30 focus:border-[#FFD93D] rounded-2xl px-4 text-white font-bold outline-none transition-all placeholder:text-white/20"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-black uppercase tracking-wider text-white/40 block mb-2">
                      Choose Your Avatar
                    </label>
                    <div className="grid grid-cols-6 gap-2 p-3 bg-black/30 rounded-2xl border border-white/5">
                      {AVATARS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setSelectedAvatar(emoji)}
                          className={`w-11 h-11 rounded-xl flex items-center justify-center text-2xl transition-all border-2 ${
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
                    loading={creating}
                    onClick={handleCreateRoom}
                    className="mt-6">
                    🚀 Create Room
                  </CartoonButton>
                </div>
              </StickerCard>
            </motion.div>
          ) : (
            <motion.div
              key="join-card"
              initial={{ opacity: 0, x: 30, rotateY: -15 }}
              animate={{ opacity: 1, x: 0, rotateY: 0 }}
              exit={{ opacity: 0, x: -30, rotateY: 15 }}
              transition={{ duration: 0.25 }}
              className="w-full">
              <StickerCard className="p-6 text-left" accentColor="red">
                <h3 className="text-xl font-black text-white mb-4 flex items-center gap-2">
                  <Gamepad2 size={20} className="text-[#FF4D6A]" /> Enter Room Code
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-black uppercase tracking-wider text-white/40 block mb-2">
                      4-Character Code
                    </label>
                    <input
                      type="text"
                      maxLength={4}
                      value={roomCode}
                      onChange={(e) => setRoomCode(e.target.value)}
                      placeholder="e.g. ABCD"
                      className="w-full h-16 bg-black/40 border-2 border-white/10 hover:border-white/30 focus:border-[#FF4D6A] rounded-2xl px-4 text-center text-2xl uppercase tracking-widest font-black text-white outline-none transition-all placeholder:text-white/20"
                    />
                  </div>

                  <CartoonButton
                    variant="red"
                    fullWidth
                    onClick={handleJoinRoom}
                    className="mt-6">
                    Join Lobby <ArrowRight size={18} className="ml-2 inline" />
                  </CartoonButton>
                </div>
              </StickerCard>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-white/20 text-xs font-bold font-mono">
          Cozy Night Platform © 2026. Free & Open Source.
        </p>
      </div>
    </div>
  );
}
