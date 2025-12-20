import { Database } from '../client';

describe('Database Client', () => {
  let mockDb: any;
  let db: Database;

  beforeEach(() => {
    mockDb = {
      runAsync: jest.fn(),
      getFirstAsync: jest.fn(),
      getAllAsync: jest.fn(),
      withTransactionAsync: jest.fn((callback) => callback()),
      prepareAsync: jest.fn(() => Promise.resolve({
        executeAsync: jest.fn(),
        finalizeAsync: jest.fn(),
      })),
    };
    db = new Database(mockDb);
  });

  describe('run', () => {
    it('should execute a query with normalized parameters', async () => {
      mockDb.runAsync.mockResolvedValue({ lastInsertRowId: 1, changes: 1 });

      await db.run('INSERT INTO players (name) VALUES (?)', ['John']);

      expect(mockDb.runAsync).toHaveBeenCalledWith('INSERT INTO players (name) VALUES (?)', ['John']);
    });

    it('should normalize undefined to null', async () => {
      mockDb.runAsync.mockResolvedValue({ lastInsertRowId: 1, changes: 1 });

      await db.run('INSERT INTO players (name, email) VALUES (?, ?)', ['John', undefined]);

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        'INSERT INTO players (name, email) VALUES (?, ?)',
        ['John', null]
      );
    });
  });

  describe('get', () => {
    it('should fetch a single row', async () => {
      const mockRow = { id: 1, name: 'John' };
      mockDb.getFirstAsync.mockResolvedValue(mockRow);

      const result = await db.get<typeof mockRow>('SELECT * FROM players WHERE id = ?', [1]);

      expect(mockDb.getFirstAsync).toHaveBeenCalledWith('SELECT * FROM players WHERE id = ?', [1]);
      expect(result).toEqual(mockRow);
    });

    it('should return null when no row is found', async () => {
      mockDb.getFirstAsync.mockResolvedValue(null);

      const result = await db.get('SELECT * FROM players WHERE id = ?', [999]);

      expect(result).toBeNull();
    });
  });

  describe('all', () => {
    it('should fetch multiple rows', async () => {
      const mockRows = [
        { id: 1, name: 'John' },
        { id: 2, name: 'Jane' },
      ];
      mockDb.getAllAsync.mockResolvedValue(mockRows);

      const result = await db.all<{ id: number; name: string }>('SELECT * FROM players');

      expect(mockDb.getAllAsync).toHaveBeenCalledWith('SELECT * FROM players', []);
      expect(result).toEqual(mockRows);
    });

    it('should return empty array when no rows found', async () => {
      mockDb.getAllAsync.mockResolvedValue([]);

      const result = await db.all('SELECT * FROM players WHERE id > ?', [1000]);

      expect(result).toEqual([]);
    });
  });

  describe('transaction', () => {
    it('should execute a transaction successfully', async () => {
      const callback = jest.fn().mockResolvedValue('result');

      const result = await db.transaction(callback);

      expect(callback).toHaveBeenCalledWith(db);
      expect(result).toBe('result');
    });

    it('should propagate errors from transaction callback', async () => {
      const error = new Error('Transaction failed');
      const callback = jest.fn().mockRejectedValue(error);

      await expect(db.transaction(callback)).rejects.toThrow('Transaction failed');
    });
  });

  describe('parameter normalization', () => {
    it('should handle mixed types including undefined', async () => {
      mockDb.runAsync.mockResolvedValue({ lastInsertRowId: 1, changes: 1 });

      await db.run(
        'INSERT INTO test (a, b, c, d) VALUES (?, ?, ?, ?)',
        [1, 'text', undefined, null]
      );

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        'INSERT INTO test (a, b, c, d) VALUES (?, ?, ?, ?)',
        [1, 'text', null, null]
      );
    });

    it('should handle empty parameters', async () => {
      mockDb.getAllAsync.mockResolvedValue([]);

      await db.all('SELECT * FROM players');

      expect(mockDb.getAllAsync).toHaveBeenCalledWith('SELECT * FROM players', []);
    });
  });
});
