import { Database } from './client';

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
            console.log("Column 'color' added to 'leagues' table.");
        }
    } catch (error) {
        console.error("Error adding 'color' column to 'leagues' table:", error);
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
            console.log('Added format column to leagues table');
        }

        if (!hasDuration) {
            await db.run('ALTER TABLE leagues ADD COLUMN defaultDuration INTEGER DEFAULT 8');
            console.log('Added defaultDuration column to leagues table');
        }
    } catch (error) {
        console.error('Failed to add league format settings:', error);
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
      console.log('Added seasonId column to matches table');
    }

    if (!hasWeekNumber) {
      await db.run('ALTER TABLE matches ADD COLUMN weekNumber INTEGER');
      console.log('Added weekNumber column to matches table');
    }

    if (!hasIsMakeup) {
      await db.run('ALTER TABLE matches ADD COLUMN isMakeup INTEGER DEFAULT 0');
      console.log('Added isMakeup column to matches table');
    }
  } catch (error) {
    console.error('Failed to add season columns:', error);
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
      console.log('Added seriesFormat column to tournament_matches table');
    }
  } catch (error) {
    console.error('Failed to add seriesFormat column:', error);
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
      console.log('Added gameType column to leagues table');
    }
  } catch (error) {
    console.error('Failed to add gameType column:', error);
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
      console.log('Added gameVariant column to matches table');
    }

    if (!hasGameData) {
      await db.run('ALTER TABLE matches ADD COLUMN gameData TEXT');
      console.log('Added gameData column to matches table');
    }
  } catch (error) {
    console.error('Failed to add game data columns:', error);
  }
}