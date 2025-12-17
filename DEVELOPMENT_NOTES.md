# TheMatch - Development Notes

## Project Overview

TheMatch is a React Native match tracking application built with Expo that supports multiple game types including Pool, Darts, Dominos, and Uno. It tracks matches, players, leagues, seasons, and tournaments with comprehensive statistics.

## Tech Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Database**: SQLite (expo-sqlite)
- **UI Components**: gluestack-ui
- **Navigation**: expo-router (file-based routing)
- **State Management**: React hooks (useState, useEffect, useMemo, useCallback, useFocusEffect)

## Key Features

### 1. Game Type Support

#### Pool (8-Ball/9-Ball)
- Simple win/loss tracking
- Target number of games to win
- Automatic winner detection when target reached

#### Darts (301/501/701/Cricket)
- Round-based scoring
- Target score tracking (301/501/701)
- Automatic winner detection when reaching exactly 0
- Cricket variant support

#### Dominos
- **Pip-based scoring system**:
  - Each game tracks points earned AND domino pips held by losing players
  - Formula: `net score = points earned - pips held`
  - Net scores can be negative (reducing total score)
- Multi-game matches with target score (e.g., 250 points)
- Game-by-game tracking with accordion view
- Automatic winner detection when target score met or exceeded

#### Uno
- **Standard Uno rules implementation**:
  - Winner is the player who went out (0 cards)
  - Winner earns points equal to sum of cards remaining in other players' hands
  - Card point values: Number cards = face value, Draw Two/Skip/Reverse = 20, Wild/Wild Draw Four = 50
- Multi-game matches with target score (e.g., 500 points)
- 2-step game recording process:
  1. Select who went out
  2. Enter remaining cards for other players only
- Auto-calculates winner's points

### 2. Match Types

#### League Matches
- Associated with a specific league
- Only players who are members of that league can participate
- Contributes to league statistics and leaderboards
- Supports seasons and tournaments

#### Standalone Matches
- Not tied to any league
- Any players can participate
- Still tracked in match history
- Useful for casual games or testing

### 3. Match Status

#### Completed Matches
- All games finished
- Winner(s) determined
- Final scores recorded
- Cannot be edited (view only)

#### In-Progress Matches
- Partial game data saved
- Can be continued later via "Continue Match" button
- Winner validation skipped during save
- Useful for matches that span multiple days

### 4. Searchable Dropdowns

**Component**: `SearchableSelect.tsx`

Created to handle large datasets (100+ players) with:
- Real-time search/filter functionality
- Fixed-height scrollable list (400px)
- Search input at top of dropdown
- Empty state message when no results
- Used for: League selection, Player selection

**Key implementation details**:
- Uses `useMemo` for efficient filtering
- Wraps options in ScrollView with fixed height
- Resets search query when dropdown closes
- Supports all standard Select props (size, variant, etc.)

### 5. Database Architecture

#### Schema Overview

**players**
- id, firstName, lastName, createdAt

**leagues**
- id, name, gameType, createdAt

**player_leagues** (junction table)
- playerId, leagueId
- Links players to leagues (many-to-many)

**matches**
- id, gameType, leagueId (nullable), gameData (JSON), winnerId, status, isMakeup, createdAt
- Supports both league and standalone matches
- gameData stores game-specific information as JSON

**seasons**
- id, leagueId, name, startDate, endDate, targetMatchCount

**tournaments**
- id, seasonId, name, startDate, format

**stats**
- Tracks player statistics per league

#### Migration Pattern

All schema changes use migration functions:
```typescript
export async function migrationName(db: Database): Promise<void> {
  // Check if migration needed
  // Preserve existing data
  // Apply schema changes
}
```

**Key Migrations**:
1. `ensureLeagueIdNullable()` - Made leagueId nullable to support standalone matches, added isMakeup column

### 6. Game Data Structures

#### DominosGameData
```typescript
type DominoGame = {
  scores: number[];      // Points earned per player
  pips?: number[];       // Domino pips held (for net calculation)
  winnerId: number;      // Game winner
};

type DominosGameData = {
  games: DominoGame[];
  finalScores: number[]; // Cumulative net scores
  targetScore: number;
};
```

#### UnoGameData
```typescript
type UnoGame = {
  scores: number[];      // Points earned (only winner has non-zero)
  winnerId: number;      // Player who went out
};

type UnoGameData = {
  games: UnoGame[];
  finalScores: number[]; // Cumulative scores
  targetScore: number;
};
```

## Important Code Patterns

### Player Selection for League Matches

When recording a league match, only show players who are members of that league:

```typescript
const leaguePlayers = await getLeaguePlayers(db, league.id);
const playerOptions = leaguePlayers.map(p => ({
  label: `${p.firstName} ${p.lastName}`,
  value: p.id.toString()
}));
```

### Conditional Form Validation

Skip winner validation for in-progress matches:

```typescript
const validateForm = (skipWinnerValidation: boolean = false): boolean => {
  // ... other validation ...

  if (!skipWinnerValidation) {
    const winners = participants.filter((p) => p.isWinner);
    if (winners.length === 0) {
      newErrors.winner = "Please select at least one winner";
    }
  }

  return Object.keys(newErrors).length === 0;
};

const handleSubmit = async (status: 'completed' | 'in_progress' = 'completed') => {
  if (!validateForm(status === 'in_progress')) {
    return;
  }
  // ... save match ...
};
```

### Game Configuration

Each game type has a configuration object:

```typescript
const gameConfigs: Record<GameType, GameConfig> = {
  dominos: {
    name: "Dominos",
    minPlayers: 2,
    maxPlayers: 4,
    hasIndividualScoring: true,
    requiresTargetScore: true,
    defaultTargetScore: 250,
    // ...
  },
  // ... other games
};
```

## UI/UX Best Practices Implemented

1. **Progressive Disclosure**: Game details in Accordion (collapsed by default)
2. **Consistent Heights**: SearchableSelect maintains fixed 400px height
3. **Input Accessibility**: Numeric keyboards for score entry (`keyboardType="number-pad"`)
4. **Status Badges**: Visual indicators for in-progress vs completed matches
5. **Empty States**: Clear messaging when no results found
6. **Real-time Feedback**: Input validation with error messages
7. **Auto-detection**: Automatic winner selection when target score reached

## Key Files

### Forms
- `components/match-forms/DominosMatchForm.tsx` - Dominos game recording with pip tracking
- `components/match-forms/UnoMatchForm.tsx` - Uno game recording with 2-step process
- `components/match-forms/PoolMatchForm.tsx` - Pool game recording
- `components/match-forms/DartsMatchForm.tsx` - Darts game recording

### Screens
- `app/(tabs)/matches/new.tsx` - Main match recording screen (league or standalone)
- `app/(tabs)/matches/[id].tsx` - Match detail view with game breakdown
- `app/(tabs)/matches/[id]/continue.tsx` - Continue in-progress match
- `app/(tabs)/leagues/[id]/seasons/[seasonId].tsx` - Season view with quick match recording

### Database
- `lib/db/client.ts` - Database client setup
- `lib/db/provider.tsx` - Database context provider with migrations
- `lib/db/migrations.ts` - All schema migrations
- `lib/db/matches.ts` - Match CRUD operations
- `lib/db/queries.ts` - Generic query helpers

### Game Logic
- `lib/games/dominos.ts` - Dominos game configuration and scoring
- `lib/games/uno.ts` - Uno game configuration and scoring
- `lib/games/pool.ts` - Pool game configuration
- `lib/games/darts.ts` - Darts game configuration
- `lib/games/types.ts` - Shared game type definitions

### Components
- `components/SearchableSelect.tsx` - Reusable searchable dropdown with fixed height
- `components/ui/*` - gluestack-ui component exports

## Known Issues & Solutions

### Issue: SearchableSelect not scrollable with large datasets
**Solution**: Wrapped options in ScrollView with fixed height (400px)

### Issue: Dominos scoring didn't account for pips held
**Solution**: Added optional `pips` array to track points held, calculate net scores

### Issue: Uno scoring UX confusing (asking for winner's cards)
**Solution**: 2-step process - select winner first, then only ask for other players' cards

### Issue: Dropdown menus not suitable for exact number entry
**Solution**: Replaced Select dropdowns with numeric Input fields for score entry

### Issue: Test players not showing in league match recording
**Solution**: Seed function now automatically adds test players to all leagues via player_leagues table

## Development Guidelines

1. **Always read files before editing** - Never propose changes to code you haven't read
2. **Use specialized tools** - Read/Edit/Write tools for files, not bash commands
3. **Validate assumptions** - If uncertain about behavior, test or ask
4. **Follow existing patterns** - Match the codebase's established conventions
5. **Type safety** - Always use TypeScript types, no `any` unless absolutely necessary
6. **Database changes require migrations** - Never modify schema without migration function
7. **Test with realistic data** - Use large datasets to catch scalability issues early

## Future Considerations

1. **Performance Optimization**:
   - Consider FlatList virtualization for SearchableSelect with 1000+ items
   - Implement pagination for match lists if they grow large

2. **Offline Support**:
   - SQLite already provides offline-first architecture
   - Consider sync mechanism if cloud backup needed

3. **Statistics Dashboard**:
   - Aggregate stats across all matches
   - Win/loss ratios, scoring averages, head-to-head records

4. **Export/Import**:
   - Backup database to file
   - Share match results

## Testing Strategy

- Created test data generator (now removed) that added 100 players
- Test with maximum player counts for each game type
- Test with various score scenarios (negative scores, exact target hits, etc.)
- Test in-progress workflow (save partial, continue later, complete)
- Test both league and standalone match flows

## Git Workflow

Current branch: `main`

Modified files (from last git status):
- Match recording forms (Darts, Dominos, Pool, Uno)
- Database migrations and schema
- Game type configurations
- Match viewing screens
- SearchableSelect component

Recent commits focused on:
- Game type scoring implementations
- Tournament and season features
- Stats tracking
- Device builds
