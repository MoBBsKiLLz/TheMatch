import { GameData } from './games';

export type Match = {
  id: number;
  date: number;
  playerAId: number;
  playerBId: number;
  winnerId: number | null;
  leagueId: number;
  seasonId?: number | null;
  weekNumber?: number | null;
  isMakeup?: number;
  gameVariant?: string | null;
  gameData?: string | null; // JSON string
  createdAt: number;
};

export type MatchWithDetails = Match & {
    playerAFirstName: string;
    playerALastName: string;
    playerBFirstName: string;
    playerBLastName: string;
    leagueName: string;
}

export type ParsedMatch = Match & {
  parsedGameData?: GameData;
};