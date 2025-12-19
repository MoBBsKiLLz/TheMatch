import React, { useState, useEffect } from "react";
import { Alert, Keyboard } from "react-native";
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
  FormControlHelper,
  FormControlHelperText,
} from "@/components/ui/form-control";
import { Input, InputField } from "@/components/ui/input";
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
import { Switch } from "@/components/ui/switch";
import { router, useLocalSearchParams } from "expo-router";
import { useDatabase } from "@/lib/db/provider";
import { ScoringMethod, WinCondition, CustomGameConfig } from "@/types/customGame";
import {
  createCustomGameConfig,
  updateCustomGameConfig,
  getCustomGameConfig,
} from "@/lib/db/customGames";

export default function NewCustomGame() {
  const { db } = useDatabase();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!id;

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [scoringMethod, setScoringMethod] = useState<ScoringMethod>("points");
  const [winCondition, setWinCondition] = useState<WinCondition>("target_score");
  const [targetValue, setTargetValue] = useState("500");
  const [minPlayers, setMinPlayers] = useState("2");
  const [maxPlayers, setMaxPlayers] = useState("4");
  const [trackIndividualGames, setTrackIndividualGames] = useState(false);
  const [allowNegativeScores, setAllowNegativeScores] = useState(false);
  const [pointsPerWin, setPointsPerWin] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load existing config if editing
  useEffect(() => {
    if (isEditing && db && id) {
      loadConfig();
    }
  }, [db, id, isEditing]);

  const loadConfig = async () => {
    if (!db || !id) return;

    try {
      const config = await getCustomGameConfig(db, Number(id));
      if (config) {
        setName(config.name);
        setDescription(config.description || "");
        setScoringMethod(config.scoringMethod);
        setWinCondition(config.winCondition);
        setTargetValue(String(config.targetValue));
        setMinPlayers(String(config.minPlayers));
        setMaxPlayers(String(config.maxPlayers));
        setTrackIndividualGames(config.trackIndividualGames);
        setAllowNegativeScores(config.allowNegativeScores);
        setPointsPerWin(config.pointsPerWin ? String(config.pointsPerWin) : "");
      }
    } catch (error) {
      console.error("Failed to load custom game config:", error);
      Alert.alert("Error", "Failed to load custom game configuration");
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = "Game name is required";
    }

    const targetVal = parseInt(targetValue);
    if (isNaN(targetVal) || targetVal <= 0) {
      newErrors.targetValue = "Target value must be a positive number";
    }

    const minP = parseInt(minPlayers);
    const maxP = parseInt(maxPlayers);

    if (isNaN(minP) || minP < 2 || minP > 10) {
      newErrors.minPlayers = "Minimum players must be between 2 and 10";
    }

    if (isNaN(maxP) || maxP < 2 || maxP > 10) {
      newErrors.maxPlayers = "Maximum players must be between 2 and 10";
    }

    if (!isNaN(minP) && !isNaN(maxP) && minP > maxP) {
      newErrors.maxPlayers = "Maximum must be >= minimum";
    }

    if (pointsPerWin && (isNaN(parseInt(pointsPerWin)) || parseInt(pointsPerWin) <= 0)) {
      newErrors.pointsPerWin = "Points per win must be a positive number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    if (!db) {
      Alert.alert("Error", "Database not ready. Please try again.");
      return;
    }

    setIsSubmitting(true);
    Keyboard.dismiss();

    try {
      const configData = {
        name: name.trim(),
        description: description.trim() || undefined,
        scoringMethod,
        winCondition,
        targetValue: parseInt(targetValue),
        minPlayers: parseInt(minPlayers),
        maxPlayers: parseInt(maxPlayers),
        trackIndividualGames,
        allowNegativeScores,
        pointsPerWin: pointsPerWin ? parseInt(pointsPerWin) : undefined,
      };

      if (isEditing && id) {
        await updateCustomGameConfig(db, Number(id), configData);
      } else {
        await createCustomGameConfig(db, configData);
      }

      router.back();
    } catch (error) {
      console.error("Failed to save custom game config:", error);
      Alert.alert("Error", "Failed to save custom game configuration");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getScoringMethodLabel = (method: ScoringMethod) => {
    switch (method) {
      case 'points': return 'Points';
      case 'games_won': return 'Games Won';
      case 'rounds': return 'Rounds';
      default: return method;
    }
  };

  const getWinConditionLabel = (condition?: WinCondition) => {
    const cond = condition || winCondition;
    switch (cond) {
      case 'target_score': return 'Target Score';
      case 'best_of_games': return 'Best Of';
      case 'most_points': return 'Most Points';
      default: return '';
    }
  };

  const getWinConditionDescription = () => {
    switch (winCondition) {
      case 'target_score': return 'First to reach target';
      case 'best_of_games': return 'Best of X games';
      case 'most_points': return 'Most points after X rounds';
      default: return '';
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background-0">
      <ScrollView
        className="flex-1"
        contentContainerClassName="p-6"
        keyboardShouldPersistTaps="handled"
      >
        <VStack space="2xl">
          <VStack space="sm">
            <Heading size="3xl" className="text-typography-900">
              {isEditing ? "Edit Custom Game" : "Create Custom Game"}
            </Heading>
            <Text className="text-typography-500">
              Define the rules for your custom game type
            </Text>
          </VStack>

          <VStack space="xl">
            {/* Game Name */}
            <FormControl isRequired isInvalid={!!errors.name}>
              <FormControlLabel>
                <FormControlLabelText>Game Name</FormControlLabelText>
              </FormControlLabel>
              <Input variant="outline" size="lg">
                <InputField
                  placeholder="e.g., Cornhole, Foosball, Ping Pong"
                  value={name}
                  onChangeText={setName}
                />
              </Input>
              {errors.name && (
                <FormControlError>
                  <FormControlErrorText>{errors.name}</FormControlErrorText>
                </FormControlError>
              )}
            </FormControl>

            {/* Description */}
            <FormControl>
              <FormControlLabel>
                <FormControlLabelText>Description (Optional)</FormControlLabelText>
              </FormControlLabel>
              <Input variant="outline" size="lg">
                <InputField
                  placeholder="Brief description of the game"
                  value={description}
                  onChangeText={setDescription}
                />
              </Input>
            </FormControl>

            {/* Scoring Method */}
            <FormControl isRequired>
              <FormControlLabel>
                <FormControlLabelText>How is scoring tracked?</FormControlLabelText>
              </FormControlLabel>
              <Select
                selectedValue={scoringMethod}
                onValueChange={(value) => setScoringMethod(value as ScoringMethod)}
              >
                <SelectTrigger variant="outline" size="lg">
                  <SelectInput
                    placeholder="Select scoring method"
                    value={getScoringMethodLabel(scoringMethod)}
                  />
                  <SelectIcon as={ChevronDownIcon} className="ml-auto mr-3" />
                </SelectTrigger>
                <SelectPortal>
                  <SelectBackdrop />
                  <SelectContent>
                    <SelectDragIndicatorWrapper>
                      <SelectDragIndicator />
                    </SelectDragIndicatorWrapper>
                    <SelectItem label="Points (accumulated score)" value="points" />
                    <SelectItem label="Games Won (win count)" value="games_won" />
                    <SelectItem label="Rounds (completion count)" value="rounds" />
                  </SelectContent>
                </SelectPortal>
              </Select>
              <FormControlHelper>
                <FormControlHelperText>
                  Points: accumulate scores (Cornhole). Games Won: count wins (Ping Pong). Rounds: count completions.
                </FormControlHelperText>
              </FormControlHelper>
            </FormControl>

            {/* Win Condition */}
            <FormControl isRequired>
              <FormControlLabel>
                <FormControlLabelText>How is the winner determined?</FormControlLabelText>
              </FormControlLabel>
              <Select
                selectedValue={winCondition}
                onValueChange={(value) => setWinCondition(value as WinCondition)}
              >
                <SelectTrigger variant="outline" size="lg">
                  <SelectInput
                    placeholder="Select win condition"
                    value={getWinConditionLabel(winCondition)}
                  />
                  <SelectIcon as={ChevronDownIcon} className="ml-auto mr-3" />
                </SelectTrigger>
                <SelectPortal>
                  <SelectBackdrop />
                  <SelectContent>
                    <SelectDragIndicatorWrapper>
                      <SelectDragIndicator />
                    </SelectDragIndicatorWrapper>
                    <SelectItem label="Target Score - First to reach" value="target_score" />
                    <SelectItem label="Best Of - Most games won" value="best_of_games" />
                    <SelectItem label="Most Points - Highest after rounds" value="most_points" />
                  </SelectContent>
                </SelectPortal>
              </Select>
              <FormControlHelper>
                <FormControlHelperText>{getWinConditionDescription()}</FormControlHelperText>
              </FormControlHelper>
            </FormControl>

            {/* Target Value */}
            <FormControl isRequired isInvalid={!!errors.targetValue}>
              <FormControlLabel>
                <FormControlLabelText>
                  {winCondition === 'target_score' ? 'Target Score' : winCondition === 'best_of_games' ? 'Number of Games' : 'Number of Rounds'}
                </FormControlLabelText>
              </FormControlLabel>
              <Input variant="outline" size="lg">
                <InputField
                  placeholder="e.g., 21, 7, 10"
                  value={targetValue}
                  onChangeText={setTargetValue}
                  keyboardType="number-pad"
                />
              </Input>
              {errors.targetValue && (
                <FormControlError>
                  <FormControlErrorText>{errors.targetValue}</FormControlErrorText>
                </FormControlError>
              )}
            </FormControl>

            {/* Player Count */}
            <HStack space="md">
              <FormControl isRequired isInvalid={!!errors.minPlayers} className="flex-1">
                <FormControlLabel>
                  <FormControlLabelText>Min Players</FormControlLabelText>
                </FormControlLabel>
                <Input variant="outline" size="lg">
                  <InputField
                    placeholder="2"
                    value={minPlayers}
                    onChangeText={setMinPlayers}
                    keyboardType="number-pad"
                  />
                </Input>
                {errors.minPlayers && (
                  <FormControlError>
                    <FormControlErrorText>{errors.minPlayers}</FormControlErrorText>
                  </FormControlError>
                )}
              </FormControl>

              <FormControl isRequired isInvalid={!!errors.maxPlayers} className="flex-1">
                <FormControlLabel>
                  <FormControlLabelText>Max Players</FormControlLabelText>
                </FormControlLabel>
                <Input variant="outline" size="lg">
                  <InputField
                    placeholder="4"
                    value={maxPlayers}
                    onChangeText={setMaxPlayers}
                    keyboardType="number-pad"
                  />
                </Input>
                {errors.maxPlayers && (
                  <FormControlError>
                    <FormControlErrorText>{errors.maxPlayers}</FormControlErrorText>
                  </FormControlError>
                )}
              </FormControl>
            </HStack>

            {/* Track Individual Games */}
            <FormControl>
              <HStack className="justify-between items-center">
                <VStack className="flex-1">
                  <FormControlLabel>
                    <FormControlLabelText>Track Individual Games</FormControlLabelText>
                  </FormControlLabel>
                  <Text size="sm" className="text-typography-400">
                    Record each game separately (like Dominos/Uno)
                  </Text>
                </VStack>
                <Switch
                  value={trackIndividualGames}
                  onValueChange={setTrackIndividualGames}
                />
              </HStack>
            </FormControl>

            {/* Allow Negative Scores */}
            <FormControl>
              <HStack className="justify-between items-center">
                <VStack className="flex-1">
                  <FormControlLabel>
                    <FormControlLabelText>Allow Negative Scores</FormControlLabelText>
                  </FormControlLabel>
                  <Text size="sm" className="text-typography-400">
                    Scores can go below zero
                  </Text>
                </VStack>
                <Switch
                  value={allowNegativeScores}
                  onValueChange={setAllowNegativeScores}
                />
              </HStack>
            </FormControl>

            {/* Points Per Win (Optional) */}
            {scoringMethod === 'points' && winCondition === 'best_of_games' && (
              <FormControl isInvalid={!!errors.pointsPerWin}>
                <FormControlLabel>
                  <FormControlLabelText>Points Per Win (Optional)</FormControlLabelText>
                </FormControlLabel>
                <Input variant="outline" size="lg">
                  <InputField
                    placeholder="Leave empty to count wins only"
                    value={pointsPerWin}
                    onChangeText={setPointsPerWin}
                    keyboardType="number-pad"
                  />
                </Input>
                <FormControlHelper>
                  <FormControlHelperText>
                    Award fixed points for each game won
                  </FormControlHelperText>
                </FormControlHelper>
                {errors.pointsPerWin && (
                  <FormControlError>
                    <FormControlErrorText>{errors.pointsPerWin}</FormControlErrorText>
                  </FormControlError>
                )}
              </FormControl>
            )}
          </VStack>

          {/* Action Buttons */}
          <HStack space="md" className="mt-4">
            <Button
              variant="outline"
              size="lg"
              className="flex-1"
              onPress={() => router.back()}
              isDisabled={isSubmitting}
            >
              <ButtonText>Cancel</ButtonText>
            </Button>

            <Button
              action="primary"
              size="lg"
              className="flex-1"
              onPress={handleSubmit}
              isDisabled={isSubmitting}
            >
              <ButtonText numberOfLines={1}>
                {isSubmitting ? "Saving..." : isEditing ? "Update Game" : "Create Game"}
              </ButtonText>
            </Button>
          </HStack>
        </VStack>
      </ScrollView>
    </SafeAreaView>
  );
}
