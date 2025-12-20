import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={18} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        // Disable the static render of the header on web
        // to prevent a hydration error in React Navigation v6.
        headerShown: useClientOnlyValue(false, true),
        // Disable lazy loading so all tabs mount on app start
        // This ensures useFocusEffect hooks are set up even if tabs haven't been visited
        lazy: false,
      }}
    >
      {/* NEW TABS */}
      <Tabs.Screen
        name="play"
        options={{
          title: 'Play',
          tabBarIcon: ({ color }) => <TabBarIcon name="play" color={color} />,
        }}
      />
      <Tabs.Screen
        name="leagues"
        options={{
          title: 'Leagues',
          tabBarIcon: ({ color }) => <TabBarIcon name="bank" color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color }) => <TabBarIcon name="history" color={color} />,
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          title: 'Menu',
          tabBarIcon: ({ color }) => <TabBarIcon name="bars" color={color} />,
        }}
      />

      {/* HIDDEN ROUTES - Still accessible via router.push() */}
      <Tabs.Screen
        name="players"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="custom-games"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="matches"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="series"
        options={{ href: null }}
      />
    </Tabs>
  );
}
