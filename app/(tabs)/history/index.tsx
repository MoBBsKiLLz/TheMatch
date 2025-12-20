import React, { useState, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView } from '@/components/ui/scroll-view';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge, BadgeText } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Center } from '@/components/ui/center';
import { useRouter, useFocusEffect } from 'expo-router';
import { useDatabase } from '@/lib/db/provider';
import { getCompletedMatches } from '@/lib/db/matches';
import { getCompletedSeries } from '@/lib/db/series';
import { getCompletedTournaments, TournamentWithNames } from '@/lib/db/tournaments';
import { MatchCard } from '@/components/match/MatchCard';
import { SeriesCard } from '@/components/series/SeriesCard';
import { MatchFilters } from '@/components/match/MatchFilters';
import { MatchWithParticipants } from '@/types/match';
import { SeriesWithStats } from '@/types/series';
import { League } from '@/types/league';
import { Season } from '@/types/season';

type HistoryView = 'matches' | 'series' | 'tournaments';

export default function HistoryTab() {
  const router = useRouter();
  const { db } = useDatabase();
  const [selectedView, setSelectedView] = useState<HistoryView>('matches');
  const [completedMatches, setCompletedMatches] = useState<MatchWithParticipants[]>([]);
  const [completedSeries, setCompletedSeries] = useState<SeriesWithStats[]>([]);
  const [completedTournaments, setCompletedTournaments] = useState<TournamentWithNames[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter states (for matches view)
  const [selectedLeague, setSelectedLeague] = useState<string>('all');
  const [selectedSeason, setSelectedSeason] = useState<string>('all');
  const [leagues, setLeagues] = useState<League[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [db, selectedView, selectedLeague, selectedSeason])
  );

  const loadData = async () => {
    if (!db) return;
    setIsLoading(true);

    try {
      if (selectedView === 'matches') {
        const leagueId = selectedLeague === 'all' || selectedLeague === 'standalone'
          ? undefined
          : Number(selectedLeague);
        const seasonId = selectedSeason === 'all' ? undefined : Number(selectedSeason);
        const matches = await getCompletedMatches(db, leagueId, seasonId);
        setCompletedMatches(matches);

        // Load leagues/seasons for filters
        const leaguesData = await db.all<League>('SELECT * FROM leagues ORDER BY name ASC');
        setLeagues(leaguesData);

        // Load seasons based on selected league
        if (selectedLeague !== 'all' && selectedLeague !== 'standalone') {
          const seasonsData = await db.all<Season>(
            'SELECT * FROM seasons WHERE leagueId = ? ORDER BY createdAt DESC',
            [Number(selectedLeague)]
          );
          setSeasons(seasonsData);
        } else {
          setSeasons([]);
        }
      } else if (selectedView === 'series') {
        const series = await getCompletedSeries(db);
        setCompletedSeries(series);
      } else if (selectedView === 'tournaments') {
        const tournaments = await getCompletedTournaments(db);
        setCompletedTournaments(tournaments);
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeagueChange = (value: string) => {
    setSelectedLeague(value);
    setSelectedSeason('all'); // Reset season when league changes
  };

  return (
    <SafeAreaView className="flex-1 bg-background-50">
      <ScrollView className="p-4">
        <VStack space="xl">
          {/* View Switcher */}
          <HStack space="sm" className="justify-between">
            <Button
              variant={selectedView === 'matches' ? 'solid' : 'outline'}
              onPress={() => setSelectedView('matches')}
              size="md"
            >
              <ButtonText>Matches</ButtonText>
            </Button>
            <Button
              variant={selectedView === 'series' ? 'solid' : 'outline'}
              onPress={() => setSelectedView('series')}
              size="md"
            >
              <ButtonText>Series</ButtonText>
            </Button>
            <Button
              variant={selectedView === 'tournaments' ? 'solid' : 'outline'}
              onPress={() => setSelectedView('tournaments')}
              size="md"
            >
              <ButtonText>Tournaments</ButtonText>
            </Button>
          </HStack>

          {/* Filters (for matches view) */}
          {selectedView === 'matches' && (
            <MatchFilters
              leagues={leagues}
              seasons={seasons}
              selectedLeague={selectedLeague}
              selectedSeason={selectedSeason}
              onLeagueChange={handleLeagueChange}
              onSeasonChange={setSelectedSeason}
            />
          )}

          {/* Loading State */}
          {isLoading && (
            <Center className="py-8">
              <Spinner size="large" />
            </Center>
          )}

          {/* Matches View */}
          {!isLoading && selectedView === 'matches' && (
            <VStack space="md">
              {completedMatches.length === 0 && (
                <Center className="py-8">
                  <Text className="text-typography-500">No completed matches yet.</Text>
                </Center>
              )}
              {completedMatches.map(match => (
                <MatchCard
                  key={match.id}
                  match={match}
                  onPress={() => router.push(`/matches/${match.id}`)}
                  showActions={false}
                />
              ))}
            </VStack>
          )}

          {/* Series View */}
          {!isLoading && selectedView === 'series' && (
            <VStack space="md">
              {completedSeries.length === 0 && (
                <Center className="py-8">
                  <Text className="text-typography-500">No completed series yet.</Text>
                </Center>
              )}
              {completedSeries.map(series => (
                <SeriesCard
                  key={series.id}
                  series={series}
                  onPress={() => router.push(`/series/${series.id}`)}
                  showActions={false}
                />
              ))}
            </VStack>
          )}

          {/* Tournaments View */}
          {!isLoading && selectedView === 'tournaments' && (
            <VStack space="md">
              {completedTournaments.length === 0 && (
                <Center className="py-8">
                  <Text className="text-typography-500">No completed tournaments yet.</Text>
                </Center>
              )}
              {completedTournaments.map(tournament => (
                <Card
                  key={tournament.id}
                  size="md"
                  variant="elevated"
                  className="p-4"
                >
                  <VStack space="sm">
                    <Heading size="md">{tournament.leagueName}</Heading>
                    <Text className="text-typography-600">{tournament.seasonName}</Text>
                    <Badge size="sm" variant="solid" action="success">
                      <BadgeText>Completed</BadgeText>
                    </Badge>
                    <Button
                      size="sm"
                      action="primary"
                      onPress={() => router.push(
                        `/leagues/${tournament.leagueId}/seasons/${tournament.seasonId}/tournament`
                      )}
                    >
                      <ButtonText>View Tournament</ButtonText>
                    </Button>
                  </VStack>
                </Card>
              ))}
            </VStack>
          )}
        </VStack>
      </ScrollView>
    </SafeAreaView>
  );
}
