import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import "@/global.css";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { Stack } from "expo-router";
import { DatabaseProvider } from "@/lib/db/provider";
import { useColorScheme } from "react-native";
import { ErrorBoundary as CustomErrorBoundary } from "@/components/ErrorBoundary";
import { initializeSentry } from "@/lib/utils/sentry";

export {
  ErrorBoundary,
} from "expo-router";

// Initialize Sentry for error tracking and performance monitoring
initializeSentry();

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const systemColorScheme = useColorScheme();
  
  // Default to light if null
  const colorMode: 'light' | 'dark' = systemColorScheme === "dark" ? "dark" : "light";

  return (
    <CustomErrorBoundary>
      <DatabaseProvider>
        <GluestackUIProvider mode={colorMode}>
          <ThemeProvider value={colorMode === "dark" ? DarkTheme : DefaultTheme}>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(tabs)" />
            </Stack>
          </ThemeProvider>
        </GluestackUIProvider>
      </DatabaseProvider>
    </CustomErrorBoundary>
  );
}