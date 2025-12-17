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
  minPlayers: 2,        // Pool is strictly 1v1
  maxPlayers: 2,
  variants: ['8-ball', '9-ball'],

  validateMatchData: (data: any): boolean => {
    if (!data || typeof data !== 'object') return false;
    const poolData = data as PoolGameData;
    return POOL_WIN_METHODS.some((m) => m.value === poolData.winMethod);
  },

  validateParticipants: (participants) => {
    // Must be exactly 2 players, exactly 1 winner
    return (
      participants.length === 2 &&
      participants.filter((p) => p.isWinner).length === 1
    );
  },

  determineWinners: (participants) => {
    // Returns array of winner playerIds
    return participants.filter((p) => p.isWinner).map((p) => p.playerId);
  },

  getMatchDisplayText: (participants) => {
    const winner = participants.find((p) => p.isWinner);
    const loser = participants.find((p) => !p.isWinner);
    if (winner && loser) {
      return `${winner.firstName} ${winner.lastName} defeated ${loser.firstName} ${loser.lastName}`;
    }
    return 'Pool match';
  },

  getVariantDisplayName: (variant) => {
    return variant === '8-ball' ? '8-Ball' : '9-Ball';
  },
};
