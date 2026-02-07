import { useCallback, useEffect, lazy, Suspense, useMemo, useState, type ComponentType } from 'react';
import { Routes, Route, useNavigate, useLocation, Location, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarCheck2, Flame, Bell, ArrowRight, Sparkles, ShieldAlert, Target, Trophy, TrendingUp, PartyPopper } from 'lucide-react';

import LoginPage from './components/auth/LoginPage';
import NotFound from './views/NotFound';
import { AuthProvider } from './contexts/AuthContext';
import { ConfigProvider } from './contexts/ConfigContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Header from './components/Header';
import Sidebar from './components/navigation/Sidebar';
import BottomNav from './components/navigation/BottomNav';
import DesktopCommandPalette from './components/navigation/DesktopCommandPalette';
import { SmartFAB } from './components/FAB';
import HistoryView from './views/HistoryView';
import HistoryList from './components/history/HistoryList';
import GoalsSection from './components/goals/GoalsSection';
import SettingsView from './views/SettingsView';
import GoalsView from './views/GoalsView';
import { ToastProvider, useToast } from './components/ui/ToastProvider';
import { useMoodData } from './hooks/useMoodData';
import { useGroups } from './hooks/useGroups';
import { useStatistics } from './hooks/useStatistics';
import OfflineIndicator from './components/ui/OfflineIndicator';
import { MoodDefinitionsProvider } from './contexts/MoodDefinitionsContext';
import ReminderManager from './components/reminders/ReminderManager';
import { LockProvider } from './contexts/LockContext';
import LockScreen from './components/auth/LockScreen';
import { useOfflineSync } from './hooks/useOfflineSync';
import ErrorBoundary from './components/ErrorBoundary';
import PageTransition from './components/ui/PageTransition';
import useHotkeys from './hooks/useHotkeys';
import { HistoryEntry, EntryWithSelections } from './types/entry';
import { cn } from '@/lib/utils';
import PageShell from './components/layout/PageShell';
import ResponsiveGrid from './components/layout/ResponsiveGrid';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';
import { getTodayISO, formatISODate } from './utils/dateUtils';
import apiService from './services/api';

// Lazy-loaded heavy routes for reduced initial bundle
const EntryView = lazy(() => import('./views/EntryView'));
const StatisticsView = lazy(() => import('./components/stats/StatisticsView'));
// Lazy-loaded routes for reduced initial bundle
const AchievementsView = lazy(() => import('./views/AchievementsView'));
const AboutPage = lazy(() => import('./views/AboutPage'));
const GalleryView = lazy(() => import('./views/GalleryView'));
const UiDemo = lazy(() => import('./views/UiDemo'));

interface LocationState {
  mood?: number;
  entry?: HistoryEntry;
  targetDate?: string;
}

interface DashboardHomeProps {
  pastEntries: HistoryEntry[];
  historyLoading: boolean;
  historyError: string | null;
  currentStreak: number;
  onMoodSelect: (mood: number) => void;
  onDelete: (id: number) => void;
  onEdit: (entry: HistoryEntry) => void;
  onNavigateToGoals: () => void;
  onNavigateToEntry: () => void;
  onNavigateToAchievements: () => void;
  onNavigateToStats: () => void;
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100, 180, 365] as const;
const STREAK_CELEBRATION_STORAGE_KEY = 'twilightio:last-streak-celebration';

interface ProgressPrompt {
  id: string;
  label: string;
  current: number;
  target: number;
  percent: number;
}

interface RecentDaySnapshot {
  iso: string;
  label: string;
  hasEntry: boolean;
  mood: number | null;
  isToday: boolean;
}

interface DashboardRecentStats {
  todayEntry: HistoryEntry | null;
  avgMood: number | null;
  completionRate: number;
  weekCount: number;
  recentDays: RecentDaySnapshot[];
}

const toNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
};

const clampPercent = (value: number): number => Math.max(0, Math.min(100, value));

const humanizeKey = (value: string): string => {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase())
    .trim();
};

const normalizeGoalPrompts = (value: unknown): ProgressPrompt[] => {
  if (!Array.isArray(value)) return [];

  return value
    .map((item, index): ProgressPrompt | null => {
      const goal = asRecord(item);
      if (!goal) return null;

      const current = toNumber(goal.completed) ?? toNumber(goal.current_count) ?? 0;
      const target =
        toNumber(goal.total) ??
        toNumber(goal.target_count) ??
        toNumber(goal.frequency_per_week) ??
        0;
      if (target <= 0) return null;

      const percent = clampPercent((current / target) * 100);
      if (percent < 70 || percent >= 100) return null;

      const idValue = goal.id;
      const id = typeof idValue === 'string' || typeof idValue === 'number'
        ? String(idValue)
        : `goal-${index}`;

      const label = typeof goal.title === 'string' && goal.title.trim().length > 0
        ? goal.title.trim()
        : `Goal ${index + 1}`;

      return { id, label, current, target, percent };
    })
    .filter((item): item is ProgressPrompt => item !== null)
    .sort((a, b) => b.percent - a.percent);
};

const normalizeAchievementPrompts = (value: unknown): ProgressPrompt[] => {
  const prompts: ProgressPrompt[] = [];

  const addPrompt = (
    idRaw: unknown,
    labelRaw: unknown,
    currentRaw: unknown,
    targetRaw: unknown,
    percentRaw?: unknown
  ) => {
    const targetCandidate = toNumber(targetRaw);
    const currentCandidate = toNumber(currentRaw) ?? 0;
    const percentCandidate = toNumber(percentRaw);

    let target = targetCandidate ?? 0;
    let current = currentCandidate;

    if (target <= 0 && percentCandidate !== null) {
      target = 100;
      current = percentCandidate;
    }

    if (target <= 0) return;

    const percent = clampPercent((current / target) * 100);
    if (percent < 70 || percent >= 100) return;

    const id = typeof idRaw === 'string' || typeof idRaw === 'number'
      ? String(idRaw)
      : `achievement-${prompts.length}`;

    const label = typeof labelRaw === 'string' && labelRaw.trim().length > 0
      ? labelRaw.trim()
      : humanizeKey(id);

    prompts.push({ id, label, current, target, percent });
  };

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      const achievement = asRecord(item);
      if (!achievement) return;

      addPrompt(
        achievement.id ??
          achievement.achievement_id ??
          achievement.achievement_type ??
          `achievement-${index}`,
        achievement.name ?? achievement.achievement_type ?? achievement.id,
        achievement.current ?? achievement.progress,
        achievement.max ?? achievement.target,
        achievement.percent ?? achievement.percentage
      );
    });
  } else {
    const mapValue = asRecord(value);
    if (!mapValue) return [];

    Object.entries(mapValue).forEach(([key, item]) => {
      const achievement = asRecord(item);
      if (!achievement) return;

      addPrompt(
        key,
        achievement.name ?? key,
        achievement.current ?? achievement.progress,
        achievement.max ?? achievement.target,
        achievement.percentage
      );
    });
  }

  return prompts.sort((a, b) => b.percent - a.percent);
};

const findStreakMilestone = (streak: number): number | null => {
  const milestone = [...STREAK_MILESTONES].reverse().find((value) => streak >= value);
  return milestone ?? null;
};

const resolveEntryDateISO = (entry: HistoryEntry): string | null => {
  if (entry.date && /^\d{4}-\d{2}-\d{2}$/.test(entry.date)) {
    return entry.date;
  }

  if (entry.created_at) {
    const parsed = new Date(entry.created_at);
    if (!Number.isNaN(parsed.getTime())) return formatISODate(parsed);
  }

  if (entry.date) {
    const parsed = new Date(entry.date);
    if (!Number.isNaN(parsed.getTime())) return formatISODate(parsed);
  }

  return null;
};

const DashboardHome = ({
  pastEntries,
  historyLoading,
  historyError,
  currentStreak,
  onMoodSelect,
  onDelete,
  onEdit,
  onNavigateToGoals,
  onNavigateToEntry,
  onNavigateToAchievements,
  onNavigateToStats,
}: DashboardHomeProps) => {
  const todayISO = getTodayISO();
  const todayTime = new Date(todayISO).getTime();
  const [goalPrompts, setGoalPrompts] = useState<ProgressPrompt[]>([]);
  const [achievementPrompts, setAchievementPrompts] = useState<ProgressPrompt[]>([]);
  const [promptsLoading, setPromptsLoading] = useState(true);
  const [activeMilestone, setActiveMilestone] = useState<number | null>(null);

  const recentStats = useMemo<DashboardRecentStats>(() => {
    const entriesWithDates = pastEntries
      .map((entry) => ({ entry, iso: resolveEntryDateISO(entry) }))
      .filter((item): item is { entry: HistoryEntry; iso: string } => Boolean(item.iso));
    const entryByDate = new Map<string, HistoryEntry>();

    entriesWithDates.forEach(({ entry, iso }) => {
      if (!entryByDate.has(iso)) {
        entryByDate.set(iso, entry);
      }
    });

    const todayEntry = entryByDate.get(todayISO) ?? null;

    const weekEntries = entriesWithDates.filter((item) => {
      const day = new Date(item.iso);
      const diff = Math.floor((todayTime - day.getTime()) / ONE_DAY_MS);
      return diff >= 0 && diff < 7;
    });

    const avgMood = weekEntries.length
      ? Number((weekEntries.reduce((sum, item) => sum + item.entry.mood, 0) / weekEntries.length).toFixed(1))
      : null;

    const completionRate = Math.round((weekEntries.length / 7) * 100);
    const recentDays = Array.from({ length: 7 }, (_, index) => {
      const dayOffset = 6 - index;
      const dayDate = new Date(todayTime - dayOffset * ONE_DAY_MS);
      const iso = formatISODate(dayDate);
      const entry = entryByDate.get(iso) ?? null;

      return {
        iso,
        label: dayDate.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1),
        hasEntry: Boolean(entry),
        mood: entry?.mood ?? null,
        isToday: iso === todayISO,
      };
    });

    return {
      todayEntry,
      avgMood,
      completionRate,
      weekCount: weekEntries.length,
      recentDays,
    };
  }, [pastEntries, todayISO, todayTime]);

  useEffect(() => {
    let cancelled = false;

    const loadPrompts = async () => {
      setPromptsLoading(true);

      const [goalsResult, achievementsResult] = await Promise.allSettled([
        apiService.getGoals(),
        apiService.getAchievementsProgress(),
      ]);

      if (cancelled) return;

      const nearGoals = goalsResult.status === 'fulfilled'
        ? normalizeGoalPrompts(goalsResult.value).slice(0, 2)
        : [];

      const nearAchievements = achievementsResult.status === 'fulfilled'
        ? normalizeAchievementPrompts(achievementsResult.value).slice(0, 2)
        : [];

      setGoalPrompts(nearGoals);
      setAchievementPrompts(nearAchievements);
      setPromptsLoading(false);
    };

    void loadPrompts();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!recentStats.todayEntry) return;

    const milestone = findStreakMilestone(currentStreak);
    if (!milestone) return;

    const celebrationToken = `${todayISO}:${milestone}`;

    try {
      const previousToken = localStorage.getItem(STREAK_CELEBRATION_STORAGE_KEY);
      if (previousToken === celebrationToken) return;
      localStorage.setItem(STREAK_CELEBRATION_STORAGE_KEY, celebrationToken);
    } catch {
      // non-blocking
    }

    setActiveMilestone(milestone);
    const timeout = window.setTimeout(() => setActiveMilestone(null), 4200);
    return () => window.clearTimeout(timeout);
  }, [currentStreak, recentStats.todayEntry, todayISO]);

  const insightText = recentStats.avgMood === null
    ? 'Log a few entries to unlock personalized insights.'
    : recentStats.avgMood >= 4
      ? 'You are trending positive this week. Keep your routine steady.'
      : recentStats.avgMood >= 3
        ? 'Your week is stable. One short entry today keeps momentum strong.'
        : 'Your mood trend dipped this week. A short check-in can help reset direction.';

  const primaryActionLabel = recentStats.todayEntry ? 'Review Today' : 'Log Today';
  const streakAtRisk = !recentStats.todayEntry && currentStreak > 0;

  const actionItems = useMemo(() => {
    const items: Array<{
      id: string;
      title: string;
      description: string;
      cta: string;
      icon: ComponentType<{ size?: number; className?: string }>;
      onClick: () => void;
      tone: 'warning' | 'default';
    }> = [];

    if (streakAtRisk) {
      items.push({
        id: 'protect-streak',
        title: `Protect your ${currentStreak}-day streak`,
        description: 'Log a quick check-in today to avoid resetting momentum.',
        cta: 'Protect streak',
        icon: ShieldAlert,
        onClick: onNavigateToEntry,
        tone: 'warning',
      });
    } else if (!recentStats.todayEntry) {
      items.push({
        id: 'log-entry',
        title: 'Complete today\'s check-in',
        description: 'A short entry now keeps your trend data accurate.',
        cta: 'Log now',
        icon: Sparkles,
        onClick: onNavigateToEntry,
        tone: 'default',
      });
    }

    if (goalPrompts[0]) {
      const goal = goalPrompts[0];
      items.push({
        id: `goal-${goal.id}`,
        title: `Goal almost done: ${goal.label}`,
        description: `${goal.current}/${goal.target} complete (${Math.round(goal.percent)}%).`,
        cta: 'Finish goal',
        icon: Target,
        onClick: onNavigateToGoals,
        tone: 'default',
      });
    }

    if (achievementPrompts[0]) {
      const achievement = achievementPrompts[0];
      items.push({
        id: `achievement-${achievement.id}`,
        title: `Near unlock: ${achievement.label}`,
        description: `${Math.round(achievement.percent)}% progress toward this reward.`,
        cta: 'View rewards',
        icon: Trophy,
        onClick: onNavigateToAchievements,
        tone: 'default',
      });
    }

    if (recentStats.completionRate < 60) {
      items.push({
        id: 'review-patterns',
        title: 'Consistency dipped this week',
        description: 'Review your stats and spot when engagement drops.',
        cta: 'Open stats',
        icon: TrendingUp,
        onClick: onNavigateToStats,
        tone: 'default',
      });
    }

    if (items.length === 0) {
      items.push({
        id: 'maintain-momentum',
        title: 'Momentum is strong this week',
        description: 'Review trends and set one goal to keep the streak climbing.',
        cta: 'Open stats',
        icon: TrendingUp,
        onClick: onNavigateToStats,
        tone: 'default',
      });
    }

    return items.slice(0, 3);
  }, [
    achievementPrompts,
    currentStreak,
    goalPrompts,
    onNavigateToAchievements,
    onNavigateToEntry,
    onNavigateToGoals,
    onNavigateToStats,
    recentStats.completionRate,
    recentStats.todayEntry,
    streakAtRisk,
  ]);

  return (
    <div className="space-y-8">
      <HistoryView
        pastEntries={pastEntries}
        loading={historyLoading}
        error={historyError}
        onMoodSelect={onMoodSelect}
        onDelete={onDelete}
        onEdit={onEdit}
        renderOnlyHeader
      />

      <div data-testid="dashboard-home-layout" className="xl:grid xl:grid-cols-[minmax(0,1fr)_21rem] xl:gap-6 xl:items-start">
        <div className="space-y-8 min-w-0">
          <section aria-label="Daily check-in" className="space-y-4">
            <AnimatePresence initial={false}>
              {activeMilestone ? (
                <motion.div
                  key={`streak-milestone-${activeMilestone}`}
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.98 }}
                  transition={{ duration: 0.28, ease: 'easeOut' }}
                >
                  <Card className="border-primary/40 bg-gradient-to-r from-primary/15 via-primary/5 to-card">
                    <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                          <PartyPopper size={16} />
                        </span>
                        <div>
                          <p className="text-sm font-semibold leading-tight">{activeMilestone}-day streak milestone reached</p>
                          <p className="text-xs text-muted-foreground">Momentum secured. Keep the next check-in simple and quick.</p>
                        </div>
                      </div>
                      <Button size="sm" variant="secondary" onClick={onNavigateToStats} className="w-full sm:w-auto">
                        View streak trends
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : null}
            </AnimatePresence>

            <Card className="border-primary/20 bg-gradient-to-r from-primary/10 via-card to-card">
              <CardContent className="p-4 md:p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-[0.08em]">
                    <Sparkles size={14} />
                    Daily Check-in
                  </div>
                  <h2 className="text-xl md:text-2xl font-semibold tracking-tight">{recentStats.todayEntry ? 'Great consistency today' : 'Ready for today\'s entry?'}</h2>
                  <p className="text-sm text-muted-foreground">
                    {recentStats.todayEntry
                      ? 'You already logged today. Add context or review your progress.'
                      : 'One quick entry keeps your streak and insights growing.'}
                  </p>
                </div>

                <Button
                  onClick={() => {
                    if (recentStats.todayEntry) {
                      onEdit(recentStats.todayEntry);
                    } else {
                      onNavigateToEntry();
                    }
                  }}
                  className="gap-2 w-full lg:w-auto"
                >
                  {primaryActionLabel}
                  <ArrowRight size={16} />
                </Button>
              </CardContent>
            </Card>

            <ResponsiveGrid minCardWidth="13rem" maxColumns={3} gapToken="normal">
              <Card>
                <CardHeader className="pb-1">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Current Streak</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 flex items-center justify-between">
                  <div className="text-3xl font-bold tabular-nums">{currentStreak}</div>
                  <Flame className="text-[color:var(--warning)]" size={22} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-1">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Last 7 Days</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-2xl font-semibold tabular-nums">{recentStats.weekCount}/7</div>
                      <div className="text-xs text-muted-foreground">{recentStats.completionRate}% consistency</div>
                    </div>
                    <CalendarCheck2 size={20} className="text-primary" />
                  </div>

                  <div className="flex items-end justify-between gap-1">
                    {recentStats.recentDays.map((day) => (
                      <div key={day.iso} className="flex flex-col items-center gap-1 min-w-0">
                        <div
                          className={cn(
                            'h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 rounded-md border flex items-center justify-center',
                            !day.hasEntry && 'border-dashed border-muted-foreground/30 bg-muted/30',
                            day.isToday && 'ring-1 ring-primary/50'
                          )}
                          style={day.hasEntry && day.mood
                            ? {
                              backgroundColor: `color-mix(in oklab, var(--mood-${day.mood}) 20%, var(--card))`,
                              borderColor: `color-mix(in oklab, var(--mood-${day.mood}) 45%, var(--border))`,
                            }
                            : undefined}
                          aria-label={`${day.iso} ${day.hasEntry ? 'logged' : 'not logged'}`}
                          title={`${day.iso} ${day.hasEntry ? 'Logged' : 'Not logged'}`}
                        >
                          <span
                            className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full"
                            style={day.hasEntry && day.mood
                              ? { backgroundColor: `var(--mood-${day.mood})` }
                              : { backgroundColor: 'color-mix(in oklab, var(--text), transparent 65%)' }}
                          />
                        </div>
                        <span className={cn('text-[10px] uppercase tracking-[0.06em] text-muted-foreground', day.isToday && 'text-primary')}>
                          {day.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-1">
                  <CardTitle className="text-sm font-medium text-muted-foreground">One Insight</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-1">
                  <div className="text-sm font-medium tabular-nums">
                    Avg mood: {recentStats.avgMood ?? '—'}
                  </div>
                  <div className="text-xs text-muted-foreground leading-relaxed">{insightText}</div>
                  <Button variant="ghost" size="sm" onClick={onNavigateToGoals} className="h-8 px-0 text-xs text-primary hover:text-primary">
                    <Bell size={14} className="mr-1" />
                    Review goals and reminders
                  </Button>
                </CardContent>
              </Card>
            </ResponsiveGrid>
          </section>

          <section aria-label="Goals section" className="space-y-2">
            <GoalsSection onNavigateToGoals={onNavigateToGoals} />
          </section>

          <section aria-label="History entries" className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">History</h2>
            <HistoryList
              entries={pastEntries}
              loading={historyLoading}
              error={historyError ?? undefined}
              onDelete={onDelete}
              onEdit={onEdit}
            />
          </section>
        </div>

        <aside className="mt-8 xl:mt-0 space-y-4 xl:sticky xl:top-20">
          <Card className={cn('border-border/70', streakAtRisk && 'border-[color:var(--warning)]/40')}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold tracking-wide">What To Do Now</CardTitle>
              <p className="text-xs text-muted-foreground">
                One-tap actions to protect streaks and finish near-complete goals.
              </p>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {promptsLoading ? (
                <div className="rounded-xl border border-border/70 bg-muted/20 p-3 text-sm text-muted-foreground">
                  Loading personalized prompts...
                </div>
              ) : (
                actionItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.id}
                      className={cn(
                        'rounded-xl border border-border/70 p-3 flex flex-col gap-3',
                        item.tone === 'warning' && 'border-[color:var(--warning)]/45 bg-[color:var(--warning)]/10'
                      )}
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <span
                          className={cn(
                            'h-7 w-7 mt-0.5 rounded-full border flex items-center justify-center shrink-0',
                            item.tone === 'warning'
                              ? 'bg-[color:var(--warning)]/20 border-[color:var(--warning)]/55 text-[color:var(--warning)]'
                              : 'bg-primary/10 border-primary/30 text-primary'
                          )}
                        >
                          <Icon size={14} />
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium leading-tight">{item.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                        </div>
                      </div>
                      <Button size="sm" variant={item.tone === 'warning' ? 'default' : 'outline'} onClick={item.onClick} className="w-full">
                        {item.cta}
                      </Button>
                    </div>
                  );
                })
              )}

              {!promptsLoading && (goalPrompts.length > 0 || achievementPrompts.length > 0) ? (
                <p className="text-xs text-muted-foreground">
                  {goalPrompts.length > 0 ? `${goalPrompts.length} goal${goalPrompts.length > 1 ? 's' : ''}` : 'No goals'} and {' '}
                  {achievementPrompts.length > 0 ? `${achievementPrompts.length} reward${achievementPrompts.length > 1 ? 's' : ''}` : 'no rewards'} are close to completion.
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card className="border-border/70">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold tracking-wide">Desktop Coach Rail</CardTitle>
              <p className="text-xs text-muted-foreground">
                Shortcut-friendly overview for daily engagement.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg border bg-muted/20 p-2">
                  <div className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground">Streak</div>
                  <div className="text-lg font-semibold tabular-nums">{currentStreak}</div>
                </div>
                <div className="rounded-lg border bg-muted/20 p-2">
                  <div className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground">Week</div>
                  <div className="text-lg font-semibold tabular-nums">{recentStats.weekCount}/7</div>
                </div>
                <div className="rounded-lg border bg-muted/20 p-2">
                  <div className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground">Avg Mood</div>
                  <div className="text-lg font-semibold tabular-nums">{recentStats.avgMood ?? '—'}</div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Button size="sm" onClick={onNavigateToEntry} className="w-full">Quick Entry</Button>
                <Button size="sm" variant="outline" onClick={onNavigateToGoals} className="w-full">Open Goals</Button>
                <Button size="sm" variant="outline" onClick={onNavigateToStats} className="w-full">Open Statistics</Button>
                <Button size="sm" variant="outline" onClick={onNavigateToAchievements} className="w-full">Open Achievements</Button>
              </div>

              <p className="text-[11px] text-muted-foreground">
                Keyboard: <span className="font-medium text-foreground">C</span> new entry, <span className="font-medium text-foreground">G</span> goals, <span className="font-medium text-foreground">S</span> stats, <span className="font-medium text-foreground">A</span> achievements, <span className="font-medium text-foreground">⇧G</span> complete goal, <span className="font-medium text-foreground">⌘K</span> commands.
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
};

const SyncManager = () => {
  useOfflineSync();
  return null;
};

const AppContent = () => {
  const navigate = useNavigate();
  const location = useLocation() as Location<LocationState>;
  const { show } = useToast();
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  const { pastEntries, setPastEntries, loading: historyLoading, error: historyError, refreshHistory } = useMoodData();
  const { groups, createGroup, createGroupOption, moveGroupOption } = useGroups();
  const { statistics, currentStreak, loading: statsLoading, error: statsError, loadStatistics } = useStatistics();

  const openGlobalSearch = useCallback(() => {
    window.dispatchEvent(new Event('twilightio:open-search'));
  }, []);

  const completePriorityGoal = useCallback(async () => {
    const today = getTodayISO();

    try {
      const goals = await apiService.getGoals();
      const activeGoals = (goals || []).filter((goal) => !goal.is_archived);

      if (activeGoals.length === 0) {
        show('No active goals to complete yet.', 'info');
        navigate('/dashboard/goals');
        return;
      }

      const candidates = activeGoals
        .map((goal) => {
          const resolvedTarget = Math.max(
            1,
            toNumber(goal.target_count) ?? toNumber(goal.frequency_per_week) ?? 1
          );
          const resolvedCompleted = Math.max(0, toNumber(goal.completed) ?? 0);
          const doneToday = goal.last_completed_date === today || goal.already_completed_today === true;
          const remaining = Math.max(0, resolvedTarget - resolvedCompleted);
          const progressRatio = resolvedTarget > 0 ? resolvedCompleted / resolvedTarget : 0;

          return {
            goal,
            remaining,
            progressRatio,
            doneToday,
          };
        })
        .filter((item) => !item.doneToday && item.remaining > 0)
        .sort((a, b) => {
          if (b.progressRatio !== a.progressRatio) {
            return b.progressRatio - a.progressRatio;
          }
          return a.remaining - b.remaining;
        });

      if (candidates.length === 0) {
        show('All active goals are already completed for today.', 'info');
        navigate('/dashboard/goals');
        return;
      }

      const priorityGoal = candidates[0].goal;
      await apiService.toggleGoalCompletion(priorityGoal.id, today);
      show(`Marked ${priorityGoal.title} complete for today.`, 'success');
      navigate('/dashboard/goals');
    } catch {
      show('Could not complete a goal right now.', 'error');
    }
  }, [navigate, show]);

  useHotkeys('c', () => navigate('/dashboard/entry'), [navigate]);
  useHotkeys('g', () => navigate('/dashboard/goals'), [navigate]);
  useHotkeys('s', () => navigate('/dashboard/stats'), [navigate]);
  useHotkeys('a', () => navigate('/dashboard/achievements'), [navigate]);
  useHotkeys('cmd+k', () => setIsCommandPaletteOpen((prev) => !prev));
  useHotkeys('ctrl+k', () => setIsCommandPaletteOpen((prev) => !prev));
  useHotkeys('shift+g', () => {
    void completePriorityGoal();
  }, [completePriorityGoal]);

  const handleMoodSelect = (moodValue: number) => {
    navigate('entry', { state: { mood: moodValue } });
  };

  const handleBackToHistory = () => {
    navigate('/dashboard');
  };

  const handleEntrySubmitted = () => {
    navigate('/dashboard');
    refreshHistory();
  };

  const handleEntryDeleted = (deletedEntryId: number) => {
    setPastEntries((prev) => prev.filter((entry) => entry.id !== deletedEntryId));
  };

  const handleStartEdit = (entry: HistoryEntry | EntryWithSelections) => {
    if (!entry.id || entry.mood === undefined) return;

    const fullEntry = entry as HistoryEntry;
    navigate('entry', { state: { entry: fullEntry, mood: fullEntry.mood } });
  };

  const handleEditById = (entryData: { id: number }) => {
    const entry = pastEntries.find((e) => e.id === entryData.id);
    if (entry) handleStartEdit(entry);
  };

  const handleEditMoodSelect = (moodValue: number) => {
    navigate('.', { state: { ...location.state, mood: moodValue }, replace: true });
  };

  const handleEntryUpdated = (updatedEntry: HistoryEntry) => {
    setPastEntries((prev) => prev.map((entry) => (
      entry.id === updatedEntry.id ? { ...entry, ...updatedEntry } : entry
    )));
    navigate('/dashboard');
    refreshHistory();
  };

  const handleCalendarDayClick = (dateString: string) => {
    navigate('entry', { state: { targetDate: dateString } });
  };

  const locationState = location.state || {};
  const { mood: selectedMood, entry: editingEntry, targetDate } = locationState;
  const isEntryView = location.pathname.endsWith('/entry');

  useEffect(() => {
    const handler = () => {
      if (!location.pathname.startsWith('/dashboard')) {
        navigate('/dashboard');
        return;
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener('twilightio:new-entry', handler);
    return () => window.removeEventListener('twilightio:new-entry', handler);
  }, [location.pathname, navigate]);

  return (
    <>
      <DesktopCommandPalette
        open={isCommandPaletteOpen}
        onOpenChange={setIsCommandPaletteOpen}
        onOpenDashboard={() => navigate('/dashboard')}
        onOpenSearch={openGlobalSearch}
        onOpenEntry={() => navigate('/dashboard/entry')}
        onOpenGoals={() => navigate('/dashboard/goals')}
        onOpenStats={() => navigate('/dashboard/stats')}
        onOpenAchievements={() => navigate('/dashboard/achievements')}
        onCompleteGoal={() => {
          void completePriorityGoal();
        }}
      />

      <div className="min-h-screen bg-background text-foreground font-sans antialiased selection:bg-primary/20">
        {!isEntryView && <Sidebar onLoadStatistics={loadStatistics} />}

        <div className={cn(
          'flex flex-col min-h-screen transition-all duration-300 ease-in-out',
          !isEntryView && 'md:pl-64 xl:pl-72 2xl:pl-80'
        )}>
          <Header currentStreak={currentStreak} />

          <main className="flex-1 pb-20 md:pb-8">
            <AnimatePresence mode="wait">
              <Routes key={location.pathname}>
                <Route
                  index
                  element={
                    <PageTransition>
                      <PageShell variant="default" maxWidthToken="content" gutterToken="normal">
                        <DashboardHome
                          pastEntries={pastEntries}
                          historyLoading={historyLoading}
                          historyError={historyError}
                          currentStreak={currentStreak}
                          onMoodSelect={handleMoodSelect}
                          onDelete={handleEntryDeleted}
                          onEdit={handleStartEdit}
                          onNavigateToGoals={() => navigate('goals')}
                          onNavigateToEntry={() => navigate('entry')}
                          onNavigateToAchievements={() => navigate('achievements')}
                          onNavigateToStats={() => navigate('stats')}
                        />
                      </PageShell>
                    </PageTransition>
                  }
                />
                <Route
                  path="entry"
                  element={
                    <PageTransition>
                      <PageShell variant="editor" maxWidthToken="editor" gutterToken="compact" className="!py-0">
                        <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading…</div>}>
                          <EntryView
                            selectedMood={selectedMood}
                            groups={groups}
                            onBack={handleBackToHistory}
                            onCreateGroup={createGroup}
                            onCreateOption={createGroupOption}
                            onMoveOption={moveGroupOption}
                            onEntrySubmitted={handleEntrySubmitted}
                            editingEntry={editingEntry}
                            onEntryUpdated={handleEntryUpdated}
                            onEditMoodSelect={handleEditMoodSelect}
                            onSelectMood={handleMoodSelect}
                            targetDate={targetDate}
                          />
                        </Suspense>
                      </PageShell>
                    </PageTransition>
                  }
                />
                <Route
                  path="stats"
                  element={
                    <PageTransition>
                      <PageShell variant="analytics" maxWidthToken="wide" gutterToken="normal">
                        <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading…</div>}>
                          <StatisticsView
                            statistics={statistics}
                            pastEntries={pastEntries}
                            loading={statsLoading}
                            error={statsError ?? undefined}
                            onDayClick={handleCalendarDayClick}
                            onEntryClick={handleStartEdit}
                          />
                        </Suspense>
                      </PageShell>
                    </PageTransition>
                  }
                />
                <Route
                  path="achievements"
                  element={
                    <PageTransition>
                      <PageShell variant="default" maxWidthToken="wide" gutterToken="normal">
                        <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading…</div>}>
                          <AchievementsView />
                        </Suspense>
                      </PageShell>
                    </PageTransition>
                  }
                />
                <Route
                  path="goals"
                  element={
                    <PageTransition>
                      <PageShell variant="default" maxWidthToken="content" gutterToken="normal">
                        <GoalsView />
                      </PageShell>
                    </PageTransition>
                  }
                />
                <Route
                  path="gallery"
                  element={
                    <PageTransition>
                      <PageShell variant="analytics" maxWidthToken="wide" gutterToken="normal">
                        <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading…</div>}>
                          <GalleryView onEntryClick={handleEditById} />
                        </Suspense>
                      </PageShell>
                    </PageTransition>
                  }
                />
                <Route
                  path="settings"
                  element={
                    <PageTransition>
                      <PageShell variant="default" maxWidthToken="content" gutterToken="normal">
                        <SettingsView />
                      </PageShell>
                    </PageTransition>
                  }
                />
                <Route
                  path="ui-demo"
                  element={
                    <PageTransition>
                      <PageShell variant="default" maxWidthToken="wide" gutterToken="normal">
                        <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading…</div>}>
                          <UiDemo />
                        </Suspense>
                      </PageShell>
                    </PageTransition>
                  }
                />
              </Routes>
            </AnimatePresence>
          </main>
        </div>
      </div>

      {!isEntryView && <BottomNav onLoadStatistics={loadStatistics} />}

      <div className={cn('fixed right-4 bottom-32 z-50', !isEntryView ? 'md:hidden' : '')}>
        <SmartFAB
          onCreateEntry={() => {
            if (location.pathname === '/dashboard' || location.pathname === '/dashboard/') {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
              navigate('/dashboard');
            }
          }}
          onCreateEntryForDate={() => {
            navigate('/dashboard');
          }}
        />
      </div>

      {!isEntryView ? (
        <div data-testid="desktop-action-bar" className="hidden xl:flex fixed right-6 bottom-6 z-40 items-center gap-2 rounded-full border border-border/80 bg-card/95 backdrop-blur px-2 py-2 shadow-lg max-w-[calc(100vw-3rem)]">
          <Button size="sm" className="h-8" onClick={() => navigate('/dashboard/entry')}>
            New Entry
          </Button>
          <Button size="sm" variant="outline" className="h-8" onClick={() => navigate('/dashboard/goals')}>
            Goals
          </Button>
          <Button size="sm" variant="outline" className="h-8" onClick={() => navigate('/dashboard/stats')}>
            Stats
          </Button>
          <Button size="sm" variant="outline" className="h-8" onClick={() => navigate('/dashboard/achievements')}>
            Achievements
          </Button>
          <Button size="sm" variant="outline" className="h-8" onClick={() => {
            void completePriorityGoal();
          }}>
            Complete Goal
          </Button>
          <span className="px-1 text-[11px] text-muted-foreground whitespace-nowrap">
            C • G • S • A • ⇧G • ⌘K
          </span>
        </div>
      ) : null}
    </>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <ConfigProvider>
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>
              <LockProvider>
                <MoodDefinitionsProvider>
                  <SyncManager />
                  <ReminderManager />
                  <LockScreen />
                  <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/about" element={<Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading…</div>}><AboutPage /></Suspense>} />
                    <Route path="/ui-demo" element={<Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading…</div>}><UiDemo /></Suspense>} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route
                      path="/dashboard/*"
                      element={
                        <ProtectedRoute>
                          <AppContent />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </MoodDefinitionsProvider>
              </LockProvider>
            </AuthProvider>
          </ToastProvider>
          <OfflineIndicator />
        </ThemeProvider>
      </ConfigProvider>
    </ErrorBoundary>
  );
}

export default App;
