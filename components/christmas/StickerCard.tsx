'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface StickerCardProps {
  children: ReactNode;
  className?: string;
  accentColor?: 'red' | 'green' | 'gold' | 'purple' | 'white';
  onClick?: () => void;
  hover?: boolean;
  rotate?: number;
  style?: React.CSSProperties;
}

const accentColors = {
  red: 'shadow-[10px_10px_0px_#FF4D6A]',
  green: 'shadow-[10px_10px_0px_#2ECC71]',
  gold: 'shadow-[10px_10px_0px_#FFD93D]',
  purple: 'shadow-[10px_10px_0px_#A855F7]',
  white: 'shadow-[10px_10px_0px_rgba(255,255,255,0.15)]',
};

const hoverShadows = {
  red: 'hover:shadow-[14px_14px_0px_#FF4D6A]',
  green: 'hover:shadow-[14px_14px_0px_#2ECC71]',
  gold: 'hover:shadow-[14px_14px_0px_#FFD93D]',
  purple: 'hover:shadow-[14px_14px_0px_#A855F7]',
  white: 'hover:shadow-[14px_14px_0px_rgba(255,255,255,0.2)]',
};

export function StickerCard({
  children,
  className,
  accentColor = 'white',
  onClick,
  hover = true,
  rotate = 0,
  style,
}: StickerCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, rotate: rotate - 2 }}
      animate={{ opacity: 1, y: 0, rotate }}
      whileHover={
        hover
          ? {
              rotate: 0,
              scale: 1.02,
              translateX: -3,
              translateY: -3,
            }
          : undefined
      }
      whileTap={onClick ? { scale: 0.98 } : undefined}
      onClick={onClick}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      style={style}
      className={cn(
        // Base sticker styles
        'bg-black border-4 border-white rounded-[2rem]',
        'text-white font-arabic',
        // Shadow based on accent color
        accentColors[accentColor],
        // Hover effects
        hover && [
          'transition-all duration-200',
          'hover:translate-x-[-3px] hover:translate-y-[-3px]',
          hoverShadows[accentColor],
        ],
        // Cursor
        onClick && 'cursor-pointer',
        className
      )}>
      {children}
    </motion.div>
  );
}

// Variant for light/white background stickers
export function StickerCardWhite({
  children,
  className,
  accentColor = 'red',
  onClick,
  hover = true,
  rotate = 0,
  style,
}: StickerCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, rotate: rotate - 2 }}
      animate={{ opacity: 1, y: 0, rotate }}
      whileHover={
        hover
          ? {
              rotate: 0,
              scale: 1.02,
              translateX: -3,
              translateY: -3,
            }
          : undefined
      }
      whileTap={onClick ? { scale: 0.98 } : undefined}
      onClick={onClick}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      style={style}
      className={cn(
        // Base sticker styles - WHITE version
        'bg-white border-4 border-[#1a1a1a] rounded-[2rem]',
        'text-[#1a1a1a] font-arabic',
        // Shadow
        'shadow-[10px_10px_0px_#1a1a1a]',
        // Hover effects
        hover && [
          'transition-all duration-200',
          'hover:translate-x-[-3px] hover:translate-y-[-3px]',
          'hover:shadow-[14px_14px_0px_#1a1a1a]',
        ],
        // Cursor
        onClick && 'cursor-pointer',
        className
      )}>
      {children}
    </motion.div>
  );
}
