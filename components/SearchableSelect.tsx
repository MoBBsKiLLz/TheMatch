import React, { useState, useMemo } from 'react';
import { ScrollView } from 'react-native';
import { VStack } from '@/components/ui/vstack';
import { Input, InputField, InputSlot, InputIcon } from '@/components/ui/input';
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
import { ChevronDownIcon, Search } from 'lucide-react-native';
import { Text } from '@/components/ui/text';

export type SelectOption = {
  label: string;
  value: string;
};

interface SearchableSelectProps {
  options: SelectOption[];
  selectedValue?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  isDisabled?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'outline' | 'underlined' | 'rounded';
  searchPlaceholder?: string;
  emptyMessage?: string;
}

export function SearchableSelect({
  options,
  selectedValue,
  onValueChange,
  placeholder = 'Select an option',
  isDisabled = false,
  className,
  size = 'lg',
  variant = 'outline',
  searchPlaceholder = 'Search...',
  emptyMessage = 'No options found',
}: SearchableSelectProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) {
      return options;
    }

    const query = searchQuery.toLowerCase();
    return options.filter((option) =>
      option.label.toLowerCase().includes(query)
    );
  }, [options, searchQuery]);

  // Get selected option label
  const selectedLabel = useMemo(() => {
    const selected = options.find((opt) => opt.value === selectedValue);
    return selected?.label || '';
  }, [options, selectedValue]);

  // Reset search when closing
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setSearchQuery('');
    }
  };

  return (
    <Select
      selectedValue={selectedValue}
      onValueChange={onValueChange}
      isDisabled={isDisabled}
      onOpenChange={handleOpenChange}
    >
      <SelectTrigger variant={variant} size={size} className={className}>
        <SelectInput
          className="flex-1"
          placeholder={placeholder}
          value={selectedLabel}
        />
        <SelectIcon as={ChevronDownIcon} className="ml-auto mr-3" />
      </SelectTrigger>
      <SelectPortal>
        <SelectBackdrop />
        <SelectContent>
          <SelectDragIndicatorWrapper>
            <SelectDragIndicator />
          </SelectDragIndicatorWrapper>

          {/* Search Input */}
          <VStack className="px-4 py-3 border-b border-outline-200">
            <Input variant="outline" size="lg" className="w-full">
              <InputSlot className="pl-3">
                <InputIcon as={Search} className="text-typography-400" />
              </InputSlot>
              <InputField
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus={false}
                className="flex-1"
              />
            </Input>
          </VStack>

          {/* Options List */}
          <ScrollView style={{ height: 400 }}>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <SelectItem
                  key={option.value}
                  label={option.label}
                  value={option.value}
                />
              ))
            ) : (
              <VStack className="p-4 items-center">
                <Text className="text-typography-500 text-sm">{emptyMessage}</Text>
              </VStack>
            )}
          </ScrollView>
        </SelectContent>
      </SelectPortal>
    </Select>
  );
}
