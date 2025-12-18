import { GameConfig } from './types';
import { CustomGameConfig, CustomGameData } from '@/types/customGame';

export function createCustomGameConfig(config: CustomGameConfig): GameConfig {
  return {
    type: 'custom',
    name: config.name,
    minPlayers: config.minPlayers,
    maxPlayers: config.maxPlayers,
    variants: ['standard'], // Custom games don't have variants

    validateMatchData: (data: any): boolean => {
      if (!data || typeof data !== 'object') return false;
      const customData = data as CustomGameData;

      // Validate that configId matches
      if (customData.configId !== config.id) return false;

      // Validate games array exists
      if (!Array.isArray(customData.games)) return false;

      // Validate finalScores array
      if (!Array.isArray(customData.finalScores)) return false;

      return true;
    },

    validateParticipants: (participants) => {
      // Must be within player count range
      const count = participants.length;
      if (count < config.minPlayers || count > config.maxPlayers) {
        return false;
      }

      // For target_score and best_of_games, need exactly 1 winner
      // For most_points, can have multiple winners (ties)
      const winners = participants.filter((p) => p.isWinner);

      if (config.winCondition === 'most_points') {
        // At least one winner required
        return winners.length >= 1;
      } else {
        // Exactly one winner
        return winners.length === 1;
      }
    },

    determineWinners: (participants) => {
      return participants.filter((p) => p.isWinner).map((p) => p.playerId);
    },

    getMatchDisplayText: (participants) => {
      const winners = participants.filter((p) => p.isWinner);
      if (winners.length === 0) {
        return `${config.name} match`;
      }
      if (winners.length === 1) {
        const winner = winners[0];
        return `${winner.firstName} ${winner.lastName} won ${config.name}`;
      }
      // Multiple winners
      const winnerNames = winners.map((w) => `${w.firstName} ${w.lastName}`).join(', ');
      return `${winnerNames} won ${config.name}`;
    },

    getVariantDisplayName: (variant) => {
      return config.name;
    },
  };
}

// Helper function to calculate winner based on custom game config
export function determineCustomGameWinner(
  config: CustomGameConfig,
  finalScores: number[]
): number[] {
  switch (config.winCondition) {
    case 'target_score':
      // First to reach or exceed target
      const reachedTarget = finalScores
        .map((score, idx) => ({ score, idx }))
        .filter((item) => item.score >= config.targetValue);

      if (reachedTarget.length > 0) {
        // Return the one with highest score (in case multiple reached)
        const maxScore = Math.max(...reachedTarget.map((item) => item.score));
        return reachedTarget
          .filter((item) => item.score === maxScore)
          .map((item) => item.idx);
      }
      return [];

    case 'best_of_games':
      // Most games won (assumes games array has winnerId)
      // This would be calculated elsewhere based on games played
      // For now, return player with highest finalScore (games won count)
      const maxGamesWon = Math.max(...finalScores);
      if (maxGamesWon >= config.targetValue) {
        return finalScores
          .map((score, idx) => ({ score, idx }))
          .filter((item) => item.score === maxGamesWon)
          .map((item) => item.idx);
      }
      return [];

    case 'most_points':
      // Highest score after N rounds
      // For this, we'd check if enough rounds/games have been played
      const maxPoints = Math.max(...finalScores);
      return finalScores
        .map((score, idx) => ({ score, idx }))
        .filter((item) => item.score === maxPoints)
        .map((item) => item.idx);

    default:
      return [];
  }
}
