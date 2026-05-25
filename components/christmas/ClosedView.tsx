import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock,
  PartyPopper,
  Calendar,
  MapPin,
  Shirt,
  Check,
  HelpCircle,
  X,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { updateRSVPAction, getAttendeesAction } from '@/app/actions';
import config from '@/data/config.json';

type RsvpStatus = 'coming' | 'maybe' | 'no' | 'pending';

interface Attendee {
  id: string;
  name: string;
  avatar?: string;
  status: RsvpStatus;
}

interface ClosedViewProps {
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
  initialRsvp?: RsvpStatus;
  roomCode: string;
}

const FUNNY_MO_QUOTES = config.event.gateClosedQuotes;

export function ClosedView({ user, initialRsvp = 'pending', roomCode }: ClosedViewProps) {
  const [myRsvp, setMyRsvp] = useState<RsvpStatus>(initialRsvp);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [attendees, setAttendees] = useState<Attendee[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % FUNNY_MO_QUOTES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const loadAttendees = async () => {
      const rsvpData = await getAttendeesAction(roomCode);
      const attendeesList: Attendee[] = Object.entries(rsvpData).map(
        ([id, rsvp]) => {
          const displayName = id.charAt(0).toUpperCase() + id.slice(1);
          return {
            id,
            name: displayName,
            avatar: '👤',
            status: rsvp.status,
          };
        }
      );
      setAttendees(attendeesList);
    };
    loadAttendees();
    const interval = setInterval(loadAttendees, 10000);
    return () => clearInterval(interval);
  }, []);

  const statusConfig = {
    coming: { color: 'bg-[#2ECC71]', icon: Check, label: 'Coming' },
    maybe: { color: 'bg-[#FFD93D]', icon: HelpCircle, label: 'Maybe' },
    no: { color: 'bg-[#FF4D6A]', icon: X, label: "Can't Make It" },
    pending: { color: 'bg-white/20', icon: HelpCircle, label: 'Pending' },
  };

  const handleRsvp = async (status: RsvpStatus) => {
    if (status === 'pending') return;
    setMyRsvp(status);
    await updateRSVPAction(roomCode, status);
  };

  return (
    <div className="min-h-screen w-full relative flex flex-col items-center justify-start overflow-x-hidden pt-24 pb-32">
      {/* --- RESPONSIVE SCENE BACKGROUND --- */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
        <motion.div
          animate={{ rotate: [0, 15, -15, 0], y: [0, -40, 0] }}
          transition={{ repeat: Infinity, duration: 7 }}
          className="absolute top-10 left-[2%] md:left-[5%] text-[6rem] md:text-[10rem] opacity-20 filter blur-[1px]">
          🍕
        </motion.div>
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ repeat: Infinity, duration: 25, ease: 'linear' }}
          className="absolute top-1/2 -right-12 md:right-[5%] text-[5rem] md:text-[8rem] opacity-10 grayscale">
          🎮
        </motion.div>
        <motion.div
          animate={{ y: [0, 80, 0], x: [0, 40, 0], rotate: [0, 20, -20, 0] }}
          transition={{ repeat: Infinity, duration: 15 }}
          className="absolute bottom-20 left-10 md:left-1/4 text-[8rem] md:text-[12rem] opacity-[0.05]">
          ❄️
        </motion.div>
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, -10, 10, 0] }}
          transition={{ repeat: Infinity, duration: 8 }}
          className="absolute top-1/4 right-[5%] md:right-1/4 text-[4rem] md:text-[6rem] opacity-[0.08]">
          ⭐
        </motion.div>

        <div className="absolute top-[5%] right-[2%] md:right-[5%] transform rotate-12 opacity-20 md:opacity-40 scale-50 md:scale-100">
          <span className="text-9xl font-black text-white/10 border-[6px] border-white/10 px-6 py-2 rounded-2xl">
            BAM!
          </span>
        </div>
        <div className="absolute bottom-[5%] left-[2%] md:left-[5%] transform -rotate-12 opacity-10 md:opacity-30 scale-50 md:scale-100">
          <span className="text-[10rem] md:text-[14rem] font-black text-white/5 border-[8px] border-white/5 px-8 py-2 rounded-3xl">
            POW!
          </span>
        </div>
      </div>

      {/* --- CHARACTER AREA --- */}
      <div className="relative z-20 mb-8 md:mb-16 flex flex-col items-center w-full px-4 pt-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={quoteIndex}
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            className="relative mb-4 md:mb-6 bg-[#1a1a1a] border-[3px] md:border-[4px] border-white shadow-[6px_6px_0px_#FF4D6A] p-3 md:p-5 rounded-[1.5rem] md:rounded-[2rem] w-[90%] max-w-[320px] text-white font-bold text-center text-sm md:text-lg leading-snug z-30">
            {FUNNY_MO_QUOTES[quoteIndex]}
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[18px] border-t-white" />
            <div className="absolute -bottom-[10px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[9px] border-l-transparent border-r-[9px] border-r-transparent border-t-[14px] border-t-[#1a1a1a]" />
          </motion.div>
        </AnimatePresence>

        <motion.div
          animate={{ scale: [1, 1.05, 1], rotate: [0, 2, -2, 0] }}
          transition={{ repeat: Infinity, duration: 4 }}
          className="relative inline-block cursor-grab active:cursor-grabbing select-none">
          <div className="text-[10rem] md:text-[16rem] filter drop-shadow-[8px_8px_0px_#1a1a1a] md:drop-shadow-[12px_12px_0px_#1a1a1a]">
            🎅
          </div>

          <motion.div
            animate={{ rotate: [-15, 15, -15], scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute bottom-2 -left-2 md:-left-6 bg-[#FF4D6A] border-[3px] md:border-[4px] border-white p-2 md:p-3 rounded-xl md:rounded-2xl shadow-[4px_4px_0px_#1a1a1a]">
            <Lock className="text-white w-5 h-5 md:w-8 md:h-8" />
          </motion.div>
          <motion.div
            animate={{ rotate: [15, -15, 15], scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2.5 }}
            className="absolute top-1/2 -right-4 md:-right-10 bg-[#FFD93D] border-[3px] md:border-[4px] border-white p-2 md:p-3 rounded-xl md:rounded-2xl shadow-[4px_4px_0px_#1a1a1a]">
            <Lock className="text-[#1a1a1a] w-4 h-4 md:w-7 md:h-7" />
          </motion.div>
        </motion.div>
      </div>

      {/* --- CONTENT GRID (Responsive Width) --- */}
      <div className="w-full max-w-[95%] md:max-w-6xl xl:max-w-7xl grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-start relative z-10 px-4 md:px-8">
        {/* Invitation - DARK THEME */}
        <motion.div
          initial={{ opacity: 0, x: -50, rotate: -5 }}
          animate={{ opacity: 1, x: 0, rotate: -2 }}
          whileHover={{ rotate: 0, scale: 1.03 }}
          className="sticker-card p-6 md:p-10 shadow-[10px_10px_0px_#FF4D6A] squash-stretch relative overflow-visible">
          <div className="absolute -top-8 -right-4 md:-top-12 md:-right-8 text-[4rem] md:text-[6rem] drop-shadow-[4px_4px_0px_#000]">
            🎟️
          </div>
          <div className="flex items-center gap-4 border-b-[4px] border-white/20 pb-4 mb-8">
            <div className="p-2 md:p-3 bg-white rounded-2xl">
              <PartyPopper
                size={32}
                className="text-[#FFD93D] fill-[#1a1a1a]"
              />
            </div>
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter">
              Invitation
            </h2>
          </div>

          <div className="space-y-4 md:space-y-6 font-black">
            <div className="flex items-center gap-4 bg-white/5 p-4 border-[3px] border-white/10 rounded-2xl hover:border-white/30 transition-colors">
              <div className="w-12 h-12 flex items-center justify-center bg-[#FF4D6A]/20 rounded-xl border-2 border-[#FF4D6A]">
                <Calendar size={24} className="text-[#FF4D6A]" />
              </div>
              <span className="text-lg md:text-xl">{config.event.date}</span>
            </div>
            <div className="flex items-center gap-4 bg-white/5 p-4 border-[3px] border-white/10 rounded-2xl hover:border-white/30 transition-colors">
              <div className="w-12 h-12 flex items-center justify-center bg-[#2ECC71]/20 rounded-xl border-2 border-[#2ECC71]">
                <MapPin size={24} className="text-[#2ECC71]" />
              </div>
              <span className="text-lg md:text-xl">Location: {config.event.location}</span>
            </div>
            <div className="flex items-center gap-4 bg-white/5 p-4 border-[3px] border-white/10 rounded-2xl hover:border-white/30 transition-colors">
              <div className="w-12 h-12 flex items-center justify-center bg-[#FFD93D]/20 rounded-xl border-2 border-[#FFD93D]">
                <Shirt size={24} className="text-[#FFD93D]" />
              </div>
              <span className="text-lg md:text-xl">Dress Code: {config.event.dressCode}</span>
            </div>
          </div>
        </motion.div>

        {/* RSVP - DARK THEME */}
        <motion.div
          initial={{ opacity: 0, x: 50, rotate: 5 }}
          animate={{ opacity: 1, x: 0, rotate: 3 }}
          whileHover={{ rotate: 1, scale: 1.03 }}
          className="sticker-card p-6 md:p-10 shadow-[10px_10px_0px_#2ECC71] squash-stretch relative overflow-visible mt-8 md:mt-0">
          <div className="absolute -top-10 -left-6 md:-top-16 md:-left-12 text-[5rem] md:text-[8rem] animate-bounce drop-shadow-[4px_4px_0px_#000]">
            🧧
          </div>
          <div className="text-center pt-4 mb-10">
            <h3 className="text-3xl md:text-5xl font-black underline decoration-[#2ECC71] decoration-[6px] underline-offset-8 uppercase">
              Your RSVP Status?
            </h3>
            <p className="text-white/40 font-black text-xs md:text-sm uppercase tracking-[0.2em] mt-6">
              Let us know if you are coming!
            </p>
          </div>

          <div className="flex flex-col gap-4 md:gap-6 font-sans">
            {(['coming', 'maybe', 'no'] as const).map((status) => {
              const cfg = statusConfig[status];
              const isActive = myRsvp === status;
              const Icon = cfg.icon;

              return (
                <button
                  key={status}
                  onClick={() => handleRsvp(status)}
                  className={cn(
                    'p-5 md:p-7 rounded-[1.5rem] md:rounded-[2.5rem] border-[4px] md:border-[6px] border-white peel-effect flex items-center justify-between transition-all duration-200',
                    'font-black text-xl md:text-3xl',
                    isActive
                      ? `${cfg.color} text-[#1a1a1a] translate-x-[4px] translate-y-[4px] shadow-none`
                      : 'bg-white/10 hover:bg-white/20 shadow-[6px_6px_0px_rgba(255,255,255,0.2)] md:shadow-[10px_10px_0px_rgba(255,255,255,0.2)]',
                    status === 'no' && isActive && 'text-white bg-[#FF4D6A]'
                  )}>
                  <span className="flex items-center gap-4 md:gap-6">
                    <Icon
                      size={32}
                      className="md:w-10 md:h-10"
                      strokeWidth={4}
                    />
                    {cfg.label}
                  </span>
                  {isActive && (
                    <motion.div
                      initial={{ scale: 0, rotate: -20 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className="text-[10px] md:text-xs bg-[#1a1a1a] text-white px-3 md:px-5 py-1 md:py-2 rounded-full uppercase tracking-tighter">
                      Saved ✓
                    </motion.div>
                  )}
                </button>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* --- ATTENDEES STATUS PILL --- */}
      {attendees.length > 0 && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mt-12 md:mt-16 w-full max-w-[95%] md:max-w-2xl px-4">
          <div className="bg-[#1a1a1a]/80 backdrop-blur-md border-2 border-white/10 px-4 md:px-6 py-3 md:py-4 rounded-full flex flex-wrap items-center justify-center gap-3 md:gap-4">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-white/60" />
              <span className="text-white/60 text-xs md:text-sm font-bold">
                {attendees.length} Guest{attendees.length === 1 ? '' : 's'}
              </span>
            </div>

            <div className="w-px h-4 bg-white/20" />

            {/* Status counts */}
            {['coming', 'maybe', 'no'].map((status) => {
              const count = attendees.filter((a) => a.status === status).length;
              if (count === 0) return null;

              const cfg = statusConfig[status as RsvpStatus];
              const Icon = cfg.icon;

              return (
                <div key={status} className="flex items-center gap-1.5">
                  <div
                    className={cn(
                      'w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center',
                      status === 'coming' && 'bg-[#2ECC71]',
                      status === 'maybe' && 'bg-[#FFD93D]',
                      status === 'no' && 'bg-[#FF4D6A]'
                    )}>
                    <Icon
                      size={12}
                      className={cn(
                        status === 'coming' && 'text-black',
                        status === 'maybe' && 'text-black',
                        status === 'no' && 'text-white'
                      )}
                      strokeWidth={3}
                    />
                  </div>
                  <span className="text-white text-xs md:text-sm font-bold">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* --- REFINED FOOTER --- */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mt-20 md:mt-32 w-full flex flex-col items-center px-4">
        <div className="bg-[#1a1a1a] border-[3px] border-white/20 p-4 md:p-6 rounded-[2rem] shadow-[0_0_40px_rgba(255,77,106,0.15)] flex flex-col md:flex-row items-center gap-4 text-center">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-[#FF4D6A] animate-pulse shadow-[0_0_15px_#FF4D6A]" />
            <span className="text-white font-black text-sm md:text-lg uppercase tracking-widest">
              Gate Status: Closed 🔒
            </span>
          </div>
          <div className="hidden md:block w-px h-6 bg-white/20 mx-4" />
          <p className="text-white/40 font-black text-[10px] md:text-xs tracking-[0.2em] uppercase">
            © {config.event.appName} - {config.event.eventTitle}
          </p>
        </div>
      </motion.div>

      {/* Pure background filler to prevent 'white/black' cracks at bottom */}
      <div className="fixed bottom-0 left-0 w-full h-32 bg-gradient-to-t from-[#0a0a12] to-transparent pointer-none -z-10" />
    </div>
  );
}
