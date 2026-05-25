import { getAllUsers, getLeaderboard } from '@/lib/db';
import { StickerCard } from '@/components/christmas/StickerCard';
import { FloatingProps } from '@/components/christmas/FloatingProps';
import {
  Trophy,
  Crown,
  Medal,
  Flame,
  Star,
  Zap,
  Target,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import config from '@/data/config.json';

// Rank titles in English
const RANK_TITLES: Record<number, { title: string; color: string }> = {
  0: { title: 'Legend 👑', color: '#FFD93D' },
  1: { title: 'Champion 🥈', color: '#C0C0C0' },
  2: { title: 'Warrior 🥉', color: '#CD7F32' },
};

export default async function LeaderboardPage({
  params,
}: {
  params: Promise<{ roomCode: string }>;
}) {
  const { roomCode } = await params;
  const upperCode = roomCode.toUpperCase();
  
  const users = await getAllUsers(upperCode);
  const leaderboard = await getLeaderboard(upperCode);

  // Sort users by points
  const sortedUsers = [...users].sort((a, b) => {
    const pointsA = leaderboard[a.id]?.points || 0;
    const pointsB = leaderboard[b.id]?.points || 0;
    return pointsB - pointsA;
  });

  const topThree = sortedUsers.slice(0, 3);
  const rest = sortedUsers.slice(3);

  // Calculate total points in the game
  const totalPoints = Object.values(leaderboard).reduce(
    (sum, s) => sum + s.points,
    0
  );

  return (
    <div className="min-h-screen p-4 md:p-6 pt-8 space-y-8 max-w-4xl mx-auto">
      <FloatingProps variant="minimal" />

      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 bg-[#FFD93D] text-black px-5 py-2 rounded-full text-sm font-black border-3 border-white shadow-[4px_4px_0px_#1a1a1a] animate-in zoom-in duration-500">
          <Trophy size={18} />
          Hall of Fame
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-white animate-in slide-in-from-bottom duration-500">
          Overall Standings 🏆
        </h1>
        <p className="text-white/50 animate-in fade-in duration-700">
          Who is the squad champion?
        </p>
      </div>

      {/* Stats Bar */}
      <div className="flex justify-center gap-4 flex-wrap animate-in fade-in slide-in-from-bottom duration-700 delay-150">
        <div className="bg-[#1a1a1a] border-2 border-white/20 rounded-full px-5 py-2 flex items-center gap-2">
          <Zap size={16} className="text-[#FFD93D]" />
          <span className="text-white/60 text-sm">Total Points:</span>
          <span className="text-white font-bold">{totalPoints}</span>
        </div>
        <div className="bg-[#1a1a1a] border-2 border-white/20 rounded-full px-5 py-2 flex items-center gap-2">
          <Target size={16} className="text-[#2ECC71]" />
          <span className="text-white/60 text-sm">Players:</span>
          <span className="text-white font-bold">{users.length}</span>
        </div>
      </div>

      {/* Top 3 Podium */}
      <div className="relative pt-8 animate-in fade-in slide-in-from-bottom duration-700 delay-300">
        {/* Podium Glow Effect */}
        <div className="absolute inset-0 flex justify-center items-end pointer-events-none">
          <div className="w-64 h-64 bg-[#FFD93D]/10 rounded-full blur-3xl" />
        </div>

        <div className="grid grid-cols-3 gap-3 md:gap-6 items-end relative z-10">
          {/* 2nd Place */}
          <div className="flex flex-col items-center">
            {topThree[1] && (
              <>
                <div className="relative mb-3">
                  <div className="w-20 h-20 md:w-28 md:h-28 rounded-full border-4 border-white overflow-hidden bg-white shadow-[4px_4px_0px_#1a1a1a] flex items-center justify-center">
                    {topThree[1].avatar && topThree[1].avatar.startsWith('http') ? (
                      <img
                        src={topThree[1].avatar}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-4xl md:text-6xl">
                        {topThree[1].avatar || '👤'}
                      </span>
                    )}
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-[#C0C0C0] border-2 border-white rounded-full flex items-center justify-center text-black font-black text-sm shadow-[2px_2px_0px_#1a1a1a] z-10">
                    2
                  </div>
                </div>
                <div className="w-full bg-gradient-to-t from-[#C0C0C0]/30 to-transparent border-2 border-[#C0C0C0] rounded-t-2xl p-3 md:p-4 text-center h-28 md:h-32">
                  <p className="font-black text-white text-sm md:text-base truncate">
                    {topThree[1].name}
                  </p>
                  <p className="text-2xl md:text-3xl font-black text-[#C0C0C0]">
                    {leaderboard[topThree[1].id]?.points || 0}
                  </p>
                  <p className="text-[10px] text-white/40 uppercase">Points</p>
                </div>
              </>
            )}
          </div>

          {/* 1st Place - THE CHAMPION */}
          <div className="flex flex-col items-center -mt-8">
            {topThree[0] && (
              <>
                <div className="relative mb-3">
                  <div className="w-24 h-24 md:w-36 md:h-36 rounded-full border-[6px] border-[#FFD93D] overflow-hidden bg-white shadow-[0_0_40px_rgba(255,217,61,0.5)] flex items-center justify-center animate-pulse">
                    {topThree[0].avatar && topThree[0].avatar.startsWith('http') ? (
                      <img
                        src={topThree[0].avatar}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-5xl md:text-7xl">
                        {topThree[0].avatar || '👤'}
                      </span>
                    )}
                  </div>
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-4xl animate-bounce z-20">
                    👑
                  </div>
                </div>
                <div className="w-full bg-gradient-to-t from-[#FFD93D]/40 to-transparent border-3 border-[#FFD93D] rounded-t-2xl p-4 md:p-5 text-center h-36 md:h-40 shadow-[0_0_30px_rgba(255,217,61,0.3)]">
                  <p className="font-black text-white text-base md:text-lg">
                    {topThree[0].name}
                  </p>
                  <p className="text-4xl md:text-5xl font-black text-[#FFD93D]">
                    {leaderboard[topThree[0].id]?.points || 0}
                  </p>
                  <p className="text-xs text-white/40 uppercase">Points</p>
                  <div className="mt-1 inline-flex items-center gap-1 text-[10px] bg-[#FFD93D] text-black px-2 py-0.5 rounded-full font-bold">
                    <Crown size={10} /> Legend
                  </div>
                </div>
              </>
            )}
          </div>

          {/* 3rd Place */}
          <div className="flex flex-col items-center">
            {topThree[2] && (
              <>
                <div className="relative mb-3">
                  <div className="w-20 h-20 md:w-28 md:h-28 rounded-full border-4 border-white overflow-hidden bg-white shadow-[4px_4px_0px_#1a1a1a] flex items-center justify-center">
                    {topThree[2].avatar && topThree[2].avatar.startsWith('http') ? (
                      <img
                        src={topThree[2].avatar}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-4xl md:text-6xl">
                        {topThree[2].avatar || '👤'}
                      </span>
                    )}
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-[#CD7F32] border-2 border-white rounded-full flex items-center justify-center text-white font-black text-sm shadow-[2px_2px_0px_#1a1a1a] z-10">
                    3
                  </div>
                </div>
                <div className="w-full bg-gradient-to-t from-[#CD7F32]/30 to-transparent border-2 border-[#CD7F32] rounded-t-2xl p-3 md:p-4 text-center h-24 md:h-28">
                  <p className="font-black text-white text-sm md:text-base truncate">
                    {topThree[2].name}
                  </p>
                  <p className="text-2xl md:text-3xl font-black text-[#CD7F32]">
                    {leaderboard[topThree[2].id]?.points || 0}
                  </p>
                  <p className="text-[10px] text-white/40 uppercase">Points</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Rest of the leaderboard */}
      {rest.length > 0 && (
        <div className="space-y-3 pt-8 animate-in fade-in slide-in-from-bottom duration-700 delay-500">
          <h3 className="text-white/40 text-sm font-bold uppercase tracking-wider flex items-center gap-2">
            <Flame size={14} />
            Other Contenders
          </h3>

          {rest.map((user, index) => {
            const stats = leaderboard[user.id] || {
              points: 0,
              badges: [],
              history: [],
            };
            const actualRank = index + 4;

            return (
              <div
                key={user.id}
                className="bg-[#1a1a1a] border-2 border-white/10 hover:border-white/30 rounded-xl p-4 flex items-center gap-4 transition-all group">
                {/* Rank */}
                <div className="w-10 h-10 rounded-xl bg-white/5 border-2 border-white/10 flex items-center justify-center font-black text-white/40 group-hover:border-[#FFD93D]/50 group-hover:text-[#FFD93D] transition-all">
                  {actualRank}
                </div>

                {/* Avatar */}
                <div className="w-12 h-12 rounded-full border-2 border-white/20 overflow-hidden bg-white/5 flex items-center justify-center shrink-0">
                  {user.avatar && user.avatar.startsWith('http') ? (
                    <img
                      src={user.avatar}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl">{user.avatar || '👤'}</span>
                  )}
                </div>

                {/* Name & Badges */}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white truncate">{user.name}</p>
                  {stats.badges.length > 0 && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {stats.badges.map((badge) => (
                        <span
                          key={badge}
                          className="text-[9px] bg-white/10 px-1.5 py-0.5 rounded text-white/50">
                          {badge}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Points */}
                <div className="text-right">
                  <p className="text-2xl font-black text-white">
                    {stats.points}
                  </p>
                  <p className="text-[9px] text-white/30 uppercase">Points</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Recent Activity */}
      <div className="pt-8 space-y-4 animate-in fade-in slide-in-from-bottom duration-700 delay-700">
        <h3 className="text-white/40 text-sm font-bold uppercase tracking-wider flex items-center gap-2">
          <Sparkles size={14} className="text-[#FFD93D]" />
          Recent Achievements
        </h3>

        <StickerCard className="p-5" accentColor="gold" hover={false}>
          <div className="space-y-3">
            {Object.entries(leaderboard)
              .flatMap(([userId, stats]) =>
                stats.history.map((entry, idx) => ({
                  userId,
                  userName: users.find((u) => u.id === userId)?.name || userId,
                  userAvatar:
                    users.find((u) => u.id === userId)?.avatar || '👤',
                  ...entry,
                  key: `${userId}-${idx}`,
                }))
              )
              .slice(-5)
              .reverse()
              .map((entry) => (
                <div
                  key={entry.key}
                  className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                  <div className="w-10 h-10 rounded-full border border-white/20 overflow-hidden bg-white/5 flex items-center justify-center shrink-0">
                    {entry.userAvatar && entry.userAvatar.startsWith('http') ? (
                      <img
                        src={entry.userAvatar}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xl">{entry.userAvatar || '👤'}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-bold truncate">
                      {entry.userName}
                    </p>
                    <p className="text-xs text-white/50 truncate">
                      Scored in {entry.gameId}
                    </p>
                  </div>
                  <div className="bg-[#2ECC71] text-black text-sm font-black px-3 py-1 rounded-full">
                    +{entry.points}
                  </div>
                </div>
              ))}

            {Object.values(leaderboard).every(
              (s) => s.history.length === 0
            ) && (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">📜</div>
                <p className="text-white/40 italic">No achievements yet...</p>
                <p className="text-white/20 text-sm">
                  Play games to score points!
                </p>
              </div>
            )}
          </div>
        </StickerCard>
      </div>

      {/* Fun Footer */}
      <div className="text-center pt-8 pb-16">
        <div className="inline-flex items-center gap-2 text-white/20 text-sm">
          <Star size={14} />
          Official {config.event.hostName} Summit - Who deserves the crown?
          <Star size={14} />
        </div>
      </div>
    </div>
  );
}
