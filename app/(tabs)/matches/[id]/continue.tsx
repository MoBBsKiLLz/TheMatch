import React, { useState, useEffect, useCallback } from "react";
import { Alert, Keyboard } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView } from "@/components/ui/scroll-view";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Button, ButtonText } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Center } from "@/components/ui/center";
import { Badge, BadgeText } from "@/components/ui/badge";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { useDatabase } from "@/lib/db/provider";
import { Match, MatchWithParticipants } from "@/types/match";
import { findById } from "@/lib/db/queries";
import { updateMatch } from "@/lib/db/matches";
import { DominosGameData, UnoGameData, GameData } from "@/types/games";
import { DominosMatchForm } from "@/components/match-forms/DominosMatchForm";
import { UnoMatchForm } from "@/components/match-forms/UnoMatchForm";
import { ParticipantInfo } from "@/components/match-forms/types";

export default function ContinueMatch() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { db } = useDatabase();
  const [matchDetails, setMatchDetails] = useState<MatchWithParticipants | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [participants, setParticipants] = useState<ParticipantInfo[]>([]);

  const fetchMatch = useCallback(async () => {
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
      const participantResults = await db.all<any>(
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

      const participantsWithBoolean = participantResults.map((p) => ({
        ...p,
        isWinner: p.isWinner === 1,
      }));

      setMatchDetails({
        ...match,
        participants: participantsWithBoolean,
      });

      // Set participants for forms
      setParticipants(
        participantsWithBoolean.map((p) => ({
          playerId: p.playerId,
          firstName: p.firstName,
          lastName: p.lastName,
          seatIndex: p.seatIndex,
        }))
      );

      // Parse existing game data
      if (match.gameData) {
        try {
          const parsed = JSON.parse(match.gameData);
          setGameData(parsed);
        } catch (e) {
          console.error('Failed to parse game data:', e);
        }
      }
    } catch (error) {
      console.error("Failed to fetch match:", error);
    } finally {
      setIsLoading(false);
    }
  }, [db, id]);

  useFocusEffect(
    useCallback(() => {
      fetchMatch();
    }, [fetchMatch])
  );

  const handleSave = async (status: 'completed' | 'in_progress') => {
    if (!db || !matchDetails || !gameData) return;

    setIsSaving(true);
    Keyboard.dismiss();

    try {
      // Determine winners based on game data
      const winnerPlayerIds: number[] = [];

      if (matchDetails.gameType === 'dominos' && 'finalScores' in gameData) {
        const dominosData = gameData as DominosGameData;
        dominosData.finalScores.forEach((score, index) => {
          if (score >= dominosData.targetScore) {
            winnerPlayerIds.push(participants[index].playerId);
          }
        });
      } else if (matchDetails.gameType === 'uno' && 'finalScores' in gameData) {
        const unoData = gameData as UnoGameData;
        unoData.finalScores.forEach((score, index) => {
          if (score >= unoData.targetScore) {
            winnerPlayerIds.push(participants[index].playerId);
          }
        });
      }

      // Update match with new game data and status
      await updateMatch(db, Number(id), {
        gameData,
        participants: matchDetails.participants.map((p) => ({
          playerId: p.playerId,
          seatIndex: p.seatIndex,
          score: null,
          finishPosition: null,
          isWinner: winnerPlayerIds.includes(p.playerId),
        })),
      });

      // Update status
      await db.run('UPDATE matches SET status = ? WHERE id = ?', [status, Number(id)]);

      Alert.alert(
        "Success",
        status === 'completed' ? "Match completed!" : "Progress saved!",
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (error) {
      console.error("Failed to save match:", error);
      Alert.alert("Error", "Failed to save match. Please try again.");
    } finally {
      setIsSaving(false);
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

  return (
    <SafeAreaView className="flex-1 bg-background-0">
      <ScrollView className="flex-1" contentContainerClassName="p-6" keyboardShouldPersistTaps="handled">
        <VStack space="xl">
          <VStack space="sm">
            <Heading size="3xl" className="text-typography-900">
              Continue Match
            </Heading>
            <Badge size="md" variant="solid" action="warning">
              <BadgeText>In Progress</BadgeText>
            </Badge>
          </VStack>

          <Text className="text-typography-600">
            Add more games to this {matchDetails.gameType} match. Your previous games have been loaded.
          </Text>

          {matchDetails.gameType === 'dominos' && (
            <DominosMatchForm
              participants={participants}
              onDataChange={setGameData}
              onWinnersChange={() => {}} // Winners are set on save
              initialData={gameData as DominosGameData}
            />
          )}

          {matchDetails.gameType === 'uno' && (
            <UnoMatchForm
              participants={participants}
              onDataChange={setGameData}
              onWinnersChange={() => {}} // Winners are set on save
              initialData={gameData as UnoGameData}
            />
          )}

          {/* Action Buttons */}
          <VStack space="md" className="mt-4">
            <HStack space="md">
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
                onPress={() => handleSave('completed')}
                isDisabled={isSaving}
              >
                <ButtonText>
                  {isSaving ? "Saving..." : "Save & Complete"}
                </ButtonText>
              </Button>
            </HStack>

            <Button
              action="secondary"
              size="lg"
              variant="outline"
              onPress={() => handleSave('in_progress')}
              isDisabled={isSaving}
            >
              <ButtonText>
                Save Progress (Continue Later)
              </ButtonText>
            </Button>
          </VStack>
        </VStack>
      </ScrollView>
    </SafeAreaView>
  );
}
