import React, { useState, useEffect, useMemo } from 'react';
import { Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView } from '@/components/ui/scroll-view';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { Checkbox, CheckboxIndicator, CheckboxIcon, CheckboxLabel } from '@/components/ui/checkbox';
import { CheckIcon } from '@/components/ui/icon';
import { Input, InputField, InputSlot, InputIcon } from '@/components/ui/input';
import { Search } from 'lucide-react-native';
import { Spinner } from '@/components/ui/spinner';
import { Center } from '@/components/ui/center';
import { Card } from '@/components/ui/card';
import { router, useLocalSearchParams } from 'expo-router';
import { useDatabase } from '@/lib/db/provider';
import { Player } from '@/types/player';
import { addPlayerToLeague, isPlayerInLeague } from '@/lib/db/playerLeagues';

type PlayerWithEnrollment = Player & {
  isEnrolled: boolean;
};

export default function AddPlayers() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { db } = useDatabase();
  const [players, setPlayers] = useState<PlayerWithEnrollment[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchPlayers() {
      if (!db || !id) return;

      try {
        // Get all players
        const allPlayers = await db.all<Player>(
          'SELECT * FROM players ORDER BY lastName ASC, firstName ASC'
        );

        // Check which ones are already enrolled
        const playersWithEnrollment = await Promise.all(
          allPlayers.map(async (player) => ({
            ...player,
            isEnrolled: await isPlayerInLeague(db, player.id, Number(id)),
          }))
        );

        setPlayers(playersWithEnrollment);

        // Pre-select enrolled players
        const enrolled = playersWithEnrollment
          .filter((p) => p.isEnrolled)
          .map((p) => p.id);
        setSelectedPlayers(new Set(enrolled));
      } catch (error) {
        console.error('Failed to fetch players:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPlayers();
  }, [db, id]);

  const togglePlayer = (playerId: number) => {
    const newSelected = new Set(selectedPlayers);
    if (newSelected.has(playerId)) {
      newSelected.delete(playerId);
    } else {
      newSelected.add(playerId);
    }
    setSelectedPlayers(newSelected);
  };

  const handleSelectAll = () => {
    setSelectedPlayers(new Set(filteredPlayers.map(p => p.id)));
  };

  const handleDeselectAll = () => {
    setSelectedPlayers(new Set());
  };

  // Filter players based on search query
  const filteredPlayers = useMemo(() => {
    if (!searchQuery.trim()) {
      return players;
    }

    const query = searchQuery.toLowerCase();
    return players.filter(player =>
      player.firstName.toLowerCase().includes(query) ||
      player.lastName.toLowerCase().includes(query) ||
      `${player.firstName} ${player.lastName}`.toLowerCase().includes(query)
    );
  }, [players, searchQuery]);

  const handleSave = async () => {
    if (!db || !id) return;

    setIsSaving(true);

    try {
      // Add newly selected players
      for (const player of players) {
        const wasEnrolled = player.isEnrolled;
        const isNowSelected = selectedPlayers.has(player.id);

        if (!wasEnrolled && isNowSelected) {
          // Add player to league
          await addPlayerToLeague(db, player.id, Number(id));
        }
      }

      // Note: We're not removing players here for safety
      // You can add removal logic if needed

      router.back();
    } catch (error) {
      console.error('Failed to save players:', error);
      Alert.alert('Error', 'Failed to save players. Please try again.');
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Center className="flex-1 bg-background-0">
        <VStack space="md" className="items-center">
          <Spinner size="large" />
          <Text className="text-typography-500">Loading players...</Text>
        </VStack>
      </Center>
    );
  }

  if (players.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-background-0">
        <VStack className="flex-1 p-6" space="2xl">
          <Heading size="3xl" className="text-typography-900">
            Add Players
          </Heading>
          <Center className="flex-1">
            <VStack space="md" className="items-center">
              <Text className="text-typography-500 text-center">
                No players available.
              </Text>
              <Text className="text-typography-400 text-center">
                Add players from the Players tab first.
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

  return (
    <SafeAreaView className="flex-1 bg-background-0">
      <ScrollView className="flex-1" contentContainerClassName="p-6">
        <VStack space="2xl">
          <VStack space="sm">
            <Heading size="3xl" className="text-typography-900">
              Add Players
            </Heading>
            <Text className="text-typography-500">
              Select players to add to this league
            </Text>
          </VStack>

          {/* Search and Bulk Actions */}
          {players.length > 0 && (
            <VStack space="md">
              <Input variant="outline" size="md">
                <InputSlot className="pl-3">
                  <InputIcon as={Search} />
                </InputSlot>
                <InputField
                  placeholder="Search players..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
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

          <VStack space="md">
            {filteredPlayers.length === 0 ? (
              <Center className="py-4">
                <Text className="text-typography-500 text-center">
                  No players match your search.
                </Text>
              </Center>
            ) : (
              filteredPlayers.map((player) => (
                <Card
                  key={player.id}
                  size="md"
                  variant="outline"
                  className="p-4"
                >
                  <Checkbox
                    value={String(player.id)}
                    isChecked={selectedPlayers.has(player.id)}
                    onChange={() => togglePlayer(player.id)}
                    isDisabled={isSaving}
                  >
                    <CheckboxIndicator>
                      <CheckboxIcon as={CheckIcon} />
                    </CheckboxIndicator>
                    <CheckboxLabel>
                      <HStack space="sm" className="items-center">
                        <Text className="text-typography-900">
                          {player.firstName} {player.lastName}
                        </Text>
                        {player.isEnrolled && (
                          <Text size="xs" className="text-success-600">
                            (Already enrolled)
                          </Text>
                        )}
                      </HStack>
                    </CheckboxLabel>
                  </Checkbox>
                </Card>
              ))
            )}
          </VStack>

          <HStack space="md" className="mt-4">
            <Button
              variant="outline"
              size="lg"
              className="flex-1"
              onPress={() => router.back()}
              isDisabled={isSaving}
            >
              <ButtonText>Cancel</ButtonText>
            </Button>

            <Button
              action="primary"
              size="lg"
              className="flex-1"
              onPress={handleSave}
              isDisabled={isSaving}
            >
              <ButtonText>{isSaving ? 'Saving...' : 'Save'}</ButtonText>
            </Button>
          </HStack>
        </VStack>
      </ScrollView>
    </SafeAreaView>
  );
}