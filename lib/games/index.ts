import { GameRegistry, GameConfig } from './types';
import { poolConfig } from './pool';
import { dartsConfig } from './darts';
import { dominosConfig } from './dominos';
import { unoConfig } from './uno';
import { GameType } from '@/types/league';
import { Match, ParsedMatch } from '@/types/match';

export const gameRegistry: GameRegistry = {
  pool: poolConfig,
  darts: dartsConfig,
  dominos: dominosConfig,
  uno: unoConfig,
};

export function getGameConfig(gameType: GameType): GameConfig {
  return gameRegistry[gameType];
}

export function parseGameData(match: Match): ParsedMatch {
  if (!match.gameData) return match;

  try {
    const parsed = JSON.parse(match.gameData);
    return { ...match, parsedGameData: parsed };
  } catch (e) {
    console.error('Failed to parse game data:', e);
    return match;
  }
}

// Re-export everything
export * from './pool';
export * from './darts';
export * from './dominos';
export * from './uno';
export * from './types';
