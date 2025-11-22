import React, { useState, useEffect } from "react";
import { Keyboard } from "react-native";
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
import { router, useLocalSearchParams } from "expo-router";
import { useDatabase } from "@/lib/db/provider";
import { insert, update, findById } from "@/lib/db/queries";
import { League } from "@/types/league";

export default function NewLeague() {
  const { db } = useDatabase();
  const { id, mode } = useLocalSearchParams<{ id?: string; mode?: string }>();
  const isEditMode = mode === "edit" && id;
  const [name, setName] = useState("");
  const [season, setSeason] = useState("");
  const [location, setLocation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(isEditMode ? true : false);
  const [error, setError] = useState("");

  // Load existing league data if editing
  useEffect(() => {
    async function loadLeague() {
      if (!isEditMode || !db) return;

      try {
        const league = await findById<League>(db, "leagues", Number(id));
        if (league) {
          setName(league.name);
          setSeason(league.season || "");
          setLocation(league.location || "");
        }
      } catch (error) {
        console.error("Failed to load league:", error);
        setError("Failed to load league data");
      } finally {
        setIsLoading(false);
      }
    }

    loadLeague();
  }, [db, id, isEditMode]);

  const handleSubmit = async () => {
    // Clear previous errors
    setError("");

    // Validation
    if (!name.trim()) {
      setError("League name is required");
      return;
    }

    if (!db) {
      setError("Database not ready. Please try again.");
      return;
    }

    setIsSubmitting(true);
    Keyboard.dismiss();

    try {
      if (isEditMode) {
        // Update existing league
        await update(db, "leagues", Number(id), {
          name: name.trim(),
          season: season.trim() || null,
          location: location.trim() || null,
        });
      } else {
        // Create New League
        await insert(db, "leagues", {
          name: name.trim(),
          season: season.trim() || null,
          location: location.trim() || null,
          createdAt: Date.now(),
        });
      }

      // Navigate back to leagues list
      router.back();
    } catch (error) {
      console.error("Failed to create league:", error);
      setError("Failed to create league. Please try again.");
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
        <VStack space="md" className="items-cente">
          <Spinner size="large" />
          <Text className="text-typography-500">Loading league...</Text>
        </VStack>
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
          <Heading size="3xl" className="text-typography-900">
            {isEditMode ? 'Edit League' : 'Create New League'}
          </Heading>

          <VStack space="xl">
            {/* League Name */}
            <FormControl isRequired isInvalid={!!error && !name.trim()}>
              <FormControlLabel>
                <FormControlLabelText>League Name</FormControlLabelText>
              </FormControlLabel>
              <Input variant="outline" size="lg">
                <InputField
                  placeholder="Enter league name"
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

            {/* Season */}
            <FormControl>
              <FormControlLabel>
                <FormControlLabelText>Season</FormControlLabelText>
              </FormControlLabel>
              <Input variant="outline" size="lg">
                <InputField
                  placeholder="e.g. Fall 2024, Winter 2025"
                  value={season}
                  onChangeText={setSeason}
                  editable={!isSubmitting}
                  autoCapitalize="words"
                  returnKeyType="next"
                />
              </Input>
            </FormControl>

            {/* Location */}
            <FormControl>
              <FormControlLabel>
                <FormControlLabelText>Location</FormControlLabelText>
              </FormControlLabel>
              <Input variant="outline" size="lg">
                <InputField
                  placeholder="e.g. Central Park, Downtown Arena"
                  value={location}
                  onChangeText={setLocation}
                  editable={!isSubmitting}
                  autoCapitalize="words"
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
                />
              </Input>
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
              <ButtonText>{isSubmitting ? "Saving..." : isEditMode? "Update" : "Create"}</ButtonText>
            </Button>
          </HStack>
        </VStack>
      </ScrollView>
    </SafeAreaView>
  );
}
