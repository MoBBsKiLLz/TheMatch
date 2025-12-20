import React from 'react';
import { Play, Building, History, Menu, Landmark, Swords } from 'lucide-react-native';
import { Tabs } from 'expo-router';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';

function TabBarIcon(props: {
  Icon: React.ComponentType<any>;
  color: string;
}) {
  return <props.Icon size={18} color={props.color} />;
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
          tabBarIcon: ({ color }) => <TabBarIcon Icon={Swords} color={color} />,
        }}
      />
      <Tabs.Screen
        name="leagues"
        options={{
          title: 'Leagues',
          tabBarIcon: ({ color }) => <TabBarIcon Icon={Landmark} color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color }) => <TabBarIcon Icon={History} color={color} />,
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          title: 'Menu',
          tabBarIcon: ({ color }) => <TabBarIcon Icon={Menu} color={color} />,
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
