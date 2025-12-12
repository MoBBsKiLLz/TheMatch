import { GameType } from '@/types/league';
import { GameData } from '@/types/games';
import { ParsedMatch } from '@/types/match';

export interface GameConfig {
  type: GameType;
  name: string;
  variants: string[];

  // Validation
  validateMatchData: (data: any) => boolean;

  // Scoring logic
  determineWinner: (
    gameData: GameData,
    playerAId: number,
    playerBId: number
  ) => number | null;

  // Stats calculation (optional)
  calculateStats?: (matches: ParsedMatch[], playerId: number) => Record<string, any>;

  // UI metadata
  getMatchDisplayText: (gameData: GameData) => string;
  getVariantDisplayName: (variant: string) => string;
}

export interface GameRegistry {
  [key: string]: GameConfig;
}
