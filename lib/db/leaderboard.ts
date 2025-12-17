import { Database } from './client';

export type LeaderboardEntry = {
  playerId: number;
  firstName: string;
  lastName: string;
  wins: number;
  losses: number;
  gamesPlayed: number;
  winPercentage: number;
  rank: number;
};

export type HeadToHeadRecord = {
  playerId: number;
  opponentId: number;
  wins: number;
  losses: number;
};

export async function getLeagueLeaderboard(
  db: Database,
  leagueId: number,
  seasonId?: number
): Promise<LeaderboardEntry[]> {
  let players;

  if (seasonId) {
    // Season-specific standings: calculate from match_participants in this season
    players = await db.all<{
      playerId: number;
      firstName: string;
      lastName: string;
      wins: number;
      losses: number;
    }>(
      `SELECT
        p.id as playerId,
        p.firstName,
        p.lastName,
        COALESCE(SUM(CASE WHEN mp.isWinner = 1 THEN 1 ELSE 0 END), 0) as wins,
        COALESCE(SUM(CASE WHEN mp.isWinner = 0 THEN 1 ELSE 0 END), 0) as losses
      FROM player_leagues pl
      INNER JOIN players p ON pl.playerId = p.id
      LEFT JOIN matches m ON m.leagueId = pl.leagueId AND m.seasonId = ?
      LEFT JOIN match_participants mp ON mp.matchId = m.id AND mp.playerId = p.id
      WHERE pl.leagueId = ? AND m.status = 'completed'
      GROUP BY p.id, p.firstName, p.lastName
      ORDER BY wins DESC, p.lastName ASC`,
      [seasonId, leagueId]
    );
  } else {
    // League-wide standings: calculate from all match_participants
    players = await db.all<{
      playerId: number;
      firstName: string;
      lastName: string;
      wins: number;
      losses: number;
    }>(
      `SELECT
        p.id as playerId,
        p.firstName,
        p.lastName,
        COALESCE(SUM(CASE WHEN mp.isWinner = 1 THEN 1 ELSE 0 END), 0) as wins,
        COALESCE(SUM(CASE WHEN mp.isWinner = 0 THEN 1 ELSE 0 END), 0) as losses
      FROM player_leagues pl
      INNER JOIN players p ON pl.playerId = p.id
      LEFT JOIN matches m ON m.leagueId = pl.leagueId
      LEFT JOIN match_participants mp ON mp.matchId = m.id AND mp.playerId = p.id
      WHERE pl.leagueId = ? AND (m.status = 'completed' OR m.status IS NULL)
      GROUP BY p.id, p.firstName, p.lastName
      ORDER BY wins DESC, p.lastName ASC`,
      [leagueId]
    );
  }

  // Calculate stats and assign ranks
  let currentRank = 1;
  let previousWins = -1;
  let playersWithSameWins = 0;

  const leaderboard: LeaderboardEntry[] = players.map((player, index) => {
    const gamesPlayed = player.wins + player.losses;
    const winPercentage = gamesPlayed > 0 ? (player.wins / gamesPlayed) * 100 : 0;

    // Handle tie rankings
    if (player.wins === previousWins) {
      playersWithSameWins++;
    } else {
      currentRank = index + 1;
      playersWithSameWins = 0;
    }

    previousWins = player.wins;

    return {
      playerId: player.playerId,
      firstName: player.firstName,
      lastName: player.lastName,
      wins: player.wins,
      losses: player.losses,
      gamesPlayed,
      winPercentage: Math.round(winPercentage * 10) / 10, // Round to 1 decimal
      rank: currentRank,
    };
  });

  return leaderboard;
}

export async function getHeadToHeadRecord(
  db: Database,
  playerId: number,
  opponentId: number,
  leagueId: number,
  seasonId?: number
): Promise<HeadToHeadRecord> {
  // Get all matches between these two players in this league (optionally filtered by season)
  // A match includes both players if both have participant records
  let query = `
    SELECT m.id, mp.playerId, mp.isWinner
    FROM matches m
    INNER JOIN match_participants mp ON mp.matchId = m.id
    WHERE m.leagueId = ?
      AND m.status = 'completed'
      AND mp.playerId IN (?, ?)
      AND EXISTS (
        SELECT 1 FROM match_participants mp2
        WHERE mp2.matchId = m.id AND mp2.playerId = ?
      )
      AND EXISTS (
        SELECT 1 FROM match_participants mp3
        WHERE mp3.matchId = m.id AND mp3.playerId = ?
      )`;

  const params: any[] = [leagueId, playerId, opponentId, playerId, opponentId];

  if (seasonId) {
    query += ` AND m.seasonId = ?`;
    params.push(seasonId);
  }

  const results = await db.all<{
    id: number;
    playerId: number;
    isWinner: number;
  }>(query, params);

  let wins = 0;
  let losses = 0;

  results.forEach((result) => {
    if (result.playerId === playerId) {
      if (result.isWinner === 1) {
        wins++;
      } else {
        losses++;
      }
    }
  });

  return {
    playerId,
    opponentId,
    wins,
    losses,
  };
}

export async function resolveLeaderboardTies(
  db: Database,
  leagueId: number,
  leaderboard: LeaderboardEntry[],
  seasonId?: number
): Promise<LeaderboardEntry[]> {
  // Group players by wins
  const winGroups = new Map<number, LeaderboardEntry[]>();

  leaderboard.forEach((entry) => {
    const group = winGroups.get(entry.wins) || [];
    group.push(entry);
    winGroups.set(entry.wins, group);
  });

  // Resolve ties within each group using head-to-head
  const resolvedLeaderboard: LeaderboardEntry[] = [];
  let currentRank = 1;

  for (const [wins, group] of Array.from(winGroups.entries()).sort((a, b) => b[0] - a[0])) {
    if (group.length === 1) {
      // No tie
      resolvedLeaderboard.push({ ...group[0], rank: currentRank });
      currentRank++;
    } else {
      // Tie - use head-to-head
      const sortedGroup = await sortByHeadToHead(db, leagueId, group, seasonId);
      sortedGroup.forEach((entry) => {
        resolvedLeaderboard.push({ ...entry, rank: currentRank });
      });
      currentRank += group.length;
    }
  }

  return resolvedLeaderboard;
}

async function sortByHeadToHead(
  db: Database,
  leagueId: number,
  players: LeaderboardEntry[],
  seasonId?: number
): Promise<LeaderboardEntry[]> {
  // Calculate head-to-head win percentage for each player against others in the group
  const h2hScores = await Promise.all(
    players.map(async (player) => {
      let totalWins = 0;
      let totalGames = 0;

      for (const opponent of players) {
        if (player.playerId === opponent.playerId) continue;

        const h2h = await getHeadToHeadRecord(
          db,
          player.playerId,
          opponent.playerId,
          leagueId,
          seasonId
        );

        totalWins += h2h.wins;
        totalGames += h2h.wins + h2h.losses;
      }

      const h2hWinPct = totalGames > 0 ? totalWins / totalGames : 0;

      return {
        ...player,
        h2hWinPct,
      };
    })
  );

  // Sort by head-to-head win percentage, then by name
  return h2hScores.sort((a, b) => {
    if (b.h2hWinPct !== a.h2hWinPct) {
      return b.h2hWinPct - a.h2hWinPct;
    }
    return `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`);
  });
}
