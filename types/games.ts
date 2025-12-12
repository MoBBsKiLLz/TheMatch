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
  playerAScore: number;
  playerBScore: number;
  startingScore: number;
  finalCheckout?: number;
};

export type DartsCricketGameData = {
  playerAPoints: number;
  playerBPoints: number;
  cricketType: DartsCricketType;
};

export type DartsGameData = DartsX01GameData | DartsCricketGameData;

// Dominos types
export type DominoGame = {
  playerAScore: number;
  playerBScore: number;
  winnerId: number;
};

export type DominosGameData = {
  games: DominoGame[];
  finalScore: {
    playerA: number;
    playerB: number;
  };
  targetScore: number;
};

// Union type for all game data
export type GameData = PoolGameData | DartsGameData | DominosGameData;
