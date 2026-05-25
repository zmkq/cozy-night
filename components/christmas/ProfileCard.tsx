'use client';

import { motion } from 'framer-motion';
import { User } from '@/lib/db';
import { cn } from '@/lib/utils';
import { Lock, Unlock } from 'lucide-react';

interface ProfileCardProps {
  user: User;
  color: string;
  index: number;
  isSelected?: boolean;
  onClick: () => void;
}

export function ProfileCard({
  user,
  color,
  index,
  isSelected,
  onClick,
}: ProfileCardProps) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.1,
        type: 'spring',
        stiffness: 200,
        damping: 20,
      }}
      whileHover={{ y: -10, scale: 1.02 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="relative group w-full outline-none">
      {/* Glow Effect Layer */}
      <div
        className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"
        style={{ backgroundColor: color }}
      />

      {/* Main Card */}
      <div
        className={cn(
          'relative w-full aspect-[3/4] rounded-3xl overflow-hidden backdrop-blur-xl bg-black/40 border-2 transition-all duration-300',
          isSelected
            ? 'border-[var(--color)] shadow-[0_0_30px_var(--color)]'
            : 'border-white/10 group-hover:border-[var(--color)] group-hover:shadow-[0_0_20px_var(--color)]'
        )}
        style={{ '--color': color } as any}>
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80 opacity-60 group-hover:opacity-80 transition-opacity" />

        {/* Content Container */}
        <div className="absolute inset-0 flex flex-col items-center justify-between p-3 md:p-6">
          {/* Top Status */}
          <div className="w-full flex justify-between items-start opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/50 bg-black/50 px-2 py-1 rounded-md backdrop-blur-md">
              P{index + 1}
            </span>
            {isSelected && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="bg-[var(--color)] text-black p-1.5 rounded-full">
                <Unlock size={14} strokeWidth={3} />
              </motion.div>
            )}
          </div>

          {/* Avatar Image */}
          <motion.div
            className="absolute inset-0 z-[-1]"
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.5 }}>
            {user.avatar && user.avatar.startsWith('http') ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-full h-full object-cover opacity-100 md:opacity-80 md:group-hover:opacity-100 transition-opacity duration-500"
              />
            ) : (
              <div className="w-full h-full bg-neutral-900 flex items-center justify-center text-6xl">
                {user.avatar || '👤'}
              </div>
            )}
          </motion.div>

          {/* Name & Title */}
          <div className="w-full text-center space-y-1 transform translate-y-0 md:translate-y-2 md:group-hover:translate-y-0 transition-transform duration-300">
            <h3 className="text-xl md:text-3xl lg:text-4xl font-black text-white uppercase tracking-tighter drop-shadow-lg break-words leading-none">
              {user.name}
            </h3>
            <div className="h-1 w-8 md:w-12 mx-auto rounded-full bg-[var(--color)] transform scale-x-100 md:scale-x-0 md:group-hover:scale-x-100 transition-transform duration-300" />
            <p className="text-[10px] md:text-xs font-bold text-white/60 uppercase tracking-widest">
              {user.isAdmin ? 'HOST' : 'PLAYER'}
            </p>
          </div>
        </div>

        {/* Scanline Effect */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none mix-blend-overlay"
          style={{
            backgroundImage:
              'linear-gradient(to bottom, transparent 50%, rgba(0, 0, 0, 0.5) 50%)',
            backgroundSize: '100% 4px',
          }}
        />
      </div>
    </motion.button>
  );
}
