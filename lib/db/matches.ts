import { Database } from './client';
import { logger } from "@/lib/utils/logger";
import { insert, remove, findById, update } from './queries';
import { Match, MatchParticipant, MatchWithParticipants } from '@/types/match';
import { GameData } from '@/types/games';
import { GameType } from '@/types/league';
import { getGameConfig } from '@/lib/games';

// Type for creating a participant
export type CreateMatchParticipant = {
  playerId: number;
  seatIndex: number;
  score?: number | null;
  finishPosition?: number | null;
  isWinner?: boolean;
};

/**
 * Create a match with N participants (2-4 players)
 * leagueId is optional to support standalone matches
 */
export async function createMatch(
  db: Database,
  match: {
    gameType: GameType;
    leagueId?: number;
    seasonId?: number;
    weekNumber?: number;
    date: number;
    status?: 'completed' | 'in_progress';
    gameVariant?: string;
    gameData?: GameData;
    participants: CreateMatchParticipant[];
  }
): Promise<number> {
  // Validate participant count against game rules
  const config = getGameConfig(match.gameType);
  if (
    match.participants.length < config.minPlayers ||
    match.participants.length > config.maxPlayers
  ) {
    throw new Error(
      `${match.gameType} requires ${config.minPlayers}-${config.maxPlayers} players`
    );
  }

  // Validate unique players
  const playerIds = match.participants.map((p) => p.playerId);
  const uniquePlayerIds = new Set(playerIds);
  if (playerIds.length !== uniquePlayerIds.size) {
    throw new Error('All participants must be different players');
  }

  // Use transaction to ensure match and participants are inserted atomically
  let matchId: number = 0;
  await db.transaction(async (txDb) => {
    // Insert match
    matchId = await insert(txDb, 'matches', {
      gameType: match.gameType,
      leagueId: match.leagueId ?? null,
      seasonId: match.seasonId ?? null,
      weekNumber: match.weekNumber ?? null,
      date: match.date,
      status: match.status ?? 'completed',
      gameVariant: match.gameVariant ?? null,
      gameData: match.gameData ? JSON.stringify(match.gameData) : null,
      createdAt: Date.now(),
    });

    // Insert participants
    for (const participant of match.participants) {
      await insert(txDb, 'match_participants', {
        matchId,
        playerId: participant.playerId,
        seatIndex: participant.seatIndex,
        score: participant.score ?? null,
        finishPosition: participant.finishPosition ?? null,
        isWinner: participant.isWinner ? 1 : 0,
      });
    }
  });

  return matchId;
}

/**
 * Update an existing match
 */
export async function updateMatch(
  db: Database,
  matchId: number,
  updates: {
    date?: number;
    gameVariant?: string;
    gameData?: GameData;
    participants?: CreateMatchParticipant[];
  }
): Promise<void> {
  const existingMatch = await findById<Match>(db, 'matches', matchId);
  if (!existingMatch) {
    throw new Error('Match not found');
  }

  // Use transaction to ensure match and participants are updated atomically
  await db.transaction(async (txDb) => {
    // Update match fields
    const fieldsToUpdate: Record<string, any> = {};
    if (updates.date !== undefined) fieldsToUpdate.date = updates.date;
    if (updates.gameVariant !== undefined) fieldsToUpdate.gameVariant = updates.gameVariant;
    if (updates.gameData !== undefined) {
      fieldsToUpdate.gameData = updates.gameData ? JSON.stringify(updates.gameData) : null;
    }

    if (Object.keys(fieldsToUpdate).length > 0) {
      await update(txDb, 'matches', matchId, fieldsToUpdate);
    }

    // Update participants if provided
    if (updates.participants) {
      // Delete existing participants
      await txDb.run('DELETE FROM match_participants WHERE matchId = ?', [matchId]);

      // Insert new participants
      for (const participant of updates.participants) {
        await insert(txDb, 'match_participants', {
          matchId,
          playerId: participant.playerId,
          seatIndex: participant.seatIndex,
          score: participant.score ?? null,
          finishPosition: participant.finishPosition ?? null,
          isWinner: participant.isWinner ? 1 : 0,
        });
      }
    }
  });
}

/**
 * Delete a match and its participants (CASCADE handles participants)
 */
export async function deleteMatch(db: Database, matchId: number): Promise<void> {
  await remove(db, 'matches', matchId);
}

/**
 * Get matches with participant details
 */
export async function getMatchesWithParticipants(
  db: Database,
  leagueId?: number,
  seasonId?: number
): Promise<MatchWithParticipants[]> {
  const whereClauses = [];
  const params: number[] = [];

  if (leagueId) {
    whereClauses.push('m.leagueId = ?');
    params.push(leagueId);
  }

  if (seasonId) {
    whereClauses.push('m.seasonId = ?');
    params.push(seasonId);
  }

  const whereClause =
    whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  // Get matches with league name and custom game name (LEFT JOIN to include standalone matches)
  const matchQuery = `
    SELECT m.*, l.name as leagueName, cgc.name as customGameName
    FROM matches m
    LEFT JOIN leagues l ON m.leagueId = l.id
    LEFT JOIN custom_game_configs cgc ON l.customGameConfigId = cgc.id
    ${whereClause}
    ORDER BY m.date DESC, m.createdAt DESC
  `;
  const matches = await db.all<Match & { leagueName: string | null; customGameName: string | null }>(matchQuery, params);

  // Get participants for all matches
  const matchesWithParticipants: MatchWithParticipants[] = [];

  for (const match of matches) {
    // Database returns isWinner as 0 or 1, need to convert to boolean
    type ParticipantFromDb = Omit<MatchParticipant, 'isWinner'> & {
      isWinner: number;
      firstName: string;
      lastName: string;
    };

    const participants = await db.all<ParticipantFromDb>(
      `
      SELECT
        mp.*,
        p.firstName,
        p.lastName
      FROM match_participants mp
      INNER JOIN players p ON mp.playerId = p.id
      WHERE mp.matchId = ?
      ORDER BY mp.seatIndex ASC
    `,
      [match.id]
    );

    // Convert isWinner from integer to boolean
    const participantsWithBoolean = participants.map((p) => ({
      ...p,
      isWinner: p.isWinner === 1,
    }));

    // For standalone custom game matches, fetch custom game name from gameData
    let customGameName = match.customGameName;
    if (match.gameType === 'custom' && !customGameName && match.gameData) {
      try {
        const parsedGameData = JSON.parse(match.gameData);
        if (parsedGameData.configId) {
          const customGameConfig = await db.get<{ name: string }>(
            'SELECT name FROM custom_game_configs WHERE id = ?',
            [parsedGameData.configId]
          );
          customGameName = customGameConfig?.name || null;
        }
      } catch (error) {
        logger.error('Failed to parse gameData for custom game:', error);
      }
    }

    const { leagueName, ...matchData } = match;
    matchesWithParticipants.push({
      ...matchData,
      participants: participantsWithBoolean,
      leagueName: leagueName ?? undefined,
      customGameName: customGameName ?? undefined,
    });
  }

  return matchesWithParticipants;
}

// Alias for backward compatibility
export const getMatchesWithDetails = getMatchesWithParticipants;

/**
 * Get all matches for a specific player
 */
export async function getPlayerMatches(
  db: Database,
  playerId: number
): Promise<MatchWithParticipants[]> {
  // Get matches where player participated
  const matches = await db.all<Match>(
    `
    SELECT DISTINCT m.*
    FROM matches m
    INNER JOIN match_participants mp ON m.id = mp.matchId
    WHERE mp.playerId = ?
    ORDER BY m.date DESC, m.createdAt DESC
  `,
    [playerId]
  );

  // Get participants for each match
  const matchesWithParticipants: MatchWithParticipants[] = [];

  for (const match of matches) {
    // Database returns isWinner as 0 or 1, need to convert to boolean
    type ParticipantFromDb = Omit<MatchParticipant, 'isWinner'> & {
      isWinner: number;
      firstName: string;
      lastName: string;
    };

    const participants = await db.all<ParticipantFromDb>(
      `
      SELECT
        mp.*,
        p.firstName,
        p.lastName
      FROM match_participants mp
      INNER JOIN players p ON mp.playerId = p.id
      WHERE mp.matchId = ?
      ORDER BY mp.seatIndex ASC
    `,
      [match.id]
    );

    const participantsWithBoolean = participants.map((p) => ({
      ...p,
      isWinner: p.isWinner === 1,
    }));

    matchesWithParticipants.push({
      ...match,
      participants: participantsWithBoolean,
    });
  }

  return matchesWithParticipants;
}

/**
 * Calculate player stats for a league (source of truth)
 */
export async function getPlayerStats(
  db: Database,
  playerId: number,
  leagueId: number
): Promise<{ wins: number; losses: number; gamesPlayed: number }> {
  const result = await db.get<{
    wins: number;
    losses: number;
    total: number;
  }>(
    `SELECT
      SUM(CASE WHEN mp.isWinner = 1 THEN 1 ELSE 0 END) as wins,
      SUM(CASE WHEN mp.isWinner = 0 THEN 1 ELSE 0 END) as losses,
      COUNT(*) as total
     FROM match_participants mp
     INNER JOIN matches m ON mp.matchId = m.id
     WHERE mp.playerId = ? AND m.leagueId = ? AND m.status = 'completed'`,
    [playerId, leagueId]
  );

  return {
    wins: result?.wins || 0,
    losses: result?.losses || 0,
    gamesPlayed: result?.total || 0,
  };
}
