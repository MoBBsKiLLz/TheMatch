export type LeagueFormat = 'round-robin' | 'swiss' | 'ladder' | 'custom';

export type GameType = 'pool' | 'darts' | 'dominos' | 'uno' | 'custom';

export type League = {
  id: number;
  name: string;
  location: string | null;
  color: string;
  format: LeagueFormat;
  defaultDuration: number; // Default weeks for new seasons
  gameType: GameType;
  customGameConfigId?: number; // Only present when gameType is 'custom'
  createdAt: number;
};