import type * as Party from 'partykit/server';
import config from '../data/config.json';

// ============ TYPES ============

export type HeistRole = 'crew' | 'snitch';
export type HeistPhase =
  | 'lobby'
  | 'briefing'
  | 'voting'
  | 'execution'
  | 'reveal'
  | 'accusation'
  | 'finalReveal'
  | 'ended';

export interface HeistMission {
  id: string;
  title: string;
  brief: string;
  operativesRequired: 2 | 3;
  successDeltaOnClean: number;
  heatDeltaOnClean: number;
  successDeltaOnSabotage: number;
  heatDeltaOnSabotage: number;
}

export interface HeistState {
  status: 'lobby' | 'active' | 'ended';
  roles: Record<string, HeistRole>;
  leaderIndex: number; // For rotation
  meters: {
    success: number;
    heat: number;
    successTarget: number; // 6
    heatMax: number; // 6
  };
  phase: HeistPhase;
  currentMission: HeistMission | null;
  selectedOperatives: string[]; // playerIds
  votes: Record<string, 'approve' | 'reject'>;
  actions: Record<string, 'commit' | 'sabotage'>;
  lastOutcome: {
    approved: boolean;
    sabotaged: boolean;
    successDelta: number;
    heatDelta: number;
  } | null;
  accusation: {
    accusationsLeft: number;
    votes: Record<string, string>; // voterId -> accusedId
    active: boolean; // if true, in accusation phase
  };
  log: Array<{
    time: string;
    type: string;
    message: string;
  }>;
}

type GameId =
  | 'saboteur'
  | 'rapid-fire'
  | 'most-likely'
  | 'shotcaller'
  | 'heist'
  | 'lie-rate'
  | 'group-trial';
type GamePhase =
  | 'lobby'
  | 'countdown'
  | 'playing'
  | 'voting'
  | 'results'
  | 'guessing'
  | 'evidence'
  | 'defense'
  | 'sentencing'
  | 'wrapped'
  | 'heist-planning'
  | 'heist-voting'
  | 'heist-execution'
  | 'heist-result';

interface WrappedStats {
  mostSeen: { id: string; name: string; avatar: string; reason: string };
  mostMisunderstood: {
    id: string;
    name: string;
    avatar: string;
    reason: string;
  };
  controlFreak: { id: string; name: string; avatar: string; reason: string };
  voiceOfReason: { id: string; name: string; avatar: string; reason: string };
  emotionalCarry: { id: string; name: string; avatar: string; reason: string };
}

interface Player {
  id: string;
  odersId: string; // Connection ID
  name: string;
  avatar: string;
  ready: boolean;
  connected: boolean;
  score: number;
  lastActivity: number;
}

interface GameRoom {
  players: Record<string, Player>;
  currentGame: GameId | null;
  phase: GamePhase;
  round: number;
  maxRounds: number;
  timer: number;
  countdown: number;
  roundData: RoundData | null;
  heistState: HeistState | null;
  submissions: Record<string, unknown>;
  votes: Record<string, string>;
  hostId: string | null;
}

interface RoundData {
  prompt?: string | { p: string; a: string };
  word?: string;
  saboteurId?: string;
  category?: string;
  grid?: string[];
  targetIndex?: number;
  coords?: string;
  targetWord?: string;
  drawerId?: string;
  fakeDrawerId?: string;
  guesserIds?: string[];
  startTime?: number; // Rapid Fire
  question?: { q: string; a: string }; // Trivia
  qIndex?: number;
  pIndex?: number;
  // Snake Data
  gridSize?: number;
  food?: { x: number; y: number };
  snakes?: Record<string, { x: number; y: number }[]>;
  dirs?: Record<string, { x: number; y: number }>;
  dead?: string[];
  scores?: Record<string, number>;
  // SHOTCALLER Data
  shotcallerId?: string;
  decisionCard?: {
    id: string;
    text: string;
    outcomes: {
      text: string;
      points: number;
      rare?: boolean;
      effect?: string;
    }[];
    revealType: string;
    showToAll?: boolean;
  };
  targetId?: string;
  outcomeIndex?: number;
  // LIE RATE Data
  lieRatePrompt?: string;
  yesCount?: number;
  noCount?: number;
  answers?: Record<string, 'yes' | 'no'>;
  guesses?: Record<string, { targetId: string; guessedAnswer: 'yes' | 'no' }[]>;
  // Shared
  tokens?: Record<
    string,
    { clutch: boolean; sabotage: boolean; shield: boolean }
  >;
  timeline?: {
    id: string;
    round: number;
    playerId: string;
    message: string;
    type: string;
    timestamp: number;
  }[];
  eventMessage?: string;
  // GROUP TRIAL Data
  accusedId?: string;
  accusedHistory?: string[]; // Track who has been accused
  charge?: { id: string; text: string; category: string; severity: number };
  evidence?: Record<string, string>; // jurorId -> evidence text
  defense?: string;
  verdicts?: Record<string, 'guilty' | 'not-guilty'>;
  plotTwist?: { id: string; text: string; effect: string } | null;
  convictionCount?: Record<string, number>; // playerId -> times convicted
  acquittalCount?: Record<string, number>; // playerId -> times acquitted
  topQuotes?: { playerId: string; text: string; round: number }[];
  evidencePhaseEnd?: number; // Timestamp
  defensePhaseEnd?: number; // Timestamp
  wrappedStats?: WrappedStats | null;
}

type ClientMessage =
  | { type: 'join'; userId: string; name: string; avatar: string }
  | { type: 'ready'; ready: boolean }
  | { type: 'start-game'; gameId: GameId }
  | { type: 'submit'; answer: unknown }
  | { type: 'vote'; targetId: string }
  | { type: 'next-round' }
  | { type: 'leave-game' }
  | { type: 'ping' }
  | { type: 'shotcaller-choose'; targetId: string }
  | {
      type: 'use-token';
      token: 'clutch' | 'sabotage' | 'shield';
      targetId?: string;
    }
  | { type: 'lie-rate-guess'; targetId: string; guessedAnswer: 'yes' | 'no' }
  | { type: 'trial-evidence'; evidence: string }
  | { type: 'trial-defense'; defense: string }
  | { type: 'trial-vote'; verdict: 'guilty' | 'not-guilty' }
  | { type: 'trial-next-phase' }
  | { type: 'force-advance' }
  | { type: 'start-wrapped' }
  | { type: 'admin-trigger-event'; eventId: 'taj-fas-farted' }
  // Heist Messages
  | { type: 'heist-mission-select'; operativeIds: string[] }
  | { type: 'heist-vote'; vote: 'approve' | 'reject' }
  | { type: 'heist-action'; action: 'commit' | 'sabotage' }
  | { type: 'heist-accusation'; targetId: string }
  | { type: 'heist-continue' }
  | { type: 'heist-start-accusation' }
  | { type: 'saboteur-guess'; word: string }
  | { type: 'admin-end-game' }
  | { type: 'reaction'; emoji: string }
  | { type: 'host-kick'; targetId: string };

// ============ PROMPTS ============
const SABOTEUR_PROMPTS = config.saboteurPrompts;
const MOST_LIKELY_PROMPTS = config.mostLikelyPrompts;
const LIE_RATE_PROMPTS = config.lieRatePrompts;
const TRIALS = config.trials;
const SHOTCALLER_CARDS = config.shotcallerCards;
const TRIAL_CHARGES = config.trials;

const PLOT_TWISTS = [
  {
    id: 'double-jeopardy',
    text: 'Double Jeopardy: Points are doubled! ⚡',
    effect: 'double_votes',
  },
  {
    id: 'mistrial',
    text: 'Mistrial: Everyone must vote again! 🔄',
    effect: 'forced_revote',
  },
  {
    id: 'diplomatic-immunity',
    text: 'Diplomatic Immunity: The accused is safe! 🛡️',
    effect: 'immunity',
  },
  {
    id: 'mob-justice',
    text: 'Mob Justice: Points will be deducted from everyone! 👥',
    effect: 'all_guilty',
  },
  {
    id: 'switcheroo',
    text: 'Switcheroo: One of the jurors is now the accused! 🔀',
    effect: 'swap_accused',
  },
];

// ============ HELPER FUNCTIONS ============
function log(message: string, data?: unknown) {
  console.log(`[CozyServer] ${message}`, data ? JSON.stringify(data) : '');
}

function getConnectedPlayers(room: GameRoom): Player[] {
  return Object.values(room.players).filter((p) => p.connected);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getPlayerCount(room: GameRoom): number {
  return getConnectedPlayers(room).length;
}

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// ============ SERVER ============
export default class CozyGameServer implements Party.Server {
  room: GameRoom;
  customPrompts: any = null;

  constructor(public readonly party: Party.Room) {
    this.room = this.getInitialState();
  }

  async fetchCustomPrompts() {
    const url = this.party.env.KV_REST_API_URL;
    const token = this.party.env.KV_REST_API_TOKEN;
    if (!url || !token) {
      log('KV env vars not found; using default config');
      return;
    }
    try {
      const roomCode = this.party.id;
      const key = `room:${roomCode}:prompts`;
      const res = await fetch(`${url}/get/${key}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json() as any;
        let result = data.result;
        if (typeof result === 'string') {
          result = JSON.parse(result);
        }
        if (result) {
          log('Fetched custom prompts successfully', { keys: Object.keys(result) });
          this.customPrompts = result;
        } else {
          this.customPrompts = null;
        }
      }
    } catch (err) {
      log('Error fetching custom prompts', err);
    }
  }

  async onStart() {
    const saved = await this.party.storage.get<GameRoom>('state');
    if (saved) {
      log('Loaded saved state from storage');
      this.room = saved;
      // Mark everyone as disconnected on start
      for (const p of Object.values(this.room.players)) {
        p.connected = false;
      }
    }
    await this.fetchCustomPrompts();
  }

  getInitialState(): GameRoom {
    return {
      players: {},
      currentGame: null,
      phase: 'lobby',
      round: 0,
      maxRounds: 5,
      timer: 0,
      countdown: 0,
      roundData: null,
      heistState: null,
      submissions: {},
      votes: {},
      hostId: null,
    };
  }

  // ---- CONNECTION HANDLERS ----
  onConnect(conn: Party.Connection) {
    log('Connection opened', { connId: conn.id });
    // Send current state
    this.sendTo(conn, { type: 'sync', state: this.room });
  }

  onClose(conn: Party.Connection) {
    log('Connection closed', { connId: conn.id });

    // Find player by connection ID and mark as disconnected
    for (const [playerId, player] of Object.entries(this.room.players)) {
      if (player.odersId === conn.id) {
        player.connected = false;
        player.lastActivity = Date.now();
        log('Player disconnected', { playerId, name: player.name });

        // If host left, assign new host
        if (this.room.hostId === playerId) {
          const connectedPlayers = getConnectedPlayers(this.room);
          this.room.hostId = connectedPlayers[0]?.id || null;
          log('New host assigned', { hostId: this.room.hostId });
        }

        // Handle mid-game disconnect
        if (this.room.phase !== 'lobby' && this.room.phase !== 'wrapped') {
          this.handlePlayerDisconnect(playerId);
        }

        break;
      }
    }

    // If too few players left mid-game, return to lobby
    const connectedPlayers = getConnectedPlayers(this.room);
    if (
      connectedPlayers.length < 2 &&
      this.room.currentGame &&
      !['results', 'sentencing', 'heist-result'].includes(this.room.phase)
    ) {
      log('Game stalled: too few players. Returning to lobby.');
      this.handleLeaveGame();
    }

    this.broadcastSync();
  }

  onError(conn: Party.Connection, error: Error) {
    log('Connection error', { connId: conn.id, error: error.message });
  }

  // ---- MESSAGE HANDLER ----
  onMessage(message: string, sender: Party.Connection) {
    try {
      const msg = JSON.parse(message) as ClientMessage;

      switch (msg.type) {
        case 'join':
          this.handleJoin(sender, msg);
          break;
        case 'ready':
          this.handleReady(sender.id, msg.ready);
          break;
        case 'start-game':
          this.handleStartGame(msg.gameId).catch(err => log('Error in handleStartGame:', err));
          break;
        case 'submit':
          this.handleSubmit(sender.id, msg.answer);
          break;
        case 'vote':
          this.handleVote(sender.id, msg.targetId);
          break;
        case 'next-round':
          this.handleNextRound();
          break;
        case 'leave-game':
          this.handleLeaveGame();
          break;
        case 'ping':
          this.handlePing(sender);
          break;
        case 'shotcaller-choose':
          this.handleShotcallerChoose(sender.id, msg.targetId);
          break;
        case 'use-token':
          this.handleUseToken(sender.id, msg.token, msg.targetId);
          break;
        case 'lie-rate-guess':
          this.handleLieRateGuess(sender.id, msg.targetId, msg.guessedAnswer);
          break;
        case 'trial-evidence':
          this.handleTrialEvidence(sender.id, msg.evidence);
          break;
        case 'trial-defense':
          this.handleTrialDefense(sender.id, msg.defense);
          break;
        case 'trial-vote':
          this.handleTrialVote(sender.id, msg.verdict);
          break;
        case 'trial-next-phase':
          this.handleTrialNextPhase(sender.id);
          break;
        case 'force-advance':
          this.handleForceAdvance(sender.id);
          break;
        case 'start-wrapped':
          this.handleStartWrapped(sender.id);
          break;
        case 'admin-trigger-event':
          if (msg.eventId === 'taj-fas-farted') {
            this.triggerTajFasFarted();
          }
          break;
        case 'heist-mission-select':
          this.handleHeistMissionSelect(sender.id, msg.operativeIds);
          break;
        case 'heist-vote':
          this.handleHeistVote(sender.id, msg.vote);
          break;
        case 'heist-action':
          this.handleHeistAction(sender.id, msg.action);
          break;
        case 'heist-accusation':
          this.handleHeistAccusation(sender.id, msg.targetId);
          break;
        case 'heist-continue':
          this.nextHeistRoundOrContinue();
          break;
        case 'heist-start-accusation':
          this.handleHeistStartAccusation(sender.id);
          break;
        case 'saboteur-guess':
          this.handleSaboteurGuess(sender.id, msg.word);
          break;
        case 'admin-end-game':
          this.handleAdminEndGame(sender.id);
          break;
        case 'reaction':
          this.handleReaction(sender.id, msg.emoji);
          break;
        case 'host-kick':
          this.handleHostKick(sender.id, msg.targetId);
          break;
      }
    } catch (e) {
      log('Message parse error', { error: (e as Error).message });
    }
  }

  handleStartWrapped(connId: string) {
    const player = this.findPlayerByConnId(connId);
    if (!player) return;
    const senderId = player.id;
    // Only host/admin can start wrapped
    if (this.room.hostId !== senderId) return;

    // Calculate stats based on timeline/history
    const stats: WrappedStats = this.calculateWrappedStats();

    this.room.phase = 'wrapped';
    this.room.roundData = {
      ...(this.room.roundData || {}),
      wrappedStats: stats,
    };

    log('Starting Wrapped Sequence', stats);
    this.broadcastSync();
  }

  calculateWrappedStats(): WrappedStats {
    const players = Object.values(this.room.players);
    if (players.length === 0) {
      // Fallback for empty room testing
      return {
        mostSeen: {
          id: 'test',
          name: 'No One',
          avatar: '👻',
          reason: 'Room was empty',
        },
        mostMisunderstood: {
          id: 'test',
          name: 'No One',
          avatar: '👻',
          reason: 'Room was empty',
        },
        controlFreak: {
          id: 'test',
          name: 'No One',
          avatar: '👻',
          reason: 'Room was empty',
        },
        voiceOfReason: {
          id: 'test',
          name: 'No One',
          avatar: '👻',
          reason: 'Room was empty',
        },
        emotionalCarry: {
          id: 'test',
          name: 'No One',
          avatar: '👻',
          reason: 'Room was empty',
        },
      };
    }

    // Helper to pick random if logic is inconclusive
    const pick = (list: Player[]) =>
      list.length > 0 ? getRandomItem(list) : players[0];

    // 1. Most Seen (Highest Score - assuming high score = doing well/being active)
    const sortedByScore = [...players].sort((a, b) => b.score - a.score);
    const mostSeen = sortedByScore[0];

    // 2. Most Misunderstood (Saboteur who lost? Or Lie Rate misunderstood?
    // Random fallback for now as we don't store deep history of "misunderstanding")
    const mostMisunderstood = pick(players.filter((p) => p.id !== mostSeen.id));

    // 3. Control Freak (Host? Or Shotcaller?)
    const host = this.room.hostId
      ? this.room.players[this.room.hostId]
      : players[0];
    const controlFreak = host || players[0];

    // 4. Voice of Reason (Least votes against in Trial? Or random "Good Guy")
    const voiceOfReason = pick(
      players.filter((p) => p.id !== mostSeen.id && p.id !== controlFreak.id)
    );

    // 5. Emotional Carry (Random "Vibes" person)
    const emotionalCarry = pick(
      players.filter(
        (p) => p.id !== mostSeen.id && p.id !== mostMisunderstood.id
      )
    );

    return {
      mostSeen: {
        id: mostSeen.id,
        name: mostSeen.name,
        avatar: mostSeen.avatar,
        reason: 'King of the arena, left their mark everywhere.',
      },
      mostMisunderstood: {
        id: mostMisunderstood.id,
        name: mostMisunderstood.name,
        avatar: mostMisunderstood.avatar,
        reason: 'Mind in one place, body in another. No one understood them.',
      },
      controlFreak: {
        id: controlFreak.id,
        name: controlFreak.name,
        avatar: controlFreak.avatar,
        reason: 'Tried to act like the leader but couldn\'t even manage a kitten.',
      },
      voiceOfReason: {
        id: voiceOfReason.id,
        name: voiceOfReason.name,
        avatar: voiceOfReason.avatar,
        reason: 'The only one who still has a shred of sanity in this squad.',
      },
      emotionalCarry: {
        id: emotionalCarry.id,
        name: emotionalCarry.name,
        avatar: emotionalCarry.avatar,
        reason: 'Carried the vibes and the sadness in their heart.',
      },
    };
  }

  // ---- HANDLERS ----
  handleJoin(
    conn: Party.Connection,
    msg: { userId: string; name: string; avatar: string }
  ) {
    const { userId, name, avatar } = msg;

    // Check if player already exists (reconnection)
    if (this.room.players[userId]) {
      log('Player reconnecting', { userId, name });
      this.room.players[userId].connected = true;
      this.room.players[userId].odersId = conn.id;
      this.room.players[userId].lastActivity = Date.now();
    } else {
      log('New player joining', { userId, name });
      this.room.players[userId] = {
        id: userId,
        odersId: conn.id,
        name,
        avatar,
        ready: false,
        connected: true,
        score: 0,
        lastActivity: Date.now(),
      };

      // First player becomes host
      if (!this.room.hostId) {
        this.room.hostId = userId;
        log('Host assigned', { hostId: userId });
      }
    }

    if (this.room.currentGame) {
      this.sendRoleToPlayer(userId);
    }

    this.broadcastSync();
  }

  handleReady(connId: string, ready: boolean) {
    const player = this.findPlayerByConnId(connId);
    if (!player) return;

    player.ready = ready;
    player.lastActivity = Date.now();
    log('Player ready state changed', { playerId: player.id, ready });

    this.broadcastSync();
  }

  async handleStartGame(gameId: GameId) {
    const connectedPlayers = getConnectedPlayers(this.room);
    const allReady = connectedPlayers.every((p) => p.ready);

    if (connectedPlayers.length < 2) {
      log('Cannot start: not enough players', {
        count: connectedPlayers.length,
      });
      return;
    }

    if (!allReady) {
      log('Cannot start: not all ready');
      return;
    }

    // Refresh custom prompts from database right before game starts
    await this.fetchCustomPrompts();

    log('Starting game', { gameId, playerCount: connectedPlayers.length });

    this.room.currentGame = gameId;
    this.room.round = 0;
    this.room.maxRounds = gameId === 'saboteur' ? 5 : 4;

    // Reset all ready states
    for (const player of connectedPlayers) {
      player.ready = false;
    }

    this.startCountdown();
  }

  async startCountdown() {
    this.room.phase = 'countdown';
    this.broadcastSync();

    for (let i = 3; i >= 0; i--) {
      this.room.countdown = i;
      this.broadcast({ type: 'countdown', count: i });
      await sleep(1000);
    }

    this.startRound();
  }

  // ---- GAME LOOP ----

  startRound() {
    this.room.round++;
    this.room.phase = 'playing';
    this.room.submissions = {};
    this.room.votes = {};
    this.room.roundData = null;

    log('Starting round', {
      round: this.room.round,
      game: this.room.currentGame,
    });

    switch (this.room.currentGame) {
      case 'saboteur':
        this.setupSaboteurRound();
        break;
      case 'rapid-fire':
        this.setupRapidFireRound();
        break;
      case 'most-likely':
        this.setupMostLikelyRound();
        break;
      case 'shotcaller':
        this.setupShotcallerRound();
        break;
      case 'lie-rate':
        this.setupLieRateRound();
        break;
      case 'heist':
        this.setupHeistRound();
        break;
      case 'group-trial':
        this.setupGroupTrialRound();
        break;
    }

    // 1% Chance required by USER for "Taj Fas Farted" event
    this.triggerRandomRareEvent();

    this.broadcastSync();
    this.sendRoles();

    // Auto-advance logic
    const timeout = this.room.currentGame === 'rapid-fire' ? 120000 : 60000;
    setTimeout(() => {
      const activePhases = [
        'playing',
        'voting',
        'guessing',
        'evidence',
        'defense',
      ];
      if (
        activePhases.includes(this.room.phase) ||
        this.room.phase.startsWith('heist-')
      ) {
        log('Round timeout', {
          game: this.room.currentGame,
          phase: this.room.phase,
        });
        this.autoSubmitMissing();
      }
    }, timeout);
  }
  // ---- GAME SETUP HANDLERS ----
  setupSaboteurRound() {
    const connectedPlayers = getConnectedPlayers(this.room);
    const saboteurId = getRandomItem(connectedPlayers).id;
    const grids = (config as any).chameleonGrids || [
      {
        category: "Holiday Items",
        words: ["Santa", "Elves", "Reindeer", "Sleigh", "Snowman", "Presents", "Stockings", "Chimney", "Holly", "Wreath", "Mistletoe", "Carols", "Ornaments", "Eggnog", "Tinsel", "Star"]
      }
    ];
    const gridObj = getRandomItem(grids) as any;
    const targetIndex = Math.floor(Math.random() * 16);
    const row = Math.floor(targetIndex / 4) + 1;
    const col = (targetIndex % 4) + 1;

    this.room.roundData = {
      category: gridObj.category,
      grid: gridObj.words,
      targetIndex: targetIndex,
      coords: `Row ${row}, Col ${col}`,
      targetWord: gridObj.words[targetIndex],
      saboteurId
    };
    log('Saboteur setup', { saboteurId, category: gridObj.category, targetWord: gridObj.words[targetIndex] });
  }

  setupRapidFireRound() {
    this.room.roundData = { startTime: Date.now() };
  }

  setupMostLikelyRound() {
    const deck = this.customPrompts?.mostLikelyPrompts || MOST_LIKELY_PROMPTS;
    const idx = (this.room.round - 1) % deck.length;
    this.room.roundData = { prompt: deck[idx] };
  }

  // ---- HEIST GAME SETUP & HANDLERS ----
  setupHeistRound() {
    const connectedPlayers = getConnectedPlayers(this.room);
    // Ensure we have exactly 4 players for the proper experience,
    // but code should handle fewer for testing if needed.
    // Spec says: Fixed players (Mo, Omar, Yazan, Mustafa).
    // We will assume whoever is connected plays.

    const playerIds = connectedPlayers.map((p) => p.id);
    const shuffledIds = shuffleArray(playerIds);

    // Assign Roles: 1 Snitch, rest Crew
    const snitchId = shuffledIds[0];
    const roles: Record<string, HeistRole> = {};
    playerIds.forEach((id) => {
      roles[id] = id === snitchId ? 'snitch' : 'crew';
    });

    this.room.heistState = {
      status: 'active',
      roles,
      leaderIndex: 0,
      meters: {
        success: 0,
        heat: 0,
        successTarget: 6,
        heatMax: 6,
      },
      phase: 'briefing', // Start directly in briefing usually, or lobby if manual start
      currentMission: null,
      selectedOperatives: [],
      votes: {},
      actions: {},
      lastOutcome: null,
      accusation: {
        accusationsLeft: 2,
        votes: {},
        active: false, // Only active during accusation phase
      },
      log: [
        {
          time: new Date().toISOString(),
          type: 'system',
          message: 'Game started. The Snitch has been assigned.',
        },
      ],
    };

    // Draw first mission immediately or wait for flow?
    // Spec: "Round Flow: 1. briefing (show mission card, leader selects)"
    // We need to implement Mission Deck logic. For MVP, we can generate random missions.
    this.startHeistRound(false);

    log('Heist game setup', { snitchId });
  }

  startHeistRound(increment: boolean = true) {
    if (!this.room.heistState) return;

    if (increment) {
      this.room.round += 1;
    }
    this.room.phase = 'playing';

    // Rotate Leader
    // this.room.round is already incremented in startRound() wrapper

    // Rotate Leader
    // Leader rotates each round (roundIndex % 4) -> players are not indexable directly unless we fix order.
    // Let's us sorted player IDs for consistent rotation or just index.
    const playerIds = Object.keys(this.room.heistState.roles).sort(); // specific order
    const leaderId = playerIds[this.room.round % playerIds.length]; // 1-based round? round is 0-indexed in setup usually?
    // room.round starts at 1 in startRound()

    // Generate Mission
    const mission = this.generateHeistMission(this.room.round);

    this.room.heistState.phase = 'briefing';
    this.room.heistState.currentMission = mission;
    this.room.heistState.selectedOperatives = [];
    this.room.heistState.votes = {};
    this.room.heistState.actions = {};

    // Update Leader Index explicitly
    this.room.heistState.leaderIndex = this.room.round % playerIds.length;

    // Leader is implicitly determined by round index in frontend, or we can store it
    // Spec says: "Leader rotates each round"

    log('Heist round started', {
      round: this.room.round,
      mission: mission.title,
    });
  }

  generateHeistMission(round: number): HeistMission {
    // Mission Card Schema
    // For MVP, randomly generate or pick from a fixed set relevant to the "High Stakes" theme
    const missions: Partial<HeistMission>[] = [
      {
        title: 'Disable Cameras',
        brief: 'Hack the CCTV loop.',
        operativesRequired: 2,
        successDeltaOnClean: 1,
        heatDeltaOnClean: 0,
        successDeltaOnSabotage: 0,
        heatDeltaOnSabotage: 2,
      },
      {
        title: 'Sedate the Guard',
        brief: 'Slip something in his coffee.',
        operativesRequired: 2,
        successDeltaOnClean: 1,
        heatDeltaOnClean: 0,
        successDeltaOnSabotage: 0,
        heatDeltaOnSabotage: 1,
      },
      {
        title: 'Clone Keycard',
        brief: 'Get close enough to scan it.',
        operativesRequired: 3,
        successDeltaOnClean: 2,
        heatDeltaOnClean: 0,
        successDeltaOnSabotage: 0,
        heatDeltaOnSabotage: 1,
      },
      {
        title: 'Crack the Safe',
        brief: 'Drill silently.',
        operativesRequired: 3,
        successDeltaOnClean: 2,
        heatDeltaOnClean: 0,
        successDeltaOnSabotage: 0,
        heatDeltaOnSabotage: 2,
      },
      {
        title: 'Extract the Asset',
        brief: 'Heavy lifting required.',
        operativesRequired: 3,
        successDeltaOnClean: 2,
        heatDeltaOnClean: 0,
        successDeltaOnSabotage: 0,
        heatDeltaOnSabotage: 2,
      },
      {
        title: 'Escape Route',
        brief: 'Secure the van.',
        operativesRequired: 2,
        successDeltaOnClean: 1,
        heatDeltaOnClean: 0,
        successDeltaOnSabotage: 0,
        heatDeltaOnSabotage: 1,
      },
      {
        title: 'Bribe the Official',
        brief: 'Everyone has a price.',
        operativesRequired: 2,
        successDeltaOnClean: 1,
        heatDeltaOnClean: 0,
        successDeltaOnSabotage: 0,
        heatDeltaOnSabotage: 1,
      },
      {
        title: 'The Big Switch',
        brief: 'Swap the diamond for a fake.',
        operativesRequired: 3,
        successDeltaOnClean: 3,
        heatDeltaOnClean: 0,
        successDeltaOnSabotage: 0,
        heatDeltaOnSabotage: 2,
      },
    ];

    const template = missions[(round - 1) % missions.length] || missions[0];

    return {
      id: `m-${Date.now()}`,
      title: template.title!,
      brief: template.brief!,
      operativesRequired: template.operativesRequired!,
      successDeltaOnClean: template.successDeltaOnClean!,
      heatDeltaOnClean: template.heatDeltaOnClean!,
      successDeltaOnSabotage: template.successDeltaOnSabotage!,
      heatDeltaOnSabotage: template.heatDeltaOnSabotage!,
    };
  }

  handleHeistMissionSelect(connId: string, operativeIds: string[]) {
    const player = this.findPlayerByConnId(connId);
    if (!player) return;
    const playerId = player.id;
    const s = this.room.heistState;
    if (!s || s.phase !== 'briefing') return;

    // Validate Leader
    const playerIds = Object.keys(s.roles).sort();
    const leaderId = playerIds[s.leaderIndex];

    if (playerId !== leaderId) return; // Not leader
    if (operativeIds.length !== s.currentMission?.operativesRequired) return; // Wrong count

    s.selectedOperatives = operativeIds;
    s.phase = 'voting'; // Move to voting
    s.votes = {}; // Reset votes

    this.broadcastSync();
  }

  handleHeistVote(connId: string, vote: 'approve' | 'reject') {
    const player = this.findPlayerByConnId(connId);
    if (!player) return;
    const playerId = player.id;
    const s = this.room.heistState;
    if (!s || s.phase !== 'voting') return;

    s.votes[playerId] = vote;

    // Check if everyone voted
    const connectedIds = getConnectedPlayers(this.room).map((p) => p.id);
    const allVoted = connectedIds.every((id) => s.votes[id]);

    if (allVoted) {
      // Tally
      const approves = Object.values(s.votes).filter(
        (v) => v === 'approve'
      ).length;
      const rejects = Object.values(s.votes).filter(
        (v) => v === 'reject'
      ).length;

      if (approves > rejects) {
        // Approved -> Execution
        s.phase = 'execution';
        s.log.push({
          time: new Date().toISOString(),
          type: 'vote',
          message: `Mission approved (${approves}-${rejects}). Operatives deployed.`,
        });
      } else {
        // Rejected -> HEAT +1, Next Round?
        // Spec: "If rejected: HEAT +1 (pressure penalty)"
        s.meters.heat += 1;
        s.phase = 'reveal'; // Show that it was rejected and heat went up
        s.lastOutcome = {
          approved: false,
          sabotaged: false,
          successDelta: 0,
          heatDelta: 1,
        };
        s.log.push({
          time: new Date().toISOString(),
          type: 'vote',
          message: `Mission rejected (${approves}-${rejects}). Heat increased!`,
        });

        this.checkHeistEndGame();
      }
    }

    this.broadcastSync();
  }

  handleHeistAction(connId: string, action: 'commit' | 'sabotage') {
    const player = this.findPlayerByConnId(connId);
    if (!player) return;
    const playerId = player.id;
    const s = this.room.heistState;
    if (!s || s.phase !== 'execution') return;

    if (!s.selectedOperatives.includes(playerId)) return;

    // Validate role for sabotage
    if (action === 'sabotage' && s.roles[playerId] !== 'snitch') {
      // Crew tried to sabotage? Illegal in spec?
      // Spec: "ONE player is secretly the SNITCH... Everyone else is CREW."
      // Spec: "If ANY operative sabotages → sabotage outcome"
      // Usually, crew is forced to Commit. Snitch can choose.
      // We'll enforce Crew must Commit.
      action = 'commit';
    }

    s.actions[playerId] = action;

    // Check if all selected operatives acted
    const allActed = s.selectedOperatives.every((id) => s.actions[id]);

    if (allActed) {
      this.resolveHeistMission();
    }

    this.broadcastSync();
  }

  resolveHeistMission() {
    const s = this.room.heistState;
    if (!s || !s.currentMission) return;

    const sabotages = Object.values(s.actions).filter(
      (a) => a === 'sabotage'
    ).length;
    const isSabotaged = sabotages > 0;

    let successDelta = 0;
    let heatDelta = 0;

    if (isSabotaged) {
      successDelta = s.currentMission.successDeltaOnSabotage;
      heatDelta = s.currentMission.heatDeltaOnSabotage;
    } else {
      successDelta = s.currentMission.successDeltaOnClean;
      heatDelta = s.currentMission.heatDeltaOnClean;
    }

    s.meters.success += successDelta;
    s.meters.heat += heatDelta;

    s.lastOutcome = {
      approved: true,
      sabotaged: isSabotaged,
      successDelta,
      heatDelta,
    };

    s.phase = 'reveal';
    s.log.push({
      time: new Date().toISOString(),
      type: 'outcome',
      message: isSabotaged
        ? `Mission SABOTAGED! Heat +${heatDelta}.`
        : `Mission CLEAN. Success +${successDelta}.`,
    });

    this.checkHeistEndGame();
  }

  handleHeistStartAccusation(connId: string) {
    const player = this.findPlayerByConnId(connId);
    if (!player) return;
    const playerId = player.id;
    const s = this.room.heistState;
    if (!s) return;

    // Can only accuse if accusations left
    if (s.accusation.accusationsLeft <= 0) return;

    // Can only accuse in non-active phases? Or anytime?
    // Spec: "Any player can call... pause game"
    // Let's restrict to 'briefing' or 'reveal' to avoid disrupting voting/execution.
    // Spec says "2 accusations per game".
    if (['briefing', 'reveal'].includes(s.phase)) {
      s.phase = 'accusation';
      s.accusation.active = true;
      s.accusation.votes = {}; // Reset votes

      s.log.push({
        time: new Date().toISOString(),
        type: 'system',
        message: `${player.name} called an Emergency Meeting!`,
      });

      this.broadcastSync();
    }
  }

  handleHeistAccusation(connId: string, targetId: string) {
    const player = this.findPlayerByConnId(connId);
    if (!player) return;
    const playerId = player.id;
    // Only vote during Accusation phase
    const s = this.room.heistState;
    if (!s || s.phase !== 'accusation') return;

    s.accusation.votes[playerId] = targetId;

    const connectedIds = getConnectedPlayers(this.room).map((p) => p.id);
    const allVoted = connectedIds.every((id) => s.accusation.votes[id]);

    if (allVoted) {
      // Check majority
      const voteCounts: Record<string, number> = {};
      Object.values(s.accusation.votes).forEach((tId) => {
        voteCounts[tId] = (voteCounts[tId] || 0) + 1;
      });

      const maxVotes = Math.max(...Object.values(voteCounts));
      const accusedCandidates = Object.entries(voteCounts)
        .filter(([_, count]) => count === maxVotes)
        .map(([id]) => id);

      // Strict majority required? "If majority agrees on same accused"
      const majorityThreshold = Math.ceil(connectedIds.length / 2 + 0.1);
      // e.g. 4 players -> need 3? or just > 2? Usually > 50%.
      // 4 players -> >2 = 3.
      // Spec says "If majority agrees". With 4 players, 2 vs 2 is split. 3 is majority.

      let outcomeMsg = 'Votes split. No accusation resolved.';

      if (
        maxVotes > connectedIds.length / 2 &&
        accusedCandidates.length === 1
      ) {
        const accused = accusedCandidates[0];
        const isSnitch = s.roles[accused] === 'snitch';

        if (isSnitch) {
          // Crew Wins
          s.meters.success = s.meters.successTarget; // Max out success to trigger win
          this.endHeist('Crew wins! The Snitch was caught.');
          return;
        } else {
          // Wrong Accusation
          s.accusation.accusationsLeft -= 1;
          s.meters.heat += 1;
          outcomeMsg = `Wrong! ${
            this.room.players[accused]?.name || accused
          } is NOT the Snitch. Heat +1.`;
          s.log.push({
            time: new Date().toISOString(),
            type: 'accusation',
            message: outcomeMsg,
          });

          // Check loss/game over due to heat
          this.checkHeistEndGame();
        }
      } else {
        s.log.push({
          time: new Date().toISOString(),
          type: 'accusation',
          message: outcomeMsg,
        });
      }

      // End accusation phase, go to next round (unless game ended)
      if (this.room.heistState?.phase === 'accusation') {
        this.nextHeistRoundOrContinue();
      }
    }

    this.broadcastSync();
  }

  checkHeistEndGame() {
    const s = this.room.heistState;
    if (!s) return;

    if (s.meters.success >= s.meters.successTarget) {
      this.endHeist('Mission Complete. CREW WINS!');
    } else if (s.meters.heat >= s.meters.heatMax) {
      this.endHeist('Alarm triggered. SNITCH WINS!');
    }
  }

  endHeist(message: string) {
    if (!this.room.heistState) return;
    this.room.heistState.phase = 'finalReveal';
    this.room.heistState.log.push({
      time: new Date().toISOString(),
      type: 'outcome',
      message,
    });
    this.broadcastSync();
  }

  nextHeistRoundOrContinue() {
    if (!this.room.heistState) return;

    // Check max rounds
    if (this.room.round >= 8) {
      // Game End
      if (
        this.room.heistState.meters.success >=
        this.room.heistState.meters.successTarget
      ) {
        this.endHeist('Max rounds reached. CREW WINS!');
      } else {
        this.endHeist('Max rounds reached. SNITCH WINS!');
      }
      return;
    }

    // Proceed to next round briefing
    this.startHeistRound(true);
    this.broadcastSync();
  }

  // Override handleNextRound for Heist or add specific logic

  handleHeistVotekick(connId: string, targetId: string) {
    // Reuse logic mapped to accusation
    this.handleHeistAccusation(connId, targetId);
  }

  handleAdminEndGame(connId: string) {
    const p = this.findPlayerByConnId(connId);
    if (!p) return;
    const playerId = p.id;
    // Simple auth check by name or host
    if (p.name !== 'mo' && this.room.hostId !== playerId) return;

    log('Admin ended game', { by: p.name });
    this.room.phase = 'lobby';
    this.room.currentGame = null;
    this.room.round = 0;
    this.room.heistState = null;
    this.broadcastSync();
  }

  handleHostKick(connId: string, targetId: string) {
    const kicker = this.findPlayerByConnId(connId);
    if (!kicker) return;
    // Only host can kick
    if (this.room.hostId !== kicker.id) return;
    // Can't kick yourself
    if (kicker.id === targetId) return;

    const target = this.room.players[targetId];
    if (!target) return;

    log('Host kicked player', { kickedBy: kicker.name, target: target.name });

    // Notify the kicked player
    const targetConn = this.findConnById(target.odersId);
    if (targetConn) {
      this.sendTo(targetConn, { type: 'kicked', reason: 'You were removed by the host.' });
    }

    // Remove from player list
    delete this.room.players[targetId];

    // If too few players mid-game, return to lobby
    const connectedPlayers = getConnectedPlayers(this.room);
    if (
      connectedPlayers.length < 2 &&
      this.room.currentGame &&
      !['results', 'sentencing', 'heist-result', 'lobby'].includes(this.room.phase)
    ) {
      this.handleLeaveGame();
    }

    this.broadcastSync();
  }

  // ---- SCORING & LOGIC ----
  sendRoles() {
    const connectedPlayers = getConnectedPlayers(this.room);
    for (const player of connectedPlayers) {
      this.sendRoleToPlayer(player.id);
    }
  }

  sendRoleToPlayer(playerId: string) {
    const player = this.room.players[playerId];
    if (!player) return;

    const conn = this.findConnById(player.odersId);
    if (!conn) return;

    let role = 'player';
    let data: any = this.room.roundData;

    if (this.room.currentGame === 'saboteur') {
      role =
        player.id === this.room.roundData?.saboteurId ? 'saboteur' : 'innocent';
      if (role === 'innocent') {
        data = {
          category: this.room.roundData?.category,
          grid: this.room.roundData?.grid,
          coords: this.room.roundData?.coords,
        };
      } else {
        data = {
          category: this.room.roundData?.category,
          grid: this.room.roundData?.grid,
          coords: '??',
        };
      }
    } else if (this.room.currentGame === 'heist') {
      const heistState = this.room.heistState;
      if (heistState) {
        if (player.id === heistState.roles[player.id])
          role = heistState.roles[player.id]; // 'snitch' or 'crew'
        role = heistState.roles[player.id];
      }
    }

    this.sendTo(conn, { type: 'role', role, data });
  }

  handleSubmit(connId: string, answer: unknown) {
    const player = this.findPlayerByConnId(connId);
    if (!player || this.room.phase !== 'playing') return;

    // Lie Rate special handling
    if (this.room.currentGame === 'lie-rate') {
      this.handleLieRateSubmit(connId, answer as any);
      return;
    }

    this.room.submissions[player.id] = answer;
    player.lastActivity = Date.now();

    // Rapid Fire: Handle progress updates (special case)
    if (this.room.currentGame === 'rapid-fire') {
      // payload might be { progress: 3, done: false }
      // We broadcast this immediately so progress bars update
      this.broadcast({
        type: 'progress_update',
        playerId: player.id,
        data: answer,
      });

      const ans = answer as any;
      if (ans.done) {
        // Check if all done
        this.checkAllSubmitted();
      }
      return;
    }

    this.broadcastSync();
    this.checkAllSubmitted();
  }

  checkAllSubmitted() {
    const connectedPlayers = getConnectedPlayers(this.room);
    const submittedCount = connectedPlayers.filter((p) => {
      if (this.room.currentGame === 'rapid-fire') {
        const sub = this.room.submissions[p.id] as any;
        return sub && sub.done;
      }
      return this.room.submissions[p.id];
    }).length;

    if (submittedCount >= connectedPlayers.length) {
      this.startVoting();
    }
  }

  startVoting() {
    // Rapid Fire skip voting, go straight to results
    if (this.room.currentGame === 'rapid-fire') {
      this.showResults();
      return;
    }

    this.room.phase = 'voting';
    this.room.votes = {};
    log('Voting phase started');
    this.broadcastSync();

    setTimeout(() => {
      if (this.room.phase === 'voting') this.autoVoteMissing();
    }, 30000);
  }

  showResults() {
    this.room.phase = 'results';

    // Calculate Scores based on Game Type
    switch (this.room.currentGame) {
      case 'saboteur':
        this.scoreSaboteur();
        break;
      case 'most-likely':
        this.scoreMostLikely();
        break;
      case 'rapid-fire':
        this.scoreRapidFire();
        break;
      case 'shotcaller':
        // Shotcaller points are applied during selection
        break;
      case 'group-trial':
        // Group Trial points are applied during sentencing
        break;
    }

    this.broadcastSync();
    this.broadcast({
      type: 'reveal',
      data: {
        roundData: this.room.roundData,
        submissions: this.room.submissions,
        votes: this.room.votes,
      },
    });
  }

  // ---- SCORING LOGIC ----

  scoreMostLikely() {
    // Points for being in the majority
    const voteCounts: Record<string, number> = {};
    Object.values(this.room.votes).forEach((targetId) => {
      voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
    });

    const maxVotes = Math.max(0, ...Object.values(voteCounts));
    const winners = Object.keys(voteCounts).filter(
      (id) => voteCounts[id] === maxVotes
    ); // Who won the "most likely" title

    const isFinalRound = this.room.round === this.room.maxRounds;
    const multiplier = isFinalRound ? 2 : 1;

    // If you voted for the winner, you get points
    for (const [voterId, targetId] of Object.entries(this.room.votes)) {
      if (winners.includes(targetId)) {
        if (this.room.players[voterId]) {
          this.room.players[voterId].score += 200 * multiplier;
        }
      }
    }

    // Bet Payouts: If a player's betId matches the winner, they get +200 points!
    for (const [voterId, sub] of Object.entries(this.room.submissions)) {
      const betId = (sub as any)?.betId;
      if (betId && winners.includes(betId)) {
        if (this.room.players[voterId]) {
          this.room.players[voterId].score += 200 * multiplier;
        }
      }
    }

    // Punishment for the "winner" - makes it more badass/competitive
    for (const winnerId of winners) {
      if (this.room.players[winnerId]) {
        this.room.players[winnerId].score -= 100 * multiplier;
      }
    }
  }

  scoreRapidFire() {
    // submissions: { pid: { score: 500, done: true, time: 1234 } }
    // Add logic to steal points? For now just add client calc score
    // In "Speed Run", client sends final score.
    // Bonus for fastest finisher?
    const subs = Object.entries(this.room.submissions)
      .map(([pid, val]: any) => ({ pid, ...val }))
      .filter((s) => s.done)
      .sort((a, b) => a.time - b.time);

    if (subs.length > 0) {
      const winner = this.room.players[subs[0].pid];
      if (winner) winner.score += 500; // First place bonus
    }

    for (const sub of subs) {
      const p = this.room.players[sub.pid];
      if (p) p.score += sub.score || 0;
    }
  }
  handleNextRound() {
    if (this.room.currentGame === 'heist') {
      this.nextHeistRoundOrContinue();
      return;
    }
    if (this.room.round >= this.room.maxRounds) {
      this.endGame();
    } else {
      log('Advancing to next round');
      this.startRound();
    }
  }

  handleLeaveGame() {
    log('Leaving game, returning to lobby');

    this.room.currentGame = null;
    this.room.phase = 'lobby';
    this.room.round = 0;
    this.room.roundData = null;
    this.room.submissions = {};
    this.room.votes = {};

    for (const player of Object.values(this.room.players)) {
      player.ready = false;
    }

    this.broadcastSync();
  }

  handlePing(conn: Party.Connection) {
    const player = this.findPlayerByConnId(conn.id);
    if (player) {
      player.lastActivity = Date.now();
    }
    this.sendTo(conn, { type: 'pong' });
  }

  handleReaction(connId: string, emoji: string) {
    const player = this.findPlayerByConnId(connId);
    if (!player) return;
    this.broadcast({
      type: 'emoji-blast',
      playerId: player.id,
      playerName: player.name,
      avatar: player.avatar,
      emoji,
    });
  }

  handlePlayerDisconnect(playerId: string) {
    const roundData = this.room.roundData as any;
    log('Handling active game disconnect', {
      playerId,
      game: this.room.currentGame,
      phase: this.room.phase,
    });

    // Handle CRITICAL roles leaving
    if (this.room.currentGame === 'heist' && this.room.heistState) {
      if (this.room.heistState.roles[playerId] === 'snitch') {
        this.endHeist('The Snitch has disconnected! Game Over.');
        return;
      }
    }

    if (
      this.room.currentGame === 'saboteur' &&
      playerId === roundData?.saboteurId
    ) {
      log('Saboteur left! Ending round.');
      this.room.phase = 'results';
      if (roundData)
        roundData.eventMessage = 'The Saboteur has fled the scene! Game Over.';
      this.broadcastSync();
      return;
    }

    if (
      this.room.currentGame === 'group-trial' &&
      playerId === roundData?.accusedId
    ) {
      log('Accused left! Auto-acquitting.');
      this.room.phase = 'results';
      if (roundData)
        roundData.eventMessage = 'The Accused has vanished! Case dismissed.';
      this.broadcastSync();
      return;
    }

    if (
      this.room.currentGame === 'shotcaller' &&
      playerId === roundData?.shotcallerId
    ) {
      log('Shotcaller left! Auto-resolving card.');
      // Auto-resolve for a random target if playing
      if (this.room.phase === 'playing') {
        const connectedPlayers = getConnectedPlayers(this.room);
        const target = getRandomItem(connectedPlayers);
        const p = this.room.players[playerId];
        if (target && p) this.handleShotcallerChoose(p.odersId, target.id);
      }
      return;
    }

    // Handle general stalls (playing phase)
    if (this.room.phase === 'playing' && !this.room.submissions[playerId]) {
      // We don't necessarily NEED their submission anymore to proceed
      // checkAllSubmitted will now only count connected players
      this.checkAllSubmitted();
    }

    // Handle general stalls (voting phase)
    if (this.room.phase === 'voting' && !this.room.votes[playerId]) {
      // checkAllVoted will now only count connected players
      this.checkAllVoted();
    }

    // Handle Group Trial specific phases
    if (this.room.currentGame === 'group-trial') {
      if (this.room.phase === 'evidence' || this.room.phase === 'voting') {
        const connectedPlayers = getConnectedPlayers(this.room);
        const jurors = connectedPlayers.filter(
          (p) => p.id !== roundData?.accusedId
        );

        if (this.room.phase === 'evidence') {
          const allSubmitted = jurors.every((j) => roundData?.evidence?.[j.id]);
          if (allSubmitted) {
            this.room.phase = 'defense';
            if (this.room.roundData)
              this.room.roundData.defensePhaseEnd = Date.now() + 45000;
            this.broadcastSync();
          }
        } else if (this.room.phase === 'voting') {
          const allVoted = jurors.every((j) => roundData?.verdicts?.[j.id]);
          if (allVoted) this.finishGroupTrialRound();
        }
      }
    }
  }

  endGame() {
    log('Game ended');
    this.room.phase = 'results';
    this.broadcastSync();
  }

  // ---- UTILITY METHODS ----
  findPlayerByConnId(connId: string): Player | undefined {
    return Object.values(this.room.players).find(
      (p) => p.odersId === connId || p.id === connId
    );
  }

  findConnById(connId: string): Party.Connection | undefined {
    for (const conn of this.party.getConnections()) {
      if (conn.id === connId) return conn;
    }
  }

  sendTo(conn: Party.Connection, msg: unknown) {
    try {
      conn.send(JSON.stringify(msg));
    } catch (e) {
      log('Send error', { error: (e as Error).message });
    }
  }

  broadcast(msg: unknown) {
    const message = JSON.stringify(msg);
    for (const conn of this.party.getConnections()) {
      try {
        conn.send(message);
      } catch (e) {
        log('Broadcast error', { connId: conn.id });
      }
    }
  }

  async broadcastSync() {
    // Save to storage for persistence
    await this.party.storage.put('state', this.room);
    this.broadcast({ type: 'sync', state: this.room });
  }

  sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ---- MISSING HANDLERS & HELPERS ----

  handleVote(connId: string, targetId: string) {
    if (this.room.phase !== 'voting') return;
    const player = this.findPlayerByConnId(connId);
    if (!player) return;

    this.room.votes[player.id] = targetId;
    player.lastActivity = Date.now();
    this.broadcastSync();
    this.checkAllVoted();
  }

  checkAllVoted() {
    // If everyone (connected) has voted, move to results
    const connectedPlayers = getConnectedPlayers(this.room);
    if (connectedPlayers.length === 0) return;

    const voteCount = connectedPlayers.filter(
      (p) => this.room.votes[p.id]
    ).length;

    if (voteCount >= connectedPlayers.length) {
      this.showResults();
    }
  }

  autoSubmitMissing() {
    const connectedPlayers = getConnectedPlayers(this.room);

    if (this.room.currentGame === 'heist') {
      this.autoSubmitHeist();
      return;
    }
    if (this.room.currentGame === 'group-trial') {
      this.autoSubmitGroupTrial();
      return;
    }

    // For each player who hasn't submitted
    for (const player of connectedPlayers) {
      if (!this.room.submissions[player.id]) {
        // Auto submit based on game type
        if (this.room.currentGame === 'rapid-fire') {
          this.room.submissions[player.id] = {
            done: true,
            score: player.score,
          }; // Just finish them
        } else {
          this.room.submissions[player.id] = "(Time's Up)";
        }
      }
    }

    this.checkAllSubmitted();
  }

  autoSubmitHeist() {
    const state = this.room.heistState;
    if (!state) return;
    const connectedPlayers = getConnectedPlayers(this.room);

    if (state.phase === 'briefing') {
      // Auto-select first mission if planner is idle
      log('Auto-selecting heist mission (timeout)');
      // Need 2 or 3 random operatives
      if (state.currentMission) {
        const required = state.currentMission.operativesRequired;
        const potential = connectedPlayers.map((p) => p.id);
        const selected = potential.slice(0, required);
        // Ensure we have enough players
        if (selected.length === required) {
          // We need to call the handler, but it expects senderId.
          // We can simulate or call internal logic.
          // But handleHeistMissionSelect verifies sender is planner.
          // We should force it.
          state.selectedOperatives = selected;
          state.phase = 'voting';
          state.votes = {};
          this.broadcastSync();
        }
      }
    } else if (state.phase === 'voting') {
      // Auto-approve if voters are idle
      log('Auto-voting heist mission (timeout)');
      for (const p of connectedPlayers) {
        if (!state.votes[p.id]) {
          this.handleHeistVote(p.id, 'approve');
        }
      }
    } else if (state.phase === 'execution') {
      // Auto-commit if operatives are idle
      log('Auto-executing heist action (timeout)');
      for (const pid of state.selectedOperatives) {
        if (!state.actions[pid]) {
          this.handleHeistAction(pid, 'commit');
        }
      }
    }
  }

  autoVoteMissing() {
    const connectedPlayers = getConnectedPlayers(this.room);

    for (const player of connectedPlayers) {
      if (!this.room.votes[player.id]) {
        // Vote for random other player
        const others = connectedPlayers.filter((p) => p.id !== player.id);
        this.room.votes[player.id] = getRandomItem(others)?.id || player.id;
      }
    }
    this.checkAllVoted();
  }

  scoreSaboteur() {
    // Logic for saboteur
    const roundData = this.room.roundData as any;
    if (!roundData) return;

    const saboteur = this.room.players[roundData.saboteurId];
    if (!saboteur) return;

    // If saboteur wasn't caught (most votes), they win
    // Calculate votes against saboteur
    const votesAgainstSaboteur = Object.values(this.room.votes).filter(
      (id) => id === roundData.saboteurId
    ).length;
    const totalVotes = Object.keys(this.room.votes).length;

    const isFinalRound = this.room.round === this.room.maxRounds;
    const multiplier = isFinalRound ? 2 : 1;

    if (votesAgainstSaboteur < totalVotes / 2) {
      // Saboteur wins big
      saboteur.score += 500 * multiplier;
    } else {
      // Everyone else wins
      for (const playerId of Object.keys(this.room.players)) {
        if (playerId !== roundData.saboteurId) {
          this.room.players[playerId].score += 300 * multiplier;
        }
      }
    }
  }

  handleSaboteurGuess(connId: string, word: string) {
    if (this.room.phase !== 'results' || !this.room.roundData) return;
    const player = this.findPlayerByConnId(connId);
    if (!player) return;
    const playerId = player.id;
    const roundData = this.room.roundData as any;
    if (playerId !== roundData.saboteurId) return;

    if (word.toLowerCase().trim() === roundData.targetWord.toLowerCase().trim()) {
      // Saboteur successfully escaped! Give them bonus points
      const saboteur = this.room.players[playerId];
      if (saboteur) {
        saboteur.score += 400; // escape bonus
      }
      this.room.roundData.eventMessage = `GLORIOUS ESCAPE! ${saboteur?.name || 'The Saboteur'} guessed the word "${word}" correctly and stole the spotlight! 🏃‍♂️💨`;
    } else {
      const saboteur = this.room.players[playerId];
      this.room.roundData.eventMessage = `ESCAPE FAILED! ${saboteur?.name || 'The Saboteur'} guessed "${word}" but the secret word was "${roundData.targetWord}". 💀`;
    }
    this.broadcastSync();
  }

  // SHOTCALLER logic (already moved below)

  // ============ SHOTCALLER GAME ============

  setupShotcallerRound() {
    const connectedPlayers = getConnectedPlayers(this.room);

    // Rotate shotcaller
    const playerIds = connectedPlayers.map((p) => p.id);
    const prevShotcaller = this.room.roundData?.shotcallerId;
    let shotcallerIndex = 0;

    if (prevShotcaller) {
      const prevIndex = playerIds.indexOf(prevShotcaller);
      shotcallerIndex = (prevIndex + 1) % playerIds.length;
    }

    const shotcallerId = playerIds[shotcallerIndex];
    const deck = this.customPrompts?.shotcallerCards || SHOTCALLER_CARDS;
    const card = deck[Math.floor(Math.random() * deck.length)];

    // Initialize tokens for all players on round 1
    const tokens: Record<
      string,
      { clutch: boolean; sabotage: boolean; shield: boolean }
    > = {};
    if (this.room.round === 1) {
      for (const p of connectedPlayers) {
        tokens[p.id] = { clutch: true, sabotage: true, shield: true };
      }
    } else {
      // Keep existing tokens
      Object.assign(tokens, this.room.roundData?.tokens || {});
    }

    this.room.roundData = {
      shotcallerId,
      decisionCard: card,
      tokens,
      timeline: this.room.roundData?.timeline || [],
    };

    log('Shotcaller round setup', { shotcallerId, cardId: card.id });
  }

  handleShotcallerChoose(connId: string, targetId: string) {
    if (this.room.currentGame !== 'shotcaller' || this.room.phase !== 'playing')
      return;

    const player = this.findPlayerByConnId(connId);
    if (!player) return;

    const roundData = this.room.roundData as any;
    if (!roundData || player.id !== roundData.shotcallerId) {
      log('Not the shotcaller', {
        playerId: player.id,
        shotcallerId: roundData?.shotcallerId,
      });
      return;
    }

    // Pick random outcome
    const card = roundData.decisionCard;
    if (!card) return;

    const outcomeIndex =
      card.revealType === 'fixed'
        ? 0
        : Math.floor(Math.random() * card.outcomes.length);
    const outcome = card.outcomes[outcomeIndex];

    // Apply points
    const target = this.room.players[targetId];
    if (target) {
      // Check for shield
      // Check for shield
      if (roundData.tokens?.[targetId]?.shield && outcome.points < 0) {
        // Shield blocks negative effect, don't apply
        log('Shield blocked', { targetId });
      } else {
        // Scale outcomes by 100 to match new economy (+/- 500)
        target.score += outcome.points * 100;
      }
    }

    // Bonus for rare outcome
    if (outcome.rare && player) {
      player.score += 200; // Meaningful bonus
    }

    // Store result
    roundData.targetId = targetId;
    roundData.outcomeIndex = outcomeIndex;
    roundData.eventMessage = outcome.text;

    // Add to timeline
    if (!roundData.timeline) roundData.timeline = [];
    roundData.timeline.push({
      id: `${this.room.round}-${Date.now()}`,
      round: this.room.round,
      playerId: player.id,
      message: `${player.name} chose ${target?.name}: ${outcome.text}`,
      type: outcome.rare ? 'clutch' : 'shotcaller',
      timestamp: Date.now(),
    });

    this.room.roundData = roundData;
    this.showResults();
  }

  // ============ LIE RATE GAME ============

  setupLieRateRound() {
    const deck = this.customPrompts?.lieRatePrompts || LIE_RATE_PROMPTS;
    const promptIndex = (this.room.round - 1) % deck.length;
    const prompt = deck[promptIndex];

    // Initialize tokens on round 1
    const tokens: Record<
      string,
      { clutch: boolean; sabotage: boolean; shield: boolean }
    > = {};
    if (this.room.round === 1) {
      for (const p of getConnectedPlayers(this.room)) {
        tokens[p.id] = { clutch: true, sabotage: true, shield: true };
      }
    } else {
      Object.assign(tokens, this.room.roundData?.tokens || {});
    }

    this.room.roundData = {
      lieRatePrompt: prompt,
      answers: {},
      guesses: {},
      tokens,
      timeline: this.room.roundData?.timeline || [],
    };

    log('LieRate round setup', { prompt: prompt.slice(0, 30) });
  }

  handleLieRateGuess(
    connId: string,
    targetId: string,
    guessedAnswer: 'yes' | 'no'
  ) {
    if (this.room.currentGame !== 'lie-rate' || this.room.phase !== 'guessing')
      return;

    const player = this.findPlayerByConnId(connId);
    if (!player) return;

    const roundData = this.room.roundData as any;
    if (!roundData.guesses) roundData.guesses = {};
    if (!roundData.guesses[player.id]) roundData.guesses[player.id] = [];

    // Add guess (only one guess per target per player)
    const existing = roundData.guesses[player.id].find(
      (g: any) => g.targetId === targetId
    );
    if (!existing) {
      roundData.guesses[player.id].push({ targetId, guessedAnswer });
    }

    this.room.roundData = roundData;
    this.broadcastSync();

    // Check if everyone has guessed
    const connectedPlayers = getConnectedPlayers(this.room);
    const allGuessed = connectedPlayers.every(
      (p) => roundData.guesses[p.id] && roundData.guesses[p.id].length > 0
    );

    if (allGuessed && connectedPlayers.length > 0) {
      this.scoreLieRate();
    }
  }

  scoreLieRate() {
    const roundData = this.room.roundData as any;
    if (!roundData) return;

    const answers = roundData.answers || {};
    const guesses = roundData.guesses || {};
    const connectedPlayers = getConnectedPlayers(this.room);

    const isFinalRound = this.room.round === this.room.maxRounds;
    const multiplier = isFinalRound ? 2 : 1;

    // Score each player
    for (const player of connectedPlayers) {
      const playerGuesses = guesses[player.id] || [];

      // +200 for each correct guess (Standardized)
      for (const guess of playerGuesses) {
        if (answers[guess.targetId] === guess.guessedAnswer) {
          player.score += 200 * multiplier;
        }
      }

      // +400 if nobody correctly guessed this player's answer (Masterclass)
      const guessedCorrectly = Object.values(guesses).some(
        (playerGuesses: any) =>
          playerGuesses.some(
            (g: any) =>
              g.targetId === player.id && g.guessedAnswer === answers[player.id]
          )
      );

      if (!guessedCorrectly) {
        player.score += 400 * multiplier;
        // Add to timeline
        if (!roundData.timeline) roundData.timeline = [];
        roundData.timeline.push({
          id: `${this.room.round}-stealth-${Date.now()}`,
          round: this.room.round,
          playerId: player.id,
          message: `${player.name} went undetected! Masterclass.`,
          type: 'perfect_bluff',
          timestamp: Date.now(),
        });
      }
    }

    this.room.roundData = roundData;
    this.showResults();
  }

  // Override handleSubmit for LieRate YES/NO phase
  handleLieRateSubmit(connId: string, answer: 'yes' | 'no') {
    if (this.room.currentGame !== 'lie-rate' || this.room.phase !== 'playing')
      return;

    const player = this.findPlayerByConnId(connId);
    if (!player) return;

    const roundData = this.room.roundData as any;
    if (!roundData.answers) roundData.answers = {};
    roundData.answers[player.id] = answer;

    this.room.roundData = roundData;
    this.broadcastSync();

    // Check if all submitted
    const connectedPlayers = getConnectedPlayers(this.room);
    const allSubmitted = connectedPlayers.every((p) => roundData.answers[p.id]);

    if (allSubmitted && connectedPlayers.length > 0) {
      // Move to guessing phase
      roundData.yesCount = Object.values(roundData.answers).filter(
        (a: any) => a === 'yes'
      ).length;
      roundData.noCount = Object.values(roundData.answers).filter(
        (a: any) => a === 'no'
      ).length;
      this.room.phase = 'guessing';
      this.room.roundData = roundData;
      this.broadcastSync();

      // Timeout for guessing
      setTimeout(() => {
        if (this.room.phase === 'guessing') {
          this.scoreLieRate();
        }
      }, 45000);
    }
  }

  // ============ TOKEN SYSTEM ============

  handleUseToken(
    connId: string,
    token: 'clutch' | 'sabotage' | 'shield',
    targetId?: string
  ) {
    const player = this.findPlayerByConnId(connId);
    if (!player) return;

    const roundData = this.room.roundData as any;
    if (!roundData?.tokens?.[player.id]) return;

    // Check if token available
    if (!roundData.tokens[player.id][token]) {
      log('Token not available', { playerId: player.id, token });
      return;
    }

    // Use the token
    roundData.tokens[player.id][token] = false;

    switch (token) {
      case 'clutch':
        // Double points this round
        player.score += 200; // Bonus
        break;
      case 'sabotage':
        // Target loses points
        if (targetId && this.room.players[targetId]) {
          this.room.players[targetId].score -= 100;
        }
        break;
      case 'shield':
        // Already handled in shotcaller choose
        break;
    }

    // Add to timeline
    if (!roundData.timeline) roundData.timeline = [];
    roundData.timeline.push({
      id: `${this.room.round}-token-${Date.now()}`,
      round: this.room.round,
      playerId: player.id,
      message: `${player.name} used ${token.toUpperCase()}!`,
      type: token,
      timestamp: Date.now(),
    });

    this.room.roundData = roundData;
    this.broadcast({
      type: 'token_used',
      playerId: player.id,
      token,
      targetId,
    });
    this.broadcastSync();
  }

  handleForceAdvance(connId: string) {
    const player = this.findPlayerByConnId(connId);
    if (!player || player.id !== this.room.hostId) return;

    log('Host forced advance', {
      game: this.room.currentGame,
      phase: this.room.phase,
    });

    if (this.room.currentGame === 'group-trial') {
      this.handleTrialNextPhase(connId);
      return;
    }

    if (this.room.currentGame === 'heist') {
      this.autoSubmitHeist();
      return;
    }

    // Fallback for other games
    this.handleNextRound();
  }

  // ---- RARE EVENTS ----
  triggerRandomRareEvent() {
    // 1% chance
    if (Math.random() < 0.01) {
      this.triggerTajFasFarted();
    }
  }

  triggerTajFasFarted() {
    log('EVENT TRIGGERED: TAJ FAS FARTED');
    this.broadcast({ type: 'taj-fas-farted' });
  }

  // ---- GROUP TRIAL HANDLERS ----

  setupGroupTrialRound() {
    this.room.phase = 'evidence';

    const players = getConnectedPlayers(this.room);
    // Rotate accused based on round
    const accusedIndex = (this.room.round - 1) % players.length;
    const accused = players[accusedIndex];
    if (!accused) return; // Should not happen

    const deck = this.customPrompts?.trials || TRIALS;
    const charge = deck[Math.floor(Math.random() * deck.length)];

    this.room.roundData = {
      accusedId: accused.id,
      charge,
      evidence: {},
      verdicts: {},
      evidencePhaseEnd: Date.now() + 60000, // 60s
    };

    this.broadcastSync();
  }

  handleTrialEvidence(connId: string, evidence: string) {
    const player = this.findPlayerByConnId(connId);
    if (!player) return;
    const playerId = player.id;
    if (this.room.phase !== 'evidence' || !this.room.roundData) return;
    if (playerId === this.room.roundData.accusedId) return;

    if (!this.room.roundData.evidence) this.room.roundData.evidence = {};
    this.room.roundData.evidence[playerId] = evidence;

    // Check if all submitted (except accused)
    const players = getConnectedPlayers(this.room);
    const evidenceCount = Object.keys(this.room.roundData.evidence).length;

    if (evidenceCount >= players.length - 1) {
      this.room.phase = 'defense';
      this.room.roundData.defensePhaseEnd = Date.now() + 45000;
      this.broadcastSync();
    } else {
      this.broadcastSync();
    }
  }

  handleTrialDefense(connId: string, defense: string) {
    const player = this.findPlayerByConnId(connId);
    if (!player) return;
    const playerId = player.id;
    if (this.room.phase !== 'defense' || !this.room.roundData) return;
    if (playerId !== this.room.roundData.accusedId) return;

    this.room.roundData.defense = defense;
    this.room.phase = 'voting';
    this.room.votes = {}; // Using roundData.verdicts mostly, but let's be safe
    this.room.roundData.verdicts = {};
    this.broadcastSync();
  }

  handleTrialVote(connId: string, verdict: 'guilty' | 'not-guilty') {
    const player = this.findPlayerByConnId(connId);
    if (!player) return;
    const playerId = player.id;
    if (this.room.phase !== 'voting' || !this.room.roundData) return;
    if (playerId === this.room.roundData.accusedId) return;

    if (!this.room.roundData.verdicts) this.room.roundData.verdicts = {};
    this.room.roundData.verdicts[playerId] = verdict;

    const players = getConnectedPlayers(this.room);
    const voteCount = Object.keys(this.room.roundData.verdicts).length;

    if (voteCount >= players.length - 1) {
      this.finishGroupTrialRound();
    } else {
      this.broadcastSync();
    }
  }

  finishGroupTrialRound() {
    if (!this.room.roundData) return;

    const verdicts = Object.values(this.room.roundData.verdicts || {});
    // Force type casting for safety if needed, but 'verdicts' is typed as 'guilty' | 'not-guilty'
    const guiltyCount = verdicts.filter((v: any) => v === 'guilty').length;
    const notGuiltyCount = verdicts.filter(
      (v: any) => v === 'not-guilty'
    ).length;

    const result = guiltyCount > notGuiltyCount ? 'GUILTY' : 'NOT GUILTY';

    this.room.roundData.eventMessage = result;
    this.room.phase = 'sentencing';

    // Update Score
    if (result === 'NOT GUILTY') {
      const accusedId = this.room.roundData.accusedId;
      if (accusedId && this.room.players[accusedId]) {
        this.room.players[accusedId].score += 50;
      }
    }

    this.broadcastSync();

    setTimeout(() => {
      if (this.room.round < (this.room.maxRounds || 8)) {
        // Need to manually reset phase or handleStartCountdown handles it?
        // startCountdown sets phase='countdown'.
        this.startCountdown();
      } else {
        this.room.phase = 'results';
        this.broadcastSync();
      }
    }, 10000);
  }

  handleTrialNextPhase(connId: string) {
    const player = this.findPlayerByConnId(connId);
    if (!player) return;
    const senderId = player.id;
    // Force advance logic for host
    if (this.room.hostId !== senderId) return;

    if (this.room.phase === 'evidence') {
      this.room.phase = 'defense';
      if (this.room.roundData)
        this.room.roundData.defensePhaseEnd = Date.now() + 45000;
    } else if (this.room.phase === 'defense') {
      this.room.phase = 'voting';
      if (this.room.roundData) this.room.roundData.verdicts = {};
    } else if (this.room.phase === 'voting') {
      this.finishGroupTrialRound();
      return;
    }
    this.broadcastSync();
  }

  autoSubmitGroupTrial() {
    if (!this.room.roundData) return;

    const players = getConnectedPlayers(this.room);
    const accusedId = this.room.roundData.accusedId;

    if (this.room.phase === 'evidence') {
      // Auto submit empty evidence for those missing
      let changed = false;
      if (!this.room.roundData.evidence) this.room.roundData.evidence = {};

      for (const p of players) {
        if (p.id !== accusedId && !this.room.roundData.evidence[p.id]) {
          this.room.roundData.evidence[p.id] = 'No evidence provided (Failed)';
          changed = true;
        }
      }
      if (changed) {
        // Advance
        this.room.phase = 'defense';
        this.room.roundData.defensePhaseEnd = Date.now() + 45000;
        this.broadcastSync();
      }
    } else if (this.room.phase === 'defense') {
      // Accused failed to defend
      if (!this.room.roundData.defense) {
        this.room.roundData.defense = 'Remaining silent...';
        this.room.phase = 'voting';
        this.room.roundData.verdicts = {};
        this.broadcastSync();
      }
    }
    // Voting autosubmit if needed (handled by startRound timeout mostly?)
    // Actually startRound timeout calls this. So if voting takes too long, we can force finish.
    else if (this.room.phase === 'voting') {
      // Finish round with current votes
      this.finishGroupTrialRound();
    }
  }
}
