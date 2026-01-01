import React, { useState, useEffect } from 'react';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input, InputField } from '@/components/ui/input';
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
import { Pressable } from '@/components/ui/pressable';

type DartEntry = {
  number: number;      // 0-20 or 25 for bull
  multiplier: number;  // 1, 2, or 3
  points: number;      // number * multiplier
};

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

  // Dart entry state
  const [currentDarts, setCurrentDarts] = useState<DartEntry[]>([]);
  const [currentDartIndex, setCurrentDartIndex] = useState(0);

  // Input mode: 'dart-by-dart' or 'round-total'
  const [inputMode, setInputMode] = useState<'dart-by-dart' | 'round-total'>('dart-by-dart');
  const [roundTotalInput, setRoundTotalInput] = useState('');

  // Clear input state when switching modes
  useEffect(() => {
    setCurrentDarts([]);
    setCurrentDartIndex(0);
    setRoundTotalInput('');
  }, [inputMode]);

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

  const handleNumberTap = (number: number) => {
    if (hasWinner) return;

    // Special handling for 0 (Miss) - no multipliers needed
    if (number === 0) {
      handleMultiplierSelect(0, 1);
      return;
    }

    // Special handling for Bull
    const isBull = number === 25;

    const multiplierOptions = isBull
      ? [
          {
            text: 'Single Bull (25 points)',
            onPress: () => handleMultiplierSelect(number, 1),
          },
          {
            text: 'Double Bull (50 points)',
            onPress: () => handleMultiplierSelect(number, 2),
          },
          {
            text: 'Cancel',
            style: 'cancel' as const,
          },
        ]
      : [
          {
            text: `Single (${number} points)`,
            onPress: () => handleMultiplierSelect(number, 1),
          },
          {
            text: `Double (${number * 2} points)`,
            onPress: () => handleMultiplierSelect(number, 2),
          },
          {
            text: `Triple (${number * 3} points)`,
            onPress: () => handleMultiplierSelect(number, 3),
          },
          {
            text: 'Cancel',
            style: 'cancel' as const,
          },
        ];

    Alert.alert(
      'Select Dart Type',
      `Dart ${currentDartIndex + 1} for ${participants[activePlayerIndex].firstName}`,
      multiplierOptions
    );
  };

  const handleMultiplierSelect = (number: number, multiplier: number) => {
    const points = number * multiplier;

    const newDart: DartEntry = {
      number,
      multiplier,
      points,
    };

    const updatedDarts = [...currentDarts, newDart];
    setCurrentDarts(updatedDarts);
    setCurrentDartIndex(currentDartIndex + 1);

    // Calculate running total
    const totalPoints = updatedDarts.reduce((sum, d) => sum + d.points, 0);
    const currentRemaining = currentScores[activePlayerIndex];
    const newRemaining = currentRemaining - totalPoints;

    // Check for checkout (exact 0)
    if (newRemaining === 0) {
      // Checkout! Record round immediately
      recordRoundFromDarts(updatedDarts, true, false);
      return;
    }

    // Check for bust (over)
    if (newRemaining < 0) {
      // Bust! Record round immediately
      Alert.alert(
        'Bust!',
        `Total (${totalPoints}) exceeds remaining score (${currentRemaining}). Turn ends.`,
        [
          {
            text: 'OK',
            onPress: () => recordRoundFromDarts(updatedDarts, false, true),
          },
        ]
      );
      return;
    }

    // If 3 darts entered, auto-record
    if (updatedDarts.length === 3) {
      recordRoundFromDarts(updatedDarts, false, false);
    }
  };

  const recordRoundFromDarts = (
    darts: DartEntry[],
    isCheckout: boolean,
    isBust: boolean
  ) => {
    const totalScore = darts.reduce((sum, d) => sum + d.points, 0);
    const currentRemaining = currentScores[activePlayerIndex];

    // Calculate new remaining score
    const newRemaining = isBust ? currentRemaining : currentRemaining - totalScore;

    const newRound: X01Round = {
      playerIndex: activePlayerIndex,
      score: isBust ? 0 : totalScore,
      remainingScore: newRemaining,
      darts: darts.map(d => d.points), // Store individual dart points
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

    // Reset dart entry
    setCurrentDarts([]);
    setCurrentDartIndex(0);

    // Move to next player (unless checkout)
    if (!isCheckout) {
      const nextPlayer = (activePlayerIndex + 1) % participants.length;
      setActivePlayerIndex(nextPlayer);
    }
  };

  const handleRecordRoundTotal = () => {
    const score = parseInt(roundTotalInput) || 0;

    if (score === 0) {
      Alert.alert('Invalid Score', 'Please enter a score greater than 0');
      return;
    }

    const currentRemaining = currentScores[activePlayerIndex];

    // Check if player busted (scored more than remaining)
    const isBust = score > currentRemaining;

    // Calculate new remaining score
    const newRemaining = isBust ? currentRemaining : currentRemaining - score;

    // Check for valid checkout (must finish on exactly 0, can't bust on checkout)
    const isCheckout = !isBust && newRemaining === 0;

    const newRound: X01Round = {
      playerIndex: activePlayerIndex,
      score: isBust ? 0 : score,
      remainingScore: newRemaining,
      darts: [], // No individual dart tracking in round total mode
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

    // Reset input
    setRoundTotalInput('');

    // Move to next player (unless checkout)
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

            {/* Input Mode Tabs */}
            <HStack space="xs">
              <Button
                size="sm"
                action={inputMode === 'dart-by-dart' ? 'primary' : 'secondary'}
                variant={inputMode === 'dart-by-dart' ? 'solid' : 'outline'}
                onPress={() => setInputMode('dart-by-dart')}
                className="flex-1"
              >
                <ButtonText>Dart by Dart</ButtonText>
              </Button>
              <Button
                size="sm"
                action={inputMode === 'round-total' ? 'primary' : 'secondary'}
                variant={inputMode === 'round-total' ? 'solid' : 'outline'}
                onPress={() => setInputMode('round-total')}
                className="flex-1"
              >
                <ButtonText>Round Total</ButtonText>
              </Button>
            </HStack>

            {/* Dart by Dart Mode */}
            {inputMode === 'dart-by-dart' && (
              <>
                {/* Dart Status Bar */}
                <VStack space="xs">
              <Text size="sm" className="text-typography-600">
                Darts Entered ({currentDarts.length}/3)
              </Text>
              <HStack space="sm" className="flex-wrap">
                {currentDarts.map((dart, idx) => (
                  <Badge
                    key={idx}
                    size="md"
                    action={dart.points === 0 ? "muted" : "info"}
                  >
                    <BadgeText>
                      Dart {idx + 1}: {dart.points === 0
                        ? 'Miss'
                        : dart.number === 25
                          ? `${dart.multiplier === 2 ? 'D' : 'S'}Bull (${dart.points})`
                          : `${dart.multiplier === 3 ? 'T' : dart.multiplier === 2 ? 'D' : 'S'}${dart.number} (${dart.points})`
                      }
                    </BadgeText>
                  </Badge>
                ))}
                {currentDarts.length === 0 && (
                  <Text size="sm" className="text-typography-400 italic">
                    Tap a number to enter Dart 1
                  </Text>
                )}
              </HStack>
              {currentDarts.length > 0 && (
                <HStack className="items-center" space="xs">
                  <Text size="sm" className="font-semibold">
                    Round Total: {currentDarts.reduce((sum, d) => sum + d.points, 0)}
                  </Text>
                  <Text size="sm" className="text-typography-500">
                    | Remaining: {currentScores[activePlayerIndex] - currentDarts.reduce((sum, d) => sum + d.points, 0)}
                  </Text>
                </HStack>
              )}
            </VStack>

            {/* Number Selection Grid */}
            <VStack space="xs">
              <Text size="sm" className="text-typography-600 font-semibold">
                {currentDarts.length < 3 ? `Select number for Dart ${currentDartIndex + 1}` : 'All darts entered'}
              </Text>

              {/* Row 1: 20-16 */}
              <HStack space="xs">
                {[20, 19, 18, 17, 16].map(num => (
                  <Pressable
                    key={num}
                    onPress={() => handleNumberTap(num)}
                    disabled={currentDarts.length >= 3}
                    className={`flex-1 p-4 rounded-lg items-center justify-center border-2 ${
                      currentDarts.length >= 3
                        ? 'bg-background-200 border-outline-200'
                        : 'bg-background-0 border-primary-500'
                    }`}
                  >
                    <Text
                      size="lg"
                      className={`font-bold ${
                        currentDarts.length >= 3
                          ? 'text-typography-400'
                          : 'text-primary-600'
                      }`}
                    >
                      {num}
                    </Text>
                  </Pressable>
                ))}
              </HStack>

              {/* Row 2: 15-11 */}
              <HStack space="xs">
                {[15, 14, 13, 12, 11].map(num => (
                  <Pressable
                    key={num}
                    onPress={() => handleNumberTap(num)}
                    disabled={currentDarts.length >= 3}
                    className={`flex-1 p-4 rounded-lg items-center justify-center border-2 ${
                      currentDarts.length >= 3
                        ? 'bg-background-200 border-outline-200'
                        : 'bg-background-0 border-primary-500'
                    }`}
                  >
                    <Text
                      size="lg"
                      className={`font-bold ${
                        currentDarts.length >= 3
                          ? 'text-typography-400'
                          : 'text-primary-600'
                      }`}
                    >
                      {num}
                    </Text>
                  </Pressable>
                ))}
              </HStack>

              {/* Row 3: 10-6 */}
              <HStack space="xs">
                {[10, 9, 8, 7, 6].map(num => (
                  <Pressable
                    key={num}
                    onPress={() => handleNumberTap(num)}
                    disabled={currentDarts.length >= 3}
                    className={`flex-1 p-4 rounded-lg items-center justify-center border-2 ${
                      currentDarts.length >= 3
                        ? 'bg-background-200 border-outline-200'
                        : 'bg-background-0 border-primary-500'
                    }`}
                  >
                    <Text
                      size="lg"
                      className={`font-bold ${
                        currentDarts.length >= 3
                          ? 'text-typography-400'
                          : 'text-primary-600'
                      }`}
                    >
                      {num}
                    </Text>
                  </Pressable>
                ))}
              </HStack>

              {/* Row 4: 5-0 */}
              <HStack space="xs">
                {[5, 4, 3, 2, 1, 0].map(num => (
                  <Pressable
                    key={num}
                    onPress={() => handleNumberTap(num)}
                    disabled={currentDarts.length >= 3}
                    className={`flex-1 p-4 rounded-lg items-center justify-center border-2 ${
                      currentDarts.length >= 3
                        ? 'bg-background-200 border-outline-200'
                        : 'bg-background-0 border-primary-500'
                    }`}
                  >
                    <Text
                      size="lg"
                      className={`font-bold ${
                        currentDarts.length >= 3
                          ? 'text-typography-400'
                          : 'text-primary-600'
                      }`}
                    >
                      {num}
                    </Text>
                  </Pressable>
                ))}
              </HStack>

              {/* Row 5: Bull */}
              <HStack className="justify-center">
                <Pressable
                  onPress={() => handleNumberTap(25)}
                  disabled={currentDarts.length >= 3}
                  className={`p-4 rounded-lg items-center justify-center border-2 ${
                    currentDarts.length >= 3
                      ? 'bg-background-200 border-outline-200'
                      : 'bg-error-500 border-error-600'
                  }`}
                  style={{ width: '33%' }}
                >
                  <Text
                    size="lg"
                    className={`font-bold ${
                      currentDarts.length >= 3
                        ? 'text-typography-400'
                        : 'text-typography-0'
                    }`}
                  >
                    BULL
                  </Text>
                </Pressable>
              </HStack>
            </VStack>

            {/* Reset Turn Button (optional - for mistakes) */}
            {currentDarts.length > 0 && currentDarts.length < 3 && (
              <Button
                action="secondary"
                variant="outline"
                size="sm"
                onPress={() => {
                  Alert.alert(
                    'Reset Turn?',
                    'Clear all darts entered for this turn?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Reset',
                        style: 'destructive',
                        onPress: () => {
                          setCurrentDarts([]);
                          setCurrentDartIndex(0);
                        },
                      },
                    ]
                  );
                }}
              >
                <ButtonText>Reset Turn</ButtonText>
              </Button>
            )}
              </>
            )}

            {/* Round Total Mode */}
            {inputMode === 'round-total' && (
              <VStack space="md">
                <Text size="sm" className="text-typography-600">
                  Enter the total score for this round
                </Text>
                <Input variant="outline" size="lg">
                  <InputField
                    keyboardType="number-pad"
                    value={roundTotalInput}
                    onChangeText={setRoundTotalInput}
                    placeholder="Total score"
                  />
                </Input>
                <HStack className="items-center" space="xs">
                  <Text size="sm" className="text-typography-500">
                    Remaining: {currentScores[activePlayerIndex]}
                  </Text>
                </HStack>
                <Button
                  action="primary"
                  size="lg"
                  onPress={handleRecordRoundTotal}
                  isDisabled={!roundTotalInput || parseInt(roundTotalInput) === 0}
                >
                  <ButtonText>Record Round</ButtonText>
                </Button>
              </VStack>
            )}
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
