import { Database } from './client';
import { insert, findById, update, remove } from './queries';
import { Series, SeriesStanding, SeriesWithStats } from '@/types/series';
import { MatchWithParticipants } from '@/types/match';
import { logger } from '@/lib/utils/logger';

export async function createSeries(
  db: Database,
  series: {
    name: string;
    description?: string;
    gameType: string;
    startDate: number;
    playerIds?: number[];
  }
): Promise<number> {
  const seriesId = await insert(db, 'series', {
    name: series.name,
    description: series.description ?? null,
    gameType: series.gameType,
    startDate: series.startDate,
    endDate: null,
    status: 'active',
    createdAt: Date.now(),
  });

  // Add players to series if provided
  if (series.playerIds && series.playerIds.length > 0) {
    for (const playerId of series.playerIds) {
      await addPlayerToSeries(db, seriesId, playerId);
    }
  }

  return seriesId;
}

export async function getAllSeries(db: Database): Promise<SeriesWithStats[]> {
  const query = `
    SELECT
      s.*,
      COUNT(DISTINCT m.id) as matchCount,
      COUNT(DISTINCT mp.playerId) as playerCount
    FROM series s
    LEFT JOIN matches m ON m.seriesId = s.id
    LEFT JOIN match_participants mp ON mp.matchId = m.id
    GROUP BY s.id
    ORDER BY s.startDate DESC
  `;

  return await db.all<SeriesWithStats>(query);
}

export async function getActiveSeries(db: Database): Promise<SeriesWithStats[]> {
  const query = `
    SELECT
      s.*,
      COUNT(DISTINCT m.id) as matchCount,
      COUNT(DISTINCT mp.playerId) as playerCount
    FROM series s
    LEFT JOIN matches m ON m.seriesId = s.id
    LEFT JOIN match_participants mp ON mp.matchId = m.id
    WHERE s.status = 'active'
    GROUP BY s.id
    ORDER BY s.startDate DESC
  `;

  return await db.all<SeriesWithStats>(query);
}

export async function getCompletedSeries(db: Database): Promise<SeriesWithStats[]> {
  const query = `
    SELECT
      s.*,
      COUNT(DISTINCT m.id) as matchCount,
      COUNT(DISTINCT mp.playerId) as playerCount
    FROM series s
    LEFT JOIN matches m ON m.seriesId = s.id
    LEFT JOIN match_participants mp ON mp.matchId = m.id
    WHERE s.status = 'completed'
    GROUP BY s.id
    ORDER BY s.endDate DESC
  `;

  return await db.all<SeriesWithStats>(query);
}

export async function getSeriesById(
  db: Database,
  seriesId: number
): Promise<Series | null> {
  return await findById<Series>(db, 'series', seriesId);
}

export async function updateSeries(
  db: Database,
  seriesId: number,
  updates: Partial<Omit<Series, 'id' | 'createdAt'>>
): Promise<void> {
  await update(db, 'series', seriesId, updates);
}

export async function completeSeries(
  db: Database,
  seriesId: number
): Promise<void> {
  await update(db, 'series', seriesId, {
    status: 'completed',
    endDate: Date.now(),
  });
}

export async function deleteSeries(
  db: Database,
  seriesId: number
): Promise<void> {
  // Remove seriesId from matches (don't delete matches)
  await db.run('UPDATE matches SET seriesId = NULL WHERE seriesId = ?', [seriesId]);
  await remove(db, 'series', seriesId);
}

export async function getSeriesStandings(
  db: Database,
  seriesId: number
): Promise<SeriesStanding[]> {
  const query = `
    SELECT
      p.id as playerId,
      p.firstName,
      p.lastName,
      COALESCE(SUM(CASE WHEN mp.isWinner = 1 THEN 1 ELSE 0 END), 0) as wins,
      COALESCE(SUM(CASE WHEN mp.isWinner = 0 THEN 1 ELSE 0 END), 0) as losses,
      COUNT(mp.id) as gamesPlayed
    FROM match_participants mp
    INNER JOIN matches m ON mp.matchId = m.id
    INNER JOIN players p ON mp.playerId = p.id
    WHERE m.seriesId = ? AND m.status = 'completed'
    GROUP BY p.id, p.firstName, p.lastName
    ORDER BY wins DESC, p.lastName ASC
  `;

  const results = await db.all<{
    playerId: number;
    firstName: string;
    lastName: string;
    wins: number;
    losses: number;
    gamesPlayed: number;
  }>(query, [seriesId]);

  return results.map(r => ({
    ...r,
    winPercentage: r.gamesPlayed > 0
      ? Math.round((r.wins / r.gamesPlayed) * 1000) / 10
      : 0,
  }));
}

export async function getSeriesMatches(
  db: Database,
  seriesId: number
): Promise<MatchWithParticipants[]> {
  const query = `
    SELECT
      m.*,
      NULL as leagueName,
      NULL as customGameName
    FROM matches m
    WHERE m.seriesId = ?
    ORDER BY m.date DESC, m.createdAt DESC
  `;

  const matches = await db.all<MatchWithParticipants>(query, [seriesId]);

  // Get participants for each match
  for (const match of matches) {
    const participants = await db.all<{
      id: number;
      matchId: number;
      playerId: number;
      seatIndex: number;
      score: number | null;
      finishPosition: number | null;
      isWinner: number;
      firstName: string;
      lastName: string;
    }>(
      `SELECT
        mp.*,
        p.firstName,
        p.lastName
      FROM match_participants mp
      INNER JOIN players p ON mp.playerId = p.id
      WHERE mp.matchId = ?
      ORDER BY mp.seatIndex`,
      [match.id]
    );

    match.participants = participants.map(p => ({
      ...p,
      isWinner: p.isWinner === 1,
    }));
  }

  return matches;
}

export async function addPlayerToSeries(
  db: Database,
  seriesId: number,
  playerId: number
): Promise<void> {
  await insert(db, 'series_players', {
    seriesId,
    playerId,
    addedAt: Date.now(),
  });
}

export async function removePlayerFromSeries(
  db: Database,
  seriesId: number,
  playerId: number
): Promise<void> {
  await db.run(
    'DELETE FROM series_players WHERE seriesId = ? AND playerId = ?',
    [seriesId, playerId]
  );
}

export async function getSeriesPlayers(
  db: Database,
  seriesId: number
): Promise<{ id: number; firstName: string; lastName: string }[]> {
  const query = `
    SELECT p.id, p.firstName, p.lastName
    FROM series_players sp
    INNER JOIN players p ON sp.playerId = p.id
    WHERE sp.seriesId = ?
    ORDER BY p.lastName ASC, p.firstName ASC
  `;

  return await db.all(query, [seriesId]);
}
