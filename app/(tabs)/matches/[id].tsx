import React, { useState, useCallback } from "react";
import { Alert } from "react-native";
import { SafeAreaView } from "@/components/ui/safe-area-view";
import { ScrollView } from "@/components/ui/scroll-view";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Button, ButtonText } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge, BadgeText } from "@/components/ui/badge";
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
import { findById } from "@/lib/db/queries";
import { Match } from "@/types/match";
import { deleteMatch } from "@/lib/db/matches";

type MatchDetails = Match & {
  playerAFirstName: string;
  playerALastName: string;
  playerBFirstName: string;
  playerBLastName: string;
  leagueName: string;
};

export default function MatchDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { db } = useDatabase();
  const [matchDetails, setMatchDetails] = useState<MatchDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMatch = async () => {
    if (!db || !id) return;

    try {
      setIsLoading(true);

      // Get match with player and league details
      const result = await db.get<MatchDetails>(
        `SELECT 
          m.*,
          pA.firstName as playerAFirstName,
          pA.lastName as playerALastName,
          pB.firstName as playerBFirstName,
          pB.lastName as playerBLastName,
          l.name as leagueName
        FROM matches m
        INNER JOIN players pA ON m.playerAId = pA.id
        INNER JOIN players pB ON m.playerBId = pB.id
        INNER JOIN leagues l ON m.leagueId = l.id
        WHERE m.id = ?`,
        [Number(id)]
      );

      setMatchDetails(result);
    } catch (error) {
      console.error("Failed to fetch match:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchMatch();
    }, [db, id])
  );

  const handleDelete = () => {
    if (!matchDetails) return;

    Alert.alert(
      "Delete Match",
      "Are you sure you want to delete this match? Win/loss records will be adjusted.",
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
              await deleteMatch(db, Number(id));
              router.back();
            } catch (error) {
              console.error("Failed to delete match:", error);
              Alert.alert("Error", "Failed to delete match. Please try again.");
            }
          },
        },
      ]
    );
  };

  const handleViewLeague = () => {
  if (matchDetails) {
    router.push(`/leagues/${matchDetails.leagueId}` as Href);
  }
};

  const handleViewPlayerA = () => {
  if (matchDetails) {
    router.push(`/players/${matchDetails.playerAId}` as Href);
  }
};

  const handleViewPlayerB = () => {
  if (matchDetails) {
    router.push(`/players/${matchDetails.playerBId}` as Href);
  }
};

  if (isLoading) {
    return (
      <Center className="flex-1 bg-background-0">
        <VStack space="md" className="items-center">
          <Spinner size="large" />
          <Text className="text-typography-500">Loading match...</Text>
        </VStack>
      </Center>
    );
  }

  if (!matchDetails) {
    return (
      <Center className="flex-1 bg-background-0">
        <VStack space="md" className="items-center">
          <Text className="text-typography-500">Match not found</Text>
          <Button onPress={() => router.back()}>
            <ButtonText>Go Back</ButtonText>
          </Button>
        </VStack>
      </Center>
    );
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const isPlayerAWinner = matchDetails.winnerId === matchDetails.playerAId;
  const isPlayerBWinner = matchDetails.winnerId === matchDetails.playerBId;

  const handleEdit = () => {
    router.push(`/matches/new?id=${id}&mode=edit`);
  };

  return (
    <SafeAreaView className="flex-1 bg-background-0">
      <ScrollView className="flex-1" contentContainerClassName="p-6">
        <VStack space="2xl">
          {/* Header */}
          <VStack space="sm">
            <Badge
              size="md"
              variant="solid"
              action="info"
              className="self-start"
            >
              <BadgeText>{matchDetails.leagueName}</BadgeText>
            </Badge>
            <Heading size="3xl" className="text-typography-900">
              Match Details
            </Heading>
            {/* <Text className="text-typography-500">
              {formatDate(matchDetails.date)}
            </Text> */}
          </VStack>

          <Divider />

          {/* Players Section */}
          <VStack space="lg">
            <Heading size="lg" className="text-typography-800">
              Players
            </Heading>

            {/* Player A */}
            <Card size="md" variant="elevated" className="p-4">
              <VStack space="md">
                <HStack className="justify-between items-center">
                  <VStack space="xs" className="flex-1">
                    <Heading
                      size="md"
                      className={`${
                        isPlayerAWinner
                          ? "text-success-600"
                          : "text-typography-900"
                      }`}
                    >
                      {matchDetails.playerAFirstName}{" "}
                      {matchDetails.playerALastName}
                      {isPlayerAWinner && " ✓"}
                    </Heading>
                    {isPlayerAWinner && (
                      <Badge
                        size="sm"
                        variant="solid"
                        action="success"
                        className="self-start"
                      >
                        <BadgeText>Winner</BadgeText>
                      </Badge>
                    )}
                  </VStack>
                </HStack>
                <Button size="xs" variant="outline" onPress={handleViewPlayerA}>
                  <ButtonText>View Player</ButtonText>
                </Button>
              </VStack>
            </Card>

            {/* VS Divider */}
            <Center>
              <Text size="lg" className="text-typography-500 font-semibold">
                VS
              </Text>
            </Center>

            {/* Player B */}
            <Card size="md" variant="elevated" className="p-4">
              <VStack space="md">
                <HStack className="justify-between items-center">
                  <VStack space="xs" className="flex-1">
                    <Heading
                      size="md"
                      className={`${
                        isPlayerBWinner
                          ? "text-success-600"
                          : "text-typography-900"
                      }`}
                    >
                      {matchDetails.playerBFirstName}{" "}
                      {matchDetails.playerBLastName}
                      {isPlayerBWinner && " ✓"}
                    </Heading>
                    {isPlayerBWinner && (
                      <Badge
                        size="sm"
                        variant="solid"
                        action="success"
                        className="self-start"
                      >
                        <BadgeText>Winner</BadgeText>
                      </Badge>
                    )}
                  </VStack>
                </HStack>
                <Button size="xs" variant="outline" onPress={handleViewPlayerB}>
                  <ButtonText>View Player</ButtonText>
                </Button>
              </VStack>
            </Card>
          </VStack>

          <Divider />

          {/* Match Info */}
          <VStack space="lg">
            <Heading size="lg" className="text-typography-800">
              Match Information
            </Heading>

            <VStack space="md">
              <VStack space="xs">
                <Text size="sm" className="text-typography-500 font-medium">
                  League
                </Text>
                <HStack className="justify-between items-center">
                  <Text size="md" className="text-typography-900">
                    {matchDetails.leagueName}
                  </Text>
                  <Button size="xs" variant="link" onPress={handleViewLeague}>
                    <ButtonText>View League</ButtonText>
                  </Button>
                </HStack>
              </VStack>

              <VStack space="xs">
                <Text size="sm" className="text-typography-500 font-medium">
                  Match Date
                </Text>
                <Text size="md" className="text-typography-900">
                  {formatDate(matchDetails.date)}
                </Text>
              </VStack>

              <VStack space="xs">
                <Text size="sm" className="text-typography-500 font-medium">
                  Recorded At
                </Text>
                <Text size="md" className="text-typography-900">
                  {formatDate(matchDetails.createdAt)} at{" "}
                  {formatTime(matchDetails.createdAt)}
                </Text>
              </VStack>

              {!matchDetails.winnerId && (
                <VStack space="xs">
                  <Text size="sm" className="text-typography-500 font-medium">
                    Result
                  </Text>
                  <Text size="md" className="text-typography-900">
                    No winner recorded
                  </Text>
                </VStack>
              )}
            </VStack>
          </VStack>

          {/* Action Buttons */}
          <VStack space="md" className="mt-4">
            <Button action="primary" size="lg" onPress={handleEdit}>
              <ButtonText>
                Edit Match
              </ButtonText>
            </Button>
            <Button action="negative" variant="link" size="lg" onPress={handleDelete}>
              <ButtonText>
                Delete Match
              </ButtonText>
            </Button>
          </VStack>
        </VStack>
      </ScrollView>
    </SafeAreaView>
  );
}
