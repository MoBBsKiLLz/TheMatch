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
import { MatchWithParticipants, MatchParticipant, Match } from "@/types/match";
import { deleteMatch } from "@/lib/db/matches";
import { update } from "@/lib/db/queries";
import { DominosGameData, UnoGameData } from "@/types/games";
import {
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionTrigger,
  AccordionTitleText,
  AccordionIcon,
  AccordionContent,
} from "@/components/ui/accordion";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react-native";

export default function MatchDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { db } = useDatabase();
  const [matchDetails, setMatchDetails] = useState<MatchWithParticipants | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [accordionValue, setAccordionValue] = useState<string[]>([]);

  const fetchMatch = async () => {
    if (!db || !id) return;

    try {
      setIsLoading(true);

      // Get match
      const match = await db.get<Match & { leagueName: string | null }>(
        `SELECT m.*, l.name as leagueName
        FROM matches m
        LEFT JOIN leagues l ON m.leagueId = l.id
        WHERE m.id = ?`,
        [Number(id)]
      );

      if (!match) {
        setMatchDetails(null);
        return;
      }

      // Get participants
      const participants = await db.all<
        MatchParticipant & { firstName: string; lastName: string }
      >(
        `SELECT
          mp.*,
          p.firstName,
          p.lastName
        FROM match_participants mp
        INNER JOIN players p ON mp.playerId = p.id
        WHERE mp.matchId = ?
        ORDER BY mp.seatIndex ASC`,
        [Number(id)]
      );

      // Convert isWinner from integer to boolean
      const participantsWithBoolean = participants.map((p) => ({
        ...p,
        isWinner: p.isWinner === 1,
      }));

      setMatchDetails({
        ...match,
        participants: participantsWithBoolean,
      });
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
    if (matchDetails && matchDetails.leagueId) {
      router.push(`/leagues/${matchDetails.leagueId}` as Href);
    }
  };

  const handleViewPlayer = (playerId: number) => {
    router.push(`/players/${playerId}` as Href);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
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
      <SafeAreaView className="flex-1 bg-background-0">
        <Center className="flex-1">
          <VStack space="md" className="items-center">
            <Text className="text-typography-500">Match not found</Text>
            <Button onPress={() => router.back()}>
              <ButtonText>Go Back</ButtonText>
            </Button>
          </VStack>
        </Center>
      </SafeAreaView>
    );
  }

  const winners = matchDetails.participants.filter((p) => p.isWinner);

  // Parse game data if available
  let parsedGameData: DominosGameData | UnoGameData | null = null;
  if (matchDetails.gameData) {
    try {
      parsedGameData = JSON.parse(matchDetails.gameData);
    } catch (e) {
      console.error('Failed to parse game data:', e);
    }
  }

  // Render game-by-game breakdown
  const renderGameBreakdown = () => {
    if (!parsedGameData) return null;

    if (matchDetails.gameType === 'dominos' && 'games' in parsedGameData) {
      const dominosData = parsedGameData as DominosGameData;
      return (
        <Accordion
          type="multiple"
          value={accordionValue}
          onValueChange={setAccordionValue}
        >
          <AccordionItem value="game-details">
            <AccordionHeader>
              <AccordionTrigger>
                {({ isExpanded }) => (
                  <>
                    <AccordionTitleText>
                      Game Details ({dominosData.games.length} games played)
                    </AccordionTitleText>
                    <AccordionIcon
                      as={isExpanded ? ChevronUpIcon : ChevronDownIcon}
                      className="ml-3"
                    />
                  </>
                )}
              </AccordionTrigger>
            </AccordionHeader>
            <AccordionContent>
              <VStack space="md" className="pt-2">
                {dominosData.games.map((game, idx) => {
                  const winner = matchDetails.participants.find(
                    (p) => p.playerId === game.winnerId
                  );
                  return (
                    <Card key={idx} size="sm" variant="outline" className="p-3">
                      <VStack space="xs">
                        <Text size="sm" className="font-semibold">
                          Game {idx + 1}
                        </Text>
                        {matchDetails.participants.map((participant, pIdx) => {
                          const points = game.scores[pIdx] || 0;
                          const pips = game.pips ? (game.pips[pIdx] || 0) : 0;
                          const net = points - pips;
                          return (
                            <Text key={participant.playerId} size="sm">
                              {participant.firstName} {participant.lastName}: {points}
                              {pips > 0 && ` - ${pips} pips = ${net >= 0 ? '+' : ''}${net}`}
                            </Text>
                          );
                        })}
                        <Text size="xs" className="text-success-600">
                          Winner: {winner ? `${winner.firstName} ${winner.lastName}` : 'Unknown'}
                        </Text>
                      </VStack>
                    </Card>
                  );
                })}
                <Divider />
                <VStack space="xs">
                  <Text size="sm" className="font-semibold">Final Scores</Text>
                  {matchDetails.participants.map((participant, idx) => (
                    <Text key={participant.playerId} size="sm">
                      {participant.firstName} {participant.lastName}: {dominosData.finalScores[idx] || 0}
                    </Text>
                  ))}
                  <Text size="xs" className="text-typography-500">
                    Target: {dominosData.targetScore}
                  </Text>
                </VStack>
              </VStack>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      );
    }

    if (matchDetails.gameType === 'uno' && 'games' in parsedGameData) {
      const unoData = parsedGameData as UnoGameData;
      return (
        <Accordion
          type="multiple"
          value={accordionValue}
          onValueChange={setAccordionValue}
        >
          <AccordionItem value="game-details">
            <AccordionHeader>
              <AccordionTrigger>
                {({ isExpanded }) => (
                  <>
                    <AccordionTitleText>
                      Game Details ({unoData.games.length} games played)
                    </AccordionTitleText>
                    <AccordionIcon
                      as={isExpanded ? ChevronUpIcon : ChevronDownIcon}
                      className="ml-3"
                    />
                  </>
                )}
              </AccordionTrigger>
            </AccordionHeader>
            <AccordionContent>
              <VStack space="md" className="pt-2">
                {unoData.games.map((game, idx) => {
                  const winner = matchDetails.participants.find(
                    (p) => p.playerId === game.winnerId
                  );
                  const winnerIndex = matchDetails.participants.findIndex(
                    (p) => p.playerId === game.winnerId
                  );
                  const pointsEarned = game.scores[winnerIndex] || 0;

                  return (
                    <Card key={idx} size="sm" variant="outline" className="p-3">
                      <VStack space="xs">
                        <Text size="sm" className="font-semibold">
                          Game {idx + 1}
                        </Text>
                        <Text size="sm" className="text-success-600">
                          {winner ? `${winner.firstName} ${winner.lastName}` : 'Unknown'} went out
                        </Text>
                        <Text size="sm">
                          Points earned: {pointsEarned}
                        </Text>
                      </VStack>
                    </Card>
                  );
                })}
                <Divider />
                <VStack space="xs">
                  <Text size="sm" className="font-semibold">Final Scores</Text>
                  {matchDetails.participants.map((participant, idx) => (
                    <Text key={participant.playerId} size="sm">
                      {participant.firstName} {participant.lastName}: {unoData.finalScores[idx] || 0}
                    </Text>
                  ))}
                  <Text size="xs" className="text-typography-500">
                    Target: {unoData.targetScore}
                  </Text>
                </VStack>
              </VStack>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      );
    }

    return null;
  };

  return (
    <SafeAreaView className="flex-1 bg-background-0">
      <ScrollView className="flex-1" contentContainerClassName="p-6">
        <VStack space="xl">
          <Heading size="2xl" className="text-typography-900">
            Match Details
          </Heading>

          {/* League and Status Badges */}
          <HStack space="sm" className="flex-wrap">
            {matchDetails.leagueName && (
              <Badge size="md" variant="solid" action="info">
                <BadgeText>{matchDetails.leagueName}</BadgeText>
              </Badge>
            )}
            {matchDetails.status === 'in_progress' && (
              <Badge size="md" variant="solid" action="warning">
                <BadgeText>In Progress</BadgeText>
              </Badge>
            )}
          </HStack>

          {/* Match Info Card */}
          <Card size="lg" variant="elevated" className="p-6">
            <VStack space="lg">
              {/* Date */}
              <VStack space="xs">
                <Text size="sm" className="text-typography-500">
                  Date
                </Text>
                <Text className="text-typography-900 font-medium">
                  {formatDate(matchDetails.date)}
                </Text>
              </VStack>

              {/* Week Number */}
              {matchDetails.weekNumber && (
                <VStack space="xs">
                  <Text size="sm" className="text-typography-500">
                    Week
                  </Text>
                  <Text className="text-typography-900 font-medium">
                    Week {matchDetails.weekNumber}
                  </Text>
                </VStack>
              )}

              {/* Game Type & Variant */}
              <VStack space="xs">
                <Text size="sm" className="text-typography-500">
                  Game
                </Text>
                <Text className="text-typography-900 font-medium">
                  {matchDetails.gameType.charAt(0).toUpperCase() + matchDetails.gameType.slice(1)}
                  {matchDetails.gameVariant && ` - ${matchDetails.gameVariant}`}
                </Text>
              </VStack>

              <Divider />

              {/* Participants */}
              <VStack space="md">
                <Heading size="md" className="text-typography-900">
                  Participants
                </Heading>

                {matchDetails.participants.map((participant, index) => (
                  <Card
                    key={participant.id}
                    size="md"
                    variant={participant.isWinner ? "solid" : "outline"}
                    className={participant.isWinner ? "bg-success-50 border-success-500" : ""}
                  >
                    <VStack space="sm" className="p-4">
                      <HStack className="justify-between items-center">
                        <VStack>
                          <Text
                            className={`font-semibold ${
                              participant.isWinner ? "text-success-700" : "text-typography-900"
                            }`}
                          >
                            {participant.firstName} {participant.lastName}
                            {participant.isWinner && " ✓"}
                          </Text>
                          {participant.score !== null && (
                            <Text size="sm" className="text-typography-600">
                              Score: {participant.score}
                            </Text>
                          )}
                          {participant.finishPosition !== null && (
                            <Text size="sm" className="text-typography-600">
                              Position: {participant.finishPosition}
                            </Text>
                          )}
                        </VStack>
                        <Button
                          size="sm"
                          variant="outline"
                          onPress={() => handleViewPlayer(participant.playerId)}
                        >
                          <ButtonText>View Player</ButtonText>
                        </Button>
                      </HStack>
                    </VStack>
                  </Card>
                ))}
              </VStack>

              {/* Winner Summary */}
              {winners.length > 0 && (
                <>
                  <Divider />
                  <VStack space="xs">
                    <Text size="sm" className="text-typography-500">
                      {winners.length > 1 ? "Winners" : "Winner"}
                    </Text>
                    <Text className="text-success-600 font-bold text-lg">
                      {winners.map((w) => `${w.firstName} ${w.lastName}`).join(", ")}
                    </Text>
                  </VStack>
                </>
              )}
            </VStack>
          </Card>

          {/* Game-by-Game Breakdown */}
          {renderGameBreakdown()}

          {/* Actions */}
          <VStack space="md">
            {matchDetails.status === 'in_progress' && (
              <Button
                size="lg"
                action="primary"
                onPress={() => router.push(`/matches/${matchDetails.id}/continue` as Href)}
              >
                <ButtonText>Continue Match</ButtonText>
              </Button>
            )}

            {matchDetails.status === 'in_progress' && (
              <Button
                size="lg"
                action="positive"
                variant="outline"
                onPress={async () => {
                  if (!db) return;
                  try {
                    await update(db, 'matches', matchDetails.id, { status: 'completed' });
                    fetchMatch();
                  } catch (error) {
                    console.error('Failed to mark as complete:', error);
                    Alert.alert('Error', 'Failed to mark match as complete');
                  }
                }}
              >
                <ButtonText>Mark as Complete</ButtonText>
              </Button>
            )}

            {matchDetails.leagueName && (
              <Button
                size="lg"
                action="secondary"
                variant="outline"
                onPress={handleViewLeague}
              >
                <ButtonText>View League</ButtonText>
              </Button>
            )}

            <Button
              size="lg"
              action="negative"
              variant="outline"
              onPress={handleDelete}
            >
              <ButtonText>Delete Match</ButtonText>
            </Button>
          </VStack>
        </VStack>
      </ScrollView>
    </SafeAreaView>
  );
}
