import React from 'react';
import { Card } from '@/components/ui/card';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { Badge, BadgeText } from '@/components/ui/badge';
import { Pressable } from '@/components/ui/pressable';
import { SeriesWithStats } from '@/types/series';

interface SeriesCardProps {
  series: SeriesWithStats;
  onPress?: () => void;
  showActions?: boolean;
}

export function SeriesCard({ series, onPress, showActions = true }: SeriesCardProps) {
  const CardWrapper = onPress ? Pressable : React.Fragment;
  const wrapperProps = onPress ? { onPress } : {};

  return (
    <CardWrapper {...wrapperProps}>
      <Card
        size="md"
        variant="outline"
        className="p-4"
      >
        <VStack space="sm">
          <HStack className="justify-between items-start">
            <VStack className="flex-1">
              <Heading size="md">{series.name}</Heading>
              {series.description && (
                <Text size="sm" className="text-typography-500">
                  {series.description}
                </Text>
              )}
            </VStack>
            <Badge
              variant="solid"
              action={series.status === 'active' ? 'success' : 'muted'}
            >
              <BadgeText>{series.status === 'active' ? 'Active' : 'Completed'}</BadgeText>
            </Badge>
          </HStack>

          <HStack space="md" className="flex-wrap">
            <Text size="sm" className="text-typography-600">
              {series.matchCount} {series.matchCount === 1 ? 'match' : 'matches'}
            </Text>
            <Text size="sm" className="text-typography-600">
              {series.playerCount} {series.playerCount === 1 ? 'player' : 'players'}
            </Text>
            <Text size="sm" className="text-typography-500 capitalize">
              {series.gameType}
            </Text>
          </HStack>

          <Text size="xs" className="text-typography-400">
            Started {new Date(series.startDate).toLocaleDateString()}
          </Text>
        </VStack>
      </Card>
    </CardWrapper>
  );
}
