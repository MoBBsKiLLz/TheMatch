import { Database } from './client';
import { PlayerLeague } from '@/types/playerLeague';

export async function addPlayerToLeague(
  db: Database,
  playerId: number,
  leagueId: number
): Promise<void> {
  // Check if already exists
  const existing = await db.get<PlayerLeague>(
    'SELECT * FROM player_leagues WHERE playerId = ? AND leagueId = ?',
    [playerId, leagueId]
  );

  if (existing) {
    return; // Already enrolled
  }

  await db.run(
    `INSERT INTO player_leagues (playerId, leagueId, wins, losses)
     VALUES (?, ?, 0, 0)`,
    [playerId, leagueId]
  );
}

export async function removePlayerFromLeague(
  db: Database,
  playerId: number,
  leagueId: number
): Promise<void> {
  await db.run(
    'DELETE FROM player_leagues WHERE playerId = ? AND leagueId = ?',
    [playerId, leagueId]
  );
}

export async function getLeaguePlayers(db: Database, leagueId: number) {
  return await db.all<{
    id: number;
    firstName: string;
    lastName: string;
    wins: number;
    losses: number;
    playerLeagueId: number;
  }>(
    `SELECT 
      p.id,
      p.firstName,
      p.lastName,
      pl.wins,
      pl.losses,
      pl.id as playerLeagueId
     FROM players p
     INNER JOIN player_leagues pl ON p.id = pl.playerId
     WHERE pl.leagueId = ?
     ORDER BY p.lastName ASC, p.firstName ASC`,
    [leagueId]
  );
}

export async function getPlayerLeagues(db: Database, playerId: number) {
  return await db.all<{
    id: number;
    name: string;
    season: string | null;
    location: string | null;
    wins: number;
    losses: number;
    playerLeagueId: number;
  }>(
    `SELECT 
      l.id,
      l.name,
      l.season,
      l.location,
      pl.wins,
      pl.losses,
      pl.id as playerLeagueId
     FROM leagues l
     INNER JOIN player_leagues pl ON l.id = pl.leagueId
     WHERE pl.playerId = ?
     ORDER BY l.name ASC`,
    [playerId]
  );
}

export async function isPlayerInLeague(
  db: Database,
  playerId: number,
  leagueId: number
): Promise<boolean> {
  const result = await db.get<{ count: number }>(
    'SELECT COUNT(*) as count FROM player_leagues WHERE playerId = ? AND leagueId = ?',
    [playerId, leagueId]
  );
  return (result?.count ?? 0) > 0;
}