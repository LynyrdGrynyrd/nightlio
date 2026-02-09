import { useRef, useState, useMemo, Fragment, memo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../ui/button';
import { Share, Waves, Grid2X2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BaseEntry } from '../../types/entry';
import { useTheme } from '../../contexts/ThemeContext';
import { resolveCSSVar } from './statisticsConstants';
import MoodLandscape from './MoodLandscape';

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

type YearPixelsView = 'landscape' | 'grid';

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
  const [viewMode, setViewMode] = useState<YearPixelsView>('landscape');
  const visualRef = useRef<HTMLDivElement>(null);
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

  const yearPoints = useMemo(() => {
    const points: Array<{
      iso: string;
      monthIndex: number;
      day: number;
      mood: number | null;
      shouldDim: boolean;
    }> = [];

    const dayCursor = new Date(selectedYear, 0, 1);
    const finalDay = new Date(selectedYear + 1, 0, 1);
    const activeFilter = moodFilter === 'all' ? null : Number(moodFilter);

    while (dayCursor < finalDay) {
      const monthIndex = dayCursor.getMonth();
      const day = dayCursor.getDate();
      const key = `${monthIndex}-${day}`;
      const mood = yearData[key]?.mood ?? null;
      const roundedMood = mood === null ? null : Math.round(mood);
      const shouldDim = activeFilter !== null && roundedMood !== null && roundedMood !== activeFilter;

      points.push({
        iso: dayCursor.toISOString(),
        monthIndex,
        day,
        mood,
        shouldDim,
      });

      dayCursor.setDate(dayCursor.getDate() + 1);
    }

    return points;
  }, [selectedYear, moodFilter, yearData]);

  const handleExport = async () => {
    if (!visualRef.current) return;

    try {
      // Lazy-load html2canvas only when user clicks export (~73KB saved from initial bundle)
      const { default: html2canvas } = await import('html2canvas');

      // Use standard background color for export
      const bgColor = getComputedStyle(document.body).getPropertyValue('--background').trim()
        || getComputedStyle(document.documentElement).getPropertyValue('--background').trim()
        || 'rgb(255, 255, 255)';

      const canvas = await html2canvas(visualRef.current, {
        backgroundColor: bgColor,
        scale: 2 // Retain high quality
      });

      const link = document.createElement('a');
      link.download = `${viewMode}-mood-view-${selectedYear}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Failed to export Year in Pixels:', err);
    }
  };

  return (
    <Card className="rounded-[calc(var(--radius)+4px)]">
      <CardHeader className="flex flex-col items-start gap-3 pb-4">
        <div className="w-full flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-base font-semibold">Mood Landscape</CardTitle>
          <div className="inline-flex items-center rounded-full border border-border/70 bg-muted/50 p-1">
            <button
              type="button"
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                viewMode === 'landscape' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
              onClick={() => setViewMode('landscape')}
            >
              <Waves size={14} />
              Landscape
            </button>
            <button
              type="button"
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                viewMode === 'grid' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
              onClick={() => setViewMode('grid')}
            >
              <Grid2X2 size={14} />
              Classic Grid
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full">
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
        <div ref={visualRef} className="p-4 bg-background/75 rounded-[calc(var(--radius)+2px)] border border-border/70 overflow-x-auto">
          {viewMode === 'landscape' ? (
            <MoodLandscape
              points={yearPoints}
              selectedYear={selectedYear}
              moodFilter={moodFilter}
              getMoodColor={getMoodColor}
              onDayClick={onDayClick}
            />
          ) : (
            <>
              <div className="grid gap-[2px] grid-cols-[24px_repeat(31,1fr)] sm:grid-cols-[32px_repeat(31,1fr)]">
                <div className="h-6" />
                {DAYS.map(day => (
                  <div key={day} className="text-center text-[10px] text-muted-foreground font-medium h-6 flex items-center justify-center">
                    {day % 5 === 0 || day === 1 ? day : ''}
                  </div>
                ))}

                {MONTHS.map((monthLabel, monthIndex) => (
                  <Fragment key={`month-${monthIndex}`}>
                    <div className="text-[10px] sm:text-xs text-muted-foreground font-semibold flex items-center justify-center h-5 sm:h-6">
                      {monthLabel}
                    </div>

                    {DAYS.map(day => {
                      const date = new Date(selectedYear, monthIndex, day);
                      const isValidDate = date.getMonth() === monthIndex;

                      if (!isValidDate) {
                        return <div key={`${monthIndex}-${day}`} className="bg-transparent" />;
                      }

                      const data = yearData[`${monthIndex}-${day}`];
                      const mood = data ? data.mood : null;
                      const roundedMood = mood ? Math.round(mood) : null;
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
                            "group relative aspect-square rounded-[3px] transition-[transform,opacity] duration-200 flex items-center justify-center border border-muted/20",
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
                    <div className="w-3 h-3 rounded-[3px]" style={{ background: getMoodColor(score) }} />
                    <span>Level {score}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default memo(YearInPixels);
