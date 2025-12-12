import { Database } from './client';
import { insert, update, findById } from './queries';
import { Season, OwedMatch } from '@/types/season';
import { League } from '@/types/league';

export async function createSeason(
  db: Database,
  season: {
    leagueId: number;
    name: string;
    startDate: number;
    weeksDuration?: number;
  }
): Promise<number> {
  return await insert(db, 'seasons', {
    leagueId: season.leagueId,
    name: season.name,
    startDate: season.startDate,
    weeksDuration: season.weeksDuration || 8,
    currentWeek: 1,
    status: 'active',
    createdAt: Date.now(),
  });
}

export async function updateSeason(
  db: Database,
  seasonId: number,
  updates: {
    name?: string;
    startDate?: number;
    weeksDuration?: number;
  }
): Promise<void> {
  await update(db, 'seasons', seasonId, updates);
}

export async function getLeagueSeasons(
  db: Database,
  leagueId: number
): Promise<Season[]> {
  return await db.all<Season>(
    'SELECT * FROM seasons WHERE leagueId = ? ORDER BY startDate DESC',
    [leagueId]
  );
}

export async function getActiveSeason(
  db: Database,
  leagueId: number
): Promise<Season | null> {
  return await db.get<Season>(
    "SELECT * FROM seasons WHERE leagueId = ? AND status = 'active' LIMIT 1",
    [leagueId]
  );
}

export async function recordWeekAttendance(
  db: Database,
  seasonId: number,
  weekNumber: number,
  playerIds: number[]
): Promise<void> {
  // Clear existing attendance for this week
  await db.run(
    'DELETE FROM week_attendance WHERE seasonId = ? AND weekNumber = ?',
    [seasonId, weekNumber]
  );

  // Insert new attendance records
  for (const playerId of playerIds) {
    await insert(db, 'week_attendance', {
      seasonId,
      weekNumber,
      playerId,
      attended: 1,
    });
  }
}

export async function getWeekAttendance(
  db: Database,
  seasonId: number,
  weekNumber: number
): Promise<number[]> {
  const records = await db.all<{ playerId: number }>(
    'SELECT playerId FROM week_attendance WHERE seasonId = ? AND weekNumber = ?',
    [seasonId, weekNumber]
  );
  
  return records.map(r => r.playerId);
}

// Get scheduled matches for current week based on selected attendance
export async function getScheduledMatches(
  db: Database,
  seasonId: number,
  leagueId: number,
  currentWeekNumber: number,
  selectedPlayerIds: number[]
): Promise<OwedMatch[]> {
  // Get league format
  const league = await findById<League>(db, 'leagues', leagueId);

  // Only for round-robin format
  if (!league || league.format !== 'round-robin') {
    return [];
  }

  if (selectedPlayerIds.length < 2) {
    return [];
  }

  // Get player info
  const players = await db.all<{ playerId: number; firstName: string; lastName: string }>(
    `SELECT p.id as playerId, p.firstName, p.lastName
     FROM players p
     WHERE p.id IN (${selectedPlayerIds.join(',')})
     ORDER BY p.lastName ASC, p.firstName ASC`
  );

  const scheduledMatches: OwedMatch[] = [];

  // Generate all pairs for current week
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      const playerA = players[i];
      const playerB = players[j];

      // Check if match already recorded for this specific week
      const matchExists = await db.get<{ id: number }>(
        `SELECT id FROM matches
         WHERE seasonId = ? AND weekNumber = ?
         AND ((playerAId = ? AND playerBId = ?) OR (playerAId = ? AND playerBId = ?))`,
        [seasonId, currentWeekNumber, playerA.playerId, playerB.playerId, playerB.playerId, playerA.playerId]
      );

      if (!matchExists) {
        scheduledMatches.push({
          playerId: playerA.playerId,
          playerName: `${playerA.firstName} ${playerA.lastName}`,
          opponentId: playerB.playerId,
          opponentName: `${playerB.firstName} ${playerB.lastName}`,
          weekNumber: currentWeekNumber,
        });
      }
    }
  }

  return scheduledMatches;
}

// Get makeup matches from previous weeks
export async function getMakeupMatches(
  db: Database,
  seasonId: number,
  leagueId: number,
  currentWeekNumber: number,
  currentWeekSelectedPlayers: number[]
): Promise<OwedMatch[]> {
  // Get league format
  const league = await findById<League>(db, 'leagues', leagueId);

  // Only for round-robin format
  if (!league || league.format !== 'round-robin') {
    return [];
  }

  const makeupMatches: OwedMatch[] = [];

  // Check each previous week
  for (let week = 1; week < currentWeekNumber; week++) {
    // Get who attended this past week
    const pastWeekAttendees = await getWeekAttendance(db, seasonId, week);

    if (pastWeekAttendees.length < 1) {
      continue;
    }

    // Get player info for past week attendees
    const pastWeekPlayers = await db.all<{ playerId: number; firstName: string; lastName: string }>(
      `SELECT p.id as playerId, p.firstName, p.lastName
       FROM players p
       WHERE p.id IN (${pastWeekAttendees.join(',')})
       ORDER BY p.lastName ASC, p.firstName ASC`
    );

    // Get current week player info
    const currentWeekPlayers = await db.all<{ playerId: number; firstName: string; lastName: string }>(
      `SELECT p.id as playerId, p.firstName, p.lastName
       FROM players p
       WHERE p.id IN (${currentWeekSelectedPlayers.join(',')})
       ORDER BY p.lastName ASC, p.firstName ASC`
    );

    // Check matches between current week players and past week players
    for (const currentPlayer of currentWeekPlayers) {
      for (const pastPlayer of pastWeekPlayers) {
        // Skip if same player
        if (currentPlayer.playerId === pastPlayer.playerId) continue;

        // Check if current player attended that past week
        const currentPlayerAttendedPastWeek = pastWeekAttendees.includes(currentPlayer.playerId);

        // If current player attended that week, they should have played then
        // If they didn't attend, they owe a makeup match
        if (!currentPlayerAttendedPastWeek) {
          // Check if they've played this opponent in THAT SPECIFIC WEEK
          // (or recorded a makeup match for that week)
          const matchExists = await db.get<{ id: number }>(
            `SELECT id FROM matches
             WHERE seasonId = ? AND weekNumber = ?
             AND ((playerAId = ? AND playerBId = ?) OR (playerAId = ? AND playerBId = ?))`,
            [seasonId, week, currentPlayer.playerId, pastPlayer.playerId, pastPlayer.playerId, currentPlayer.playerId]
          );

          if (!matchExists) {
            // Add makeup match for this specific week
            // Each missed week generates its own makeup match (for standings/points)
            makeupMatches.push({
              playerId: currentPlayer.playerId,
              playerName: `${currentPlayer.firstName} ${currentPlayer.lastName}`,
              opponentId: pastPlayer.playerId,
              opponentName: `${pastPlayer.firstName} ${pastPlayer.lastName}`,
              weekNumber: week,
            });
          }
        }
      }
    }
  }

  return makeupMatches;
}

// Deprecated: Use getScheduledMatches and getMakeupMatches instead
export async function getOwedMatches(
  db: Database,
  seasonId: number,
  leagueId: number,
  currentWeekSelectedPlayers?: number[]
): Promise<OwedMatch[]> {
  const season = await findById<Season>(db, 'seasons', seasonId);
  if (!season) return [];

  const selectedPlayers = currentWeekSelectedPlayers || [];

  // Combine scheduled and makeup matches
  const scheduled = selectedPlayers.length > 0
    ? await getScheduledMatches(db, seasonId, leagueId, season.currentWeek, selectedPlayers)
    : [];
  const makeup = selectedPlayers.length > 0
    ? await getMakeupMatches(db, seasonId, leagueId, season.currentWeek, selectedPlayers)
    : [];

  return [...scheduled, ...makeup];
}

export async function advanceWeek(db: Database, seasonId: number): Promise<void> {
  const season = await findById<Season>(db, 'seasons', seasonId);
  if (!season) return;

  const newWeek = season.currentWeek + 1;
  
  await update(db, 'seasons', seasonId, {
    currentWeek: newWeek,
  });
}

export async function completeSeason(db: Database, seasonId: number): Promise<void> {
  await update(db, 'seasons', seasonId, {
    status: 'completed',
  });
}