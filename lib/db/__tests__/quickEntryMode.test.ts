import { Database } from '../client';
import { createMatch, updateMatch, getMatchesWithParticipants } from '../matches';
import { insert, update } from '../queries';

// Mock the queries module
jest.mock('../queries', () => ({
  ...jest.requireActual('../queries'),
  insert: jest.fn(),
  update: jest.fn(),
  findById: jest.fn(),
}));

describe('Quick Entry Mode (Winner-Only)', () => {
  let mockDb: Database;
  let insertIdCounter = 1;

  beforeEach(() => {
    jest.clearAllMocks();
    insertIdCounter = 1;

    mockDb = {
      get: jest.fn(),
      all: jest.fn(),
      run: jest.fn(),
      transaction: jest.fn((callback) => callback(mockDb)),
    } as unknown as Database;

    // Mock insert to return incrementing IDs
    (insert as jest.Mock).mockImplementation(() => {
      return Promise.resolve(insertIdCounter++);
    });
  });

  describe('createMatch with quickEntryMode', () => {
    it('should create a match with quickEntryMode enabled', async () => {
      const matchData = {
        gameType: 'pool' as const,
        date: Date.now(),
        quickEntryMode: true,
        participants: [
          { playerId: 1, seatIndex: 0, isWinner: true },
          { playerId: 2, seatIndex: 1, isWinner: false },
        ],
      };

      await createMatch(mockDb, matchData);

      expect(insert).toHaveBeenCalledWith(
        mockDb,
        'matches',
        expect.objectContaining({
          gameType: 'pool',
          quickEntryMode: 1, // Boolean converted to 1
          gameData: null, // No game data in quick entry mode
        })
      );
    });

    it('should create a match with quickEntryMode disabled (default)', async () => {
      const matchData = {
        gameType: 'pool' as const,
        date: Date.now(),
        quickEntryMode: false,
        gameVariant: '8-ball',
        gameData: { winMethod: 'made_all_balls' as const, playerScores: { 1: 3, 2: 1 } },
        participants: [
          { playerId: 1, seatIndex: 0, score: 3, isWinner: true },
          { playerId: 2, seatIndex: 1, score: 1, isWinner: false },
        ],
      };

      await createMatch(mockDb, matchData);

      expect(insert).toHaveBeenCalledWith(
        mockDb,
        'matches',
        expect.objectContaining({
          gameType: 'pool',
          quickEntryMode: 0, // Boolean converted to 0
          gameVariant: '8-ball',
          gameData: JSON.stringify({ winMethod: 'made_all_balls', playerScores: { 1: 3, 2: 1 } }),
        })
      );
    });

    it('should allow quick entry with only winner information', async () => {
      const matchData = {
        gameType: 'darts' as const,
        date: Date.now(),
        quickEntryMode: true,
        participants: [
          { playerId: 1, seatIndex: 0, isWinner: false },
          { playerId: 2, seatIndex: 1, isWinner: true },
        ],
      };

      await createMatch(mockDb, matchData);

      // Verify match was created
      expect(insert).toHaveBeenCalledWith(mockDb, 'matches', expect.any(Object));

      // Verify participants were inserted with only winner info
      expect(insert).toHaveBeenCalledWith(
        mockDb,
        'match_participants',
        expect.objectContaining({
          playerId: 1,
          seatIndex: 0,
          isWinner: 0, // false -> 0
          score: null,
          finishPosition: null,
        })
      );

      expect(insert).toHaveBeenCalledWith(
        mockDb,
        'match_participants',
        expect.objectContaining({
          playerId: 2,
          seatIndex: 1,
          isWinner: 1, // true -> 1
          score: null,
          finishPosition: null,
        })
      );
    });

    it('should work with all game types', async () => {
      const gameTypes = ['pool', 'darts', 'dominos', 'uno'] as const;

      for (const gameType of gameTypes) {
        jest.clearAllMocks();
        insertIdCounter = 1;

        const matchData = {
          gameType,
          date: Date.now(),
          quickEntryMode: true,
          participants: [
            { playerId: 1, seatIndex: 0, isWinner: true },
            { playerId: 2, seatIndex: 1, isWinner: false },
          ],
        };

        await createMatch(mockDb, matchData);

        expect(insert).toHaveBeenCalledWith(
          mockDb,
          'matches',
          expect.objectContaining({
            gameType,
            quickEntryMode: 1,
          })
        );
      }
    });

    it('should allow quick entry with 3 or 4 players', async () => {
      const matchData = {
        gameType: 'dominos' as const,
        date: Date.now(),
        quickEntryMode: true,
        participants: [
          { playerId: 1, seatIndex: 0, isWinner: false },
          { playerId: 2, seatIndex: 1, isWinner: true },
          { playerId: 3, seatIndex: 2, isWinner: false },
          { playerId: 4, seatIndex: 3, isWinner: false },
        ],
      };

      await createMatch(mockDb, matchData);

      expect(insert).toHaveBeenCalledWith(
        mockDb,
        'matches',
        expect.objectContaining({
          quickEntryMode: 1,
        })
      );

      // All 4 participants should be inserted
      expect(insert).toHaveBeenCalledWith(
        mockDb,
        'match_participants',
        expect.objectContaining({ playerId: 1 })
      );
      expect(insert).toHaveBeenCalledWith(
        mockDb,
        'match_participants',
        expect.objectContaining({ playerId: 2 })
      );
      expect(insert).toHaveBeenCalledWith(
        mockDb,
        'match_participants',
        expect.objectContaining({ playerId: 3 })
      );
      expect(insert).toHaveBeenCalledWith(
        mockDb,
        'match_participants',
        expect.objectContaining({ playerId: 4 })
      );
    });

    it('should work with series', async () => {
      const matchData = {
        gameType: 'pool' as const,
        seriesId: 1,
        date: Date.now(),
        quickEntryMode: true,
        participants: [
          { playerId: 1, seatIndex: 0, isWinner: true },
          { playerId: 2, seatIndex: 1, isWinner: false },
        ],
      };

      await createMatch(mockDb, matchData);

      expect(insert).toHaveBeenCalledWith(
        mockDb,
        'matches',
        expect.objectContaining({
          seriesId: 1,
          quickEntryMode: 1,
        })
      );
    });

    it('should work with leagues', async () => {
      const matchData = {
        gameType: 'pool' as const,
        leagueId: 1,
        seasonId: 1,
        weekNumber: 5,
        date: Date.now(),
        quickEntryMode: true,
        participants: [
          { playerId: 1, seatIndex: 0, isWinner: false },
          { playerId: 2, seatIndex: 1, isWinner: true },
        ],
      };

      await createMatch(mockDb, matchData);

      expect(insert).toHaveBeenCalledWith(
        mockDb,
        'matches',
        expect.objectContaining({
          leagueId: 1,
          seasonId: 1,
          weekNumber: 5,
          quickEntryMode: 1,
        })
      );
    });
  });

  describe('Backward compatibility', () => {
    it('should default quickEntryMode to 0 when not specified', async () => {
      const matchData = {
        gameType: 'pool' as const,
        date: Date.now(),
        gameVariant: '8-ball',
        gameData: { winMethod: 'made_all_balls' as const, playerScores: { 1: 3, 2: 1 } },
        participants: [
          { playerId: 1, seatIndex: 0, score: 3, isWinner: true },
          { playerId: 2, seatIndex: 1, score: 1, isWinner: false },
        ],
      };

      await createMatch(mockDb, matchData);

      expect(insert).toHaveBeenCalledWith(
        mockDb,
        'matches',
        expect.objectContaining({
          quickEntryMode: 0,
        })
      );
    });

    it('should handle legacy matches without quickEntryMode field', async () => {
      const mockMatches = [
        {
          id: 1,
          gameType: 'pool',
          leagueId: null,
          seasonId: null,
          weekNumber: null,
          seriesId: null,
          date: Date.now(),
          status: 'completed',
          gameVariant: '8-ball',
          gameData: JSON.stringify({ rackCount: 3 }),
          // quickEntryMode field missing (legacy match)
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
          score: 3,
          finishPosition: null,
          isWinner: 1,
          firstName: 'John',
          lastName: 'Doe',
        },
      ];

      (mockDb.all as jest.Mock)
        .mockResolvedValueOnce(mockMatches)
        .mockResolvedValueOnce(mockParticipants);

      const result = await getMatchesWithParticipants(mockDb);

      // Should handle missing field gracefully
      expect(result).toHaveLength(1);
      expect(result[0].quickEntryMode).toBeUndefined();
    });
  });

  describe('Display and validation', () => {
    it('should distinguish between quick entry and detailed matches', async () => {
      const quickMatch = {
        gameType: 'pool' as const,
        date: Date.now(),
        quickEntryMode: true,
        participants: [
          { playerId: 1, seatIndex: 0, isWinner: true },
          { playerId: 2, seatIndex: 1, isWinner: false },
        ],
      };

      const detailedMatch = {
        gameType: 'pool' as const,
        date: Date.now(),
        quickEntryMode: false,
        gameVariant: '8-ball',
        gameData: { winMethod: 'made_all_balls' as const, playerScores: { 1: 3, 2: 1 } },
        participants: [
          { playerId: 1, seatIndex: 0, score: 3, isWinner: true },
          { playerId: 2, seatIndex: 1, score: 1, isWinner: false },
        ],
      };

      await createMatch(mockDb, quickMatch);
      const quickEntryCall = (insert as jest.Mock).mock.calls.find(
        (call) => call[1] === 'matches'
      );

      jest.clearAllMocks();
      insertIdCounter = 1;

      await createMatch(mockDb, detailedMatch);
      const detailedEntryCall = (insert as jest.Mock).mock.calls.find(
        (call) => call[1] === 'matches'
      );

      // Quick entry should have quickEntryMode=1, no gameVariant, no gameData
      expect(quickEntryCall[2]).toMatchObject({
        quickEntryMode: 1,
        gameVariant: null,
        gameData: null,
      });

      // Detailed entry should have quickEntryMode=0, with gameVariant and gameData
      expect(detailedEntryCall[2]).toMatchObject({
        quickEntryMode: 0,
        gameVariant: '8-ball',
        gameData: JSON.stringify({ winMethod: 'made_all_balls', playerScores: { 1: 3, 2: 1 } }),
      });
    });
  });
});
