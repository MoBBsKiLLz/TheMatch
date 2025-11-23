import { Database } from './client';
import { insert, remove, findById } from './queries';
import { Match, MatchWithDetails } from '@/types/match';

export async function createMatch(
  db: Database,
  match: {
    date: number;
    playerAId: number;
    playerBId: number;
    winnerId: number | null;
    leagueId: number;
  }
): Promise<number> {
  // Use the insert helper
  const matchId = await insert(db, 'matches', {
    date: match.date,
    playerAId: match.playerAId,
    playerBId: match.playerBId,
    winnerId: match.winnerId,
    leagueId: match.leagueId,
    createdAt: Date.now(),
  });

  // Update win/loss records if there's a winner
  if (match.winnerId) {
    const loserId = match.winnerId === match.playerAId ? match.playerBId : match.playerAId;

    // Update winner's wins
    await db.run(
      `UPDATE player_leagues 
       SET wins = wins + 1 
       WHERE playerId = ? AND leagueId = ?`,
      [match.winnerId, match.leagueId]
    );

    // Update loser's losses
    await db.run(
      `UPDATE player_leagues 
       SET losses = losses + 1 
       WHERE playerId = ? AND leagueId = ?`,
      [loserId, match.leagueId]
    );
  }

  return matchId;
}

export async function deleteMatch(db: Database, matchId: number): Promise<void> {
  // Get match details using findById helper
  const match = await findById<Match>(db, 'matches', matchId);

  if (!match) return;

  // Rollback stats if there was a winner
  if (match.winnerId) {
    const loserId = match.winnerId === match.playerAId ? match.playerBId : match.playerAId;

    // Decrease winner's wins
    await db.run(
      `UPDATE player_leagues 
       SET wins = wins - 1 
       WHERE playerId = ? AND leagueId = ? AND wins > 0`,
      [match.winnerId, match.leagueId]
    );

    // Decrease loser's losses
    await db.run(
      `UPDATE player_leagues 
       SET losses = losses - 1 
       WHERE playerId = ? AND leagueId = ? AND losses > 0`,
      [loserId, match.leagueId]
    );
  }

  // Use the remove helper
  await remove(db, 'matches', matchId);
}

export async function getMatchesWithDetails(
  db: Database,
  leagueId?: number
): Promise<MatchWithDetails[]> {
  const query = `
    SELECT 
      m.*,
      pA.firstName as playerAFirstName,
      pA.lastName as playerALastName,
      pB.firstName as playerBFirstName,
      pB.lastName as playerBLastName,
      l.name as leagueName
    FROM matches m
    INNER JOIN players pA ON m.playerAId = pA.id
    INNER JOIN players pB ON m.playerBId = pB.id
    INNER JOIN leagues l ON m.leagueId = l.id
    ${leagueId ? 'WHERE m.leagueId = ?' : ''}
    ORDER BY m.date DESC, m.createdAt DESC
  `;

  const params = leagueId ? [leagueId] : [];
  return await db.all<MatchWithDetails>(query, params);
}

export async function getPlayerMatches(
  db: Database,
  playerId: number
): Promise<MatchWithDetails[]> {
  return await db.all<MatchWithDetails>(
    `SELECT 
      m.*,
      pA.firstName as playerAFirstName,
      pA.lastName as playerALastName,
      pB.firstName as playerBFirstName,
      pB.lastName as playerBLastName,
      l.name as leagueName
    FROM matches m
    INNER JOIN players pA ON m.playerAId = pA.id
    INNER JOIN players pB ON m.playerBId = pB.id
    INNER JOIN leagues l ON m.leagueId = l.id
    WHERE m.playerAId = ? OR m.playerBId = ?
    ORDER BY m.date DESC, m.createdAt DESC`,
    [playerId, playerId]
  );
}