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