import { useRef, useState, useMemo, Fragment, memo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../ui/button';
import { Share } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BaseEntry } from '../../types/entry';
import { useTheme } from '../../contexts/ThemeContext';
import { resolveCSSVar } from './statisticsViewUtils';

// Use shared BaseEntry type
type Entry = BaseEntry;

interface YearInPixelsProps {
  entries: Entry[];
  onDayClick?: (date: string) => void;
}

interface YearDataPoint {
  mood: number;
  entry: Entry;
}

// Constants - moved outside component to avoid recreation on each render
const MONTHS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
const FULL_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
const MOOD_OPTIONS = [
  { value: 'all', label: 'All Moods' },
  { value: '5', label: '😊 Rad' },
  { value: '4', label: '🙂 Good' },
  { value: '3', label: '😐 Meh' },
  { value: '2', label: '😔 Bad' },
  { value: '1', label: '😢 Awful' },
];

const YearInPixels = ({ entries, onDayClick }: YearInPixelsProps) => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [moodFilter, setMoodFilter] = useState<string>('all');
  const gridRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  // Resolve mood colors for current theme (re-computes on theme change)
  const moodColors = useMemo(() => {
    return {
      1: resolveCSSVar('var(--mood-1)'),
      2: resolveCSSVar('var(--mood-2)'),
      3: resolveCSSVar('var(--mood-3)'),
      4: resolveCSSVar('var(--mood-4)'),
      5: resolveCSSVar('var(--mood-5)'),
    };
  }, [theme]);

  const getMoodColor = (mood: number): string => {
    const rounded = Math.round(mood) as 1 | 2 | 3 | 4 | 5;
    return moodColors[rounded] || moodColors[3];
  };

  // Get available years from entries
  const availableYears = useMemo(() => {
    const years = new Set([currentYear]);
    entries.forEach(entry => {
      if (entry.date) {
        years.add(new Date(entry.date).getFullYear());
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [entries, currentYear]);

  // Process data for the grid
  const yearData = useMemo(() => {
    const data: Record<string, { moods: number[]; entry: Entry }> = {};

    entries.forEach(entry => {
      if (!entry.mood) return;

      // Try to parse date with fallback to created_at
      let date: Date | null = null;
      if (entry.date) {
        const parsed = new Date(entry.date);
        if (!isNaN(parsed.getTime())) date = parsed;
      }
      // Fallback to created_at if date parsing failed
      if (!date && entry.created_at) {
        const parsed = new Date(entry.created_at);
        if (!isNaN(parsed.getTime())) date = parsed;
      }

      if (!date) return; // Skip if no valid date
      if (date.getFullYear() !== selectedYear) return;

      const month = date.getMonth(); // 0-11
      const day = date.getDate(); // 1-31
      const key = `${month}-${day}`;

      if (!data[key]) {
        data[key] = { moods: [], entry: entry }; // Store latest entry reference
      }
      data[key].moods.push(Number(entry.mood));
    });

    // Calculate averages
    const processed: Record<string, YearDataPoint> = {};
    Object.keys(data).forEach(key => {
      const moods = data[key].moods;
      const avg = moods.reduce((a, b) => a + b, 0) / moods.length;
      processed[key] = {
        mood: avg,
        entry: data[key].entry
      };
    });

    return processed;
  }, [entries, selectedYear]);

  const handleExport = async () => {
    if (!gridRef.current) return;

    try {
      // Lazy-load html2canvas only when user clicks export (~73KB saved from initial bundle)
      const { default: html2canvas } = await import('html2canvas');

      // Use standard background color for export
      const bgColor = getComputedStyle(document.body).getPropertyValue('--background').trim()
        || getComputedStyle(document.documentElement).getPropertyValue('--background').trim()
        || 'rgb(255, 255, 255)';

      const canvas = await html2canvas(gridRef.current, {
        backgroundColor: bgColor,
        scale: 2 // Retain high quality
      });

      const link = document.createElement('a');
      link.download = `year-in-pixels-${selectedYear}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Failed to export Year in Pixels:', err);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 space-y-2 sm:space-y-0">
        <CardTitle className="text-base font-semibold">Year in Pixels</CardTitle>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
            <SelectTrigger className="w-[100px] h-8 text-xs">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map(year => (
                <SelectItem key={year} value={String(year)}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={moodFilter} onValueChange={setMoodFilter}>
            <SelectTrigger className="w-[130px] h-8 text-xs">
              <SelectValue placeholder="Filter Mood" />
            </SelectTrigger>
            <SelectContent>
              {MOOD_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="ghost" size="icon" onClick={handleExport} title="Export PNG" className="ml-auto">
            <Share size={16} />
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div ref={gridRef} className="p-4 bg-background rounded-lg border overflow-x-auto">
          <div className="grid gap-[2px] grid-cols-[24px_repeat(31,1fr)] sm:grid-cols-[32px_repeat(31,1fr)]">
            {/* Header Row (Days) */}
            <div className="h-6" /> {/* Corner Spacer */}
            {DAYS.map(day => (
              <div key={day} className="text-center text-[10px] text-muted-foreground font-medium h-6 flex items-center justify-center">
                {day % 5 === 0 || day === 1 ? day : ''}
              </div>
            ))}

            {/* Months Rows */}
            {MONTHS.map((monthLabel, monthIndex) => (
              <Fragment key={`month-${monthIndex}`}>
                {/* Month Label */}
                <div className="text-[10px] sm:text-xs text-muted-foreground font-semibold flex items-center justify-center h-5 sm:h-6">
                  {monthLabel}
                </div>

                {/* Days Cells */}
                {DAYS.map(day => {
                  const date = new Date(selectedYear, monthIndex, day);
                  // Check if date is valid for this month
                  const isValidDate = date.getMonth() === monthIndex;

                  if (!isValidDate) {
                    return <div key={`${monthIndex}-${day}`} className="bg-transparent" />;
                  }

                  const data = yearData[`${monthIndex}-${day}`];
                  const mood = data ? data.mood : null;
                  const roundedMood = mood ? Math.round(mood) : null;

                  // Apply mood filter - dim cells that don't match
                  const currentFilterVal = moodFilter === 'all' ? 'all' : Number(moodFilter);
                  const shouldDim = currentFilterVal !== 'all' && mood !== null && roundedMood !== currentFilterVal;

                  const color = mood ? getMoodColor(mood) : undefined;
                  const isClickable = !!onDayClick;
                  const isEmpty = !mood;

                  return (
                    <div
                      key={`${monthIndex}-${day}`}
                      onClick={() => isClickable && onDayClick(date.toISOString())}
                      title={data ? `${FULL_MONTHS[monthIndex]} ${day}: Mood ${(mood ?? 0).toFixed(1)}` : `${FULL_MONTHS[monthIndex]} ${day} - Click to add entry`}
                      className={cn(
                        "group relative aspect-square rounded-[2px] transition-[transform,opacity] duration-200 flex items-center justify-center border border-muted/20",
                        isClickable ? "cursor-pointer hover:z-10 hover:scale-125" : "cursor-default",
                        shouldDim ? "opacity-30" : "opacity-100",
                        isEmpty ? "bg-muted/30" : ""
                      )}
                      style={{ backgroundColor: color }}
                    >
                      {isEmpty && isClickable && (
                        <span className="text-[8px] font-thin text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                          +
                        </span>
                      )}
                    </div>
                  );
                })}
              </Fragment>
            ))}
          </div>

          <div className="flex gap-4 justify-center mt-6 text-xs text-muted-foreground">
            {[1, 2, 3, 4, 5].map(score => (
              <div key={score} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-[2px]" style={{ background: getMoodColor(score) }} />
                <span>Level {score}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default memo(YearInPixels);
