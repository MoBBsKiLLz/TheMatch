import { GameConfig } from './types';
import { UnoGameData } from '@/types/games';

export const unoConfig: GameConfig = {
  type: 'uno',
  name: 'Uno',
  minPlayers: 2,
  maxPlayers: 10,       // Uno can support up to 10 players
  variants: ['standard'],

  validateMatchData: (data: any): boolean => {
    if (!data || typeof data !== 'object') return false;
    const unoData = data as UnoGameData;

    return (
      Array.isArray(unoData.games) &&
      unoData.games.length > 0 &&
      unoData.games.every(
        (g) =>
          Array.isArray(g.scores) &&
          g.scores.length >= 2 &&
          g.scores.length <= 10 &&
          g.scores.every((s) => typeof s === 'number') &&
          typeof g.winnerId === 'number'
      ) &&
      Array.isArray(unoData.finalScores) &&
      unoData.finalScores.length >= 2 &&
      unoData.finalScores.length <= 10 &&
      unoData.finalScores.every((s) => typeof s === 'number') &&
      typeof unoData.targetScore === 'number'
    );
  },

  validateParticipants: (participants) => {
    // 2-10 players, must have at least 1 winner
    return (
      participants.length >= 2 &&
      participants.length <= 10 &&
      participants.filter((p) => p.isWinner).length >= 1
    );
  },

  determineWinners: (participants) => {
    // Winner determined by who reached target score first
    return participants.filter((p) => p.isWinner).map((p) => p.playerId);
  },

  getMatchDisplayText: (participants) => {
    const winner = participants.find((p) => p.isWinner);
    if (winner && winner.score) {
      return `${winner.firstName} ${winner.lastName} won with ${winner.score} points (${participants.length} players)`;
    }
    return 'Uno match';
  },

  getVariantDisplayName: (variant) => {
    return 'Standard';
  },
};
