import { Database } from './client';
import { CustomGameConfig } from '@/types/customGame';
import { insert, update, remove, findById } from './queries';

// Database representation with integers instead of booleans
type CustomGameConfigDb = Omit<CustomGameConfig, 'trackIndividualGames' | 'allowNegativeScores'> & {
  trackIndividualGames: number;
  allowNegativeScores: number;
};

export async function createCustomGameConfig(
  db: Database,
  config: Omit<CustomGameConfig, 'id' | 'createdAt'>
): Promise<number> {
  const id = await insert(db, 'custom_game_configs', {
    ...config,
    trackIndividualGames: config.trackIndividualGames ? 1 : 0,
    allowNegativeScores: config.allowNegativeScores ? 1 : 0,
    createdAt: Date.now(),
  });

  if (!id) {
    throw new Error('Failed to create custom game configuration');
  }

  return id;
}

export async function updateCustomGameConfig(
  db: Database,
  id: number,
  config: Partial<Omit<CustomGameConfig, 'id' | 'createdAt'>>
): Promise<void> {
  const updates: Record<string, string | number> = {};

  // Copy all non-boolean properties
  if (config.name !== undefined) updates.name = config.name;
  if (config.description !== undefined) updates.description = config.description;
  if (config.scoringMethod !== undefined) updates.scoringMethod = config.scoringMethod;
  if (config.winCondition !== undefined) updates.winCondition = config.winCondition;
  if (config.targetValue !== undefined) updates.targetValue = config.targetValue;
  if (config.minPlayers !== undefined) updates.minPlayers = config.minPlayers;
  if (config.maxPlayers !== undefined) updates.maxPlayers = config.maxPlayers;
  if (config.pointsPerWin !== undefined) updates.pointsPerWin = config.pointsPerWin;

  // Convert booleans to integers
  if (typeof config.trackIndividualGames === 'boolean') {
    updates.trackIndividualGames = config.trackIndividualGames ? 1 : 0;
  }
  if (typeof config.allowNegativeScores === 'boolean') {
    updates.allowNegativeScores = config.allowNegativeScores ? 1 : 0;
  }

  await update(db, 'custom_game_configs', id, updates);
}

export async function deleteCustomGameConfig(
  db: Database,
  id: number
): Promise<void> {
  // Check if any leagues are using this config
  const leagues = await db.all(
    'SELECT id FROM leagues WHERE gameType = ? AND customGameConfigId = ?',
    ['custom', id]
  );

  if (leagues.length > 0) {
    throw new Error(
      'Cannot delete custom game configuration that is being used by leagues'
    );
  }

  await remove(db, 'custom_game_configs', id);
}

export async function getCustomGameConfig(
  db: Database,
  id: number
): Promise<CustomGameConfig | null> {
  const config = await findById<CustomGameConfigDb>(db, 'custom_game_configs', id);

  if (!config) return null;

  // Convert integers back to booleans
  return {
    ...config,
    trackIndividualGames: config.trackIndividualGames === 1,
    allowNegativeScores: config.allowNegativeScores === 1,
  };
}

export async function getAllCustomGameConfigs(
  db: Database
): Promise<CustomGameConfig[]> {
  const configs = await db.all<CustomGameConfigDb>(
    'SELECT * FROM custom_game_configs ORDER BY name ASC'
  );

  return configs.map((config) => ({
    ...config,
    trackIndividualGames: config.trackIndividualGames === 1,
    allowNegativeScores: config.allowNegativeScores === 1,
  }));
}
