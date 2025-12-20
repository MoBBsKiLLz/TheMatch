import { Database } from '../client';
import {
  createSeries,
  getAllSeries,
  getSeriesById,
  updateSeries,
  completeSeries,
  deleteSeries,
  getSeriesStandings,
  getSeriesMatches,
} from '../series';
import { createMatch } from '../matches';
import { insert } from '../queries';
import type { Series } from '@/types/series';

// Mock the queries module
jest.mock('../queries', () => ({
  ...jest.requireActual('../queries'),
  insert: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  findById: jest.fn(),
}));

describe('Series Management', () => {
  let mockDb: Database;
  let seriesIdCounter = 1;

  beforeEach(() => {
    jest.clearAllMocks();
    seriesIdCounter = 1;

    mockDb = {
      get: jest.fn(),
      all: jest.fn(),
      run: jest.fn(),
      transaction: jest.fn((callback) => callback(mockDb)),
    } as unknown as Database;

    // Mock insert to return incrementing IDs
    (insert as jest.Mock).mockImplementation(() => {
      return Promise.resolve(seriesIdCounter++);
    });
  });

  describe('createSeries', () => {
    it('should create a series with required fields', async () => {
      const seriesData = {
        name: 'Best of 5 with John',
        gameType: 'pool',
        startDate: Date.now(),
      };

      const seriesId = await createSeries(mockDb, seriesData);

      expect(seriesId).toBe(1);
      expect(insert).toHaveBeenCalledWith(
        mockDb,
        'series',
        expect.objectContaining({
          name: 'Best of 5 with John',
          gameType: 'pool',
          startDate: seriesData.startDate,
          description: null,
          endDate: null,
          status: 'active',
        })
      );
    });

    it('should create a series with optional description', async () => {
      const seriesData = {
        name: 'Championship Series',
        description: 'Year-end championship tournament',
        gameType: 'darts',
        startDate: Date.now(),
      };

      await createSeries(mockDb, seriesData);

      expect(insert).toHaveBeenCalledWith(
        mockDb,
        'series',
        expect.objectContaining({
          name: 'Championship Series',
          description: 'Year-end championship tournament',
          gameType: 'darts',
        })
      );
    });

    it('should set status to active by default', async () => {
      const seriesData = {
        name: 'New Series',
        gameType: 'pool',
        startDate: Date.now(),
      };

      await createSeries(mockDb, seriesData);

      expect(insert).toHaveBeenCalledWith(
        mockDb,
        'series',
        expect.objectContaining({
          status: 'active',
          endDate: null,
        })
      );
    });
  });

  describe('getAllSeries', () => {
    it('should fetch all series with match and player counts', async () => {
      const mockSeriesData = [
        {
          id: 1,
          name: 'Series 1',
          description: null,
          gameType: 'pool',
          startDate: Date.now(),
          endDate: null,
          status: 'active',
          createdAt: Date.now(),
          matchCount: 5,
          playerCount: 3,
        },
        {
          id: 2,
          name: 'Series 2',
          description: 'Completed series',
          gameType: 'darts',
          startDate: Date.now() - 1000000,
          endDate: Date.now(),
          status: 'completed',
          createdAt: Date.now() - 1000000,
          matchCount: 10,
          playerCount: 4,
        },
      ];

      (mockDb.all as jest.Mock).mockResolvedValue(mockSeriesData);

      const result = await getAllSeries(mockDb);

      expect(result).toEqual(mockSeriesData);
      expect(mockDb.all).toHaveBeenCalledWith(
        expect.stringContaining('SELECT')
      );
    });

    it('should return empty array when no series exist', async () => {
      (mockDb.all as jest.Mock).mockResolvedValue([]);

      const result = await getAllSeries(mockDb);

      expect(result).toEqual([]);
    });
  });

  describe('getSeriesById', () => {
    it('should fetch a series by ID', async () => {
      const { findById } = require('../queries');
      const mockSeries: Series = {
        id: 1,
        name: 'Test Series',
        description: null,
        gameType: 'pool',
        startDate: Date.now(),
        endDate: null,
        status: 'active',
        createdAt: Date.now(),
      };

      (findById as jest.Mock).mockResolvedValue(mockSeries);

      const result = await getSeriesById(mockDb, 1);

      expect(result).toEqual(mockSeries);
      expect(findById).toHaveBeenCalledWith(mockDb, 'series', 1);
    });

    it('should return null for non-existent series', async () => {
      const { findById } = require('../queries');
      (findById as jest.Mock).mockResolvedValue(null);

      const result = await getSeriesById(mockDb, 999);

      expect(result).toBeNull();
    });
  });

  describe('updateSeries', () => {
    it('should update series name', async () => {
      const { update } = require('../queries');

      await updateSeries(mockDb, 1, { name: 'Updated Name' });

      expect(update).toHaveBeenCalledWith(mockDb, 'series', 1, {
        name: 'Updated Name',
      });
    });

    it('should update series description', async () => {
      const { update } = require('../queries');

      await updateSeries(mockDb, 1, { description: 'New description' });

      expect(update).toHaveBeenCalledWith(mockDb, 'series', 1, {
        description: 'New description',
      });
    });

    it('should update multiple fields', async () => {
      const { update } = require('../queries');

      await updateSeries(mockDb, 1, {
        name: 'New Name',
        description: 'New Description',
      });

      expect(update).toHaveBeenCalledWith(mockDb, 'series', 1, {
        name: 'New Name',
        description: 'New Description',
      });
    });
  });

  describe('completeSeries', () => {
    it('should set status to completed and set endDate', async () => {
      const { update } = require('../queries');
      const beforeComplete = Date.now();

      await completeSeries(mockDb, 1);

      const afterComplete = Date.now();

      expect(update).toHaveBeenCalledWith(
        mockDb,
        'series',
        1,
        expect.objectContaining({
          status: 'completed',
        })
      );

      const callArgs = (update as jest.Mock).mock.calls[0][3];
      expect(callArgs.endDate).toBeGreaterThanOrEqual(beforeComplete);
      expect(callArgs.endDate).toBeLessThanOrEqual(afterComplete);
    });
  });

  describe('deleteSeries', () => {
    it('should set seriesId to NULL for all matches and delete series', async () => {
      const { remove } = require('../queries');

      await deleteSeries(mockDb, 1);

      expect(mockDb.run).toHaveBeenCalledWith(
        'UPDATE matches SET seriesId = NULL WHERE seriesId = ?',
        [1]
      );
      expect(remove).toHaveBeenCalledWith(mockDb, 'series', 1);
    });
  });

  describe('getSeriesStandings', () => {
    it('should calculate standings with wins, losses, and win percentage', async () => {
      const mockStandingsData = [
        {
          playerId: 1,
          firstName: 'John',
          lastName: 'Doe',
          wins: 5,
          losses: 2,
          gamesPlayed: 7,
        },
        {
          playerId: 2,
          firstName: 'Jane',
          lastName: 'Smith',
          wins: 3,
          losses: 4,
          gamesPlayed: 7,
        },
      ];

      (mockDb.all as jest.Mock).mockResolvedValue(mockStandingsData);

      const result = await getSeriesStandings(mockDb, 1);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        playerId: 1,
        firstName: 'John',
        lastName: 'Doe',
        wins: 5,
        losses: 2,
        gamesPlayed: 7,
        winPercentage: 71.4, // 5/7 * 100 rounded to 1 decimal
      });
      expect(result[1]).toEqual({
        playerId: 2,
        firstName: 'Jane',
        lastName: 'Smith',
        wins: 3,
        losses: 4,
        gamesPlayed: 7,
        winPercentage: 42.9, // 3/7 * 100 rounded to 1 decimal
      });
    });

    it('should handle players with zero games', async () => {
      const mockStandingsData = [
        {
          playerId: 1,
          firstName: 'John',
          lastName: 'Doe',
          wins: 0,
          losses: 0,
          gamesPlayed: 0,
        },
      ];

      (mockDb.all as jest.Mock).mockResolvedValue(mockStandingsData);

      const result = await getSeriesStandings(mockDb, 1);

      expect(result[0].winPercentage).toBe(0);
    });

    it('should order by wins DESC then lastName ASC', async () => {
      const mockStandingsData = [
        {
          playerId: 3,
          firstName: 'Charlie',
          lastName: 'Brown',
          wins: 5,
          losses: 2,
          gamesPlayed: 7,
        },
        {
          playerId: 1,
          firstName: 'Alice',
          lastName: 'Anderson',
          wins: 5,
          losses: 2,
          gamesPlayed: 7,
        },
        {
          playerId: 2,
          firstName: 'Bob',
          lastName: 'Smith',
          wins: 3,
          losses: 4,
          gamesPlayed: 7,
        },
      ];

      (mockDb.all as jest.Mock).mockResolvedValue(mockStandingsData);

      const result = await getSeriesStandings(mockDb, 1);

      expect(mockDb.all).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY wins DESC, p.lastName ASC'),
        [1]
      );
    });

    it('should only include completed matches', async () => {
      (mockDb.all as jest.Mock).mockResolvedValue([]);

      await getSeriesStandings(mockDb, 1);

      expect(mockDb.all).toHaveBeenCalledWith(
        expect.stringContaining("m.status = 'completed'"),
        [1]
      );
    });
  });

  describe('getSeriesMatches', () => {
    it('should fetch all matches for a series', async () => {
      const mockMatches = [
        {
          id: 1,
          gameType: 'pool',
          seriesId: 1,
          leagueId: null,
          seasonId: null,
          weekNumber: null,
          date: Date.now(),
          status: 'completed',
          gameVariant: '8-ball',
          gameData: null,
          quickEntryMode: 0,
          createdAt: Date.now(),
          leagueName: null,
          customGameName: null,
        },
      ];

      const mockParticipants = [
        {
          id: 1,
          matchId: 1,
          playerId: 1,
          seatIndex: 0,
          score: null,
          finishPosition: null,
          isWinner: 1,
          firstName: 'John',
          lastName: 'Doe',
        },
        {
          id: 2,
          matchId: 1,
          playerId: 2,
          seatIndex: 1,
          score: null,
          finishPosition: null,
          isWinner: 0,
          firstName: 'Jane',
          lastName: 'Smith',
        },
      ];

      (mockDb.all as jest.Mock)
        .mockResolvedValueOnce(mockMatches) // First call for matches
        .mockResolvedValueOnce(mockParticipants); // Second call for participants

      const result = await getSeriesMatches(mockDb, 1);

      expect(result).toHaveLength(1);
      expect(result[0].participants).toHaveLength(2);
      expect(result[0].participants[0].isWinner).toBe(true);
      expect(result[0].participants[1].isWinner).toBe(false);
    });

    it('should filter matches by seriesId', async () => {
      (mockDb.all as jest.Mock).mockResolvedValue([]);

      await getSeriesMatches(mockDb, 1);

      expect(mockDb.all).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('WHERE m.seriesId = ?'),
        [1]
      );
    });

    it('should order matches by date DESC', async () => {
      (mockDb.all as jest.Mock).mockResolvedValue([]);

      await getSeriesMatches(mockDb, 1);

      expect(mockDb.all).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('ORDER BY m.date DESC'),
        [1]
      );
    });
  });
});
