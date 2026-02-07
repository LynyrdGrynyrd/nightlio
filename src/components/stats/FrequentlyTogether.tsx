import { useState, useEffect, memo, useTransition } from 'react';
import { getIconComponent } from '../ui/IconPicker';
import apiService from '../../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';

interface Pair {
  option1_id?: number;
  option1_name: string;
  option1_icon?: string;
  option2_id?: number;
  option2_name: string;
  option2_icon?: string;
  count: number;
  frequency?: number;
}

interface FrequentlyTogetherProps {
  data: Pair[] | null;
}

const MOOD_OPTIONS = [
  { value: 'all', label: 'All Moods', emoji: '🎯' },
  { value: '5', label: 'Amazing', emoji: '😄' },
  { value: '4', label: 'Good', emoji: '🙂' },
  { value: '3', label: 'Okay', emoji: '😐' },
  { value: '2', label: 'Bad', emoji: '😕' },
  { value: '1', label: 'Terrible', emoji: '😢' },
];

const FrequentlyTogether = ({ data }: FrequentlyTogetherProps) => {
  const [selectedMood, setSelectedMood] = useState<string>('all');
  const [filteredData, setFilteredData] = useState<Pair[] | null>(null);
  const [isPending, startTransition] = useTransition();

  // Use provided data or filtered data
  const displayData = filteredData !== null ? filteredData : data;

  useEffect(() => {
    if (selectedMood === 'all') {
      startTransition(() => {
        setFilteredData(null);
      });
      return;
    }

    let mounted = true;
    const fetchFiltered = async () => {
      try {
        // apiService expects string for mood
        const result = await apiService.getAnalyticsCoOccurrenceByMood(selectedMood);
        if (mounted) {
          startTransition(() => {
            setFilteredData(result as unknown as Pair[] || []);
          });
        }
      } catch (err) {
        console.error('Failed to fetch filtered pairs:', err);
        if (mounted) {
          startTransition(() => {
            setFilteredData([]);
          });
        }
      }
    };
    fetchFiltered();
    return () => { mounted = false; };
  }, [selectedMood]);

  if ((!data || data.length === 0) && selectedMood === 'all') {
    return (
      <Card className="p-6 text-center text-muted-foreground border-dashed bg-muted/10">
        <p>Not enough data for pairs yet.</p>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-4 space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold">Often Together</CardTitle>
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            Common pairs in <span className="font-medium text-primary">
              {MOOD_OPTIONS.find(m => m.value === selectedMood)?.label || 'All Moods'}
            </span>
          </div>
        </div>

        <Select value={selectedMood} onValueChange={setSelectedMood}>
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <SelectValue placeholder="Filter by mood" />
          </SelectTrigger>
          <SelectContent>
            {MOOD_OPTIONS.map(mood => (
              <SelectItem key={mood.value} value={mood.value}>
                <span className="mr-2">{mood.emoji}</span>
                {mood.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>

      <CardContent>
        {!displayData || displayData.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground bg-muted/20 rounded-lg">
            No activity pairs found for this mood.
          </div>
        ) : (
          <div className={cn(
            "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 lg:gap-4 transition-opacity duration-200",
            isPending && "opacity-60"
          )}>
            {displayData.slice(0, 8).map((pair, idx) => {
              const Icon1 = getIconComponent(pair.option1_icon || 'Activity');
              const Icon2 = getIconComponent(pair.option2_icon || 'Activity');
              const count = pair.count || pair.frequency || 0;
              const key = pair.option1_id && pair.option2_id
                ? `${pair.option1_id}-${pair.option2_id}`
                : `${pair.option1_name}-${pair.option2_name}-${idx}`;

              return (
                <div
                  key={key}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:border-primary/50 transition-colors shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-1">
                      <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center border-2 border-background ring-1 ring-border">
                        {Icon1 && <Icon1 size={14} className="text-foreground" />}
                      </div>
                      <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center border-2 border-background ring-1 ring-border z-10">
                        {Icon2 && <Icon2 size={14} className="text-foreground" />}
                      </div>
                    </div>
                    <div className="flex flex-col leading-tight">
                      <span className="text-xs font-medium truncate max-w-[80px] lg:max-w-[100px] xl:max-w-[120px]">{pair.option1_name}</span>
                      <span className="text-xs font-medium truncate max-w-[80px] lg:max-w-[100px] xl:max-w-[120px]">{pair.option2_name}</span>
                    </div>
                  </div>

                  <Badge variant="secondary" className="font-mono text-[10px] h-5 px-1.5 ml-2 tabular-nums">
                    {count}×
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default memo(FrequentlyTogether);
