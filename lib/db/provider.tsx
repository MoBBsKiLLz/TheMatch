import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { Database, openDatabase } from "./client";
import { setupDatabase } from "./schema";
import { addLeagueColorColumn, addLeagueFormatSettings, addSeasonColumnsToMatches, addTournamentSeriesFormat } from "./migrations";

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
