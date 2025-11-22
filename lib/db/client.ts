import * as SQLite from "expo-sqlite";

export function openDatabase() {
    return SQLite.openDatabaseAsync("app.db");
}

export type RawParams = (string | number | null | undefined)[];
export type CleanParams = (string | number | null)[];

function normalizeParams(params: (string | number | null | undefined)[] | undefined): CleanParams {
    if (!params || params.length === 0) return [];
    return params.map((p) => (p === undefined ? null : p)) as CleanParams;
}

export class Database {
    db: SQLite.SQLiteDatabase;

    constructor(db: SQLite.SQLiteDatabase) {
        this.db = db;
    }

    // For queries that don't return rows (INSERT, UPDATE, DELETE)
    async run(sql: string, params?: RawParams) {
        const normalized = normalizeParams(params);
        await this.db.runAsync(sql, normalized as unknown as SQLite.SQLiteBindParams);
    }

    // Get a single row
    async get<T>(sql: string, params?: RawParams): Promise<T | null> {
        const normalized = normalizeParams(params);
        const result = await this.db.getFirstAsync<T>(sql, normalized as any);
        return result ?? null;
    }

    // Get all rows
    async all<T>(sql: string, params?: RawParams): Promise<T[]> {
        const normalized = normalizeParams(params);
        const result = await this.db.getAllAsync<T>(sql, normalized as any);
        return result ?? [];
    }

    // Wrap a transaction cleanly
    async transaction(fn: (db: Database) => Promise<void>) {
        await this.db.withTransactionAsync(async () => {
            await fn(this);
        });
    }
}


