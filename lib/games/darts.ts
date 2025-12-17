import { GameConfig } from './types';
import { DartsX01GameData, DartsCricketGameData } from '@/types/games';

export const dartsConfig: GameConfig = {
  type: 'darts',
  name: 'Darts',
  minPlayers: 2,        // Can be 1v1
  maxPlayers: 4,        // Or up to 4 players in a match
  variants: ['901', '701', '501', '401', '301', 'cricket'],

  validateMatchData: (data: any): boolean => {
    if (!data || typeof data !== 'object') return false;

    // Check if X01 variant
    if ('scores' in data && 'startingScore' in data) {
      const x01 = data as DartsX01GameData;
      return (
        Array.isArray(x01.scores) &&
        x01.scores.length >= 2 &&
        x01.scores.length <= 4 &&
        x01.scores.every((s) => typeof s === 'number') &&
        typeof x01.startingScore === 'number'
      );
    }

    // Check if Cricket variant
    if ('points' in data && 'cricketType' in data) {
      const cricket = data as DartsCricketGameData;
      return (
        Array.isArray(cricket.points) &&
        cricket.points.length >= 2 &&
        cricket.points.length <= 4 &&
        cricket.points.every((p) => typeof p === 'number') &&
        ['standard', 'cut-throat'].includes(cricket.cricketType)
      );
    }

    return false;
  },

  validateParticipants: (participants) => {
    // 2-4 players, must have at least 1 winner
    return (
      participants.length >= 2 &&
      participants.length <= 4 &&
      participants.filter((p) => p.isWinner).length >= 1
    );
  },

  determineWinners: (participants) => {
    // For darts, winner is determined by score
    // For now, just return flagged winners
    return participants.filter((p) => p.isWinner).map((p) => p.playerId);
  },

  getMatchDisplayText: (participants) => {
    const winner = participants.find((p) => p.isWinner);
    if (participants.length === 2) {
      const loser = participants.find((p) => !p.isWinner);
      if (winner && loser) {
        return `${winner.firstName} ${winner.lastName} defeated ${loser.firstName} ${loser.lastName}`;
      }
    } else {
      // Multi-player
      if (winner) {
        return `${winner.firstName} ${winner.lastName} won (${participants.length} players)`;
      }
    }
    return 'Darts match';
  },

  getVariantDisplayName: (variant) => {
    if (variant === 'cricket') return 'Cricket';
    return variant.toUpperCase(); // '501' -> '501'
  },
};
