import { SQLiteDatabase } from "expo-sqlite";

export async function setupDatabase(db: SQLiteDatabase) {
  // Create leagues table
  await db.execAsync(`
  CREATE TABLE IF NOT EXISTS leagues (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    location TEXT,
    color TEXT DEFAULT "#1E6FFF",
    format TEXT DEFAULT "round-robin",
    defaultDuration INTEGER DEFAULT 8,
    createdAt INTEGER NOT NULL
  );
`);

  // Create players table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      firstName TEXT NOT NULL,
      lastName TEXT NOT NULL,
      createdAt INTEGER NOT NULL
    );
  `);

  // Create player_leagues relational table
  await db.execAsync(`
      CREATE TABLE IF NOT EXISTS player_leagues (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      playerId INTEGER NOT NULL,
      leagueId INTEGER NOT NULL,
      wins INTEGER DEFAULT 0 NOT NULL,
      losses INTEGER DEFAULT 0 NOT NULL,
      FOREIGN KEY (playerId) REFERENCES players(id),
      FOREIGN KEY (leagueId) REFERENCES leagues(id)
      );
  `);

  // Create matches table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date INTEGER NOT NULL,
      playerAId INTEGER NOT NULL,
      playerBId INTEGER NOT NULL,
      winnerId INTEGER,
      leagueId INTEGER NOT NULL,
      createdAt INTEGER NOT NULL,
      FOREIGN KEY (leagueId) REFERENCES leagues(id),
      FOREIGN KEY (playerAId) REFERENCES players(id),
      FOREIGN KEY (playerBId) REFERENCES players(id),
      FOREIGN KEY (winnerId) REFERENCES players(id)
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS seasons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      leagueId INTEGER NOT NULL,
      name TEXT NOT NULL,
      startDate INTEGER NOT NULL,
      weeksDuration INTEGER DEFAULT 8,
      currentWeek INTEGER DEFAULT 1,
      status TEXT DEFAULT 'active',
      createdAt INTEGER NOT NULL,
      FOREIGN KEY (leagueId) REFERENCES leagues(id)
    );
  `);

  // Week attendance table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS week_attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      seasonId INTEGER NOT NULL,
      weekNumber INTEGER NOT NULL,
      playerId INTEGER NOT NULL,
      attended INTEGER DEFAULT 1,
      FOREIGN KEY (seasonId) REFERENCES seasons(id),
      FOREIGN KEY (playerId) REFERENCES players(id),
      UNIQUE(seasonId, weekNumber, playerId)
    );
  `);

  // Tournaments table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS tournaments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      seasonId INTEGER NOT NULL,
      leagueId INTEGER NOT NULL,
      name TEXT NOT NULL,
      format TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      championId INTEGER,
      createdAt INTEGER NOT NULL,
      FOREIGN KEY (seasonId) REFERENCES seasons(id),
      FOREIGN KEY (leagueId) REFERENCES leagues(id),
      FOREIGN KEY (championId) REFERENCES players(id)
    );
  `);

  // Tournament matches table (bracket matches)
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS tournament_matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tournamentId INTEGER NOT NULL,
      round INTEGER NOT NULL,
      matchNumber INTEGER NOT NULL,
      playerAId INTEGER,
      playerBId INTEGER,
      playerAWins INTEGER DEFAULT 0,
      playerBWins INTEGER DEFAULT 0,
      winnerId INTEGER,
      nextMatchId INTEGER,
      seriesFormat TEXT DEFAULT 'best-of-3',
      status TEXT DEFAULT 'pending',
      createdAt INTEGER NOT NULL,
      FOREIGN KEY (tournamentId) REFERENCES tournaments(id),
      FOREIGN KEY (playerAId) REFERENCES players(id),
      FOREIGN KEY (playerBId) REFERENCES players(id),
      FOREIGN KEY (winnerId) REFERENCES players(id),
      FOREIGN KEY (nextMatchId) REFERENCES tournament_matches(id)
    );
  `);
}