'use client';

import { PartyProvider } from '@/hooks/PartyProvider';
import { TransitionProvider } from '@/components/games/TransitionProvider';
import { ReactNode, useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { WinnerScreen } from '@/components/christmas/WinnerScreen';
import { useGameSync } from '@/hooks/useGameSync';
import { TajFasFartedOverlay } from '@/components/events/TajFasFartedOverlay';
import { WrappedOverlay } from '@/components/wrapped/WrappedOverlay';
import { EmojiReactionOverlay } from '@/components/games/EmojiReactionOverlay';

interface PartyWrapperProps {
  children: ReactNode;
  userId: string;
  userName: string;
  userAvatar: string;
  roomCode: string;
}

export function PartyWrapper({
  children,
  userId,
  userName,
  userAvatar,
  roomCode,
}: PartyWrapperProps) {
  const [showWinner, setShowWinner] = useState(false);
  const [winner, setWinner] = useState<any>(null);
  const { leaderboard } = useGameSync(roomCode);

  // Check for winner when game ends (mock logic for now, or trigger via admin?)
  // Ideally, valid logic should be added here.
  // For now, let's allow it to be manually triggered or just rely on Admin toggling?
  // The user asked for "Cinematic Winner Reveal".
  // Let's make it so if a player reaches a high score threshold? Or manual trigger?
  // Actually, I'll add a manual trigger in AdminControls to "Declare Winner".

  // But wait, the user instructions said "When the final game ends".
  // Detecting "Final Game End" is hard without a "Playlist" state.
  // I will add a "Declare Winner" capability to the AdminControls, or maybe
  // detect if all rounds of the last game are done?
  // Use a simple state for now.

  return (
    <PartyProvider userId={userId} userName={userName} userAvatar={userAvatar} roomCode={roomCode}>
      <TransitionProvider>{children}</TransitionProvider>
      <AnimatePresence>
        {showWinner && winner && (
          <WinnerScreen winner={winner} onClose={() => setShowWinner(false)} />
        )}
        <WrappedOverlay />
      </AnimatePresence>
      <TajFasFartedOverlay userId={userId} roomCode={roomCode} />
      <EmojiReactionOverlay />
    </PartyProvider>
  );
}
