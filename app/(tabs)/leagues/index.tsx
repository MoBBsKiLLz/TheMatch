import React, { useCallback, useState } from "react";
import { RefreshControl, Alert, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView } from "@/components/ui/scroll-view";
import { VStack } from "@/components/ui/vstack";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { Button, ButtonText } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Fab, FabIcon } from "@/components/ui/fab";
import { AddIcon } from "@/components/ui/icon";
import { Spinner } from "@/components/ui/spinner";
import { Center } from "@/components/ui/center";
import { useRouter, useFocusEffect, Href } from "expo-router";
import { useDatabase } from "@/lib/db/provider";
import { League } from "@/types/league";
import { remove } from "@/lib/db/queries";
import { Menu, MenuItem, MenuItemLabel } from "@/components/ui/menu";

export default function Leagues() {
  const router = useRouter();
  const { db, isLoading: dbLoading } = useDatabase();
  const [leagues, setLeagues] = useState<League[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLeagues = async () => {
    if (!db) return;

    try {
      const result = await db.all<League>(
        "SELECT * FROM leagues ORDER BY createdAt DESC"
      );
      setLeagues(result);
    } catch (error) {
      console.error("Failed to fetch leagues: ", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
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

  const onRefresh = () => {
    setRefreshing(true);
    fetchLeagues();
  };

  const handleDelete = (league: League) => {
    Alert.alert(
      "Delete league",
      `Are you sure you want to delete ${league.name}? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (!db) return;
            try {
              await remove(db, "leagues", league.id);
              fetchLeagues();
            } catch (error) {
              console.error("Failed to delete league: ", error);
              Alert.alert("Error", "Failed to delete league");
            }
          },
        },
      ]
    );
  };

  const handleEdit = (league: League) => {
    router.push(`/leagues/new?id=${league.id}&mode=edit` as Href);
  };

  const handleView = (league: League) => {
    router.push(`/leagues/${league.id}` as Href);
  };

  if (dbLoading || isLoading) {
    return (
      <Center className="flex-1 bg-background-0">
        <VStack space="md" className="items-center">
          <Spinner size="large" />
          <Text className="text-typography-500">Loading Leagues...</Text>
        </VStack>
      </Center>
    );
  }

  const getLeagueDetails = (league: League) => {
    const parts = [];
    if (league.season) parts.push(league.season);
    if (league.location) parts.push(league.location);
    return parts.join(" • ");
  };

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
            Your Leagues
          </Heading>

          {leagues.length === 0 ? (
            <Center className="mt-20">
              <VStack space="sm" className="itmes-center">
                <Text size="lg" className="text-typography-500 text-center">
                  You don't have any leagues yet.
                </Text>
                <Text size="lg" className="text-typography-500 text-center">
                  Tap + to create one.
                </Text>
              </VStack>
            </Center>
          ) : (
            <VStack space="md">
              {leagues.map((league) => (
                <Menu
                  key={league.id}
                  placement="bottom"
                  trigger={({ ...triggerProps }) => (
                    <Pressable { ...triggerProps }>
                      <Card
                        key={league.id}
                        size="md"
                        variant="elevated"
                        className="p-4 border border-neutral-400"
                      >
                        <VStack space="md">
                          <VStack space="xs">
                            <Heading size="lg" className="text-typography-900">
                              {league.name}
                            </Heading>
                            {getLeagueDetails(league) && (
                              <Text size="sm" className="text-typography-500">
                                {getLeagueDetails(league)}
                              </Text>
                            )}
                          </VStack>

                          <Button
                            size="sm"
                            action="primary"
                            onPress={() => handleView(league)}
                          >
                            <ButtonText>View League</ButtonText>
                          </Button>
                          <Text size="sm" className="text-typography-400 text-center mt-2">
                            Long press for more options
                          </Text>
                        </VStack>
                      </Card>
                    </Pressable>
                  )}
                >
                <MenuItem
                    key="edit"
                    textValue="Edit"
                    onPress={() => handleEdit(league)}
                  >
                    <MenuItemLabel>Edit League</MenuItemLabel>
                  </MenuItem>
                  <MenuItem
                    key="delete"
                    textValue="Delete"
                    onPress={() => handleDelete(league)}
                  >
                    <MenuItemLabel className="text-error-500">Delete League</MenuItemLabel>
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
        onPress={() => router.push("/(tabs)/leagues/new")}
      >
        <FabIcon as={AddIcon} />
      </Fab>
    </SafeAreaView>
  );
}
