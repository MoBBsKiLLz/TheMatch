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
import { ColorPicker } from "@/components/ColorPicker";
import { LeagueFormat } from "@/types/league";
import {
  Select,
  SelectTrigger,
  SelectInput,
  SelectIcon,
  SelectPortal,
  SelectItem,
  SelectBackdrop,
  SelectContent,
  SelectDragIndicator,
  SelectDragIndicatorWrapper,
} from "@/components/ui/select";
import { ChevronDownIcon } from "lucide-react-native";

export default function NewLeague() {
  const { db } = useDatabase();
  const { id, mode } = useLocalSearchParams<{ id?: string; mode?: string }>();
  const isEditMode = mode === "edit" && !!id;
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(isEditMode ? true : false);
  const [error, setError] = useState("");
  const [color, setColor] = useState("#1E6FFF");
  const [format, setFormat] = useState<LeagueFormat>("round-robin");
  const [defaultDuration, setDefaultDuration] = useState(8);

  // Load existing league data if editing
  useEffect(() => {
    async function loadLeague() {
      if (!isEditMode || !db) return;

      try {
        const league = await findById<League>(db, "leagues", Number(id));
        if (league) {
          setName(league.name);
          setLocation(league.location || "");
          setColor(league.color || "#1E6FFF");
          setFormat(league.format || "round-robin");
          setDefaultDuration(league.defaultDuration || 8);
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
    setError("");

    // Validation
    if (!name.trim()) {
      setError("League name is required");
      return;
    }

    // Ensure duration is valid
    const finalDuration = defaultDuration > 0 ? defaultDuration : 8;

    if (!db) {
      setError("Database not ready. Please try again.");
      return;
    }

    setIsSubmitting(true);
    Keyboard.dismiss();

    try {
      if (isEditMode) {
        await update(db, "leagues", Number(id), {
          name: name.trim(),
          location: location.trim() || null,
          color: color,
          format: format,
          defaultDuration: finalDuration,
        });
      } else {
        await insert(db, "leagues", {
          name: name.trim(),
          location: location.trim() || null,
          createdAt: Date.now(),
          color: color,
          format: format,
          defaultDuration: finalDuration,
        });
      }

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
            {isEditMode ? "Edit League" : "Create New League"}
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

          {/* League Color */}
          <ColorPicker
            selectedColor={color}
            onColorSelect={setColor}
            disabled={isSubmitting}
          />

          <FormControl>
            <FormControlLabel>
              <FormControlLabelText>League Format</FormControlLabelText>
            </FormControlLabel>
            <Select
              selectedValue={format}
              onValueChange={(value) => setFormat(value as LeagueFormat)}
              isDisabled={isSubmitting}
            >
              <SelectTrigger variant="outline" size="lg">
                <SelectInput
                  placeholder="Select format"
                  value={format === "round-robin" ? "Round Robin" : format}
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
                  <SelectItem label="Round Robin" value="round-robin" />
                  <SelectItem label="Swiss System" value="swiss" />
                  <SelectItem label="Ladder/Rankings" value="ladder" />
                  <SelectItem label="Custom" value="custom" />
                </SelectContent>
              </SelectPortal>
            </Select>
            <Text size="xs" className="text-typography-400 mt-1">
              Round Robin: Everyone plays everyone each week
            </Text>
          </FormControl>

          <FormControl>
            <FormControlLabel>
              <FormControlLabelText>
                Default Season Length (Weeks)
              </FormControlLabelText>
            </FormControlLabel>
            <Input variant="outline" size="lg">
              <InputField
                placeholder="8"
                value={defaultDuration === 0 ? "" : String(defaultDuration)}
                onChangeText={(text) => {
                  // Allow empty input for deletion
                  if (text === "") {
                    setDefaultDuration(0);
                    return;
                  }

                  const num = parseInt(text);
                  if (!isNaN(num) && num > 0 && num <= 52) {
                    setDefaultDuration(num);
                  }
                }}
                onBlur={() => {
                  // If empty on blur, reset to default
                  if (defaultDuration === 0) {
                    setDefaultDuration(8);
                  }
                }}
                keyboardType="number-pad"
                editable={!isSubmitting}
              />
            </Input>
            <Text size="xs" className="text-typography-400 mt-1">
              Typical length for new seasons (1-52 weeks)
            </Text>
          </FormControl>

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
                {isSubmitting ? "Saving..." : isEditMode ? "Update" : "Create"}
              </ButtonText>
            </Button>
          </HStack>
        </VStack>
      </ScrollView>
    </SafeAreaView>
  );
}
