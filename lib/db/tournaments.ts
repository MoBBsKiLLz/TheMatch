import { Database } from './client';
import { insert, update, findById } from './queries';
import { Tournament, TournamentMatch, TournamentFormat, TournamentMatchWithDetails } from '@/types/tournament';
import { LeaderboardEntry } from './leaderboard';

/**
 * Creates a tournament and generates the bracket structure
 */
export async function createTournament(
  db: Database,
  params: {
    seasonId: number;
    leagueId: number;
    name: string;
    format: TournamentFormat;
    seededPlayers: LeaderboardEntry[]; // Players ordered by seed (1st place first)
  }
): Promise<number> {
  const tournamentId = await insert(db, 'tournaments', {
    seasonId: params.seasonId,
    leagueId: params.leagueId,
    name: params.name,
    format: params.format,
    status: 'active',
    championId: null,
    createdAt: Date.now(),
  });

  // Generate bracket structure
  await generateBracket(db, tournamentId, params.seededPlayers);

  return tournamentId;
}

/**
 * Generates proper bracket seeding order (1v8, 4v5, 2v7, 3v6 for 8 players)
 */
function getStandardBracketSeeding(bracketSize: number): number[] {
  if (bracketSize === 2) {
    return [1, 2];
  }

  const half = getStandardBracketSeeding(bracketSize / 2);
  const result: number[] = [];

  for (const seed of half) {
    result.push(seed);
    result.push(bracketSize + 1 - seed);
  }

  return result;
}

/**
 * Generates a single-elimination bracket structure
 */
async function generateBracket(
  db: Database,
  tournamentId: number,
  seededPlayers: LeaderboardEntry[]
): Promise<void> {
  const numPlayers = seededPlayers.length;

  // Find next power of 2 to determine bracket size
  const bracketSize = Math.pow(2, Math.ceil(Math.log2(numPlayers)));
  const numByes = bracketSize - numPlayers;

  // Calculate number of rounds
  const numRounds = Math.log2(bracketSize);

  // Create matches for each round (starting from the first round)
  const matchIdsByRound: { [round: number]: number[] } = {};

  // Build bracket from finals backwards
  for (let round = 1; round <= numRounds; round++) {
    const matchesInRound = Math.pow(2, round - 1);
    matchIdsByRound[round] = [];

    // Finals (round 1) is best-of-5, all other rounds are best-of-3
    const seriesFormat = round === 1 ? 'best-of-5' : 'best-of-3';

    for (let matchNum = 0; matchNum < matchesInRound; matchNum++) {
      const nextMatchId = round > 1 ? matchIdsByRound[round - 1][Math.floor(matchNum / 2)] : null;

      const matchId = await insert(db, 'tournament_matches', {
        tournamentId,
        round,
        matchNumber: matchNum,
        playerAId: null,
        playerBId: null,
        playerAWins: 0,
        playerBWins: 0,
        winnerId: null,
        nextMatchId,
        seriesFormat,
        status: 'pending',
        createdAt: Date.now(),
      });

      matchIdsByRound[round].push(matchId);
    }
  }

  // Seed players into first round using standard bracket seeding
  const firstRound = numRounds;
  const firstRoundMatches = matchIdsByRound[firstRound];

  // Get proper bracket seeding order (e.g., [1, 4, 2, 3] for 4 players)
  const seedingOrder = getStandardBracketSeeding(bracketSize);

  // Create player map with seed positions (handles byes for uneven player counts)
  const playersBySeed: { [seed: number]: LeaderboardEntry | null } = {};
  for (let i = 0; i < bracketSize; i++) {
    playersBySeed[i + 1] = i < numPlayers ? seededPlayers[i] : null;
  }

  // Assign players to matches according to seeding order
  for (let i = 0; i < firstRoundMatches.length; i++) {
    const matchId = firstRoundMatches[i];

    // Get seeds for this match from the seeding order
    const seedA = seedingOrder[i * 2];
    const seedB = seedingOrder[i * 2 + 1];

    const playerA = playersBySeed[seedA];
    const playerB = playersBySeed[seedB];

    await update(db, 'tournament_matches', matchId, {
      playerAId: playerA?.playerId || null,
      playerBId: playerB?.playerId || null,
      status: playerB ? 'pending' : 'completed', // Auto-complete byes
      winnerId: playerB ? null : (playerA?.playerId || null), // Bye winner is playerA
    });

    // If it's a bye, advance the winner automatically
    if (!playerB && playerA) {
      const match = await findById<TournamentMatch>(db, 'tournament_matches', matchId);
      if (match?.nextMatchId) {
        await advanceWinner(db, match.nextMatchId, playerA.playerId);
      }
    }
  }
}

/**
 * Advance a winner to the next match
 */
async function advanceWinner(
  db: Database,
  nextMatchId: number,
  winnerId: number
): Promise<void> {
  const nextMatch = await findById<TournamentMatch>(db, 'tournament_matches', nextMatchId);

  if (!nextMatch) return;

  // Place winner in the appropriate slot
  if (!nextMatch.playerAId) {
    await update(db, 'tournament_matches', nextMatchId, {
      playerAId: winnerId,
    });
  } else if (!nextMatch.playerBId) {
    await update(db, 'tournament_matches', nextMatchId, {
      playerBId: winnerId,
    });
  }
}

/**
 * Record a game result in a series
 */
export async function recordTournamentGame(
  db: Database,
  matchId: number,
  winnerId: number
): Promise<void> {
  const match = await findById<TournamentMatch>(db, 'tournament_matches', matchId);

  if (!match || match.status === 'completed') return;

  // Use the match's specific series format
  const gamesNeededToWin = match.seriesFormat === 'best-of-3' ? 2 : 3;

  // Update wins
  let playerAWins = match.playerAWins;
  let playerBWins = match.playerBWins;

  if (winnerId === match.playerAId) {
    playerAWins++;
  } else if (winnerId === match.playerBId) {
    playerBWins++;
  }

  const updates: any = {
    playerAWins,
    playerBWins,
    status: 'in_progress',
  };

  // Check if series is complete
  if (playerAWins >= gamesNeededToWin || playerBWins >= gamesNeededToWin) {
    const seriesWinnerId = playerAWins >= gamesNeededToWin ? match.playerAId : match.playerBId;
    updates.winnerId = seriesWinnerId;
    updates.status = 'completed';

    // Advance winner to next match
    if (match.nextMatchId && seriesWinnerId) {
      await advanceWinner(db, match.nextMatchId, seriesWinnerId);
    }

    // Check if this was the finals (round 1, no nextMatchId)
    if (match.round === 1 && !match.nextMatchId && seriesWinnerId) {
      // Update tournament champion
      const tournamentMatch = await findById<TournamentMatch>(db, 'tournament_matches', matchId);
      if (tournamentMatch) {
        await update(db, 'tournaments', tournamentMatch.tournamentId, {
          championId: seriesWinnerId,
          status: 'completed',
        });
      }
    }
  }

  await update(db, 'tournament_matches', matchId, updates);
}

/**
 * Get tournament by ID
 */
export async function getTournament(
  db: Database,
  tournamentId: number
): Promise<Tournament | null> {
  return await findById<Tournament>(db, 'tournaments', tournamentId);
}

/**
 * Get all tournament matches with player details
 */
export async function getTournamentMatches(
  db: Database,
  tournamentId: number
): Promise<TournamentMatchWithDetails[]> {
  return await db.all<TournamentMatchWithDetails>(
    `SELECT
      tm.*,
      pA.firstName as playerAFirstName,
      pA.lastName as playerALastName,
      pB.firstName as playerBFirstName,
      pB.lastName as playerBLastName,
      w.firstName as winnerFirstName,
      w.lastName as winnerLastName
    FROM tournament_matches tm
    LEFT JOIN players pA ON tm.playerAId = pA.id
    LEFT JOIN players pB ON tm.playerBId = pB.id
    LEFT JOIN players w ON tm.winnerId = w.id
    WHERE tm.tournamentId = ?
    ORDER BY tm.round DESC, tm.matchNumber ASC`,
    [tournamentId]
  );
}

/**
 * Get tournament for a season (if exists)
 */
export async function getSeasonTournament(
  db: Database,
  seasonId: number
): Promise<Tournament | null> {
  return await db.get<Tournament>(
    'SELECT * FROM tournaments WHERE seasonId = ? LIMIT 1',
    [seasonId]
  );
}
