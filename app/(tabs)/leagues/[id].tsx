import React, { useCallback, useState } from "react";
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
import { Card } from "@/components/ui/card";
import { Divider } from "@/components/ui/divider";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { useDatabase } from "@/lib/db/provider";
import { findById, remove } from "@/lib/db/queries";
import { League } from "@/types/league";
import {
  getLeaguePlayers,
  removePlayerFromLeague,
} from "@/lib/db/playerLeagues";
import { Leaderboard } from "@/components/Leaderboard";
import {
  getLeagueLeaderboard,
  resolveLeaderboardTies,
  LeaderboardEntry,
} from "@/lib/db/leaderboard";

export default function LeagueDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { db } = useDatabase();
  const [league, setLeague] = useState<League | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [leaguePlayers, setLeaguePlayers] = useState<
    {
      id: number;
      firstName: string;
      lastName: string;
      wins: number;
      losses: number;
      playerLeagueId: number;
    }[]
  >([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  const fetchLeague = async () => {
    if (!db || !id) return;

    try {
      setIsLoading(true);
      const result = await findById<League>(db, "leagues", Number(id));
      setLeague(result);

      // Fetch league players
      const players = await getLeaguePlayers(db, Number(id));
      setLeaguePlayers(players);

      // Fetch leaderboard with tie resolution
      const standings = await getLeagueLeaderboard(db, Number(id));
      const resolvedStandings = await resolveLeaderboardTies(
        db,
        Number(id),
        standings
      );
      setLeaderboard(resolvedStandings);
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
        fetchLeague();
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

  const handleRemovePlayer = (playerId: number, playerName: string) => {
    Alert.alert("Remove Player", `Remove ${playerName} from this league?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          if (!db || !id) return;
          try {
            await removePlayerFromLeague(db, playerId, Number(id));
            fetchLeague(); // Refresh
          } catch (error) {
            console.error("Failed to remove player:", error);
            Alert.alert("Error", "Failed to remove player");
          }
        },
      },
    ]);
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
            {/* {getLeagueDetails(league) && (
              <Text size="sm" className="text-typography-500">
                {getLeagueDetails(league)}
              </Text>
            )} */}
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

          {/* Leaderboard Section */}
          <VStack space="lg">
            <Heading size="lg" className="text-typography-800">
              Standings
            </Heading>
            <Leaderboard entries={leaderboard} leagueId={Number(id)} showRank={true} />
          </VStack>

          <Divider />

          {/* Players Section */}
          <VStack space="lg">
            <HStack className="justify-between items-center">
              <Heading size="lg" className="text-typography-800">
                Players ({leaguePlayers.length})
              </Heading>
              <Button
                size="sm"
                action="secondary"
                onPress={() => router.push(`/leagues/${id}/add-players`)}
              >
                <ButtonText className="text-typography-black">
                  Add Players
                </ButtonText>
              </Button>
            </HStack>

            {leaguePlayers.length === 0 ? (
              <Center className="py-4">
                <Text className="text-typography-400 text-center">
                  No players in this league yet.
                </Text>
              </Center>
            ) : (
              <VStack space="md">
                {leaguePlayers.map((player) => (
                  <Card
                    key={player.id}
                    size="sm"
                    variant="outline"
                    className="p-3"
                  >
                    <HStack className="justify-between items-center">
                      <VStack space="xs" className="flex-1">
                        <Text className="text-typography-900 font-medium">
                          {player.firstName} {player.lastName}
                        </Text>
                        <Text size="sm" className="text-typography-500">
                          Record: {player.wins}W - {player.losses}L
                        </Text>
                      </VStack>
                      <Button
                        size="xs"
                        variant="link"
                        action="negative"
                        onPress={() =>
                          handleRemovePlayer(
                            player.id,
                            `${player.firstName} ${player.lastName}`
                          )
                        }
                      >
                        <ButtonText className="text-error-500">
                          Remove
                        </ButtonText>
                      </Button>
                    </HStack>
                  </Card>
                ))}
              </VStack>
            )}
          </VStack>

          {/* Action Buttons */}
          <VStack space="md" className="mt-4">
            <Button action="primary" size="lg" onPress={handleEdit}>
              <ButtonText>Edit League</ButtonText>
            </Button>

            <Button
              action="negative"
              variant="link"
              size="lg"
              onPress={handleDelete}
            >
              <ButtonText>Delete League</ButtonText>
            </Button>
          </VStack>
        </VStack>
      </ScrollView>
    </SafeAreaView>
  );
}
