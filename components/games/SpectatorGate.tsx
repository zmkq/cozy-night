'use client';

import { ReactNode } from 'react';
import { usePartyContext } from '@/hooks/PartyProvider';
import { SpectatorView } from '@/components/games/SpectatorView';

interface SpectatorGateProps {
  children: ReactNode;
}

export function SpectatorGate({ children }: SpectatorGateProps) {
  const { myPlayer, state } = usePartyContext();

  // Only show spectator view if the game is actively running (not lobby/wrapped)
  const isActiveGame =
    !!state.currentGame &&
    !['lobby', 'countdown', 'wrapped'].includes(state.phase);

  if (isActiveGame && myPlayer?.isSpectator) {
    return <SpectatorView />;
  }

  return <>{children}</>;
}
