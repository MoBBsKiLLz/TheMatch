import { SQLiteDatabase } from "expo-sqlite";

export async function setupDatabase(db: SQLiteDatabase) {
  // Create leagues table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS leagues (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      season TEXT,
      location TEXT,
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
}
