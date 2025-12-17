import React, { useCallback, useState } from "react";
import { RefreshControl, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView } from "@/components/ui/scroll-view";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { Button, ButtonText } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Fab, FabIcon } from "@/components/ui/fab";
import { AddIcon } from "@/components/ui/icon";
import { Spinner } from "@/components/ui/spinner";
import { Center } from "@/components/ui/center";
import { Badge, BadgeText } from "@/components/ui/badge";
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
import { ChevronDownIcon } from "@/components/ui/icon";
import { useRouter, useFocusEffect, Href } from "expo-router";
import { useDatabase } from "@/lib/db/provider";
import { MatchWithDetails } from "@/types/match";
import { League } from "@/types/league";
import { Season } from "@/types/season";
import { getMatchesWithDetails, deleteMatch } from "@/lib/db/matches";
import { Icon } from "@/components/ui/icon";
import { Eye, Trash2 } from "lucide-react-native";

export default function Matches() {
  const router = useRouter();
  const { db, isLoading: dbLoading } = useDatabase();
  const [matches, setMatches] = useState<MatchWithDetails[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedLeague, setSelectedLeague] = useState<string>("all");
  const [selectedSeason, setSelectedSeason] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    if (!db) return;

    try {
      // Fetch leagues for filter
      const leagueResults = await db.all<League>(
        "SELECT * FROM leagues ORDER BY name ASC"
      );
      setLeagues(leagueResults);

      // Handle standalone matches filter
      if (selectedLeague === "standalone") {
        // Fetch only standalone matches (leagueId IS NULL)
        const matchResults = await db.all<MatchWithDetails>(
          `SELECT m.*, NULL as leagueName
           FROM matches m
           WHERE m.leagueId IS NULL
           ORDER BY m.date DESC, m.createdAt DESC`
        );

        // Get participants for each match
        const matchesWithParticipants: MatchWithDetails[] = [];
        for (const match of matchResults) {
          const participants = await db.all<any>(
            `SELECT mp.*, p.firstName, p.lastName
             FROM match_participants mp
             INNER JOIN players p ON mp.playerId = p.id
             WHERE mp.matchId = ?
             ORDER BY mp.seatIndex ASC`,
            [match.id]
          );
          matchesWithParticipants.push({
            ...match,
            participants: participants.map((p: any) => ({
              ...p,
              isWinner: p.isWinner === 1,
            })),
          });
        }

        setMatches(matchesWithParticipants);
        setSeasons([]); // No seasons for standalone matches
      } else {
        // Fetch seasons (filtered by league if selected)
        const leagueId = selectedLeague === "all" ? undefined : Number(selectedLeague);
        const seasonQuery = leagueId
          ? "SELECT * FROM seasons WHERE leagueId = ? ORDER BY startDate DESC"
          : "SELECT * FROM seasons ORDER BY startDate DESC";
        const seasonParams = leagueId ? [leagueId] : [];
        const seasonResults = await db.all<Season>(seasonQuery, seasonParams);
        setSeasons(seasonResults);

        // Fetch matches (filtered by league and/or season)
        const seasonId = selectedSeason === "all" ? undefined : Number(selectedSeason);
        const matchResults = await getMatchesWithDetails(db, leagueId, seasonId);
        setMatches(matchResults);
      }
    } catch (error) {
      console.error("Failed to fetch matches: ", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (db) {
        setIsLoading(true);
        fetchData();
      }
    }, [db, selectedLeague, selectedSeason])
  );

  // Reset season filter when league changes
  const handleLeagueChange = (value: string) => {
    setSelectedLeague(value);
    setSelectedSeason("all"); // Reset season when league changes
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleDelete = (match: MatchWithDetails) => {
    Alert.alert(
      "Delete Match",
      `Delete this match? Win/loss records will be adjusted.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (!db) return;
            try {
              await deleteMatch(db, match.id);
              fetchData();
            } catch (error) {
              console.error("Failed to delete match: ", error);
              Alert.alert("Error", "Failed to delete match");
            }
          },
        },
      ]
    );
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getMatchResult = (match: MatchWithDetails) => {
    const winners = match.participants.filter((p) => p.isWinner);

    if (winners.length === 0) {
      return "No winner recorded";
    }

    if (winners.length === 1) {
      return `${winners[0].firstName} ${winners[0].lastName} won`;
    }

    // Multiple winners (e.g., team game)
    return `${winners.map((w) => `${w.firstName} ${w.lastName}`).join(", ")} won`;
  };

  const handleViewMatch = (matchId: number) => {
    router.push(`/matches/${matchId}` as Href);
  };

  if (dbLoading || isLoading) {
    return (
      <Center className="flex-1 bg-background-0">
        <VStack space="md" className="items-center">
          <Spinner size="large" />
          <Text className="text-typography-500">Loading Matches...</Text>
        </VStack>
      </Center>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background-50">
      <ScrollView
        className="flex-1"
        contentContainerClassName="p-5"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <VStack space="lg">
          <Heading size="2xl" className="text-typography-900">
            Matches
          </Heading>

          {/* Filters */}
          <VStack space="md">
            {/* League Filter - Always show (includes standalone option) */}
            <Select
              selectedValue={selectedLeague}
              onValueChange={handleLeagueChange}
            >
              <SelectTrigger variant="outline" size="lg">
                <SelectInput
                  className="flex-1"
                  placeholder="Filter by league"
                  value={
                    selectedLeague === "all"
                      ? "All Matches"
                      : selectedLeague === "standalone"
                      ? "Standalone Matches"
                      : leagues.find((l) => String(l.id) === selectedLeague)?.name || ""
                  }
                />
                <SelectIcon as={ChevronDownIcon} className="ml-auto mr-3" />
              </SelectTrigger>
              <SelectPortal>
                <SelectBackdrop />
                <SelectContent>
                  <SelectDragIndicatorWrapper>
                    <SelectDragIndicator />
                  </SelectDragIndicatorWrapper>
                  <SelectItem label="All Matches" value="all" />
                  <SelectItem label="Standalone Matches" value="standalone" />
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

              {/* Season Filter */}
              {seasons.length > 0 && (
                <Select
                  selectedValue={selectedSeason}
                  onValueChange={setSelectedSeason}
                >
                  <SelectTrigger variant="outline" size="lg">
                    <SelectInput
                      className="flex-1"
                      placeholder="Filter by season"
                      value={
                        selectedSeason === "all"
                          ? "All Seasons"
                          : seasons.find((s) => String(s.id) === selectedSeason)?.name || ""
                      }
                    />
                    <SelectIcon as={ChevronDownIcon} className="ml-auto mr-3" />
                  </SelectTrigger>
                  <SelectPortal>
                    <SelectBackdrop />
                    <SelectContent>
                      <SelectDragIndicatorWrapper>
                        <SelectDragIndicator />
                      </SelectDragIndicatorWrapper>
                      <SelectItem label="All Seasons" value="all" />
                      {seasons.map((season) => (
                        <SelectItem
                          key={season.id}
                          label={season.name}
                          value={String(season.id)}
                        />
                      ))}
                    </SelectContent>
                  </SelectPortal>
                </Select>
              )}
          </VStack>

          {matches.length === 0 ? (
            <Center className="mt-20">
              <VStack space="sm" className="items-center">
                <Text size="lg" className="text-typography-500 text-center">
                  {selectedLeague === "all" && selectedSeason === "all"
                    ? "No matches recorded yet."
                    : selectedLeague === "standalone"
                    ? "No standalone matches recorded yet."
                    : selectedSeason !== "all"
                    ? "No matches in this season."
                    : "No matches in this league."}
                </Text>
                <Text size="lg" className="text-typography-500 text-center">
                  Tap + to record one.
                </Text>
              </VStack>
            </Center>
          ) : (
            <VStack space="md">
              {matches.map((match) => (
                <Card
                  key={match.id}
                  size="md"
                  variant="elevated"
                  className="p-4 border border-neutral-400"
                >
                  <VStack space="md">
                    {/* League and Status Badges */}
                    <HStack space="sm" className="flex-wrap">
                      <Badge size="sm" variant="solid" action={match.leagueName ? "info" : "muted"}>
                        <BadgeText>{match.leagueName || "Standalone"}</BadgeText>
                      </Badge>
                      <Badge size="sm" variant="solid" action="info">
                        <BadgeText>{match.gameType}</BadgeText>
                      </Badge>
                      {match.status === 'in_progress' && (
                        <Badge size="sm" variant="solid" action="warning">
                          <BadgeText>In Progress</BadgeText>
                        </Badge>
                      )}
                    </HStack>

                    {/* Participants */}
                    <VStack space="xs">
                      {match.participants.map((participant, index) => (
                        <React.Fragment key={participant.id}>
                          {index > 0 && (
                            <Text
                              size="sm"
                              className="text-typography-500 text-center"
                            >
                              vs
                            </Text>
                          )}
                          <HStack className="justify-between items-center">
                            <Text
                              className={`text-typography-900 font-medium ${
                                participant.isWinner ? "text-success-600" : ""
                              }`}
                            >
                              {participant.firstName} {participant.lastName}
                              {participant.isWinner && " ✓"}
                            </Text>
                          </HStack>
                        </React.Fragment>
                      ))}
                    </VStack>

                    {/* Match Info */}
                    <VStack space="xs">
                      <Text size="sm" className="text-typography-500">
                        {formatDate(match.date)}
                      </Text>
                      <Text size="sm" className="text-typography-600">
                        {getMatchResult(match)}
                      </Text>
                    </VStack>

                    {/* Actions */}
                    <VStack>
                      <Button
                        size="md"
                        action="primary"
                        onPress={() => handleViewMatch(match.id)}
                      >
                        {/* <Icon as={Eye} size="lg" className="text-primary-500" /> */}
                        <ButtonText>View Match</ButtonText>
                      </Button>
                      <Button
                        size="sm"
                        variant="link"
                        action="negative"
                        onPress={() => handleDelete(match)}
                      >
                        <ButtonText>Delete Match</ButtonText>
                      </Button>
                    </VStack>
                  </VStack>
                </Card>
              ))}
            </VStack>
          )}
        </VStack>
      </ScrollView>

      <Fab
        size="lg"
        placement="bottom right"
        className="m-6 bg-secondary-500"
        onPress={() => router.push("/matches/new" as Href)}
      >
        <FabIcon as={AddIcon} />
      </Fab>
    </SafeAreaView>
  );
}
