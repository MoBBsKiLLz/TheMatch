import React, { useState, useCallback } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView } from "@/components/ui/scroll-view";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Card } from "@/components/ui/card";
import { Badge, BadgeText } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Center } from "@/components/ui/center";
import {
  Select,
  SelectTrigger,
  SelectInput,
  SelectIcon,
  SelectPortal,
  SelectBackdrop,
  SelectContent,
  SelectDragIndicatorWrapper,
  SelectDragIndicator,
  SelectItem,
} from "@/components/ui/select";
import { ChevronDownIcon } from "lucide-react-native";
import { Trophy } from "lucide-react-native";
import { Icon } from "@/components/ui/icon";
import { router, useFocusEffect, Href } from "expo-router";
import { useDatabase } from "@/lib/db/provider";
import { League } from "@/types/league";
import { Season } from "@/types/season";
import { Pressable } from "@/components/ui/pressable";

interface TournamentWithDetails {
  id: number;
  seasonId: number;
  leagueId: number;
  name: string;
  format: string;
  status: string;
  championId: number | null;
  createdAt: number;
  leagueName: string;
  seasonName: string;
  championFirstName: string | null;
  championLastName: string | null;
  totalMatches: number;
  completedMatches: number;
}

export default function TournamentsIndex() {
  const { db } = useDatabase();
  const [tournaments, setTournaments] = useState<TournamentWithDetails[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLeague, setSelectedLeague] = useState<string>("all");
  const [selectedSeason, setSelectedSeason] = useState<string>("all");

  const fetchData = async () => {
    if (!db) return;

    try {
      setIsLoading(true);

      // Fetch all leagues
      const leaguesResult = await db.all<League>("SELECT * FROM leagues ORDER BY name ASC");
      setLeagues(leaguesResult);

      // Fetch all seasons
      const seasonsResult = await db.all<Season>("SELECT * FROM seasons ORDER BY createdAt DESC");
      setSeasons(seasonsResult);

      // Fetch all tournaments with details
      const tournamentsResult = await db.all<TournamentWithDetails>(
        `SELECT
          t.*,
          l.name as leagueName,
          s.name as seasonName,
          p.firstName as championFirstName,
          p.lastName as championLastName,
          (SELECT COUNT(*) FROM tournament_matches WHERE tournamentId = t.id) as totalMatches,
          (SELECT COUNT(*) FROM tournament_matches WHERE tournamentId = t.id AND status = 'completed') as completedMatches
        FROM tournaments t
        JOIN leagues l ON t.leagueId = l.id
        JOIN seasons s ON t.seasonId = s.id
        LEFT JOIN players p ON t.championId = p.id
        ORDER BY t.createdAt DESC`
      );

      setTournaments(tournamentsResult);
    } catch (error) {
      console.error("Failed to fetch tournaments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [db])
  );

  // Filter tournaments based on selection
  const filteredTournaments = tournaments.filter((tournament) => {
    if (selectedLeague !== "all" && tournament.leagueId !== Number(selectedLeague)) {
      return false;
    }
    if (selectedSeason !== "all" && tournament.seasonId !== Number(selectedSeason)) {
      return false;
    }
    return true;
  });

  // Filter seasons based on selected league
  const filteredSeasons = seasons.filter((season) => {
    if (selectedLeague === "all") return true;
    return season.leagueId === Number(selectedLeague);
  });

  const handleLeagueChange = (value: string) => {
    setSelectedLeague(value);
    setSelectedSeason("all"); // Reset season when league changes
  };

  const getProgressText = (tournament: TournamentWithDetails) => {
    if (tournament.status === 'completed' && tournament.championFirstName) {
      return `Champion: ${tournament.championFirstName} ${tournament.championLastName}`;
    }
    if (tournament.totalMatches > 0) {
      const progress = Math.round((tournament.completedMatches / tournament.totalMatches) * 100);
      return `${tournament.completedMatches}/${tournament.totalMatches} matches (${progress}%)`;
    }
    return "Not started";
  };

  if (isLoading) {
    return (
      <Center className="flex-1 bg-background-0">
        <VStack space="md" className="items-center">
          <Spinner size="large" />
          <Text className="text-typography-500">Loading tournaments...</Text>
        </VStack>
      </Center>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background-50">
      <ScrollView className="flex-1" contentContainerClassName="p-6">
        <VStack space="2xl">
          {/* Header */}
          <Heading size="3xl" className="text-typography-900">
            Tournaments
          </Heading>

          {/* Filters */}
          <HStack space="md">
            {/* League Filter */}
            <VStack space="xs" className="flex-1">
              <Text size="sm" className="text-typography-700">
                League
              </Text>
              <Select
                selectedValue={selectedLeague}
                onValueChange={handleLeagueChange}
              >
                <SelectTrigger variant="outline" size="md">
                  <SelectInput placeholder="All Leagues" />
                  <SelectIcon className="mr-3" as={ChevronDownIcon} />
                </SelectTrigger>
                <SelectPortal>
                  <SelectBackdrop />
                  <SelectContent>
                    <SelectDragIndicatorWrapper>
                      <SelectDragIndicator />
                    </SelectDragIndicatorWrapper>
                    <SelectItem label="All Leagues" value="all" />
                    {leagues.map((league) => (
                      <SelectItem
                        key={league.id}
                        label={league.name}
                        value={String(league.id)}
                      />
                    ))}
                  </SelectContent>
                </SelectPortal>
              </Select>
            </VStack>

            {/* Season Filter */}
            <VStack space="xs" className="flex-1">
              <Text size="sm" className="text-typography-700">
                Season
              </Text>
              <Select
                selectedValue={selectedSeason}
                onValueChange={setSelectedSeason}
              >
                <SelectTrigger variant="outline" size="md">
                  <SelectInput placeholder="All Seasons" />
                  <SelectIcon className="mr-3" as={ChevronDownIcon} />
                </SelectTrigger>
                <SelectPortal>
                  <SelectBackdrop />
                  <SelectContent>
                    <SelectDragIndicatorWrapper>
                      <SelectDragIndicator />
                    </SelectDragIndicatorWrapper>
                    <SelectItem label="All Seasons" value="all" />
                    {filteredSeasons.map((season) => (
                      <SelectItem
                        key={season.id}
                        label={season.name}
                        value={String(season.id)}
                      />
                    ))}
                  </SelectContent>
                </SelectPortal>
              </Select>
            </VStack>
          </HStack>

          {/* Results Count */}
          <Text size="sm" className="text-typography-500">
            {filteredTournaments.length} {filteredTournaments.length === 1 ? 'tournament' : 'tournaments'} found
          </Text>

          {/* Tournaments List */}
          {filteredTournaments.length === 0 ? (
            <Center className="py-12">
              <VStack space="md" className="items-center">
                <Icon as={Trophy} size="xl" className="text-typography-300" />
                <Text className="text-typography-400 text-center">
                  No tournaments yet.{"\n"}Complete a season to start one!
                </Text>
              </VStack>
            </Center>
          ) : (
            <VStack space="md">
              {filteredTournaments.map((tournament) => (
                <Pressable
                  key={tournament.id}
                  onPress={() =>
                    router.push(
                      `/leagues/${tournament.leagueId}/seasons/${tournament.seasonId}/tournament` as Href
                    )
                  }
                >
                  <Card size="md" variant="outline" className="p-4">
                    <VStack space="md">
                      {/* Tournament Name & Status */}
                      <HStack className="justify-between items-start">
                        <VStack space="xs" className="flex-1">
                          <Text className="text-typography-900 font-semibold text-lg">
                            {tournament.name}
                          </Text>
                          <Text size="sm" className="text-typography-500">
                            {tournament.leagueName} • {tournament.seasonName}
                          </Text>
                        </VStack>
                        <Badge
                          size="md"
                          variant="solid"
                          action={tournament.status === 'active' ? 'success' : 'muted'}
                        >
                          <BadgeText className="capitalize">{tournament.status}</BadgeText>
                        </Badge>
                      </HStack>

                      {/* Progress/Champion */}
                      <Text size="sm" className="text-typography-600">
                        {getProgressText(tournament)}
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
