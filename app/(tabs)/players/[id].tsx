import React, { useState, useCallback } from "react";
import { Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView } from "@/components/ui/scroll-view";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Button, ButtonText } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Center } from "@/components/ui/center";
import { Divider } from "@/components/ui/divider";
import {
  router,
  useLocalSearchParams,
  useFocusEffect,
  Href,
} from "expo-router";
import { useDatabase } from "@/lib/db/provider";
import { findById, remove } from "@/lib/db/queries";
import { Player } from "@/types/player";
import {
  getPlayerLeagues,
  removePlayerFromLeague,
} from "@/lib/db/playerLeagues";
import { Icon } from "@/components/ui/icon";
import { LogOut } from "lucide-react-native";
import {
  getPlayerStats,
  PlayerStats,
  formatStreak,
  formatRecentForm,
} from "@/lib/db/stats";

export default function PlayerDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { db } = useDatabase();
  const [player, setPlayer] = useState<Player | null>(null);
  const [playerLeagues, setPlayerLeagues] = useState<
    {
      id: number;
      name: string;
      location: string | null;
      color: string;
      wins: number;
      losses: number;
      gamesPlayed: number;
      playerLeagueId: number;
    }[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [playerStats, setPlayerStats] = useState<Map<number, PlayerStats>>(
    new Map()
  );

  // Fetch player data and their leagues
  const fetchPlayer = async () => {
    if (!db || !id) return;

    try {
      setIsLoading(true);
      const result = await findById<Player>(db, "players", Number(id));
      setPlayer(result);

      // Fetch player's leagues
      const leagues = await getPlayerLeagues(db, Number(id));
      setPlayerLeagues(leagues);

      // Fetch stats for each league
      const statsMap = new Map<number, PlayerStats>();
      for (const league of leagues) {
        const stats = await getPlayerStats(db, Number(id), league.id);
        statsMap.set(league.id, stats);
      }
      setPlayerStats(statsMap);
    } catch (error) {
      console.error("Failed to fetch player:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Refetch when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchPlayer();
    }, [db, id])
  );

  const handleDelete = () => {
    if (!player) return;

    Alert.alert(
      "Delete Player",
      `Are you sure you want to delete ${player.firstName} ${player.lastName}? This action cannot be undone.`,
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
    router.push(`/players/new?id=${id}&mode=edit`);
  };

  const handleRemoveFromLeague = (leagueId: number, leagueName: string) => {
    if (!player) return;

    Alert.alert(
      "Leave League",
      `Remove ${player.firstName} ${player.lastName} from ${leagueName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            if (!db || !id) return;
            try {
              await removePlayerFromLeague(db, Number(id), leagueId);
              fetchPlayer(); // Refresh
            } catch (error) {
              console.error("Failed to remove from league:", error);
              Alert.alert("Error", "Failed to remove from league");
            }
          },
        },
      ]
    );
  };

  const handleViewLeague = (leagueId: number) => {
    router.push(`/leagues/${leagueId}` as Href);
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

  const getLeagueDetails = (league: (typeof playerLeagues)[0]) => {
    const parts = [];
    if (league.location) parts.push(league.location);
    return parts.join(" • ");
  };

  // Calculate overall stats
  const totalWins = playerLeagues.reduce((sum, league) => sum + league.wins, 0);
  const totalLosses = playerLeagues.reduce(
    (sum, league) => sum + league.losses,
    0
  );
  const totalGames = totalWins + totalLosses;
  const winPercentage =
    totalGames > 0 ? ((totalWins / totalGames) * 100).toFixed(1) : "0.0";

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
                  Added On
                </Text>
                <Text size="md" className="text-typography-900">
                  {formatDate(player.createdAt)}
                </Text>
              </VStack>
            </VStack>
          </VStack>

          <Divider />

          {/* Overall Stats */}
          <VStack space="lg">
            <Heading size="lg" className="text-typography-800">
              Overall Stats
            </Heading>
            <Card size="md" variant="elevated" className="p-4">
              <VStack space="md">
                <HStack className="justify-between">
                  <Text className="text-typography-600">Total Games</Text>
                  <Text className="text-typography-900 font-semibold">
                    {totalGames}
                  </Text>
                </HStack>
                <HStack className="justify-between">
                  <Text className="text-typography-600">Record</Text>
                  <Text className="text-typography-900 font-semibold">
                    {totalWins}W - {totalLosses}L
                  </Text>
                </HStack>
                <HStack className="justify-between">
                  <Text className="text-typography-600">Win Rate</Text>
                  <Text className="text-typography-900 font-semibold">
                    {winPercentage}%
                  </Text>
                </HStack>
              </VStack>
            </Card>
          </VStack>

          <Divider />

          {/* Leagues Section */}
          <VStack space="lg">
            <Heading size="lg" className="text-typography-800">
              Leagues ({playerLeagues.length})
            </Heading>

            {playerLeagues.length === 0 ? (
              <Center className="py-4">
                <Text className="text-typography-400 text-center">
                  Not enrolled in any leagues yet.
                </Text>
              </Center>
            ) : (
              <VStack space="md">
                {playerLeagues.map((league) => {
                  const stats = playerStats.get(league.id);

                  return (
                    <Card
                      key={league.id}
                      size="md"
                      variant="outline"
                      className="p-4"
                      style={{
                        borderLeftWidth: 4,
                        borderLeftColor: league.color || "#1E6FFF",
                      }}
                    >
                      <VStack space="md">
                        <VStack space="xs">
                          <Heading size="md" className="text-typography-900">
                            {league.name}
                          </Heading>
                          {getLeagueDetails(league) && (
                            <Text size="sm" className="text-typography-500">
                              {getLeagueDetails(league)}
                            </Text>
                          )}
                        </VStack>

                        {/* Stats Row */}
                        <HStack space="lg" className="flex-wrap">
                          <VStack space="xs">
                            <Text size="xs" className="text-typography-500">
                              Record
                            </Text>
                            <Text
                              size="sm"
                              className="text-typography-900 font-semibold"
                            >
                              {league.wins}W - {league.losses}L
                            </Text>
                          </VStack>

                          {stats && (
                            <>
                              <VStack space="xs">
                                <Text size="xs" className="text-typography-500">
                                  Current Streak
                                </Text>
                                <Text
                                  size="sm"
                                  className={`font-semibold ${
                                    stats.currentStreak > 0
                                      ? "text-success-600"
                                      : stats.currentStreak < 0
                                      ? "text-error-600"
                                      : "text-typography-900"
                                  }`}
                                >
                                  {formatStreak(stats.currentStreak)}
                                </Text>
                              </VStack>

                              <VStack space="xs">
                                <Text size="xs" className="text-typography-500">
                                  Best Streak
                                </Text>
                                <Text
                                  size="sm"
                                  className="text-typography-900 font-semibold"
                                >
                                  W{stats.bestWinStreak}
                                </Text>
                              </VStack>

                              <VStack space="xs">
                                <Text size="xs" className="text-typography-500">
                                  Recent Form
                                </Text>
                                <HStack space="xs">
                                  {stats.recentForm.map((result, index) => (
                                    <Text
                                      key={index}
                                      size="xs"
                                      className={`font-bold ${
                                        result === "W"
                                          ? "text-success-600"
                                          : "text-error-600"
                                      }`}
                                    >
                                      {result}
                                    </Text>
                                  ))}
                                </HStack>
                              </VStack>
                            </>
                          )}
                        </HStack>

                        <HStack space="sm">
                          <Button
                            size="xs"
                            variant="outline"
                            className="flex-1"
                            onPress={() => handleViewLeague(league.id)}
                          >
                            <ButtonText>View League</ButtonText>
                          </Button>
                          <Button
                            size="xs"
                            variant="outline"
                            action="negative"
                            onPress={() =>
                              handleRemoveFromLeague(league.id, league.name)
                            }
                          >
                            <Icon
                              as={LogOut}
                              size="sm"
                              className="text-white"
                            />
                          </Button>
                        </HStack>
                      </VStack>
                    </Card>
                  );
                })}
              </VStack>
            )}
          </VStack>

          {/* Action Buttons */}
          <VStack space="md" className="mt-4">
            <Button action="primary" size="lg" onPress={handleEdit}>
              <ButtonText>Edit Player</ButtonText>
            </Button>

            <Button
              action="negative"
              variant="link"
              size="lg"
              onPress={handleDelete}
            >
              <ButtonText className="text-error-500">Delete Player</ButtonText>
            </Button>
          </VStack>
        </VStack>
      </ScrollView>
    </SafeAreaView>
  );
}
