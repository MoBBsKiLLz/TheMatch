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
    // Season-specific standings: calculate from matches in this season
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
        COALESCE(SUM(CASE WHEN m.winnerId = p.id THEN 1 ELSE 0 END), 0) as wins,
        COALESCE(SUM(CASE WHEN m.winnerId IS NOT NULL AND m.winnerId != p.id THEN 1 ELSE 0 END), 0) as losses
      FROM player_leagues pl
      INNER JOIN players p ON pl.playerId = p.id
      LEFT JOIN matches m ON m.leagueId = pl.leagueId
        AND m.seasonId = ?
        AND (m.playerAId = p.id OR m.playerBId = p.id)
      WHERE pl.leagueId = ?
      GROUP BY p.id, p.firstName, p.lastName
      ORDER BY wins DESC, p.lastName ASC`,
      [seasonId, leagueId]
    );
  } else {
    // League-wide standings: use player_leagues aggregate
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
        pl.wins,
        pl.losses
      FROM player_leagues pl
      INNER JOIN players p ON pl.playerId = p.id
      WHERE pl.leagueId = ?
      ORDER BY pl.wins DESC, p.lastName ASC`,
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
  let query = `SELECT winnerId
     FROM matches
     WHERE leagueId = ?
     AND ((playerAId = ? AND playerBId = ?) OR (playerAId = ? AND playerBId = ?))`;

  const params: any[] = [leagueId, playerId, opponentId, opponentId, playerId];

  if (seasonId) {
    query += ` AND seasonId = ?`;
    params.push(seasonId);
  }

  const matches = await db.all<{
    winnerId: number | null;
  }>(query, params);

  let wins = 0;
  let losses = 0;

  matches.forEach((match) => {
    if (match.winnerId === playerId) {
      wins++;
    } else if (match.winnerId === opponentId) {
      losses++;
    }
    // If winnerId is null, it's a draw/no result - don't count
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