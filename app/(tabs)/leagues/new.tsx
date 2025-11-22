import React, { useState } from 'react';
import { Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView } from '@/components/ui/scroll-view';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { 
  FormControl, 
  FormControlLabel, 
  FormControlLabelText,
  FormControlError,
  FormControlErrorText 
} from '@/components/ui/form-control';
import { Input, InputField } from '@/components/ui/input';
import { router } from 'expo-router';
import { useDatabase } from '@/lib/db/provider';
import { insert } from '@/lib/db/queries';

export default function NewLeague() {
  const { db } = useDatabase();
  const [name, setName] = useState('');
  const [season, setSeason] = useState('');
  const [location, setLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    // Clear previous errors
    setError('');

    // Validation
    if (!name.trim()) {
      setError('League name is required');
      return;
    }

    if (!db) {
      setError('Database not ready. Please try again.');
      return;
    }

    setIsSubmitting(true);
    Keyboard.dismiss();

    try {
      await insert(db, 'leagues', {
        name: name.trim(),
        season: season.trim() || null,
        location: location.trim() || null,
        createdAt: Date.now(),
      });

      // Navigate back to leagues list
      router.back();
    } catch (err) {
      console.error('Failed to create league:', err);
      setError('Failed to create league. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    Keyboard.dismiss();
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-background-0">
      <ScrollView 
        className="flex-1"
        contentContainerClassName="p-6"
        keyboardShouldPersistTaps="handled"
      >
        <VStack space="2xl">
          <Heading size="3xl" className="text-typography-900">
            Create New League
          </Heading>

          <VStack space="xl">
            {/* League Name */}
            <FormControl isRequired isInvalid={!!error && !name.trim()}>
              <FormControlLabel>
                <FormControlLabelText>League Name</FormControlLabelText>
              </FormControlLabel>
              <Input variant="outline" size="lg">
                <InputField
                  placeholder="Enter league name"
                  value={name}
                  onChangeText={setName}
                  editable={!isSubmitting}
                  autoCapitalize="words"
                  returnKeyType="next"
                />
              </Input>
              {error && !name.trim() && (
                <FormControlError>
                  <FormControlErrorText>{error}</FormControlErrorText>
                </FormControlError>
              )}
            </FormControl>

            {/* Season */}
            <FormControl>
              <FormControlLabel>
                <FormControlLabelText>Season</FormControlLabelText>
              </FormControlLabel>
              <Input variant="outline" size="lg">
                <InputField
                  placeholder="e.g. Fall 2024, Winter 2025"
                  value={season}
                  onChangeText={setSeason}
                  editable={!isSubmitting}
                  autoCapitalize="words"
                  returnKeyType="next"
                />
              </Input>
            </FormControl>

            {/* Location */}
            <FormControl>
              <FormControlLabel>
                <FormControlLabelText>Location</FormControlLabelText>
              </FormControlLabel>
              <Input variant="outline" size="lg">
                <InputField
                  placeholder="e.g. Central Park, Downtown Arena"
                  value={location}
                  onChangeText={setLocation}
                  editable={!isSubmitting}
                  autoCapitalize="words"
                  returnKeyType="done"
                  onSubmitEditing={handleCreate}
                />
              </Input>
            </FormControl>

            {/* General Error */}
            {error && name.trim() && (
              <FormControl isInvalid>
                <FormControlError>
                  <FormControlErrorText>{error}</FormControlErrorText>
                </FormControlError>
              </FormControl>
            )}
          </VStack>

          {/* Action Buttons */}
          <HStack space="md" className="mt-4">
            <Button
              variant="outline"
              size="lg"
              className="flex-1"
              onPress={handleCancel}
              isDisabled={isSubmitting}
            >
              <ButtonText>Cancel</ButtonText>
            </Button>

            <Button
              action="primary"
              size="lg"
              className="flex-1"
              onPress={handleCreate}
              isDisabled={isSubmitting}
            >
              <ButtonText>
                {isSubmitting ? 'Creating...' : 'Create'}
              </ButtonText>
            </Button>
          </HStack>
        </VStack>
      </ScrollView>
    </SafeAreaView>
  );
}