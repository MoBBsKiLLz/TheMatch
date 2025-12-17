import React, { useState, useEffect } from "react";
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
import { CheckIcon } from "lucide-react-native";
import { Spinner } from "@/components/ui/spinner";
import { Center } from "@/components/ui/center";
import { router, useLocalSearchParams } from "expo-router";
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
import { ParticipantInfo } from "@/components/match-forms/types";
import { SearchableSelect, SelectOption } from "@/components/SearchableSelect";
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
  } = useLocalSearchParams<{
    leagueId?: string;
    seasonId?: string;
    weekNumber?: string;
    playerAId?: string;
    playerBId?: string;
  }>();

  const [leagues, setLeagues] = useState<League[]>([]);
  const [selectedLeague, setSelectedLeague] = useState<string>("");
  const [league, setLeague] = useState<League | null>(null);
  const [leaguePlayers, setLeaguePlayers] = useState<
    { id: number; firstName: string; lastName: string }[]
  >([]);

  // Standalone match state
  const [isStandalone, setIsStandalone] = useState(false);
  const [standaloneGameType, setStandaloneGameType] = useState<GameType>('pool');

  // Multi-player state
  const [participants, setParticipants] = useState<ParticipantState[]>([
    { playerId: "", isWinner: false },
    { playerId: "", isWinner: false },
  ]);
  const [playerCount, setPlayerCount] = useState(2);

  const [matchDate, setMatchDate] = useState(Date.now());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
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

  // Load leagues
  useEffect(() => {
    async function loadLeagues() {
      if (!db) return;

      try {
        const results = await db.all<League>(
          "SELECT * FROM leagues ORDER BY name ASC"
        );
        setLeagues(results);
      } catch (error) {
        console.error("Failed to load leagues:", error);
        setErrors({ general: "Failed to load leagues" });
      } finally {
        setIsLoading(false);
      }
    }

    loadLeagues();
  }, [db]);

  // Load league and players when league is selected OR when standalone mode
  useEffect(() => {
    async function loadLeagueAndPlayers() {
      if (!db) return;

      try {
        if (selectedLeague === "standalone") {
          // Standalone mode
          setIsStandalone(true);
          setLeague(null);

          // Load ALL players
          const allPlayers = await db.all<{id: number; firstName: string; lastName: string}>(
            'SELECT id, firstName, lastName FROM players ORDER BY lastName ASC, firstName ASC'
          );
          setLeaguePlayers(allPlayers);

          // Set default variant for standalone game type
          const config = getGameConfig(standaloneGameType);
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
        } else if (selectedLeague) {
          // League mode
          setIsStandalone(false);

          // Load league data
          const leagueData = await findById<League>(db, 'leagues', Number(selectedLeague));
          setLeague(leagueData);

          // Set default variant and player count based on game type
          if (leagueData?.gameType) {
            const config = getGameConfig(leagueData.gameType);
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

          // Load league players
          const players = await getLeaguePlayers(db, Number(selectedLeague));
          setLeaguePlayers(players);
        }
      } catch (error) {
        console.error("Failed to load league or players:", error);
      }
    }

    loadLeagueAndPlayers();
  }, [db, selectedLeague, standaloneGameType]);

  // Pre-fill league if provided
  useEffect(() => {
    if (prefilledLeagueId) {
      setSelectedLeague(prefilledLeagueId);
    }
  }, [prefilledLeagueId]);

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

      // Validate against game config (only for completed matches)
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
        (p, index) => ({
          playerId: Number(p.playerId),
          seatIndex: index,
          isWinner: p.isWinner,
          score: null, // TODO: get from game-specific forms if needed
          finishPosition: null,
        })
      );

      const gameType = isStandalone ? standaloneGameType : league!.gameType;

      await createMatch(db, {
        gameType,
        ...(isStandalone ? {} : { leagueId: Number(selectedLeague) }),
        date: matchDate,
        participants: matchParticipants,
        status: status,
        ...(seasonId && { seasonId: Number(seasonId) }),
        ...(weekNumber && { weekNumber: weekNumber }),
        ...(gameVariant && { gameVariant }),
        ...(gameData && { gameData }),
      });

      setIsSubmitting(false);

      // Small delay to ensure DB operations complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Navigate back to season screen if this was a season match
      if (seasonId && prefilledLeagueId) {
        router.replace("/(tabs)/matches");
        router.push(`/leagues/${prefilledLeagueId}/seasons/${seasonId}`);
      } else {
        router.back();
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

  // Removed: No longer blocking standalone matches when no leagues exist
  // Users can record standalone matches without any leagues

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
            {/* League Selection */}
            <FormControl isRequired isInvalid={!!errors.league}>
              <FormControlLabel>
                <FormControlLabelText>League</FormControlLabelText>
              </FormControlLabel>
              <SearchableSelect
                options={[
                  { label: "Standalone Match", value: "standalone" },
                  ...leagues.map((league) => ({
                    label: league.name,
                    value: String(league.id),
                  })),
                ]}
                selectedValue={selectedLeague}
                onValueChange={setSelectedLeague}
                placeholder="Select league"
                searchPlaceholder="Search leagues..."
                emptyMessage="No leagues found"
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
              <FormControl isRequired>
                <FormControlLabel>
                  <FormControlLabelText>Game Type</FormControlLabelText>
                </FormControlLabel>
                <Select
                  selectedValue={standaloneGameType}
                  onValueChange={(value) => setStandaloneGameType(value as GameType)}
                  isDisabled={isSubmitting}
                >
                  <SelectTrigger variant="outline" size="lg">
                    <SelectInput
                      className="flex-1"
                      value={
                        standaloneGameType.charAt(0).toUpperCase() +
                        standaloneGameType.slice(1)
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
                    </SelectContent>
                  </SelectPortal>
                </Select>
              </FormControl>
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
                className="justify-start"
              >
                <HStack className="flex-1 justify-between items-center px-3">
                  <Text className="text-typography-900">
                    {formatDisplayDate(matchDate)}
                  </Text>
                  <Icon
                    as={Calendar}
                    size="sm"
                    className="text-typography-500"
                  />
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
                        placeholder={`Select player ${index + 1}`}
                        searchPlaceholder="Search players..."
                        emptyMessage="No players found"
                        isDisabled={isSubmitting}
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

            {/* Game-Specific Forms */}
            {(selectedLeague || isStandalone) && participants.every((p) => p.playerId) && (
              <>
                <Divider />
                <Heading size="md">Game Details</Heading>

                {(isStandalone ? standaloneGameType : league?.gameType) === 'pool' && (
                  <PoolMatchForm
                    variant={gameVariant as PoolVariant}
                    onVariantChange={setGameVariant}
                    onDataChange={setGameData}
                  />
                )}

                {(isStandalone ? standaloneGameType : league?.gameType) === 'darts' && (
                  <DartsMatchForm
                    variant={gameVariant}
                    onVariantChange={setGameVariant}
                    participants={buildParticipantInfoList()}
                    onDataChange={setGameData}
                  />
                )}

                {(isStandalone ? standaloneGameType : league?.gameType) === 'dominos' && (
                  <DominosMatchForm
                    participants={buildParticipantInfoList()}
                    onDataChange={setGameData}
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
                    onDataChange={setGameData}
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
                onPress={handleCancel}
                isDisabled={isSubmitting}
              >
                <ButtonText>Cancel</ButtonText>
              </Button>

              <Button
                action="primary"
                size="lg"
                className="flex-1"
                onPress={() => handleSubmit('completed')}
                isDisabled={isSubmitting || leaguePlayers.length < 2}
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
                isDisabled={isSubmitting || leaguePlayers.length < 2}
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
