import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { Database, openDatabase } from "./client";
import { setupDatabase } from "./schema";
import {
  addLeagueColorColumn,
  addLeagueFormatSettings,
  addSeasonColumnsToMatches,
  addTournamentSeriesFormat,
  addGameTypeToLeagues,
  addGameDataToMatches,
  refactorMatchesForMultiPlayer,
  refactorPlayerLeagues,
  ensureLeagueIdNullable,
  createCustomGameConfigsTable,
  addDartsRoundTracking,
  addQuickEntryMode,
  createSeriesTables
} from "./migrations";

type DatabaseContextType = {
  db: Database | null;
  isLoading: boolean;
};

const DatabaseContext = createContext<DatabaseContextType>({
  db: null,
  isLoading: true,
});

export function DatabaseProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<Database | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function initDB() {
      try {
        const database = await openDatabase();
        await setupDatabase(database);

        // Run migrations
        const dbInstance = new Database(database);
        await addLeagueColorColumn(dbInstance);
        await addLeagueFormatSettings(dbInstance);
        await addSeasonColumnsToMatches(dbInstance);
        await addTournamentSeriesFormat(dbInstance);
        await addGameTypeToLeagues(dbInstance);
        await addGameDataToMatches(dbInstance);

        // MAJOR REFACTOR: Multi-player support
        await refactorMatchesForMultiPlayer(dbInstance);
        await refactorPlayerLeagues(dbInstance);

        // Ensure standalone matches are supported
        await ensureLeagueIdNullable(dbInstance);

        // Add custom game configurations support
        await createCustomGameConfigsTable(dbInstance);

        // Add enhanced darts tracking support
        await addDartsRoundTracking(dbInstance);

        // Add winner-only mode support
        await addQuickEntryMode(dbInstance);

        // Add series feature support
        await createSeriesTables(dbInstance);

        // Verify series_players table exists
        const seriesPlayersCheck = await dbInstance.get<{ name: string }>(
          `SELECT name FROM sqlite_master WHERE type='table' AND name='series_players'`
        );
        if (!seriesPlayersCheck) {
          console.error('CRITICAL: series_players table was not created!');
          throw new Error('Failed to create series_players table');
        }

        setDb(dbInstance);
      } catch (error) {
        console.error("Failed to initialize database:", error);
      } finally {
        setIsLoading(false);
      }
    }

    initDB();
  }, []);

  return (
    <DatabaseContext.Provider value={{ db, isLoading }}>
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabase() {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error("useDatabase must be used within DatabaseProvider");
  }
  return context;
}
