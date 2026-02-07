# Nightlio - Mood Tracking App

## Quick Reference

### Build & Test
- `npm run build` - Production build (also validates TypeScript)
- `npm run test:ui` - Run Vitest frontend tests
- `PYTHONPATH=. pytest api/tests/ -v` - Run backend tests

### Development
- `npm run dev` - Start frontend dev server
- `cd api && python app.py` - Start backend server

### Project Structure
- `src/` - React/TypeScript frontend (Vite)
- `api/` - Flask/Python backend with SQLite
- `src/types/entry.ts` - Shared entry types (BaseEntry, EntryWithSelections, HistoryEntry)
- `src/services/api/` - API client with typed interfaces

## Backend Conventions

### Architecture Layers
- Routes (`api/routes/`) - HTTP handlers, use validators and services
- Services (`api/services/`) - Business logic, instantiated in app.py
- Database (`api/database_*.py`) - Data access layer
- Validators (`api/validators/`) - Request validation with dataclasses
- Response utilities (`api/utils/responses.py`) - success_response, error_response, not_found_response

### Patterns
- Routes should use service layer, not call `db.*` directly
- Use `@require_auth` decorator on protected routes
- Use validators for request data: `validated = MoodEntryCreate(**data)`
- Use response utilities: `return success_response(data=result)`

## Frontend Conventions

### TypeScript
- Migration 94% complete (170 TS files, 11 JS remaining - mostly tests)
- Use shared types from `src/types/entry.ts` - don't define local `interface Entry`
- API types exported from `src/services/api.ts` (MoodEntry, Goal, User, etc.)
- Avoid `as any` - use proper type aliases or extend interfaces
- Check types with `npm run build` (no separate typecheck script)

### UI/UX
- Use `useToast()` for notifications - never `window.alert()`
- Touch targets minimum 44x44px (`h-11 w-11 min-h-[44px] min-w-[44px]`)
- shadcn/ui components in `src/components/ui/`

### State
- AuthContext, ConfigContext, LockContext, MoodDefinitionsContext in `src/contexts/`
- API hooks in `src/hooks/` (useGoalCompletion, useScales, etc.)
