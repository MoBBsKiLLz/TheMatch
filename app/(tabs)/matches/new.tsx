import React, { useState, useEffect } from "react";
import { Keyboard, Alert } from "react-native";
import { SafeAreaView } from "@/components/ui/safe-area-view";
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
  Radio,
  RadioGroup,
  RadioIcon,
  RadioIndicator,
  RadioLabel,
} from "@/components/ui/radio";
import { CircleIcon } from "@/components/ui/icon";
import { Spinner } from "@/components/ui/spinner";
import { Center } from "@/components/ui/center";
import { router, useLocalSearchParams } from "expo-router";
import { useDatabase } from "@/lib/db/provider";
import { League } from "@/types/league";
import { Match } from "@/types/match";
import { createMatch, updateMatch } from "@/lib/db/matches";
import { getLeaguePlayers } from "@/lib/db/playerLeagues";
import { findById } from "@/lib/db/queries";

export default function NewMatch() {
  const { db } = useDatabase();
  const { id, mode } = useLocalSearchParams<{ id?: string; mode?: string }>();
  const isEditMode: boolean = mode === "edit" && !!id;
  const [leagues, setLeagues] = useState<League[]>([]);
  const [selectedLeague, setSelectedLeague] = useState("");
  const [leaguePlayers, setLeaguePlayers] = useState<
    { id: number; firstName: string; lastName: string }[]
  >([]);
  const [playerAId, setPlayerAId] = useState("");
  const [playerBId, setPlayerBId] = useState("");
  const [winnerId, setWinnerId] = useState("");
  const [matchDate, setMatchDate] = useState(Date.now());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState<{
    league?: string;
    playerA?: string;
    playerB?: string;
    winner?: string;
    general?: string;
  }>({});

  // Load existing match if editing
  useEffect(() => {
    async function loadMatch() {
      if (!isEditMode || !db) return;

      try {
        const match = await findById<Match>(db, "matches", Number(id));
        if (match) {
          setSelectedLeague(String(match.leagueId));
          setPlayerAId(String(match.playerAId));
          setPlayerBId(String(match.playerBId));
          setWinnerId(match.winnerId ? String(match.winnerId) : "");
          setMatchDate(match.date);
        }
      } catch (error) {
        console.error("Failed to load match:", error);
        setErrors({ general: "Failed to load match data" });
      }
    }

    loadMatch();
  }, [db, id, isEditMode]);

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

  // Load players when league is selected
  useEffect(() => {
    async function loadPlayers() {
      if (!db || !selectedLeague) return;

      try {
        const players = await getLeaguePlayers(db, Number(selectedLeague));
        setLeaguePlayers(players);

        // Only reset player selections if NOT in edit mode
        if (!isEditMode) {
          setPlayerAId("");
          setPlayerBId("");
          setWinnerId("");
        }
      } catch (error) {
        console.error("Failed to load players:", error);
      }
    }

    loadPlayers();
  }, [db, selectedLeague]);

  const handlePlayerAChange = (value: string) => {
    setPlayerAId(value);
    // If Player B is now the same, clear it
    if (value === playerBId) {
      setPlayerBId("");
      setWinnerId("");
    }
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!selectedLeague) {
      newErrors.league = "Please select a league";
    }

    if (!playerAId) {
      newErrors.playerA = "Please select Player 1";
    }

    if (!playerBId) {
      newErrors.playerB = "Please select Player 2";
    }

    if (playerAId && playerBId && playerAId === playerBId) {
      newErrors.playerB = "Players must be different";
    }

    if (!winnerId) {
      newErrors.winner = "Please select a winner";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    setErrors({});

    if (!validateForm()) {
      return;
    }

    if (!db) {
      setErrors({ general: "Database not ready. Please try again." });
      return;
    }

    setIsSubmitting(true);
    Keyboard.dismiss();

    try {
      if (isEditMode) {
        // Update existing match
        await updateMatch(db, Number(id), {
          date: matchDate,
          playerAId: Number(playerAId),
          playerBId: Number(playerBId),
          winnerId: Number(winnerId),
          leagueId: Number(selectedLeague),
        });
      } else {
        // Create new match
        await createMatch(db, {
          date: matchDate,
          playerAId: Number(playerAId),
          playerBId: Number(playerBId),
          winnerId: Number(winnerId),
          leagueId: Number(selectedLeague),
        });
      }

      router.back();
    } catch (err) {
      console.error("Failed to save match:", err);
      setErrors({ general: "Failed to save match. Please try again." });
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    Keyboard.dismiss();
    router.back();
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

  if (leagues.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-background-0">
        <VStack className="flex-1 p-6" space="2xl">
          <Heading size="3xl" className="text-typography-900">
            {isEditMode ? "Edit Match" : "Record Match"}
          </Heading>
          <Center className="flex-1">
            <VStack space="md" className="items-center">
              <Text className="text-typography-500 text-center">
                No leagues available.
              </Text>
              <Text className="text-typography-400 text-center">
                Create a league first.
              </Text>
              <Button onPress={() => router.back()}>
                <ButtonText>Go Back</ButtonText>
              </Button>
            </VStack>
          </Center>
        </VStack>
      </SafeAreaView>
    );
  }

  const getPlayerName = (playerId: string) => {
    const player = leaguePlayers.find((p) => p.id === Number(playerId));
    return player ? `${player.firstName} ${player.lastName}` : "";
  };

  const getPlayerDisplayName = (playerId: string): string => {
    if (!playerId) return "";
    const player = leaguePlayers.find((p) => p.id === Number(playerId));
    return player ? `${player.firstName} ${player.lastName}` : "";
  };

  return (
    <SafeAreaView className="flex-1 bg-background-0">
      <ScrollView
        className="flex-1"
        contentContainerClassName="p-6"
        keyboardShouldPersistTaps="handled"
      >
        <VStack space="2xl">
          <Heading size="3xl" className="text-typography-900">
            {isEditMode ? "Edit Match" : "Record Match"}
          </Heading>

          <VStack space="xl">
            {/* League Selection */}
            <FormControl isRequired isInvalid={!!errors.league}>
              <FormControlLabel>
                <FormControlLabelText>League</FormControlLabelText>
              </FormControlLabel>
              <Select
                selectedValue={selectedLeague}
                onValueChange={setSelectedLeague}
                isDisabled={isSubmitting || isEditMode} // Can't change league in edit mode
              >
                <SelectTrigger variant="outline" size="lg">
                  <SelectInput
                    placeholder="Select league"
                    value={
                      selectedLeague === "all"
                        ? "All Leagues"
                        : leagues.find((l) => String(l.id) === selectedLeague)
                            ?.name || ""
                    }
                  />
                  <SelectIcon as={ChevronDownIcon} className="mr-3" />
                </SelectTrigger>
                <SelectPortal>
                  <SelectBackdrop />
                  <SelectContent>
                    <SelectDragIndicatorWrapper>
                      <SelectDragIndicator />
                    </SelectDragIndicatorWrapper>
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
              {errors.league && (
                <FormControlError>
                  <FormControlErrorText>{errors.league}</FormControlErrorText>
                </FormControlError>
              )}
            </FormControl>

            {/* Player A Selection */}
            {selectedLeague && (
              <>
                {leaguePlayers.length < 2 ? (
                  <FormControl>
                    <FormControlError>
                      <FormControlErrorText>
                        This league needs at least 2 players to record a match.
                      </FormControlErrorText>
                    </FormControlError>
                  </FormControl>
                ) : (
                  <>
                    <FormControl isRequired isInvalid={!!errors.playerA}>
                      <FormControlLabel>
                        <FormControlLabelText>Player 1</FormControlLabelText>
                      </FormControlLabel>
                      <Select
                        selectedValue={playerAId}
                        onValueChange={handlePlayerAChange}
                        isDisabled={isSubmitting}
                      >
                        <SelectTrigger variant="outline" size="lg">
                          <SelectInput
                            className="flex-1"
                            placeholder="Select player 1"
                            value={getPlayerDisplayName(playerAId)}
                          />
                          <SelectIcon
                            as={ChevronDownIcon}
                            className="ml-auto mr-3"
                          />
                        </SelectTrigger>
                        <SelectPortal>
                          <SelectBackdrop />
                          <SelectContent>
                            <SelectDragIndicatorWrapper>
                              <SelectDragIndicator />
                            </SelectDragIndicatorWrapper>
                            {leaguePlayers.map((player) => (
                              <SelectItem
                                key={player.id}
                                label={`${player.firstName} ${player.lastName}`}
                                value={String(player.id)}
                              />
                            ))}
                          </SelectContent>
                        </SelectPortal>
                      </Select>
                      {errors.playerA && (
                        <FormControlError>
                          <FormControlErrorText>
                            {errors.playerA}
                          </FormControlErrorText>
                        </FormControlError>
                      )}
                    </FormControl>

                    {/* Player B Selection */}
                    <FormControl isRequired isInvalid={!!errors.playerB}>
                      <FormControlLabel>
                        <FormControlLabelText>Player 2</FormControlLabelText>
                      </FormControlLabel>
                      <Select
                        selectedValue={playerBId}
                        onValueChange={setPlayerBId}
                        isDisabled={isSubmitting}
                      >
                        <SelectTrigger variant="outline" size="lg">
                          <SelectInput
                            className="flex-1"
                            placeholder="Select player 2"
                            value={getPlayerDisplayName(playerBId)}
                          />
                          <SelectIcon
                            as={ChevronDownIcon}
                            className="ml-auto mr-3"
                          />
                        </SelectTrigger>
                        <SelectPortal>
                          <SelectBackdrop />
                          <SelectContent>
                            <SelectDragIndicatorWrapper>
                              <SelectDragIndicator />
                            </SelectDragIndicatorWrapper>
                            {leaguePlayers
                              .filter((p) => p.id !== Number(playerAId))
                              .map((player) => (
                                <SelectItem
                                  key={player.id}
                                  label={`${player.firstName} ${player.lastName}`}
                                  value={String(player.id)}
                                />
                              ))}
                          </SelectContent>
                        </SelectPortal>
                      </Select>
                      {errors.playerB && (
                        <FormControlError>
                          <FormControlErrorText>
                            {errors.playerB}
                          </FormControlErrorText>
                        </FormControlError>
                      )}
                    </FormControl>

                    {/* Winner Selection */}
                    {playerAId && playerBId && (
                      <FormControl isRequired isInvalid={!!errors.winner}>
                        <FormControlLabel>
                          <FormControlLabelText>Winner</FormControlLabelText>
                        </FormControlLabel>
                        <RadioGroup value={winnerId} onChange={setWinnerId}>
                          <VStack space="md">
                            <Radio value={playerAId} isDisabled={isSubmitting}>
                              <RadioIndicator>
                                <RadioIcon as={CircleIcon} />
                              </RadioIndicator>
                              <RadioLabel>
                                {getPlayerName(playerAId)}
                              </RadioLabel>
                            </Radio>
                            <Radio value={playerBId} isDisabled={isSubmitting}>
                              <RadioIndicator>
                                <RadioIcon as={CircleIcon} />
                              </RadioIndicator>
                              <RadioLabel>
                                {getPlayerName(playerBId)}
                              </RadioLabel>
                            </Radio>
                          </VStack>
                        </RadioGroup>
                        {errors.winner && (
                          <FormControlError>
                            <FormControlErrorText>
                              {errors.winner}
                            </FormControlErrorText>
                          </FormControlError>
                        )}
                      </FormControl>
                    )}
                  </>
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
          <HStack space="md" className="mt-4">
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
              onPress={handleSubmit}
              isDisabled={isSubmitting || leaguePlayers.length < 2}
            >
              <ButtonText>
                {isSubmitting
                  ? "Saving..."
                  : isEditMode
                  ? "Update"
                  : "Record Match"}
              </ButtonText>
            </Button>
          </HStack>
        </VStack>
      </ScrollView>
    </SafeAreaView>
  );
}
