import React, { useState, useEffect, useCallback } from "react";
import { Keyboard, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView } from "@/components/ui/scroll-view";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Button, ButtonText } from "@/components/ui/button";
import {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
  FormControlError,
  FormControlErrorText,
} from "@/components/ui/form-control";
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
import {
  Checkbox,
  CheckboxIndicator,
  CheckboxIcon,
  CheckboxLabel,
} from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { CheckIcon } from "lucide-react-native";
import { Spinner } from "@/components/ui/spinner";
import { Center } from "@/components/ui/center";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { useDatabase } from "@/lib/db/provider";
import { League, GameType } from "@/types/league";
import { createMatch, CreateMatchParticipant } from "@/lib/db/matches";
import { getLeaguePlayers } from "@/lib/db/playerLeagues";
import { findById } from "@/lib/db/queries";
import { getGameConfig } from "@/lib/games";
import { GameData, PoolVariant } from "@/types/games";
import { PoolMatchForm } from "@/components/match-forms/PoolMatchForm";
import { DartsMatchForm } from "@/components/match-forms/DartsMatchForm";
import { DominosMatchForm } from "@/components/match-forms/DominosMatchForm";
import { UnoMatchForm } from "@/components/match-forms/UnoMatchForm";
import { CustomMatchForm } from "@/components/match-forms/CustomMatchForm";
import { ParticipantInfo } from "@/components/match-forms/types";
import { SearchableSelect, SelectOption } from "@/components/SearchableSelect";
import { getAllCustomGameConfigs, getCustomGameConfig } from "@/lib/db/customGames";
import { CustomGameConfig } from "@/types/customGame";
import { getAllSeries } from "@/lib/db/series";
import { Series } from "@/types/series";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Platform } from "react-native";
import { Calendar } from "lucide-react-native";
import { Icon } from "@/components/ui/icon";
import { Card } from "@/components/ui/card";
import { Divider } from "@/components/ui/divider";

// Participant state type
type ParticipantState = {
  playerId: string;
  isWinner: boolean;
};

export default function NewMatch() {
  const { db } = useDatabase();
  const {
    leagueId: prefilledLeagueId,
    seasonId: prefilledSeasonId,
    weekNumber: prefilledWeekNumber,
    playerAId: prefilledPlayerAId,
    playerBId: prefilledPlayerBId,
    seriesId: prefilledSeriesId,
    gameType: prefilledGameType,
  } = useLocalSearchParams<{
    leagueId?: string;
    seasonId?: string;
    weekNumber?: string;
    playerAId?: string;
    playerBId?: string;
    seriesId?: string;
    gameType?: string;
  }>();

  const [leagues, setLeagues] = useState<League[]>([]);
  const [selectedLeague, setSelectedLeague] = useState<string>("");
  const [league, setLeague] = useState<League | null>(null);
  const [leaguePlayers, setLeaguePlayers] = useState<
    { id: number; firstName: string; lastName: string }[]
  >([]);

  // Series state
  const [availableSeries, setAvailableSeries] = useState<Series[]>([]);
  const [selectedSeries, setSelectedSeries] = useState<Series | null>(null);

  // Standalone match state
  const [isStandalone, setIsStandalone] = useState(false);
  const [standaloneGameType, setStandaloneGameType] = useState<GameType>('pool');
  const [standaloneCustomGameConfigId, setStandaloneCustomGameConfigId] = useState<string>("");
  const [customGameConfigs, setCustomGameConfigs] = useState<Array<{ id: number; name: string }>>([]);
  const [customGameConfig, setCustomGameConfig] = useState<CustomGameConfig | null>(null);

  // Multi-player state
  const [participants, setParticipants] = useState<ParticipantState[]>([
    { playerId: "", isWinner: false },
    { playerId: "", isWinner: false },
  ]);
  const [playerCount, setPlayerCount] = useState(2);

  const [matchDate, setMatchDate] = useState(Date.now());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [errors, setErrors] = useState<{
    league?: string;
    participants?: string;
    winner?: string;
    general?: string;
  }>({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [seasonId, setSeasonId] = useState<string | null>(null);
  const [weekNumber, setWeekNumber] = useState<number | null>(null);
  const [gameVariant, setGameVariant] = useState<string>('');
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [quickEntryMode, setQuickEntryMode] = useState(false);

  // Load leagues, custom games, series, and check for players
  // Using useFocusEffect to refresh player count when returning from Players tab
  useFocusEffect(
    useCallback(() => {
      async function loadLeagues() {
        if (!db) return;

        try {
          const results = await db.all<League>(
            "SELECT * FROM leagues ORDER BY name ASC"
          );
          setLeagues(results);

          // Load custom game configs
          const configs = await getAllCustomGameConfigs(db);
          setCustomGameConfigs(configs);

          // Load active series
          const seriesData = await getAllSeries(db);
          const activeSeries = seriesData.filter(s => s.status === 'active');
          setAvailableSeries(activeSeries);

          // Check total number of players
          const playerCountResult = await db.get<{ count: number }>(
            "SELECT COUNT(*) as count FROM players"
          );
          setTotalPlayers(playerCountResult?.count || 0);
        } catch (error) {
          console.error("Failed to load leagues:", error);
          setErrors({ general: "Failed to load leagues" });
        } finally {
          setIsLoading(false);
        }
      }

      loadLeagues();
    }, [db])
  );

  // Load league and players when league is selected OR when standalone mode
  useEffect(() => {
    async function loadLeagueAndPlayers() {
      if (!db) return;

      try {
        if (selectedLeague === "standalone") {
          // Standalone mode
          setIsStandalone(true);
          setLeague(null);
          setSelectedSeries(null);

          // Load ALL players
          const allPlayers = await db.all<{id: number; firstName: string; lastName: string}>(
            'SELECT id, firstName, lastName FROM players ORDER BY lastName ASC, firstName ASC'
          );
          setLeaguePlayers(allPlayers);

          // Load custom game config if custom game type selected
          let loadedConfig = null;
          if (standaloneGameType === 'custom' && standaloneCustomGameConfigId) {
            loadedConfig = await getCustomGameConfig(db, Number(standaloneCustomGameConfigId));
            setCustomGameConfig(loadedConfig);
          }

          // Set default variant and participants for standalone game type
          // Skip if custom game type but no config selected yet
          if (standaloneGameType !== 'custom' || loadedConfig) {
            const config = getGameConfig(standaloneGameType, loadedConfig ?? undefined);
            if (config) {
              setGameVariant(config.variants[0]);

              // Initialize participants
              const initialCount = config.minPlayers;
              setPlayerCount(initialCount);
              setParticipants(
                Array.from({ length: initialCount }, () => ({
                  playerId: "",
                  isWinner: false,
                }))
              );
            }
          }
        } else if (selectedLeague.startsWith('series-')) {
          // Series mode
          setIsStandalone(true);
          setLeague(null);

          const seriesId = Number(selectedLeague.replace('series-', ''));
          const series = availableSeries.find(s => s.id === seriesId);
          setSelectedSeries(series || null);

          // Load ALL players
          const allPlayers = await db.all<{id: number; firstName: string; lastName: string}>(
            'SELECT id, firstName, lastName FROM players ORDER BY lastName ASC, firstName ASC'
          );
          setLeaguePlayers(allPlayers);

          // Set game type and variant from series
          if (series) {
            const config = getGameConfig(series.gameType as GameType);
            if (config) {
              setGameVariant(config.variants[0]);

              // Initialize participants
              const initialCount = config.minPlayers;
              setPlayerCount(initialCount);
              setParticipants(
                Array.from({ length: initialCount }, () => ({
                  playerId: "",
                  isWinner: false,
                }))
              );
            }
          }
        } else if (selectedLeague) {
          // League mode
          setIsStandalone(false);
          setSelectedSeries(null);

          // Load league data
          const leagueData = await findById<League>(db, 'leagues', Number(selectedLeague));
          setLeague(leagueData);

          // Load custom game config if league uses custom game type
          let loadedConfig = null;
          if (leagueData?.gameType === 'custom' && leagueData.customGameConfigId) {
            loadedConfig = await getCustomGameConfig(db, leagueData.customGameConfigId);
            setCustomGameConfig(loadedConfig);
          }

          // Set default variant and player count based on game type
          if (leagueData?.gameType && (leagueData.gameType !== 'custom' || loadedConfig)) {
            const config = getGameConfig(leagueData.gameType, loadedConfig ?? undefined);
            if (config) {
              setGameVariant(config.variants[0]);

              // Initialize participants based on minPlayers
              const initialCount = config.minPlayers;
              setPlayerCount(initialCount);
              setParticipants(
                Array.from({ length: initialCount }, () => ({
                  playerId: "",
                  isWinner: false,
                }))
              );
            }
          }

          // Load league players
          const players = await getLeaguePlayers(db, Number(selectedLeague));
          setLeaguePlayers(players);
        }
      } catch (error) {
        console.error("Failed to load league or players:", error);
      }
    }

    loadLeagueAndPlayers();
  }, [db, selectedLeague, standaloneGameType, standaloneCustomGameConfigId]);

  // Pre-fill league if provided
  useEffect(() => {
    if (prefilledLeagueId) {
      setSelectedLeague(prefilledLeagueId);
    }
  }, [prefilledLeagueId]);

  // Pre-fill series if provided
  useEffect(() => {
    if (prefilledSeriesId) {
      setSelectedLeague(`series-${prefilledSeriesId}`);

      // Pre-fill game type from series
      if (prefilledGameType) {
        setStandaloneGameType(prefilledGameType as GameType);
      }
    }
  }, [prefilledSeriesId, prefilledGameType]);

  // Store season and week if provided
  useEffect(() => {
    if (prefilledSeasonId) {
      setSeasonId(prefilledSeasonId);
    }
    if (prefilledWeekNumber) {
      setWeekNumber(Number(prefilledWeekNumber));
    }
  }, [prefilledSeasonId, prefilledWeekNumber]);

  // Pre-fill players if provided (2-player mode)
  useEffect(() => {
    if (leaguePlayers.length > 0 && prefilledPlayerAId && prefilledPlayerBId) {
      setParticipants([
        { playerId: prefilledPlayerAId, isWinner: false },
        { playerId: prefilledPlayerBId, isWinner: false },
      ]);
    }
  }, [leaguePlayers, prefilledPlayerAId, prefilledPlayerBId]);

  const formatDisplayDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }

    if (selectedDate) {
      setMatchDate(selectedDate.getTime());
    }
  };

  const updateParticipant = (index: number, updates: Partial<ParticipantState>) => {
    setParticipants((prev) => {
      const newParticipants = [...prev];
      newParticipants[index] = { ...newParticipants[index], ...updates };
      return newParticipants;
    });
  };

  const updatePlayerCount = (count: number) => {
    setPlayerCount(count);
    setParticipants((prev) => {
      if (count > prev.length) {
        // Add more slots
        return [
          ...prev,
          ...Array.from({ length: count - prev.length }, () => ({
            playerId: "",
            isWinner: false,
          })),
        ];
      } else {
        // Remove excess slots
        return prev.slice(0, count);
      }
    });
  };

  const buildParticipantInfoList = (): ParticipantInfo[] => {
    return participants.map((p, idx) => {
      const player = leaguePlayers.find((lp) => lp.id === Number(p.playerId));
      return {
        playerId: Number(p.playerId),
        firstName: player?.firstName || '',
        lastName: player?.lastName || '',
        seatIndex: idx,
      };
    });
  };

  const validateForm = (skipWinnerValidation: boolean = false): boolean => {
    const newErrors: typeof errors = {};

    // League not required for standalone matches
    if (!selectedLeague) {
      newErrors.league = "Please select a league or choose standalone";
    }

    // Validate all participants have a player selected
    const emptyParticipants = participants.filter((p) => !p.playerId);
    if (emptyParticipants.length > 0) {
      newErrors.participants = "Please select all players";
    }

    // Validate unique players
    const playerIds = participants.map((p) => p.playerId).filter(Boolean);
    const uniquePlayerIds = new Set(playerIds);
    if (playerIds.length !== uniquePlayerIds.size) {
      newErrors.participants = "All players must be different";
    }

    // Validate at least one winner (only for completed matches)
    if (!skipWinnerValidation) {
      const winners = participants.filter((p) => p.isWinner);
      if (winners.length === 0) {
        newErrors.winner = "Please select at least one winner";
      }

      // Validate against game config (only for completed matches and not in quick entry mode)
      if (!quickEntryMode) {
        const gameType = isStandalone ? standaloneGameType : league?.gameType;
        if (gameType) {
          const config = getGameConfig(gameType);
          if (!config.validateParticipants(
            participants.map((p, idx) => ({
              playerId: Number(p.playerId),
              seatIndex: idx,
              isWinner: p.isWinner,
            }))
          )) {
            newErrors.participants = `Invalid participant configuration for ${config.name}`;
          }
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (status: 'completed' | 'in_progress' = 'completed') => {
    setErrors({});

    // Skip winner validation if saving as in-progress
    if (!validateForm(status === 'in_progress')) {
      return;
    }

    if (!db) {
      setErrors({ general: "Database not ready. Please try again." });
      return;
    }

    setIsSubmitting(true);
    Keyboard.dismiss();

    try {
      // Build participants array for createMatch
      const matchParticipants: CreateMatchParticipant[] = participants.map(
        (p, index) => {
          // Extract score from gameData if available
          let score = null;
          if (gameData) {
            // For Uno and Dominos, finalScores is an array indexed by participant
            if ('finalScores' in gameData && Array.isArray(gameData.finalScores)) {
              score = gameData.finalScores[index] ?? null;
            }
            // For Custom games, playerScores is keyed by playerId
            else if ('playerScores' in gameData && typeof gameData.playerScores === 'object') {
              score = gameData.playerScores[Number(p.playerId)] ?? null;
            }
          }

          return {
            playerId: Number(p.playerId),
            seatIndex: index,
            isWinner: p.isWinner,
            score,
            finishPosition: null,
          };
        }
      );

      // Parse selectedLeague to determine leagueId or seriesId
      let leagueId: number | undefined;
      let matchSeriesId: number | undefined;

      if (selectedLeague.startsWith('series-')) {
        matchSeriesId = Number(selectedLeague.replace('series-', ''));
      } else if (selectedLeague !== 'standalone') {
        leagueId = Number(selectedLeague);
      }

      const gameType = selectedSeries ? (selectedSeries.gameType as GameType) : (isStandalone ? standaloneGameType : league!.gameType);

      const matchId = await createMatch(db, {
        gameType,
        ...(leagueId && { leagueId }),
        ...(matchSeriesId && { seriesId: matchSeriesId }),
        date: matchDate,
        participants: matchParticipants,
        status: status,
        ...(seasonId && { seasonId: Number(seasonId) }),
        ...(weekNumber && { weekNumber: weekNumber }),
        ...(gameVariant && { gameVariant }),
        ...(gameData && { gameData }),
        quickEntryMode: quickEntryMode,
      });

      setIsSubmitting(false);

      // Reset form state to prevent showing previous match data
      setSelectedLeague("");
      setLeague(null);
      setSelectedSeries(null);
      setIsStandalone(false);
      setStandaloneGameType('pool');
      setStandaloneCustomGameConfigId("");
      setCustomGameConfig(null);
      setParticipants([
        { playerId: "", isWinner: false },
        { playerId: "", isWinner: false },
      ]);
      setPlayerCount(2);
      setMatchDate(Date.now());
      setShowDatePicker(false);
      setGameData(null);
      setGameVariant('');
      setQuickEntryMode(false);
      setErrors({});

      // Small delay to ensure DB operations complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Navigate back to origin based on context
      if (prefilledSeriesId) {
        // Series match - go back to series detail via Play tab
        router.replace("/(tabs)/play");
        router.push(`/series/${prefilledSeriesId}`);
      } else if (seasonId && prefilledLeagueId) {
        // Season match - go back to season detail via Leagues tab
        router.replace("/(tabs)/leagues");
        router.push(`/leagues/${prefilledLeagueId}/seasons/${seasonId}`);
      } else {
        // Standalone match - go to Play tab
        router.replace("/(tabs)/play");
      }
    } catch (err) {
      console.error("Failed to save match:", err);
      setErrors({ general: (err as Error).message || "Failed to save match. Please try again." });
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    Keyboard.dismiss();
    router.back();
  };

  const getPlayerName = (playerId: string) => {
    const player = leaguePlayers.find((p) => p.id === Number(playerId));
    return player ? `${player.firstName} ${player.lastName}` : "";
  };

  if (isLoading) {
    return (
      <Center className="flex-1 bg-background-0">
        <VStack space="md" className="items-center">
          <Spinner size="large" />
          <Text className="text-typography-500">Loading...</Text>
        </VStack>
      </Center>
    );
  }

  // Enforce that at least 2 players must exist before matches can be created
  if (totalPlayers < 2) {
    return (
      <SafeAreaView className="flex-1 bg-background-0">
        <VStack className="flex-1 p-6" space="2xl">
          <Heading size="3xl" className="text-typography-900">
            Record Match
          </Heading>
          <Center className="flex-1">
            <VStack space="md" className="items-center max-w-md">
              <Text className="text-typography-500 text-center text-lg">
                {totalPlayers === 0 ? 'Create players first' : 'Need one more player'}
              </Text>
              <Text className="text-typography-400 text-center">
                {totalPlayers === 0
                  ? 'You need at least 2 players to record a match. Tap below to add your first players.'
                  : `You have ${totalPlayers} player, but need at least 2 to record a match. Add one more player to continue.`
                }
              </Text>
              <Button
                size="lg"
                action="primary"
                onPress={() => router.push("/(tabs)/players")}
              >
                <ButtonText>Go to Players</ButtonText>
              </Button>
              <Button
                size="md"
                variant="link"
                onPress={() => router.back()}
              >
                <ButtonText>Go Back</ButtonText>
              </Button>
            </VStack>
          </Center>
        </VStack>
      </SafeAreaView>
    );
  }

  // Get game config from either league or standalone game type
  const gameConfig = isStandalone
    ? getGameConfig(standaloneGameType)
    : league
    ? getGameConfig(league.gameType)
    : null;

  return (
    <SafeAreaView className="flex-1 bg-background-0">
      <ScrollView
        className="flex-1"
        contentContainerClassName="p-6"
        keyboardShouldPersistTaps="handled"
      >
        <VStack space="2xl">
          <Heading size="3xl" className="text-typography-900">
            Record Match
          </Heading>

          <VStack space="xl">
            {/* League or Series Selection */}
            <FormControl isRequired isInvalid={!!errors.league}>
              <FormControlLabel>
                <FormControlLabelText>League or Series</FormControlLabelText>
              </FormControlLabel>
              <SearchableSelect
                options={[
                  { label: "Standalone Match", value: "standalone" },
                  ...leagues.map((league) => ({
                    label: league.name,
                    value: String(league.id),
                  })),
                  ...availableSeries.map((series) => ({
                    label: `📊 ${series.name}`,
                    value: `series-${series.id}`,
                  })),
                ]}
                selectedValue={selectedLeague}
                onValueChange={setSelectedLeague}
                placeholder="Select league, series, or standalone"
                searchPlaceholder="Search..."
                emptyMessage="No leagues or series found"
                isDisabled={isSubmitting}
                size="lg"
                variant="outline"
              />
              {errors.league && (
                <FormControlError>
                  <FormControlErrorText>{errors.league}</FormControlErrorText>
                </FormControlError>
              )}
            </FormControl>

            {/* Game Type Selector (for standalone matches) */}
            {isStandalone && (
              <>
                <FormControl isRequired>
                  <FormControlLabel>
                    <FormControlLabelText>
                      Game Type
                      {prefilledGameType && ' (from series)'}
                    </FormControlLabelText>
                  </FormControlLabel>
                  <Select
                    selectedValue={standaloneGameType}
                    onValueChange={(value) => setStandaloneGameType(value as GameType)}
                    isDisabled={isSubmitting || !!prefilledGameType}
                  >
                    <SelectTrigger variant="outline" size="lg">
                      <SelectInput
                        className="flex-1"
                        value={
                          standaloneGameType === 'custom'
                            ? 'Custom Game'
                            : standaloneGameType.charAt(0).toUpperCase() + standaloneGameType.slice(1)
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
                        <SelectItem label="Pool" value="pool" />
                        <SelectItem label="Darts" value="darts" />
                        <SelectItem label="Dominos" value="dominos" />
                        <SelectItem label="Uno" value="uno" />
                        <SelectItem label="Custom Game" value="custom" />
                      </SelectContent>
                    </SelectPortal>
                  </Select>
                </FormControl>

                {/* Custom Game Configuration Selector */}
                {standaloneGameType === 'custom' && (
                  <FormControl isRequired>
                    <FormControlLabel>
                      <FormControlLabelText>Custom Game</FormControlLabelText>
                    </FormControlLabel>
                    {customGameConfigs.length > 0 ? (
                      <Select
                        selectedValue={standaloneCustomGameConfigId}
                        onValueChange={setStandaloneCustomGameConfigId}
                        isDisabled={isSubmitting}
                      >
                        <SelectTrigger variant="outline" size="lg">
                          <SelectInput
                            placeholder="Select custom game"
                            value={
                              standaloneCustomGameConfigId
                                ? customGameConfigs.find(c => String(c.id) === standaloneCustomGameConfigId)?.name || ""
                                : ""
                            }
                            className="flex-1"
                          />
                          <SelectIcon as={ChevronDownIcon} className="ml-auto mr-3" />
                        </SelectTrigger>
                        <SelectPortal>
                          <SelectBackdrop />
                          <SelectContent>
                            <SelectDragIndicatorWrapper>
                              <SelectDragIndicator />
                            </SelectDragIndicatorWrapper>
                            {customGameConfigs.map((config) => (
                              <SelectItem
                                key={config.id}
                                label={config.name}
                                value={String(config.id)}
                              />
                            ))}
                          </SelectContent>
                        </SelectPortal>
                      </Select>
                    ) : (
                      <Text className="text-typography-500">
                        No custom games available. Create one first.
                      </Text>
                    )}
                  </FormControl>
                )}
              </>
            )}

            {/* Season & Week Info */}
            {seasonId && weekNumber && (
              <Card size="sm" variant="outline" className="p-3 bg-primary-50">
                <Text size="sm" className="text-typography-700">
                  📅 Recording for Week {weekNumber}
                </Text>
              </Card>
            )}

            {/* Match Date */}
            <FormControl>
              <FormControlLabel>
                <FormControlLabelText>Match Date</FormControlLabelText>
              </FormControlLabel>
              <Button
                variant="outline"
                size="lg"
                onPress={() => setShowDatePicker(true)}
                isDisabled={isSubmitting}
                className="justify-start px-4"
              >
                <HStack className="items-center gap-3">
                  <Icon
                    as={Calendar}
                    size="sm"
                    className="text-typography-500"
                  />
                  <Text className="text-typography-900">
                    {formatDisplayDate(matchDate)}
                  </Text>
                </HStack>
              </Button>
            </FormControl>

            {showDatePicker && (
              <>
                <DateTimePicker
                  value={new Date(matchDate)}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={handleDateChange}
                  maximumDate={new Date()}
                />
                {Platform.OS === "ios" && (
                  <Button
                    size="sm"
                    action="primary"
                    onPress={() => setShowDatePicker(false)}
                  >
                    <ButtonText>Done</ButtonText>
                  </Button>
                )}
              </>
            )}

            {/* Player Count Selector (if game supports variable count) */}
            {(selectedLeague || isStandalone) && gameConfig && gameConfig.minPlayers !== gameConfig.maxPlayers && (
              <FormControl>
                <FormControlLabel>
                  <FormControlLabelText>Number of Players</FormControlLabelText>
                </FormControlLabel>
                <Select
                  selectedValue={String(playerCount)}
                  onValueChange={(v) => updatePlayerCount(Number(v))}
                  isDisabled={isSubmitting}
                >
                  <SelectTrigger variant="outline" size="lg">
                    <SelectInput
                      className="flex-1"
                      value={String(playerCount)}
                    />
                    <SelectIcon as={ChevronDownIcon} className="ml-auto mr-3" />
                  </SelectTrigger>
                  <SelectPortal>
                    <SelectBackdrop />
                    <SelectContent>
                      <SelectDragIndicatorWrapper>
                        <SelectDragIndicator />
                      </SelectDragIndicatorWrapper>
                      {Array.from(
                        { length: gameConfig.maxPlayers - gameConfig.minPlayers + 1 },
                        (_, i) => gameConfig.minPlayers + i
                      ).map((count) => (
                        <SelectItem
                          key={count}
                          label={`${count} Players`}
                          value={String(count)}
                        />
                      ))}
                    </SelectContent>
                  </SelectPortal>
                </Select>
              </FormControl>
            )}

            {/* Participants List */}
            {(selectedLeague || isStandalone) && leaguePlayers.length >= 2 && (
              <>
                <Divider />
                <Heading size="md">Players</Heading>

                {participants.map((participant, index) => (
                  <Card key={index} size="md" variant="outline" className="p-4">
                    <VStack space="md">
                      <HStack className="items-center justify-between">
                        <Text className="font-semibold">Player {index + 1}</Text>
                        <Checkbox
                          value="winner"
                          isChecked={participant.isWinner}
                          onChange={(checked) =>
                            updateParticipant(index, { isWinner: checked })
                          }
                          isDisabled={isSubmitting}
                        >
                          <CheckboxIndicator>
                            <CheckboxIcon as={CheckIcon} />
                          </CheckboxIndicator>
                          <CheckboxLabel>Winner</CheckboxLabel>
                        </Checkbox>
                      </HStack>

                      <SearchableSelect
                        options={leaguePlayers
                          .filter(
                            (p) =>
                              !participants.some(
                                (part, partIdx) =>
                                  partIdx !== index &&
                                  part.playerId === String(p.id)
                              )
                          )
                          .map((player) => ({
                            label: `${player.firstName} ${player.lastName}`,
                            value: String(player.id),
                          }))}
                        selectedValue={participant.playerId}
                        onValueChange={(value) =>
                          updateParticipant(index, { playerId: value })
                        }
                        placeholder={
                          prefilledPlayerAId || prefilledPlayerBId
                            ? `Player ${index + 1} (from series)`
                            : `Select player ${index + 1}`
                        }
                        searchPlaceholder="Search players..."
                        emptyMessage="No players found"
                        isDisabled={isSubmitting || !!(prefilledPlayerAId || prefilledPlayerBId)}
                        size="lg"
                        variant="outline"
                      />
                    </VStack>
                  </Card>
                ))}

                {errors.participants && (
                  <FormControl isInvalid>
                    <FormControlError>
                      <FormControlErrorText>
                        {errors.participants}
                      </FormControlErrorText>
                    </FormControlError>
                  </FormControl>
                )}

                {errors.winner && (
                  <FormControl isInvalid>
                    <FormControlError>
                      <FormControlErrorText>
                        {errors.winner}
                      </FormControlErrorText>
                    </FormControlError>
                  </FormControl>
                )}
              </>
            )}

            {/* Quick Entry Mode Toggle */}
            {(selectedLeague || isStandalone) && participants.every((p) => p.playerId) && (
              <>
                <Divider />
                <FormControl>
                  <HStack className="items-center justify-between">
                    <VStack className="flex-1">
                      <FormControlLabel>
                        <FormControlLabelText>Quick Entry (Winner Only)</FormControlLabelText>
                      </FormControlLabel>
                      <Text size="sm" className="text-typography-500">
                        Skip detailed scoring and only record the winner
                      </Text>
                    </VStack>
                    <Switch
                      value={quickEntryMode}
                      onValueChange={setQuickEntryMode}
                    />
                  </HStack>
                </FormControl>
              </>
            )}

            {/* Game-Specific Forms */}
            {(selectedLeague || isStandalone) && participants.every((p) => p.playerId) && !quickEntryMode && (
              <>
                <Divider />
                <Heading size="md">Game Details</Heading>

                {(isStandalone ? standaloneGameType : league?.gameType) === 'pool' && (
                  <PoolMatchForm
                    variant={gameVariant as PoolVariant}
                    onVariantChange={setGameVariant}
                    onDataChange={(data) => {
                      // Pool game doesn't have finalScores, so playerScores is empty
                      setGameData({ ...data, playerScores: {} });
                    }}
                  />
                )}

                {(isStandalone ? standaloneGameType : league?.gameType) === 'darts' && (
                  <DartsMatchForm
                    variant={gameVariant}
                    onVariantChange={setGameVariant}
                    participants={buildParticipantInfoList()}
                    onDataChange={(data) => {
                      // Darts game doesn't have finalScores, so playerScores is empty
                      setGameData({ ...data, playerScores: {} });
                    }}
                    onWinnersChange={(winnerPlayerIds) => {
                      // Auto-set winners from live tracking
                      setParticipants((prev) =>
                        prev.map((p) => ({
                          ...p,
                          isWinner: winnerPlayerIds.includes(Number(p.playerId)),
                        }))
                      );
                    }}
                  />
                )}

                {(isStandalone ? standaloneGameType : league?.gameType) === 'dominos' && (
                  <DominosMatchForm
                    participants={buildParticipantInfoList()}
                    onDataChange={(data) => {
                      // Convert DominosGameData to GameData by adding playerScores
                      const participantList = buildParticipantInfoList();
                      const playerScores: Record<number, number> = {};
                      participantList.forEach((p, idx) => {
                        playerScores[p.playerId] = data.finalScores[idx] || 0;
                      });
                      setGameData({ ...data, playerScores });
                    }}
                    onWinnersChange={(winnerPlayerIds) => {
                      // Auto-set winners based on dominos target score
                      setParticipants((prev) =>
                        prev.map((p) => ({
                          ...p,
                          isWinner: winnerPlayerIds.includes(Number(p.playerId)),
                        }))
                      );
                    }}
                  />
                )}

                {(isStandalone ? standaloneGameType : league?.gameType) === 'uno' && (
                  <UnoMatchForm
                    participants={buildParticipantInfoList()}
                    onDataChange={(data) => {
                      // Convert UnoGameData to GameData by adding playerScores
                      const participantList = buildParticipantInfoList();
                      const playerScores: Record<number, number> = {};
                      participantList.forEach((p, idx) => {
                        playerScores[p.playerId] = data.finalScores[idx] || 0;
                      });
                      setGameData({ ...data, playerScores });
                    }}
                    onWinnersChange={(winnerPlayerIds) => {
                      // Auto-set winners based on uno target score
                      setParticipants((prev) =>
                        prev.map((p) => ({
                          ...p,
                          isWinner: winnerPlayerIds.includes(Number(p.playerId)),
                        }))
                      );
                    }}
                  />
                )}

                {(isStandalone ? standaloneGameType : league?.gameType) === 'custom' && customGameConfig && (
                  <CustomMatchForm
                    participants={buildParticipantInfoList()}
                    config={customGameConfig}
                    onDataChange={(data) => {
                      // CustomGameData already has playerScores
                      setGameData(data as GameData);
                    }}
                    onWinnersChange={(winnerPlayerIds) => {
                      // Auto-set winners based on custom game config
                      setParticipants((prev) =>
                        prev.map((p) => ({
                          ...p,
                          isWinner: winnerPlayerIds.includes(Number(p.playerId)),
                        }))
                      );
                    }}
                  />
                )}
              </>
            )}

            {/* General Error */}
            {errors.general && (
              <FormControl isInvalid>
                <FormControlError>
                  <FormControlErrorText>{errors.general}</FormControlErrorText>
                </FormControlError>
              </FormControl>
            )}
          </VStack>

          {/* Action Buttons */}
          <VStack space="md" className="mt-4">
            <HStack space="md">
              <Button
                variant="outline"
                size="lg"
                className="flex-1"
                onPress={() => {
                  Alert.alert(
                    'Cancel Match?',
                    'Are you sure you want to cancel? All progress will be lost.',
                    [
                      { text: 'Keep Editing', style: 'cancel' },
                      {
                        text: 'Cancel Match',
                        style: 'destructive',
                        onPress: handleCancel,
                      },
                    ]
                  );
                }}
                isDisabled={isSubmitting}
              >
                <ButtonText>Cancel</ButtonText>
              </Button>

              <Button
                size="lg"
                className="flex-1 bg-secondary-500"
                onPress={() => {
                  Alert.alert(
                    'Complete Match?',
                    'Are you sure you want to complete this match? This action cannot be undone.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Complete Match',
                        style: 'default',
                        onPress: () => handleSubmit('completed'),
                      },
                    ]
                  );
                }}
                isDisabled={isSubmitting || participants.some(p => !p.playerId)}
              >
                <ButtonText numberOfLines={1}>
                  {isSubmitting ? "Saving..." : "Complete Match"}
                </ButtonText>
              </Button>
            </HStack>

            {/* Save as In Progress option for games that track multiple games */}
            {(isStandalone ? standaloneGameType : league?.gameType) === 'dominos' ||
             (isStandalone ? standaloneGameType : league?.gameType) === 'uno' ? (
              <Button
                action="secondary"
                size="lg"
                variant="outline"
                onPress={() => handleSubmit('in_progress')}
                isDisabled={isSubmitting || participants.some(p => !p.playerId)}
              >
                <ButtonText numberOfLines={1}>
                  Save In Progress
                </ButtonText>
              </Button>
            ) : null}
          </VStack>
        </VStack>
      </ScrollView>
    </SafeAreaView>
  );
}
