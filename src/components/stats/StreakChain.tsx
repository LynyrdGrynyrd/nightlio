import { useState, useEffect, memo } from 'react';
import { Flame, Check, Plus, Trophy, Share2 } from 'lucide-react';
import apiService from '../../services/api';
import { Button } from '../ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Skeleton } from '../ui/Skeleton';
import { cn } from '@/lib/utils';
import { useToast } from '../ui/ToastProvider';

interface DayInfo {
  date: string;
  dayName: string;
  hasEntry: boolean;
  isToday: boolean;
}

interface StreakDetails {
  current_streak: number;
  longest_streak: number;
  recent_days?: DayInfo[];
  // api types might vary, we define what we consume or map it
}

const StreakChain = () => {
  const [data, setData] = useState<StreakDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const { show } = useToast();

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      try {
        const details = await apiService.getStreakDetails();
        // Force type compatibility or assume structure
        if (mounted) setData(details as unknown as StreakDetails);
      } catch (err) {
        console.error('Failed to fetch streak details:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchData();
    return () => { mounted = false; };
  }, []);

  const handleShare = async () => {
    if (!data) return;
    setSharing(true);

    const streakText = `🔥 I'm on a ${data.current_streak}-day streak logging my mood!`;
    const longestText = data.longest_streak > 0 ? ` My longest streak: ${data.longest_streak} days!` : '';
    const shareText = `${streakText}${longestText}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'My Mood Streak',
          text: shareText,
        });
      } else {
        await navigator.clipboard.writeText(shareText);
        show('Streak copied to clipboard!', 'success');
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Share failed:', err);
      }
    } finally {
      setSharing(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const { current_streak, longest_streak, recent_days } = data;

  return (
    <Card className="overflow-hidden relative">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Flame className="text-[color:var(--warning)] fill-[color:var(--warning)]" size={18} />
          Days in a Row
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={handleShare}
          disabled={sharing || current_streak === 0}
          className="gap-2 h-8 text-xs font-medium"
        >
          <Share2 size={12} />
          Share
        </Button>
      </CardHeader>

      <CardContent className="pb-6">
        {recent_days && recent_days.length > 0 ? (
          <div className="flex items-center justify-between relative px-2 mb-2">
            {/* Connector Line */}
            <div className="absolute left-4 right-4 top-5 h-0.5 bg-muted -z-10" />

            {recent_days.map((day) => (
              <div
                key={day.date}
                className={cn(
                  "flex flex-col items-center gap-2 z-10",
                  day.isToday && "scale-110"
                )}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all shadow-sm bg-background",
                    day.hasEntry
                      ? "border-[color:var(--warning)] text-[color:var(--warning)]"
                      : "border-muted text-muted-foreground",
                    day.isToday && !day.hasEntry && "border-primary text-primary border-dashed animate-pulse ring-2 ring-primary/20"
                  )}
                >
                  {day.hasEntry ? (
                    <Check size={20} strokeWidth={3} />
                  ) : (
                    <Plus size={18} strokeWidth={2} />
                  )}
                </div>
                <span className={cn(
                  "text-[10px] font-bold uppercase",
                  day.isToday ? "text-primary" : "text-muted-foreground"
                )}>
                  {day.dayName}
                </span>
              </div>
            ))}

            <div className="flex flex-col items-center gap-2 ml-4">
              <div className="w-10 h-10 flex items-center justify-center">
                <span className="text-2xl font-black text-[color:var(--warning)] drop-shadow-sm tabular-nums">{current_streak}</span>
              </div>
              <span className="text-[10px] font-bold text-[color:var(--warning)] uppercase">Streak</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-4">
            <span className="text-4xl font-bold mb-2 tabular-nums">{current_streak}</span>
            <span className="text-muted-foreground text-sm">Days Streak</span>
          </div>
        )}

        {longest_streak > 0 && (
          <div className="flex items-center justify-center gap-2 mt-6 text-xs text-muted-foreground bg-muted/50 py-1.5 px-3 rounded-full w-fit mx-auto">
            <Trophy size={12} className="text-[color:var(--warning)]" />
            <span>Longest Chain: <span className="font-medium text-foreground tabular-nums">{longest_streak}</span></span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default memo(StreakChain);
