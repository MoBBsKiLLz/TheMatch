import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { MatchCard } from '../match/MatchCard';
import { MatchWithDetails } from '@/types/match';

const mockMatch: MatchWithDetails = {
  id: 1,
  date: Date.now(),
  status: 'in_progress',
  gameType: 'darts',
  gameVariant: '501',
  leagueId: null,
  createdAt: Date.now(),
  participants: [
    {
      id: 1,
      matchId: 1,
      playerId: 1,
      seatIndex: 0,
      firstName: 'John',
      lastName: 'Doe',
      score: 100,
      finishPosition: 2,
      isWinner: false,
    },
    {
      id: 2,
      matchId: 1,
      playerId: 2,
      seatIndex: 1,
      firstName: 'Jane',
      lastName: 'Smith',
      score: 200,
      finishPosition: 1,
      isWinner: true,
    },
  ],
};

describe('MatchCard', () => {
  describe('onPress behavior', () => {
    it('should call onPress when card is pressed and showActions is false', () => {
      const onPressMock = jest.fn();
      const { getByText } = render(
        <MatchCard match={mockMatch} onPress={onPressMock} showActions={false} />
      );

      // Find any text element on the card and press it
      const playerName = getByText('John Doe');
      fireEvent.press(playerName);

      expect(onPressMock).toHaveBeenCalledTimes(1);
    });

    it('should call onPress when card is pressed and showActions is true', () => {
      const onPressMock = jest.fn();
      const { getByText } = render(
        <MatchCard match={mockMatch} onPress={onPressMock} showActions={true} />
      );

      // When showActions is true, onPress still makes the whole card pressable
      const playerName = getByText('John Doe');
      fireEvent.press(playerName);

      expect(onPressMock).toHaveBeenCalledTimes(1);
    });

    it('should not be pressable when onPress is not provided', () => {
      const { getByText } = render(
        <MatchCard match={mockMatch} showActions={false} />
      );

      // This should not throw an error
      const playerName = getByText('John Doe');
      expect(() => fireEvent.press(playerName)).not.toThrow();
    });
  });

  describe('action buttons', () => {
    it('should show Continue Match button when showActions is true and status is in_progress', () => {
      const onPressMock = jest.fn();
      const { getByText } = render(
        <MatchCard match={mockMatch} onPress={onPressMock} showActions={true} />
      );

      const continueButton = getByText('Continue Match');
      expect(continueButton).toBeTruthy();

      fireEvent.press(continueButton);
      expect(onPressMock).toHaveBeenCalledTimes(1);
    });

    it('should show View Match button when showActions is true and status is completed', () => {
      const completedMatch = { ...mockMatch, status: 'completed' as const };
      const onPressMock = jest.fn();
      const { getByText } = render(
        <MatchCard match={completedMatch} onPress={onPressMock} showActions={true} />
      );

      const viewButton = getByText('View Match');
      expect(viewButton).toBeTruthy();
    });

    it('should not show action buttons when showActions is false', () => {
      const onPressMock = jest.fn();
      const { queryByText } = render(
        <MatchCard match={mockMatch} onPress={onPressMock} showActions={false} />
      );

      expect(queryByText('Continue Match')).toBeNull();
      expect(queryByText('View Match')).toBeNull();
    });

    it('should show Delete button when showActions is true and onDelete is provided', () => {
      const onDeleteMock = jest.fn();
      const { getByText } = render(
        <MatchCard match={mockMatch} showActions={true} onDelete={onDeleteMock} />
      );

      const deleteButton = getByText('Delete Match');
      expect(deleteButton).toBeTruthy();

      fireEvent.press(deleteButton);
      expect(onDeleteMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('match display', () => {
    it('should display participant names with proper capitalization', () => {
      const { getByText } = render(<MatchCard match={mockMatch} />);

      expect(getByText('John Doe')).toBeTruthy();
      expect(getByText('Jane Smith ✓')).toBeTruthy();
    });

    it('should capitalize participant names from lowercase', () => {
      const matchWithLowercaseNames = {
        ...mockMatch,
        participants: [
          {
            ...mockMatch.participants[0],
            firstName: 'john',
            lastName: 'doe',
          },
          {
            ...mockMatch.participants[1],
            firstName: 'jane',
            lastName: 'smith',
          },
        ],
      };
      const { getByText } = render(<MatchCard match={matchWithLowercaseNames} />);

      expect(getByText('John Doe')).toBeTruthy();
      expect(getByText('Jane Smith ✓')).toBeTruthy();
    });

    it('should display scores when available', () => {
      const { getByText } = render(<MatchCard match={mockMatch} />);

      expect(getByText('100')).toBeTruthy();
      expect(getByText('200')).toBeTruthy();
    });

    it('should display In Progress badge when status is in_progress', () => {
      const { getByText } = render(<MatchCard match={mockMatch} />);

      expect(getByText('In Progress')).toBeTruthy();
    });

    it('should display league name when available', () => {
      const matchWithLeague = { ...mockMatch, leagueName: 'Premier League' };
      const { getByText } = render(<MatchCard match={matchWithLeague} />);

      expect(getByText('Premier League')).toBeTruthy();
    });

    it('should display Standalone when no league', () => {
      const { getByText } = render(<MatchCard match={mockMatch} />);

      expect(getByText('Standalone')).toBeTruthy();
    });

    it('should display custom game name when available', () => {
      const customMatch = {
        ...mockMatch,
        gameType: 'custom' as const,
        customGameName: 'Around the World',
      };
      const { getByText } = render(<MatchCard match={customMatch} />);

      expect(getByText('Around the World')).toBeTruthy();
    });

    it('should properly capitalize game type', () => {
      const poolMatch = { ...mockMatch, gameType: 'pool' as const, gameVariant: undefined };
      const { getByText } = render(<MatchCard match={poolMatch} />);

      expect(getByText('Pool')).toBeTruthy();
    });

    it('should display "No Winner Recorded" with proper capitalization', () => {
      const matchWithoutWinner = {
        ...mockMatch,
        participants: mockMatch.participants.map(p => ({ ...p, isWinner: false })),
      };
      const { getByText } = render(<MatchCard match={matchWithoutWinner} />);

      expect(getByText('No Winner Recorded')).toBeTruthy();
    });

    it('should display winner message with proper capitalization', () => {
      const { getByText } = render(<MatchCard match={mockMatch} />);

      expect(getByText('Jane Smith Won')).toBeTruthy();
    });
  });
});
