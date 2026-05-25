'use client';

import { useCallback, useEffect, useRef } from 'react';

// Sound IDs mapped to file paths
const SOUNDS = {
  click: '/sounds/click.mp3',
  ding: '/sounds/ding.mp3',
  buzzer: '/sounds/buzzer.mp3',
  tada: '/sounds/tada.mp3',
  swipe: '/sounds/swipe.mp3',
  drumroll: '/sounds/drumroll.mp3',
  win: '/sounds/win.mp3',
  fail: '/sounds/fail.mp3',
  pop: '/sounds/pop.mp3',
  notification: '/sounds/notification.mp3',
};

export type SoundId = keyof typeof SOUNDS;

export function useSound() {
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});

  // Preload sounds
  useEffect(() => {
    Object.entries(SOUNDS).forEach(([key, src]) => {
      if (!audioRefs.current[key]) {
        const audio = new Audio(src);
        audio.preload = 'auto';
        audio.volume = 0.5;
        audioRefs.current[key] = audio;
      }
    });
  }, []);

  const play = useCallback((id: SoundId, volume = 0.5) => {
    const audio = audioRefs.current[id];
    if (audio) {
      audio.currentTime = 0;
      audio.volume = volume;
      audio.play().catch((err) => console.error('Audio play failed:', err));

      // Haptics integration
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        if (id === 'ding') navigator.vibrate(50);
        if (id === 'buzzer') navigator.vibrate([50, 50, 50]);
        if (id === 'tada') navigator.vibrate([50, 50, 50, 50, 100]);
        if (id === 'click') navigator.vibrate(10);
      }
    }
  }, []);

  return { play };
}
