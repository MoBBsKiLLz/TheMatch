import React, { useState, useEffect } from 'react';
import { VStack } from '@/components/ui/vstack';
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
import { PoolGameData, PoolWinMethod, PoolVariant } from '@/types/games';
import { POOL_WIN_METHODS } from '@/lib/games/pool';

interface PoolMatchFormProps {
  variant: PoolVariant;
  onVariantChange: (variant: PoolVariant) => void;
  onDataChange: (data: PoolGameData) => void;
}

export function PoolMatchForm({
  variant,
  onVariantChange,
  onDataChange,
}: PoolMatchFormProps) {
  const [winMethod, setWinMethod] = useState<PoolWinMethod>('made_all_balls');

  useEffect(() => {
    onDataChange({ winMethod });
  }, [winMethod]);

  return (
    <VStack space="md">
      <FormControl>
        <FormControlLabel>
          <FormControlLabelText>Game Variant</FormControlLabelText>
        </FormControlLabel>
        <Select selectedValue={variant} onValueChange={(v) => onVariantChange(v as PoolVariant)}>
          <SelectTrigger variant="outline" size="lg">
            <SelectInput
              placeholder="Select variant"
              value={variant === '8-ball' ? '8-Ball' : '9-Ball'}
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
              <SelectItem label="8-Ball" value="8-ball" />
              <SelectItem label="9-Ball" value="9-ball" />
            </SelectContent>
          </SelectPortal>
        </Select>
      </FormControl>

      <FormControl>
        <FormControlLabel>
          <FormControlLabelText>Win Method</FormControlLabelText>
        </FormControlLabel>
        <Select
          selectedValue={winMethod}
          onValueChange={(v) => setWinMethod(v as PoolWinMethod)}
        >
          <SelectTrigger variant="outline" size="lg">
            <SelectInput
              placeholder="Select win method"
              value={POOL_WIN_METHODS.find((m) => m.value === winMethod)?.label || ''}
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
              {POOL_WIN_METHODS.map((method) => (
                <SelectItem key={method.value} label={method.label} value={method.value} />
              ))}
            </SelectContent>
          </SelectPortal>
        </Select>
      </FormControl>
    </VStack>
  );
}
