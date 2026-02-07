# UI + Color Consistency Audit

Date: 2026-02-06  
Scope: Current working tree, all app + marketing UI (`src/components`, `src/views`)  
Policy: Strict token-only color system

## Remediation Status (Implemented)

- `dark_variant_usage`: `0`
- `invalid_hsl_var_usage`: `0`
- `hardcoded_tailwind_hues`: `0`
- `hex_literal_colors`: `0` (brand-exempt file remains excluded by script)
- `literal_white_usage`: `0`
- Guardrail check: `scripts/check-ui-color-consistency.sh` returns `PASS`.
- Build: `npm run build` passes.

## Method

- Static source audit with `rg` classification for token bypass patterns.
- Route/surface review across dashboard, entry, stats, goals, settings, auth, landing/about.
- Theme mechanism review across `ThemeContext`, Tailwind config, and CSS token definitions.
- Build sanity check (`npm run build`) to validate compile-time warnings and runtime packaging.

## Inventory

- `invalid_hsl_var`: `20`
- `dark_variant`: `23`
- `hardcoded_tailwind_hues`: `45`
- `hex_literals_components_views_constants`: `30`
- `inline_style_color_bg_border`: `23`

Top concentration:

- Hardcoded Tailwind hues: `src/components/groups/GroupSelector.tsx`, `src/components/ImportantDays/ImportantDaysList.tsx`, `src/components/stats/StreakChain.tsx`, `src/components/settings/ExportData.tsx`
- `dark:` variants: `src/components/ImportantDays/ImportantDaysList.tsx`, `src/views/EntryView.tsx`, `src/views/AboutPage.tsx`, `src/components/settings/ImportData.tsx`
- `hsl(var(--...))`: `src/components/MarkdownArea.tsx` (dominant), `src/components/stats/StatisticsView.tsx`

## Findings

### Critical

1. Dark-mode mechanism mismatch causes `dark:` styles to be non-functional.
   - Evidence:
   - `tailwind.config.ts:4` uses `darkMode: ["class"]`.
   - `src/contexts/ThemeContext.tsx:80` sets `data-theme`, never sets `.dark`.
   - Many UI files rely on `dark:` variants (for example `src/components/ImportantDays/ImportantDaysList.tsx:47`, `src/views/EntryView.tsx:367`, `src/views/AboutPage.tsx:74`).
   - Impact:
   - Theme-specific dark overrides in Tailwind class strings are not reliably applied, producing inconsistent or incorrect color behavior across themes.
   - Rule violated:
   - Non-functional dark variant + token system divergence.
   - Remediation:
   - Choose one mechanism and enforce globally. Recommended: token/data-theme only and remove `dark:` utilities from app surfaces.

2. Invalid `hsl(var(--...))` usage against hex-backed tokens.
   - Evidence:
   - `src/components/MarkdownArea.tsx:68`
   - `src/components/MarkdownArea.tsx:99`
   - `src/components/MarkdownArea.tsx:116`
   - `src/components/stats/StatisticsView.tsx:257`
   - `src/components/stats/StatisticsView.tsx:266`
   - `src/components/settings/ScaleManager.tsx:190`
   - `src/components/history/EntryModal.tsx:132`
   - Impact:
   - Can resolve to invalid CSS color values and silently fail/fallback; creates unreadable or inconsistent text/graph colors.
   - Rule violated:
   - Invalid color function + token format mismatch.
   - Remediation:
   - Use `var(--token)` directly when token stores hex/rgb color, or migrate all tokens to HSL triplets consistently.

### High

3. Missing semantic token `--warning` causes fallback literals and cross-theme drift.
   - Evidence:
   - `src/constants/appConstants.ts:68` references `var(--warning, #f59e0b)`.
   - `src/index.css:99` defines `--success` and `--danger`, but no `--warning`.
   - Impact:
   - Theme-dependent warning semantics are bypassed; fallback hex becomes de facto color.
   - Rule violated:
   - Incomplete semantic token contract.
   - Remediation:
   - Add `--warning` for root and every theme preset, map Tailwind or semantic usage through it.

4. Hardcoded hue classes bypass token system in core flows.
   - Evidence:
   - `src/components/groups/GroupSelector.tsx:20`
   - `src/components/settings/ExportData.tsx:100`
   - `src/components/settings/ImportData.tsx:107`
   - `src/components/ImportantDays/ImportantDaysList.tsx:47`
   - `src/components/stats/StreakChain.tsx:92`
   - `src/components/Header.tsx:52`
   - `src/views/EntryView.tsx:367`
   - `src/views/LandingPage.tsx:118`
   - `src/views/AboutPage.tsx:74`
   - Impact:
   - Colors stop adapting to theme presets; UI looks inconsistent across ocean/forest/sunset/lavender/midnight/oled/custom.
   - Rule violated:
   - Token bypass.
   - Remediation:
   - Replace hardcoded hue classes with semantic classes mapped to CSS variables (`text-success`, `bg-warning-soft`, etc.).

5. Hardcoded hex literals in runtime logic and defaults create off-theme rendering.
   - Evidence:
   - `src/components/settings/ScaleManager.tsx:30`
   - `src/views/UiDemo.tsx:47`
   - `src/constants/scaleConstants.ts:7`
   - `src/components/stats/statisticsViewUtils.ts:127`
   - `src/utils/passwordValidation.ts:76`
   - `src/components/entry/VoiceRecorder.tsx:100`
   - Impact:
   - Theme contract is bypassed and accessibility varies by preset.
   - Rule violated:
   - Literal color leakage.
   - Remediation:
   - Replace with semantic vars and only keep hardcoded values for explicitly documented brand exemptions.

6. Non-token purple/violet accents conflict with strict palette direction.
   - Evidence:
   - `src/views/LandingPage.tsx:110` (`to-purple-500`)
   - `src/views/EntryView.tsx:507` (`to-violet-600`)
   - Impact:
   - Intentional theme palette is overridden by fixed purple accents.
   - Rule violated:
   - Palette inconsistency.
   - Remediation:
   - Use gradient stops from theme tokens only (`from-primary`, `to-accent`, or CSS vars).

### Medium

7. Scale progress color plumbing is inconsistent between caller and primitive.
   - Evidence:
   - Caller sets `--progress-background`: `src/components/history/EntryModal.tsx:132`.
   - Primitive ignores that var and always uses `bg-primary`: `src/components/ui/progress.tsx:23`.
   - Impact:
   - Scale-specific colors do not render as intended.
   - Rule violated:
   - Inconsistent component contract for color semantics.
   - Remediation:
   - Add `indicatorStyle` or explicit `indicatorClassName` usage path; remove dead custom prop patterns.

8. Excessive inline style color usage limits enforceability.
   - Evidence:
   - `src/views/AchievementsView.tsx:171`
   - `src/components/goals/AddGoalCard.tsx:48`
   - `src/components/stats/MoodStability.tsx:98`
   - `src/components/mood/MoodDisplay.tsx:20`
   - Impact:
   - Color governance and linting become harder; drift risk rises.
   - Rule violated:
   - Styling inconsistency.
   - Remediation:
   - Move to token-backed classnames or typed style helpers.

### Low

9. Build warning indicates ambiguous utility syntax.
   - Evidence:
   - Build warns on `duration-[180ms]`.
   - Impact:
   - Minor maintainability risk; not a direct color bug.
   - Remediation:
   - Normalize to `duration-200` or escaped arbitrary value syntax.

## Theme Matrix Verification

Verification mode: static source verification + build check.

- `light`: token set exists; blocked by hardcoded hues/literals.
- `dark`: token set exists; `dark:` utilities unreliable due `.dark` mismatch.
- `ocean`: token set exists; hardcoded green/red/amber/yellow/indigo classes bypass theme.
- `forest`: token set exists; same bypass pattern.
- `sunset`: token set exists; same bypass pattern.
- `lavender`: token set exists; same bypass pattern.
- `midnight`: token set exists; same bypass pattern.
- `oled`: token set exists; same bypass pattern and literal whites in components can clash.
- `custom`: extends dark base only for accent vars (`src/contexts/ThemeContext.tsx:64`), but hardcoded colors remain outside custom control.

Result: systemic failures are cross-theme and originate from token bypass + dark mechanism mismatch.

## Per-File Finding Map (Key Files)

- `src/components/MarkdownArea.tsx`: invalid color function (`hsl(var(--...))`) repeated.
- `src/components/stats/StatisticsView.tsx`: invalid color function + literal `#fff` inline color.
- `src/components/groups/GroupSelector.tsx`: hardcoded hue-class palette.
- `src/components/ImportantDays/ImportantDaysList.tsx`: hardcoded hues + `dark:` reliance.
- `src/components/settings/ExportData.tsx`: hardcoded hues + `dark:` reliance.
- `src/components/settings/ImportData.tsx`: hardcoded hues + `dark:` reliance.
- `src/components/stats/StreakChain.tsx`: hardcoded orange/yellow classes.
- `src/views/EntryView.tsx`: hardcoded status hues + fixed violet gradient.
- `src/views/LandingPage.tsx`: fixed purple/indigo/orange hues + `dark:` reliance.
- `src/views/AboutPage.tsx`: fixed yellow callout + `dark:` reliance.
- `src/constants/appConstants.ts`: references missing semantic token `--warning`.
- `src/components/history/EntryModal.tsx`: dead progress color contract + `dark:prose-invert`.
- `src/components/settings/ScaleManager.tsx`: hex palette defaults + invalid fallback color function.

## Fix Plan

### Phase 1: Token Contract + Theme Mechanism

- Add missing semantic tokens in `src/index.css` for all themes: `--warning`, `--info`, and optional soft variants.
- Align dark mode strategy:
- Option A (recommended): token/data-theme-only; remove all `dark:` utilities from app code.
- Option B: class mode; set/remove `.dark` class in `ThemeContext` in sync with theme state.
- Replace all `hsl(var(--...))` where vars are hex with `var(--...)`.

### Phase 2: Shared Primitive and Repeated Pattern Cleanup

- Refactor `Progress` to support semantic indicator token inputs.
- Replace repeated hardcoded status hue classes with semantic utility aliases.
- Convert direct hex fallbacks to semantic vars.

### Phase 3: Route-Level Conversion

- Entry, stats, settings, landing/about, and important-days components.
- Remove `dark:` usages and replace with token-safe classes.
- Replace fixed purple/violet gradients with token-driven gradients.

### Phase 4: Guardrails

- Add lint/check script that fails on:
- `dark:` usage in app surfaces (if token/data-theme strategy selected).
- `hsl(var(--` usage with hex token architecture.
- hardcoded hue utility classes and non-exempt hex literals.
- Add CI job for the check.
- Baseline script added: `scripts/check-ui-color-consistency.sh`.

## Interfaces / Types To Add

- `ThemeTokens` type defining required semantic tokens per theme.
- `SemanticColorToken` union for shared UI props.
- typed status-to-token map utility (for badges/callouts/charts).

## Acceptance Status Against Requested Criteria

- No unresolved Critical/High issues: `FAIL` (multiple open).
- No invalid `hsl(var(--...))` usages: `FAIL`.
- No non-exempt hardcoded palette classes/hex: `FAIL`.
- Dark mode internally consistent: `FAIL`.
- Findings include `file:line` and phased plan: `PASS`.

## Notes

- `npm run build` passes; primary output warnings were chunk-size advisories and one ambiguous utility warning.
- Brand-exempt literals can remain only if documented (for example `src/components/auth/GoogleIcon.tsx`).
