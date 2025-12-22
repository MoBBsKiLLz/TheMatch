// Pool types
export type PoolVariant = '8-ball' | '9-ball';

export type PoolWinMethod =
  | 'made_all_balls'
  | 'opponent_fouled_8ball'
  | 'opponent_scratched_8ball'
  | 'opponent_scratched'
  | 'other_foul';

export type PoolGameData = {
  winMethod: PoolWinMethod;
};

// Darts types
export type DartsX01Variant = '901' | '701' | '501' | '401' | '301';
export type DartsCricketType = 'standard' | 'cut-throat';

// Cricket Enhanced Types
export type CricketNumber = 20 | 19 | 18 | 17 | 16 | 15 | 'bull';

export type CricketHits = {
  [key in CricketNumber]: number; // 0-3+ hits
};

export type CricketPlayerState = {
  hits: CricketHits;
  score: number;
  openNumbers: CricketNumber[];
};

export type CricketRound = {
  playerIndex: number;
  targetNumber: CricketNumber;
  hitCount: number; // 1, 2, or 3
  pointsScored: number;
  timestamp: number;
};

// Cricket Game Data (Enhanced)
export type DartsCricketGameDataEnhanced = {
  cricketType: DartsCricketType;
  trackingMode: 'live' | 'final_only';
  rounds?: CricketRound[];
  playerStates?: CricketPlayerState[];
  points: number[]; // Final scores indexed by seatIndex
};

// Cricket Game Data (Legacy)
export type DartsCricketGameDataLegacy = {
  points: number[];
  cricketType: DartsCricketType;
};

// X01 Enhanced Types
export type X01Round = {
  playerIndex: number;
  score: number;
  remainingScore: number;
  darts: number[]; // Up to 3 individual darts
  isCheckout: boolean;
  isBust?: boolean; // True if player scored more than remaining (turn ends, score unchanged)
  timestamp: number;
};

// X01 Game Data (Enhanced)
export type DartsX01GameDataEnhanced = {
  startingScore: number;
  trackingMode: 'live' | 'final_only';
  rounds?: X01Round[];
  currentScores?: number[];
  scores: number[]; // Final remaining scores
  finalCheckout?: number;
};

// X01 Game Data (Legacy)
export type DartsX01GameDataLegacy = {
  scores: number[];
  startingScore: number;
  finalCheckout?: number;
};

// Union types for backward compatibility
export type DartsCricketGameData =
  | DartsCricketGameDataEnhanced
  | DartsCricketGameDataLegacy;

export type DartsX01GameData =
  | DartsX01GameDataEnhanced
  | DartsX01GameDataLegacy;

export type DartsGameData = DartsX01GameData | DartsCricketGameData;

// Dominos types
export type DominoGame = {
  scores: number[];        // Points earned in this game (indexed by seatIndex)
  pips?: number[];         // Domino pips held by losing players (optional, indexed by seatIndex)
  winnerId: number;        // playerId of winner
};

export type DominosGameData = {
  games: DominoGame[];
  finalScores: number[];   // Indexed by seatIndex (0-3)
  targetScore: number;
};

// Uno types (similar structure to Dominos)
export type UnoGame = {
  scores: number[];        // Points scored by winner from remaining cards (indexed by seatIndex)
  winnerId: number;        // playerId of winner (player who went out)
};

export type UnoGameData = {
  games: UnoGame[];
  finalScores: number[];   // Indexed by seatIndex (0-3)
  targetScore: number;
};

// Import custom game types
import { CustomGameData } from './customGame';

export type BaseGameData = {
  playerScores: Record<number, number>; // Maps playerId to score
};

// Use Intersection to add playerScores to every game type
export type GameData = (PoolGameData | DartsGameData | DominosGameData | UnoGameData | CustomGameData) & BaseGameData;