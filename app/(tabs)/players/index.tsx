import React, { useCallback, useState } from "react";
import { RefreshControl, Alert, Pressable, Keyboard } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView } from "@/components/ui/scroll-view";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { Button, ButtonText } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Fab, FabIcon } from "@/components/ui/fab";
import { AddIcon, SearchIcon, CloseIcon } from "@/components/ui/icon";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Center } from "@/components/ui/center";
import { useRouter, useFocusEffect, Href } from "expo-router";
import { useDatabase } from "@/lib/db/provider";
import { Player } from "@/types/player";
import { remove } from "@/lib/db/queries";
import { Menu,MenuItem, MenuItemLabel } from "@/components/ui/menu";
import { P, S } from "@expo/html-elements";

export default function Players() {
  const router = useRouter();
  const {db, isLoading: dbLoading} = useDatabase();
  const [players, setPlayers] = useState<Player[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchPlayers = async () => {
    if (!db) return;

    try {
      const result = await db.all<Player>(
        "SELECT * FROM players ORDER BY lastName ASC, firstName ASC"
      );
      setPlayers(result);
      setFilteredPlayers(result);
    } catch (error) {
      console.error("Failed to fetch players: ", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if(db) {
        setIsLoading(true);
        fetchPlayers();
      }
    }, [db])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchPlayers();
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);

    if(!query.trim()) {
      setFilteredPlayers(players);
      return;
    }

    const lowercaseQuery = query.toLowerCase();
    const filtered = players.filter(
      (player) => 
        player.firstName.toLowerCase().includes(lowercaseQuery) ||
        player.lastName.toLowerCase().includes(lowercaseQuery) ||
        `${player.firstName} ${player.lastName}`.toLowerCase().includes(lowercaseQuery)
    );
    setFilteredPlayers(filtered);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setFilteredPlayers(players);
    Keyboard.dismiss();
  };

  const handleDelete =(player: Player) => {
    Alert.alert(
      "Delete Player",
      `Are you sure you want to delete ${player.firstName} ${player.lastName}? This cannot be undone.`,
      [
        {text: "Cancel", style: "cancel"},
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if(!db) return;
            try {
              await remove(db, "players", player.id);
              fetchPlayers();
            } catch (error) {
              console.error("Failed to delete players: ", error);
              Alert.alert("Error", "Failed to delete player");
            }
          },
        },
      ]
    );
  };

  const handleEdit = (player: Player) => {
    router.push(`/players/new?id=${player.id}&mode=edit` as Href);
  };

  const handleView = (player: Player) => {
    router.push(`/players/${player.id}` as Href);
  };

  if (dbLoading || isLoading) {
    return (
      <Center className="flex-1 bg-background-0">
        <VStack space="md" className="items-center">
          <Spinner size="large" />
          <Text className="text-typography-500">Loading Players...</Text>
        </VStack>
      </Center>
    );
  }

  const getPlayerName = (player:Player) => {
    return `${player.firstName} ${player.lastName}`;
  };

  return (
    <SafeAreaView className="flex-1 bg-background-50">
      <ScrollView
        className="flex-1"
        contentContainerClassName="p-5"
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <VStack space="lg">
          <Heading size="2xl" className="text-typography-900">
            Players
          </Heading>

          {/* Search Bar */}
          <Input variant="outline" size="lg">
            <InputSlot className="pl-3">
              <InputIcon as={SearchIcon} />
            </InputSlot>
            <InputField
              placeholder="Search players..."
              value={searchQuery}
              onChangeText={handleSearch}
              autoCapitalize="words"
              returnKeyType="search"
              onSubmitEditing={() => Keyboard.dismiss()}
            />
            {searchQuery.length > 0 && (
              <InputSlot className="pr-3" onPress={clearSearch}>
                <InputIcon as={CloseIcon} />
              </InputSlot>
            )}
          </Input>

          {/* Results count */}
          {searchQuery && (
            <Text size="sm" className="text-typography-500">
              {filteredPlayers.length} player{filteredPlayers.length !== 1 ? "s" : ""} found 
            </Text>
          )}

          {filteredPlayers.length === 0 ? (
            <Center className="mt-20">
              <VStack space="sm" className="items-center">
                <Text size="lg" className="text-typography-500 text-center">
                  {searchQuery
                    ? "No players match your search."
                    : "You don't have any players yet."}
                </Text>
                {!searchQuery && (
                  <Text>
                    Tap + to add one.
                  </Text>
                )}
              </VStack>
            </Center>
          ) : (
            <VStack space="md">
              {filteredPlayers.map((player) => (
                <Menu
                  key={player.id}
                  placement="bottom"
                  trigger={({ ...triggerProps}) => (
                    <Pressable {...triggerProps}>
                      <Card
                        size="md"
                        variant="elevated"
                        className="p-4 border border-neutral-400"
                      >
                        <VStack>
                          <Heading className="mb-5">
                            {getPlayerName(player)}
                          </Heading>

                          <Button
                            size="md"
                            action="primary"
                            onPress={() => handleView(player)}
                          >
                            <ButtonText>View Player</ButtonText>
                          </Button>

                          <Text
                            size="sm"
                            className="text-typography-400 text-center mt-2"
                          >
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
                    onPress={() => handleEdit(player)}
                  >
                    <MenuItemLabel>Edit Player</MenuItemLabel>
                  </MenuItem>
                  <MenuItem
                    key="delete"
                    textValue="Delete"
                    onPress={() => handleDelete(player)}
                  >
                    <MenuItemLabel>Delete Player</MenuItemLabel>
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
        className="m-6"
        onPress={() => router.push("/players/new" as Href)}
      >
        <FabIcon as={AddIcon} />
      </Fab>
    </SafeAreaView>
  );
}
