export type TournamentFormat = 'best-of-3' | 'best-of-5';
export type TournamentStatus = 'active' | 'completed';
export type TournamentMatchStatus = 'pending' | 'in_progress' | 'completed';

export interface Tournament {
  id: number;
  seasonId: number;
  leagueId: number;
  name: string;
  format: TournamentFormat;
  status: TournamentStatus;
  championId: number | null;
  createdAt: number;
}

export interface TournamentMatch {
  id: number;
  tournamentId: number;
  round: number; // 1 = finals, 2 = semifinals, 3 = quarterfinals, etc.
  matchNumber: number; // Position within the round
  playerAId: number | null;
  playerBId: number | null;
  playerAWins: number;
  playerBWins: number;
  winnerId: number | null;
  nextMatchId: number | null; // Which match the winner advances to
  seriesFormat: TournamentFormat; // Best-of-3 or Best-of-5 for this specific match
  status: TournamentMatchStatus;
  createdAt: number;
}

export interface TournamentMatchWithDetails extends TournamentMatch {
  playerAFirstName: string | null;
  playerALastName: string | null;
  playerBFirstName: string | null;
  playerBLastName: string | null;
  winnerFirstName: string | null;
  winnerLastName: string | null;
}
