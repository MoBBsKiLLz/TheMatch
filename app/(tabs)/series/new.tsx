import React, { useState, useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView } from '@/components/ui/scroll-view';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
  FormControlError,
  FormControlErrorText,
} from '@/components/ui/form-control';
import { Input, InputField } from '@/components/ui/input';
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
} from '@/components/ui/select';
import { ChevronDownIcon, X, CheckIcon } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import { Calendar } from 'lucide-react-native';
import { Pressable } from '@/components/ui/pressable';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { useDatabase } from '@/lib/db/provider';
import { createSeries } from '@/lib/db/series';
import { GameType } from '@/types/league';
import { logger } from '@/lib/utils/logger';
import { Card } from '@/components/ui/card';
import {
  Checkbox,
  CheckboxIndicator,
  CheckboxIcon,
} from '@/components/ui/checkbox';

export default function NewSeries() {
  const { db } = useDatabase();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [gameType, setGameType] = useState<GameType>('darts');
  const [startDate, setStartDate] = useState(Date.now());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    players?: string;
    general?: string;
  }>({});

  // Player selection
  const [allPlayers, setAllPlayers] = useState<{ id: number; firstName: string; lastName: string }[]>([]);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<number[]>([]);
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(true);

  // Load all players
  useEffect(() => {
    async function loadPlayers() {
      if (!db) return;
      try {
        setIsLoadingPlayers(true);
        const players = await db.all<{ id: number; firstName: string; lastName: string }>(
          'SELECT id, firstName, lastName FROM players ORDER BY lastName ASC, firstName ASC'
        );
        setAllPlayers(players);
      } catch (error) {
        logger.error('Failed to load players:', error);
      } finally {
        setIsLoadingPlayers(false);
      }
    }
    loadPlayers();
  }, [db]);

  const handleSubmit = async () => {
    setErrors({});

    // Validate
    const newErrors: typeof errors = {};
    if (!name.trim()) {
      newErrors.name = 'Series name is required';
    }
    if (selectedPlayerIds.length < 2) {
      newErrors.players = 'Select at least 2 players for the series';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (!db) {
      setErrors({ general: 'Database not ready' });
      return;
    }

    setIsSubmitting(true);

    try {
      const seriesId = await createSeries(db, {
        name: name.trim(),
        description: description.trim() || undefined,
        gameType,
        startDate,
        playerIds: selectedPlayerIds,
      });

      // Navigate to the new series (via Play tab)
      router.replace('/(tabs)/play');
      router.push(`/series/${seriesId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to create series:', { error: errorMessage });
      setErrors({ general: 'Failed to create series' });
      setIsSubmitting(false);
    }
  };

  const handleAddPlayer = (playerId: string) => {
    const id = Number(playerId);
    if (!selectedPlayerIds.includes(id)) {
      setSelectedPlayerIds([...selectedPlayerIds, id]);
    }
  };

  const handleRemovePlayer = (playerId: number) => {
    setSelectedPlayerIds(selectedPlayerIds.filter(id => id !== playerId));
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setStartDate(selectedDate.getTime());
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background-0">
      <ScrollView className="flex-1" contentContainerClassName="p-6">
        <VStack space="xl">
          <Heading size="3xl">New Series</Heading>

          <Text className="text-typography-500">
            Create a series to group related matches together, like a "Best of 3" or a friendly competition.
          </Text>

          <FormControl isRequired isInvalid={!!errors.name}>
            <FormControlLabel>
              <FormControlLabelText>Series Name</FormControlLabelText>
            </FormControlLabel>
            <Input variant="outline" size="lg">
              <InputField
                placeholder="e.g., Best of 3 with John"
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

          <FormControl>
            <FormControlLabel>
              <FormControlLabelText>Description (Optional)</FormControlLabelText>
            </FormControlLabel>
            <Input variant="outline" size="lg">
              <InputField
                placeholder="Add notes about this series"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
              />
            </Input>
          </FormControl>

          <FormControl isRequired>
            <FormControlLabel>
              <FormControlLabelText>Game Type</FormControlLabelText>
            </FormControlLabel>
            <Select
              selectedValue={gameType}
              onValueChange={(v) => setGameType(v as GameType)}
            >
              <SelectTrigger variant="outline" size="lg">
                <SelectInput
                  placeholder="Select game type"
                  className="flex-1 capitalize"
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

          <FormControl>
            <FormControlLabel>
              <FormControlLabelText>Start Date</FormControlLabelText>
            </FormControlLabel>
            <Pressable onPress={() => setShowDatePicker(true)}>
              <HStack
                className="border border-outline-300 rounded-lg p-3 items-center"
                space="md"
              >
                <Icon as={Calendar} className="text-typography-500" />
                <Text className="flex-1">
                  {new Date(startDate).toLocaleDateString()}
                </Text>
              </HStack>
            </Pressable>
          </FormControl>

          {showDatePicker && (
            <DateTimePicker
              value={new Date(startDate)}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
            />
          )}

          {/* Player Selection */}
          <FormControl isRequired isInvalid={!!errors.players}>
            <FormControlLabel>
              <FormControlLabelText>Players ({selectedPlayerIds.length} selected)</FormControlLabelText>
            </FormControlLabel>
            <Text size="sm" className="text-typography-500 mb-2">
              Select at least 2 players who will compete in this series
            </Text>

            {/* Player List with Checkboxes */}
            {allPlayers.length === 0 ? (
              <Card size="md" variant="outline" className="p-4">
                <VStack space="md" className="items-center">
                  <Text className="text-typography-500">No players available</Text>
                  <Button
                    size="sm"
                    variant="outline"
                    onPress={() => router.push('/(tabs)/players')}
                  >
                    <ButtonText>Create Players</ButtonText>
                  </Button>
                </VStack>
              </Card>
            ) : (
              <VStack space="xs" className="border border-outline-300 rounded-lg p-2">
                {allPlayers.map((player) => {
                  const isSelected = selectedPlayerIds.includes(player.id);
                  return (
                    <Pressable
                      key={player.id}
                      onPress={() => {
                        if (isSelected) {
                          handleRemovePlayer(player.id);
                        } else {
                          handleAddPlayer(player.id.toString());
                        }
                      }}
                      className="p-3 rounded-md active:bg-background-100"
                    >
                      <HStack space="md" className="items-center">
                        <Checkbox
                          value={player.id.toString()}
                          isChecked={isSelected}
                          onChange={(checked: boolean) => {
                            if (checked) {
                              handleAddPlayer(player.id.toString());
                            } else {
                              handleRemovePlayer(player.id);
                            }
                          }}
                        >
                          <CheckboxIndicator>
                            <CheckboxIcon as={CheckIcon} />
                          </CheckboxIndicator>
                        </Checkbox>
                        <Text className="flex-1">
                          {player.firstName} {player.lastName}
                        </Text>
                      </HStack>
                    </Pressable>
                  );
                })}
              </VStack>
            )}

            {errors.players && (
              <FormControlError>
                <FormControlErrorText>{errors.players}</FormControlErrorText>
              </FormControlError>
            )}
          </FormControl>

          {errors.general && (
            <FormControl isInvalid>
              <FormControlError>
                <FormControlErrorText>{errors.general}</FormControlErrorText>
              </FormControlError>
            </FormControl>
          )}

          <VStack space="md">
            <Button
              action="primary"
              size="lg"
              onPress={handleSubmit}
              isDisabled={isSubmitting}
            >
              <ButtonText>
                {isSubmitting ? 'Creating...' : 'Create Series'}
              </ButtonText>
            </Button>

            <Button
              variant="outline"
              size="lg"
              onPress={() => router.back()}
              isDisabled={isSubmitting}
            >
              <ButtonText>Cancel</ButtonText>
            </Button>
          </VStack>
        </VStack>
      </ScrollView>
    </SafeAreaView>
  );
}
