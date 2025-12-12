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
import { ChevronDownIcon } from 'lucide-react-native';
import { DominosGameData, DominoGame } from '@/types/games';

interface DominosMatchFormProps {
  playerAId: number;
  playerBId: number;
  playerAName: string;
  playerBName: string;
  onDataChange: (data: DominosGameData) => void;
}

export function DominosMatchForm({
  playerAId,
  playerBId,
  playerAName,
  playerBName,
  onDataChange,
}: DominosMatchFormProps) {
  const [games, setGames] = useState<DominoGame[]>([]);
  const [targetScore, setTargetScore] = useState(150);
  const [currentGamePlayerA, setCurrentGamePlayerA] = useState(0);
  const [currentGamePlayerB, setCurrentGamePlayerB] = useState(0);

  const playerATotalScore = games.reduce((sum, g) => sum + g.playerAScore, 0);
  const playerBTotalScore = games.reduce((sum, g) => sum + g.playerBScore, 0);

  useEffect(() => {
    onDataChange({
      games,
      finalScore: {
        playerA: playerATotalScore,
        playerB: playerBTotalScore,
      },
      targetScore,
    });
  }, [games, targetScore]);

  const handleAddGame = (winnerId: number) => {
    const newGame: DominoGame = {
      playerAScore: currentGamePlayerA,
      playerBScore: currentGamePlayerB,
      winnerId,
    };

    setGames([...games, newGame]);

    // Reset current game
    setCurrentGamePlayerA(0);
    setCurrentGamePlayerB(0);
  };

  const handleRemoveGame = (index: number) => {
    setGames(games.filter((_, i) => i !== index));
  };

  const scoreOptions = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60];

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

      <Heading size="md">Current Match Score</Heading>
      <HStack className="justify-around">
        <VStack className="items-center">
          <Text className="font-bold">{playerAName}</Text>
          <Text size="2xl" className="font-bold text-primary-500">
            {playerATotalScore}
          </Text>
        </VStack>
        <VStack className="items-center">
          <Text className="font-bold">{playerBName}</Text>
          <Text size="2xl" className="font-bold text-primary-500">
            {playerBTotalScore}
          </Text>
        </VStack>
      </HStack>

      <Divider />

      <Heading size="sm">Add Game {games.length + 1}</Heading>

      <VStack space="md">
        <FormControl>
          <FormControlLabel>
            <FormControlLabelText>{playerAName} Score</FormControlLabelText>
          </FormControlLabel>
          <Select
            selectedValue={String(currentGamePlayerA)}
            onValueChange={(v) => setCurrentGamePlayerA(parseInt(v))}
          >
            <SelectTrigger variant="outline" size="lg">
              <SelectInput
                placeholder="Select score"
                value={String(currentGamePlayerA)}
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
                {scoreOptions.map((score) => (
                  <SelectItem key={score} label={String(score)} value={String(score)} />
                ))}
              </SelectContent>
            </SelectPortal>
          </Select>
        </FormControl>

        <FormControl>
          <FormControlLabel>
            <FormControlLabelText>{playerBName} Score</FormControlLabelText>
          </FormControlLabel>
          <Select
            selectedValue={String(currentGamePlayerB)}
            onValueChange={(v) => setCurrentGamePlayerB(parseInt(v))}
          >
            <SelectTrigger variant="outline" size="lg">
              <SelectInput
                placeholder="Select score"
                value={String(currentGamePlayerB)}
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
                {scoreOptions.map((score) => (
                  <SelectItem key={score} label={String(score)} value={String(score)} />
                ))}
              </SelectContent>
            </SelectPortal>
          </Select>
        </FormControl>

        <Text size="xs" className="text-typography-500">
          Who ran out of dominos first?
        </Text>
        <HStack space="sm">
          <Button
            size="md"
            action="positive"
            className="flex-1"
            onPress={() => handleAddGame(playerAId)}
          >
            <ButtonText>{playerAName}</ButtonText>
          </Button>
          <Button
            size="md"
            action="positive"
            className="flex-1"
            onPress={() => handleAddGame(playerBId)}
          >
            <ButtonText>{playerBName}</ButtonText>
          </Button>
        </HStack>
      </VStack>

      {games.length > 0 && (
        <>
          <Divider />
          <Heading size="sm">Recorded Games ({games.length})</Heading>
          {games.map((game, idx) => (
            <Card key={idx} size="sm" variant="outline" className="p-3">
              <HStack className="justify-between items-center">
                <VStack space="xs">
                  <Text size="sm" className="font-semibold">
                    Game {idx + 1}
                  </Text>
                  <Text size="sm">
                    {game.playerAScore} - {game.playerBScore}
                  </Text>
                  <Text size="xs" className="text-typography-500">
                    Winner: {game.winnerId === playerAId ? playerAName : playerBName}
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
          ))}
        </>
      )}
    </VStack>
  );
}
