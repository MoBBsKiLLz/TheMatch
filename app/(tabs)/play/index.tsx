import React, { useCallback, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView } from '@/components/ui/scroll-view';
import { VStack } from '@/components/ui/vstack';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Center } from '@/components/ui/center';
import { useRouter, useFocusEffect } from 'expo-router';
import { useDatabase } from '@/lib/db/provider';
import { getInProgressMatches } from '@/lib/db/matches';
import { getActiveSeries } from '@/lib/db/series';
import { MatchCard } from '@/components/match/MatchCard';
import { SeriesCard } from '@/components/series/SeriesCard';
import { MatchWithParticipants } from '@/types/match';
import { SeriesWithStats } from '@/types/series';

export default function PlayTab() {
  const router = useRouter();
  const { db } = useDatabase();
  const [inProgressMatches, setInProgressMatches] = useState<MatchWithParticipants[]>([]);
  const [activeSeries, setActiveSeries] = useState<SeriesWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadInProgressItems();
    }, [db])
  );

  const loadInProgressItems = async () => {
    if (!db) return;
    setIsLoading(true);
    try {
      const matches = await getInProgressMatches(db);
      const series = await getActiveSeries(db);
      setInProgressMatches(matches);
      setActiveSeries(series);
    } catch (error) {
      console.error('Failed to load in-progress items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background-50">
      <ScrollView className="p-4">
        <VStack space="2xl">
          {/* Quick Start Section */}
          <VStack space="md">
            <Heading size="lg">Quick Start</Heading>
            <Button
              size="lg"
              action="primary"
              onPress={() => router.push('/matches/new')}
            >
              <ButtonText>New Match</ButtonText>
            </Button>
            <Button
              size="lg"
              variant="outline"
              action="secondary"
              onPress={() => router.push('/series/new')}
            >
              <ButtonText>New Series</ButtonText>
            </Button>
          </VStack>

          {/* In Progress Section */}
          {!isLoading && (inProgressMatches.length > 0 || activeSeries.length > 0) && (
            <VStack space="md">
              <Heading size="lg">In Progress</Heading>

              {inProgressMatches.map(match => (
                <MatchCard
                  key={match.id}
                  match={match}
                  onPress={() => router.push(`/matches/${match.id}/continue`)}
                  showActions={false}
                />
              ))}

              {activeSeries.map(series => (
                <SeriesCard
                  key={series.id}
                  series={series}
                  onPress={() => router.push(`/series/${series.id}`)}
                  showActions={false}
                />
              ))}
            </VStack>
          )}

          {/* Empty State */}
          {!isLoading && inProgressMatches.length === 0 && activeSeries.length === 0 && (
            <Center className="py-8">
              <Text className="text-typography-500">
                No in-progress matches or series. Start playing!
              </Text>
            </Center>
          )}

          {isLoading && (
            <Center className="py-8">
              <Spinner size="large" />
            </Center>
          )}
        </VStack>
      </ScrollView>
    </SafeAreaView>
  );
}
