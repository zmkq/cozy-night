import { getMemories } from '@/lib/db';
import { StickerCard } from '@/components/christmas/StickerCard';
import { FloatingProps } from '@/components/christmas/FloatingProps';
import {
  Camera,
  Sparkles,
  MessageSquare,
  Clock,
  Trophy,
  Star,
  Quote,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import config from '@/data/config.json';

export default async function MemoriesPage({
  params,
}: {
  params: Promise<{ roomCode: string }>;
}) {
  const { roomCode } = await params;
  const upperCode = roomCode.toUpperCase();
  const memories = await getMemories(upperCode);

  const { getAllUsers } = await import('@/lib/db');
  const users = await getAllUsers(upperCode);

  const host = users.find((u) => u.isAdmin)?.name || config.event.hostName;
  const eventTitle = config.event.eventTitle;
  const sampleUser = users[1]?.name || 'Player';

  // Build timeline from various sources
  const timeline = [
    {
      type: 'event',
      text: `${host} opened the ${eventTitle}! 🎉`,
      icon: Sparkles,
      color: '#FFD93D',
    },
    {
      type: 'achievement',
      text: `${sampleUser} broke a new record in Rapid Fire! ⚡`,
      icon: Trophy,
      color: '#2ECC71',
    },
    ...memories.map((m) => ({
      type: 'quote',
      text: m.text,
      icon: MessageSquare,
      color: '#FF4D6A',
    })),
  ];

  return (
    <div className="min-h-screen p-4 md:p-6 pt-8 space-y-8 max-w-3xl mx-auto">
      <FloatingProps variant="minimal" />

      {/* Header */}
      <div className="text-center space-y-3 animate-in fade-in slide-in-from-bottom duration-500">
        <div className="inline-flex items-center gap-2 bg-[#FF4D6A] text-white px-5 py-2 rounded-full text-sm font-black border-3 border-white shadow-[4px_4px_0px_#1a1a1a]">
          <Camera size={18} />
          Moments
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-white">
          Tonight's Memories 📸
        </h1>
        <p className="text-white/50">Capture the chaos. Remember the vibes.</p>
      </div>

      {/* Timeline */}
      <div className="relative pl-6 md:pl-10 space-y-6 py-8 animate-in fade-in slide-in-from-bottom duration-700 delay-150">
        {/* Timeline Line */}
        <div className="absolute left-3 md:left-5 top-0 bottom-0 w-1 bg-gradient-to-b from-[#FFD93D] via-[#2ECC71] to-[#FF4D6A] rounded-full opacity-30" />

        {timeline.map((item, idx) => (
          <div key={idx} className="relative">
            {/* Timeline Dot */}
            <div
              className="absolute -left-3 md:-left-5 top-6 w-7 h-7 md:w-9 md:h-9 rounded-full border-3 border-white flex items-center justify-center shadow-[3px_3px_0px_#1a1a1a] z-10"
              style={{ backgroundColor: item.color }}>
              <item.icon
                size={14}
                className={cn(
                  item.color === '#FFD93D' ? 'text-black' : 'text-white'
                )}
              />
            </div>

            {/* Card */}
            <div className="ml-6 md:ml-8">
              <StickerCard
                className="p-5"
                accentColor={
                  item.type === 'achievement'
                    ? 'green'
                    : item.type === 'event'
                    ? 'gold'
                    : 'red'
                }
                hover={true}
                rotate={idx % 2 === 0 ? -0.5 : 0.5}>
                <div className="space-y-2">
                  {item.type === 'quote' && (
                    <Quote size={20} className="text-white/30" />
                  )}
                  <p className="text-lg font-bold text-white leading-relaxed">
                    {item.text}
                  </p>
                  <div className="flex items-center gap-2 text-white/30 text-xs">
                    <Clock size={12} />
                    <span>System Logged</span>
                  </div>
                </div>
              </StickerCard>
            </div>
          </div>
        ))}

        {timeline.length === 0 && (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-[#1a1a1a] border-3 border-white/20 flex items-center justify-center">
              <Camera size={40} className="text-white/20" />
            </div>
            <p className="text-white/40 text-lg">No moments captured yet...</p>
            <p className="text-white/20 text-sm">Play games and make memories!</p>
          </div>
        )}
      </div>

      {/* Live Moments Section */}
      <StickerCard className="p-6" accentColor="gold" rotate={-1}>
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-[#FFD93D]/20 border-2 border-[#FFD93D] flex items-center justify-center shrink-0">
            <Sparkles size={24} className="text-[#FFD93D]" />
          </div>
          <div className="flex-1">
            <h3 className="font-black text-white text-lg flex items-center gap-2">
              Live Moments
              <span className="w-2 h-2 rounded-full bg-[#2ECC71] animate-pulse" />
            </h3>
            <p className="text-sm text-white/60 mt-1">
              We automatically capture legendary quotes and achievements as you play.
            </p>
            <div className="mt-4 flex gap-2 flex-wrap">
              <span className="text-xs bg-white/10 px-3 py-1 rounded-full text-white/50 border border-white/10">
                🎯 Achievements
              </span>
              <span className="text-xs bg-white/10 px-3 py-1 rounded-full text-white/50 border border-white/10">
                💬 Quotes
              </span>
              <span className="text-xs bg-white/10 px-3 py-1 rounded-full text-white/50 border border-white/10">
                🔥 Hot Moments
              </span>
            </div>
          </div>
        </div>
      </StickerCard>

      {/* Fun Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 animate-in fade-in duration-700 delay-500">
        <div className="bg-[#1a1a1a] border-2 border-white/10 rounded-xl p-4 text-center">
          <div className="text-3xl mb-1">🎮</div>
          <p className="text-2xl font-black text-white">0</p>
          <p className="text-[10px] text-white/40 uppercase">Games Played</p>
        </div>
        <div className="bg-[#1a1a1a] border-2 border-white/10 rounded-xl p-4 text-center">
          <div className="text-3xl mb-1">🔥</div>
          <p className="text-2xl font-black text-white">{timeline.length}</p>
          <p className="text-[10px] text-white/40 uppercase">Moments</p>
        </div>
        <div className="bg-[#1a1a1a] border-2 border-white/10 rounded-xl p-4 text-center col-span-2 md:col-span-1">
          <div className="text-3xl mb-1">⭐</div>
          <p className="text-2xl font-black text-white">∞</p>
          <p className="text-[10px] text-white/40 uppercase">Vibes to Come</p>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pt-8 pb-16">
        <div className="inline-flex items-center gap-2 text-white/20 text-sm">
          <Star size={14} />
          Every moment recorded forever
          <Star size={14} />
        </div>
      </div>
    </div>
  );
}
