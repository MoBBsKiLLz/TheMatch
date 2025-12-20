# Contributing to TheMatch

## Quality Standards

This project maintains **zero-tolerance for errors**. All code must pass validation before being committed.

## Pre-Commit Validation Checklist

Before committing ANY code changes, you MUST run:

```bash
npm run validate
```

This command runs:
1. TypeScript type checking (`npm run type-check`)
2. All tests (`npm test`)

**Both must pass with ZERO errors.**

---

## Validation Workflow

### Step 1: TypeScript Type Checking

```bash
npm run type-check
```

**Expected Output:**
```
✓ No TypeScript errors found
```

**If errors are found:**
- Fix ALL errors before proceeding
- Do NOT dismiss errors as "template errors" or "library errors"
- Every error must be resolved

### Step 2: Run Tests

```bash
npm test
```

**Expected Output:**
```
Test Suites: 12 passed, 12 total
Tests:       174 passed, 174 total
```

**If tests fail:**
- Fix ALL failing tests
- Update tests if behavior intentionally changed
- Add tests for new features

### Step 3: IDE Diagnostics Check

Before considering work complete:

1. Check IDE diagnostics panel for TypeScript errors
2. Verify NO red underlines in modified files
3. Run diagnostics on ALL modified files

---

## Code Quality Requirements

### TypeScript
- ✅ Zero TypeScript errors allowed
- ✅ Use strict typing (no `any` unless absolutely necessary)
- ✅ Define proper interfaces and types
- ✅ All function parameters and returns must be typed

### Testing
- ✅ All tests must pass
- ✅ New features require tests
- ✅ Bug fixes should include regression tests
- ✅ Maintain or improve code coverage

### Error Handling
- ✅ All user-facing errors must have clear messages
- ✅ Database operations must have try/catch
- ✅ Validation errors must be user-friendly
- ✅ No silent failures

### Data Integrity
- ✅ Duplicate prevention on unique fields
- ✅ Cascade delete validation
- ✅ Foreign key references protected
- ✅ Required field validation

### User Experience
- ✅ Empty states with clear guidance
- ✅ Loading states for async operations
- ✅ Success feedback for operations
- ✅ No stuck states (users always have next action)

---

## Development Workflow

### 1. Before Starting Work

```bash
# Ensure clean starting point
npm run validate
git status
```

### 2. During Development

Make changes in small, testable increments:

1. Write/modify code
2. Run `npm run type-check` frequently
3. Check IDE diagnostics panel
4. Run relevant tests (`npm test -- <test-file>`)
5. Fix errors immediately (don't accumulate)

### 3. Before Committing

```bash
# Full validation
npm run validate

# If validation passes:
git add .
git commit -m "feat: descriptive commit message"

# If validation fails:
# FIX ALL ERRORS before committing
```

---

## Common TypeScript Errors and Fixes

### Error: Cannot find name 'X'
**Cause:** Variable used before declaration or typo
**Fix:** Declare variable or fix typo

### Error: Type 'X' is not assignable to type 'Y'
**Cause:** Type mismatch
**Fix:** Update type definition or cast correctly

### Error: Property 'X' does not exist on type 'Y'
**Cause:** Accessing undefined property
**Fix:** Add property to type definition or use optional chaining

### Error: 'X' is possibly 'undefined'
**Cause:** Accessing potentially undefined value
**Fix:** Add null check or use optional chaining (`?.`)

---

## File Organization Standards

### Components
- Keep components focused and single-purpose
- Extract reusable logic into shared components
- Props must be typed with interfaces

### Database Operations
- All queries in `/lib/db/` modules
- Type return values properly
- Handle errors with try/catch
- Use transactions for related operations

### Tests
- One test file per source file
- Group related tests with `describe`
- Clear test names describing behavior
- Mock external dependencies

---

## Git Commit Standards

### Commit Message Format

```
<type>: <subject>

<body>

<footer>
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code restructure without behavior change
- `test`: Adding or updating tests
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `perf`: Performance improvements

### Examples

```bash
git commit -m "feat: add duplicate player name validation

Prevents users from creating players with identical names (case-insensitive).
Shows clear error message when duplicate detected."
```

```bash
git commit -m "fix: resolve undefined seasonPlayers error

Changed seasonPlayers to leaguePlayers in non-round-robin guidance card.
Verified with TypeScript diagnostics and tests."
```

---

## Pull Request Checklist

Before submitting a PR:

- [ ] All TypeScript errors resolved (`npm run type-check` passes)
- [ ] All tests pass (`npm test` passes)
- [ ] New features have tests
- [ ] Code follows project conventions
- [ ] No console.log statements (use proper logging)
- [ ] Error messages are user-friendly
- [ ] Documentation updated if needed
- [ ] No TODOs or FIXMEs in committed code

---

## IDE Setup Recommendations

### VS Code Settings

Add to `.vscode/settings.json`:

```json
{
  "typescript.preferences.importModuleSpecifier": "non-relative",
  "typescript.updateImportsOnFileMove.enabled": "always",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll": true,
    "source.organizeImports": true
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

### Recommended Extensions
- ESLint
- TypeScript and JavaScript Language Features
- Jest Runner
- React Native Tools

---

## Getting Help

If you encounter issues:

1. Check TypeScript error message carefully
2. Review this guide for common solutions
3. Search existing issues
4. Ask for help with specific error details

---

## Zero-Error Policy

**Remember:** This project maintains a **zero-error policy**.

- ❌ No TypeScript errors allowed
- ❌ No failing tests allowed
- ❌ No console errors in runtime
- ❌ No silent failures
- ❌ No dismissing errors as "pre-existing"

✅ **Every error must be fixed before code is committed.**

---

## Questions?

When in doubt, run:

```bash
npm run validate
```

If it passes, you're good to commit. If it fails, fix the errors.

**Quality > Speed. Always.**
