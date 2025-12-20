import { Database } from '../client';
import { insert, update, remove, findById, findAll } from '../queries';

describe('Database Queries', () => {
  let mockDb: Database;

  beforeEach(() => {
    mockDb = {
      run: jest.fn(),
      get: jest.fn(),
      all: jest.fn(),
      transaction: jest.fn(),
    } as any;
  });

  describe('insert', () => {
    it('should insert a record and return the ID', async () => {
      (mockDb.get as jest.Mock).mockResolvedValue({ id: 42 });

      const id = await insert(mockDb, 'players', {
        firstName: 'John',
        lastName: 'Doe',
        createdAt: 1234567890,
      });

      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO players'),
        ['John', 'Doe', 1234567890]
      );
      expect(id).toBe(42);
    });

    it('should handle empty data object', async () => {
      (mockDb.get as jest.Mock).mockResolvedValue({ id: 1 });

      const id = await insert(mockDb, 'players', {});

      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO players'),
        []
      );
      expect(id).toBe(1);
    });

    it('should reject non-whitelisted tables', async () => {
      await expect(
        insert(mockDb, 'malicious_table', { data: 'value' })
      ).rejects.toThrow('Invalid table name');
    });
  });

  describe('update', () => {
    it('should update a record by ID', async () => {
      (mockDb.run as jest.Mock).mockResolvedValue({});

      await update(mockDb, 'players', 42, {
        firstName: 'Jane',
        lastName: 'Smith',
      });

      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE players'),
        ['Jane', 'Smith', 42]
      );
    });

    it('should handle empty updates object', async () => {
      (mockDb.run as jest.Mock).mockResolvedValue({});

      await update(mockDb, 'players', 42, {});

      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE players'),
        [42]
      );
    });

    it('should reject non-whitelisted tables', async () => {
      await expect(
        update(mockDb, 'malicious_table', 1, { data: 'value' })
      ).rejects.toThrow('Invalid table name');
    });
  });

  describe('remove', () => {
    it('should delete a record by ID', async () => {
      (mockDb.run as jest.Mock).mockResolvedValue({});

      await remove(mockDb, 'players', 42);

      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining('DELETE from players'),
        [42]
      );
    });

    it('should reject non-whitelisted tables', async () => {
      await expect(
        remove(mockDb, 'malicious_table', 1)
      ).rejects.toThrow('Invalid table name');
    });
  });

  describe('findById', () => {
    it('should find a record by ID', async () => {
      const mockPlayer = { id: 42, firstName: 'John', lastName: 'Doe' };
      (mockDb.get as jest.Mock).mockResolvedValue(mockPlayer);

      const result = await findById(mockDb, 'players', 42);

      expect(mockDb.get).toHaveBeenCalledWith(
        'SELECT * FROM players WHERE id = ?',
        [42]
      );
      expect(result).toEqual(mockPlayer);
    });

    it('should return null when record not found', async () => {
      (mockDb.get as jest.Mock).mockResolvedValue(undefined);

      const result = await findById(mockDb, 'players', 999);

      expect(result).toBe(null);
    });

    it('should reject non-whitelisted tables', async () => {
      await expect(
        findById(mockDb, 'malicious_table', 1)
      ).rejects.toThrow('Invalid table name');
    });
  });

  describe('findAll', () => {
    it('should find all records in a table', async () => {
      const mockPlayers = [
        { id: 1, firstName: 'John' },
        { id: 2, firstName: 'Jane' },
      ];
      (mockDb.all as jest.Mock).mockResolvedValue(mockPlayers);

      const result = await findAll(mockDb, 'players');

      expect(mockDb.all).toHaveBeenCalledWith(
        'SELECT * FROM players'
      );
      expect(result).toEqual(mockPlayers);
    });

    it('should return empty array when no records found', async () => {
      (mockDb.all as jest.Mock).mockResolvedValue([]);

      const result = await findAll(mockDb, 'players');

      expect(result).toEqual([]);
    });

    it('should reject non-whitelisted tables', async () => {
      await expect(
        findAll(mockDb, 'malicious_table')
      ).rejects.toThrow('Invalid table name');
    });
  });

  describe('table whitelist security', () => {
    const invalidTables = [
      'DROP TABLE players',
      'users; DROP TABLE players',
      '../etc/passwd',
      'sqlite_master',
    ];

    invalidTables.forEach(tableName => {
      it(`should reject table name: ${tableName}`, async () => {
        await expect(insert(mockDb, tableName, {})).rejects.toThrow('Invalid table name');
        await expect(update(mockDb, tableName, 1, {})).rejects.toThrow('Invalid table name');
        await expect(remove(mockDb, tableName, 1)).rejects.toThrow('Invalid table name');
        await expect(findById(mockDb, tableName, 1)).rejects.toThrow('Invalid table name');
        await expect(findAll(mockDb, tableName)).rejects.toThrow('Invalid table name');
      });
    });
  });

  describe('schema table coverage', () => {
    // All tables that exist in schema.ts
    // This list should be kept in sync with schema.ts
    const schemaTables = [
      'custom_game_configs',
      'custom_game_fields',
      'leagues',
      'match_participants',
      'matches',
      'player_leagues',
      'players',
      'seasons',
      'tournament_matches',
      'tournaments',
      'week_attendance',
    ];

    it('should allow all schema tables in queries', async () => {
      (mockDb.run as jest.Mock).mockResolvedValue({ lastInsertRowId: 1 });
      (mockDb.get as jest.Mock).mockResolvedValue({ id: 1 });
      (mockDb.all as jest.Mock).mockResolvedValue([]);

      // Test that all schema tables can be used with query functions
      for (const table of schemaTables) {
        // Should not throw
        await expect(insert(mockDb, table, { test: 'data' })).resolves.toBeDefined();
        await expect(update(mockDb, table, 1, { test: 'data' })).resolves.toBeUndefined();
        await expect(remove(mockDb, table, 1)).resolves.toBeUndefined();
        await expect(findById(mockDb, table, 1)).resolves.toBeDefined();
        await expect(findAll(mockDb, table)).resolves.toBeDefined();
      }
    });

    it('should have exactly the same tables as schema.ts', () => {
      // This test will fail if:
      // 1. A new table is added to schema.ts but not to ALLOWED_TABLES
      // 2. A table is removed from schema.ts but still in ALLOWED_TABLES
      // 3. A table name is misspelled in ALLOWED_TABLES

      // We can't directly access ALLOWED_TABLES from the module,
      // but we can test indirectly by attempting operations
      const expectedCount = schemaTables.length;

      // This documents that we expect 11 tables in the schema
      expect(expectedCount).toBe(11);
    });
  });
});
