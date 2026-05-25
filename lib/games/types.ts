// lib/games/types.ts
// Core types for SHOTCALLER and LIE RATE games

export interface DecisionCard {
  id: string;
  text: string;
  outcomes: CardOutcome[];
  revealType: 'fixed' | 'random' | 'conditional';
  showToAll?: boolean; // If true, everyone sees the card
}

export interface CardOutcome {
  text: string;
  points: number;
  affectsAll?: boolean; // If true, affects everyone not just target
  rare?: boolean;       // Rare outcomes for bonus points
  effect?: 'steal' | 'swap' | 'double' | 'immunity' | 'reverse';
}

export interface TimelineEvent {
  id: string;
  round: number;
  gameId: string;
  playerId: string;
  targetId?: string;
  message: string;
  eventType: 'roast' | 'clutch' | 'sabotage' | 'streak' | 'comeback' | 'fail';
  timestamp: number;
}

export interface PlayerTokens {
  clutch: boolean;    // One-time big brain play
  sabotage: boolean;  // Target another player
  shield: boolean;    // Block incoming damage
}

export interface LieRateSubmission {
  answer: 'yes' | 'no';
  timestamp: number;
}

export interface LieRateGuess {
  targetId: string;
  guessedAnswer: 'yes' | 'no';
}

// Shared game state extensions
export interface ExtendedGameState {
  tokens: Record<string, PlayerTokens>;
  timeline: TimelineEvent[];
  shotcallerId?: string;
  totalPoints: Record<string, number>;
  perGamePoints: Record<string, Record<string, number>>;
}
