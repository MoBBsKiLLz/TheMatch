import React, { useEffect, useState } from 'react';
import { VStack } from './ui/vstack';
import { HStack } from './ui/hstack';
import { Text } from './ui/text';
import { Badge, BadgeText } from './ui/badge';
import { Card } from './ui/card';
import { Pressable } from 'react-native';
import { LeaderboardEntry } from '@/lib/db/leaderboard';
import { router, Href } from 'expo-router';
import { useDatabase } from '@/lib/db/provider';
import { getPlayerStats, formatStreak } from '@/lib/db/stats';

type LeaderboardProps = {
  entries: LeaderboardEntry[];
  leagueId: number;
  showRank?: boolean;
};

export function Leaderboard({ entries, leagueId, showRank = true }: LeaderboardProps) {
  const { db } = useDatabase();
  const [streaks, setStreaks] = useState<Map<number, number>>(new Map());

  useEffect(() => {
    async function loadStreaks() {
      if (!db) return;

      const streakMap = new Map<number, number>();
      for (const entry of entries) {
        const stats = await getPlayerStats(db, entry.playerId, leagueId);
        streakMap.set(entry.playerId, stats.currentStreak);
      }
      setStreaks(streakMap);
    }

    loadStreaks();
  }, [db, entries, leagueId]);

  const handlePlayerPress = (playerId: number) => {
    router.push(`/players/${playerId}` as Href);
  };

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return 'warning'; // Gold
    if (rank === 2) return 'muted';   // Silver
    if (rank === 3) return 'info';    // Bronze
    return 'muted';
  };

  if (entries.length === 0) {
    return (
      <Card size="md" variant="outline" className="p-4">
        <Text className="text-typography-500 text-center">
          No players have recorded matches yet.
        </Text>
      </Card>
    );
  }

  return (
    <VStack space="sm">
      {entries.map((entry) => {
        const streak = streaks.get(entry.playerId) || 0;
        
        return (
          <Pressable key={entry.playerId} onPress={() => handlePlayerPress(entry.playerId)}>
            <Card size="sm" variant="outline" className="p-3">
              <HStack className="items-center justify-between">
                <HStack space="md" className="items-center flex-1">
                  {showRank && (
                    <Badge
                      size="md"
                      variant="solid"
                      action={getRankBadgeColor(entry.rank)}
                      className="w-8 h-8 rounded-full items-center justify-center"
                    >
                      <BadgeText className="font-bold">{entry.rank}</BadgeText>
                    </Badge>
                  )}

                  <VStack space="xs" className="flex-1">
                    <Text className="text-typography-900 font-semibold">
                      {entry.firstName} {entry.lastName}
                    </Text>
                    <HStack space="sm" className="items-center">
                      <Text size="xs" className="text-typography-500">
                        {entry.wins}W-{entry.losses}L
                      </Text>
                      <Text size="xs" className="text-typography-400">
                        •
                      </Text>
                      <Text size="xs" className="text-typography-500">
                        {entry.gamesPlayed} GP
                      </Text>
                      {streak !== 0 && (
                        <>
                          <Text size="xs" className="text-typography-400">
                            •
                          </Text>
                          <Text
                            size="xs"
                            className={`font-semibold ${
                              streak > 0 ? 'text-success-600' : 'text-error-600'
                            }`}
                          >
                            {formatStreak(streak)}
                          </Text>
                        </>
                      )}
                    </HStack>
                  </VStack>
                </HStack>

                <VStack space="xs" className="items-end">
                  <Text className="text-typography-900 font-bold text-lg">
                    {entry.wins}
                  </Text>
                  <Text size="xs" className="text-typography-500">
                    {entry.winPercentage.toFixed(1)}%
                  </Text>
                </VStack>
              </HStack>
            </Card>
          </Pressable>
        );
      })}
    </VStack>
  );
}