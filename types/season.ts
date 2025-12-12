export type Season = {
  id: number;
  leagueId: number;
  name: string;
  startDate: number;
  weeksDuration: number;
  currentWeek: number;
  status: 'planning' | 'active' | 'tournament' | 'completed';
  createdAt: number;
};

export type WeekAttendance = {
  id: number;
  seasonId: number;
  weekNumber: number;
  playerId: number;
  attended: number; // 1 or 0 (boolean)
};

export type OwedMatch = {
  playerId: number;
  playerName: string;
  opponentId: number;
  opponentName: string;
  weekNumber: number;
};