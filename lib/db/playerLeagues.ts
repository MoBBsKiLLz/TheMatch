import { Database } from './client';
import { insert, remove } from './queries';
import { PlayerLeague } from '@/types/playerLeague';
import { LeaguePlayer } from '@/types/leaguePlayer';
import { getPlayerStats } from './matches';

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

  // Insert without wins/losses (calculated on-demand)
  await insert(db, 'player_leagues', {
    playerId,
    leagueId,
  });
}

export async function removePlayerFromLeague(
  db: Database,
  playerId: number,
  leagueId: number
): Promise<void> {
  // Find the record ID
  const record = await db.get<{ id: number }>(
    'SELECT id FROM player_leagues WHERE playerId = ? AND leagueId = ?',
    [playerId, leagueId]
  );

  if (record) {
    await remove(db, 'player_leagues', record.id);
  }
}

/**
 * Get all players in a league with calculated stats
 */
export async function getLeaguePlayers(
  db: Database,
  leagueId: number
): Promise<LeaguePlayer[]> {
  const players = await db.all<{
    id: number;
    firstName: string;
    lastName: string;
    playerLeagueId: number;
  }>(
    `SELECT
      p.id,
      p.firstName,
      p.lastName,
      pl.id as playerLeagueId
     FROM players p
     INNER JOIN player_leagues pl ON p.id = pl.playerId
     WHERE pl.leagueId = ?
     ORDER BY p.lastName ASC, p.firstName ASC`,
    [leagueId]
  );

  // Calculate stats for each player
  const playersWithStats: LeaguePlayer[] = [];
  for (const player of players) {
    const stats = await getPlayerStats(db, player.id, leagueId);
    playersWithStats.push({
      ...player,
      wins: stats.wins,
      losses: stats.losses,
      gamesPlayed: stats.gamesPlayed,
    });
  }

  return playersWithStats;
}

/**
 * Get all leagues for a player with calculated stats
 */
export async function getPlayerLeagues(
  db: Database,
  playerId: number
): Promise<
  Array<{
    id: number;
    name: string;
    location: string | null;
    color: string;
    wins: number;
    losses: number;
    gamesPlayed: number;
    playerLeagueId: number;
  }>
> {
  const leagues = await db.all<{
    id: number;
    name: string;
    location: string | null;
    color: string;
    playerLeagueId: number;
  }>(
    `SELECT
      l.id,
      l.name,
      l.location,
      l.color,
      pl.id as playerLeagueId
     FROM leagues l
     INNER JOIN player_leagues pl ON l.id = pl.leagueId
     WHERE pl.playerId = ?
     ORDER BY l.name ASC`,
    [playerId]
  );

  // Calculate stats for each league
  const leaguesWithStats = [];
  for (const league of leagues) {
    const stats = await getPlayerStats(db, playerId, league.id);
    leaguesWithStats.push({
      ...league,
      wins: stats.wins,
      losses: stats.losses,
      gamesPlayed: stats.gamesPlayed,
    });
  }

  return leaguesWithStats;
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
