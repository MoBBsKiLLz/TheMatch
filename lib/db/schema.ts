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
    gameType TEXT DEFAULT "pool",
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

  // Create player_leagues relational table (stats calculated on-demand)
  await db.execAsync(`
      CREATE TABLE IF NOT EXISTS player_leagues (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      playerId INTEGER NOT NULL,
      leagueId INTEGER NOT NULL,
      FOREIGN KEY (playerId) REFERENCES players(id),
      FOREIGN KEY (leagueId) REFERENCES leagues(id)
      );
  `);

  // Create matches table (multi-player support)
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS matches (
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
    );
  `);

  // Create match_participants table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS match_participants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      matchId INTEGER NOT NULL,
      playerId INTEGER NOT NULL,
      seatIndex INTEGER NOT NULL,
      score INTEGER,
      finishPosition INTEGER,
      isWinner INTEGER DEFAULT 0,
      FOREIGN KEY (matchId) REFERENCES matches(id) ON DELETE CASCADE,
      FOREIGN KEY (playerId) REFERENCES players(id)
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

  // Custom game configuration tables
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS custom_game_configs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      minPlayers INTEGER NOT NULL DEFAULT 2,
      maxPlayers INTEGER NOT NULL DEFAULT 4,
      scoringType TEXT NOT NULL,
      createdAt INTEGER NOT NULL
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS custom_game_fields (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      configId INTEGER NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      required INTEGER DEFAULT 0,
      sortOrder INTEGER DEFAULT 0,
      FOREIGN KEY (configId) REFERENCES custom_game_configs(id) ON DELETE CASCADE
    );
  `);

  // Create indexes for foreign keys and frequently queried columns
  // These significantly improve query performance
  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_player_leagues_playerId ON player_leagues(playerId);
    CREATE INDEX IF NOT EXISTS idx_player_leagues_leagueId ON player_leagues(leagueId);

    CREATE INDEX IF NOT EXISTS idx_matches_leagueId ON matches(leagueId);
    CREATE INDEX IF NOT EXISTS idx_matches_seasonId ON matches(seasonId);
    CREATE INDEX IF NOT EXISTS idx_matches_date ON matches(date);
    CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);

    CREATE INDEX IF NOT EXISTS idx_match_participants_matchId ON match_participants(matchId);
    CREATE INDEX IF NOT EXISTS idx_match_participants_playerId ON match_participants(playerId);
    CREATE INDEX IF NOT EXISTS idx_match_participants_isWinner ON match_participants(isWinner);

    CREATE INDEX IF NOT EXISTS idx_seasons_leagueId ON seasons(leagueId);
    CREATE INDEX IF NOT EXISTS idx_seasons_status ON seasons(status);

    CREATE INDEX IF NOT EXISTS idx_week_attendance_seasonId ON week_attendance(seasonId);
    CREATE INDEX IF NOT EXISTS idx_week_attendance_playerId ON week_attendance(playerId);

    CREATE INDEX IF NOT EXISTS idx_tournaments_seasonId ON tournaments(seasonId);
    CREATE INDEX IF NOT EXISTS idx_tournaments_leagueId ON tournaments(leagueId);

    CREATE INDEX IF NOT EXISTS idx_tournament_matches_tournamentId ON tournament_matches(tournamentId);
    CREATE INDEX IF NOT EXISTS idx_tournament_matches_playerAId ON tournament_matches(playerAId);
    CREATE INDEX IF NOT EXISTS idx_tournament_matches_playerBId ON tournament_matches(playerBId);

    CREATE INDEX IF NOT EXISTS idx_custom_game_fields_configId ON custom_game_fields(configId);
  `);
}