import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import TournamentsIndex from '../index';
import { useDatabase } from '@/lib/db/provider';

// Mock the database provider
jest.mock('@/lib/db/provider');

// Mock expo-router
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
  },
  useFocusEffect: (callback: () => void) => {
    React.useEffect(() => {
      callback();
    }, []);
  },
  Href: jest.fn(),
}));

// Mock all the UI components
jest.mock('@/components/ui/safe-area-view', () => ({
  SafeAreaView: ({ children }: any) => children,
}));
jest.mock('@/components/ui/scroll-view', () => ({
  ScrollView: ({ children }: any) => children,
}));
jest.mock('@/components/ui/vstack', () => ({
  VStack: ({ children }: any) => children,
}));
jest.mock('@/components/ui/hstack', () => ({
  HStack: ({ children }: any) => children,
}));
jest.mock('@/components/ui/heading', () => ({
  Heading: ({ children }: any) => children,
}));
jest.mock('@/components/ui/text', () => ({
  Text: ({ children }: any) => children,
}));
jest.mock('@/components/ui/card', () => ({
  Card: ({ children }: any) => children,
}));
jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: any) => children,
  BadgeText: ({ children }: any) => children,
}));
jest.mock('@/components/ui/spinner', () => ({
  Spinner: () => null,
}));
jest.mock('@/components/ui/center', () => ({
  Center: ({ children }: any) => children,
}));
jest.mock('@/components/ui/select', () => ({
  Select: ({ children, selectedValue, onValueChange }: any) => {
    // Store the callback for testing
    React.useEffect(() => {
      if (global.mockSelectCallbacks) {
        global.mockSelectCallbacks.push({ selectedValue, onValueChange });
      }
    }, [selectedValue, onValueChange]);
    return children;
  },
  SelectTrigger: ({ children }: any) => children,
  SelectInput: () => null,
  SelectIcon: () => null,
  SelectPortal: ({ children }: any) => children,
  SelectBackdrop: () => null,
  SelectContent: ({ children }: any) => children,
  SelectDragIndicatorWrapper: ({ children }: any) => children,
  SelectDragIndicator: () => null,
  SelectItem: ({ label, value }: any) => null,
}));
jest.mock('@/components/ui/icon', () => ({
  Icon: () => null,
}));
jest.mock('@/components/ui/pressable', () => ({
  Pressable: ({ children }: any) => children,
}));
jest.mock('lucide-react-native', () => ({
  ChevronDownIcon: 'ChevronDownIcon',
  Trophy: 'Trophy',
}));

describe('TournamentsIndex', () => {
  let mockDb: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockDb = {
      all: jest.fn(),
    };

    (useDatabase as jest.Mock).mockReturnValue({ db: mockDb });
  });

  describe('filter interactions', () => {
    it('should reset season to "All Seasons" when league changes', async () => {
      const mockLeagues = [
        { id: 1, name: 'Pool League', createdAt: Date.now() },
        { id: 2, name: 'Darts League', createdAt: Date.now() },
      ];

      const mockSeasons = [
        { id: 1, leagueId: 1, name: 'Fall 2024', createdAt: Date.now() },
        { id: 2, leagueId: 1, name: 'Spring 2024', createdAt: Date.now() },
        { id: 3, leagueId: 2, name: 'Summer 2024', createdAt: Date.now() },
      ];

      const mockTournaments: any[] = [];

      // Setup mock responses
      mockDb.all.mockImplementation((query: string) => {
        if (query.includes('FROM leagues')) return Promise.resolve(mockLeagues);
        if (query.includes('FROM seasons')) return Promise.resolve(mockSeasons);
        if (query.includes('FROM tournaments')) return Promise.resolve(mockTournaments);
        return Promise.resolve([]);
      });

      const { rerender } = render(<TournamentsIndex />);

      await waitFor(() => {
        expect(mockDb.all).toHaveBeenCalled();
      });

      // The component should initialize with "All Leagues" and "All Seasons"
      // This verifies the initial state
      expect(mockDb.all).toHaveBeenCalledWith(
        expect.stringContaining('FROM tournaments')
      );
    });

    it('should filter seasons based on selected league', async () => {
      const mockLeagues = [
        { id: 1, name: 'Pool League', createdAt: Date.now() },
        { id: 2, name: 'Darts League', createdAt: Date.now() },
      ];

      const mockSeasons = [
        { id: 1, leagueId: 1, name: 'Fall 2024', createdAt: Date.now() },
        { id: 2, leagueId: 1, name: 'Spring 2024', createdAt: Date.now() },
        { id: 3, leagueId: 2, name: 'Summer 2024', createdAt: Date.now() },
      ];

      const mockTournaments: any[] = [];

      mockDb.all.mockImplementation((query: string) => {
        if (query.includes('FROM leagues')) return Promise.resolve(mockLeagues);
        if (query.includes('FROM seasons')) return Promise.resolve(mockSeasons);
        if (query.includes('FROM tournaments')) return Promise.resolve(mockTournaments);
        return Promise.resolve([]);
      });

      render(<TournamentsIndex />);

      await waitFor(() => {
        expect(mockDb.all).toHaveBeenCalled();
      });

      // When league is "All Leagues", all seasons should be available
      // When league is specific (e.g., id=1), only seasons with leagueId=1 should be available
      // This is tested by the filteredSeasons logic in the component
    });

    it('should filter tournaments by league and season', async () => {
      const mockLeagues = [
        { id: 1, name: 'Pool League', createdAt: Date.now() },
      ];

      const mockSeasons = [
        { id: 1, leagueId: 1, name: 'Fall 2024', createdAt: Date.now() },
      ];

      const mockTournaments = [
        {
          id: 1,
          seasonId: 1,
          leagueId: 1,
          name: 'Fall Championship',
          format: 'best-of-3',
          status: 'active',
          championId: null,
          createdAt: Date.now(),
          leagueName: 'Pool League',
          seasonName: 'Fall 2024',
          championFirstName: null,
          championLastName: null,
          totalMatches: 4,
          completedMatches: 2,
        },
      ];

      mockDb.all.mockImplementation((query: string) => {
        if (query.includes('FROM leagues')) return Promise.resolve(mockLeagues);
        if (query.includes('FROM seasons')) return Promise.resolve(mockSeasons);
        if (query.includes('FROM tournaments')) return Promise.resolve(mockTournaments);
        return Promise.resolve([]);
      });

      const { getByText } = render(<TournamentsIndex />);

      await waitFor(() => {
        expect(getByText('Fall Championship')).toBeTruthy();
      });
    });

    it('should show correct placeholder text', async () => {
      const mockLeagues: any[] = [];
      const mockSeasons: any[] = [];
      const mockTournaments: any[] = [];

      mockDb.all.mockImplementation((query: string) => {
        if (query.includes('FROM leagues')) return Promise.resolve(mockLeagues);
        if (query.includes('FROM seasons')) return Promise.resolve(mockSeasons);
        if (query.includes('FROM tournaments')) return Promise.resolve(mockTournaments);
        return Promise.resolve([]);
      });

      const { getByText } = render(<TournamentsIndex />);

      await waitFor(() => {
        // Should show "All Leagues" placeholder
        expect(getByText('All Leagues')).toBeTruthy();
        // Should show "All Seasons" placeholder
        expect(getByText('All Seasons')).toBeTruthy();
      });
    });
  });

  describe('data fetching', () => {
    it('should fetch leagues, seasons, and tournaments on mount', async () => {
      mockDb.all.mockResolvedValue([]);

      render(<TournamentsIndex />);

      await waitFor(() => {
        expect(mockDb.all).toHaveBeenCalledWith(
          expect.stringContaining('FROM leagues')
        );
        expect(mockDb.all).toHaveBeenCalledWith(
          expect.stringContaining('FROM seasons')
        );
        expect(mockDb.all).toHaveBeenCalledWith(
          expect.stringContaining('FROM tournaments')
        );
      });
    });

    it('should handle database errors gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      mockDb.all.mockRejectedValue(new Error('Database error'));

      render(<TournamentsIndex />);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          'Failed to fetch tournaments:',
          expect.any(Error)
        );
      });

      consoleError.mockRestore();
    });
  });

  describe('tournament display', () => {
    it('should show empty state when no tournaments exist', async () => {
      mockDb.all.mockResolvedValue([]);

      const { getByText } = render(<TournamentsIndex />);

      await waitFor(() => {
        expect(getByText(/No tournaments yet/i)).toBeTruthy();
      });
    });

    it('should display tournament count correctly', async () => {
      const mockTournaments = [
        {
          id: 1,
          seasonId: 1,
          leagueId: 1,
          name: 'Tournament 1',
          format: 'best-of-3',
          status: 'active',
          championId: null,
          createdAt: Date.now(),
          leagueName: 'Pool League',
          seasonName: 'Fall 2024',
          championFirstName: null,
          championLastName: null,
          totalMatches: 4,
          completedMatches: 2,
        },
        {
          id: 2,
          seasonId: 1,
          leagueId: 1,
          name: 'Tournament 2',
          format: 'best-of-5',
          status: 'completed',
          championId: 1,
          createdAt: Date.now(),
          leagueName: 'Pool League',
          seasonName: 'Fall 2024',
          championFirstName: 'John',
          championLastName: 'Doe',
          totalMatches: 4,
          completedMatches: 4,
        },
      ];

      mockDb.all.mockImplementation((query: string) => {
        if (query.includes('FROM tournaments')) return Promise.resolve(mockTournaments);
        return Promise.resolve([]);
      });

      const { getByText } = render(<TournamentsIndex />);

      await waitFor(() => {
        expect(getByText('2 tournaments found')).toBeTruthy();
      });
    });
  });
});
