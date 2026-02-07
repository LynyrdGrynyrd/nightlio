import { useEffect, useMemo, useState, useCallback, useRef, KeyboardEvent } from 'react';
import apiService, { Goal } from '../../services/api';
import { useToast } from '../ui/ToastProvider';
import { Button } from '../ui/button';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// ========== Types ==========

interface MonthCalendarProps {
  year: number;
  month: number;
  dates: Set<string>;
  onToggle?: (dateStr: string) => void;
  toggling: string | null;
}

interface GoalStatsCalendarProps {
  goalId: number;
  onGoalUpdated?: (goal: Goal) => void;
}

interface YearMonth {
  y: number;
  m: number;
}

// ========== Sub-Component ==========

const MonthCalendar = ({ year, month, dates = new Set(), onToggle, toggling }: MonthCalendarProps) => {
  const firstDay = new Date(year, month, 1);
  const startWeekday = firstDay.getDay(); // 0-6 Sun..Sat
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];

  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const today = new Date();
  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>, iso: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (onToggle) onToggle(iso);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground font-medium">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="h-6 flex items-center justify-center">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          const iso = d ? `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}` : null;
          const isHit = iso && dates.has(iso);
          const isFuture = iso && iso > todayIso;
          const isTogglingThis = toggling === iso;
          const isClickable = iso && !isFuture && !isTogglingThis;

          return (
            <div
              key={i}
              onClick={() => isClickable && onToggle && onToggle(iso)}
              role={isClickable ? 'button' : undefined}
              tabIndex={isClickable ? 0 : undefined}
              onKeyDown={(e) => iso && isClickable && handleKeyDown(e, iso)}
              className={cn(
                "h-9 rounded-md flex items-center justify-center text-xs font-medium transition-[colors,transform]",
                !d && "invisible",
                isHit
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-muted text-foreground hover:bg-muted/80",
                isFuture && "opacity-40 cursor-not-allowed hover:bg-muted",
                !isClickable && !isFuture && "cursor-default",
                isTogglingThis && "opacity-70 scale-95 cursor-wait",
                isClickable && "cursor-pointer active:scale-95"
              )}
              title={isClickable ? (isHit ? 'Click to unmark' : 'Click to mark complete') : undefined}
            >
              {isTogglingThis ? <Loader2 size={12} className="animate-spin" /> : d}
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-muted-foreground text-center">
        Click any date (past or present) to toggle completion
      </p>
    </div>
  );
};

// ========== Main Component ==========

const GoalStatsCalendar = ({ goalId, onGoalUpdated }: GoalStatsCalendarProps) => {
  const [yearMonth, setYearMonth] = useState<YearMonth>(() => {
    const now = new Date();
    return { y: now.getFullYear(), m: now.getMonth() };
  });
  const [dates, setDates] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);
  const { show } = useToast();

  // Use ref to avoid stale closure in handleToggle
  const datesRef = useRef(dates);
  useEffect(() => { datesRef.current = dates; }, [dates]);

  const monthLabel = useMemo(
    () => new Date(yearMonth.y, yearMonth.m, 1).toLocaleString(undefined, { month: 'long', year: 'numeric' }),
    [yearMonth]
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const start = `${yearMonth.y}-${String(yearMonth.m + 1).padStart(2, '0')}-01`;
        const end = `${yearMonth.y}-${String(yearMonth.m + 1).padStart(2, '0')}-${String(new Date(yearMonth.y, yearMonth.m + 1, 0).getDate()).padStart(2, '0')}`;
        const rows = await apiService.getGoalCompletions(goalId, { start, end });
        if (!mounted) return;
        setDates(new Set((rows || []).map(r => r.date)));
      } catch {
        if (mounted) setDates(new Set());
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [goalId, yearMonth]);

  const handleToggle = useCallback(async (dateStr: string) => {
    if (toggling) return;
    setToggling(dateStr);

    const wasCompleted = datesRef.current.has(dateStr);
    setDates(prev => {
      const next = new Set(prev);
      if (wasCompleted) {
        next.delete(dateStr);
      } else {
        next.add(dateStr);
      }
      return next;
    });

    try {
      const result = await apiService.toggleGoalCompletion(goalId, dateStr);
      // Result contains { completed: boolean } not { is_completed: boolean }
      const isCompleted = (result as { completed?: boolean }).completed;
      show(isCompleted ? 'Marked complete' : 'Unmarked', 'success');
      // onGoalUpdated expects a full Goal, but result is partial - skip if not a full Goal
      if (onGoalUpdated && result && 'id' in result && 'user_id' in result && 'title' in result && 'created_at' in result) {
        onGoalUpdated(result as unknown as Goal);
      }
    } catch {
      setDates(prev => {
        const next = new Set(prev);
        if (wasCompleted) {
          next.add(dateStr);
        } else {
          next.delete(dateStr);
        }
        return next;
      });
      show('Failed to toggle completion', 'error');
    } finally {
      setToggling(null);
    }
  }, [goalId, toggling, show, onGoalUpdated]);

  const prevMonth = () => setYearMonth(({ y, m }) => (m === 0 ? { y: y - 1, m: 11 } : { y, m: m - 1 }));
  const nextMonth = () => setYearMonth(({ y, m }) => (m === 11 ? { y: y + 1, m: 0 } : { y, m: m + 1 }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="icon" onClick={prevMonth} className="h-10 w-10" aria-label="Previous month">
          <ChevronLeft size={16} aria-hidden="true" />
        </Button>
        <div className="font-semibold text-sm flex items-center gap-2">
          {monthLabel}
          {loading && <Loader2 size={12} className="animate-spin text-muted-foreground" />}
        </div>
        <Button variant="outline" size="icon" onClick={nextMonth} className="h-10 w-10" aria-label="Next month">
          <ChevronRight size={16} aria-hidden="true" />
        </Button>
      </div>
      <MonthCalendar
        year={yearMonth.y}
        month={yearMonth.m}
        dates={dates}
        onToggle={handleToggle}
        toggling={toggling}
      />
    </div>
  );
};

export default GoalStatsCalendar;
