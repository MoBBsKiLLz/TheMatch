import React, { useState, useCallback } from 'react';
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
import { Pressable } from '@/components/ui/pressable';
import { router, useFocusEffect } from 'expo-router';
import { useDatabase } from '@/lib/db/provider';
import { getAllSeries } from '@/lib/db/series';
import { SeriesWithStats } from '@/types/series';
import { logger } from '@/lib/utils/logger';
import { formatGameType } from '@/lib/utils/text';

export default function SeriesList() {
  const { db } = useDatabase();
  const [series, setSeries] = useState<SeriesWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadSeries();
    }, [db])
  );

  const loadSeries = async () => {
    if (!db) return;
    try {
      setIsLoading(true);
      const data = await getAllSeries(db);
      setSeries(data);
    } catch (error) {
      logger.error('Failed to load series:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background-0">
      <ScrollView className="flex-1" contentContainerClassName="p-6">
        <VStack space="xl">
          <HStack className="justify-between items-center">
            <Heading size="3xl">Series</Heading>
            <Button
              action="primary"
              onPress={() => router.push('/series/new')}
            >
              <ButtonText>Create Series</ButtonText>
            </Button>
          </HStack>

          {isLoading ? (
            <Center className="py-12">
              <Spinner size="large" />
            </Center>
          ) : series.length === 0 ? (
            <Center className="py-12">
              <VStack space="md" className="items-center">
                <Text className="text-typography-500 text-center">
                  No series yet
                </Text>
                <Text size="sm" className="text-typography-400 text-center max-w-[300px]">
                  Create a series to group related matches together, like a "Best of 3" with friends
                </Text>
              </VStack>
            </Center>
          ) : (
            <VStack space="md">
              {series.map(s => (
                <Pressable
                  key={s.id}
                  onPress={() => router.push(`/series/${s.id}`)}
                >
                  <Card
                    size="md"
                    variant="outline"
                    className="p-4"
                  >
                    <VStack space="sm">
                      <HStack className="justify-between items-start">
                        <VStack className="flex-1">
                          <Heading size="md">{s.name}</Heading>
                          {s.description && (
                            <Text size="sm" className="text-typography-500">
                              {s.description}
                            </Text>
                          )}
                        </VStack>
                        <Badge
                          variant="solid"
                          action={s.status === 'active' ? 'success' : 'muted'}
                        >
                          <BadgeText>{s.status === 'active' ? 'Active' : 'Completed'}</BadgeText>
                        </Badge>
                      </HStack>

                      <HStack space="md" className="flex-wrap">
                        <Text size="sm" className="text-typography-600">
                          {s.matchCount} {s.matchCount === 1 ? 'Match' : 'Matches'}
                        </Text>
                        <Text size="sm" className="text-typography-600">
                          {s.playerCount} {s.playerCount === 1 ? 'Player' : 'Players'}
                        </Text>
                        <Text size="sm" className="text-typography-500">
                          {formatGameType(s.gameType)}
                        </Text>
                      </HStack>

                      <Text size="xs" className="text-typography-400">
                        Started {new Date(s.startDate).toLocaleDateString()}
                      </Text>
                    </VStack>
                  </Card>
                </Pressable>
              ))}
            </VStack>
          )}
        </VStack>
      </ScrollView>
    </SafeAreaView>
  );
}
