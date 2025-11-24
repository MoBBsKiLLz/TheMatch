import React from "react";
import { ImageBackground } from "react-native";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Button, ButtonText } from "@/components/ui/button";
import { useRouter } from "expo-router";
import { useColorScheme } from "react-native";

export default function Home() {
  const router = useRouter();
  const colorScheme = useColorScheme();

  const heroSource = colorScheme === "dark"
    ? require("@/assets/images/hero_alt_dark.png")
    : require("@/assets/images/hero_alt_light.png");

  return (
    <ImageBackground source={heroSource} style={{ flex: 1 }} resizeMode="cover">
      <Box className="flex-1 bg-black/5 justify-center items-center px-6 w-full">
        <Text className="text-4xl font-bold text-center">
          The Match
        </Text>

        <Text className="text-center mt-4 opacity-90">
          Manage leagues, create teams, and schedule games — all in one place.
        </Text>

        <Button
          size="lg"
          className="bg-secondary-500 px-6 py-2 rounded-full mt-10 "
          onPress={() => router.push("/(tabs)/leagues")}
        >
          <ButtonText>Enter</ButtonText>
        </Button>
      </Box>
    </ImageBackground>
  );
}
