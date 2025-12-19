import { Database } from './client';
import { logger } from '../utils/logger';

export async function addLeagueColorColumn(db: Database): Promise<void> {
    try {
        // Check if column already exists
        const tableInfo = await db.all<{ name: string }>(
            `PRAGMA table_info('leagues')`
        );

        const hasColorColumn = tableInfo.some(column => column.name === 'color');

        if (!hasColorColumn) {
            // Add the new column 'color' to the 'leagues' table
            await db.run(`
                ALTER TABLE leagues
                ADD COLUMN color TEXT DEFAULT '#1E6FFF'
            `);
            logger.database("Column 'color' added to 'leagues' table");
        }
    } catch (error) {
        logger.error("Error adding 'color' column to 'leagues' table", error);
    }
}

export async function addLeagueFormatSettings(db: Database): Promise<void> {
    try {
        const tableInfo = await db.all<{ name: string }>(
            "PRAGMA table_info(leagues)"
        );

        const hasFormat = tableInfo.some(col => col.name === 'format');
        const hasDuration = tableInfo.some(col => col.name === 'defaultDuration');

        if (!hasFormat) {
            await db.run('ALTER TABLE leagues ADD COLUMN format TEXT DEFAULT "round-robin"');
            logger.database('Added format column to leagues table');
        }

        if (!hasDuration) {
            await db.run('ALTER TABLE leagues ADD COLUMN defaultDuration INTEGER DEFAULT 8');
            logger.database('Added defaultDuration column to leagues table');
        }
    } catch (error) {
        logger.error('Failed to add league format settings:', error);
    }
}

export async function addSeasonColumnsToMatches(db: Database): Promise<void> {
  try {
    // Check if columns exist
    const tableInfo = await db.all<{ name: string }>(
      "PRAGMA table_info(matches)"
    );

    const hasSeasonId = tableInfo.some(col => col.name === 'seasonId');
    const hasWeekNumber = tableInfo.some(col => col.name === 'weekNumber');
    const hasIsMakeup = tableInfo.some(col => col.name === 'isMakeup');

    if (!hasSeasonId) {
      await db.run('ALTER TABLE matches ADD COLUMN seasonId INTEGER REFERENCES seasons(id)');
      logger.database('Added seasonId column to matches table');
    }

    if (!hasWeekNumber) {
      await db.run('ALTER TABLE matches ADD COLUMN weekNumber INTEGER');
      logger.database('Added weekNumber column to matches table');
    }

    if (!hasIsMakeup) {
      await db.run('ALTER TABLE matches ADD COLUMN isMakeup INTEGER DEFAULT 0');
      logger.database('Added isMakeup column to matches table');
    }
  } catch (error) {
    logger.error('Failed to add season columns:', error);
  }
}

export async function addTournamentSeriesFormat(db: Database): Promise<void> {
  try {
    // Check if column exists
    const tableInfo = await db.all<{ name: string }>(
      "PRAGMA table_info(tournament_matches)"
    );

    const hasSeriesFormat = tableInfo.some(col => col.name === 'seriesFormat');

    if (!hasSeriesFormat) {
      await db.run('ALTER TABLE tournament_matches ADD COLUMN seriesFormat TEXT DEFAULT "best-of-3"');
      logger.database('Added seriesFormat column to tournament_matches table');
    }
  } catch (error) {
    logger.error('Failed to add seriesFormat column:', error);
  }
}

export async function addGameTypeToLeagues(db: Database): Promise<void> {
  try {
    // Check if column exists
    const tableInfo = await db.all<{ name: string }>(
      "PRAGMA table_info(leagues)"
    );

    const hasGameType = tableInfo.some(col => col.name === 'gameType');

    if (!hasGameType) {
      await db.run('ALTER TABLE leagues ADD COLUMN gameType TEXT DEFAULT "pool"');
      logger.database('Added gameType column to leagues table');
    }
  } catch (error) {
    logger.error('Failed to add gameType column:', error);
  }
}

export async function addGameDataToMatches(db: Database): Promise<void> {
  try {
    // Check if columns exist
    const tableInfo = await db.all<{ name: string }>(
      "PRAGMA table_info(matches)"
    );

    const hasGameVariant = tableInfo.some(col => col.name === 'gameVariant');
    const hasGameData = tableInfo.some(col => col.name === 'gameData');

    if (!hasGameVariant) {
      await db.run('ALTER TABLE matches ADD COLUMN gameVariant TEXT');
      logger.database('Added gameVariant column to matches table');
    }

    if (!hasGameData) {
      await db.run('ALTER TABLE matches ADD COLUMN gameData TEXT');
      logger.database('Added gameData column to matches table');
    }
  } catch (error) {
    logger.error('Failed to add game data columns:', error);
  }
}

// MAJOR REFACTOR: Multi-player match support
export async function refactorMatchesForMultiPlayer(db: Database): Promise<void> {
  try {
    logger.database('Starting multi-player refactor...');

    // Check if matches table has the old structure
    const matchesInfo = await db.all<{ name: string }>(
      "PRAGMA table_info(matches)"
    );
    const hasPlayerAId = matchesInfo.some(col => col.name === 'playerAId');

    if (!hasPlayerAId) {
      logger.database('Matches table already refactored, skipping...');
      return;
    }

    // Drop old tables (test data will be lost)
    await db.run('DROP TABLE IF EXISTS match_participants');
    await db.run('DROP TABLE IF EXISTS matches');
    logger.database('Dropped old matches and match_participants tables');

    // Create new matches table with gameType as first-class field
    // leagueId is now optional to support standalone matches
    await db.run(`
      CREATE TABLE matches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        gameType TEXT NOT NULL,
        leagueId INTEGER,
        seasonId INTEGER,
        weekNumber INTEGER,
        isMakeup INTEGER DEFAULT 0,
        date INTEGER NOT NULL,
        status TEXT DEFAULT 'completed',
        gameVariant TEXT,
        gameData TEXT,
        createdAt INTEGER NOT NULL,
        FOREIGN KEY (leagueId) REFERENCES leagues(id),
        FOREIGN KEY (seasonId) REFERENCES seasons(id)
      )
    `);
    logger.database('Created new matches table with gameType');

    // Create match_participants table
    await db.run(`
      CREATE TABLE match_participants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        matchId INTEGER NOT NULL,
        playerId INTEGER NOT NULL,
        seatIndex INTEGER NOT NULL,
        score INTEGER,
        finishPosition INTEGER,
        isWinner INTEGER DEFAULT 0,
        FOREIGN KEY (matchId) REFERENCES matches(id) ON DELETE CASCADE,
        FOREIGN KEY (playerId) REFERENCES players(id)
      )
    `);
    logger.database('Created match_participants table');

    logger.database('Multi-player refactor completed successfully');
  } catch (error) {
    logger.error('Failed to refactor matches for multi-player:', error);
    throw error;
  }
}

export async function refactorPlayerLeagues(db: Database): Promise<void> {
  try {
    logger.database('Starting player_leagues refactor...');

    // Check if player_leagues has wins/losses columns
    const tableInfo = await db.all<{ name: string }>(
      "PRAGMA table_info(player_leagues)"
    );
    const hasWins = tableInfo.some(col => col.name === 'wins');

    if (!hasWins) {
      logger.database('player_leagues already refactored, skipping...');
      return;
    }

    // Get existing data
    const existingData = await db.all<{
      id: number;
      playerId: number;
      leagueId: number;
    }>('SELECT id, playerId, leagueId FROM player_leagues');

    // Drop and recreate without aggregate columns
    await db.run('DROP TABLE IF EXISTS player_leagues');
    logger.database('Dropped old player_leagues table');

    await db.run(`
      CREATE TABLE player_leagues (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        playerId INTEGER NOT NULL,
        leagueId INTEGER NOT NULL,
        FOREIGN KEY (playerId) REFERENCES players(id),
        FOREIGN KEY (leagueId) REFERENCES leagues(id)
      )
    `);
    logger.database('Created new player_leagues table without aggregate columns');

    // Restore player-league relationships (wins/losses will be calculated on-demand)
    for (const row of existingData) {
      await db.run(
        'INSERT INTO player_leagues (id, playerId, leagueId) VALUES (?, ?, ?)',
        [row.id, row.playerId, row.leagueId]
      );
    }
    logger.database(`Restored ${existingData.length} player-league relationships`);

  } catch (error) {
    logger.error('Failed to refactor player_leagues:', error);
    throw error;
  }
}

export async function ensureLeagueIdNullable(db: Database): Promise<void> {
  try {
    logger.database('Ensuring matches.leagueId is nullable for standalone matches...');

    // Check current table structure
    const tableInfo = await db.all<{ name: string; notnull: number }>(
      "PRAGMA table_info(matches)"
    );

    const leagueIdColumn = tableInfo.find(col => col.name === 'leagueId');
    const hasIsMakeup = tableInfo.some(col => col.name === 'isMakeup');

    // If leagueId has NOT NULL constraint (notnull === 1) OR isMakeup is missing, we need to recreate the table
    if ((leagueIdColumn && leagueIdColumn.notnull === 1) || !hasIsMakeup) {
      logger.database('Found schema issues, fixing...');
      if (leagueIdColumn && leagueIdColumn.notnull === 1) {
        logger.database('  - leagueId has NOT NULL constraint');
      }
      if (!hasIsMakeup) {
        logger.database('  - isMakeup column is missing');
      }

      // Get all existing matches data
      const existingMatches = await db.all<any>('SELECT * FROM matches');
      const existingParticipants = await db.all<any>('SELECT * FROM match_participants');

      // Drop existing tables
      await db.run('DROP TABLE IF EXISTS match_participants');
      await db.run('DROP TABLE IF EXISTS matches');

      // Recreate matches table with nullable leagueId and isMakeup column
      await db.run(`
        CREATE TABLE matches (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          gameType TEXT NOT NULL,
          leagueId INTEGER,
          seasonId INTEGER,
          weekNumber INTEGER,
          isMakeup INTEGER DEFAULT 0,
          date INTEGER NOT NULL,
          status TEXT DEFAULT 'completed',
          gameVariant TEXT,
          gameData TEXT,
          createdAt INTEGER NOT NULL,
          FOREIGN KEY (leagueId) REFERENCES leagues(id),
          FOREIGN KEY (seasonId) REFERENCES seasons(id)
        )
      `);

      // Recreate match_participants table
      await db.run(`
        CREATE TABLE match_participants (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          matchId INTEGER NOT NULL,
          playerId INTEGER NOT NULL,
          seatIndex INTEGER NOT NULL,
          score INTEGER,
          finishPosition INTEGER,
          isWinner INTEGER DEFAULT 0,
          FOREIGN KEY (matchId) REFERENCES matches(id) ON DELETE CASCADE,
          FOREIGN KEY (playerId) REFERENCES players(id)
        )
      `);

      // Restore matches with proper column mapping
      for (const match of existingMatches) {
        // Build insert with all available columns, defaulting missing ones
        const insertData: any = {
          id: match.id,
          gameType: match.gameType,
          leagueId: match.leagueId ?? null,
          seasonId: match.seasonId ?? null,
          weekNumber: match.weekNumber ?? null,
          isMakeup: match.isMakeup ?? 0,
          date: match.date,
          status: match.status ?? 'completed',
          gameVariant: match.gameVariant ?? null,
          gameData: match.gameData ?? null,
          createdAt: match.createdAt,
        };

        const columns = Object.keys(insertData).join(', ');
        const placeholders = Object.keys(insertData).map(() => '?').join(', ');
        const values = Object.values(insertData);

        await db.run(
          `INSERT INTO matches (${columns}) VALUES (${placeholders})`,
          values
        );
      }

      // Restore participants
      for (const participant of existingParticipants) {
        const columns = Object.keys(participant).filter(k => k !== 'id').join(', ');
        const placeholders = Object.keys(participant).filter(k => k !== 'id').map(() => '?').join(', ');
        const values = Object.keys(participant).filter(k => k !== 'id').map(k => participant[k]);

        await db.run(
          `INSERT INTO match_participants (id, ${columns}) VALUES (?, ${placeholders})`,
          [participant.id, ...values]
        );
      }

      logger.database('Successfully fixed matches table schema');
    } else {
      logger.database('Matches table schema is correct, skipping...');
    }
  } catch (error) {
    logger.error('Failed to ensure matches table schema:', error);
    throw error;
  }
}

export async function createCustomGameConfigsTable(db: Database): Promise<void> {
  try {
    // Check if table already exists
    const tableExists = await db.get<{ name: string }>(
      `SELECT name FROM sqlite_master WHERE type='table' AND name='custom_game_configs'`
    );

    if (!tableExists) {
      await db.run(`
        CREATE TABLE custom_game_configs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT,
          scoringMethod TEXT NOT NULL CHECK (scoringMethod IN ('points', 'games_won', 'rounds')),
          winCondition TEXT NOT NULL CHECK (winCondition IN ('target_score', 'best_of_games', 'most_points')),
          targetValue INTEGER NOT NULL,
          minPlayers INTEGER NOT NULL CHECK (minPlayers >= 2 AND minPlayers <= 10),
          maxPlayers INTEGER NOT NULL CHECK (maxPlayers >= 2 AND maxPlayers <= 10),
          trackIndividualGames INTEGER NOT NULL DEFAULT 0,
          allowNegativeScores INTEGER NOT NULL DEFAULT 0,
          pointsPerWin INTEGER,
          createdAt INTEGER NOT NULL
        )
      `);
      logger.database('Created custom_game_configs table');
    } else {
      logger.database('custom_game_configs table already exists');
    }

    // Add customGameConfigId column to leagues table
    const leagueTableInfo = await db.all<{ name: string }>(
      "PRAGMA table_info(leagues)"
    );

    const hasCustomGameConfigId = leagueTableInfo.some(col => col.name === 'customGameConfigId');

    if (!hasCustomGameConfigId) {
      await db.run('ALTER TABLE leagues ADD COLUMN customGameConfigId INTEGER');
      logger.database('Added customGameConfigId column to leagues table');
    }
  } catch (error) {
    logger.error('Failed to create custom_game_configs table:', error);
    throw error;
  }
}