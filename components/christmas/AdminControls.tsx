'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StickerCard } from './StickerCard';
import {
  Lock,
  Unlock,
  RefreshCw,
  ShieldAlert,
  Trash2,
  Users,
  Trophy,
  MessageSquare,
  ChevronUp,
  Loader2,
  Check,
  Zap,
  Plus,
  Settings,
  Flame,
} from 'lucide-react';
import {
  toggleSiteOpenAction,
  resetLeaderboardAction,
  clearMemoriesAction,
  resetAllRSVPAction,
  getAdminStatsAction,
  getPromptsAction,
  savePromptsAction,
} from '@/app/actions';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { usePartyContext } from '@/hooks/PartyProvider';
import config from '@/data/config.json';

interface AdminControlsProps {
  isOpen: boolean;
  onToggle: (newState: boolean) => void;
  roomCode: string;
}

interface AdminStats {
  totalUsers: number;
  totalPoints: number;
  memoriesCount: number;
  rsvpCounts: {
    coming: number;
    maybe: number;
    no: number;
    pending: number;
  };
}

type ActiveTab = 'controls' | 'prompts';
type PromptGameType = 'saboteur' | 'mostLikely' | 'lieRate' | 'trials';

export function AdminControls({ isOpen, onToggle, roomCode }: AdminControlsProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('controls');
  const [loading, setLoading] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const { toast } = useToast();
  const { forceAdvance, startWrapped, triggerAdminEvent } = usePartyContext();

  // Prompt Editor State
  const [promptGame, setPromptGame] = useState<PromptGameType>('saboteur');
  const [customDecks, setCustomDecks] = useState<any>(null);
  const [newPromptText, setNewPromptText] = useState('');

  // Load stats and prompts when expanded
  useEffect(() => {
    if (expanded) {
      loadStats();
      loadPrompts();
    }
  }, [expanded, roomCode]);

  const loadStats = async () => {
    try {
      const result = await getAdminStatsAction(roomCode);
      if (result && !('error' in result)) {
        setStats(result as AdminStats);
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const loadPrompts = async () => {
    try {
      const result = await getPromptsAction(roomCode);
      if (result && result.prompts) {
        setCustomDecks(result.prompts);
      } else {
        // Fallback to default config prompts
        setCustomDecks({
          saboteurPrompts: [...config.saboteurPrompts],
          mostLikelyPrompts: [...config.mostLikelyPrompts],
          lieRatePrompts: [...config.lieRatePrompts],
          trialCharges: [...config.trialCharges],
        });
      }
    } catch (err) {
      console.error('Failed to load prompts:', err);
    }
  };

  const handleToggle = async () => {
    try {
      setLoading('toggle');
      const newState = !isOpen;
      const res = await toggleSiteOpenAction(roomCode, newState);

      if (res && 'success' in res && res.success) {
        onToggle(newState);
        toast({
          title: newState ? '🔓 Gate Opened!' : '🔒 Gate Closed!',
          description: newState ? 'Anyone can enter now' : 'The party is now private',
        });
      } else {
        const errorMsg = res && 'error' in res ? res.error : 'Unknown error';
        toast({
          title: 'Error',
          description: errorMsg || 'Failed to change gate status',
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error('Toggle error:', err);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(null);
    }
  };

  const handleResetPoints = async () => {
    if (!confirm('Are you sure you want to reset all points? This cannot be undone!')) return;

    try {
      setLoading('reset-points');
      const res = await resetLeaderboardAction(roomCode);

      if (res && 'success' in res && res.success) {
        toast({ title: '♻️ Scores Reset', description: 'The leaderboard has been wiped' });
        loadStats();
      } else {
        toast({
          title: 'Error',
          description: 'Failed to reset scores',
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error('Reset points error:', err);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(null);
    }
  };

  const handleClearMemories = async () => {
    if (!confirm('Are you sure you want to delete all memories? This cannot be undone!')) return;

    try {
      setLoading('clear-memories');
      const res = await clearMemoriesAction(roomCode);

      if (res && 'success' in res && res.success) {
        toast({ title: '🗑️ Memories Cleared', description: 'All memory logs have been deleted' });
        loadStats();
      } else {
        toast({
          title: 'Error',
          description: 'Failed to delete memories',
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error('Clear memories error:', err);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(null);
    }
  };

  const handleResetRSVP = async () => {
    if (!confirm('Are you sure you want to reset RSVPs? Everyone will need to RSVP again!')) return;

    try {
      setLoading('reset-rsvp');
      const res = await resetAllRSVPAction(roomCode);

      if (res && 'success' in res && res.success) {
        toast({ title: '📋 RSVPs Reset', description: 'Everyone is pending now' });
        loadStats();
      } else {
        toast({
          title: 'Error',
          description: 'Failed to reset RSVPs',
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error('Reset RSVP error:', err);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(null);
    }
  };

  // --- PROMPT DECK EDITOR ACTIONS ---

  const getActiveDeckKey = (type: PromptGameType): string => {
    switch (type) {
      case 'saboteur':
        return 'saboteurPrompts';
      case 'mostLikely':
        return 'mostLikelyPrompts';
      case 'lieRate':
        return 'lieRatePrompts';
      case 'trials':
        return 'trialCharges';
    }
  };

  const handleAddPrompt = () => {
    if (!newPromptText.trim() || !customDecks) return;
    const key = getActiveDeckKey(promptGame);
    
    let newItem: any = newPromptText.trim();
    if (promptGame === 'trials') {
      // Charges are objects
      newItem = {
        id: `custom-${Date.now()}`,
        text: newPromptText.trim(),
        category: 'chaos',
        severity: 2,
      };
    }

    const updated = {
      ...customDecks,
      [key]: [...customDecks[key], newItem],
    };

    setCustomDecks(updated);
    setNewPromptText('');
  };

  const handleDeletePrompt = (indexToDelete: number) => {
    if (!customDecks) return;
    const key = getActiveDeckKey(promptGame);
    const updatedList = customDecks[key].filter((_: any, idx: number) => idx !== indexToDelete);
    
    const updated = {
      ...customDecks,
      [key]: updatedList,
    };
    setCustomDecks(updated);
  };

  const handleSavePrompts = async () => {
    if (!customDecks) return;
    try {
      setLoading('save-prompts');
      const res = await savePromptsAction(roomCode, customDecks);
      if (res && res.success) {
        toast({
          title: '💾 Prompts Saved!',
          description: 'Decks updated successfully for this room.',
        });
      } else {
        toast({
          title: 'Error Saving',
          description: res.error || 'Failed to save prompts',
          variant: 'destructive',
        });
      }
    } catch (e) {
      console.error(e);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(null);
    }
  };

  const handleResetPromptsToDefault = () => {
    if (!confirm('Are you sure you want to reset all prompts to defaults? This will erase edits.')) return;
    const defaults = {
      saboteurPrompts: [...config.saboteurPrompts],
      mostLikelyPrompts: [...config.mostLikelyPrompts],
      lieRatePrompts: [...config.lieRatePrompts],
      trialCharges: [...config.trialCharges],
    };
    setCustomDecks(defaults);
    toast({
      title: '♻️ Reset Completed',
      description: 'Prompts reverted to default list (Click Save to apply).',
    });
  };

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed bottom-20 md:bottom-6 right-4 left-4 md:left-auto md:w-96 z-50 font-sans">
      <StickerCard
        accentColor="purple"
        hover={false}
        className="overflow-hidden">
        {/* Header - Always visible */}
        <div
          className="p-4 flex items-center justify-between cursor-pointer"
          onClick={() => setExpanded(!expanded)}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/30 border-2 border-purple-500 flex items-center justify-center">
              <ShieldAlert size={20} className="text-purple-400" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Control Panel</h3>
              <p className="text-xs text-white/50">Room Admin Panel</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'px-2 py-1 rounded-full text-[10px] font-bold uppercase',
                isOpen
                  ? 'bg-[#2ECC71]/20 text-[#2ECC71] border border-[#2ECC71]/30'
                  : 'bg-[#FF4D6A]/20 text-[#FF4D6A] border border-[#FF4D6A]/30'
              )}>
              {isOpen ? 'OPEN' : 'CLOSED'}
            </div>
            <motion.div
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}>
              <ChevronUp size={18} className="text-white/50" />
            </motion.div>
          </div>
        </div>

        {/* Expanded Content */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden">
              
              {/* Inner Tab Selector */}
              <div className="flex border-t border-b border-white/10 bg-white/5 p-1">
                <button
                  onClick={() => setActiveTab('controls')}
                  className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
                    activeTab === 'controls' ? 'bg-purple-600 text-white' : 'text-white/60 hover:text-white'
                  }`}>
                  Quick Actions
                </button>
                <button
                  onClick={() => setActiveTab('prompts')}
                  className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
                    activeTab === 'prompts' ? 'bg-purple-600 text-white' : 'text-white/60 hover:text-white'
                  }`}>
                  Prompt Editor
                </button>
              </div>

              {activeTab === 'controls' ? (
                /* QUICK CONTROLS PANEL */
                <div className="px-4 pb-4 space-y-4 pt-4">
                  {stats && (
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div className="bg-white/5 rounded-lg p-2">
                        <Users size={14} className="mx-auto text-white/40 mb-1" />
                        <div className="text-white font-bold text-sm">
                          {stats.totalUsers}
                        </div>
                        <div className="text-[9px] text-white/40">Users</div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-2">
                        <Trophy
                          size={14}
                          className="mx-auto text-[#FFD93D] mb-1"
                        />
                        <div className="text-white font-bold text-sm">
                          {stats.totalPoints}
                        </div>
                        <div className="text-[9px] text-white/40">Points</div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-2">
                        <MessageSquare
                          size={14}
                          className="mx-auto text-[#3B82F6] mb-1"
                        />
                        <div className="text-white font-bold text-sm">
                          {stats.memoriesCount}
                        </div>
                        <div className="text-[9px] text-white/40">Memories</div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-2">
                        <Check
                          size={14}
                          className="mx-auto text-[#2ECC71] mb-1"
                        />
                        <div className="text-white font-bold text-sm">
                          {stats.rsvpCounts.coming}
                        </div>
                        <div className="text-[9px] text-white/40">Coming</div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <button
                      onClick={handleToggle}
                      disabled={loading !== null}
                      className={cn(
                        'w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all',
                        isOpen
                          ? 'bg-[#FF4D6A]/10 border-[#FF4D6A]/30 hover:border-[#FF4D6A]'
                          : 'bg-[#2ECC71]/10 border-[#2ECC71]/30 hover:border-[#2ECC71]'
                      )}>
                      <div className="flex items-center gap-3">
                        {isOpen ? (
                          <Lock size={18} className="text-[#FF4D6A]" />
                        ) : (
                          <Unlock size={18} className="text-[#2ECC71]" />
                        )}
                        <span className="text-white text-sm font-medium">
                          {isOpen ? 'Close Gate' : 'Open Gate'}
                        </span>
                      </div>
                      {loading === 'toggle' && (
                        <Loader2 size={16} className="animate-spin text-white/50" />
                      )}
                    </button>

                    <button
                      onClick={handleResetPoints}
                      disabled={loading !== null}
                      className="w-full flex items-center justify-between p-3 rounded-xl border-2 bg-[#FFD93D]/10 border-[#FFD93D]/30 hover:border-[#FFD93D] transition-all">
                      <div className="flex items-center gap-3">
                        <RefreshCw size={18} className="text-[#FFD93D]" />
                        <span className="text-white text-sm font-medium">
                          Reset Scores
                        </span>
                      </div>
                      {loading === 'reset-points' && (
                        <Loader2 size={16} className="animate-spin text-white/50" />
                      )}
                    </button>

                    <button
                      onClick={handleClearMemories}
                      disabled={loading !== null}
                      className="w-full flex items-center justify-between p-3 rounded-xl border-2 bg-[#3B82F6]/10 border-[#3B82F6]/30 hover:border-[#3B82F6] transition-all">
                      <div className="flex items-center gap-3">
                        <Trash2 size={18} className="text-[#3B82F6]" />
                        <span className="text-white text-sm font-medium">
                          Clear Memories
                        </span>
                      </div>
                      {loading === 'clear-memories' && (
                        <Loader2 size={16} className="animate-spin text-white/50" />
                      )}
                    </button>

                    <button
                      onClick={handleResetRSVP}
                      disabled={loading !== null}
                      className="w-full flex items-center justify-between p-3 rounded-xl border-2 bg-[#A855F7]/10 border-[#A855F7]/30 hover:border-[#A855F7] transition-all">
                      <div className="flex items-center gap-3">
                        <Users size={18} className="text-[#A855F7]" />
                        <span className="text-white text-sm font-medium">
                          Reset RSVPs
                        </span>
                      </div>
                      {loading === 'reset-rsvp' && (
                        <Loader2 size={16} className="animate-spin text-white/50" />
                      )}
                    </button>

                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to skip this phase?')) {
                          forceAdvance();
                          toast({
                            title: '⏩ Phase Skipped',
                            description: 'Advanced phase successfully.',
                          });
                        }
                      }}
                      className="w-full flex items-center justify-between p-3 rounded-xl border-2 bg-red-500/10 border-red-500/30 hover:border-red-500 hover:bg-red-500/20 transition-all mt-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center animate-pulse">
                          <Zap size={16} className="text-white" />
                        </div>
                        <div className="text-left">
                          <span className="text-white text-sm font-bold block">
                            Skip Phase
                          </span>
                          <span className="text-[10px] text-white/50 block">
                            Skip Phase (Panic Button)
                          </span>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        if (
                          confirm(
                            'Are you sure? This will end all games and launch the final summary recap!'
                          )
                        ) {
                          startWrapped();
                          toast({
                            title: '🎬 Summary Started',
                            description: 'Enjoy the final recap!',
                          });
                        }
                      }}
                      className="w-full flex items-center justify-between p-3 rounded-xl border-2 bg-linear-to-r from-[#FFD93D]/10 to-[#FF6B6B]/10 border-[#FFD93D]/30 hover:border-[#FFD93D] transition-all mt-2 group relative overflow-hidden">
                      <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="flex items-center gap-3 relative z-10">
                        <div className="w-8 h-8 rounded-full bg-linear-to-br from-[#FFD93D] to-[#FF6B6B] flex items-center justify-center shadow-lg shadow-orange-500/20">
                          <Trophy size={16} className="text-white" />
                        </div>
                        <div className="text-left">
                          <span className="text-white text-sm font-bold block">
                            Start Summary
                          </span>
                          <span className="text-[10px] text-white/50 block">
                            What the Night Remembers
                          </span>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        triggerAdminEvent('taj-fas-farted');
                        toast({
                          title: '💨 Event Triggered!',
                          description: 'Event triggered manually.',
                        });
                      }}
                      className="w-full flex items-center justify-between p-3 rounded-xl border-2 bg-orange-500/10 border-orange-500/30 hover:border-orange-500 hover:bg-orange-500/20 transition-all mt-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center animate-bounce">
                          <Zap size={16} className="text-white" />
                        </div>
                        <div className="text-left">
                          <span className="text-white text-sm font-bold block">
                            Trigger Event
                          </span>
                          <span className="text-[10px] text-white/50 block">
                            Manual Rare Event Trigger
                          </span>
                        </div>
                      </div>
                    </button>
                  </div>
                  <p className="text-[10px] text-white/30 text-center">
                    ⚠️ Warning: All actions are destructive. Use with caution.
                  </p>
                </div>
              ) : (
                /* PROMPT EDITOR PANEL */
                <div className="p-4 space-y-4">
                  {/* Game category filters */}
                  <div className="flex flex-wrap gap-1 bg-black/40 p-1 rounded-lg border border-white/5">
                    {(['saboteur', 'mostLikely', 'lieRate', 'trials'] as PromptGameType[]).map((type) => (
                      <button
                        key={type}
                        onClick={() => setPromptGame(type)}
                        className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-md transition-all ${
                          promptGame === type
                            ? 'bg-purple-600 text-white shadow-sm'
                            : 'text-white/40 hover:text-white'
                        }`}>
                        {type === 'saboteur' && 'Saboteur'}
                        {type === 'mostLikely' && 'Likely To'}
                        {type === 'lieRate' && 'Lie Rate'}
                        {type === 'trials' && 'Trial'}
                      </button>
                    ))}
                  </div>

                  {/* List of prompts */}
                  <div className="bg-black/30 rounded-xl border border-white/5 p-2 max-h-48 overflow-y-auto space-y-1.5 scrollbar-thin">
                    {customDecks && customDecks[getActiveDeckKey(promptGame)]?.map((prompt: any, index: number) => {
                      const text = typeof prompt === 'object' ? prompt.text : prompt;
                      return (
                        <div
                          key={index}
                          className="flex items-center justify-between gap-2 p-2 bg-white/5 rounded-lg text-xs group hover:bg-white/10 transition-colors">
                          <span className="text-white font-medium break-words max-w-[80%]">
                            {text}
                          </span>
                          <button
                            onClick={() => handleDeletePrompt(index)}
                            className="text-white/30 hover:text-[#FF4D6A] p-1 transition-colors shrink-0">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      );
                    })}
                    {(!customDecks || customDecks[getActiveDeckKey(promptGame)]?.length === 0) && (
                      <div className="text-center text-white/30 text-xs py-8">
                        No prompts in this deck. Add one below!
                      </div>
                    )}
                  </div>

                  {/* Add prompt input */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newPromptText}
                      onChange={(e) => setNewPromptText(e.target.value)}
                      placeholder="Add a new custom prompt..."
                      onKeyDown={(e) => e.key === 'Enter' && handleAddPrompt()}
                      className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-500 placeholder:text-white/25"
                    />
                    <button
                      onClick={handleAddPrompt}
                      className="w-8 h-8 rounded-xl bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center shrink-0 shadow-md">
                      <Plus size={16} />
                    </button>
                  </div>

                  {/* Editor Actions */}
                  <div className="flex gap-2 pt-2 border-t border-white/10">
                    <button
                      onClick={handleResetPromptsToDefault}
                      className="flex-1 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-[10px] font-black text-white/70 hover:text-white uppercase transition-all">
                      Reset Default
                    </button>
                    <button
                      onClick={handleSavePrompts}
                      disabled={loading === 'save-prompts'}
                      className="flex-1 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-[10px] font-black text-white uppercase shadow-lg flex items-center justify-center gap-1.5 transition-all">
                      {loading === 'save-prompts' ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Check size={12} />
                      )}
                      Save Deck
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </StickerCard>
    </motion.div>
  );
}
