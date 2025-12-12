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
  createdAt: number;
};

export type MatchWithDetails = Match & {
    playerAFirstName: string;
    playerALastName: string;
    playerBFirstName: string;
    playerBLastName: string;
    leagueName: string;
}