import React, { useState, useCallback } from "react";
import { Alert, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView } from "@/components/ui/scroll-view";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Button, ButtonText } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Fab, FabIcon } from "@/components/ui/fab";
import { AddIcon } from "@/components/ui/icon";
import { Spinner } from "@/components/ui/spinner";
import { Center } from "@/components/ui/center";
import { Badge, BadgeText } from "@/components/ui/badge";
import { router, useFocusEffect, Href } from "expo-router";
import { useDatabase } from "@/lib/db/provider";
import { CustomGameConfig } from "@/types/customGame";
import { getAllCustomGameConfigs, deleteCustomGameConfig } from "@/lib/db/customGames";
import { Menu, MenuItem, MenuItemLabel } from "@/components/ui/menu";

export default function CustomGamesIndex() {
  const { db } = useDatabase();
  const [configs, setConfigs] = useState<CustomGameConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchConfigs = async () => {
    if (!db) return;

    try {
      setIsLoading(true);
      const result = await getAllCustomGameConfigs(db);
      setConfigs(result);
    } catch (error) {
      console.error("Failed to fetch custom game configs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchConfigs();
    }, [db])
  );

  const handleDelete = (config: CustomGameConfig) => {
    Alert.alert(
      "Delete Custom Game",
      `Are you sure you want to delete "${config.name}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (!db) return;
            try {
              await deleteCustomGameConfig(db, config.id);
              fetchConfigs();
            } catch (error: any) {
              console.error("Failed to delete custom game config:", error);
              Alert.alert(
                "Cannot Delete",
                error.message || "Failed to delete custom game configuration"
              );
            }
          },
        },
      ]
    );
  };

  const handleEdit = (config: CustomGameConfig) => {
    router.push(`/(tabs)/custom-games/new?id=${config.id}` as Href);
  };

  const getScoringMethodLabel = (method: string) => {
    switch (method) {
      case 'points': return 'Points';
      case 'games_won': return 'Games Won';
      case 'rounds': return 'Rounds';
      default: return method;
    }
  };

  const getWinConditionLabel = (condition: string) => {
    switch (condition) {
      case 'target_score': return 'Target Score';
      case 'best_of_games': return 'Best Of';
      case 'most_points': return 'Most Points';
      default: return condition;
    }
  };

  if (isLoading) {
    return (
      <Center className="flex-1 bg-background-0">
        <VStack space="md" className="items-center">
          <Spinner size="large" />
          <Text className="text-typography-500">Loading custom games...</Text>
        </VStack>
      </Center>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background-50">
      <ScrollView className="flex-1" contentContainerClassName="p-6">
        <VStack space="2xl">
          {/* Header */}
          <VStack space="sm">
            <Heading size="3xl" className="text-typography-900">
              Custom Games
            </Heading>
            <Text className="text-typography-500">
              Create custom game types to track any game you play
            </Text>
          </VStack>

          {configs.length === 0 ? (
            <Center className="py-12">
              <VStack space="md" className="items-center max-w-md">
                <Text className="text-typography-400 text-center text-lg">
                  No custom games yet
                </Text>
                <Text className="text-typography-400 text-center">
                  Create custom games like Cornhole, Foosball, Ping Pong, and more. Tap + to get started.
                </Text>
              </VStack>
            </Center>
          ) : (
            <VStack space="md">
              {configs.map((config) => (
                <Menu
                  key={config.id}
                  placement="bottom"
                  trigger={({ ...triggerProps }) => (
                    <Pressable {...triggerProps}>
                      <Card
                        size="md"
                        variant="elevated"
                        className="p-4 border border-neutral-400"
                      >
                        <VStack space="md">
                          <VStack space="xs">
                            <Heading size="lg" className="text-typography-900">
                              {config.name}
                            </Heading>
                            {config.description && (
                              <Text size="sm" className="text-typography-500">
                                {config.description}
                              </Text>
                            )}
                          </VStack>

                          <HStack space="sm" className="flex-wrap">
                            <Badge size="sm" variant="outline" action="info">
                              <BadgeText>{getScoringMethodLabel(config.scoringMethod)}</BadgeText>
                            </Badge>
                            <Badge size="sm" variant="outline" action="success">
                              <BadgeText>
                                {getWinConditionLabel(config.winCondition)}: {config.targetValue}
                              </BadgeText>
                            </Badge>
                            <Badge size="sm" variant="outline" action="muted">
                              <BadgeText>{config.minPlayers}-{config.maxPlayers} players</BadgeText>
                            </Badge>
                          </HStack>

                          <Text size="sm" className="text-typography-400 text-center mt-2">
                            Long press for options
                          </Text>
                        </VStack>
                      </Card>
                    </Pressable>
                  )}
                >
                  <MenuItem
                    key="edit"
                    textValue="Edit"
                    onPress={() => handleEdit(config)}
                  >
                    <MenuItemLabel>Edit Game</MenuItemLabel>
                  </MenuItem>
                  <MenuItem
                    key="delete"
                    textValue="Delete"
                    onPress={() => handleDelete(config)}
                  >
                    <MenuItemLabel className="text-error-500">Delete Game</MenuItemLabel>
                  </MenuItem>
                </Menu>
              ))}
            </VStack>
          )}
        </VStack>
      </ScrollView>

      <Fab
        size="lg"
        placement="bottom right"
        className="m-6 bg-secondary-500"
        onPress={() => router.push("/(tabs)/custom-games/new" as Href)}
      >
        <FabIcon as={AddIcon} />
      </Fab>
    </SafeAreaView>
  );
}
