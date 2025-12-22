import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { SeriesCard } from '../series/SeriesCard';
import { SeriesWithStats } from '@/types/series';

const mockSeries: SeriesWithStats = {
  id: 1,
  name: 'Summer Championship',
  description: 'Weekly tournament series',
  gameType: 'darts',
  status: 'active',
  startDate: Date.now() - 86400000, // 1 day ago
  endDate: null,
  createdAt: Date.now(),
  matchCount: 5,
  playerCount: 8,
};

describe('SeriesCard', () => {
  describe('onPress behavior', () => {
    it('should call onPress when card is pressed and showActions is false', () => {
      const onPressMock = jest.fn();
      const { getByText } = render(
        <SeriesCard series={mockSeries} onPress={onPressMock} showActions={false} />
      );

      const seriesName = getByText('Summer Championship');
      fireEvent.press(seriesName);

      expect(onPressMock).toHaveBeenCalledTimes(1);
    });

    it('should call onPress when card is pressed and showActions is true', () => {
      const onPressMock = jest.fn();
      const { getByText } = render(
        <SeriesCard series={mockSeries} onPress={onPressMock} showActions={true} />
      );

      const seriesName = getByText('Summer Championship');
      fireEvent.press(seriesName);

      expect(onPressMock).toHaveBeenCalledTimes(1);
    });

    it('should not be pressable when onPress is not provided', () => {
      const { getByText } = render(
        <SeriesCard series={mockSeries} showActions={false} />
      );

      // This should not throw an error
      const seriesName = getByText('Summer Championship');
      expect(() => fireEvent.press(seriesName)).not.toThrow();
    });
  });

  describe('series display', () => {
    it('should display series name', () => {
      const { getByText } = render(<SeriesCard series={mockSeries} />);

      expect(getByText('Summer Championship')).toBeTruthy();
    });

    it('should display series description when available', () => {
      const { getByText } = render(<SeriesCard series={mockSeries} />);

      expect(getByText('Weekly tournament series')).toBeTruthy();
    });

    it('should not crash when description is missing', () => {
      const seriesWithoutDesc = { ...mockSeries, description: null };
      const { queryByText } = render(<SeriesCard series={seriesWithoutDesc} />);

      expect(queryByText('Weekly tournament series')).toBeNull();
    });

    it('should display Active badge when status is active', () => {
      const { getByText } = render(<SeriesCard series={mockSeries} />);

      expect(getByText('Active')).toBeTruthy();
    });

    it('should display Completed badge when status is completed', () => {
      const completedSeries = { ...mockSeries, status: 'completed' as const };
      const { getByText } = render(<SeriesCard series={completedSeries} />);

      expect(getByText('Completed')).toBeTruthy();
    });

    it('should display match count with singular form and proper capitalization', () => {
      const singleMatchSeries = { ...mockSeries, matchCount: 1 };
      const { getByText } = render(<SeriesCard series={singleMatchSeries} />);

      expect(getByText('1 Match')).toBeTruthy();
    });

    it('should display match count with plural form and proper capitalization', () => {
      const { getByText } = render(<SeriesCard series={mockSeries} />);

      expect(getByText('5 Matches')).toBeTruthy();
    });

    it('should display player count with singular form and proper capitalization', () => {
      const singlePlayerSeries = { ...mockSeries, playerCount: 1 };
      const { getByText } = render(<SeriesCard series={singlePlayerSeries} />);

      expect(getByText('1 Player')).toBeTruthy();
    });

    it('should display player count with plural form and proper capitalization', () => {
      const { getByText } = render(<SeriesCard series={mockSeries} />);

      expect(getByText('8 Players')).toBeTruthy();
    });

    it('should display game type with proper capitalization', () => {
      const { getByText } = render(<SeriesCard series={mockSeries} />);

      expect(getByText('Darts')).toBeTruthy();
    });

    it('should properly capitalize non-numeric game types', () => {
      const poolSeries = { ...mockSeries, gameType: 'pool' as const };
      const { getByText } = render(<SeriesCard series={poolSeries} />);

      expect(getByText('Pool')).toBeTruthy();
    });

    it('should display start date', () => {
      const { getByText } = render(<SeriesCard series={mockSeries} />);

      // The date format will vary, but it should contain "Started"
      expect(getByText(/Started/)).toBeTruthy();
    });
  });
});
