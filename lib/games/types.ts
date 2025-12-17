import { GameType } from '@/types/league';
import { GameData } from '@/types/games';
import { MatchParticipant } from '@/types/match';
import { CreateMatchParticipant } from '@/lib/db/matches';

export interface GameConfig {
  type: GameType;
  name: string;
  minPlayers: number;           // NEW: Minimum participants (e.g., 2 for pool)
  maxPlayers: number;           // NEW: Maximum participants (e.g., 4 for dominos)
  variants: string[];

  // Validation
  validateMatchData: (data: any) => boolean;
  validateParticipants: (participants: CreateMatchParticipant[]) => boolean;

  // Scoring logic - returns array of winner playerIds
  determineWinners: (participants: MatchParticipant[]) => number[];

  // UI metadata
  getMatchDisplayText: (participants: MatchParticipant[]) => string;
  getVariantDisplayName: (variant: string) => string;
}

export interface GameRegistry {
  [key: string]: GameConfig;
}
