import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView } from '@/components/ui/scroll-view';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { Card } from '@/components/ui/card';
import { Pressable } from '@/components/ui/pressable';
import { Icon } from '@/components/ui/icon';
import { ChevronRight, Users, Gamepad2, Settings, Info } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import type { LucideIcon } from 'lucide-react-native';

export default function MenuTab() {
  const router = useRouter();

  const menuItems: Array<{
    title: string;
    description: string;
    icon: LucideIcon;
    route: Href | null;
  }> = [
    {
      title: 'Players',
      description: 'Manage your players',
      icon: Users,
      route: '/players',
    },
    {
      title: 'Formats & Games',
      description: 'Configure custom games',
      icon: Gamepad2,
      route: '/custom-games',
    },
    {
      title: 'Settings',
      description: 'App preferences',
      icon: Settings,
      route: null, // Future
    },
    {
      title: 'Help & About',
      description: 'Get help and app info',
      icon: Info,
      route: null, // Future
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-background-50">
      <ScrollView className="p-4">
        <VStack space="xl">
          <VStack space="md">
            {menuItems.map((item, idx) => (
              <Card
                key={idx}
                size="md"
                variant="elevated"
              >
                <Pressable
                  onPress={() => item.route && router.push(item.route)}
                  disabled={!item.route}
                  className="p-4"
                >
                  <HStack space="md" className="items-center">
                    <Icon
                      as={item.icon}
                      size="xl"
                      className="text-primary-600"
                    />
                    <VStack className="flex-1">
                      <Heading size="md">{item.title}</Heading>
                      <Text size="sm" className="text-typography-500">
                        {item.description}
                      </Text>
                    </VStack>
                    {item.route && (
                      <Icon
                        as={ChevronRight}
                        className="text-typography-400"
                      />
                    )}
                  </HStack>
                </Pressable>
              </Card>
            ))}
          </VStack>
        </VStack>
      </ScrollView>
    </SafeAreaView>
  );
}
