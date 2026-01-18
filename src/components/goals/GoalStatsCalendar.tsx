import { useEffect, useMemo, useState, useCallback, KeyboardEvent } from 'react';
import apiService, { Goal } from '../../services/api';
import { useToast } from '../ui/ToastProvider';

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
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 8, fontSize: 12, color: 'var(--text-muted)' }}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} style={{ textAlign: 'center' }}>{d}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
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
              style={{
                height: 28,
                borderRadius: 6,
                border: '1px solid var(--border)',
                background: isHit ? 'var(--accent-bg)' : 'var(--accent-bg-soft)',
                color: isHit ? '#fff' : 'var(--text)',
                display: 'grid',
                placeItems: 'center',
                fontSize: 12,
                cursor: isClickable ? 'pointer' : 'default',
                opacity: isTogglingThis ? 0.5 : (isFuture ? 0.4 : 1),
                transition: 'background-color 0.2s, transform 0.1s',
                transform: isTogglingThis ? 'scale(0.95)' : 'scale(1)',
              }}
              title={isClickable ? (isHit ? 'Click to unmark' : 'Click to mark complete') : undefined}
            >
              {d || ''}
            </div>
          );
        })}
      </div>
      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 10, textAlign: 'center' }}>
        Click any date to toggle completion
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

    const wasCompleted = dates.has(dateStr);
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
      show(result.is_completed ? 'Marked complete' : 'Unmarked', 'success');
      if (onGoalUpdated && result) {
        onGoalUpdated(result);
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
  }, [goalId, dates, toggling, show, onGoalUpdated]);

  const prevMonth = () => setYearMonth(({ y, m }) => (m === 0 ? { y: y - 1, m: 11 } : { y, m: m - 1 }));
  const nextMonth = () => setYearMonth(({ y, m }) => (m === 11 ? { y: y + 1, m: 0 } : { y, m: m + 1 }));

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <button onClick={prevMonth} className="primary" style={{ padding: '6px 10px' }}>{'<'}</button>
        <div style={{ fontWeight: 600 }}>{monthLabel}{loading ? '…' : ''}</div>
        <button onClick={nextMonth} className="primary" style={{ padding: '6px 10px' }}>{'>'}</button>
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
