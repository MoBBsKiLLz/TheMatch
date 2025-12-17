// Display type with calculated stats
export type LeaguePlayer = {
  id: number;
  firstName: string;
  lastName: string;
  wins: number;             // Calculated from match_participants
  losses: number;           // Calculated from match_participants
  gamesPlayed: number;      // Total matches participated in
  playerLeagueId: number;
};