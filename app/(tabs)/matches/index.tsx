import React, { useCallback, useState } from "react";
import { RefreshControl, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView } from "@/components/ui/scroll-view";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { Button, ButtonText } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Fab, FabIcon } from "@/components/ui/fab";
import { AddIcon } from "@/components/ui/icon";
import { Spinner } from "@/components/ui/spinner";
import { Center } from "@/components/ui/center";
import { Badge, BadgeText } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectInput,
  SelectIcon,
  SelectPortal,
  SelectBackdrop,
  SelectContent,
  SelectDragIndicatorWrapper,
  SelectDragIndicator,
  SelectItem,
} from "@/components/ui/select";
import { ChevronDownIcon } from "@/components/ui/icon";
import { useRouter, useFocusEffect, Href } from "expo-router";
import { useDatabase } from "@/lib/db/provider";
import { MatchWithDetails } from "@/types/match";
import { League } from "@/types/league";
import { getMatchesWithDetails, deleteMatch } from "@/lib/db/matches";
import { Icon } from "@/components/ui/icon";
import { Eye, Trash2 } from "lucide-react-native";

export default function Matches() {
  const router = useRouter();
  const { db, isLoading: dbLoading } = useDatabase();
  const [matches, setMatches] = useState<MatchWithDetails[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [selectedLeague, setSelectedLeague] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    if (!db) return;

    try {
      // Fetch leagues for filter
      const leagueResults = await db.all<League>(
        "SELECT * FROM leagues ORDER BY name ASC"
      );
      setLeagues(leagueResults);

      // Fetch matches (filtered or all)
      const leagueId =
        selectedLeague === "all" ? undefined : Number(selectedLeague);
      const matchResults = await getMatchesWithDetails(db, leagueId);
      setMatches(matchResults);
    } catch (error) {
      console.error("Failed to fetch matches: ", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (db) {
        setIsLoading(true);
        fetchData();
      }
    }, [db, selectedLeague])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleDelete = (match: MatchWithDetails) => {
    Alert.alert(
      "Delete Match",
      `Delete this match? Win/loss records will be adjusted.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (!db) return;
            try {
              await deleteMatch(db, match.id);
              fetchData();
            } catch (error) {
              console.error("Failed to delete match: ", error);
              Alert.alert("Error", "Failed to delete match");
            }
          },
        },
      ]
    );
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getMatchResult = (match: MatchWithDetails) => {
    if (!match.winnerId) {
      return "No winner recorded";
    }

    const winner =
      match.winnerId === match.playerAId
        ? `${match.playerAFirstName} ${match.playerALastName}`
        : `${match.playerBFirstName} ${match.playerBLastName}`;

    return `${winner} won`;
  };

  const handleViewMatch = (matchId: number) => {
    router.push(`/matches/${matchId}` as Href);
  };

  if (dbLoading || isLoading) {
    return (
      <Center className="flex-1 bg-background-0">
        <VStack space="md" className="items-center">
          <Spinner size="large" />
          <Text className="text-typography-500">Loading Matches...</Text>
        </VStack>
      </Center>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background-50">
      <ScrollView
        className="flex-1"
        contentContainerClassName="p-5"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <VStack space="lg">
          <Heading size="2xl" className="text-typography-900">
            Matches
          </Heading>

          {/* League Filter */}
          {leagues.length > 0 && (
            <Select
              selectedValue={selectedLeague}
              onValueChange={setSelectedLeague}
            >
              <SelectTrigger variant="outline" size="lg">
                <SelectInput placeholder="Filter by league" />
                <SelectIcon as={ChevronDownIcon} className="mr-3" />
              </SelectTrigger>
              <SelectPortal>
                <SelectBackdrop />
                <SelectContent>
                  <SelectDragIndicatorWrapper>
                    <SelectDragIndicator />
                  </SelectDragIndicatorWrapper>
                  <SelectItem label="All Leagues" value="all" />
                  {leagues.map((league) => (
                    <SelectItem
                      key={league.id}
                      label={league.name}
                      value={String(league.id)}
                    />
                  ))}
                </SelectContent>
              </SelectPortal>
            </Select>
          )}

          {matches.length === 0 ? (
            <Center className="mt-20">
              <VStack space="sm" className="items-center">
                <Text size="lg" className="text-typography-500 text-center">
                  {selectedLeague === "all"
                    ? "No matches recorded yet."
                    : "No matches in this league."}
                </Text>
                <Text size="lg" className="text-typography-500 text-center">
                  Tap + to record one.
                </Text>
              </VStack>
            </Center>
          ) : (
            <VStack space="md">
              {matches.map((match) => (
                <Card
                  key={match.id}
                  size="md"
                  variant="elevated"
                  className="p-4 border border-neutral-400"
                >
                  <VStack space="md">
                    {/* League Badge */}
                    <Badge size="sm" variant="solid" action="info">
                      <BadgeText>{match.leagueName}</BadgeText>
                    </Badge>

                    {/* Players */}
                    <VStack space="xs">
                      <HStack className="justify-between items-center">
                        <Text
                          className={`text-typography-900 font-medium ${
                            match.winnerId === match.playerAId
                              ? "text-success-600"
                              : ""
                          }`}
                        >
                          {match.playerAFirstName} {match.playerALastName}
                          {match.winnerId === match.playerAId && " ✓"}
                        </Text>
                      </HStack>
                      <Text
                        size="sm"
                        className="text-typography-500 text-center"
                      >
                        vs
                      </Text>
                      <HStack className="justify-between items-center">
                        <Text
                          className={`text-typography-900 font-medium ${
                            match.winnerId === match.playerBId
                              ? "text-success-600"
                              : ""
                          }`}
                        >
                          {match.playerBFirstName} {match.playerBLastName}
                          {match.winnerId === match.playerBId && " ✓"}
                        </Text>
                      </HStack>
                    </VStack>

                    {/* Match Info */}
                    <VStack space="xs">
                      <Text size="sm" className="text-typography-500">
                        {formatDate(match.date)}
                      </Text>
                      <Text size="sm" className="text-typography-600">
                        {getMatchResult(match)}
                      </Text>
                    </VStack>

                    {/* Actions */}
                    <VStack>
                      <Button
                        size="md"
                        action="primary"
                        onPress={() => handleViewMatch(match.id)}
                      >
                        {/* <Icon as={Eye} size="lg" className="text-primary-500" /> */}
                        <ButtonText>View Match</ButtonText>
                      </Button>
                      <Button
                        size="sm"
                        variant="link"
                        action="negative"
                        onPress={() => handleDelete(match)}
                      >
                        <ButtonText>Delete Match</ButtonText>
                      </Button>
                    </VStack>
                  </VStack>
                </Card>
              ))}
            </VStack>
          )}
        </VStack>
      </ScrollView>

      <Fab
        size="lg"
        placement="bottom right"
        className="m-6"
        onPress={() => router.push("/matches/new" as Href)}
      >
        <FabIcon as={AddIcon} />
      </Fab>
    </SafeAreaView>
  );
}
