// lib/eventEngine.ts
// Premium banter engine - roasts only, no mercy

type EventType = 'comeback' | 'crush' | 'streak' | 'fail' | 'neutral' | 'unanimous' | 'perfect_bluff' | 'shotcaller' | 'sabotage' | 'clutch';

interface GameEvent {
  message: string;
  type: EventType;
  pointsModifier?: number;
  targetId?: string;
}

const BANTER_DB: Record<EventType, string[]> = {
  comeback: [
    "Absolute cinema.",
    "The plot armor is real.",
    "Is this scripted?",
    "Bro woke up.",
    "We are witnessing history.",
    "The anime protagonist arc is unreal.",
    "Main character syndrome activated.",
    "This is illegal. Someone call the cops."
  ],
  crush: [
    "Stop, they're already dead!",
    "Mercy rule?",
    "Skill gap is massive.",
    "A bit sweaty, no?",
    "Respectfully, sit down.",
    "You didn't have to do them like that.",
    "This is targeted harassment.",
    "We need to talk about this later."
  ],
  streak: [
    "On fire! 🔥",
    "Can't miss.",
    "Aimbot detected.",
    "Locked in.",
    "Who let him cook?",
    "Someone touched by the algorithm.",
    "We get it, you're cracked.",
    "This needs to be investigated."
  ],
  fail: [
    "Skill issue.",
    "Lag?",
    "Controller disconnected?",
    "Rough watch.",
    "That was... something.",
    "Did you mean to do that?",
    "Your therapist will hear about this.",
    "We'll pretend we didn't see that."
  ],
  neutral: [
    "Intense.",
    "Focus up.",
    "Clean.",
    "Nice.",
    "Solid play."
  ],
  unanimous: [
    "Everyone saw through you. Embarrassing.",
    "Not a single ally? Cold.",
    "Group therapy session incoming.",
    "Unanimous. The math is mathing.",
    "When the whole squad agrees you're the problem.",
    "Zero doubters. You're cooked.",
    "The council has decided your fate."
  ],
  perfect_bluff: [
    "Masterclass in deception.",
    "Born to lie. Therapy later.",
    "Your parents would be... concerned.",
    "Oscar-worthy performance.",
    "Snake behavior detected.",
    "Trust issues just entered the chat.",
    "We should be scared of you honestly."
  ],
  shotcaller: [
    "Heavy is the head that wears the crown.",
    "Absolute power corrupts absolutely.",
    "The dictator has spoken.",
    "Democracy was never an option.",
    "This is what happens when you give them power.",
    "The throne changes people.",
    "With great power comes... this."
  ],
  sabotage: [
    "Friendship ended. War declared.",
    "That's personal. Remember this.",
    "The betrayal arc begins.",
    "This will be remembered.",
    "Shots fired. Return fire incoming.",
    "You just made an enemy.",
    "The villain origin story writes itself."
  ],
  clutch: [
    "BIG BRAIN PLAY!",
    "Galaxy brain activated.",
    "Calculated. Absolutely calculated.",
    "The clutch gene is real.",
    "When the pressure hits different.",
    "Ice in the veins.",
    "That's why they call it a clutch."
  ]
};

// Player-specific roasts - use sparingly
const PLAYER_ROASTS: Record<string, string[]> = {
  mo: [
    "The host advantage is showing.",
    "Must be nice writing the rules.",
    "Classic Mo moment."
  ],
  omar: [
    "The artist strikes again.",
    "Creative destruction.",
    "Omar doing Omar things."
  ],
  yazan: [
    "The wildcard delivers.",
    "Nobody saw this coming except everyone.",
    "Yazan in his element."
  ],
  mustafa: [
    "Speed demon activated.",
    "Competitive levels: unhealthy.",
    "Mustafa taking this too seriously as usual."
  ]
};

export function generateBanter(
  currentScore: number,
  leaderScore: number,
  isStreak: boolean = false,
  context?: {
    playerId?: string;
    eventType?: EventType;
    isUnanimous?: boolean;
    isPerfectBluff?: boolean;
  }
): GameEvent {
  let type: EventType = 'neutral';

  // Priority: specific events > score-based
  if (context?.isUnanimous) type = 'unanimous';
  else if (context?.isPerfectBluff) type = 'perfect_bluff';
  else if (context?.eventType) type = context.eventType;
  else if (isStreak) type = 'streak';
  else {
    const gap = leaderScore - currentScore;
    if (gap > 500) type = 'fail';
    else if (gap < -200) type = 'crush';
    else if (gap < 50 && gap > -50 && currentScore > 100) type = 'comeback';
  }

  const messages = BANTER_DB[type];
  let message = messages[Math.floor(Math.random() * messages.length)];

  // 20% chance of player-specific roast if applicable
  if (context?.playerId && PLAYER_ROASTS[context.playerId] && Math.random() < 0.2) {
    const playerMessages = PLAYER_ROASTS[context.playerId];
    message = playerMessages[Math.floor(Math.random() * playerMessages.length)];
  }

  return {
    message,
    type,
    targetId: context?.playerId
  };
}

export function generateShotcallerEvent(shotcallerId: string): GameEvent {
  const messages = BANTER_DB.shotcaller;
  return {
    message: messages[Math.floor(Math.random() * messages.length)],
    type: 'shotcaller',
    targetId: shotcallerId
  };
}

export function generateTokenEvent(type: 'clutch' | 'sabotage' | 'shield', playerId: string, targetId?: string): GameEvent {
  const eventType: EventType = type === 'clutch' ? 'clutch' : type === 'sabotage' ? 'sabotage' : 'neutral';
  const messages = BANTER_DB[eventType];
  return {
    message: messages[Math.floor(Math.random() * messages.length)],
    type: eventType,
    targetId: targetId || playerId
  };
}

export const HINT_PENALTIES = [
  "Small brain moment.",
  "It's okay, we all forget.",
  "Minus aura points.",
  "Really? needed a hint for this?",
  "Revealing..."
];

export const REVEAL_MESSAGES = {
  suspense: [
    "The moment of truth...",
    "Drumroll please...",
    "And the answer is...",
    "Brace yourselves..."
  ],
  victory: [
    "LETS GOOO!",
    "That's what I'm talking about!",
    "The crowd goes wild!",
    "Absolutely demolished."
  ],
  defeat: [
    "Pain.",
    "Not like this...",
    "We'll get em next time.",
    "Sometimes the game plays you."
  ]
};

