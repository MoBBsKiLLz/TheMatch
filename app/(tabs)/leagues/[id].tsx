import React, { useCallback, useState } from "react";
import { Alert } from "react-native";
import { SafeAreaView } from "@/components/ui/safe-area-view";
import { ScrollView } from "@/components/ui/scroll-view";
import { VStack } from "@/components/ui/vstack";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Button, ButtonText } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Center } from "@/components/ui/center";
import { Divider } from "@/components/ui/divider";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { useDatabase } from "@/lib/db/provider";
import { findById, remove } from "@/lib/db/queries";
import { League } from "@/types/league";

export default function LeagueDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { db } = useDatabase();
  const [league, setLeague] = useState<League | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLeagues = async () => {
      if (!db) return;
  
      if (!db || !id) return;

      try {
        const result = await findById<League>(db, "leagues", Number(id));
        setLeague(result);
      } catch (error) {
        console.error("Failed to fetch league:", error);
      } finally {
        setIsLoading(false);
      }
    };
  
    useFocusEffect(
      useCallback(() => {
        if (db) {
          setIsLoading(true);
          fetchLeagues();
        }
      }, [db])
    );

  const handleDelete = () => {
    Alert.alert(
      "Delete League",
      `Are you sure you want to delete "${league?.name}"? This action cannot be undone.`,
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
              await remove(db, "leagues", Number(id));
              router.back();
            } catch (error) {
              console.error("Failed to delete league", error);
              Alert.alert(
                "Error",
                "Failed to delete league. Please try again."
              );
            }
          },
        },
      ]
    );
  };

  const handleEdit = () => {
    router.push(`/leagues/new?id=${id}&mode=edit`);
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

  if (!league) {
    return (
      <Center className="flex-1 bg-background-0">
        <VStack space="md" className="items-cente">
          <Text className="text-typography-500">League not found</Text>
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

  const getLeagueDetails = (league: League) => {
    const parts = [];
    if (league.season) parts.push(league.season);
    if (league.location) parts.push(league.location);
    return parts.join(" • ");
  };

  return (
    <SafeAreaView className="flex-1 bg-background-0">
      <ScrollView className="flex-1" contentContainerClassName="p-6">
        <VStack space="2xl">
          {/* Header */}
          <VStack space="sm">
            <Heading size="3xl" className="text-typography-900">
              {league.name}
            </Heading>
            {getLeagueDetails(league) && (
              <Text size="sm" className="text-typography-500">
                {getLeagueDetails(league)}
              </Text>
            )}
          </VStack>

          <Divider />

          {/* Details Section */}
          <VStack space="lg">
            <Heading size="lg" className="text-typography-800">
              Details
            </Heading>

            <VStack space="md">
              {league.season && (
                <VStack space="xs">
                  <Text size="sm" className="text-typography-500 font-medium">
                    Season
                  </Text>
                  <Text size="md" className="text-typography-900">
                    {league.season}
                  </Text>
                </VStack>
              )}

              {league.location && (
                <VStack space="xs">
                  <Text size="sm" className="text-typography-500 font-medium">
                    Location
                  </Text>
                  <Text size="md" className="text-typography-900">
                    {league.location}
                  </Text>
                </VStack>
              )}

              <VStack space="xs">
                  <Text size="sm" className="text-typography-500 font-medium">
                    Created On
                  </Text>
                  <Text size="md" className="text-typography-900">
                    {formatDate(league.createdAt)}
                  </Text>
                </VStack>
            </VStack>
          </VStack>

          <Divider />

          {/* Placeholder for future sections */}
          <VStack space="md" className="py-4">
              <Text className="text-center text-typography-400">
                Players and matches coming soon!
              </Text>
          </VStack>

          {/* Action Buttons */}
          <VStack space="md" className="mt-4">
              <Button action="primary" size="lg" onPress={handleEdit}>
                <ButtonText>Edit League</ButtonText>
              </Button>

              <Button action="negative" variant="link" size="lg" onPress={handleDelete}>
                <ButtonText>Delete League</ButtonText>
              </Button>
          </VStack>
        </VStack>
      </ScrollView>
    </SafeAreaView>
  );
}
