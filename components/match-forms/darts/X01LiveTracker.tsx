import React, { useState, useEffect } from 'react';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input, InputField } from '@/components/ui/input';
import {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
} from '@/components/ui/form-control';
import {
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionTrigger,
  AccordionTitleText,
  AccordionIcon,
  AccordionContent,
} from '@/components/ui/accordion';
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react-native';
import { Badge, BadgeText } from '@/components/ui/badge';
import {
  X01Round,
  DartsX01GameDataEnhanced,
} from '@/types/games';
import { ParticipantInfo } from '../types';
import { Alert } from 'react-native';

interface X01LiveTrackerProps {
  participants: ParticipantInfo[];
  startingScore: number;
  onDataChange: (data: DartsX01GameDataEnhanced) => void;
  onWinnersChange?: (winnerPlayerIds: number[]) => void;
}

export function X01LiveTracker({
  participants,
  startingScore,
  onDataChange,
  onWinnersChange,
}: X01LiveTrackerProps) {
  const [currentScores, setCurrentScores] = useState<number[]>(
    participants.map(() => startingScore)
  );
  const [rounds, setRounds] = useState<X01Round[]>([]);
  const [activePlayerIndex, setActivePlayerIndex] = useState(0);
  const [accordionValue, setAccordionValue] = useState<string[]>([]);

  // Current round entry
  const [roundScore, setRoundScore] = useState('');
  const [dart1, setDart1] = useState('');
  const [dart2, setDart2] = useState('');
  const [dart3, setDart3] = useState('');

  // Update parent with data
  useEffect(() => {
    onDataChange({
      startingScore,
      trackingMode: 'live',
      rounds,
      currentScores,
      scores: currentScores,
      finalCheckout: rounds.find(r => r.isCheckout)?.score,
    });

    // Auto-determine winner if someone has checked out
    const winnerIndex = currentScores.findIndex(score => score === 0);
    if (winnerIndex !== -1 && onWinnersChange) {
      onWinnersChange([participants[winnerIndex].playerId]);
    }
  }, [currentScores, rounds]);

  // Auto-calculate round score from darts
  useEffect(() => {
    const d1 = parseInt(dart1) || 0;
    const d2 = parseInt(dart2) || 0;
    const d3 = parseInt(dart3) || 0;
    const total = d1 + d2 + d3;
    if (total > 0) {
      setRoundScore(String(total));
    }
  }, [dart1, dart2, dart3]);

  const handleRecordRound = () => {
    const score = parseInt(roundScore) || 0;

    if (score === 0) {
      Alert.alert('Invalid Score', 'Please enter a score greater than 0');
      return;
    }

    const currentRemaining = currentScores[activePlayerIndex];

    // Check if player busted (scored more than remaining)
    const isBust = score > currentRemaining;

    // Calculate new remaining score
    // If bust, score stays the same. Otherwise, subtract the score.
    const newRemaining = isBust ? currentRemaining : currentRemaining - score;

    // Check for valid checkout (must finish on exactly 0, can't bust on checkout)
    const isCheckout = !isBust && newRemaining === 0;

    // Collect dart values
    const darts: number[] = [];
    if (dart1) darts.push(parseInt(dart1) || 0);
    if (dart2) darts.push(parseInt(dart2) || 0);
    if (dart3) darts.push(parseInt(dart3) || 0);

    const newRound: X01Round = {
      playerIndex: activePlayerIndex,
      score: isBust ? 0 : score, // Record 0 score if bust
      remainingScore: newRemaining,
      darts: darts.length > 0 ? darts : [],
      isCheckout,
      isBust,
      timestamp: Date.now(),
    };

    // Update scores
    const newScores = [...currentScores];
    newScores[activePlayerIndex] = newRemaining;
    setCurrentScores(newScores);

    // Add round
    setRounds(prev => [...prev, newRound]);

    // Reset inputs
    setRoundScore('');
    setDart1('');
    setDart2('');
    setDart3('');

    // Move to next player (unless someone won)
    if (!isCheckout) {
      const nextPlayer = (activePlayerIndex + 1) % participants.length;
      setActivePlayerIndex(nextPlayer);
    }
  };

  const handleUndoLastRound = () => {
    if (rounds.length === 0) return;

    Alert.alert(
      'Undo Last Round',
      'Remove the last recorded round?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Undo',
          style: 'destructive',
          onPress: () => {
            const lastRound = rounds[rounds.length - 1];

            // Restore score for that player
            // If it was a bust, the score didn't change, so just restore it
            // If it wasn't a bust, add back the scored points
            const newScores = [...currentScores];
            if (lastRound.isBust) {
              // Bust rounds don't change the score, so nothing to restore
              // Score is already at remainingScore
              newScores[lastRound.playerIndex] = lastRound.remainingScore;
            } else {
              // Normal round: add back the scored points
              newScores[lastRound.playerIndex] = lastRound.remainingScore + lastRound.score;
            }
            setCurrentScores(newScores);

            // Remove last round
            setRounds(prev => prev.slice(0, -1));

            // Set active player to the one who just had their round removed
            setActivePlayerIndex(lastRound.playerIndex);
          },
        },
      ]
    );
  };

  const hasWinner = currentScores.some(score => score === 0);

  return (
    <VStack space="lg">
      {/* Current Scores Display */}
      <VStack space="md">
        <Heading size="sm">Current Scores</Heading>
        <HStack className="justify-around flex-wrap">
          {participants.map((p, idx) => (
            <VStack
              key={p.playerId}
              className={`items-center min-w-[80px] p-3 rounded-lg ${
                idx === activePlayerIndex && !hasWinner
                  ? 'bg-primary-50 border-2 border-primary-500'
                  : 'bg-background-50'
              }`}
            >
              <Text className={`font-semibold ${idx === activePlayerIndex ? 'text-primary-600' : ''}`}>
                {p.firstName}
              </Text>
              <Text
                size="3xl"
                className={`font-bold ${
                  currentScores[idx] === 0
                    ? 'text-success-600'
                    : idx === activePlayerIndex
                    ? 'text-primary-600'
                    : 'text-typography-700'
                }`}
              >
                {currentScores[idx]}
              </Text>
              {currentScores[idx] === 0 && (
                <Badge size="sm" action="success">
                  <BadgeText>Winner!</BadgeText>
                </Badge>
              )}
            </VStack>
          ))}
        </HStack>
      </VStack>

      {/* Active Player Round Entry */}
      {!hasWinner && (
        <Card variant="outline" className="p-4 bg-primary-50">
          <VStack space="md">
            <Heading size="sm">
              {participants[activePlayerIndex].firstName}'s Turn
            </Heading>

            {/* Round Score Entry */}
            <FormControl>
              <FormControlLabel>
                <FormControlLabelText>Round Score</FormControlLabelText>
              </FormControlLabel>
              <Input variant="outline" size="lg">
                <InputField
                  keyboardType="number-pad"
                  value={roundScore}
                  onChangeText={setRoundScore}
                  placeholder="Total score"
                />
              </Input>
            </FormControl>

            {/* Individual Dart Entry (Optional) */}
            <VStack space="xs">
              <Text size="sm" className="text-typography-600">
                Individual Darts (Optional)
              </Text>
              <HStack space="sm">
                <Input variant="outline" className="flex-1">
                  <InputField
                    keyboardType="number-pad"
                    value={dart1}
                    onChangeText={setDart1}
                    placeholder="Dart 1"
                  />
                </Input>
                <Input variant="outline" className="flex-1">
                  <InputField
                    keyboardType="number-pad"
                    value={dart2}
                    onChangeText={setDart2}
                    placeholder="Dart 2"
                  />
                </Input>
                <Input variant="outline" className="flex-1">
                  <InputField
                    keyboardType="number-pad"
                    value={dart3}
                    onChangeText={setDart3}
                    placeholder="Dart 3"
                  />
                </Input>
              </HStack>
            </VStack>

            <Button
              action="primary"
              size="lg"
              onPress={handleRecordRound}
              isDisabled={!roundScore || parseInt(roundScore) === 0}
            >
              <ButtonText>Record Round</ButtonText>
            </Button>
          </VStack>
        </Card>
      )}

      {/* Round History */}
      {rounds.length > 0 && (
        <Accordion
          type="multiple"
          value={accordionValue}
          onValueChange={setAccordionValue}
        >
          <AccordionItem value="rounds">
            <AccordionHeader>
              <AccordionTrigger>
                {({ isExpanded }: { isExpanded: boolean }) => (
                  <>
                    <AccordionTitleText>
                      Round History ({rounds.length} rounds)
                    </AccordionTitleText>
                    <AccordionIcon
                      as={isExpanded ? ChevronUpIcon : ChevronDownIcon}
                      className="ml-3"
                    />
                  </>
                )}
              </AccordionTrigger>
            </AccordionHeader>
            <AccordionContent>
              <VStack space="sm" className="pt-2">
                {rounds.slice().reverse().map((round, idx) => (
                  <Card
                    key={rounds.length - idx - 1}
                    size="sm"
                    variant="outline"
                    className={`p-3 ${round.isCheckout ? 'bg-success-50' : round.isBust ? 'bg-error-50' : ''}`}
                  >
                    <HStack className="justify-between items-center">
                      <VStack className="flex-1">
                        <HStack className="items-center" space="sm">
                          <Text className="font-semibold">
                            {participants[round.playerIndex].firstName}
                          </Text>
                          {round.isCheckout && (
                            <Badge size="sm" action="success">
                              <BadgeText>Checkout!</BadgeText>
                            </Badge>
                          )}
                          {round.isBust && (
                            <Badge size="sm" action="error">
                              <BadgeText>Bust!</BadgeText>
                            </Badge>
                          )}
                        </HStack>
                        <Text size="sm" className="text-typography-600">
                          {round.isBust ? 'Busted' : `Scored ${round.score}`} → {round.remainingScore}
                        </Text>
                        {round.darts.length > 0 && (
                          <Text size="xs" className="text-typography-500">
                            Darts: {round.darts.join(', ')}
                          </Text>
                        )}
                      </VStack>
                      <Text size="xs" className="text-typography-400">
                        Round {rounds.length - idx}
                      </Text>
                    </HStack>
                  </Card>
                ))}
                {!hasWinner && (
                  <Button
                    size="sm"
                    variant="outline"
                    action="negative"
                    onPress={handleUndoLastRound}
                  >
                    <ButtonText>Undo Last Round</ButtonText>
                  </Button>
                )}
              </VStack>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}

      {hasWinner && (
        <Card variant="outline" className="p-4 bg-success-50">
          <VStack space="sm" className="items-center">
            <Heading size="md" className="text-success-600">
              Game Complete!
            </Heading>
            <Text className="text-center">
              {participants[currentScores.findIndex(s => s === 0)]?.firstName} wins!
            </Text>
          </VStack>
        </Card>
      )}
    </VStack>
  );
}
