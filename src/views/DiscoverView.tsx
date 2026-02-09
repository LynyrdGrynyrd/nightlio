import { lazy, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import type { EntryWithSelections } from '../types/entry';

const StatisticsView = lazy(() => import('../components/stats/StatisticsView'));
const AchievementsView = lazy(() => import('./AchievementsView'));

interface Statistics {
  statistics?: {
    total_entries: number;
    average_mood: number;
  };
  mood_distribution?: Record<number, number>;
  current_streak?: number;
}

interface DiscoverViewProps {
  statistics: Statistics | null;
  pastEntries: EntryWithSelections[];
  statsLoading: boolean;
  statsError?: string;
  onDayClick?: (date: string) => void;
  onEntryClick?: (entry: EntryWithSelections) => void;
}

const DiscoverView = ({
  statistics,
  pastEntries,
  statsLoading,
  statsError,
  onDayClick,
  onEntryClick,
}: DiscoverViewProps) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'analytics';

  const handleTabChange = (value: string) => {
    if (value === 'analytics') {
      searchParams.delete('tab');
    } else {
      searchParams.set('tab', value);
    }
    setSearchParams(searchParams, { replace: true });
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full max-w-sm grid-cols-2 h-10">
          <TabsTrigger value="analytics">Insights</TabsTrigger>
          <TabsTrigger value="achievements">Milestones</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="mt-6">
          <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading insights...</div>}>
            <StatisticsView
              statistics={statistics}
              pastEntries={pastEntries}
              loading={statsLoading}
              error={statsError}
              onDayClick={onDayClick}
              onEntryClick={onEntryClick}
            />
          </Suspense>
        </TabsContent>

        <TabsContent value="achievements" className="mt-6">
          <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading milestones...</div>}>
            <AchievementsView />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DiscoverView;
