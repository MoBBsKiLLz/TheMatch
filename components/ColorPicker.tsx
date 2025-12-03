import React from "react";
import { VStack } from "./ui/vstack";
import { HStack } from "./ui/hstack";
import { Text } from "./ui/text";
import { Pressable } from "./ui/pressable";

const PRESET_COLORS = [
  { name: "Blue", value: "#1E6FFF" }, // Primary
  { name: "Green", value: "#10B981" }, // Success
  { name: "Orange", value: "#F59E0B" }, // Warning
  { name: "Red", value: "#EF4444" }, // Error
  { name: "Purple", value: "#8B5CF6" },
  { name: "Pink", value: "#EC4899" },
  { name: "Lime", value: "#A3FF3F" }, // Accent
  { name: "Cyan", value: "#06B6D4" },
  { name: "Indigo", value: "#6366F1" },
  { name: "Teal", value: "#14B8A6" },
  { name: "Amber", value: "#FFBF00" },
  { name: "Rose", value: "#F43F5E" },
];

type ColorPickerProps = {
  selectedColor: string;
  onColorSelect: (color: string) => void;
  disabled?: boolean;
};

export function ColorPicker({ selectedColor, onColorSelect, disabled }: ColorPickerProps) {
  return (
    <VStack space="md">
      <Text size="sm" className="text-typography-500 font-medium">
        League Color
      </Text>
      <HStack space="md" className="flex-wrap">
        {PRESET_COLORS.map((color) => (
          <Pressable
            key={color.value}
            onPress={() => !disabled && onColorSelect(color.value)}
            disabled={disabled}
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: color.value,
              borderWidth: selectedColor === color.value ? 3 : 0,
              borderColor: '#FFFFFF',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
              elevation: 5,
              opacity: disabled ? 0.5 : 1,
            }}
          />
        ))}
      </HStack>
    </VStack>
  );
}   