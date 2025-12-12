import { GameConfig } from './types';
import { DominosGameData } from '@/types/games';

export const dominosConfig: GameConfig = {
  type: 'dominos',
  name: 'Dominos',
  variants: ['standard'],

  validateMatchData: (data: any): boolean => {
    if (!data || typeof data !== 'object') return false;
    const dominosData = data as DominosGameData;

    return (
      Array.isArray(dominosData.games) &&
      dominosData.games.length > 0 &&
      typeof dominosData.finalScore?.playerA === 'number' &&
      typeof dominosData.finalScore?.playerB === 'number' &&
      typeof dominosData.targetScore === 'number'
    );
  },

  determineWinner: (gameData, playerAId, playerBId) => {
    const data = gameData as DominosGameData;
    if (data.finalScore.playerA >= data.targetScore) return playerAId;
    if (data.finalScore.playerB >= data.targetScore) return playerBId;
    return null;
  },

  getMatchDisplayText: (gameData) => {
    const data = gameData as DominosGameData;
    return `${data.finalScore.playerA} - ${data.finalScore.playerB} (${data.games.length} games)`;
  },

  getVariantDisplayName: (variant) => {
    return 'Standard';
  },
};
