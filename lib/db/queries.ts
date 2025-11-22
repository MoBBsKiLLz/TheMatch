import {Database} from "./client";

export async function insert (
    db: Database,
    table: string,
    values: Record<string, any>
): Promise<number> {
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
    return db.get<T>(`SELECT * FROM ${table} WHERE id = ?`, [id]);
}

export async function findAll<T>(
    db: Database,
    table: string
): Promise<T[]> {
    return db.all<T>(`SELECT * FROM ${table}`);
}