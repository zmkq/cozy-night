'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface CartoonButtonProps {
  children: ReactNode;
  variant?: 'red' | 'green' | 'gold' | 'white' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

const variants = {
  red: 'bg-[#FF4D6A] text-white border-white hover:bg-[#ff3355]',
  green: 'bg-[#2ECC71] text-black border-white hover:bg-[#27ae60]',
  gold: 'bg-[#FFD93D] text-black border-white hover:bg-[#f0c929]',
  white: 'bg-white text-[#1a1a1a] border-[#1a1a1a] hover:bg-gray-100',
  outline: 'bg-transparent text-white border-white hover:bg-white/10',
};

const shadows = {
  red: 'shadow-[6px_6px_0px_#1a1a1a]',
  green: 'shadow-[6px_6px_0px_#1a1a1a]',
  gold: 'shadow-[6px_6px_0px_#1a1a1a]',
  white: 'shadow-[6px_6px_0px_#1a1a1a]',
  outline: 'shadow-[6px_6px_0px_rgba(255,255,255,0.2)]',
};

const sizes = {
  sm: 'h-10 px-4 text-sm rounded-xl border-[3px]',
  md: 'h-12 px-6 text-base rounded-2xl border-4',
  lg: 'h-14 px-8 text-lg rounded-2xl border-4',
};

export function CartoonButton({
  children,
  variant = 'green',
  size = 'md',
  className,
  onClick,
  disabled,
  loading,
  fullWidth,
  type = 'button',
}: CartoonButtonProps) {
  return (
    <motion.button
      type={type}
      whileHover={
        !disabled
          ? {
              translateX: -3,
              translateY: -3,
              scale: 1.02,
            }
          : undefined
      }
      whileTap={
        !disabled
          ? {
              translateX: 3,
              translateY: 3,
              scale: 0.98,
            }
          : undefined
      }
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        // Base styles
        'font-bold uppercase tracking-wider font-arabic',
        'flex items-center justify-center gap-2',
        'transition-all duration-150',
        // Variant styles
        variants[variant],
        shadows[variant],
        sizes[size],
        // States
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-x-0 disabled:translate-y-0',
        'active:translate-x-[3px] active:translate-y-[3px] active:shadow-none',
        // Width
        fullWidth && 'w-full',
        className
      )}>
      {loading ? <Loader2 className="animate-spin" size={20} /> : children}
    </motion.button>
  );
}

// Icon-only variant
export function CartoonIconButton({
  children,
  variant = 'outline',
  className,
  onClick,
  disabled,
  size = 'md',
}: Omit<CartoonButtonProps, 'loading' | 'fullWidth'>) {
  const iconSizes = {
    sm: 'w-9 h-9 rounded-xl border-[3px]',
    md: 'w-11 h-11 rounded-xl border-[3px]',
    lg: 'w-14 h-14 rounded-2xl border-4',
  };

  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.1, rotate: 5 } : undefined}
      whileTap={!disabled ? { scale: 0.9 } : undefined}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex items-center justify-center',
        'transition-all duration-150',
        variants[variant],
        shadows[variant],
        iconSizes[size],
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}>
      {children}
    </motion.button>
  );
}
