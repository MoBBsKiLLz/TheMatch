import { determineCustomGameWinner } from '../custom';
import { CustomGameConfig } from '@/types/customGame';

describe('Custom Game Logic', () => {
  describe('determineCustomGameWinner - target_score', () => {
    it('should determine winner by target score (first to reach)', () => {
      const config: CustomGameConfig = {
        id: 1,
        name: 'Test Game',
        scoringMethod: 'points',
        winCondition: 'target_score',
        targetValue: 500,
        minPlayers: 2,
        maxPlayers: 4,
        trackIndividualGames: false,
        allowNegativeScores: false,
        createdAt: Date.now(),
      };

      const finalScores = [520, 450]; // Player 0 has 520, Player 1 has 450

      const winnerIndices = determineCustomGameWinner(config, finalScores);

      expect(winnerIndices).toEqual([0]); // Player at index 0 wins
    });

    it('should handle no winner when target not reached', () => {
      const config: CustomGameConfig = {
        id: 1,
        name: 'Test Game',
        scoringMethod: 'points',
        winCondition: 'target_score',
        targetValue: 500,
        minPlayers: 2,
        maxPlayers: 4,
        trackIndividualGames: false,
        allowNegativeScores: false,
        createdAt: Date.now(),
      };

      const finalScores = [450, 400];

      const winnerIndices = determineCustomGameWinner(config, finalScores);

      expect(winnerIndices).toEqual([]);
    });

    it('should handle tie when multiple reach target with same score', () => {
      const config: CustomGameConfig = {
        id: 1,
        name: 'Test Game',
        scoringMethod: 'points',
        winCondition: 'target_score',
        targetValue: 500,
        minPlayers: 2,
        maxPlayers: 4,
        trackIndividualGames: false,
        allowNegativeScores: false,
        createdAt: Date.now(),
      };

      const finalScores = [520, 520];

      const winnerIndices = determineCustomGameWinner(config, finalScores);

      expect(winnerIndices).toEqual([0, 1]); // Both win
    });
  });

  describe('determineCustomGameWinner - best_of_games', () => {
    it('should determine winner by games won (best of X)', () => {
      const config: CustomGameConfig = {
        id: 1,
        name: 'Test Game',
        scoringMethod: 'games_won',
        winCondition: 'best_of_games',
        targetValue: 3, // First to 3 games
        minPlayers: 2,
        maxPlayers: 4,
        trackIndividualGames: true,
        allowNegativeScores: false,
        createdAt: Date.now(),
      };

      const finalScores = [3, 2]; // Player 0 has 3 games won

      const winnerIndices = determineCustomGameWinner(config, finalScores);

      expect(winnerIndices).toEqual([0]);
    });

    it('should handle no winner when target not reached', () => {
      const config: CustomGameConfig = {
        id: 1,
        name: 'Test Game',
        scoringMethod: 'games_won',
        winCondition: 'best_of_games',
        targetValue: 3,
        minPlayers: 2,
        maxPlayers: 4,
        trackIndividualGames: true,
        allowNegativeScores: false,
        createdAt: Date.now(),
      };

      const finalScores = [2, 2];

      const winnerIndices = determineCustomGameWinner(config, finalScores);

      expect(winnerIndices).toEqual([]);
    });
  });

  describe('determineCustomGameWinner - most_points', () => {
    it('should determine winner by highest points', () => {
      const config: CustomGameConfig = {
        id: 1,
        name: 'Test Game',
        scoringMethod: 'points',
        winCondition: 'most_points',
        targetValue: 10, // Total rounds played
        minPlayers: 2,
        maxPlayers: 4,
        trackIndividualGames: false,
        allowNegativeScores: false,
        createdAt: Date.now(),
      };

      const finalScores = [450, 380, 420];

      const winnerIndices = determineCustomGameWinner(config, finalScores);

      expect(winnerIndices).toEqual([0]); // Player with 450 points
    });

    it('should handle multiple winners in case of tie', () => {
      const config: CustomGameConfig = {
        id: 1,
        name: 'Test Game',
        scoringMethod: 'points',
        winCondition: 'most_points',
        targetValue: 10,
        minPlayers: 2,
        maxPlayers: 4,
        trackIndividualGames: false,
        allowNegativeScores: false,
        createdAt: Date.now(),
      };

      const finalScores = [450, 450, 400];

      const winnerIndices = determineCustomGameWinner(config, finalScores);

      expect(winnerIndices).toEqual([0, 1]); // Both players with 450 points
    });
  });

  describe('edge cases', () => {
    it('should handle all zeros', () => {
      const config: CustomGameConfig = {
        id: 1,
        name: 'Test Game',
        scoringMethod: 'points',
        winCondition: 'most_points',
        targetValue: 10,
        minPlayers: 2,
        maxPlayers: 4,
        trackIndividualGames: false,
        allowNegativeScores: false,
        createdAt: Date.now(),
      };

      const finalScores = [0, 0];

      const winnerIndices = determineCustomGameWinner(config, finalScores);

      expect(winnerIndices).toEqual([0, 1]); // Both have same score
    });

    it('should handle negative scores when allowed', () => {
      const config: CustomGameConfig = {
        id: 1,
        name: 'Test Game',
        scoringMethod: 'points',
        winCondition: 'most_points',
        targetValue: 10,
        minPlayers: 2,
        maxPlayers: 4,
        trackIndividualGames: false,
        allowNegativeScores: true,
        createdAt: Date.now(),
      };

      const finalScores = [-50, -100];

      const winnerIndices = determineCustomGameWinner(config, finalScores);

      expect(winnerIndices).toEqual([0]); // -50 is higher than -100
    });
  });
});
