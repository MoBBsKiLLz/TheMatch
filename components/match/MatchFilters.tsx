import React from 'react';
import { VStack } from '@/components/ui/vstack';
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
import { ChevronDownIcon } from '@/components/ui/icon';
import { League } from '@/types/league';
import { Season } from '@/types/season';

interface MatchFiltersProps {
  leagues: League[];
  seasons: Season[];
  selectedLeague: string;
  selectedSeason: string;
  onLeagueChange: (value: string) => void;
  onSeasonChange: (value: string) => void;
}

export function MatchFilters({
  leagues,
  seasons,
  selectedLeague,
  selectedSeason,
  onLeagueChange,
  onSeasonChange,
}: MatchFiltersProps) {
  return (
    <VStack space="md">
      {/* League Filter - Always show (includes standalone option) */}
      <Select
        selectedValue={selectedLeague}
        onValueChange={onLeagueChange}
      >
        <SelectTrigger variant="outline" size="lg">
          <SelectInput
            className="flex-1"
            placeholder="Filter by league"
            value={
              selectedLeague === 'all'
                ? 'All Matches'
                : selectedLeague === 'standalone'
                ? 'Standalone Matches'
                : leagues.find((l) => String(l.id) === selectedLeague)?.name || ''
            }
          />
          <SelectIcon as={ChevronDownIcon} className="ml-auto mr-3" />
        </SelectTrigger>
        <SelectPortal>
          <SelectBackdrop />
          <SelectContent>
            <SelectDragIndicatorWrapper>
              <SelectDragIndicator />
            </SelectDragIndicatorWrapper>
            <SelectItem label="All Matches" value="all" />
            <SelectItem label="Standalone Matches" value="standalone" />
            {leagues.map((league) => (
              <SelectItem
                key={league.id}
                label={league.name}
                value={String(league.id)}
              />
            ))}
          </SelectContent>
        </SelectPortal>
      </Select>

      {/* Season Filter */}
      {seasons.length > 0 && (
        <Select
          selectedValue={selectedSeason}
          onValueChange={onSeasonChange}
        >
          <SelectTrigger variant="outline" size="lg">
            <SelectInput
              className="flex-1"
              placeholder="Filter by season"
              value={
                selectedSeason === 'all'
                  ? 'All Seasons'
                  : seasons.find((s) => String(s.id) === selectedSeason)?.name || ''
              }
            />
            <SelectIcon as={ChevronDownIcon} className="ml-auto mr-3" />
          </SelectTrigger>
          <SelectPortal>
            <SelectBackdrop />
            <SelectContent>
              <SelectDragIndicatorWrapper>
                <SelectDragIndicator />
              </SelectDragIndicatorWrapper>
              <SelectItem label="All Seasons" value="all" />
              {seasons.map((season) => (
                <SelectItem
                  key={season.id}
                  label={season.name}
                  value={String(season.id)}
                />
              ))}
            </SelectContent>
          </SelectPortal>
        </Select>
      )}
    </VStack>
  );
}
