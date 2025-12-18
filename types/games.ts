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

export type DartsX01GameData = {
  scores: number[];        // Indexed by seatIndex (0-3)
  startingScore: number;
  finalCheckout?: number;
};

export type DartsCricketGameData = {
  points: number[];        // Indexed by seatIndex (0-3)
  cricketType: DartsCricketType;
};

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

// Union type for all game data
export type GameData = PoolGameData | DartsGameData | DominosGameData | UnoGameData | CustomGameData;
