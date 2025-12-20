import { Database } from '../client';
import {
  createCustomGameConfig,
  updateCustomGameConfig,
  deleteCustomGameConfig,
  getCustomGameConfig,
  getAllCustomGameConfigs,
} from '../customGames';

// Mock the queries module
jest.mock('../queries', () => ({
  insert: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  findById: jest.fn(),
}));

const queries = require('../queries');

describe('Custom Game Configurations', () => {
  let mockDb: Database;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb = {
      run: jest.fn(),
      get: jest.fn(),
      all: jest.fn(),
      transaction: jest.fn(),
    } as any;
  });

  describe('createCustomGameConfig', () => {
    it('should create a custom game config with boolean conversion', async () => {
      queries.insert.mockResolvedValue(42);
      const now = Date.now();
      jest.spyOn(Date, 'now').mockReturnValue(now);

      const config = {
        name: 'Custom Card Game',
        description: 'A fun card game',
        scoringMethod: 'points' as const,
        winCondition: 'target_score' as const,
        targetValue: 500,
        minPlayers: 2,
        maxPlayers: 4,
        trackIndividualGames: true,
        allowNegativeScores: false,
        pointsPerWin: 10,
      };

      const id = await createCustomGameConfig(mockDb, config);

      expect(queries.insert).toHaveBeenCalledWith(mockDb, 'custom_game_configs', {
        ...config,
        trackIndividualGames: 1,
        allowNegativeScores: 0,
        createdAt: now,
      });
      expect(id).toBe(42);
    });

    it('should handle optional fields', async () => {
      queries.insert.mockResolvedValue(43);

      const config = {
        name: 'Simple Game',
        scoringMethod: 'games_won' as const,
        winCondition: 'best_of_games' as const,
        targetValue: 3,
        minPlayers: 2,
        maxPlayers: 2,
        trackIndividualGames: false,
        allowNegativeScores: false,
      };

      await createCustomGameConfig(mockDb, config);

      expect(queries.insert).toHaveBeenCalledWith(
        mockDb,
        'custom_game_configs',
        expect.objectContaining({
          name: 'Simple Game',
          trackIndividualGames: 0,
          allowNegativeScores: 0,
        })
      );
    });

    it('should throw error when insert fails', async () => {
      queries.insert.mockResolvedValue(null);

      const config = {
        name: 'Test',
        scoringMethod: 'points' as const,
        winCondition: 'target_score' as const,
        targetValue: 100,
        minPlayers: 2,
        maxPlayers: 4,
        trackIndividualGames: false,
        allowNegativeScores: false,
      };

      await expect(createCustomGameConfig(mockDb, config)).rejects.toThrow(
        'Failed to create custom game configuration'
      );
    });
  });

  describe('updateCustomGameConfig', () => {
    it('should update config with boolean to integer conversion', async () => {
      queries.update.mockResolvedValue(undefined);

      await updateCustomGameConfig(mockDb, 42, {
        name: 'Updated Game',
        trackIndividualGames: true,
        allowNegativeScores: true,
      });

      expect(queries.update).toHaveBeenCalledWith(mockDb, 'custom_game_configs', 42, {
        name: 'Updated Game',
        trackIndividualGames: 1,
        allowNegativeScores: 1,
      });
    });

    it('should handle partial updates', async () => {
      queries.update.mockResolvedValue(undefined);

      await updateCustomGameConfig(mockDb, 42, {
        targetValue: 1000,
      });

      expect(queries.update).toHaveBeenCalledWith(mockDb, 'custom_game_configs', 42, {
        targetValue: 1000,
      });
    });

    it('should only convert boolean fields', async () => {
      queries.update.mockResolvedValue(undefined);

      await updateCustomGameConfig(mockDb, 42, {
        name: 'Test',
        minPlayers: 3,
      });

      expect(queries.update).toHaveBeenCalledWith(mockDb, 'custom_game_configs', 42, {
        name: 'Test',
        minPlayers: 3,
      });
    });
  });

  describe('deleteCustomGameConfig', () => {
    it('should delete config when not in use', async () => {
      (mockDb.all as jest.Mock).mockResolvedValue([]);
      queries.remove.mockResolvedValue(undefined);

      await deleteCustomGameConfig(mockDb, 42);

      expect(mockDb.all).toHaveBeenCalledWith(
        'SELECT id FROM leagues WHERE gameType = ? AND customGameConfigId = ?',
        ['custom', 42]
      );
      expect(queries.remove).toHaveBeenCalledWith(mockDb, 'custom_game_configs', 42);
    });

    it('should throw error when config is in use by leagues', async () => {
      (mockDb.all as jest.Mock).mockResolvedValue([{ id: 1 }, { id: 2 }]);

      await expect(deleteCustomGameConfig(mockDb, 42)).rejects.toThrow(
        'Cannot delete custom game configuration that is being used by leagues'
      );

      expect(queries.remove).not.toHaveBeenCalled();
    });
  });

  describe('getCustomGameConfig', () => {
    it('should retrieve config and convert integers to booleans', async () => {
      const mockConfig = {
        id: 42,
        name: 'Test Game',
        description: 'A test game',
        scoringMethod: 'points',
        winCondition: 'target_score',
        targetValue: 500,
        minPlayers: 2,
        maxPlayers: 4,
        trackIndividualGames: 1,
        allowNegativeScores: 0,
        pointsPerWin: 10,
        createdAt: 1234567890,
      };
      queries.findById.mockResolvedValue(mockConfig);

      const result = await getCustomGameConfig(mockDb, 42);

      expect(queries.findById).toHaveBeenCalledWith(mockDb, 'custom_game_configs', 42);
      expect(result).toEqual({
        ...mockConfig,
        trackIndividualGames: true,
        allowNegativeScores: false,
      });
    });

    it('should return null when config not found', async () => {
      queries.findById.mockResolvedValue(null);

      const result = await getCustomGameConfig(mockDb, 999);

      expect(result).toBeNull();
    });
  });

  describe('getAllCustomGameConfigs', () => {
    it('should retrieve all configs sorted by name', async () => {
      const mockConfigs = [
        {
          id: 1,
          name: 'Alpha Game',
          scoringMethod: 'points',
          winCondition: 'target_score',
          targetValue: 100,
          minPlayers: 2,
          maxPlayers: 4,
          trackIndividualGames: 1,
          allowNegativeScores: 0,
          createdAt: 1234567890,
        },
        {
          id: 2,
          name: 'Beta Game',
          scoringMethod: 'games_won',
          winCondition: 'best_of_games',
          targetValue: 5,
          minPlayers: 2,
          maxPlayers: 6,
          trackIndividualGames: 0,
          allowNegativeScores: 1,
          createdAt: 1234567891,
        },
      ];
      (mockDb.all as jest.Mock).mockResolvedValue(mockConfigs);

      const result = await getAllCustomGameConfigs(mockDb);

      expect(mockDb.all).toHaveBeenCalledWith(
        'SELECT * FROM custom_game_configs ORDER BY name ASC'
      );
      expect(result).toEqual([
        { ...mockConfigs[0], trackIndividualGames: true, allowNegativeScores: false },
        { ...mockConfigs[1], trackIndividualGames: false, allowNegativeScores: true },
      ]);
    });

    it('should return empty array when no configs exist', async () => {
      (mockDb.all as jest.Mock).mockResolvedValue([]);

      const result = await getAllCustomGameConfigs(mockDb);

      expect(result).toEqual([]);
    });
  });
});
