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
  leagueId: number
): Promise<LeaderboardEntry[]> {
  const players = await db.all<{
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
  leagueId: number
): Promise<HeadToHeadRecord> {
  // Get all matches between these two players in this league
  const matches = await db.all<{
    winnerId: number | null;
  }>(
    `SELECT winnerId
     FROM matches
     WHERE leagueId = ?
     AND ((playerAId = ? AND playerBId = ?) OR (playerAId = ? AND playerBId = ?))`,
    [leagueId, playerId, opponentId, opponentId, playerId]
  );

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
  leaderboard: LeaderboardEntry[]
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
      const sortedGroup = await sortByHeadToHead(db, leagueId, group);
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
  players: LeaderboardEntry[]
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
          leagueId
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