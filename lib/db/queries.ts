import {Database} from "./client";

// Whitelist of allowed table names to prevent SQL injection
// IMPORTANT: This list must match ALL tables defined in schema.ts
const ALLOWED_TABLES = [
    'custom_game_configs',
    'custom_game_fields',
    'leagues',
    'match_participants',
    'matches',
    'player_leagues',
    'players',
    'seasons',
    'series',
    'tournament_matches',
    'tournaments',
    'week_attendance',
] as const;

type AllowedTable = typeof ALLOWED_TABLES[number];

function validateTableName(table: string): asserts table is AllowedTable {
    if (!ALLOWED_TABLES.includes(table as AllowedTable)) {
        throw new Error(`Invalid table name: ${table}`);
    }
}

export async function insert (
    db: Database,
    table: string,
    values: Record<string, any>
): Promise<number> {
    validateTableName(table);

    const keys = Object.keys(values);
    const placeholders = keys.map(() => "?").join(", ");
    const params = Object.values(values);

    const sql = `
        INSERT INTO ${table} (${keys.join(", ")})
        VALUES (${placeholders})
    `;

    await db.run(sql, params);

    // Return the the lastInsertRowId
    const row = await db.get<{id:number}>("SELECT last_insert_rowid() as id");
    return row?.id ?? 0;
}

export async function update (
    db: Database,
    table: string,
    id: number,
    values: Record<string, any>
) {
    validateTableName(table);

    const keys = Object.keys(values);
    const setters = keys.map((k) => `${k} = ?`).join(", ");
    const params = [...Object.values(values), id];

    const sql = `
        UPDATE ${table}
        SET ${setters}
        WHERE id = ?
    `;

    await db.run(sql, params);
}

export async function remove (
    db: Database,
    table: string,
    id: number
) {
    validateTableName(table);

    const sql = `
        DELETE from ${table}
        WHERE id = ?
    `;

    await db.run(sql, [id]);
}

export async function findById<T>(
    db: Database,
    table: string,
    id: number
): Promise<T | null> {
    validateTableName(table);
    const result = await db.get<T>(`SELECT * FROM ${table} WHERE id = ?`, [id]);
    return result ?? null;
}

export async function findAll<T>(
    db: Database,
    table: string
): Promise<T[]> {
    validateTableName(table);
    return db.all<T>(`SELECT * FROM ${table}`);
}