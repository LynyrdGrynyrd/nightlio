import { useState, useMemo, memo, type KeyboardEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { WEEK_DAYS } from '../statisticsConstants';
import type { CalendarDay } from '../statisticsTypes';
import type { EntryWithSelections } from '../../../types/entry';
import { cn } from '@/lib/utils';

type Entry = EntryWithSelections;

interface FilteredCalendarDay extends CalendarDay {
  dimmed?: boolean;
}

const MOOD_OPTIONS = [
  { value: 'all', label: 'All Moods' },
  { value: '5', label: '\u{1F60A} Rad' },
  { value: '4', label: '\u{1F642} Good' },
  { value: '3', label: '\u{1F610} Meh' },
  { value: '2', label: '\u{1F614} Bad' },
  { value: '1', label: '\u{1F622} Awful' },
];

const MoodCalendarSection = memo(function MoodCalendarSection({ days, onDayClick, onEntryClick }: {
  days: CalendarDay[];
  onDayClick?: (date: string) => void;
  onEntryClick?: (entry: Entry) => void;
}) {
  const [moodFilter, setMoodFilter] = useState('all');

  const handleDayClick = (day: FilteredCalendarDay) => {
    if (day.isFuture) return;
    if (day.entry && onEntryClick) {
      onEntryClick(day.entry);
    } else if (!day.entry && onDayClick) {
      onDayClick(day.dateString);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>, day: FilteredCalendarDay) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleDayClick(day);
    }
  };

  const filteredDays = useMemo((): FilteredCalendarDay[] => days.map(day => {
    if (moodFilter === 'all') return day;
    if (!day.entry) return day;
    const moodMatch = day.entry.mood === parseInt(moodFilter);
    return { ...day, dimmed: !moodMatch };
  }), [days, moodFilter]);

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold">Mood Calendar</CardTitle>
          <div className="text-xs text-muted-foreground">Click a day to add or view an entry</div>
        </div>

        <Select value={moodFilter} onValueChange={setMoodFilter}>
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <SelectValue placeholder="Filter by mood" />
          </SelectTrigger>
          <SelectContent>
            {MOOD_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {WEEK_DAYS.map((day) => (
            <div key={day} className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {filteredDays.map((day) => {
            const { key, label, entry, IconComponent, iconColor, isCurrentMonth, isToday, isFuture, dimmed } = day;
            const isClickable = !isFuture && (onDayClick || onEntryClick);

            return (
              <div
                key={key}
                role={isClickable ? 'button' : undefined}
                tabIndex={isClickable ? 0 : undefined}
                onClick={() => handleDayClick(day)}
                onKeyDown={(e) => handleKeyDown(e, day)}
                className={cn(
                  "aspect-square rounded-md flex flex-col items-center justify-center text-xs relative transition-[colors,opacity] border",
                  entry ? "border-transparent" : "border-transparent hover:border-primary/20",
                  !isCurrentMonth && "opacity-30",
                  isFuture && "opacity-20 cursor-not-allowed",
                  isToday && !entry && "ring-2 ring-primary ring-offset-1",
                  isClickable && !entry && "cursor-pointer bg-muted/30 hover:bg-muted",
                  isClickable && entry && "cursor-pointer hover:brightness-110 shadow-sm",
                  dimmed && "opacity-20"
                )}
                style={{
                  backgroundColor: entry && iconColor ? iconColor : undefined,
                  color: entry ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                }}
                title={entry ? `View entry for ${day.dateString}` : isFuture ? `${day.dateString} (future)` : `Add entry for ${day.dateString}`}
              >
                {entry && IconComponent ? (
                  <IconComponent size={16} strokeWidth={2.5} />
                ) : !isFuture && !entry ? (
                  <div className="flex flex-col items-center text-muted-foreground/50 group-hover:text-primary">
                    <span className="font-medium">{label}</span>
                  </div>
                ) : (
                  label
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
});

export default MoodCalendarSection;
