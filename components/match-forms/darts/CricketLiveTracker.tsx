import React, { useState, useEffect } from 'react';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Pressable } from '@/components/ui/pressable';
import { Box } from '@/components/ui/box';
import { Badge, BadgeText } from '@/components/ui/badge';
import {
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionTrigger,
  AccordionTitleText,
  AccordionIcon,
  AccordionContent,
} from '@/components/ui/accordion';
import { ChevronDownIcon, ChevronUpIcon, Calculator } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import {
  CricketNumber,
  CricketPlayerState,
  CricketRound,
  DartsCricketType,
  DartsCricketGameDataEnhanced,
} from '@/types/games';
import { ParticipantInfo } from '../types';
import { Alert } from 'react-native';

interface CricketLiveTrackerProps {
  participants: ParticipantInfo[];
  cricketType: DartsCricketType;
  onDataChange: (data: DartsCricketGameDataEnhanced) => void;
  onWinnersChange?: (winnerPlayerIds: number[]) => void;
}

const cricketNumbers: CricketNumber[] = [20, 19, 18, 17, 16, 15, 'bull'];

export function CricketLiveTracker({
  participants,
  cricketType,
  onDataChange,
  onWinnersChange,
}: CricketLiveTrackerProps) {
  // Initialize player states
  const [playerStates, setPlayerStates] = useState<CricketPlayerState[]>(
    participants.map(() => ({
      hits: {
        20: 0,
        19: 0,
        18: 0,
        17: 0,
        16: 0,
        15: 0,
        bull: 0,
      },
      score: 0,
      openNumbers: [],
    }))
  );

  const [rounds, setRounds] = useState<CricketRound[]>([]);
  const [accordionValue, setAccordionValue] = useState<string[]>([]);

  // Update parent with data
  useEffect(() => {
    const finalScores = playerStates.map(ps => ps.score);

    onDataChange({
      cricketType,
      trackingMode: 'live',
      rounds,
      playerStates,
      points: finalScores,
    });

    // Auto-determine winners when all numbers are closed
    checkForWinner();
  }, [playerStates, rounds]);

  const checkForWinner = () => {
    // Check if any player has opened all numbers
    const playersWithAllNumbersOpen = playerStates.map((ps, idx) => ({
      playerIndex: idx,
      hasAllNumbersOpen: cricketNumbers.every(num => ps.hits[num] >= 3),
      score: ps.score,
    })).filter(p => p.hasAllNumbersOpen);

    // Game ends when at least one player has opened all numbers AND has the winning score
    if (playersWithAllNumbersOpen.length > 0 && onWinnersChange) {
      let winnerIndices: number[] = [];

      if (cricketType === 'standard') {
        // Standard: Must have all numbers open AND highest score
        const maxScore = Math.max(...playersWithAllNumbersOpen.map(p => p.score));
        const overallMaxScore = Math.max(...playerStates.map(ps => ps.score));

        // Winner if: they have equal or more points than anyone
        if (maxScore >= overallMaxScore) {
          winnerIndices = playersWithAllNumbersOpen
            .filter(p => p.score === maxScore)
            .map(p => p.playerIndex);
        } else {
          // Game continues - player with all numbers needs to score more points
          return;
        }
      } else {
        // Cut-throat: Must have all numbers open AND lowest score
        const minScore = Math.min(...playersWithAllNumbersOpen.map(p => p.score));
        const overallMinScore = Math.min(...playerStates.map(ps => ps.score));

        // Winner if: they have equal or fewer points than anyone
        if (minScore <= overallMinScore) {
          winnerIndices = playersWithAllNumbersOpen
            .filter(p => p.score === minScore)
            .map(p => p.playerIndex);
        } else {
          // Game continues - player with all numbers needs to let others score more
          return;
        }
      }

      if (winnerIndices.length > 0) {
        const winnerPlayerIds = winnerIndices.map(idx => participants[idx].playerId);
        onWinnersChange(winnerPlayerIds);
      }
    }
  };

  const handleHit = (playerIndex: number, targetNumber: CricketNumber, hitCount: number) => {
    setPlayerStates(prevStates => {
      const newStates = [...prevStates];
      const playerState = { ...newStates[playerIndex] };

      // Add hits
      const currentHits = playerState.hits[targetNumber];
      const newHits = currentHits + hitCount;
      playerState.hits = { ...playerState.hits, [targetNumber]: newHits };

      // Update open numbers
      if (newHits >= 3 && !playerState.openNumbers.includes(targetNumber)) {
        playerState.openNumbers = [...playerState.openNumbers, targetNumber];
      }

      // Calculate points scored (only if number is open for this player)
      let pointsScored = 0;
      if (currentHits >= 3) {
        // Number was already open before this hit, so award points for the new hits
        // Check if all opponents have NOT opened this number
        const allOpponentsHaventOpened = newStates.every((state, idx) => {
          if (idx === playerIndex) return true; // Skip self
          return state.hits[targetNumber] < 3;
        });

        if (allOpponentsHaventOpened) {
          // Calculate points for the hits added in THIS round only
          const numberValue = targetNumber === 'bull' ? 25 : targetNumber;
          pointsScored = hitCount * numberValue;

          if (cricketType === 'standard') {
            // Standard: add points to this player
            playerState.score += pointsScored;
          } else {
            // Cut-throat: add points to all opponents
            newStates.forEach((state, idx) => {
              if (idx !== playerIndex) {
                state.score += pointsScored;
              }
            });
          }
        }
      }

      newStates[playerIndex] = playerState;

      // Record the round
      const newRound: CricketRound = {
        playerIndex,
        targetNumber,
        hitCount,
        pointsScored,
        timestamp: Date.now(),
      };
      setRounds(prev => [...prev, newRound]);

      return newStates;
    });
  };

  const handleUndoLastRound = () => {
    if (rounds.length === 0) return;

    Alert.alert(
      'Undo Last Round',
      'Remove the last recorded hit?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Undo',
          style: 'destructive',
          onPress: () => {
            // Remove last round and recalculate states from scratch
            const newRounds = rounds.slice(0, -1);
            setRounds(newRounds);

            // Rebuild player states from rounds
            const freshStates: CricketPlayerState[] = participants.map(() => ({
              hits: {
                20: 0,
                19: 0,
                18: 0,
                17: 0,
                16: 0,
                15: 0,
                bull: 0,
              },
              score: 0,
              openNumbers: [],
            }));

            // Replay all rounds except the last one
            newRounds.forEach(round => {
              const playerState = freshStates[round.playerIndex];
              playerState.hits[round.targetNumber] += round.hitCount;

              if (playerState.hits[round.targetNumber] >= 3 && !playerState.openNumbers.includes(round.targetNumber)) {
                playerState.openNumbers.push(round.targetNumber);
              }

              if (cricketType === 'standard') {
                playerState.score += round.pointsScored;
              } else {
                // Cut-throat: distribute points to opponents
                if (round.pointsScored > 0) {
                  freshStates.forEach((state, idx) => {
                    if (idx !== round.playerIndex) {
                      state.score += round.pointsScored;
                    }
                  });
                }
              }
            });

            setPlayerStates(freshStates);
          },
        },
      ]
    );
  };

  const renderCricketSymbol = (hits: number, isClosedForAll: boolean): string => {
    if (isClosedForAll) {
      return '—'; // Dash for closed numbers
    }
    switch (hits) {
      case 1: return '/';
      case 2: return 'X';
      case 3: return '⊗';
      default: return hits > 3 ? `⊗+${hits - 3}` : '';
    }
  };

  const isNumberClosedForAll = (num: CricketNumber): boolean => {
    return playerStates.every(ps => ps.hits[num] >= 3);
  };

  // Check if there's a winner
  const getWinner = (): number | null => {
    const playersWithAllNumbersOpen = playerStates.map((ps, idx) => ({
      playerIndex: idx,
      hasAllNumbersOpen: cricketNumbers.every(num => ps.hits[num] >= 3),
      score: ps.score,
    })).filter(p => p.hasAllNumbersOpen);

    if (playersWithAllNumbersOpen.length === 0) return null;

    if (cricketType === 'standard') {
      // Standard: Must have all numbers open AND highest score
      const maxScore = Math.max(...playersWithAllNumbersOpen.map(p => p.score));
      const overallMaxScore = Math.max(...playerStates.map(ps => ps.score));
      if (maxScore >= overallMaxScore) {
        // Winner has all numbers open and equal or more points than anyone
        const winners = playersWithAllNumbersOpen.filter(p => p.score === maxScore);
        return winners.length === 1 ? winners[0].playerIndex : null;
      }
    } else {
      // Cut-throat: Must have all numbers open AND lowest score
      const minScore = Math.min(...playersWithAllNumbersOpen.map(p => p.score));
      const overallMinScore = Math.min(...playerStates.map(ps => ps.score));
      if (minScore <= overallMinScore) {
        // Winner has all numbers open and equal or fewer points than anyone
        const winners = playersWithAllNumbersOpen.filter(p => p.score === minScore);
        return winners.length === 1 ? winners[0].playerIndex : null;
      }
    }
    return null;
  };

  const winnerIndex = getWinner();
  const hasWinner = winnerIndex !== null;

  return (
    <VStack space="lg">
      {/* Scorecard Table */}
      <VStack space="sm">
        <Heading size="sm">Cricket Scorecard</Heading>
        <Text size="xs" className="text-typography-500">
          Tap a cell to add hits for that player/number
        </Text>

        <Card variant="outline" className="p-0 overflow-hidden">
          <VStack>
            {/* Header Row */}
            <HStack className="bg-background-50 border-b border-outline-200">
              <Box style={{ width: 60 }} className="p-2 items-center justify-center">
                <Text className="font-bold" size="sm">#</Text>
              </Box>
              {participants.map(p => (
                <Box
                  key={p.playerId}
                  className="flex-1 p-2 items-center justify-center border-l border-outline-200"
                >
                  <Text numberOfLines={1} className="font-semibold" size="sm">
                    {p.firstName}
                  </Text>
                </Box>
              ))}
            </HStack>

            {/* Number Rows */}
            {cricketNumbers.map(num => (
              <HStack key={num} className="border-b border-outline-200">
                <Box style={{ width: 60 }} className="p-3 items-center justify-center bg-background-50">
                  <Text className="font-bold text-lg">
                    {num === 'bull' ? 'B' : num}
                  </Text>
                </Box>
                {participants.map((p, idx) => {
                  const hits = playerStates[idx]?.hits[num] || 0;
                  const isOpen = playerStates[idx]?.openNumbers.includes(num);
                  const isClosed = isNumberClosedForAll(num);

                  return (
                    <Pressable
                      key={p.playerId}
                      onPress={() => {
                        // If number is already open for this player, ask for multiplier
                        if (isOpen) {
                          // Bull can only be single or double (no triple)
                          const options = num === 'bull'
                            ? [
                                {
                                  text: 'Single (x1)',
                                  onPress: () => handleHit(idx, num, 1),
                                },
                                {
                                  text: 'Double (x2)',
                                  onPress: () => handleHit(idx, num, 2),
                                },
                                {
                                  text: 'Cancel',
                                  style: 'cancel' as const,
                                },
                              ]
                            : [
                                {
                                  text: 'Single (x1)',
                                  onPress: () => handleHit(idx, num, 1),
                                },
                                {
                                  text: 'Double (x2)',
                                  onPress: () => handleHit(idx, num, 2),
                                },
                                {
                                  text: 'Triple (x3)',
                                  onPress: () => handleHit(idx, num, 3),
                                },
                                {
                                  text: 'Cancel',
                                  style: 'cancel' as const,
                                },
                              ];

                          Alert.alert(
                            'Select Hit Type',
                            `How many ${num === 'bull' ? 'Bulls' : num + 's'} did ${p.firstName} hit?`,
                            options
                          );
                        } else {
                          // Otherwise, add 1 hit
                          handleHit(idx, num, 1);
                        }
                      }}
                      disabled={isClosed || hasWinner}
                      className="flex-1 border-l border-outline-200"
                    >
                      <Box
                        className={`p-3 items-center justify-center min-h-[50px] ${
                          isClosed ? 'bg-background-200' : ''
                        }`}
                      >
                        <Text
                          className={`text-2xl ${
                            isClosed
                              ? 'text-typography-400'
                              : isOpen
                                ? 'text-success-600 font-bold'
                                : 'text-typography-700'
                          }`}
                        >
                          {renderCricketSymbol(hits, isClosed)}
                        </Text>
                      </Box>
                    </Pressable>
                  );
                })}
              </HStack>
            ))}

            {/* Score Row */}
            <HStack className="bg-primary-50">
              <Box style={{ width: 60 }} className="p-3 items-center justify-center">
                <Icon as={Calculator} size="lg" className="text-typography-700" />
              </Box>
              {participants.map((p, idx) => (
                <Box
                  key={p.playerId}
                  className="flex-1 p-3 items-center justify-center border-l border-outline-200"
                >
                  <HStack space="xs" className="items-center">
                    <Text className="font-bold text-xl text-primary-600">
                      {playerStates[idx]?.score || 0}
                    </Text>
                    {hasWinner && winnerIndex === idx && (
                      <Badge size="sm" action="success">
                        <BadgeText>W</BadgeText>
                      </Badge>
                    )}
                  </HStack>
                </Box>
              ))}
            </HStack>
          </VStack>
        </Card>

        <Text size="xs" className="text-typography-400 italic">
          / = 1 hit | X = 2 hits | ⊗ = 3 hits (open) | ⊗+N = scoring | — = closed
        </Text>
      </VStack>

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
                  <Card key={rounds.length - idx - 1} size="sm" variant="outline" className="p-2">
                    <HStack className="justify-between items-center">
                      <VStack className="flex-1">
                        <Text size="sm">
                          {participants[round.playerIndex].firstName}: {round.targetNumber === 'bull' ? 'Bull' : round.targetNumber} ({round.hitCount} {round.hitCount === 1 ? 'hit' : 'hits'})
                        </Text>
                        {round.pointsScored > 0 && (
                          <Text size="xs" className="text-success-600">
                            +{round.pointsScored} points
                          </Text>
                        )}
                      </VStack>
                      <Text size="xs" className="text-typography-400">
                        Round {rounds.length - idx}
                      </Text>
                    </HStack>
                  </Card>
                ))}
                <Button
                  size="sm"
                  variant="outline"
                  action="negative"
                  onPress={handleUndoLastRound}
                >
                  <ButtonText>Undo Last Round</ButtonText>
                </Button>
              </VStack>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}

      {/* Game Complete Card */}
      {hasWinner && winnerIndex !== null && (
        <Card variant="outline" className="p-4 bg-success-50">
          <VStack space="sm" className="items-center">
            <Heading size="md" className="text-success-600">
              Game Complete!
            </Heading>
            <Text className="text-center">
              {participants[winnerIndex]?.firstName} wins!
            </Text>
            <Text size="sm" className="text-center text-typography-600">
              All numbers opened with {cricketType === 'standard' ? 'highest' : 'lowest'} score
            </Text>
          </VStack>
        </Card>
      )}
    </VStack>
  );
}
