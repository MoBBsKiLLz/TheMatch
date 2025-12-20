import { poolConfig } from '../pool';
import { CreateMatchParticipant } from '@/lib/db/matches';
import { MatchParticipant } from '@/types/match';

describe('Pool Game Configuration', () => {
  describe('basic configuration', () => {
    it('should have correct basic properties', () => {
      expect(poolConfig.type).toBe('pool');
      expect(poolConfig.name).toBe('Pool');
      expect(poolConfig.minPlayers).toBe(2);
      expect(poolConfig.maxPlayers).toBe(2);
      expect(poolConfig.variants).toEqual(['8-ball', '9-ball']);
    });
  });

  describe('validateParticipants', () => {
    it('should accept exactly 2 players with 1 winner', () => {
      const participants: CreateMatchParticipant[] = [
        { playerId: 1, seatIndex: 0, isWinner: true },
        { playerId: 2, seatIndex: 1, isWinner: false },
      ];

      expect(poolConfig.validateParticipants(participants)).toBe(true);
    });

    it('should reject less than 2 players', () => {
      const participants: CreateMatchParticipant[] = [
        { playerId: 1, seatIndex: 0, isWinner: true },
      ];

      expect(poolConfig.validateParticipants(participants)).toBe(false);
    });

    it('should reject more than 2 players', () => {
      const participants: CreateMatchParticipant[] = [
        { playerId: 1, seatIndex: 0, isWinner: true },
        { playerId: 2, seatIndex: 1, isWinner: false },
        { playerId: 3, seatIndex: 2, isWinner: false },
      ];

      expect(poolConfig.validateParticipants(participants)).toBe(false);
    });

    it('should reject when no winner specified', () => {
      const participants: CreateMatchParticipant[] = [
        { playerId: 1, seatIndex: 0, isWinner: false },
        { playerId: 2, seatIndex: 1, isWinner: false },
      ];

      expect(poolConfig.validateParticipants(participants)).toBe(false);
    });

    it('should reject when both players are winners', () => {
      const participants: CreateMatchParticipant[] = [
        { playerId: 1, seatIndex: 0, isWinner: true },
        { playerId: 2, seatIndex: 1, isWinner: true },
      ];

      expect(poolConfig.validateParticipants(participants)).toBe(false);
    });
  });

  describe('validateMatchData', () => {
    it('should accept valid 8-ball match data with made_all_balls', () => {
      const data = {
        winMethod: 'made_all_balls',
      };

      expect(poolConfig.validateMatchData(data)).toBe(true);
    });

    it('should accept valid opponent_fouled win method', () => {
      const data = {
        winMethod: 'other_foul',
      };

      expect(poolConfig.validateMatchData(data)).toBe(true);
    });

    it('should accept opponent_fouled_8ball win method', () => {
      const data = {
        winMethod: 'opponent_fouled_8ball',
      };

      expect(poolConfig.validateMatchData(data)).toBe(true);
    });

    it('should accept opponent_scratched_8ball win method', () => {
      const data = {
        winMethod: 'opponent_scratched_8ball',
      };

      expect(poolConfig.validateMatchData(data)).toBe(true);
    });

    it('should accept opponent_scratched win method', () => {
      const data = {
        winMethod: 'opponent_scratched',
      };

      expect(poolConfig.validateMatchData(data)).toBe(true);
    });

    it('should reject missing winMethod', () => {
      const data = {};

      expect(poolConfig.validateMatchData(data)).toBe(false);
    });

    it('should reject invalid win method', () => {
      const data = {
        winMethod: 'invalid_method',
      };

      expect(poolConfig.validateMatchData(data)).toBe(false);
    });

    it('should reject null data', () => {
      expect(poolConfig.validateMatchData(null)).toBe(false);
    });
  });

  describe('determineWinners', () => {
    it('should return winner playerId based on isWinner flag', () => {
      const participants: MatchParticipant[] = [
        { id: 1, matchId: 1, playerId: 10, seatIndex: 0, isWinner: false, score: null, finishPosition: 2 },
        { id: 2, matchId: 1, playerId: 20, seatIndex: 1, isWinner: true, score: null, finishPosition: 1 },
      ];

      const winners = poolConfig.determineWinners(participants);

      expect(winners).toEqual([20]); // PlayerId 20 is the winner
    });

    it('should handle no winner (draw)', () => {
      const participants: MatchParticipant[] = [
        { id: 1, matchId: 1, playerId: 10, seatIndex: 0, isWinner: false, score: null, finishPosition: 1 },
        { id: 2, matchId: 1, playerId: 20, seatIndex: 1, isWinner: false, score: null, finishPosition: 1 },
      ];

      const winners = poolConfig.determineWinners(participants);

      expect(winners).toEqual([]);
    });
  });

  describe('getMatchDisplayText', () => {
    it('should display winner name and loser name', () => {
      const participants = [
        {
          id: 1,
          matchId: 1,
          playerId: 10,
          seatIndex: 0,
          isWinner: 1,
          score: null,
          finishPosition: 1,
          firstName: 'John',
          lastName: 'Doe',
        },
        {
          id: 2,
          matchId: 1,
          playerId: 20,
          seatIndex: 1,
          isWinner: 0,
          score: null,
          finishPosition: 2,
          firstName: 'Jane',
          lastName: 'Smith',
        },
      ] as any;

      const text = poolConfig.getMatchDisplayText(participants);

      expect(text).toBe('John Doe defeated Jane Smith');
    });

    it('should display default text when no winner', () => {
      const participants = [
        {
          id: 1,
          matchId: 1,
          playerId: 10,
          seatIndex: 0,
          isWinner: 0,
          score: null,
          finishPosition: 1,
          firstName: 'John',
          lastName: 'Doe',
        },
        {
          id: 2,
          matchId: 1,
          playerId: 20,
          seatIndex: 1,
          isWinner: 0,
          score: null,
          finishPosition: 1,
          firstName: 'Jane',
          lastName: 'Smith',
        },
      ] as any;

      const text = poolConfig.getMatchDisplayText(participants);

      expect(text).toBe('Pool match');
    });
  });

  describe('getVariantDisplayName', () => {
    it('should return display name for 8-ball', () => {
      expect(poolConfig.getVariantDisplayName('8-ball')).toBe('8-Ball');
    });

    it('should return display name for 9-ball', () => {
      expect(poolConfig.getVariantDisplayName('9-ball')).toBe('9-Ball');
    });

    it('should return original variant for unknown variant', () => {
      expect(poolConfig.getVariantDisplayName('unknown')).toBe('unknown');
    });
  });
});
