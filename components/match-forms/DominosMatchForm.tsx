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
import { DominosGameData, DominoGame } from '@/types/games';
import { ParticipantInfo } from './types';

interface DominosMatchFormProps {
  participants: ParticipantInfo[];
  onDataChange: (data: DominosGameData) => void;
  onWinnersChange?: (winnerPlayerIds: number[]) => void;
  initialData?: DominosGameData;
}

export function DominosMatchForm({
  participants,
  onDataChange,
  onWinnersChange,
  initialData,
}: DominosMatchFormProps) {
  const [games, setGames] = useState<DominoGame[]>(initialData?.games || []);
  const [targetScore, setTargetScore] = useState(initialData?.targetScore || 150);
  const [accordionValue, setAccordionValue] = useState<string[]>([]);

  // Current game scores - array indexed by seatIndex
  const [currentGameScores, setCurrentGameScores] = useState<number[]>(
    participants.map(() => 0)
  );

  // Current game pips (domino points held) - array indexed by seatIndex
  const [currentGamePips, setCurrentGamePips] = useState<number[]>(
    participants.map(() => 0)
  );

  // Calculate running totals for each participant
  // Formula: For each game, add (points earned - pips held)
  const finalScores = participants.map((_, index) => {
    return games.reduce((sum, game) => {
      const points = game.scores[index] || 0;
      const pips = game.pips ? (game.pips[index] || 0) : 0;
      return sum + (points - pips);
    }, 0);
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

  // Reset current game scores and pips when participants change
  useEffect(() => {
    setCurrentGameScores(participants.map(() => 0));
    setCurrentGamePips(participants.map(() => 0));
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

  const handleAddGame = (winnerId: number) => {
    const newGame: DominoGame = {
      scores: [...currentGameScores],
      pips: [...currentGamePips],
      winnerId,
    };

    setGames([...games, newGame]);

    // Reset current game
    setCurrentGameScores(participants.map(() => 0));
    setCurrentGamePips(participants.map(() => 0));
  };

  const handleRemoveGame = (index: number) => {
    setGames(games.filter((_, i) => i !== index));
  };

  const updateCurrentGameScore = (participantIndex: number, score: number) => {
    const newScores = [...currentGameScores];
    newScores[participantIndex] = score;
    setCurrentGameScores(newScores);
  };

  const updateCurrentGamePips = (participantIndex: number, pips: number) => {
    const newPips = [...currentGamePips];
    newPips[participantIndex] = pips;
    setCurrentGamePips(newPips);
  };

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
              <SelectItem label="150" value="150" />
              <SelectItem label="200" value="200" />
              <SelectItem label="250" value="250" />
              <SelectItem label="300" value="300" />
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
        <Text size="sm" className="text-typography-600">
          Points earned this game
        </Text>
        {participants.map((participant, index) => (
          <FormControl key={`score-${participant.playerId}`}>
            <FormControlLabel>
              <FormControlLabelText>
                {participant.firstName} {participant.lastName} Score
              </FormControlLabelText>
            </FormControlLabel>
            <Input variant="outline" size="lg">
              <InputField
                placeholder="Enter score"
                value={currentGameScores[index] === 0 ? '' : String(currentGameScores[index])}
                onChangeText={(text) => {
                  const value = text === '' ? 0 : parseInt(text) || 0;
                  updateCurrentGameScore(index, Math.max(0, value));
                }}
                keyboardType="number-pad"
              />
            </Input>
          </FormControl>
        ))}

        <Divider className="my-2" />

        <Text size="sm" className="text-typography-600">
          Domino pips held (optional - deducted from score)
        </Text>
        {participants.map((participant, index) => (
          <FormControl key={`pips-${participant.playerId}`}>
            <FormControlLabel>
              <FormControlLabelText>
                {participant.firstName} {participant.lastName} Pips
              </FormControlLabelText>
            </FormControlLabel>
            <Input variant="outline" size="lg">
              <InputField
                placeholder="Enter pips"
                value={currentGamePips[index] === 0 ? '' : String(currentGamePips[index])}
                onChangeText={(text) => {
                  const value = text === '' ? 0 : parseInt(text) || 0;
                  updateCurrentGamePips(index, Math.max(0, value));
                }}
                keyboardType="number-pad"
              />
            </Input>
          </FormControl>
        ))}

        <Text size="xs" className="text-typography-500">
          Who ran out of dominos first?
        </Text>
        <HStack space="sm" className="flex-wrap">
          {participants.map((participant) => (
            <Button
              key={participant.playerId}
              size="md"
              action="positive"
              className="flex-1 min-w-[120px] mb-2"
              onPress={() => handleAddGame(participant.playerId)}
            >
              <ButtonText numberOfLines={1} className="text-center">
                {participant.firstName} {participant.lastName}
              </ButtonText>
            </Button>
          ))}
        </HStack>
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
                  {({ isExpanded }: { isExpanded: boolean }) => (
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
                    return (
                      <Card key={idx} size="sm" variant="outline" className="p-3">
                        <HStack className="justify-between items-start">
                          <VStack space="xs" className="flex-1">
                            <Text size="sm" className="font-semibold">
                              Game {idx + 1}
                            </Text>
                            <VStack space="xs">
                              {participants.map((participant, pIdx) => {
                                const points = game.scores[pIdx] || 0;
                                const pips = game.pips ? (game.pips[pIdx] || 0) : 0;
                                const net = points - pips;
                                return (
                                  <Text key={participant.playerId} size="sm">
                                    {participant.firstName} {participant.lastName}: {points}
                                    {pips > 0 && ` - ${pips} pips = ${net >= 0 ? '+' : ''}${net}`}
                                  </Text>
                                );
                              })}
                            </VStack>
                            <Text size="xs" className="text-typography-500">
                              Winner: {winner ? `${winner.firstName} ${winner.lastName}` : 'Unknown'}
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
