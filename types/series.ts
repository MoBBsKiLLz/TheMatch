import { GameType } from './league';

export interface Series {
  id: number;
  name: string;
  description: string | null;
  gameType: GameType;
  startDate: number;
  endDate: number | null;
  status: 'active' | 'completed';
  createdAt: number;
}

export interface SeriesStanding {
  playerId: number;
  firstName: string;
  lastName: string;
  wins: number;
  losses: number;
  gamesPlayed: number;
  winPercentage: number;
}

export interface SeriesWithStats extends Series {
  matchCount: number;
  playerCount: number;
}
