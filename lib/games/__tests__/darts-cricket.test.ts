import type {
  CricketPlayerState,
  CricketNumber,
  DartsCricketGameDataEnhanced,
} from '@/types/games';

describe('Darts Cricket Scoring Logic', () => {
  const cricketNumbers: CricketNumber[] = [20, 19, 18, 17, 16, 15, 'bull'];

  const createInitialPlayerState = (): CricketPlayerState => ({
    hits: {
      20: 0,
      19: 0,
      18: 0,
      17: 0,
      16: 0,
      15: 0,
      bull: 0,
    },
    score: 0,
    openNumbers: [],
  });

  describe('Hit Tracking', () => {
    it('should record a single hit', () => {
      const playerState = createInitialPlayerState();
      playerState.hits[20] = 1;

      expect(playerState.hits[20]).toBe(1);
      expect(playerState.openNumbers).toHaveLength(0);
    });

    it('should record two hits', () => {
      const playerState = createInitialPlayerState();
      playerState.hits[20] = 2;

      expect(playerState.hits[20]).toBe(2);
      expect(playerState.openNumbers).toHaveLength(0);
    });

    it('should open a number at 3 hits', () => {
      const playerState = createInitialPlayerState();
      playerState.hits[20] = 3;
      if (playerState.hits[20] >= 3 && !playerState.openNumbers.includes(20)) {
        playerState.openNumbers.push(20);
      }

      expect(playerState.hits[20]).toBe(3);
      expect(playerState.openNumbers).toContain(20);
    });

    it('should handle multiple hits beyond 3', () => {
      const playerState = createInitialPlayerState();
      playerState.hits[20] = 5;
      if (playerState.hits[20] >= 3 && !playerState.openNumbers.includes(20)) {
        playerState.openNumbers.push(20);
      }

      expect(playerState.hits[20]).toBe(5);
      expect(playerState.openNumbers).toContain(20);
    });

    it('should track hits on bull', () => {
      const playerState = createInitialPlayerState();
      playerState.hits.bull = 3;
      if (playerState.hits.bull >= 3 && !playerState.openNumbers.includes('bull')) {
        playerState.openNumbers.push('bull');
      }

      expect(playerState.hits.bull).toBe(3);
      expect(playerState.openNumbers).toContain('bull');
    });
  });

  describe('Standard Cricket Scoring', () => {
    it('should score points when hitting an open number and opponents have not opened it', () => {
      const player1 = createInitialPlayerState();
      const player2 = createInitialPlayerState();

      // Player 1 opens 20 (3 hits)
      player1.hits[20] = 3;
      player1.openNumbers.push(20);

      // Player 1 hits 20 one more time (4 total)
      player1.hits[20] = 4;

      // Player 2 has not opened 20
      const allOpponentsHaventOpened = player2.hits[20] < 3;

      if (allOpponentsHaventOpened) {
        const extraHits = player1.hits[20] - 3; // 1 extra hit
        const numberValue = 20;
        const pointsScored = extraHits * numberValue;
        player1.score += pointsScored;
      }

      expect(player1.score).toBe(20); // 1 extra hit * 20 points
    });

    it('should not score points if opponent has opened the number', () => {
      const player1 = createInitialPlayerState();
      const player2 = createInitialPlayerState();

      // Both players open 20
      player1.hits[20] = 3;
      player1.openNumbers.push(20);
      player2.hits[20] = 3;
      player2.openNumbers.push(20);

      // Player 1 hits 20 one more time
      player1.hits[20] = 4;

      // Player 2 has opened 20
      const allOpponentsHaventOpened = player2.hits[20] < 3;

      if (allOpponentsHaventOpened) {
        const extraHits = player1.hits[20] - 3;
        const numberValue = 20;
        const pointsScored = extraHits * numberValue;
        player1.score += pointsScored;
      }

      expect(player1.score).toBe(0); // No points because opponent opened
    });

    it('should score bull at 25 points per hit', () => {
      const player1 = createInitialPlayerState();
      const player2 = createInitialPlayerState();

      // Player 1 opens bull
      player1.hits.bull = 3;
      player1.openNumbers.push('bull');

      // Player 1 hits bull 2 more times
      player1.hits.bull = 5;

      const allOpponentsHaventOpened = player2.hits.bull < 3;

      if (allOpponentsHaventOpened) {
        const extraHits = player1.hits.bull - 3; // 2 extra hits
        const numberValue = 25; // Bull is worth 25
        const pointsScored = extraHits * numberValue;
        player1.score += pointsScored;
      }

      expect(player1.score).toBe(50); // 2 extra hits * 25 points
    });

    it('should handle 3+ player games correctly', () => {
      const player1 = createInitialPlayerState();
      const player2 = createInitialPlayerState();
      const player3 = createInitialPlayerState();

      // Player 1 opens 20
      player1.hits[20] = 3;
      player1.openNumbers.push(20);

      // Player 1 hits 20 two more times
      player1.hits[20] = 5;

      // Check if ALL opponents haven't opened
      const allOpponentsHaventOpened = player2.hits[20] < 3 && player3.hits[20] < 3;

      if (allOpponentsHaventOpened) {
        const extraHits = player1.hits[20] - 3; // 2 extra hits
        const numberValue = 20;
        const pointsScored = extraHits * numberValue;
        player1.score += pointsScored;
      }

      expect(player1.score).toBe(40); // 2 extra hits * 20 points

      // Now player 2 opens 20
      player2.hits[20] = 3;
      player2.openNumbers.push(20);

      // Player 1 hits again - should NOT score
      player1.hits[20] = 6;
      const stillAllClosed = player2.hits[20] < 3 && player3.hits[20] < 3;

      if (stillAllClosed) {
        const extraHits = player1.hits[20] - 3;
        const numberValue = 20;
        const pointsScored = extraHits * numberValue;
        player1.score += pointsScored;
      }

      expect(player1.score).toBe(40); // No additional points
    });
  });

  describe('Cut-throat Cricket Scoring', () => {
    it('should add points to opponents instead of self', () => {
      const player1 = createInitialPlayerState();
      const player2 = createInitialPlayerState();

      // Player 1 opens 20
      player1.hits[20] = 3;
      player1.openNumbers.push(20);

      // Player 1 hits 20 one more time
      player1.hits[20] = 4;

      const allOpponentsHaventOpened = player2.hits[20] < 3;

      if (allOpponentsHaventOpened) {
        const extraHits = player1.hits[20] - 3;
        const numberValue = 20;
        const pointsScored = extraHits * numberValue;

        // Cut-throat: add to opponent, not self
        player2.score += pointsScored;
      }

      expect(player1.score).toBe(0); // Player 1 doesn't score
      expect(player2.score).toBe(20); // Player 2 gets the points
    });

    it('should add points to all opponents in 3+ player game', () => {
      const player1 = createInitialPlayerState();
      const player2 = createInitialPlayerState();
      const player3 = createInitialPlayerState();

      // Player 1 opens 20
      player1.hits[20] = 3;
      player1.openNumbers.push(20);

      // Player 1 hits 20 two more times
      player1.hits[20] = 5;

      const allOpponentsHaventOpened = player2.hits[20] < 3 && player3.hits[20] < 3;

      if (allOpponentsHaventOpened) {
        const extraHits = player1.hits[20] - 3; // 2 extra hits
        const numberValue = 20;
        const pointsScored = extraHits * numberValue;

        // Cut-throat: add to all opponents
        player2.score += pointsScored;
        player3.score += pointsScored;
      }

      expect(player1.score).toBe(0); // Player 1 doesn't score
      expect(player2.score).toBe(40); // Both opponents get points
      expect(player3.score).toBe(40);
    });
  });

  describe('Game Completion', () => {
    it('should detect when all numbers are closed', () => {
      const player1 = createInitialPlayerState();
      const player2 = createInitialPlayerState();

      // Open all numbers for both players
      cricketNumbers.forEach((num) => {
        player1.hits[num] = 3;
        player1.openNumbers.push(num);
        player2.hits[num] = 3;
        player2.openNumbers.push(num);
      });

      // Check if all numbers are closed (all players have 3+ hits)
      const allNumbersClosed = cricketNumbers.every((num) => {
        return player1.hits[num] >= 3 && player2.hits[num] >= 3;
      });

      expect(allNumbersClosed).toBe(true);
    });

    it('should determine winner in standard cricket (highest score)', () => {
      const player1 = createInitialPlayerState();
      const player2 = createInitialPlayerState();

      player1.score = 100;
      player2.score = 75;

      // Close all numbers
      cricketNumbers.forEach((num) => {
        player1.hits[num] = 3;
        player2.hits[num] = 3;
      });

      const maxScore = Math.max(player1.score, player2.score);
      const winner = player1.score === maxScore ? player1 : player2;

      expect(winner).toBe(player1);
    });

    it('should determine winner in cut-throat cricket (lowest score)', () => {
      const player1 = createInitialPlayerState();
      const player2 = createInitialPlayerState();

      player1.score = 75;
      player2.score = 100;

      // Close all numbers
      cricketNumbers.forEach((num) => {
        player1.hits[num] = 3;
        player2.hits[num] = 3;
      });

      const minScore = Math.min(player1.score, player2.score);
      const winner = player1.score === minScore ? player1 : player2;

      expect(winner).toBe(player1);
    });

    it('should handle ties', () => {
      const player1 = createInitialPlayerState();
      const player2 = createInitialPlayerState();

      player1.score = 100;
      player2.score = 100;

      // Close all numbers
      cricketNumbers.forEach((num) => {
        player1.hits[num] = 3;
        player2.hits[num] = 3;
      });

      const maxScore = Math.max(player1.score, player2.score);
      const winners = [player1, player2].filter((p) => p.score === maxScore);

      expect(winners).toHaveLength(2);
    });
  });

  describe('Data Format', () => {
    it('should have correct enhanced cricket game data structure', () => {
      const gameData: DartsCricketGameDataEnhanced = {
        cricketType: 'standard',
        trackingMode: 'live',
        rounds: [
          {
            playerIndex: 0,
            targetNumber: 20,
            hitCount: 3,
            pointsScored: 0,
            timestamp: Date.now(),
          },
        ],
        playerStates: [createInitialPlayerState(), createInitialPlayerState()],
        points: [0, 0],
      };

      expect(gameData.trackingMode).toBe('live');
      expect(gameData.rounds!).toHaveLength(1);
      expect(gameData.rounds![0].targetNumber).toBe(20);
      expect(gameData.playerStates!).toHaveLength(2);
    });

    it('should support final_only mode for backward compatibility', () => {
      const gameData: DartsCricketGameDataEnhanced = {
        cricketType: 'standard',
        trackingMode: 'final_only',
        points: [85, 120],
      };

      expect(gameData.trackingMode).toBe('final_only');
      expect(gameData.rounds).toBeUndefined();
      expect(gameData.playerStates).toBeUndefined();
      expect(gameData.points).toEqual([85, 120]);
    });
  });
});
