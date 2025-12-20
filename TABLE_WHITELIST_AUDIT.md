# Database Table Whitelist Audit

## Summary
Comprehensive audit and fix of the database table whitelist to prevent "Invalid table name" errors during runtime.

## Issues Found and Fixed

### 1. Missing Tables in Whitelist
**Problem:** Tables existed in schema.ts but were missing from ALLOWED_TABLES in queries.ts

**Missing Tables:**
- `week_attendance` - Caused attendance saving to fail
- `tournaments` - Caused tournament creation to fail  
- `tournament_matches` - Would have caused tournament bracket errors

### 2. Legacy Table in Whitelist
**Problem:** Table existed in ALLOWED_TABLES but not in schema.ts
- `player_season_weeks` - Removed (legacy table, no longer used)

### 3. Inconsistent Return Type
**Problem:** `findById()` returned `undefined` but type signature said `T | null`
**Fix:** Updated implementation to convert `undefined` to `null`

## Current State

### All Schema Tables (11 total)
```
✓ custom_game_configs
✓ custom_game_fields
✓ leagues
✓ match_participants
✓ matches
✓ player_leagues
✓ players
✓ seasons
✓ tournament_matches
✓ tournaments
✓ week_attendance
```

### ALLOWED_TABLES in queries.ts
All 11 tables from schema.ts are now in the whitelist (sorted alphabetically)

## Tests Added

### Schema Coverage Tests (`lib/db/__tests__/queries.test.ts`)
1. **Comprehensive Table Test** - Verifies all 11 schema tables can be used with all query functions (insert, update, remove, findById, findAll)
2. **Schema Validation** - Documents expected table count (11 tables)
3. **Security Tests** - Ensures malicious table names are rejected

**Test Results:** 20/20 passing ✓

## Prevention Strategy

### Going Forward
1. When adding a new table to `schema.ts`, **immediately** add it to `ALLOWED_TABLES` in `queries.ts`
2. Run the comprehensive test: `npm test -- --testPathPattern="queries.test"`
3. The test will fail if tables are missing from the whitelist

### Code Comments Added
Added clear comment in queries.ts:
```typescript
// IMPORTANT: This list must match ALL tables defined in schema.ts
```

## Files Modified
- `lib/db/queries.ts` - Fixed ALLOWED_TABLES, fixed findById return type
- `lib/db/__tests__/queries.test.ts` - Added comprehensive schema coverage tests
- `lib/games/__tests__/pool.test.ts` - Fixed boolean type issues
- `lib/games/pool.ts` - Fixed variant display bug

## Test Coverage
- **Total Tests:** 87 (79 passing in main test suite)
- **Queries Module:** 20/20 passing ✓
- **Pool Game:** 21/21 passing ✓
- **Custom Games:** 15/15 passing ✓

## Verification Checklist
- [x] All schema tables in ALLOWED_TABLES
- [x] No legacy tables in ALLOWED_TABLES
- [x] Comprehensive tests for all tables
- [x] Security tests for SQL injection prevention
- [x] Type consistency (null vs undefined)
- [x] All query tests passing
