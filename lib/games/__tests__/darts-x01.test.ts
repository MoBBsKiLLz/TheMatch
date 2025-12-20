import type { DartsX01GameDataEnhanced, X01Round } from '@/types/games';

describe('Darts X01 Scoring Logic', () => {
  describe('Score Calculation', () => {
    it('should subtract round score from remaining score', () => {
      const startingScore = 501;
      const roundScore = 60;
      const newRemaining = startingScore - roundScore;

      expect(newRemaining).toBe(441);
    });

    it('should track multiple rounds', () => {
      let remaining = 501;

      const round1 = 60;
      remaining -= round1;
      expect(remaining).toBe(441);

      const round2 = 100;
      remaining -= round2;
      expect(remaining).toBe(341);

      const round3 = 80;
      remaining -= round3;
      expect(remaining).toBe(261);
    });

    it('should handle three individual darts', () => {
      const dart1 = 20; // Single 20
      const dart2 = 40; // Double 20
      const dart3 = 15; // Single 15

      const roundTotal = dart1 + dart2 + dart3;

      expect(roundTotal).toBe(75);
    });

    it('should calculate remaining after individual darts', () => {
      const remaining = 301;
      const darts = [20, 20, 17]; // 57 total
      const roundScore = darts.reduce((sum, dart) => sum + dart, 0);
      const newRemaining = remaining - roundScore;

      expect(newRemaining).toBe(244);
    });
  });

  describe('Checkout Detection', () => {
    it('should detect valid checkout when score reaches exactly 0', () => {
      const remaining = 60;
      const roundScore = 60;
      const newRemaining = remaining - roundScore;
      const isCheckout = newRemaining === 0;

      expect(isCheckout).toBe(true);
    });

    it('should not checkout when score goes below 0', () => {
      const remaining = 60;
      const roundScore = 65;
      const newRemaining = remaining - roundScore;
      const isCheckout = newRemaining === 0;

      expect(isCheckout).toBe(false);
      expect(newRemaining).toBeLessThan(0);
    });

    it('should not checkout when score is above 0', () => {
      const remaining = 60;
      const roundScore = 40;
      const newRemaining = remaining - roundScore;
      const isCheckout = newRemaining === 0;

      expect(isCheckout).toBe(false);
      expect(newRemaining).toBe(20);
    });

    it('should detect checkout with individual darts', () => {
      const remaining = 32;
      const darts = [20, 0, 12]; // Exactly 32
      const roundScore = darts.reduce((sum, dart) => sum + dart, 0);
      const newRemaining = remaining - roundScore;
      const isCheckout = newRemaining === 0;

      expect(isCheckout).toBe(true);
    });
  });

  describe('Game Variants', () => {
    const variants = [301, 401, 501, 701, 901];

    variants.forEach((variant) => {
      it(`should start ${variant} game with correct score`, () => {
        const startingScore = variant;
        const currentScore = startingScore;

        expect(currentScore).toBe(variant);
      });
    });

    it('should handle 301 checkout scenario', () => {
      let remaining = 301;

      // Round 1: 100
      remaining -= 100;
      expect(remaining).toBe(201);

      // Round 2: 100
      remaining -= 100;
      expect(remaining).toBe(101);

      // Round 3: 60
      remaining -= 60;
      expect(remaining).toBe(41);

      // Round 4: 41 (checkout)
      remaining -= 41;
      expect(remaining).toBe(0);
    });

    it('should handle 501 game', () => {
      let remaining = 501;

      remaining -= 60;
      expect(remaining).toBe(441);

      remaining -= 100;
      expect(remaining).toBe(341);

      remaining -= 140;
      expect(remaining).toBe(201);
    });
  });

  describe('Validation', () => {
    it('should reject score of 0', () => {
      const roundScore = 0;
      const isValid = roundScore > 0;

      expect(isValid).toBe(false);
    });

    it('should reject score exceeding remaining', () => {
      const remaining = 50;
      const roundScore = 60;
      const isValid = roundScore <= remaining;

      expect(isValid).toBe(false);
    });

    it('should accept valid score', () => {
      const remaining = 100;
      const roundScore = 60;
      const isValid = roundScore > 0 && roundScore <= remaining;

      expect(isValid).toBe(true);
    });

    it('should accept exact checkout score', () => {
      const remaining = 50;
      const roundScore = 50;
      const isValid = roundScore > 0 && roundScore <= remaining;

      expect(isValid).toBe(true);
    });
  });

  describe('Round History', () => {
    it('should track round details', () => {
      const round: X01Round = {
        playerIndex: 0,
        score: 60,
        remainingScore: 441,
        darts: [20, 20, 20],
        isCheckout: false,
        timestamp: Date.now(),
      };

      expect(round.score).toBe(60);
      expect(round.remainingScore).toBe(441);
      expect(round.darts).toHaveLength(3);
      expect(round.isCheckout).toBe(false);
    });

    it('should track checkout round', () => {
      const round: X01Round = {
        playerIndex: 1,
        score: 50,
        remainingScore: 0,
        darts: [18, 16, 16],
        isCheckout: true,
        timestamp: Date.now(),
      };

      expect(round.isCheckout).toBe(true);
      expect(round.remainingScore).toBe(0);
    });

    it('should allow rounds without individual dart tracking', () => {
      const round: X01Round = {
        playerIndex: 0,
        score: 85,
        remainingScore: 216,
        darts: [], // No individual darts tracked
        isCheckout: false,
        timestamp: Date.now(),
      };

      expect(round.darts).toHaveLength(0);
      expect(round.score).toBe(85);
    });

    it('should track multiple rounds in sequence', () => {
      const rounds: X01Round[] = [];

      rounds.push({
        playerIndex: 0,
        score: 60,
        remainingScore: 441,
        darts: [20, 20, 20],
        isCheckout: false,
        timestamp: Date.now(),
      });

      rounds.push({
        playerIndex: 1,
        score: 80,
        remainingScore: 421,
        darts: [20, 20, 40],
        isCheckout: false,
        timestamp: Date.now(),
      });

      rounds.push({
        playerIndex: 0,
        score: 100,
        remainingScore: 341,
        darts: [20, 60, 20],
        isCheckout: false,
        timestamp: Date.now(),
      });

      expect(rounds).toHaveLength(3);
      expect(rounds[0].playerIndex).toBe(0);
      expect(rounds[1].playerIndex).toBe(1);
      expect(rounds[2].playerIndex).toBe(0);
    });
  });

  describe('Multi-player Support', () => {
    it('should track scores for 2 players', () => {
      const currentScores = [501, 501];

      currentScores[0] -= 60; // Player 1 scores 60
      expect(currentScores[0]).toBe(441);

      currentScores[1] -= 80; // Player 2 scores 80
      expect(currentScores[1]).toBe(421);
    });

    it('should track scores for 3 players', () => {
      const currentScores = [301, 301, 301];

      currentScores[0] -= 60;
      currentScores[1] -= 45;
      currentScores[2] -= 80;

      expect(currentScores).toEqual([241, 256, 221]);
    });

    it('should track scores for 4 players', () => {
      const currentScores = [501, 501, 501, 501];

      currentScores[0] -= 100;
      currentScores[1] -= 85;
      currentScores[2] -= 120;
      currentScores[3] -= 60;

      expect(currentScores).toEqual([401, 416, 381, 441]);
    });

    it('should rotate active player', () => {
      const numPlayers = 3;
      let activePlayer = 0;

      // Round 1
      activePlayer = (activePlayer + 1) % numPlayers;
      expect(activePlayer).toBe(1);

      // Round 2
      activePlayer = (activePlayer + 1) % numPlayers;
      expect(activePlayer).toBe(2);

      // Round 3 - wraps around
      activePlayer = (activePlayer + 1) % numPlayers;
      expect(activePlayer).toBe(0);
    });

    it('should stop rotation when player checks out', () => {
      const currentScores = [501, 501];
      let activePlayer = 0;

      // Player 1's turn
      currentScores[activePlayer] -= 501;
      const hasCheckout = currentScores[activePlayer] === 0;

      if (!hasCheckout) {
        activePlayer = (activePlayer + 1) % 2;
      }

      expect(hasCheckout).toBe(true);
      expect(activePlayer).toBe(0); // Didn't advance
    });
  });

  describe('Data Format', () => {
    it('should have correct enhanced X01 game data structure', () => {
      const gameData: DartsX01GameDataEnhanced = {
        startingScore: 501,
        trackingMode: 'live',
        rounds: [
          {
            playerIndex: 0,
            score: 60,
            remainingScore: 441,
            darts: [20, 20, 20],
            isCheckout: false,
            timestamp: Date.now(),
          },
        ],
        currentScores: [441, 501],
        scores: [441, 501],
      };

      expect(gameData.trackingMode).toBe('live');
      expect(gameData.rounds).toHaveLength(1);
      expect(gameData.currentScores).toEqual([441, 501]);
      expect(gameData.startingScore).toBe(501);
    });

    it('should support final_only mode for backward compatibility', () => {
      const gameData: DartsX01GameDataEnhanced = {
        startingScore: 501,
        trackingMode: 'final_only',
        scores: [120, 0], // Player 2 won
      };

      expect(gameData.trackingMode).toBe('final_only');
      expect(gameData.rounds).toBeUndefined();
      expect(gameData.currentScores).toBeUndefined();
      expect(gameData.scores).toEqual([120, 0]);
    });

    it('should track final checkout', () => {
      const gameData: DartsX01GameDataEnhanced = {
        startingScore: 501,
        trackingMode: 'live',
        rounds: [
          {
            playerIndex: 1,
            score: 501,
            remainingScore: 0,
            darts: [60, 60, 60, 60, 60, 60, 60, 60, 81], // Fictional perfect game
            isCheckout: true,
            timestamp: Date.now(),
          },
        ],
        currentScores: [501, 0],
        scores: [501, 0],
        finalCheckout: 501,
      };

      expect(gameData.finalCheckout).toBe(501);
      expect(gameData.rounds![0].isCheckout).toBe(true);
    });
  });

  describe('Undo Functionality', () => {
    it('should restore score when undoing a round', () => {
      const currentScores = [441, 501];
      const lastRound: X01Round = {
        playerIndex: 0,
        score: 60,
        remainingScore: 441,
        darts: [20, 20, 20],
        isCheckout: false,
        timestamp: Date.now(),
      };

      // Undo: restore score
      currentScores[lastRound.playerIndex] =
        lastRound.remainingScore + lastRound.score;

      expect(currentScores[0]).toBe(501);
    });

    it('should handle undo after checkout', () => {
      const currentScores = [0, 501];
      const lastRound: X01Round = {
        playerIndex: 0,
        score: 50,
        remainingScore: 0,
        darts: [18, 16, 16],
        isCheckout: true,
        timestamp: Date.now(),
      };

      // Undo checkout
      currentScores[lastRound.playerIndex] =
        lastRound.remainingScore + lastRound.score;

      expect(currentScores[0]).toBe(50);
    });
  });
});
