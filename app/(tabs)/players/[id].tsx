import React, { useState, useCallback } from "react";
import { Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView } from "@/components/ui/scroll-view";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Button, ButtonText } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Center } from "@/components/ui/center";
import { Divider } from "@/components/ui/divider";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { useDatabase } from "@/lib/db/provider";
import { findById, remove } from "@/lib/db/queries";
import { Player } from "@/types/player";

export default function PlayerDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { db } = useDatabase();
  const [player, setPlayer] = useState<Player | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch player data
  const fetchPlayer = async () => {
    if (!db || !id) return;

    try {
      setIsLoading(true);
      const result = await findById<Player>(db, "players", Number(id));
      setPlayer(result);
    } catch (error) {
      console.error("Failed to fetch player:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchPlayer();
    }, [db, id])
  );

  const handleDelete = () => {
    if (!player) return;

    Alert.alert(
      "Delete Player",
      `Are you sure you want to delete ${player.firstName} ${player.lastName}? This cannot be undone.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (!db || !id) return;

            try {
              await remove(db, "players", Number(id));
              router.back();
            } catch (error) {
              console.error("Failed to delete player:", error);
              Alert.alert(
                "Error",
                "Failed to delete player. Please try again."
              );
            }
          },
        },
      ]
    );
  };

  const handleEdit = () => {
    router.push(`/players/new?id={id}&mode=edit`);
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

  if (!player) {
    return (
      <Center className="flex-1 bg-background-0">
        <VStack space="md" className="items-center">
          <Text className="text-typography-500">Player not found</Text>
          <Button onPress={() => router.back()}>
            <ButtonText>Go Back</ButtonText>
          </Button>
        </VStack>
      </Center>
    );
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-background-0">
      <ScrollView className="flex-1" contentContainerClassName="p-6">
        <VStack space="2xl">
          {/* Header */}
          <VStack space="sm">
            <Heading size="3xl" className="text-typography-900">
              {player.firstName} {player.lastName}
            </Heading>
          </VStack>

          <Divider />

          {/* Details Section */}
          <VStack space="lg">
            <Heading size="lg" className="text-typography-800">
              Details
            </Heading>

            <VStack space="md">
              <VStack space="xs">
                <Text size="sm" className="text-typography-500 font-medium">
                  First Name
                </Text>
                <Text size="md" className="text-typography-900">
                  {player.firstName}
                </Text>
              </VStack>

              <VStack space="xs">
                <Text size="sm" className="text-typography-500 font-medium">
                  Last Name
                </Text>
                <Text size="md" className="text-typography-900">
                  {player.lastName}
                </Text>
              </VStack>

              <VStack space="xs">
                <Text size="sm" className="text-typography-500 font-medium">
                  Created On
                </Text>
                <Text size="md" className="text-typography-900">
                  {formatDate(player.createdAt)}
                </Text>
              </VStack>
            </VStack>
          </VStack>

          <Divider />

          {/* Leagues Section - Placeholder */}
          <VStack space="lg">
            <Heading size="lg" className="text-typography-800">
              Leagues
            </Heading>
            <Center className="py-4">
              <Text className="text-typography-400 text-center">
                League participation coming soon!
              </Text>
            </Center>
          </VStack>

          <Divider />

          {/* Stats Section - Placeholder */}
          <VStack space="lg">
            <Heading size="lg" className="text-typography-800">
              Stats
            </Heading>
            <Center className="py-4">
              <Text className="text-typography-400 text-center">
                Win/loss records coming soon!
              </Text>
            </Center>
          </VStack>

          {/* Action Buttons */}
          <VStack space="md" className="mt-4">
            <Button action="primary" size="lg" onPress={handleEdit}>
                <ButtonText>Edit Player</ButtonText>
            </Button>

            <Button action="negative" variant="link" size="lg" onPress={handleDelete}>
                <ButtonText>Delete Player</ButtonText>
            </Button>
          </VStack>
        </VStack>
      </ScrollView>
    </SafeAreaView>
  );
}
