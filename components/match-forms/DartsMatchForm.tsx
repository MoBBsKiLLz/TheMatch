import React, { useState, useEffect } from 'react';
import { VStack } from '@/components/ui/vstack';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
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
import { ChevronDownIcon } from 'lucide-react-native';
import {
  DartsGameData,
  DartsX01GameData,
  DartsCricketGameData,
  DartsCricketType,
} from '@/types/games';

interface DartsMatchFormProps {
  variant: string;
  onVariantChange: (variant: string) => void;
  playerAName: string;
  playerBName: string;
  onDataChange: (data: DartsGameData) => void;
}

export function DartsMatchForm({
  variant,
  onVariantChange,
  playerAName,
  playerBName,
  onDataChange,
}: DartsMatchFormProps) {
  const isX01 = ['901', '701', '501', '401', '301'].includes(variant);
  const isCricket = variant === 'cricket';

  // X01 state
  const [playerAScore, setPlayerAScore] = useState(0);
  const [playerBScore, setPlayerBScore] = useState(0);

  // Cricket state
  const [playerAPoints, setPlayerAPoints] = useState(0);
  const [playerBPoints, setPlayerBPoints] = useState(0);
  const [cricketType, setCricketType] = useState<DartsCricketType>('standard');

  useEffect(() => {
    if (isX01) {
      onDataChange({
        playerAScore,
        playerBScore,
        startingScore: parseInt(variant),
      } as DartsX01GameData);
    } else if (isCricket) {
      onDataChange({
        playerAPoints,
        playerBPoints,
        cricketType,
      } as DartsCricketGameData);
    }
  }, [playerAScore, playerBScore, playerAPoints, playerBPoints, cricketType, variant]);

  return (
    <VStack space="lg">
      <FormControl>
        <FormControlLabel>
          <FormControlLabelText>Game Variant</FormControlLabelText>
        </FormControlLabel>
        <Select selectedValue={variant} onValueChange={onVariantChange}>
          <SelectTrigger variant="outline" size="lg">
            <SelectInput
              placeholder="Select variant"
              value={variant === 'cricket' ? 'Cricket' : variant.toUpperCase()}
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
              <SelectItem label="901" value="901" />
              <SelectItem label="701" value="701" />
              <SelectItem label="501" value="501" />
              <SelectItem label="401" value="401" />
              <SelectItem label="301" value="301" />
              <SelectItem label="Cricket" value="cricket" />
            </SelectContent>
          </SelectPortal>
        </Select>
      </FormControl>

      {isX01 && (
        <>
          <Heading size="sm">Final Scores</Heading>
          <Text size="xs" className="text-typography-500">
            Enter the remaining scores (winner should have 0)
          </Text>

          <FormControl>
            <FormControlLabel>
              <FormControlLabelText>{playerAName} Score</FormControlLabelText>
            </FormControlLabel>
            <Input variant="outline" size="lg">
              <InputField
                keyboardType="number-pad"
                value={String(playerAScore)}
                onChangeText={(v) => setPlayerAScore(parseInt(v) || 0)}
                placeholder="0"
              />
            </Input>
          </FormControl>

          <FormControl>
            <FormControlLabel>
              <FormControlLabelText>{playerBName} Score</FormControlLabelText>
            </FormControlLabel>
            <Input variant="outline" size="lg">
              <InputField
                keyboardType="number-pad"
                value={String(playerBScore)}
                onChangeText={(v) => setPlayerBScore(parseInt(v) || 0)}
                placeholder="0"
              />
            </Input>
          </FormControl>
        </>
      )}

      {isCricket && (
        <>
          <FormControl>
            <FormControlLabel>
              <FormControlLabelText>Cricket Type</FormControlLabelText>
            </FormControlLabel>
            <Select
              selectedValue={cricketType}
              onValueChange={(v) => setCricketType(v as DartsCricketType)}
            >
              <SelectTrigger variant="outline" size="lg">
                <SelectInput
                  placeholder="Select type"
                  value={cricketType === 'standard' ? 'Standard' : 'Cut-throat'}
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
                  <SelectItem label="Standard" value="standard" />
                  <SelectItem label="Cut-throat" value="cut-throat" />
                </SelectContent>
              </SelectPortal>
            </Select>
            <Text size="xs" className="text-typography-400 mt-1">
              {cricketType === 'standard'
                ? 'Most points wins'
                : 'Least points wins'}
            </Text>
          </FormControl>

          <Heading size="sm">Final Points</Heading>

          <FormControl>
            <FormControlLabel>
              <FormControlLabelText>{playerAName} Points</FormControlLabelText>
            </FormControlLabel>
            <Input variant="outline" size="lg">
              <InputField
                keyboardType="number-pad"
                value={String(playerAPoints)}
                onChangeText={(v) => setPlayerAPoints(parseInt(v) || 0)}
                placeholder="0"
              />
            </Input>
          </FormControl>

          <FormControl>
            <FormControlLabel>
              <FormControlLabelText>{playerBName} Points</FormControlLabelText>
            </FormControlLabel>
            <Input variant="outline" size="lg">
              <InputField
                keyboardType="number-pad"
                value={String(playerBPoints)}
                onChangeText={(v) => setPlayerBPoints(parseInt(v) || 0)}
                placeholder="0"
              />
            </Input>
          </FormControl>
        </>
      )}
    </VStack>
  );
}
