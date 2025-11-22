import React, { useState, useEffect, useCallback } from "react";
import { Keyboard } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView } from "@/components/ui/scroll-view";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Heading } from "@/components/ui/heading";
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
import { Text } from "@/components/ui/text";
import { useLocalSearchParams, router } from "expo-router";
import { useDatabase } from "@/lib/db/provider";
import { insert, update, findById } from "@/lib/db/queries";
import { Player } from "@/types/player";

export default function NewPlayer() {
  const { db } = useDatabase();
  const { id, mode } = useLocalSearchParams<{ id?: string; mode?: string }>();
  const isEditMode = mode === "edit" && id;
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(isEditMode ? true : false);
  const [errors, setErrors] = useState<{
    firstName?: string;
    lastName?: string;
    general?: string;
  }>({});

  // Load existing player data if editing
  useEffect(() => {
    async function loadPlayer() {
      if (!isEditMode || !db) return;

      try {
        const player = await findById<Player>(db, "players", Number(id));
        if (player) {
          setFirstName(player.firstName);
          setLastName(player.lastName);
        }
      } catch (error) {
        console.error("Failed to load player: ", error);
        setErrors({ general: "Failed to load player data" });
      } finally {
        setIsLoading(false);
      }
    }

    loadPlayer();
  }, [db, id, isEditMode]);

  const validateForm = () : boolean => {
    const newErrors: typeof errors = {};

    if (!firstName.trim()) {
        newErrors.firstName = "First name is required";
    }

    if (!lastName.trim()) {
        newErrors.lastName = "Last name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    // Clear previous errors
    setErrors({});

    // Validate
    if(!validateForm()) {
        return;
    }

    if (!db) {
        setErrors({general: "Database not ready. Please try again."});
        return;
    }

    setIsSubmitting(true);
    Keyboard.dismiss();

    try {
        if (isEditMode) {
            // Update existing player
            await update(db, "players", Number(id), {
                firstName: firstName.trim(),
                lastName: lastName.trim(),
            });
        } else {
            // Create new player
            await insert(db, "players", {
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                createdAt: Date.now(),
            });
        }

        // Navigate back
        router.back();
    } catch (error) {
        console.error("Failed to save player:", error);
        setErrors({general: "Failed to save player. Please try again."});
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
                <Text className="text-typography-500">Loading player...</Text>
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
                    {isEditMode ? "Edit Player" : "Add Player"}
                </Heading>

                <VStack space="xl">
                    {/* First Name */}
                    <FormControl isRequired isInvalid={!!errors.firstName}>
                        <FormControlLabel>
                            <FormControlLabelText>First Name</FormControlLabelText>
                        </FormControlLabel>
                        <Input variant="outline" size="lg">
                            <InputField
                                placeholder="Enter first name"
                                value={firstName}
                                onChangeText={setFirstName}
                                editable={!isSubmitting}
                                autoCapitalize="words"
                                returnKeyType="next"
                            />
                        </Input>
                        {errors.firstName && (
                            <FormControlError>
                                <FormControlErrorText>{errors.firstName}</FormControlErrorText>
                            </FormControlError>
                        )}
                    </FormControl>

                    {/* Last Name */}
                    <FormControl isRequired isInvalid={!!errors.lastName}>
                        <FormControlLabel>
                            <FormControlLabelText>Last Name</FormControlLabelText>
                        </FormControlLabel>
                        <Input variant="outline" size="lg">
                            <InputField
                                placeholder="Enter last name"
                                value={lastName}
                                onChangeText={setLastName}
                                editable={!isSubmitting}
                                autoCapitalize="words"
                                returnKeyType="done"
                                onSubmitEditing={handleSubmit}
                            />
                        </Input>
                        {errors.lastName && (
                            <FormControlError>
                                <FormControlErrorText>{errors.lastName}</FormControlErrorText>
                            </FormControlError>
                        )}
                    </FormControl>

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
                        isDisabled={isSubmitting}
                    >
                        <ButtonText>
                            {isSubmitting ? "Saving..." : isEditMode ? "Update" : "Add"}
                        </ButtonText>
                    </Button>
                </HStack>
            </VStack>
        </ScrollView>
    </SafeAreaView>
  );
}
