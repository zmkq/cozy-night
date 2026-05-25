"use client";

import { createContext, useContext, ReactNode } from "react";
import { useParty } from "./useParty";

type PartyContextType = ReturnType<typeof useParty> | null;

const PartyContext = createContext<PartyContextType>(null);

interface PartyProviderProps {
  children: ReactNode;
  userId: string;
  userName: string;
  userAvatar: string;
  roomCode: string;
}

export function PartyProvider({ children, userId, userName, userAvatar, roomCode }: PartyProviderProps) {
  const party = useParty({ userId, userName, userAvatar, room: roomCode });

  return (
    <PartyContext.Provider value={party}>
      {children}
    </PartyContext.Provider>
  );
}

export function usePartyContext() {
  const context = useContext(PartyContext);
  if (!context) {
    throw new Error("usePartyContext must be used within a PartyProvider");
  }
  return context;
}
