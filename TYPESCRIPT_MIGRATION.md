# TypeScript Migration Guide

This document outlines the strategy for migrating Twilightio from JavaScript to TypeScript.

## Current Status

✅ **Setup Complete** (as of this migration)
- `tsconfig.json` and `tsconfig.node.json` configured
- Type definitions installed (`@types/react`, `@types/react-dom`)
- Vite configured to handle both `.js/.jsx` and `.ts/.tsx` files

✅ **Migrated Files**
- `src/services/api.js` → `api.ts` (with comprehensive type definitions)
- `src/contexts/AuthContext.jsx` → `AuthContext.tsx`
- `src/components/auth/LoginPage.jsx` → `LoginPage.tsx`
- `src/components/auth/ProtectedRoute.jsx` → `ProtectedRoute.tsx`

## Migration Strategy

We're using a **gradual migration approach**:

1. **All NEW code**: Write in TypeScript from now on
2. **Priority files**: Migrate critical paths first (API service, contexts, auth components)
3. **Opportunistic migration**: Convert files when you're already modifying them
4. **No pressure**: Old `.jsx` files can stay until needed

## TypeScript Configuration

### Current Settings (Lenient)

```json
{
  "strict": false,           // Allows gradual adoption
  "allowJs": true,           // JS and TS can coexist
  "checkJs": false,          // Don't type-check JS files
  "noUnusedLocals": false,   // Lenient for now
  "noUnusedParameters": false
}
```

### Future Improvements

Once 50%+ of the codebase is migrated, consider enabling:
- `"strict": true` - Full type safety
- `"noUnusedLocals": true` - Catch unused variables
- `"noUnusedParameters": true` - Catch unused function parameters

## How to Migrate a File

### 1. Rename the File
```bash
# For components
mv src/components/Example.jsx src/components/Example.tsx

# For non-component files
mv src/utils/helper.js src/utils/helper.ts
```

### 2. Add Type Imports

For API types, import from the api service:
```typescript
import apiService, { MoodEntry, Goal, User } from '../services/api';
```

Common type imports:
```typescript
import { ReactNode, useState, useEffect } from 'react';
```

### 3. Type Component Props

```typescript
// Before (JavaScript)
const MyComponent = ({ title, count, children }) => {
  // ...
};

// After (TypeScript)
interface MyComponentProps {
  title: string;
  count: number;
  children?: ReactNode;
}

const MyComponent = ({ title, count, children }: MyComponentProps) => {
  // ...
};
```

### 4. Type Hooks and State

```typescript
// State with explicit type
const [user, setUser] = useState<User | null>(null);

// State with inferred type (when initial value is clear)
const [isLoading, setIsLoading] = useState(false); // inferred as boolean

// Arrays
const [entries, setEntries] = useState<MoodEntry[]>([]);
```

### 5. Type Function Parameters

```typescript
// Before
const handleSubmit = (entryId, data) => {
  // ...
};

// After
const handleSubmit = (entryId: number, data: CreateMoodEntryData) => {
  // ...
};
```

### 6. Handle Common Patterns

#### Event Handlers
```typescript
import { MouseEvent, ChangeEvent } from 'react';

const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
  // ...
};

const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
  // ...
};
```

#### useCallback with types
```typescript
const handleSave = useCallback((entry: MoodEntry) => {
  // ...
}, [dependencies]);
```

#### Context Values
```typescript
interface MyContextValue {
  data: string[];
  loading: boolean;
  refresh: () => Promise<void>;
}

const MyContext = createContext<MyContextValue | undefined>(undefined);
```

## Available Types

All API types are exported from `src/services/api.ts`:

### Core Types
- `User` - User account data
- `MoodEntry` - Mood journal entry
- `CreateMoodEntryData` - Data for creating entries
- `UpdateMoodEntryData` - Data for updating entries

### Statistics & Streaks
- `Statistics` - User mood statistics
- `Streak` - Current and best streak
- `StreakDetails` - Detailed streak information

### Groups & Options
- `Group` - Custom activity group
- `GroupOption` - Activity option within a group
- `CreateGroupData` - Data for creating groups
- `CreateGroupOptionData` - Data for creating options

### Goals
- `Goal` - User goal
- `CreateGoalData` - Data for creating goals
- `UpdateGoalData` - Data for updating goals
- `GoalCompletion` - Goal completion record

### Media
- `Media` - Photo/video/audio media
- `GalleryPhoto` - Gallery photo with entry metadata

### Analytics
- `Correlation` - Activity-mood correlation
- `CoOccurrence` - Activity co-occurrence data
- `MoodStability` - Mood stability metrics
- `AdvancedCorrelation` - Advanced correlation analysis

### Scales
- `Scale` - Custom rating scale
- `ScaleEntry` - Scale rating entry
- `CreateScaleData` - Data for creating scales
- `UpdateScaleData` - Data for updating scales

### Important Days
- `ImportantDay` - Important date/countdown
- `CreateImportantDayData` - Data for creating important days
- `UpdateImportantDayData` - Data for updating important days

### Other
- `Achievement` - User achievement
- `AchievementProgress` - Achievement progress data
- `MoodDefinition` - Custom mood label/color definition
- `UserSettings` - User settings including security
- `PublicConfig` - Public app configuration

## Migration Priority List

### High Priority (Do Soon)
- [ ] `src/contexts/ThemeContext.jsx`
- [ ] `src/contexts/ConfigContext.jsx`
- [ ] `src/components/Header.jsx`
- [ ] `src/components/FAB.jsx`
- [ ] `src/views/EntryView.jsx` (large file - break into smaller components first)

### Medium Priority (Opportunistic)
- [ ] `src/components/mood/MoodPicker.jsx`
- [ ] `src/components/mood/MoodDisplay.jsx`
- [ ] `src/components/history/HistoryList.jsx`
- [ ] `src/components/goals/GoalsList.jsx`
- [ ] `src/components/stats/StatisticsView.jsx`

### Low Priority (When You Touch Them)
- [ ] UI components (`src/components/ui/*.jsx`)
- [ ] Settings components (`src/components/Settings/*.jsx`)
- [ ] Other feature components

## Common Pitfalls

### 1. Don't Over-Type Initially
```typescript
// ❌ Bad - too verbose
const [value, setValue] = useState<string | number | null | undefined>(null);

// ✅ Good - start simple
const [value, setValue] = useState<string | null>(null);
```

### 2. Use Type Inference
```typescript
// ❌ Bad - unnecessary type annotation
const count: number = 5;

// ✅ Good - TypeScript can infer this
const count = 5;
```

### 3. Avoid `any` When Possible
```typescript
// ❌ Bad - defeats the purpose of TypeScript
const data: any = await apiService.getMoodEntries();

// ✅ Good - use the provided types
const data: MoodEntry[] = await apiService.getMoodEntries();
```

### 4. Handle Null/Undefined Properly
```typescript
// ❌ Bad - might crash
const userName = user.name;

// ✅ Good - safe access
const userName = user?.name ?? 'Guest';
```

## Testing TypeScript Code

Tests can stay as `.test.jsx` for now. When migrating tests:

1. Rename to `.test.tsx`
2. Add types to test data
3. Type render results:

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent title="Test" count={5} />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
```

## VSCode Tips

### Enable TypeScript Checking
Add to `.vscode/settings.json`:
```json
{
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true
}
```

### Helpful Extensions
- **ESLint** - Linting
- **Error Lens** - Inline error display
- **Pretty TypeScript Errors** - Better error messages

## Getting Help

### Type Errors
When you see a type error:
1. Read the error message carefully (it's usually helpful!)
2. Check if you're using the right type from `api.ts`
3. Use TypeScript's type inference: hover over variables in VSCode
4. If stuck, use `// @ts-expect-error` temporarily and add a TODO comment

### Resources
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- Existing migrated files in this codebase (api.ts, AuthContext.tsx, etc.)

## Rollback Plan

If TypeScript causes issues:

1. **Partial rollback**: Keep `.ts/.tsx` files that work, rename problematic ones back to `.js/.jsx`
2. **Full rollback**: Delete `tsconfig.json` and `tsconfig.node.json`, rename all `.ts/.tsx` back to `.js/.jsx`

The gradual approach means you can always pause or slow down the migration.

## Progress Tracking

Run this to see migration progress:
```bash
# Count TypeScript files
find src -name "*.tsx" -o -name "*.ts" | wc -l

# Count JavaScript files
find src -name "*.jsx" -o -name "*.js" | wc -l
```

Current status: **4 TS files** created, **~75+ JS files** remaining

---

**Remember**: TypeScript is a tool to help you, not hinder you. Start simple, add types gradually, and enjoy the improved autocomplete and error catching!
