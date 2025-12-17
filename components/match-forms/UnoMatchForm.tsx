import React, { useState, useEffect } from 'react';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Divider } from '@/components/ui/divider';
import {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
} from '@/components/ui/form-control';
import { Input, InputField } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectInput,
  SelectIcon,
  SelectPortal,
  SelectBackdrop,
  SelectContent,
  SelectDragIndicatorWrapper,
  SelectDragIndicator,
  SelectItem,
} from '@/components/ui/select';
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
import { UnoGameData, UnoGame } from '@/types/games';
import { ParticipantInfo } from './types';

interface UnoMatchFormProps {
  participants: ParticipantInfo[];
  onDataChange: (data: UnoGameData) => void;
  onWinnersChange?: (winnerPlayerIds: number[]) => void;
  initialData?: UnoGameData;
}

export function UnoMatchForm({
  participants,
  onDataChange,
  onWinnersChange,
  initialData,
}: UnoMatchFormProps) {
  const [games, setGames] = useState<UnoGame[]>(initialData?.games || []);
  const [targetScore, setTargetScore] = useState(initialData?.targetScore || 500);
  const [accordionValue, setAccordionValue] = useState<string[]>([]);

  // Current game scores - points earned by winner from remaining cards
  const [currentGameScores, setCurrentGameScores] = useState<number[]>(
    participants.map(() => 0)
  );

  // Calculate running totals for each participant
  const finalScores = participants.map((_, index) => {
    return games.reduce((sum, game) => sum + (game.scores[index] || 0), 0);
  });

  // Determine winners based on target score
  const determineWinners = () => {
    const winnersIndices: number[] = [];
    finalScores.forEach((score, index) => {
      if (score >= targetScore) {
        winnersIndices.push(index);
      }
    });
    return winnersIndices;
  };

  // Reset current game scores when participants change
  useEffect(() => {
    setCurrentGameScores(participants.map(() => 0));
  }, [participants.length]);

  useEffect(() => {
    onDataChange({
      games,
      finalScores,
      targetScore,
    });

    // Auto-set winners when target score is reached/exceeded
    if (onWinnersChange && games.length > 0) {
      const winnerIndices = determineWinners();
      const winnerPlayerIds = winnerIndices.map((idx) => participants[idx].playerId);
      onWinnersChange(winnerPlayerIds);
    }
  }, [games, targetScore]);

  const [selectedWinnerIndex, setSelectedWinnerIndex] = useState<number | null>(null);

  const handleSelectWinner = (winnerIndex: number) => {
    setSelectedWinnerIndex(winnerIndex);
    // Reset scores when winner changes
    setCurrentGameScores(participants.map(() => 0));
  };

  const handleAddGame = () => {
    if (selectedWinnerIndex === null) return;

    const winnerId = participants[selectedWinnerIndex].playerId;

    // Calculate total points from OTHER players' cards (not the winner's)
    const totalPointsFromOthers = currentGameScores.reduce((sum, score, idx) => {
      if (idx !== selectedWinnerIndex) {
        return sum + score;
      }
      return sum;
    }, 0);

    // In Uno, the winner gets points from other players' remaining cards
    const newGame: UnoGame = {
      scores: currentGameScores.map((score, idx) => {
        // Winner gets all the points from other players, others get 0
        return idx === selectedWinnerIndex ? totalPointsFromOthers : 0;
      }),
      winnerId,
    };

    setGames([...games, newGame]);

    // Reset for next game
    setCurrentGameScores(participants.map(() => 0));
    setSelectedWinnerIndex(null);
  };

  const handleRemoveGame = (index: number) => {
    setGames(games.filter((_, i) => i !== index));
  };

  const updateCurrentGameScore = (participantIndex: number, score: number) => {
    const newScores = [...currentGameScores];
    newScores[participantIndex] = score;
    setCurrentGameScores(newScores);
  };

  // Calculate total points from all players' remaining cards
  const totalPointsThisGame = currentGameScores.reduce((sum, score) => sum + score, 0);

  return (
    <VStack space="lg">
      <FormControl>
        <FormControlLabel>
          <FormControlLabelText>Target Score</FormControlLabelText>
        </FormControlLabel>
        <Select
          selectedValue={String(targetScore)}
          onValueChange={(v) => setTargetScore(parseInt(v))}
        >
          <SelectTrigger variant="outline" size="lg">
            <SelectInput
              placeholder="Select target score"
              value={String(targetScore)}
              className="flex-1"
            />
            <SelectIcon as={ChevronDownIcon} className="ml-auto mr-3" />
          </SelectTrigger>
          <SelectPortal>
            <SelectBackdrop />
            <SelectContent>
              <SelectDragIndicatorWrapper>
                <SelectDragIndicator />
              </SelectDragIndicatorWrapper>
              <SelectItem label="200" value="200" />
              <SelectItem label="300" value="300" />
              <SelectItem label="500" value="500" />
              <SelectItem label="1000" value="1000" />
            </SelectContent>
          </SelectPortal>
        </Select>
      </FormControl>

      <Divider />

      <Heading size="md">Current Match Scores</Heading>
      <HStack className="justify-around flex-wrap">
        {participants.map((participant, index) => (
          <VStack key={participant.playerId} className="items-center min-w-[80px]">
            <Text className="font-bold text-center">
              {participant.firstName} {participant.lastName}
            </Text>
            <Text size="2xl" className="font-bold text-primary-500">
              {finalScores[index]}
            </Text>
          </VStack>
        ))}
      </HStack>

      <Divider />

      <Heading size="sm">Add Game {games.length + 1}</Heading>

      <VStack space="md">
        <Text size="sm" className="text-typography-700 font-semibold">
          Step 1: Who went out (played their last card)?
        </Text>
        <HStack space="sm" className="flex-wrap">
          {participants.map((participant, index) => (
            <Button
              key={participant.playerId}
              size="md"
              action={selectedWinnerIndex === index ? "positive" : "secondary"}
              variant={selectedWinnerIndex === index ? "solid" : "outline"}
              className="flex-1 min-w-[120px] mb-2"
              onPress={() => handleSelectWinner(index)}
            >
              <ButtonText numberOfLines={1} className="text-center">
                {participant.firstName} {participant.lastName}
              </ButtonText>
            </Button>
          ))}
        </HStack>

        {selectedWinnerIndex !== null && (
          <>
            <Divider className="my-2" />
            <Text size="sm" className="text-typography-700 font-semibold">
              Step 2: Enter card points for remaining players
            </Text>
            <Text size="xs" className="text-typography-500">
              Numbers: face value | Skip/Reverse/+2: 20pts | Wild/+4: 50pts
            </Text>

            {participants.map((participant, index) => {
              // Don't show input for the winner (they went out with 0 cards)
              if (index === selectedWinnerIndex) return null;

              return (
                <FormControl key={`score-${participant.playerId}`}>
                  <FormControlLabel>
                    <FormControlLabelText>
                      {participant.firstName} {participant.lastName}
                    </FormControlLabelText>
                  </FormControlLabel>
                  <Input variant="outline" size="lg">
                    <InputField
                      placeholder="Enter card points"
                      value={currentGameScores[index] === 0 ? '' : String(currentGameScores[index])}
                      onChangeText={(text) => {
                        const value = text === '' ? 0 : parseInt(text) || 0;
                        updateCurrentGameScore(index, Math.max(0, value));
                      }}
                      keyboardType="number-pad"
                    />
                  </Input>
                </FormControl>
              );
            })}

            {totalPointsThisGame > 0 && (
              <Card size="sm" variant="outline" className="p-3 bg-success-50">
                <Text size="sm" className="text-success-700 font-semibold">
                  {participants[selectedWinnerIndex].firstName} will earn {totalPointsThisGame} points
                </Text>
              </Card>
            )}

            <Button
              size="lg"
              action="positive"
              onPress={handleAddGame}
              isDisabled={totalPointsThisGame === 0}
            >
              <ButtonText>Add Game {games.length + 1}</ButtonText>
            </Button>
          </>
        )}
      </VStack>

      {games.length > 0 && (
        <>
          <Divider />
          <Accordion
            type="multiple"
            value={accordionValue}
            onValueChange={setAccordionValue}
          >
            <AccordionItem value="recorded-games">
              <AccordionHeader>
                <AccordionTrigger>
                  {({ isExpanded }) => (
                    <>
                      <AccordionTitleText>
                        Recorded Games ({games.length})
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
                <VStack space="md" className="pt-2">
                  {games.map((game, idx) => {
                    const winner = participants.find((p) => p.playerId === game.winnerId);
                    const winnerIndex = participants.findIndex((p) => p.playerId === game.winnerId);
                    const pointsEarned = game.scores[winnerIndex] || 0;

                    return (
                      <Card key={idx} size="sm" variant="outline" className="p-3">
                        <HStack className="justify-between items-start">
                          <VStack space="xs" className="flex-1">
                            <Text size="sm" className="font-semibold">
                              Game {idx + 1}
                            </Text>
                            <Text size="sm" className="text-success-600">
                              Winner: {winner ? `${winner.firstName} ${winner.lastName}` : 'Unknown'}
                            </Text>
                            <Text size="sm">
                              Points earned: {pointsEarned}
                            </Text>
                          </VStack>
                          <Button
                            size="xs"
                            variant="outline"
                            action="negative"
                            onPress={() => handleRemoveGame(idx)}
                          >
                            <ButtonText>Remove</ButtonText>
                          </Button>
                        </HStack>
                      </Card>
                    );
                  })}
                </VStack>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </>
      )}
    </VStack>
  );
}
