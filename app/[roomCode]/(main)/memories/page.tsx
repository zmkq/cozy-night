'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { StickerCard } from '@/components/christmas/StickerCard';
import { FloatingProps } from '@/components/christmas/FloatingProps';
import {
  Camera,
  Sparkles,
  MessageSquare,
  Clock,
  Trophy,
  Quote,
  Search,
  Filter,
  Trash2,
  RefreshCw,
  Star,
  Zap,
  Gavel,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getMemoriesAction, deleteMemoryAction, getAdminStatsAction } from '@/app/actions';
import { usePartyContext } from '@/hooks/PartyProvider';

type MemoryCategory = 'all' | 'quote' | 'trial' | 'heist' | 'lie-rate' | 'other';

const CATEGORY_FILTERS: { key: MemoryCategory; label: string; emoji: string }[] = [
  { key: 'all', label: 'All', emoji: '✨' },
  { key: 'quote', label: 'Quotes', emoji: '💬' },
  { key: 'trial', label: 'Trial', emoji: '⚖️' },
  { key: 'heist', label: 'Heist', emoji: '🕵️' },
  { key: 'lie-rate', label: 'Lie Rate', emoji: '🔥' },
  { key: 'other', label: 'Other', emoji: '🎮' },
];

function categorizeMemory(text: string): MemoryCategory {
  const lower = text.toLowerCase();
  if (lower.includes('squad trial') || lower.includes('guilty') || lower.includes('exhibit')) return 'trial';
  if (lower.includes('heist') || lower.includes('sabotage') || lower.includes('snitch')) return 'heist';
  if (lower.includes('lie rate') || lower.includes('confession')) return 'lie-rate';
  if (lower.includes('"') || lower.includes('said') || lower.includes('claimed')) return 'quote';
  return 'other';
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = Date.now();
  const diff = now - timestamp;
  
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const CATEGORY_COLORS: Record<MemoryCategory, string> = {
  all: '#FFD93D',
  quote: '#FF4D6A',
  trial: '#8B5CF6',
  heist: '#3B82F6',
  'lie-rate': '#F97316',
  other: '#2ECC71',
};

export default function MemoriesPage() {
  const params = useParams();
  const roomCode = (params?.roomCode as string || '').toUpperCase();
  const { myPlayer } = usePartyContext();

  const [memories, setMemories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<MemoryCategory>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);

  const loadMemories = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getMemoriesAction(roomCode);
      setMemories(result.memories || []);
    } finally {
      setLoading(false);
    }
  }, [roomCode]);

  useEffect(() => {
    loadMemories();
    getAdminStatsAction(roomCode).then((s) => {
      if (s && !('error' in s)) setStats(s);
    });
  }, [roomCode, loadMemories]);

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this memory?')) return;
    setDeletingId(id);
    try {
      await deleteMemoryAction(roomCode, id);
      setMemories((prev) => prev.filter((m) => m.id !== id));
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = memories.filter((m) => {
    const matchesSearch = !search || m.text.toLowerCase().includes(search.toLowerCase());
    const matchesCat = category === 'all' || categorizeMemory(m.text) === category;
    return matchesSearch && matchesCat;
  });

  const sorted = [...filtered].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="min-h-screen p-4 md:p-6 pt-8 space-y-6 max-w-3xl mx-auto font-sans">
      <FloatingProps variant="minimal" />

      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center space-y-3"
      >
        <div className="inline-flex items-center gap-2 bg-[#FF4D6A] text-white px-5 py-2 rounded-full text-sm font-black border-3 border-white shadow-[4px_4px_0px_#1a1a1a]">
          <Camera size={18} />
          Memories Gallery
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-white">
          The Night's Highlights 📸
        </h1>
        <p className="text-white/50">Every wild moment, forever preserved.</p>
      </motion.div>

      {/* Stats Row */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-3"
        >
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
            <div className="text-3xl mb-1">📸</div>
            <p className="text-2xl font-black text-white">{memories.length}</p>
            <p className="text-[10px] text-white/40 uppercase tracking-wider">Memories</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
            <div className="text-3xl mb-1">🏆</div>
            <p className="text-2xl font-black text-white">{stats.totalPoints}</p>
            <p className="text-[10px] text-white/40 uppercase tracking-wider">Total Points</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
            <div className="text-3xl mb-1">👥</div>
            <p className="text-2xl font-black text-white">{stats.totalUsers}</p>
            <p className="text-[10px] text-white/40 uppercase tracking-wider">Players</p>
          </div>
        </motion.div>
      )}

      {/* Search & Filter */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="space-y-3"
      >
        {/* Search bar */}
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search memories..."
            className="w-full h-12 bg-white/5 border-2 border-white/10 focus:border-[#FF4D6A] rounded-2xl pl-10 pr-4 text-white font-bold outline-none transition-all placeholder:text-white/20 text-sm"
          />
        </div>

        {/* Category filters */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {CATEGORY_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setCategory(f.key)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wide whitespace-nowrap border-2 transition-all shrink-0',
                category === f.key
                  ? 'text-black border-transparent'
                  : 'bg-white/5 border-white/10 text-white/50 hover:text-white hover:border-white/20'
              )}
              style={category === f.key ? { backgroundColor: CATEGORY_COLORS[f.key] } : {}}
            >
              {f.emoji} {f.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Refresh button */}
      <div className="flex items-center justify-between">
        <p className="text-white/30 text-xs font-bold uppercase tracking-wider">
          {sorted.length} {sorted.length === 1 ? 'moment' : 'moments'} {category !== 'all' ? `(${category})` : ''}
        </p>
        <button
          onClick={loadMemories}
          className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
        >
          <RefreshCw size={14} className="text-white/40" />
        </button>
      </div>

      {/* Memory Cards */}
      {loading ? (
        <div className="text-center py-20">
          <div className="w-12 h-12 border-4 border-white/10 border-t-[#FF4D6A] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/40 font-bold">Loading memories...</p>
        </div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">📭</div>
          <p className="text-white/40 font-black text-lg uppercase">No memories found</p>
          <p className="text-white/20 text-sm mt-1">
            {search ? 'Try a different search term' : 'Play games and save moments!'}
          </p>
        </div>
      ) : (
        <div className="relative pl-6 md:pl-10 space-y-5 py-4">
          {/* Timeline line */}
          <div className="absolute left-3 md:left-5 top-0 bottom-0 w-0.5 bg-linear-to-b from-[#FFD93D] via-[#FF4D6A] to-[#8B5CF6] opacity-20 rounded-full" />

          <AnimatePresence>
            {sorted.map((memory, idx) => {
              const cat = categorizeMemory(memory.text);
              const color = CATEGORY_COLORS[cat];
              const isDeleting = deletingId === memory.id;

              return (
                <motion.div
                  key={memory.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: isDeleting ? 0.4 : 1, x: 0 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="relative"
                >
                  {/* Timeline dot */}
                  <div
                    className="absolute -left-3 md:-left-5 top-5 w-6 h-6 rounded-full border-2 border-white/20 flex items-center justify-center shadow-lg z-10"
                    style={{ backgroundColor: color }}
                  >
                    {cat === 'trial' ? <Gavel size={10} className="text-white" /> :
                     cat === 'heist' ? <Zap size={10} className="text-white" /> :
                     cat === 'quote' ? <Quote size={10} className="text-white" /> :
                     <Star size={10} className="text-white" />}
                  </div>

                  <div className="ml-6 md:ml-8">
                    <StickerCard
                      className="p-4 group"
                      accentColor={
                        cat === 'trial' ? 'purple' :
                        cat === 'heist' ? 'white' :
                        cat === 'quote' ? 'red' : 'gold'
                      }
                      hover
                      rotate={idx % 3 === 0 ? -0.4 : idx % 3 === 1 ? 0.4 : 0}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          {/* Category badge */}
                          <span
                            className="text-[9px] font-black uppercase tracking-[0.15em] px-2 py-0.5 rounded-full mb-2 inline-block"
                            style={{ backgroundColor: `${color}22`, color }}
                          >
                            {CATEGORY_FILTERS.find((f) => f.key === cat)?.emoji}{' '}
                            {CATEGORY_FILTERS.find((f) => f.key === cat)?.label}
                          </span>

                          <p className="text-base font-bold text-white leading-relaxed mt-1">
                            {memory.text}
                          </p>

                          <div className="flex items-center gap-2 text-white/30 text-xs mt-2">
                            <Clock size={10} />
                            <span>{formatTime(memory.timestamp)}</span>
                          </div>
                        </div>

                        {/* Delete button — visible to any logged-in player */}
                        {myPlayer && (
                          <button
                            onClick={() => handleDelete(memory.id)}
                            disabled={isDeleting}
                            className="p-2 rounded-xl opacity-0 group-hover:opacity-100 hover:bg-red-500/20 transition-all shrink-0"
                          >
                            {isDeleting ? (
                              <div className="w-4 h-4 border-2 border-red-400/50 border-t-red-400 rounded-full animate-spin" />
                            ) : (
                              <Trash2 size={14} className="text-white/30 hover:text-red-400 transition-colors" />
                            )}
                          </button>
                        )}
                      </div>
                    </StickerCard>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Footer */}
      <div className="text-center pt-4 pb-16">
        <div className="inline-flex items-center gap-2 text-white/20 text-xs">
          <Star size={12} />
          Every moment captured forever
          <Star size={12} />
        </div>
      </div>
    </div>
  );
}
