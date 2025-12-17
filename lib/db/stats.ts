import { Database } from './client';

export type PlayerStats = {
  playerId: number;
  leagueId: number;
  currentStreak: number; // Positive = win streak, negative = loss streak
  bestWinStreak: number;
  recentForm: ('W' | 'L')[];
};

export async function getPlayerStats(
  db: Database,
  playerId: number,
  leagueId: number
): Promise<PlayerStats> {
  // Get all matches for this player in this league, ordered by date
  const matches = await db.all<{
    id: number;
    date: number;
    isWinner: number;
  }>(
    `SELECT m.id, m.date, mp.isWinner
     FROM matches m
     INNER JOIN match_participants mp ON mp.matchId = m.id
     WHERE m.leagueId = ?
       AND mp.playerId = ?
       AND m.status = 'completed'
     ORDER BY m.date DESC, m.createdAt DESC`,
    [leagueId, playerId]
  );

  // Calculate results (W/L) from most recent to oldest
  const results: ('W' | 'L')[] = [];

  for (const match of matches) {
    if (match.isWinner === 1) {
      results.push('W');
    } else {
      results.push('L');
    }
  }

  // Recent form = last 5 results
  const recentForm = results.slice(0, 5);

  // Current streak
  let currentStreak = 0;
  if (results.length > 0) {
    const latestResult = results[0];
    let i = 0;

    while (i < results.length && results[i] === latestResult) {
      currentStreak++;
      i++;
    }

    // Make it negative for loss streaks
    if (latestResult === 'L') {
      currentStreak = -currentStreak;
    }
  }

  // Best win streak
  let bestWinStreak = 0;
  let tempStreak = 0;

  // Go through results in chronological order (oldest to newest)
  for (let i = results.length - 1; i >= 0; i--) {
    if (results[i] === 'W') {
      tempStreak++;
      if (tempStreak > bestWinStreak) {
        bestWinStreak = tempStreak;
      }
    } else {
      tempStreak = 0;
    }
  }

  return {
    playerId,
    leagueId,
    currentStreak,
    bestWinStreak,
    recentForm,
  };
}

export function formatStreak(streak: number): string {
  if (streak === 0) return 'No streak';

  const absStreak = Math.abs(streak);
  const type = streak > 0 ? 'W' : 'L';

  return `${type}${absStreak}`;
}

export function formatRecentForm(form: ('W' | 'L')[]): string {
  if (form.length === 0) return 'No matches';
  return form.join('-');
}
