import { GameData } from './games';
import { GameType } from './league';

// Core match type (event container)
export type Match = {
  id: number;
  gameType: GameType;           // First-class field!
  leagueId: number | null;      // Nullable to support standalone matches
  seasonId?: number | null;
  weekNumber?: number | null;
  isMakeup?: number | null;     // 0 or 1, for makeup matches
  date: number;
  status: 'in_progress' | 'completed';
  gameVariant?: string | null;
  gameData?: string | null;     // JSON string
  createdAt: number;
};

// Participant in a match (source of truth for results)
export type MatchParticipant = {
  id: number;
  matchId: number;
  playerId: number;
  seatIndex: number;            // 0-3 for ordering
  score: number | null;         // nullable, game-dependent
  finishPosition: number | null; // 1-4 for ranked outcomes
  isWinner: boolean;
};

// Match with participant details (for display)
export type MatchWithParticipants = Match & {
  participants: (MatchParticipant & {
    firstName: string;
    lastName: string;
  })[];
  leagueName?: string;
};

// Alias for backward compatibility
export type MatchWithDetails = MatchWithParticipants;

export type ParsedMatch = Match & {
  parsedGameData?: GameData;
};