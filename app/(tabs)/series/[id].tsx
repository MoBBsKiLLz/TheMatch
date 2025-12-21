import React, { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView } from '@/components/ui/scroll-view';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Center } from '@/components/ui/center';
import { Badge, BadgeText } from '@/components/ui/badge';
import { Divider } from '@/components/ui/divider';
import { Pressable } from '@/components/ui/pressable';
import { router, useLocalSearchParams, useFocusEffect, Href } from 'expo-router';
import { useDatabase } from '@/lib/db/provider';
import { getSeriesById, getSeriesStandings, getSeriesMatches, completeSeries, deleteSeries, getSeriesPlayers } from '@/lib/db/series';
import { Series, SeriesStanding } from '@/types/series';
import { MatchWithParticipants } from '@/types/match';
import { logger } from '@/lib/utils/logger';
import { formatGameType, capitalize, formatPersonName } from '@/lib/utils/text';

export default function SeriesDetail() {
  const { db } = useDatabase();
  const { id } = useLocalSearchParams<{ id: string }>();
  const seriesId = Number(id);

  const [series, setSeries] = useState<Series | null>(null);
  const [standings, setStandings] = useState<SeriesStanding[]>([]);
  const [matches, setMatches] = useState<MatchWithParticipants[]>([]);
  const [seriesPlayers, setSeriesPlayers] = useState<{ id: number; firstName: string; lastName: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadSeriesData();
    }, [db, seriesId])
  );

  const loadSeriesData = async () => {
    if (!db) return;
    try {
      setIsLoading(true);
      const [seriesData, standingsData, matchesData, playersData] = await Promise.all([
        getSeriesById(db, seriesId),
        getSeriesStandings(db, seriesId),
        getSeriesMatches(db, seriesId),
        getSeriesPlayers(db, seriesId),
      ]);

      setSeries(seriesData);
      setStandings(standingsData);
      setMatches(matchesData);
      setSeriesPlayers(playersData);
    } catch (error) {
      logger.error('Failed to load series data:', error);
      Alert.alert('Error', 'Failed to load series');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteSeries = async () => {
    if (!db || !series) return;

    Alert.alert(
      'Complete Series',
      'Are you sure you want to mark this series as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            try {
              await completeSeries(db, seriesId);
              await loadSeriesData();
            } catch (error) {
              logger.error('Failed to complete series:', error);
              Alert.alert('Error', 'Failed to complete series');
            }
          },
        },
      ]
    );
  };

  const handleDeleteSeries = async () => {
    if (!db || !series) return;

    Alert.alert(
      'Delete Series',
      'Are you sure? Matches will remain but will no longer be grouped in this series.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSeries(db, seriesId);
              router.back();
            } catch (error) {
              logger.error('Failed to delete series:', error);
              Alert.alert('Error', 'Failed to delete series');
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background-0">
        <Center className="flex-1">
          <Spinner size="large" />
        </Center>
      </SafeAreaView>
    );
  }

  if (!series) {
    return (
      <SafeAreaView className="flex-1 bg-background-0">
        <Center className="flex-1">
          <Text>Series not found</Text>
        </Center>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background-0">
      <ScrollView className="flex-1" contentContainerClassName="p-6">
        <VStack space="2xl">
          {/* Header */}
          <VStack space="md">
            <HStack className="justify-between items-start">
              <VStack className="flex-1">
                <Heading size="3xl">{series.name}</Heading>
                {series.description && (
                  <Text className="text-typography-500 mt-1">
                    {series.description}
                  </Text>
                )}
              </VStack>
              <Badge
                variant="solid"
                action={series.status === 'active' ? 'success' : 'muted'}
              >
                <BadgeText>{series.status === 'active' ? 'Active' : 'Completed'}</BadgeText>
              </Badge>
            </HStack>

            <HStack space="md">
              <Text size="sm" className="text-typography-500">
                {formatGameType(series.gameType)}
              </Text>
              <Text size="sm" className="text-typography-500">
                Started {new Date(series.startDate).toLocaleDateString()}
              </Text>
              {series.endDate && (
                <Text size="sm" className="text-typography-500">
                  Ended {new Date(series.endDate).toLocaleDateString()}
                </Text>
              )}
            </HStack>
          </VStack>

          <Divider />

          {/* Series Players */}
          <VStack space="lg">
            <Heading size="lg">Players ({seriesPlayers.length})</Heading>
            {seriesPlayers.length === 0 ? (
              <Text className="text-typography-500">No players added yet. Players are needed to record matches.</Text>
            ) : (
              <HStack space="md" className="flex-wrap">
                {seriesPlayers.map(player => (
                  <Badge key={player.id} size="lg" variant="solid" action="info">
                    <BadgeText>{player.firstName} {player.lastName}</BadgeText>
                  </Badge>
                ))}
              </HStack>
            )}
          </VStack>

          <Divider />

          {/* Standings */}
          <VStack space="lg">
            <Heading size="lg">Standings</Heading>
            {standings.length === 0 ? (
              <Text className="text-typography-500">No matches recorded yet</Text>
            ) : (
              <Card variant="outline" className="p-0 overflow-hidden">
                <VStack>
                  {standings.map((standing, index) => (
                    <React.Fragment key={standing.playerId}>
                      {index > 0 && <Divider />}
                      <HStack className="p-4 justify-between items-center">
                        <HStack space="md" className="flex-1 items-center">
                          <Text className="font-bold text-lg w-8">
                            #{index + 1}
                          </Text>
                          <VStack className="flex-1">
                            <Text className="font-semibold">
                              {standing.firstName} {standing.lastName}
                            </Text>
                            <Text size="sm" className="text-typography-500">
                              {standing.gamesPlayed} {standing.gamesPlayed === 1 ? 'match' : 'matches'}
                            </Text>
                          </VStack>
                        </HStack>
                        <HStack space="md" className="items-center">
                          <VStack className="items-end">
                            <Text className="font-bold text-success-600">
                              {standing.wins}W
                            </Text>
                            <Text className="text-typography-500">
                              {standing.losses}L
                            </Text>
                          </VStack>
                          <Text className="font-bold text-lg w-16 text-right">
                            {standing.winPercentage.toFixed(1)}%
                          </Text>
                        </HStack>
                      </HStack>
                    </React.Fragment>
                  ))}
                </VStack>
              </Card>
            )}
          </VStack>

          <Divider />

          {/* Matches */}
          <VStack space="lg">
            <HStack className="justify-between items-center">
              <Heading size="lg">Matches ({matches.length})</Heading>
              <Button
                size="sm"
                onPress={() => {
                  // Pass seriesId, gameType, and playerIds to pre-fill match form
                  const playerParams = seriesPlayers.length === 2
                    ? `&playerAId=${seriesPlayers[0].id}&playerBId=${seriesPlayers[1].id}`
                    : '';
                  router.push(`/matches/new?seriesId=${seriesId}&gameType=${series?.gameType}${playerParams}` as Href);
                }}
                isDisabled={seriesPlayers.length < 2}
              >
                <ButtonText>Add Match</ButtonText>
              </Button>
            </HStack>
            {seriesPlayers.length < 2 && (
              <Text size="sm" className="text-error-600">
                Add at least 2 players to record matches
              </Text>
            )}

            {matches.length === 0 ? (
              <Text className="text-typography-500">No matches yet</Text>
            ) : (
              <VStack space="md">
                {matches.map(match => {
                  const winner = match.participants?.find(p => p.isWinner);
                  return (
                    <Pressable
                      key={match.id}
                      onPress={() => router.push(`/matches/${match.id}`)}
                    >
                      <Card size="sm" variant="outline" className="p-3">
                        <VStack space="xs">
                          <HStack className="justify-between items-start">
                            <VStack className="flex-1">
                              <Text className="font-semibold">
                                {formatGameType(match.gameType)}
                                {match.gameVariant && ` - ${capitalize(match.gameVariant)}`}
                              </Text>
                              {winner && (
                                <Text size="sm" className="text-success-600">
                                  Winner: {formatPersonName(winner.firstName, winner.lastName)}
                                </Text>
                              )}
                            </VStack>
                            {match.quickEntryMode === 1 && (
                              <Badge size="sm" variant="outline">
                                <BadgeText>Quick Entry</BadgeText>
                              </Badge>
                            )}
                          </HStack>
                          <Text size="xs" className="text-typography-400">
                            {new Date(match.date).toLocaleDateString()}
                          </Text>
                        </VStack>
                      </Card>
                    </Pressable>
                  );
                })}
              </VStack>
            )}
          </VStack>

          <Divider />

          {/* Actions */}
          <VStack space="md">
            {series.status === 'active' && (
              <Button
                action="positive"
                onPress={handleCompleteSeries}
              >
                <ButtonText>Complete Series</ButtonText>
              </Button>
            )}
            <Button
              action="negative"
              variant="outline"
              onPress={handleDeleteSeries}
            >
              <ButtonText>Delete Series</ButtonText>
            </Button>
          </VStack>
        </VStack>
      </ScrollView>
    </SafeAreaView>
  );
}
