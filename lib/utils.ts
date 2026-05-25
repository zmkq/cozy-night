import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export const playSound = (id: string) => {
  // Silent fail if not client or file missing
  if (typeof window === 'undefined') return;
  const audio = document.getElementById(id) as HTMLAudioElement;
  if (audio) {
    audio.currentTime = 0;
    audio.play().catch(e => console.log('Audio play failed silently', e));
  }
}
