import { Database } from '../client';
import { createTournament } from '../tournaments';
import { LeaderboardEntry } from '../leaderboard';

// Mock the queries module
jest.mock('../queries', () => ({
  insert: jest.fn(),
  update: jest.fn(),
  findById: jest.fn(),
}));

const queries = require('../queries');

describe('Tournament Management', () => {
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

  describe('createTournament', () => {
    it('should create tournament with proper bracket for 8 players', async () => {
      // Mock tournament creation
      queries.insert.mockResolvedValueOnce(100); // Tournament ID

      // Mock bracket matches creation (7 matches for 8 players: 4 + 2 + 1)
      // Round 3 (quarterfinals): 4 matches
      queries.insert.mockResolvedValueOnce(1);
      queries.insert.mockResolvedValueOnce(2);
      queries.insert.mockResolvedValueOnce(3);
      queries.insert.mockResolvedValueOnce(4);
      // Round 2 (semifinals): 2 matches
      queries.insert.mockResolvedValueOnce(5);
      queries.insert.mockResolvedValueOnce(6);
      // Round 1 (finals): 1 match
      queries.insert.mockResolvedValueOnce(7);

      const seededPlayers: LeaderboardEntry[] = [
        { playerId: 1, rank: 1, wins: 10, losses: 0, gamesPlayed: 10, winPercentage: 100, firstName: 'P1', lastName: 'L1' },
        { playerId: 2, rank: 2, wins: 9, losses: 1, gamesPlayed: 10, winPercentage: 90, firstName: 'P2', lastName: 'L2' },
        { playerId: 3, rank: 3, wins: 8, losses: 2, gamesPlayed: 10, winPercentage: 80, firstName: 'P3', lastName: 'L3' },
        { playerId: 4, rank: 4, wins: 7, losses: 3, gamesPlayed: 10, winPercentage: 70, firstName: 'P4', lastName: 'L4' },
        { playerId: 5, rank: 5, wins: 6, losses: 4, gamesPlayed: 10, winPercentage: 60, firstName: 'P5', lastName: 'L5' },
        { playerId: 6, rank: 6, wins: 5, losses: 5, gamesPlayed: 10, winPercentage: 50, firstName: 'P6', lastName: 'L6' },
        { playerId: 7, rank: 7, wins: 4, losses: 6, gamesPlayed: 10, winPercentage: 40, firstName: 'P7', lastName: 'L7' },
        { playerId: 8, rank: 8, wins: 3, losses: 7, gamesPlayed: 10, winPercentage: 30, firstName: 'P8', lastName: 'L8' },
      ];

      const tournamentId = await createTournament(mockDb, {
        seasonId: 1,
        leagueId: 1,
        name: 'Season Championship',
        format: 'best-of-3',
        seededPlayers,
      });

      expect(tournamentId).toBe(100);

      // Verify tournament was created
      expect(queries.insert).toHaveBeenNthCalledWith(1, mockDb, 'tournaments', {
        seasonId: 1,
        leagueId: 1,
        name: 'Season Championship',
        format: 'best-of-3',
        status: 'active',
        championId: null,
        createdAt: expect.any(Number),
      });

      // Verify bracket matches were created (8 calls total: 1 tournament + 7 matches)
      expect(queries.insert).toHaveBeenCalledTimes(8);
    });

    it('should create tournament with byes for non-power-of-2 players', async () => {
      queries.insert.mockResolvedValueOnce(101); // Tournament ID

      // For 6 players, bracket size will be 8 (next power of 2)
      // This means 2 byes
      // Round 3: 4 matches
      queries.insert.mockResolvedValueOnce(1);
      queries.insert.mockResolvedValueOnce(2);
      queries.insert.mockResolvedValueOnce(3);
      queries.insert.mockResolvedValueOnce(4);
      // Round 2: 2 matches
      queries.insert.mockResolvedValueOnce(5);
      queries.insert.mockResolvedValueOnce(6);
      // Round 1: 1 match
      queries.insert.mockResolvedValueOnce(7);

      const seededPlayers: LeaderboardEntry[] = [
        { playerId: 1, rank: 1, wins: 10, losses: 0, gamesPlayed: 10, winPercentage: 100, firstName: 'P1', lastName: 'L1' },
        { playerId: 2, rank: 2, wins: 9, losses: 1, gamesPlayed: 10, winPercentage: 90, firstName: 'P2', lastName: 'L2' },
        { playerId: 3, rank: 3, wins: 8, losses: 2, gamesPlayed: 10, winPercentage: 80, firstName: 'P3', lastName: 'L3' },
        { playerId: 4, rank: 4, wins: 7, losses: 3, gamesPlayed: 10, winPercentage: 70, firstName: 'P4', lastName: 'L4' },
        { playerId: 5, rank: 5, wins: 6, losses: 4, gamesPlayed: 10, winPercentage: 60, firstName: 'P5', lastName: 'L5' },
        { playerId: 6, rank: 6, wins: 5, losses: 5, gamesPlayed: 10, winPercentage: 50, firstName: 'P6', lastName: 'L6' },
      ];

      await createTournament(mockDb, {
        seasonId: 1,
        leagueId: 1,
        name: 'Mini Tournament',
        format: 'best-of-5',
        seededPlayers,
      });

      // Should still create proper bracket structure
      expect(queries.insert).toHaveBeenCalledTimes(8); // 1 tournament + 7 matches
    });

    it('should create simple bracket for 2 players', async () => {
      queries.insert.mockResolvedValueOnce(102); // Tournament ID
      queries.insert.mockResolvedValueOnce(1); // Single match

      const seededPlayers: LeaderboardEntry[] = [
        { playerId: 1, rank: 1, wins: 10, losses: 0, gamesPlayed: 10, winPercentage: 100, firstName: 'P1', lastName: 'L1' },
        { playerId: 2, rank: 2, wins: 9, losses: 1, gamesPlayed: 10, winPercentage: 90, firstName: 'P2', lastName: 'L2' },
      ];

      await createTournament(mockDb, {
        seasonId: 1,
        leagueId: 1,
        name: 'Head to Head',
        format: 'best-of-3',
        seededPlayers,
      });

      // Should create 1 tournament + 1 match (finals only)
      expect(queries.insert).toHaveBeenCalledTimes(2);
    });

    it('should create tournament with 4 players (perfect bracket)', async () => {
      queries.insert.mockResolvedValueOnce(103); // Tournament ID
      // Round 2 (semifinals): 2 matches
      queries.insert.mockResolvedValueOnce(1);
      queries.insert.mockResolvedValueOnce(2);
      // Round 1 (finals): 1 match
      queries.insert.mockResolvedValueOnce(3);

      const seededPlayers: LeaderboardEntry[] = [
        { playerId: 1, rank: 1, wins: 10, losses: 0, gamesPlayed: 10, winPercentage: 100, firstName: 'P1', lastName: 'L1' },
        { playerId: 2, rank: 2, wins: 9, losses: 1, gamesPlayed: 10, winPercentage: 90, firstName: 'P2', lastName: 'L2' },
        { playerId: 3, rank: 3, wins: 8, losses: 2, gamesPlayed: 10, winPercentage: 80, firstName: 'P3', lastName: 'L3' },
        { playerId: 4, rank: 4, wins: 7, losses: 3, gamesPlayed: 10, winPercentage: 70, firstName: 'P4', lastName: 'L4' },
      ];

      await createTournament(mockDb, {
        seasonId: 1,
        leagueId: 1,
        name: 'Four Player Tournament',
        format: 'best-of-3',
        seededPlayers,
      });

      // Should create 1 tournament + 3 matches (2 semifinals + 1 final)
      expect(queries.insert).toHaveBeenCalledTimes(4);
    });

    it('should set finals as best-of-5 and other rounds as best-of-3', async () => {
      queries.insert.mockResolvedValueOnce(104); // Tournament ID
      queries.insert.mockResolvedValueOnce(1);
      queries.insert.mockResolvedValueOnce(2);
      queries.insert.mockResolvedValueOnce(3);

      const seededPlayers: LeaderboardEntry[] = [
        { playerId: 1, rank: 1, wins: 10, losses: 0, gamesPlayed: 10, winPercentage: 100, firstName: 'P1', lastName: 'L1' },
        { playerId: 2, rank: 2, wins: 9, losses: 1, gamesPlayed: 10, winPercentage: 90, firstName: 'P2', lastName: 'L2' },
        { playerId: 3, rank: 3, wins: 8, losses: 2, gamesPlayed: 10, winPercentage: 80, firstName: 'P3', lastName: 'L3' },
        { playerId: 4, rank: 4, wins: 7, losses: 3, gamesPlayed: 10, winPercentage: 70, firstName: 'P4', lastName: 'L4' },
      ];

      await createTournament(mockDb, {
        seasonId: 1,
        leagueId: 1,
        name: 'Four Player Tournament',
        format: 'best-of-3',
        seededPlayers,
      });

      // Check semifinals (round 2) are best-of-3
      expect(queries.insert).toHaveBeenNthCalledWith(2, mockDb, 'tournament_matches',
        expect.objectContaining({
          round: 2,
          seriesFormat: 'best-of-3',
        })
      );

      // Check finals (round 1) is best-of-5
      expect(queries.insert).toHaveBeenNthCalledWith(4, mockDb, 'tournament_matches',
        expect.objectContaining({
          round: 1,
          seriesFormat: 'best-of-5',
        })
      );
    });
  });
});
