import { GameConfig } from './types';
import { DominosGameData } from '@/types/games';

export const dominosConfig: GameConfig = {
  type: 'dominos',
  name: 'Dominos',
  minPlayers: 2,        // Can be 2 players (1v1)
  maxPlayers: 4,        // Or up to 4 players (common for dominos)
  variants: ['standard'],

  validateMatchData: (data: any): boolean => {
    if (!data || typeof data !== 'object') return false;
    const dominosData = data as DominosGameData;

    return (
      Array.isArray(dominosData.games) &&
      dominosData.games.length > 0 &&
      dominosData.games.every(
        (g) =>
          Array.isArray(g.scores) &&
          g.scores.length >= 2 &&
          g.scores.length <= 4 &&
          g.scores.every((s) => typeof s === 'number') &&
          typeof g.winnerId === 'number' &&
          // pips is optional, but if present must be an array of numbers
          (g.pips === undefined || (
            Array.isArray(g.pips) &&
            g.pips.length === g.scores.length &&
            g.pips.every((p) => typeof p === 'number')
          ))
      ) &&
      Array.isArray(dominosData.finalScores) &&
      dominosData.finalScores.length >= 2 &&
      dominosData.finalScores.length <= 4 &&
      dominosData.finalScores.every((s) => typeof s === 'number') &&
      typeof dominosData.targetScore === 'number'
    );
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
    // Winner determined by who reached target score
    return participants.filter((p) => p.isWinner).map((p) => p.playerId);
  },

  getMatchDisplayText: (participants) => {
    const winner = participants.find((p) => p.isWinner);
    if (participants.length === 2) {
      const loser = participants.find((p) => !p.isWinner);
      if (winner && loser && winner.score && loser.score) {
        return `${winner.firstName} ${winner.lastName}: ${winner.score} - ${loser.firstName} ${loser.lastName}: ${loser.score}`;
      }
    } else {
      // Multi-player
      if (winner && winner.score) {
        return `${winner.firstName} ${winner.lastName} won with ${winner.score} points (${participants.length} players)`;
      }
    }
    return 'Dominos match';
  },

  getVariantDisplayName: (variant) => {
    return 'Standard';
  },
};
