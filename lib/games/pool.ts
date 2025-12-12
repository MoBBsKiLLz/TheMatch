import { GameConfig } from './types';
import { PoolGameData, PoolWinMethod } from '@/types/games';

export const POOL_WIN_METHODS: { value: PoolWinMethod; label: string }[] = [
  { value: 'made_all_balls', label: 'Made all balls' },
  { value: 'opponent_fouled_8ball', label: 'Opponent fouled on 8-ball' },
  { value: 'opponent_scratched_8ball', label: 'Opponent scratched on 8-ball' },
  { value: 'opponent_scratched', label: 'Opponent scratched' },
  { value: 'other_foul', label: 'Other foul' },
];

export const poolConfig: GameConfig = {
  type: 'pool',
  name: 'Pool',
  variants: ['8-ball', '9-ball'],

  validateMatchData: (data: any): boolean => {
    if (!data || typeof data !== 'object') return false;
    const poolData = data as PoolGameData;
    return POOL_WIN_METHODS.some((m) => m.value === poolData.winMethod);
  },

  determineWinner: (gameData, playerAId, playerBId) => {
    // Pool is simple - winner already determined by user
    return null; // Handled at UI level
  },

  getMatchDisplayText: (gameData) => {
    const data = gameData as PoolGameData;
    const method = POOL_WIN_METHODS.find((m) => m.value === data.winMethod);
    return method ? method.label : 'Standard win';
  },

  getVariantDisplayName: (variant) => {
    return variant === '8-ball' ? '8-Ball' : '9-Ball';
  },
};
