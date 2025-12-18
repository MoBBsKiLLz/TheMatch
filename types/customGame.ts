export type ScoringMethod = 'points' | 'games_won' | 'rounds';

export type WinCondition = 'target_score' | 'best_of_games' | 'most_points';

export interface CustomGameConfig {
  id: number;
  name: string;
  description?: string;
  scoringMethod: ScoringMethod;
  winCondition: WinCondition;
  targetValue: number;          // e.g., 500 points, 7 games, 10 rounds
  minPlayers: number;            // 2-10
  maxPlayers: number;            // 2-10
  trackIndividualGames: boolean; // If true, like Dominos/Uno multi-game structure
  allowNegativeScores: boolean;  // Allow scores to go negative
  pointsPerWin?: number;         // Optional: fixed points awarded per game win
  createdAt: number;
}

// Game data for a single game in a custom match
export type CustomGame = {
  scores: number[];    // Points/wins for each player in this game
  winnerId?: number;   // Optional: playerId of winner (if trackIndividualGames)
};

// Match data for custom games
export type CustomGameData = {
  games: CustomGame[];       // Array of games played
  finalScores: number[];     // Running totals indexed by seatIndex
  configId: number;          // Reference to CustomGameConfig
};
