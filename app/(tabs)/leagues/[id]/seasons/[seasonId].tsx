import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView } from "@/components/ui/scroll-view";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Button, ButtonText } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge, BadgeText } from "@/components/ui/badge";
import { Divider } from "@/components/ui/divider";
import { Spinner } from "@/components/ui/spinner";
import { Center } from "@/components/ui/center";
import {
  Checkbox,
  CheckboxIndicator,
  CheckboxIcon,
  CheckboxLabel,
} from "@/components/ui/checkbox";
import { CheckIcon, Search } from "lucide-react-native";
import { Input, InputField, InputSlot, InputIcon } from "@/components/ui/input";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { useDatabase } from "@/lib/db/provider";
import { findById } from "@/lib/db/queries";
import {
  advanceWeek,
  completeSeason,
  getWeekAttendance,
  recordWeekAttendance,
  getScheduledMatches,
  getMakeupMatches,
} from "@/lib/db/seasons";
import { getLeaguePlayers } from "@/lib/db/playerLeagues";
import { Season } from "@/types/season";
import { League } from "@/types/league";
import { OwedMatch } from "@/types/season";
import { LeaguePlayer } from "@/types/leaguePlayer";
import { Href } from "expo-router";
import { getLeagueLeaderboard, resolveLeaderboardTies, LeaderboardEntry } from "@/lib/db/leaderboard";
import { Leaderboard } from "@/components/Leaderboard";
import { getMatchesWithDetails, createMatch } from "@/lib/db/matches";
import { MatchWithDetails } from "@/types/match";
import { createTournament, getSeasonTournament } from "@/lib/db/tournaments";
import { Tournament, TournamentFormat } from "@/types/tournament";
import { PoolGameData } from "@/types/games";
import {
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionTrigger,
  AccordionTitleText,
  AccordionIcon,
  AccordionContent,
} from "@/components/ui/accordion";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react-native";

export default function SeasonDetail() {
  const { db } = useDatabase();
  const { id, seasonId } = useLocalSearchParams<{
    id: string;
    seasonId: string;
  }>();

  const [season, setSeason] = useState<Season | null>(null);
  const [league, setLeague] = useState<League | null>(null);
  const [leaguePlayers, setLeaguePlayers] = useState<LeaguePlayer[]>([]);
  const [weekAttendance, setWeekAttendance] = useState<number[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<number[]>([]);
  const [attendanceExpanded, setAttendanceExpanded] = useState<string[]>(["attendance"]);
  const [scheduledMatches, setScheduledMatches] = useState<OwedMatch[]>([]);
  const [makeupMatches, setMakeupMatches] = useState<OwedMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [playerSearchQuery, setPlayerSearchQuery] = useState("");
  const [seasonStandings, setSeasonStandings] = useState<LeaderboardEntry[]>([]);
  const [seasonMatches, setSeasonMatches] = useState<MatchWithDetails[]>([]);
  const [tournament, setTournament] = useState<Tournament | null>(null);

  const fetchData = async () => {
    if (!db || !seasonId || !id) return;

    try {
      setIsLoading(true);

      // Fetch season
      const seasonResult = await findById<Season>(
        db,
        "seasons",
        Number(seasonId)
      );
      setSeason(seasonResult);

      // Fetch league
      const leagueResult = await findById<League>(db, "leagues", Number(id));
      setLeague(leagueResult);

      // Fetch league players
      const players = await getLeaguePlayers(db, Number(id));
      setLeaguePlayers(players);

      // Fetch season-specific data based on status
      if (seasonResult) {
        if (seasonResult.status === "active") {
          // For active seasons, fetch attendance and matches
          const attendance = await getWeekAttendance(
            db,
            Number(seasonId),
            seasonResult.currentWeek
          );
          setWeekAttendance(attendance);
          setSelectedPlayers(attendance);
          // Don't auto-expand here - let state control it

          // Fetch scheduled matches for current week
          const scheduled = await getScheduledMatches(
            db,
            Number(seasonId),
            Number(id),
            seasonResult.currentWeek,
            attendance
          );
          setScheduledMatches(scheduled);

          // Fetch makeup matches from previous weeks
          const makeup = await getMakeupMatches(
            db,
            Number(seasonId),
            Number(id),
            seasonResult.currentWeek,
            attendance
          );
          setMakeupMatches(makeup);
        } else if (seasonResult.status === "completed") {
          // For completed seasons, fetch standings and all matches
          const standings = await getLeagueLeaderboard(db, Number(id), Number(seasonId));
          const resolvedStandings = await resolveLeaderboardTies(
            db,
            Number(id),
            standings,
            Number(seasonId)
          );
          setSeasonStandings(resolvedStandings);

          const matches = await getMatchesWithDetails(db, Number(id), Number(seasonId));
          setSeasonMatches(matches);

          // Check if tournament exists for this season
          const existingTournament = await getSeasonTournament(db, Number(seasonId));
          setTournament(existingTournament);
        }
      }
    } catch (error) {
      console.error("Failed to fetch season:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [db, seasonId, id])
  );

  // Memoize selected players to avoid unnecessary recalculations
  const selectedPlayersKey = useMemo(() =>
    selectedPlayers.sort((a, b) => a - b).join(','),
    [selectedPlayers]
  );

  // Recalculate scheduled and makeup matches when selected players change
  useEffect(() => {
    const updateMatches = async () => {
      if (!db || !seasonId || !id || !season) return;

      const scheduled = await getScheduledMatches(
        db,
        Number(seasonId),
        Number(id),
        season.currentWeek,
        selectedPlayers
      );
      setScheduledMatches(scheduled);

      const makeup = await getMakeupMatches(
        db,
        Number(seasonId),
        Number(id),
        season.currentWeek,
        selectedPlayers
      );
      setMakeupMatches(makeup);
    };

    updateMatches();
  }, [selectedPlayersKey, db, seasonId, id, season, selectedPlayers]);

  const handleTogglePlayer = (playerId: number) => {
    setSelectedPlayers((prev) =>
      prev.includes(playerId)
        ? prev.filter((id) => id !== playerId)
        : [...prev, playerId]
    );
  };

  const handleSelectAll = () => {
    setSelectedPlayers(filteredPlayers.map(p => p.id));
  };

  const handleDeselectAll = () => {
    setSelectedPlayers([]);
  };

  // Filter players based on search query
  const filteredPlayers = useMemo(() => {
    if (!playerSearchQuery.trim()) {
      return leaguePlayers;
    }

    const query = playerSearchQuery.toLowerCase();
    return leaguePlayers.filter(player =>
      player.firstName.toLowerCase().includes(query) ||
      player.lastName.toLowerCase().includes(query) ||
      `${player.firstName} ${player.lastName}`.toLowerCase().includes(query)
    );
  }, [leaguePlayers, playerSearchQuery]);

  // Group scheduled matches by player - show ALL matches involving each player
  const groupedScheduledMatches = useMemo(() => {
    const groups: { [playerId: number]: { playerName: string; matches: OwedMatch[] } } = {};

    scheduledMatches.forEach(match => {
      // Add match to the first player's section
      if (!groups[match.playerId]) {
        groups[match.playerId] = {
          playerName: match.playerName,
          matches: [],
        };
      }
      groups[match.playerId].matches.push(match);

      // Also add match to the opponent's section (reversed)
      if (!groups[match.opponentId]) {
        groups[match.opponentId] = {
          playerName: match.opponentName,
          matches: [],
        };
      }
      groups[match.opponentId].matches.push({
        playerId: match.opponentId,
        playerName: match.opponentName,
        opponentId: match.playerId,
        opponentName: match.playerName,
        weekNumber: match.weekNumber,
      });
    });

    return Object.entries(groups).map(([playerId, data]) => ({
      playerId: Number(playerId),
      playerName: data.playerName,
      matches: data.matches,
    }));
  }, [scheduledMatches]);

  // Group makeup matches by player - show ALL matches involving each player
  const groupedMakeupMatches = useMemo(() => {
    const groups: { [playerId: number]: { playerName: string; matches: OwedMatch[] } } = {};

    makeupMatches.forEach(match => {
      // Add match to the first player's section
      if (!groups[match.playerId]) {
        groups[match.playerId] = {
          playerName: match.playerName,
          matches: [],
        };
      }
      groups[match.playerId].matches.push(match);

      // Also add match to the opponent's section (reversed)
      if (!groups[match.opponentId]) {
        groups[match.opponentId] = {
          playerName: match.opponentName,
          matches: [],
        };
      }
      groups[match.opponentId].matches.push({
        playerId: match.opponentId,
        playerName: match.opponentName,
        opponentId: match.playerId,
        opponentName: match.playerName,
        weekNumber: match.weekNumber,
      });
    });

    return Object.entries(groups).map(([playerId, data]) => ({
      playerId: Number(playerId),
      playerName: data.playerName,
      matches: data.matches,
    }));
  }, [makeupMatches]);

  const handleSaveAttendance = async () => {
    if (!db || !season) return;

    try {
      setIsSaving(true);
      await recordWeekAttendance(
        db,
        Number(seasonId),
        season.currentWeek,
        selectedPlayers
      );
      setWeekAttendance(selectedPlayers);
      setAttendanceExpanded([]); // Collapse after saving
      Alert.alert("Success", "Attendance saved!");
      fetchData();
    } catch (error) {
      console.error("Failed to save attendance:", error);
      Alert.alert("Error", "Failed to save attendance. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAdvanceWeek = async () => {
    if (!db || !season) return;

    Alert.alert(
      "Advance Week",
      `Move from Week ${season.currentWeek} to Week ${season.currentWeek + 1}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Advance",
          onPress: async () => {
            try {
              // Save current week's attendance before advancing
              await recordWeekAttendance(
                db,
                Number(seasonId),
                season.currentWeek,
                selectedPlayers
              );

              await advanceWeek(db, Number(seasonId));
              Alert.alert("Success", `Now on Week ${season.currentWeek + 1}!`);
              await fetchData();
              setAttendanceExpanded(["attendance"]); // Expand for new week
            } catch (error) {
              console.error("Failed to advance week:", error);
              Alert.alert("Error", "Failed to advance week.");
            }
          },
        },
      ]
    );
  };

  const handleCompleteSeason = async () => {
    if (!db || !season) return;

    Alert.alert(
      "Complete Season",
      "Mark this season as completed? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Complete",
          style: "destructive",
          onPress: async () => {
            try {
              await completeSeason(db, Number(seasonId));
              Alert.alert("Success", "Season completed!");
              router.back();
            } catch (error) {
              console.error("Failed to complete season:", error);
              Alert.alert("Error", "Failed to complete season.");
            }
          },
        },
      ]
    );
  };

  const handleStartTournament = (format: TournamentFormat) => {
    if (!db || !season || !id) return;

    const formatText = format === 'best-of-3' ? 'Best of 3' : 'Best of 5';

    Alert.alert(
      `Start ${formatText} Tournament`,
      `Create a single-elimination tournament from the final standings? Top ${seasonStandings.length} players will be seeded.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Start Tournament",
          onPress: async () => {
            try {
              await createTournament(db, {
                seasonId: Number(seasonId),
                leagueId: Number(id),
                name: `${season.name} Tournament`,
                format,
                seededPlayers: seasonStandings,
              });

              Alert.alert("Success", "Tournament created!");
              fetchData();
            } catch (error) {
              console.error("Failed to create tournament:", error);
              Alert.alert("Error", "Failed to create tournament.");
            }
          },
        },
      ]
    );
  };

  const handleRecordMatch = (match: OwedMatch, isMakeup: boolean = false) => {
    router.push(
      `/matches/new?leagueId=${id}&seasonId=${seasonId}&weekNumber=${match.weekNumber}&playerAId=${match.playerId}&playerBId=${match.opponentId}&isMakeup=${isMakeup ? 1 : 0}&timestamp=${Date.now()}` as Href
    );
  };

  const getPlayerButtonName = (playerName: string, opponentName: string) => {
    const [firstName, lastName] = playerName.split(' ');
    const [oppFirstName, oppLastName] = opponentName.split(' ');

    if (!lastName) return firstName; // Safety check

    const initial = lastName[0];
    const oppInitial = oppLastName ? oppLastName[0] : '';

    const shortName = `${firstName} ${initial}`;
    const oppShortName = `${oppFirstName} ${oppInitial}`;

    // If there's still a conflict (same first name + last initial), use full name
    if (shortName === oppShortName) {
      return playerName;
    }

    return shortName;
  };

  const handleQuickRecordWin = async (match: OwedMatch, winnerId: number, isMakeup: boolean = false) => {
    if (!db || !id || !seasonId || !league) return;

    // For darts and dominos, redirect to full form
    if (league.gameType === 'darts' || league.gameType === 'dominos') {
      router.push(
        `/matches/new?leagueId=${id}&seasonId=${seasonId}&weekNumber=${match.weekNumber}&playerAId=${match.playerId}&playerBId=${match.opponentId}&isMakeup=${isMakeup ? 1 : 0}` as Href
      );
      return;
    }

    // For pool, quick record with defaults
    const winnerName = winnerId === match.playerId ? match.playerName : match.opponentName;

    Alert.alert(
      "Record Match",
      `Record a win for ${winnerName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Record Win",
          onPress: async () => {
            try {
              const poolGameData: PoolGameData = { winMethod: 'made_all_balls' };

              await createMatch(db, {
                leagueId: Number(id),
                seasonId: Number(seasonId),
                weekNumber: match.weekNumber,
                playerAId: match.playerId,
                playerBId: match.opponentId,
                winnerId,
                date: Date.now(),
                isMakeup: isMakeup ? 1 : 0,
                gameVariant: '8-ball',
                gameData: poolGameData,
              });

              // Refresh data
              await fetchData();
              Alert.alert("Success", "Match recorded!");
            } catch (error) {
              console.error("Failed to record match:", error);
              Alert.alert("Error", "Failed to record match. Please try again.");
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <Center className="flex-1 bg-background-0">
        <VStack space="md" className="items-center">
          <Spinner size="large" />
          <Text className="text-typography-500">Loading season...</Text>
        </VStack>
      </Center>
    );
  }

  if (!season || !league) {
    return (
      <Center className="flex-1 bg-background-0">
        <Text className="text-typography-500">Season not found</Text>
      </Center>
    );
  }

  const attendanceChanged =
    JSON.stringify(selectedPlayers.sort()) !==
    JSON.stringify(weekAttendance.sort());

  return (
    <SafeAreaView className="flex-1 bg-background-0">
      <ScrollView className="flex-1" contentContainerClassName="p-6">
        <VStack space="2xl">
          {/* Header */}
          <VStack space="sm">
            <HStack className="justify-between items-center">
              <Heading size="3xl" className="text-typography-900 flex-1">
                {season.name}
              </Heading>
              <Badge
                size="md"
                variant="solid"
                action={season.status === "active" ? "success" : "muted"}
              >
                <BadgeText className="capitalize">{season.status}</BadgeText>
              </Badge>
            </HStack>
            <HStack className="justify-between items-center">
              <Button
                size="sm"
                variant="link"
                onPress={() => router.push(`/leagues/${id}` as Href)}
              >
                <ButtonText>← Back to {league.name}</ButtonText>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onPress={() => router.push(`/leagues/${id}/seasons/new?seasonId=${seasonId}` as Href)}
              >
                <ButtonText>Edit Season</ButtonText>
              </Button>
            </HStack>
          </VStack>

          {/* Week Info */}
          <Card size="md" variant="outline" className="p-4">
            <HStack className="justify-between items-center">
              <VStack space="xs">
                <Text size="sm" className="text-typography-500">
                  Current Week
                </Text>
                <Heading size="2xl" className="text-typography-900">
                  Week {season.currentWeek}
                </Heading>
              </VStack>
              <VStack space="xs" className="items-end">
                <Text size="sm" className="text-typography-500">
                  Progress
                </Text>
                <Text className="text-typography-900 font-semibold">
                  {season.currentWeek} / {season.weeksDuration}
                </Text>
              </VStack>
            </HStack>
          </Card>

          <Divider />

          {/* Attendance Section - Collapsible */}
          {season.status === "active" && (
            <>
              <VStack space="lg">
                <Accordion
                  variant="unfilled"
                  size="md"
                  type="multiple"
                  value={attendanceExpanded}
                  onValueChange={setAttendanceExpanded}
                >
                  <AccordionItem value="attendance">
                    <AccordionHeader>
                      <AccordionTrigger>
                        {({ isExpanded }: { isExpanded: boolean }) => (
                          <>
                            <AccordionTitleText>
                              Week {season.currentWeek} Attendance ({selectedPlayers.length}/{leaguePlayers.length})
                              {attendanceChanged && " •"}
                            </AccordionTitleText>
                            {attendanceChanged && (
                              <Badge size="sm" variant="solid" action="warning" className="ml-2">
                                <BadgeText>Unsaved</BadgeText>
                              </Badge>
                            )}
                            <AccordionIcon as={isExpanded ? ChevronUpIcon : ChevronDownIcon} className="ml-3" />
                          </>
                        )}
                      </AccordionTrigger>
                    </AccordionHeader>
                    <AccordionContent>
                      <VStack space="md" className="pt-2">
                        {/* Search and Bulk Actions */}
                        {leaguePlayers.length > 0 && (
                          <VStack space="md">
                            <Input variant="outline" size="md">
                              <InputSlot className="pl-3">
                                <InputIcon as={Search} />
                              </InputSlot>
                              <InputField
                                placeholder="Search players..."
                                value={playerSearchQuery}
                                onChangeText={setPlayerSearchQuery}
                              />
                            </Input>

                            <HStack space="sm">
                              <Button
                                size="sm"
                                variant="outline"
                                onPress={handleSelectAll}
                                className="flex-1"
                              >
                                <ButtonText>Select All</ButtonText>
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onPress={handleDeselectAll}
                                className="flex-1"
                              >
                                <ButtonText>Deselect All</ButtonText>
                              </Button>
                            </HStack>
                          </VStack>
                        )}

                        <Card size="md" variant="outline" className="p-4">
                          <VStack space="md">
                            {leaguePlayers.length === 0 ? (
                              <Text className="text-typography-500 text-center">
                                No players in this league yet.
                              </Text>
                            ) : filteredPlayers.length === 0 ? (
                              <Text className="text-typography-500 text-center">
                                No players match your search.
                              </Text>
                            ) : (
                              filteredPlayers.map((player) => (
                                <Checkbox
                                  key={player.id}
                                  value={String(player.id)}
                                  isChecked={selectedPlayers.includes(player.id)}
                                  onChange={() => handleTogglePlayer(player.id)}
                                  size="md"
                                >
                                  <CheckboxIndicator>
                                    <CheckboxIcon as={CheckIcon} />
                                  </CheckboxIndicator>
                                  <CheckboxLabel>
                                    {player.firstName} {player.lastName}
                                  </CheckboxLabel>
                                </Checkbox>
                              ))
                            )}
                          </VStack>
                        </Card>

                        {attendanceChanged && (
                          <Button
                            action="primary"
                            size="lg"
                            onPress={handleSaveAttendance}
                            isDisabled={isSaving}
                          >
                            <ButtonText>
                              {isSaving ? "Saving..." : "Save Attendance"}
                            </ButtonText>
                          </Button>
                        )}
                      </VStack>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </VStack>

              <Divider />
            </>
          )}

          {/* Scheduled Matches (Current Week) - Grouped by Player */}
          {league.format === "round-robin" && groupedScheduledMatches.length > 0 && (
            <>
              <VStack space="lg">
                <Heading size="lg" className="text-typography-800">
                  Week {season.currentWeek} Matches ({scheduledMatches.length})
                </Heading>
                <Text size="sm" className="text-typography-500">
                  Matches to be played this week, grouped by player
                </Text>

                <Accordion variant="unfilled" size="md" type="multiple">
                  {groupedScheduledMatches.map((group) => (
                    <AccordionItem key={group.playerId} value={String(group.playerId)}>
                      <AccordionHeader>
                        <AccordionTrigger>
                          {({ isExpanded }: { isExpanded: boolean }) => (
                            <>
                              <AccordionTitleText>
                                {group.playerName} ({group.matches.length})
                              </AccordionTitleText>
                              <AccordionIcon as={isExpanded ? ChevronUpIcon : ChevronDownIcon} className="ml-3" />
                            </>
                          )}
                        </AccordionTrigger>
                      </AccordionHeader>
                      <AccordionContent>
                        <VStack space="sm" className="pt-2">
                          {group.matches.map((match, index) => (
                            <Card
                              key={index}
                              size="sm"
                              variant="outline"
                              className="p-3"
                            >
                              <VStack space="sm">
                                <Text className="text-typography-900 font-medium text-center">
                                  {match.playerName} vs {match.opponentName}
                                </Text>
                                <HStack space="xs">
                                  <Button
                                    size="xs"
                                    action="primary"
                                    className="flex-1"
                                    onPress={() => handleQuickRecordWin(match, match.playerId, false)}
                                  >
                                    <ButtonText className="text-xs">{getPlayerButtonName(match.playerName, match.opponentName)} Wins</ButtonText>
                                  </Button>
                                  <Button
                                    size="xs"
                                    action="primary"
                                    className="flex-1"
                                    onPress={() => handleQuickRecordWin(match, match.opponentId, false)}
                                  >
                                    <ButtonText className="text-xs">{getPlayerButtonName(match.opponentName, match.playerName)} Wins</ButtonText>
                                  </Button>
                                </HStack>
                              </VStack>
                            </Card>
                          ))}
                        </VStack>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </VStack>

              <Divider />
            </>
          )}

          {/* Makeup Matches (Previous Weeks) - Grouped by Player */}
          {league.format === "round-robin" && groupedMakeupMatches.length > 0 && (
            <>
              <VStack space="lg">
                <Heading size="lg" className="text-typography-800">
                  Makeup Matches ({makeupMatches.length})
                </Heading>
                <Text size="sm" className="text-typography-500">
                  Missed matches from previous weeks, grouped by player
                </Text>

                <Accordion variant="unfilled" size="md" type="multiple">
                  {groupedMakeupMatches.map((group) => (
                    <AccordionItem key={group.playerId} value={String(group.playerId)}>
                      <AccordionHeader>
                        <AccordionTrigger>
                          {({ isExpanded }: { isExpanded: boolean }) => (
                            <>
                              <AccordionTitleText>
                                {group.playerName} ({group.matches.length})
                              </AccordionTitleText>
                              <AccordionIcon as={isExpanded ? ChevronUpIcon : ChevronDownIcon} className="ml-3" />
                            </>
                          )}
                        </AccordionTrigger>
                      </AccordionHeader>
                      <AccordionContent>
                        <VStack space="sm" className="pt-2">
                          {group.matches.map((match, index) => (
                            <Card
                              key={index}
                              size="sm"
                              variant="outline"
                              className="p-3 bg-warning-50"
                            >
                              <VStack space="sm">
                                <Text className="text-typography-900 font-medium text-center">
                                  {match.playerName} vs {match.opponentName}
                                </Text>
                                <Text size="xs" className="text-typography-500 text-center">
                                  From Week {match.weekNumber}
                                </Text>
                                <HStack space="xs">
                                  <Button
                                    size="xs"
                                    action="primary"
                                    className="flex-1"
                                    onPress={() => handleQuickRecordWin(match, match.playerId, true)}
                                  >
                                    <ButtonText className="text-xs">{getPlayerButtonName(match.playerName, match.opponentName)} Wins</ButtonText>
                                  </Button>
                                  <Button
                                    size="xs"
                                    action="primary"
                                    className="flex-1"
                                    onPress={() => handleQuickRecordWin(match, match.opponentId, true)}
                                  >
                                    <ButtonText className="text-xs">{getPlayerButtonName(match.opponentName, match.playerName)} Wins</ButtonText>
                                  </Button>
                                </HStack>
                              </VStack>
                            </Card>
                          ))}
                        </VStack>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </VStack>

              <Divider />
            </>
          )}

          {/* Actions */}
          {season.status === "active" && (
            <VStack space="md">
              {season.currentWeek < season.weeksDuration && (
                <Button size="lg" variant="outline" onPress={handleAdvanceWeek}>
                  <ButtonText>
                    Advance to Week {season.currentWeek + 1}
                  </ButtonText>
                </Button>
              )}

              {season.currentWeek >= season.weeksDuration && (
                <Button
                  size="lg"
                  action="positive"
                  onPress={handleCompleteSeason}
                >
                  <ButtonText>Complete Season</ButtonText>
                </Button>
              )}
            </VStack>
          )}

          {season.status === "completed" && (
            <>
              {/* Completed Season Info */}
              <Card size="md" variant="outline" className="p-4 bg-success-50">
                <Text className="text-typography-700 text-center font-medium">
                  This season has been completed.
                </Text>
              </Card>

              <Divider />

              {/* Final Standings */}
              <VStack space="lg">
                <Heading size="lg" className="text-typography-800">
                  Final Standings
                </Heading>
                <Leaderboard
                  entries={seasonStandings}
                  leagueId={Number(id)}
                  showRank={true}
                />
              </VStack>

              <Divider />

              {/* Tournament Section */}
              {!tournament && seasonStandings.length >= 2 && (
                <>
                  <VStack space="lg">
                    <Heading size="lg" className="text-typography-800">
                      Tournament
                    </Heading>
                    <Text size="sm" className="text-typography-500">
                      Start a single-elimination tournament. Finals will be Best of 5, all other rounds Best of 3.
                    </Text>

                    <Button
                      action="primary"
                      size="lg"
                      onPress={() => handleStartTournament('best-of-3')}
                    >
                      <ButtonText>Start Tournament</ButtonText>
                    </Button>
                  </VStack>

                  <Divider />
                </>
              )}

              {tournament && (
                <>
                  <VStack space="lg">
                    <Heading size="lg" className="text-typography-800">
                      Tournament
                    </Heading>

                    <Card size="md" variant="outline" className="p-4">
                      <VStack space="md">
                        <VStack space="xs">
                          <Text className="text-typography-900 font-semibold text-lg">
                            {tournament.name}
                          </Text>
                          <Text size="sm" className="text-typography-500">
                            Bo3 + Bo5 Finals • {tournament.status === 'active' ? 'In Progress' : 'Completed'}
                          </Text>
                        </VStack>

                        <Button
                          size="md"
                          variant="outline"
                          onPress={() => router.push(`/leagues/${id}/seasons/${seasonId}/tournament` as Href)}
                        >
                          <ButtonText>View Bracket</ButtonText>
                        </Button>
                      </VStack>
                    </Card>
                  </VStack>

                  <Divider />
                </>
              )}

              {/* Season Matches */}
              <VStack space="lg">
                <Heading size="lg" className="text-typography-800">
                  Season Matches ({seasonMatches.length})
                </Heading>
                {seasonMatches.length === 0 ? (
                  <Center className="py-4">
                    <Text className="text-typography-500 text-center">
                      No matches recorded for this season.
                    </Text>
                  </Center>
                ) : (
                  <VStack space="sm">
                    {seasonMatches.map((match) => (
                      <Card
                        key={match.id}
                        size="sm"
                        variant="outline"
                        className="p-3"
                      >
                        <VStack space="xs">
                          <HStack className="justify-between items-center">
                            <VStack space="xs" className="flex-1">
                              <Text className="text-typography-900 font-medium">
                                {match.playerAFirstName} {match.playerALastName} vs{" "}
                                {match.playerBFirstName} {match.playerBLastName}
                              </Text>
                              {match.winnerId && (
                                <Text size="sm" className="text-typography-600">
                                  Winner:{" "}
                                  {match.winnerId === match.playerAId
                                    ? `${match.playerAFirstName} ${match.playerALastName}`
                                    : `${match.playerBFirstName} ${match.playerBLastName}`}
                                </Text>
                              )}
                              <Text size="xs" className="text-typography-500">
                                {new Date(match.date).toLocaleDateString()} •{" "}
                                {match.weekNumber ? `Week ${match.weekNumber}` : "No week"}
                              </Text>
                            </VStack>
                            <Button
                              size="xs"
                              variant="outline"
                              onPress={() =>
                                router.push(
                                  `/matches/new?id=${match.id}&mode=edit` as Href
                                )
                              }
                            >
                              <ButtonText>Edit</ButtonText>
                            </Button>
                          </HStack>
                        </VStack>
                      </Card>
                    ))}
                  </VStack>
                )}
              </VStack>
            </>
          )}
        </VStack>
      </ScrollView>
    </SafeAreaView>
  );
}
