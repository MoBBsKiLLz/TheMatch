import React, { useState, useCallback, useMemo } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView } from "@/components/ui/scroll-view";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Button, ButtonText } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge, BadgeText } from "@/components/ui/badge";
import { Divider } from "@/components/ui/divider";
import { Spinner } from "@/components/ui/spinner";
import { Center } from "@/components/ui/center";
import { router, useLocalSearchParams, useFocusEffect, Href } from "expo-router";
import { useDatabase } from "@/lib/db/provider";
import { getTournament, getTournamentMatches, recordTournamentGame } from "@/lib/db/tournaments";
import { Tournament, TournamentMatchWithDetails } from "@/types/tournament";
import { Alert } from "react-native";
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

export default function TournamentBracket() {
  const { db } = useDatabase();
  const { id, seasonId } = useLocalSearchParams<{
    id: string;
    seasonId: string;
  }>();

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [matches, setMatches] = useState<TournamentMatchWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    if (!db || !seasonId) return;

    try {
      setIsLoading(true);

      const tournaments = await db.all<Tournament>(
        'SELECT * FROM tournaments WHERE seasonId = ? LIMIT 1',
        [Number(seasonId)]
      );

      const tournamentData = tournaments[0] || null;
      setTournament(tournamentData);

      if (tournamentData) {
        const matchesData = await getTournamentMatches(db, tournamentData.id);
        setMatches(matchesData);
      }
    } catch (error) {
      console.error("Failed to fetch tournament:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [db, seasonId])
  );

  // Group matches by round - must be called before any conditional returns (React Hooks rule)
  const matchesByRound = useMemo(() => {
    return matches.reduce((acc, match) => {
      if (!acc[match.round]) {
        acc[match.round] = [];
      }
      acc[match.round].push(match);
      return acc;
    }, {} as { [round: number]: TournamentMatchWithDetails[] });
  }, [matches]);

  const rounds = useMemo(() => {
    return Object.keys(matchesByRound)
      .map(Number)
      .sort((a, b) => b - a); // Descending order (finals first)
  }, [matchesByRound]);

  // Determine which rounds are complete (for auto-collapse)
  const completedRounds = useMemo(() => {
    const completed = new Set<number>();
    rounds.forEach(round => {
      const allMatchesComplete = matchesByRound[round].every(m => m.status === 'completed');
      if (allMatchesComplete) {
        completed.add(round);
      }
    });
    return completed;
  }, [matches, rounds, matchesByRound]);

  // Determine default expanded rounds (incomplete rounds)
  const defaultExpandedRounds = useMemo(() => {
    return rounds.filter(round => !completedRounds.has(round)).map(String);
  }, [rounds, completedRounds]);

  const handleRecordGame = (match: TournamentMatchWithDetails, winnerId: number) => {
    if (!db || !tournament) return;

    Alert.alert(
      "Record Game",
      `Record a win for ${winnerId === match.playerAId ? match.playerAFirstName + ' ' + match.playerALastName : match.playerBFirstName + ' ' + match.playerBLastName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Record Win",
          onPress: async () => {
            try {
              await recordTournamentGame(db, match.id, winnerId);
              fetchData();
            } catch (error) {
              console.error("Failed to record game:", error);
              Alert.alert("Error", "Failed to record game.");
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <Center className="flex-1 bg-background-0">
        <VStack space="md" className="items-center">
          <Spinner size="large" />
          <Text className="text-typography-500">Loading tournament...</Text>
        </VStack>
      </Center>
    );
  }

  if (!tournament) {
    return (
      <Center className="flex-1 bg-background-0">
        <VStack space="md" className="items-center">
          <Text className="text-typography-500">Tournament not found</Text>
          <Button onPress={() => router.back()}>
            <ButtonText>Go Back</ButtonText>
          </Button>
        </VStack>
      </Center>
    );
  }

  const getRoundName = (round: number, totalRounds: number) => {
    if (round === 1) return "Finals";
    if (round === 2) return "Semifinals";
    if (round === 3) return "Quarterfinals";
    return `Round ${totalRounds - round + 1}`;
  };

  const getSeriesStatus = (match: TournamentMatchWithDetails) => {
    const formatText = match.seriesFormat === 'best-of-3' ? 'Bo3' : 'Bo5';

    if (match.status === 'completed') {
      return `${formatText}: ${match.playerAWins}-${match.playerBWins}`;
    } else if (match.status === 'in_progress') {
      return `${formatText}: ${match.playerAWins}-${match.playerBWins}`;
    }
    return `${formatText}: Not Started`;
  };

  return (
    <SafeAreaView className="flex-1 bg-background-0">
      <ScrollView className="flex-1" contentContainerClassName="p-6">
        <VStack space="2xl">
          {/* Header */}
          <VStack space="sm">
            <HStack className="justify-between items-center">
              <Button
                size="sm"
                variant="link"
                onPress={() => router.back()}
              >
                <ButtonText>← Back to Season</ButtonText>
              </Button>
            </HStack>
            <Heading size="3xl" className="text-typography-900">
              {tournament.name}
            </Heading>
            <HStack space="sm">
              <Badge size="md" variant="solid" action="info">
                <BadgeText>Bo3 + Bo5 Finals</BadgeText>
              </Badge>
              <Badge
                size="md"
                variant="solid"
                action={tournament.status === 'active' ? 'success' : 'muted'}
              >
                <BadgeText className="capitalize">{tournament.status}</BadgeText>
              </Badge>
            </HStack>
          </VStack>

          <Divider />

          {/* Bracket Rounds - Collapsible */}
          <Accordion variant="unfilled" size="md" type="multiple" value={defaultExpandedRounds}>
            {rounds.map((round) => (
              <AccordionItem key={round} value={String(round)}>
                <AccordionHeader>
                  <AccordionTrigger>
                    {({ isExpanded }: { isExpanded: boolean }) => (
                      <>
                        <AccordionTitleText>
                          {getRoundName(round, rounds.length)} ({matchesByRound[round].length})
                          {completedRounds.has(round) && " ✓"}
                        </AccordionTitleText>
                        <AccordionIcon as={isExpanded ? ChevronUpIcon : ChevronDownIcon} className="ml-3" />
                      </>
                    )}
                  </AccordionTrigger>
                </AccordionHeader>
                <AccordionContent>
                  <VStack space="md" className="pt-2">
                    {matchesByRound[round].map((match) => (
                  <Card
                    key={match.id}
                    size="md"
                    variant="outline"
                    className="p-4"
                  >
                    <VStack space="md">
                      {/* Player A */}
                      <HStack className="justify-between items-center">
                        <VStack space="xs" className="flex-1">
                          <Text
                            className={`text-typography-900 font-medium ${
                              match.winnerId === match.playerAId ? "text-success-600" : ""
                            }`}
                          >
                            {match.playerAFirstName && match.playerALastName
                              ? `${match.playerAFirstName} ${match.playerALastName}`
                              : "TBD"}
                            {match.winnerId === match.playerAId && " ✓"}
                          </Text>
                        </VStack>
                        <Text className="text-typography-700 font-semibold text-xl">
                          {match.playerAWins}
                        </Text>
                      </HStack>

                      <Divider />

                      {/* Player B */}
                      <HStack className="justify-between items-center">
                        <VStack space="xs" className="flex-1">
                          <Text
                            className={`text-typography-900 font-medium ${
                              match.winnerId === match.playerBId ? "text-success-600" : ""
                            }`}
                          >
                            {match.playerBFirstName && match.playerBLastName
                              ? `${match.playerBFirstName} ${match.playerBLastName}`
                              : "TBD"}
                            {match.winnerId === match.playerBId && " ✓"}
                          </Text>
                        </VStack>
                        <Text className="text-typography-700 font-semibold text-xl">
                          {match.playerBWins}
                        </Text>
                      </HStack>

                      {/* Series Status */}
                      <Text size="sm" className="text-typography-500 text-center">
                        {getSeriesStatus(match)}
                      </Text>

                      {/* Action Buttons */}
                      {match.status !== 'completed' && match.playerAId && match.playerBId && (
                        <HStack space="sm">
                          <Button
                            action="primary"
                            size="sm"
                            className="flex-1"
                            onPress={() => handleRecordGame(match, match.playerAId!)}
                          >
                            <ButtonText>{match.playerAFirstName} Wins</ButtonText>
                          </Button>
                          <Button
                            action="primary"
                            size="sm"
                            className="flex-1"
                            onPress={() => handleRecordGame(match, match.playerBId!)}
                          >
                            <ButtonText>{match.playerBFirstName} Wins</ButtonText>
                          </Button>
                        </HStack>
                      )}
                      </VStack>
                    </Card>
                  ))}
                </VStack>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

          {/* Champion Display */}
          {tournament.championId && (
            <>
              <Divider />
              <Card size="lg" variant="outline" className="p-6 bg-success-50">
                <VStack space="md" className="items-center">
                  <Heading size="2xl" className="text-success-700">
                    🏆 Champion 🏆
                  </Heading>
                  <Heading size="xl" className="text-typography-900">
                    {matches.find(m => m.winnerId === tournament.championId)?.winnerFirstName}{" "}
                    {matches.find(m => m.winnerId === tournament.championId)?.winnerLastName}
                  </Heading>
                </VStack>
              </Card>
            </>
          )}
        </VStack>
      </ScrollView>
    </SafeAreaView>
  );
}
