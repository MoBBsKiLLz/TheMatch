import React from 'react';
import { Card } from '@/components/ui/card';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { Badge, BadgeText } from '@/components/ui/badge';
import { MatchWithDetails } from '@/types/match';

interface MatchCardProps {
  match: MatchWithDetails;
  onPress?: () => void;
  showActions?: boolean;
  onDelete?: () => void;
}

const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const getMatchResult = (match: MatchWithDetails) => {
  const winners = match.participants.filter((p) => p.isWinner);

  if (winners.length === 0) {
    return 'No winner recorded';
  }

  if (winners.length === 1) {
    const winner = winners[0];
    return `${winner.firstName} ${winner.lastName} won`;
  }

  return `${winners.map((w) => `${w.firstName} ${w.lastName}`).join(', ')} won`;
};

export function MatchCard({ match, onPress, showActions = true, onDelete }: MatchCardProps) {
  return (
    <Card
      size="md"
      variant="elevated"
      className="p-4 border border-neutral-400"
    >
      <VStack space="md">
        {/* League and Status Badges */}
        <HStack space="sm" className="flex-wrap">
          <Badge size="sm" variant="solid" action={match.leagueName ? 'info' : 'muted'}>
            <BadgeText>{match.leagueName || 'Standalone'}</BadgeText>
          </Badge>
          <Badge size="sm" variant="solid" action="info">
            <BadgeText>
              {match.gameType === 'custom' && match.customGameName
                ? match.customGameName
                : match.gameType}
            </BadgeText>
          </Badge>
          {match.status === 'in_progress' && (
            <Badge size="sm" variant="solid" action="warning">
              <BadgeText>In Progress</BadgeText>
            </Badge>
          )}
        </HStack>

        {/* Participants */}
        <VStack space="xs">
          {match.participants.map((participant, index) => (
            <React.Fragment key={participant.id}>
              {index > 0 && (
                <Text
                  size="sm"
                  className="text-typography-500 text-center"
                >
                  vs
                </Text>
              )}
              <HStack className="justify-between items-center">
                <Text
                  className={`text-typography-900 font-medium ${
                    participant.isWinner ? 'text-success-600' : ''
                  }`}
                >
                  {participant.firstName} {participant.lastName}
                  {participant.isWinner && ' ✓'}
                </Text>
                {participant.score !== null && (
                  <Text
                    className={`text-typography-700 font-semibold ${
                      participant.isWinner ? 'text-success-600' : ''
                    }`}
                  >
                    {participant.score}
                  </Text>
                )}
              </HStack>
            </React.Fragment>
          ))}
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
        {showActions && (
          <VStack>
            {onPress && (
              <Button
                size="md"
                action="primary"
                onPress={onPress}
              >
                <ButtonText>
                  {match.status === 'in_progress' ? 'Continue Match' : 'View Match'}
                </ButtonText>
              </Button>
            )}
            {onDelete && (
              <Button
                size="sm"
                variant="link"
                action="negative"
                onPress={onDelete}
              >
                <ButtonText>Delete Match</ButtonText>
              </Button>
            )}
          </VStack>
        )}
      </VStack>
    </Card>
  );
}
