import { GameConfig } from './types';
import { DartsX01GameData, DartsCricketGameData } from '@/types/games';

export const dartsConfig: GameConfig = {
  type: 'darts',
  name: 'Darts',
  variants: ['901', '701', '501', '401', '301', 'cricket'],

  validateMatchData: (data: any): boolean => {
    if (!data || typeof data !== 'object') return false;

    // Check if X01 variant
    if ('playerAScore' in data && 'playerBScore' in data) {
      const x01 = data as DartsX01GameData;
      return (
        typeof x01.playerAScore === 'number' &&
        typeof x01.playerBScore === 'number' &&
        typeof x01.startingScore === 'number'
      );
    }

    // Check if Cricket variant
    if ('playerAPoints' in data && 'playerBPoints' in data) {
      const cricket = data as DartsCricketGameData;
      return (
        typeof cricket.playerAPoints === 'number' &&
        typeof cricket.playerBPoints === 'number' &&
        ['standard', 'cut-throat'].includes(cricket.cricketType)
      );
    }

    return false;
  },

  determineWinner: (gameData, playerAId, playerBId) => {
    // X01 variant
    if ('playerAScore' in gameData) {
      const data = gameData as DartsX01GameData;
      if (data.playerAScore === 0) return playerAId;
      if (data.playerBScore === 0) return playerBId;
      return null;
    }

    // Cricket variant
    if ('playerAPoints' in gameData) {
      const data = gameData as DartsCricketGameData;
      if (data.cricketType === 'standard') {
        return data.playerAPoints > data.playerBPoints ? playerAId : playerBId;
      } else {
        // Cut-throat: lowest points wins
        return data.playerAPoints < data.playerBPoints ? playerAId : playerBId;
      }
    }

    return null;
  },

  getMatchDisplayText: (gameData) => {
    if ('playerAScore' in gameData) {
      const data = gameData as DartsX01GameData;
      return `${data.playerAScore} - ${data.playerBScore}`;
    }
    if ('playerAPoints' in gameData) {
      const data = gameData as DartsCricketGameData;
      return `${data.playerAPoints} pts - ${data.playerBPoints} pts (${data.cricketType})`;
    }
    return '';
  },

  getVariantDisplayName: (variant) => {
    if (variant === 'cricket') return 'Cricket';
    return variant.toUpperCase(); // '501' -> '501'
  },
};
