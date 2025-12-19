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
import { CustomGameConfig, CustomGameData, CustomGame } from '@/types/customGame';
import { ParticipantInfo } from './types';
import { determineCustomGameWinner } from '@/lib/games/custom';

interface CustomMatchFormProps {
  participants: ParticipantInfo[];
  config: CustomGameConfig;
  onDataChange: (data: CustomGameData) => void;
  onWinnersChange?: (winnerPlayerIds: number[]) => void;
  initialData?: CustomGameData;
}

export function CustomMatchForm({
  participants,
  config,
  onDataChange,
  onWinnersChange,
  initialData,
}: CustomMatchFormProps) {
  const [games, setGames] = useState<CustomGame[]>(initialData?.games || []);
  const [targetValue, setTargetValue] = useState(config.targetValue);
  const [accordionValue, setAccordionValue] = useState<string[]>([]);

  // Current game scores
  const [currentGameScores, setCurrentGameScores] = useState<number[]>(
    participants.map(() => 0)
  );

  // Calculate running totals for each participant
  const finalScores = participants.map((_, index) => {
    return games.reduce((sum, game) => sum + (game.scores[index] || 0), 0);
  });

  // Reset current game scores when participants change
  useEffect(() => {
    setCurrentGameScores(participants.map(() => 0));
  }, [participants.length]);

  useEffect(() => {
    const gameData: CustomGameData = {
      games,
      finalScores,
      configId: config.id,
    };

    onDataChange(gameData);

    // Auto-determine winners based on config and current target value
    if (onWinnersChange && games.length > 0) {
      // Create a modified config with the current target value
      const modifiedConfig = { ...config, targetValue };
      const winnerIndices = determineCustomGameWinner(modifiedConfig, finalScores);
      const winnerPlayerIds = winnerIndices.map((idx) => participants[idx].playerId);
      onWinnersChange(winnerPlayerIds);
    }
  }, [games, config, targetValue]);

  const handleAddGame = () => {
    // Determine winner for this game if tracking individual games
    let winnerId: number | undefined;

    if (config.trackIndividualGames) {
      // Find highest score in current game
      const maxScore = Math.max(...currentGameScores);
      const winnerIndex = currentGameScores.indexOf(maxScore);
      winnerId = participants[winnerIndex].playerId;
    }

    const newGame: CustomGame = {
      scores: [...currentGameScores],
      winnerId,
    };

    setGames([...games, newGame]);

    // Reset for next game
    setCurrentGameScores(participants.map(() => 0));
  };

  const handleRemoveGame = (index: number) => {
    setGames(games.filter((_, i) => i !== index));
  };

  const updateCurrentGameScore = (participantIndex: number, score: number) => {
    const newScores = [...currentGameScores];
    newScores[participantIndex] = score;
    setCurrentGameScores(newScores);
  };

  const getScoringLabel = () => {
    switch (config.scoringMethod) {
      case 'points': return 'Points';
      case 'games_won': return 'Games Won';
      case 'rounds': return 'Rounds';
      default: return 'Score';
    }
  };

  const getWinConditionDisplay = () => {
    switch (config.winCondition) {
      case 'target_score':
        return `First to ${config.targetValue} ${getScoringLabel().toLowerCase()}`;
      case 'best_of_games':
        return `Best of ${config.targetValue} games`;
      case 'most_points':
        return `Most points after ${config.targetValue} rounds`;
      default:
        return '';
    }
  };

  const canAddGame = () => {
    // Check if at least one player has a non-zero score
    return currentGameScores.some(score => score !== 0);
  };

  return (
    <VStack space="lg">
      {/* Game Info Card */}
      <Card size="md" variant="outline" className="p-4 bg-info-50 border-info-300">
        <VStack space="xs">
          <Heading size="md">{config.name}</Heading>
          {config.description && (
            <Text size="sm" className="text-typography-500">
              {config.description}
            </Text>
          )}
          <Text size="md" className="text-info-700 font-semibold">
            {getWinConditionDisplay()}
          </Text>
          <Text size="xs" className="text-typography-500">
            Scoring: {getScoringLabel()}
          </Text>
        </VStack>
      </Card>

      {/* Target Value Selector */}
      <FormControl>
        <FormControlLabel>
          <FormControlLabelText>
            {config.winCondition === 'target_score' && `Target ${getScoringLabel()}`}
            {config.winCondition === 'best_of_games' && 'Number of Games'}
            {config.winCondition === 'most_points' && 'Number of Rounds'}
          </FormControlLabelText>
        </FormControlLabel>
        <Select
          selectedValue={String(targetValue)}
          onValueChange={(v) => setTargetValue(parseInt(v))}
        >
          <SelectTrigger variant="outline" size="lg">
            <SelectInput
              placeholder="Select target"
              value={String(targetValue)}
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
              {config.winCondition === 'target_score' && config.scoringMethod === 'points' ? (
                <>
                  <SelectItem label="11" value="11" />
                  <SelectItem label="21" value="21" />
                  <SelectItem label="50" value="50" />
                  <SelectItem label="100" value="100" />
                  <SelectItem label="150" value="150" />
                  <SelectItem label="200" value="200" />
                  <SelectItem label="300" value="300" />
                  <SelectItem label="500" value="500" />
                </>
              ) : (
                <>
                  <SelectItem label="3" value="3" />
                  <SelectItem label="5" value="5" />
                  <SelectItem label="7" value="7" />
                  <SelectItem label="9" value="9" />
                  <SelectItem label="11" value="11" />
                  <SelectItem label="15" value="15" />
                  <SelectItem label="21" value="21" />
                </>
              )}
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

      {config.trackIndividualGames ? (
        <>
          <VStack space="xs">
            <Heading size="sm">
              Add {config.scoringMethod === 'games_won' ? 'Game' : config.scoringMethod === 'rounds' ? 'Round' : 'Game'} {games.length + 1}
            </Heading>
            <Text size="xs" className="text-typography-500">
              Enter scores for each player, then tap "Add {config.scoringMethod === 'games_won' ? 'Game' : config.scoringMethod === 'rounds' ? 'Round' : 'Game'}" to record. Continue until someone reaches the target.
            </Text>
          </VStack>

          <VStack space="md">
            {participants.map((participant, index) => (
              <FormControl key={`score-${participant.playerId}`}>
                <FormControlLabel>
                  <FormControlLabelText>
                    {participant.firstName} {participant.lastName}
                  </FormControlLabelText>
                </FormControlLabel>
                <Input variant="outline" size="lg">
                  <InputField
                    placeholder={`Enter ${getScoringLabel().toLowerCase()}`}
                    value={currentGameScores[index] === 0 ? '' : String(currentGameScores[index])}
                    onChangeText={(text) => {
                      const value = text === '' ? 0 : parseInt(text) || 0;
                      if (config.allowNegativeScores) {
                        updateCurrentGameScore(index, value);
                      } else {
                        updateCurrentGameScore(index, Math.max(0, value));
                      }
                    }}
                    keyboardType={config.allowNegativeScores ? 'default' : 'number-pad'}
                  />
                </Input>
              </FormControl>
            ))}

            <Button
              size="lg"
              action="positive"
              onPress={handleAddGame}
              isDisabled={!canAddGame()}
            >
              <ButtonText>
                Add {config.scoringMethod === 'games_won' ? 'Game' : config.scoringMethod === 'rounds' ? 'Round' : 'Game'} {games.length + 1}
              </ButtonText>
            </Button>
          </VStack>
        </>
      ) : (
        <>
          <VStack space="xs">
            <Heading size="sm">Record Final Scores</Heading>
            <Text size="xs" className="text-typography-500">
              Enter the final score for each player after the match is complete.
            </Text>
          </VStack>
          <VStack space="md">
            {participants.map((participant, index) => (
              <FormControl key={`score-${participant.playerId}`}>
                <FormControlLabel>
                  <FormControlLabelText>
                    {participant.firstName} {participant.lastName}
                  </FormControlLabelText>
                </FormControlLabel>
                <Input variant="outline" size="lg">
                  <InputField
                    placeholder={`Enter ${getScoringLabel().toLowerCase()}`}
                    value={finalScores[index] === 0 ? '' : String(finalScores[index])}
                    onChangeText={(text) => {
                      const value = text === '' ? 0 : parseInt(text) || 0;
                      const score = config.allowNegativeScores ? value : Math.max(0, value);

                      // Create a single "game" with these scores
                      const newGame: CustomGame = {
                        scores: participants.map((_, i) => i === index ? score : finalScores[i]),
                      };
                      setGames([newGame]);
                    }}
                    keyboardType={config.allowNegativeScores ? 'default' : 'number-pad'}
                  />
                </Input>
              </FormControl>
            ))}
          </VStack>
        </>
      )}

      {games.length > 0 && config.trackIndividualGames && (
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
                        Recorded {config.scoringMethod === 'games_won' ? 'Games' : config.scoringMethod === 'rounds' ? 'Rounds' : 'Games'} ({games.length})
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
                <VStack space="sm">
                  {games.map((game, idx) => (
                    <Card key={idx} size="sm" variant="outline" className="p-3">
                      <VStack space="sm">
                        <HStack className="justify-between items-center">
                          <Text className="font-semibold">
                            {config.scoringMethod === 'games_won' ? 'Game' : config.scoringMethod === 'rounds' ? 'Round' : 'Game'} {idx + 1}
                          </Text>
                          {game.winnerId && (
                            <Text size="xs" className="text-success-600">
                              Winner: {participants.find(p => p.playerId === game.winnerId)?.firstName}
                            </Text>
                          )}
                        </HStack>
                        <HStack className="justify-around flex-wrap">
                          {participants.map((participant, pIdx) => (
                            <VStack key={participant.playerId} className="items-center min-w-[60px]">
                              <Text size="xs" className="text-typography-500">
                                {participant.firstName}
                              </Text>
                              <Text className="font-bold">
                                {game.scores[pIdx] || 0}
                              </Text>
                            </VStack>
                          ))}
                        </HStack>
                        <Button
                          size="xs"
                          variant="outline"
                          action="negative"
                          onPress={() => handleRemoveGame(idx)}
                        >
                          <ButtonText>Remove</ButtonText>
                        </Button>
                      </VStack>
                    </Card>
                  ))}
                </VStack>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </>
      )}
    </VStack>
  );
}
