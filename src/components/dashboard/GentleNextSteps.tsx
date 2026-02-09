import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import type { ActionItem, ProgressPrompt } from '../../types/dashboard';

interface GentleNextStepsProps {
  actionItems: ActionItem[];
  goalPrompts: ProgressPrompt[];
  achievementPrompts: ProgressPrompt[];
  promptsLoading: boolean;
  streakAtRisk: boolean;
  currentStreak: number;
  recentWeekCount: number;
  recentAvgMood: number | null;
  onNavigateToEntry: () => void;
  onNavigateToJournal: () => void;
  onNavigateToDiscover: () => void;
}

const GentleNextSteps = ({
  actionItems,
  goalPrompts,
  achievementPrompts,
  promptsLoading,
  streakAtRisk,
  currentStreak,
  recentWeekCount,
  recentAvgMood,
  onNavigateToEntry,
  onNavigateToJournal,
  onNavigateToDiscover,
}: GentleNextStepsProps) => (
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
            <div className="text-lg font-semibold tabular-nums">{recentWeekCount}/7</div>
          </div>
          <div className="rounded-lg border bg-muted/20 p-2">
            <div className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground">Avg Mood</div>
            <div className="text-lg font-semibold tabular-nums">{recentAvgMood ?? '—'}</div>
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
);

export default GentleNextSteps;
