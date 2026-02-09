import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarCheck2, Flame, Bell, ArrowRight, Sparkles, ShieldAlert, Target, Trophy, TrendingUp, PartyPopper, PenLine } from 'lucide-react';

import HistoryView from '../../views/HistoryView';
import GoalsSection from '../goals/GoalsSection';
import HistoryEntryCard from '../history/HistoryEntry';
import ResponsiveGrid from '../layout/ResponsiveGrid';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { getTodayISO, formatISODate } from '../../utils/dateUtils';
import apiService from '../../services/api';
import { queryKeys } from '../../lib/queryKeys';
import {
  normalizeGoalPrompts,
  normalizeAchievementPrompts,
  findStreakMilestone,
  resolveEntryDateISO,
} from '../../utils/dashboardUtils';
import type { HistoryEntry } from '../../types/entry';
import type {
  DashboardHomeProps,
  ProgressPrompt,
  DashboardRecentStats,
  ActionItem,
} from '../../types/dashboard';
import {
  ONE_DAY_MS,
  STREAK_CELEBRATION_STORAGE_KEY,
} from '../../types/dashboard';

const DashboardHome = ({
  pastEntries,
  historyLoading,
  historyError,
  currentStreak,
  onMoodSelect,
  onDelete,
  onEdit,
  onNavigateToEntry,
  onNavigateToJournal,
  onNavigateToDiscover,
}: DashboardHomeProps) => {
  const todayISO = getTodayISO();
  const todayTime = new Date(todayISO).getTime();
  const [activeMilestone, setActiveMilestone] = useState<number | null>(null);

  const goalsQuery = useQuery({
    queryKey: queryKeys.goals.list(),
    queryFn: () => apiService.getGoals(),
    select: (data) => normalizeGoalPrompts(data).slice(0, 2),
  });

  const achievementsQuery = useQuery({
    queryKey: queryKeys.achievements.progress(),
    queryFn: () => apiService.getAchievementsProgress(),
    select: (data) => normalizeAchievementPrompts(data).slice(0, 2),
  });

  const journalQuery = useQuery({
    queryKey: queryKeys.journal.stats(),
    queryFn: () => apiService.getJournalStats(),
  });

  const goalPrompts = goalsQuery.data ?? [];
  const achievementPrompts = achievementsQuery.data ?? [];
  const promptsLoading = goalsQuery.isLoading || achievementsQuery.isLoading || journalQuery.isLoading;
  const journalStats = journalQuery.data ?? null;

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

  const recentEntries = useMemo(() => pastEntries.slice(0, 3), [pastEntries]);

  const actionItems = useMemo(() => {
    const items: ActionItem[] = [];

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
        cta: 'View goals',
        icon: Target,
        onClick: () => {
          document.getElementById('goals-section')?.scrollIntoView({ behavior: 'smooth' });
        },
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
        onClick: onNavigateToDiscover,
        tone: 'default',
      });
    }

    if (recentStats.completionRate < 60) {
      items.push({
        id: 'review-patterns',
        title: 'Consistency dipped this week',
        description: 'Review your stats and spot when engagement drops.',
        cta: 'Open analytics',
        icon: TrendingUp,
        onClick: onNavigateToDiscover,
        tone: 'default',
      });
    }

    if (items.length === 0) {
      items.push({
        id: 'maintain-momentum',
        title: 'Momentum is strong this week',
        description: 'Review trends and set one goal to keep the streak climbing.',
        cta: 'Open analytics',
        icon: TrendingUp,
        onClick: onNavigateToDiscover,
        tone: 'default',
      });
    }

    return items.slice(0, 3);
  }, [
    achievementPrompts,
    currentStreak,
    goalPrompts,
    onNavigateToDiscover,
    onNavigateToEntry,
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
                          <p className="text-xs text-muted-foreground font-journal">Momentum secured. Keep the next check-in simple and gentle.</p>
                        </div>
                      </div>
                      <Button size="sm" variant="secondary" onClick={onNavigateToDiscover} className="w-full sm:w-auto">
                        View streak trends
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : null}
            </AnimatePresence>

            <Card className="border-primary/20 bg-gradient-to-r from-primary/10 via-card to-card rounded-[calc(var(--radius)+4px)]">
              <CardContent className="p-4 md:p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-[0.08em]">
                    <Sparkles size={14} />
                    Daily Check-in
                  </div>
                  <h2 className="text-xl md:text-2xl font-semibold tracking-tight">{recentStats.todayEntry ? 'You already checked in today' : 'Ready for a gentle check-in?'}</h2>
                  <p className="text-sm text-muted-foreground">
                    {recentStats.todayEntry
                      ? 'You can add a little context or revisit how the day felt.'
                      : 'A short reflection keeps your rhythm and insights growing.'}
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
                  <Button variant="ghost" size="sm" onClick={onNavigateToDiscover} className="h-8 px-0 text-xs text-primary hover:text-primary">
                    <Bell size={14} className="mr-1" />
                    View mood patterns
                  </Button>
                </CardContent>
              </Card>

              {journalStats && (
                <Card>
                  <CardHeader className="pb-1">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Journal</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="text-3xl font-bold tabular-nums">{journalStats.weekly_word_count}</div>
                      <PenLine className="text-primary" size={22} />
                    </div>
                    <div className="text-xs text-muted-foreground">words this week</div>
                    {journalStats.journaling_streak > 0 && (
                      <div className="text-xs text-muted-foreground">
                        {journalStats.journaling_streak}-day writing streak
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </ResponsiveGrid>
          </section>

          <section id="goals-section" aria-label="Goals section" className="space-y-2">
            <GoalsSection />
          </section>

          {/* Recent entries - lightweight preview */}
          {recentEntries.length > 0 && (
            <section aria-label="Recent entries" className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">Recent reflections</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onNavigateToJournal}
                  className="text-primary hover:text-primary gap-1"
                >
                  Open full journal
                  <ArrowRight size={14} />
                </Button>
              </div>
              <ResponsiveGrid minCardWidth="17rem" maxColumns={3} gapToken="normal">
                {recentEntries.map((entry, index) => (
                  <HistoryEntryCard
                    key={entry.id ? `entry-${entry.id}` : `${entry.date}-${index}`}
                    entry={entry}
                    onDelete={onDelete}
                    onEdit={onEdit}
                  />
                ))}
              </ResponsiveGrid>
            </section>
          )}
        </div>

        <aside className="mt-8 xl:mt-0 space-y-4 xl:sticky xl:top-20">
          <Card className={cn('border-border/70', streakAtRisk && 'border-[color:var(--warning)]/40')}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold tracking-wide">Gentle Next Steps</CardTitle>
              <p className="text-xs text-muted-foreground">
                One-tap actions to protect streaks and finish near-complete goals.
              </p>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {promptsLoading ? (
                <div className="rounded-xl border border-border/70 bg-muted/20 p-3 text-sm text-muted-foreground">
                  Loading your personalized prompts...
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
              <CardTitle className="text-sm font-semibold tracking-wide">Reflection Rail</CardTitle>
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
                <Button size="sm" onClick={onNavigateToEntry} className="w-full">New Reflection</Button>
                <Button size="sm" variant="outline" onClick={onNavigateToJournal} className="w-full">Open Journal</Button>
                <Button size="sm" variant="outline" onClick={onNavigateToDiscover} className="w-full">Open Insights</Button>
              </div>

              <p className="text-[11px] text-muted-foreground">
                Keyboard: <span className="font-medium text-foreground">C</span> new entry, <span className="font-medium text-foreground">J</span> journal, <span className="font-medium text-foreground">D</span> discover, <span className="font-medium text-foreground">⇧G</span> complete goal, <span className="font-medium text-foreground">⌘K</span> commands.
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
};

export default DashboardHome;
