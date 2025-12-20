import React, { useState, useEffect } from "react";
import { Keyboard, Platform, Alert } from "react-native";
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
import { Input, InputField } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Center } from "@/components/ui/center";
import { router, useLocalSearchParams, Href } from "expo-router";
import { useDatabase } from "@/lib/db/provider";
import { findById } from "@/lib/db/queries";
import { createSeason, updateSeason } from "@/lib/db/seasons";
import { League } from "@/types/league";
import { Season } from "@/types/season";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Calendar } from "lucide-react-native";
import { Icon } from "@/components/ui/icon";

export default function NewSeason() {
  const { db } = useDatabase();
  const { id, seasonId } = useLocalSearchParams<{ id: string; seasonId?: string }>();

  const [league, setLeague] = useState<League | null>(null);
  const [season, setSeason] = useState<Season | null>(null);
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState(Date.now());
  const [weeksDuration, setWeeksDuration] = useState(8);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const isEditMode = !!seasonId;

  useEffect(() => {
    async function loadData() {
      if (!db || !id) return;

      try {
        // Load league
        const leagueResult = await findById<League>(db, "leagues", Number(id));
        setLeague(leagueResult);

        // Load existing season if in edit mode
        if (isEditMode && seasonId) {
          const seasonResult = await findById<Season>(db, "seasons", Number(seasonId));
          setSeason(seasonResult);

          if (seasonResult) {
            setName(seasonResult.name);
            setStartDate(seasonResult.startDate);
            setWeeksDuration(seasonResult.weeksDuration);
          }
        } else if (leagueResult) {
          // Pre-fill with league defaults for new season
          setWeeksDuration(leagueResult.defaultDuration || 8);
          // Season name left empty to force user input and avoid duplicates
        }
      } catch (err) {
        console.error("Failed to load data:", err);
        setError("Failed to load data");
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [db, id, isEditMode, seasonId]);

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
      setStartDate(selectedDate.getTime());
    }
  };

  const handleSubmit = async () => {
    setError("");

    if (!name.trim()) {
      setError("Season name is required");
      return;
    }

    if (weeksDuration < 1 || weeksDuration > 52) {
      setError("Duration must be between 1 and 52 weeks");
      return;
    }

    if (!db || !id) {
      setError("Database not ready. Please try again.");
      return;
    }

    setIsSubmitting(true);
    Keyboard.dismiss();

    try {
      if (isEditMode && seasonId) {
        // Update existing season
        await updateSeason(db, Number(seasonId), {
          name: name.trim(),
          startDate,
          weeksDuration,
        });
        router.back();
      } else {
        // Create new season
        await createSeason(db, {
          leagueId: Number(id),
          name: name.trim(),
          startDate,
          weeksDuration,
        });

        // Check player count after creating season and show helpful guidance
        const playerCount = await db.get<{count: number}>(
          'SELECT COUNT(*) as count FROM player_leagues WHERE leagueId = ?',
          [Number(id)]
        );

        if ((playerCount?.count || 0) < 2) {
          Alert.alert(
            "Season Created",
            `Season "${name.trim()}" has been created, but you currently have ${playerCount?.count || 0} player(s) in this league.\n\nYou'll need to add at least 2 players before you can start recording matches or generating schedules.\n\nWould you like to add players now?`,
            [
              { text: "Add Players", onPress: () => {
                router.back();
                router.push(`/leagues/${id}/add-players` as Href);
              }},
              { text: "Later", style: "cancel", onPress: () => router.back() }
            ]
          );
        } else {
          router.back();
        }
      }
    } catch (err) {
      console.error(`Failed to ${isEditMode ? 'update' : 'create'} season:`, err);
      setError(`Failed to ${isEditMode ? 'update' : 'create'} season. Please try again.`);
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

  if (!league) {
    return (
      <Center className="flex-1 bg-background-0">
        <Text className="text-typography-500">League not found</Text>
      </Center>
    );
  }

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
              {isEditMode ? "Edit Season" : "Start New Season"}
            </Heading>
            <Text className="text-typography-500">
              for {league.name}
            </Text>
          </VStack>

          <VStack space="xl">
            {/* Season Name */}
            <FormControl isRequired isInvalid={!!error && !name.trim()}>
              <FormControlLabel>
                <FormControlLabelText>Season Name</FormControlLabelText>
              </FormControlLabel>
              <Input variant="outline" size="lg">
                <InputField
                  placeholder="e.g. Fall 2024"
                  value={name}
                  onChangeText={setName}
                  editable={!isSubmitting}
                  autoCapitalize="words"
                  returnKeyType="next"
                />
              </Input>
              {error && !name.trim() && (
                <FormControlError>
                  <FormControlErrorText>{error}</FormControlErrorText>
                </FormControlError>
              )}
            </FormControl>

            {/* Start Date */}
            <FormControl>
              <FormControlLabel>
                <FormControlLabelText>Start Date</FormControlLabelText>
              </FormControlLabel>
              <Button
                variant="outline"
                size="lg"
                onPress={() => setShowDatePicker(true)}
                isDisabled={isSubmitting}
                className="justify-start px-4"
              >
                <HStack className="items-center gap-3">
                  <Icon as={Calendar} size="sm" className="text-typography-500" />
                  <Text className="text-typography-900">
                    {formatDisplayDate(startDate)}
                  </Text>
                </HStack>
              </Button>
              <Text size="xs" className="text-typography-400 mt-1">
                First week starts on this date
              </Text>
            </FormControl>

            {/* Date Picker */}
            {showDatePicker && (
              <>
                <DateTimePicker
                  value={new Date(startDate)}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={handleDateChange}
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

            {/* Duration */}
            <FormControl isRequired>
              <FormControlLabel>
                <FormControlLabelText>
                  Season Duration (Weeks)
                </FormControlLabelText>
              </FormControlLabel>
              <Input variant="outline" size="lg">
                <InputField
                  placeholder="8"
                  value={weeksDuration === 0 ? "" : String(weeksDuration)}
                  onChangeText={(text) => {
                    if (text === "") {
                      setWeeksDuration(0);
                      return;
                    }

                    const num = parseInt(text);
                    if (!isNaN(num) && num > 0 && num <= 52) {
                      setWeeksDuration(num);
                    }
                  }}
                  onBlur={() => {
                    if (weeksDuration === 0) {
                      setWeeksDuration(league.defaultDuration || 8);
                    }
                  }}
                  keyboardType="number-pad"
                  editable={!isSubmitting}
                />
              </Input>
              <Text size="xs" className="text-typography-400 mt-1">
                How many weeks in the regular season (1-52)
              </Text>
            </FormControl>

            {/* General Error */}
            {error && name.trim() && (
              <FormControl isInvalid>
                <FormControlError>
                  <FormControlErrorText>{error}</FormControlErrorText>
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
              isDisabled={isSubmitting}
            >
              <ButtonText>
                {isSubmitting
                  ? (isEditMode ? "Updating..." : "Creating...")
                  : (isEditMode ? "Update Season" : "Create Season")}
              </ButtonText>
            </Button>
          </HStack>
        </VStack>
      </ScrollView>
    </SafeAreaView>
  );
}