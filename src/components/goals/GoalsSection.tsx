import { useState, useEffect } from 'react';
import { Target, Plus, ArrowRight, Calendar, CheckCircle, XCircle } from 'lucide-react';
import Skeleton from '../ui/Skeleton';
import apiService from '../../services/api';
import AddGoalCard from './AddGoalCard';
import { useToast } from '../ui/ToastProvider';
import { getTodayISO } from '../../utils/dateUtils';
import ResponsiveGrid from '../layout/ResponsiveGrid';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Progress } from '../ui/progress';
import { cn } from '@/lib/utils';
import {
  useGoalCompletion,
  GoalWithExtras,
  mapGoalToExtras,
  isGoalDoneToday,
} from '../../hooks/useGoalCompletion';

interface GoalsSectionProps {
  onNavigateToGoals: () => void;
}

interface GoalPreviewCardProps {
  goal: GoalWithExtras;
  onToggleComplete: (goalId: number) => Promise<void>;
}

const GoalsSection = ({ onNavigateToGoals }: GoalsSectionProps) => {
  const [goals, setGoals] = useState<GoalWithExtras[]>([]);
  const [loading, setLoading] = useState(true);
  const { show } = useToast();

  const { toggleGoalCompletion } = useGoalCompletion({
    onSuccess: (message) => show(message, 'success'),
    onError: (message) => show(message, 'error'),
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await apiService.getGoals();
        if (!mounted) return;
        const today = getTodayISO();
        const mapped = (data || []).slice(0, 3).map((g) => mapGoalToExtras(g, today));
        setGoals(mapped);
      } catch {
        // leave empty on failure; section can show skeleton or CTA
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleToggleComplete = async (goalId: number) => {
    await toggleGoalCompletion(goalId, goals, setGoals);
  };

  if (loading) {
    return (
      <div className="text-left py-4">
        <div className="flex items-center justify-between mb-4">
          <Skeleton height={28} width={120} />
          <Skeleton height={32} width={100} />
        </div>
        <ResponsiveGrid minCardWidth="16rem" maxColumns={4} gapToken="normal">
          {[1, 2, 3].map((i) => (
            <div key={i}>
              <Skeleton height={160} radius={16} />
            </div>
          ))}
        </ResponsiveGrid>
      </div>
    );
  }

  return (
    <div className="text-left space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Goals</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onNavigateToGoals}
          className="text-primary hover:text-primary gap-1"
        >
          View All
          <ArrowRight size={14} />
        </Button>
      </div>

      {goals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4">
            <div className="flex items-center gap-2.5 text-foreground">
              <span className="text-primary flex items-center justify-center w-8 h-8 rounded-full bg-accent border border-border">
                <Target size={16} strokeWidth={2} />
              </span>
              <p className="m-0 text-base opacity-90">No goals yet.</p>
            </div>
            <Button onClick={onNavigateToGoals} size="sm" className="inline-flex items-center gap-1.5 w-full sm:w-auto">
              <Plus size={16} />
              Add First Goal
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ResponsiveGrid minCardWidth="16rem" maxColumns={4} gapToken="normal">
          <AddGoalCard onAdd={onNavigateToGoals} />
          {goals.map((goal) => (
            <GoalPreviewCard key={goal.id} goal={goal} onToggleComplete={handleToggleComplete} />
          ))}
        </ResponsiveGrid>
      )}
    </div>
  );
};

const GoalPreviewCard = ({ goal, onToggleComplete }: GoalPreviewCardProps) => {
  const [isToggling, setIsToggling] = useState(false);
  const progressPercentage = (goal.completed / goal.total) * 100;
  const isCompletedWeek = goal.completed >= goal.total;
  const today = getTodayISO();
  const isDoneToday = isGoalDoneToday(goal, today);

  return (
    <Card className="group transition-[border-color,box-shadow] hover:border-primary/40 hover:shadow-md">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className={cn('flex items-center gap-2.5 flex-1', goal.streak > 0 && 'mr-8')}>
            <span className="text-primary flex items-center justify-center w-7 h-7 rounded-full bg-accent border border-border">
              <Target size={16} strokeWidth={2} />
            </span>
            <div className="flex items-center text-sm text-foreground/80">
              <Calendar size={14} className="mr-1" />
              <span>{goal.frequency}</span>
            </div>
          </div>

          {goal.streak > 0 && (
            <div className="flex items-center bg-primary text-primary-foreground text-[0.7rem] py-0.5 px-1.5 rounded-xl font-medium leading-none">
              🔥 {goal.streak}
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <h3 className="text-base font-semibold leading-snug text-foreground">{goal.title}</h3>
          {goal.description && (
            <p className="text-sm leading-relaxed text-muted-foreground line-clamp-2">
              {goal.description}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm text-foreground/90">
            <span>Progress</span>
            <span className="tabular-nums">
              {goal.completed}/{goal.total}
            </span>
          </div>
          <Progress
            value={progressPercentage}
            className="h-1.5"
            indicatorClassName={isCompletedWeek ? 'bg-[color:var(--success)]' : 'bg-primary'}
          />
        </div>

        <Button
          onClick={async () => {
            setIsToggling(true);
            try {
              await onToggleComplete(goal.id);
            } finally {
              setIsToggling(false);
            }
          }}
          disabled={isToggling}
          className={cn(
            'w-full gap-1.5',
            isDoneToday ? 'bg-[color:var(--success)] hover:brightness-95' : 'bg-primary',
            isToggling && 'cursor-wait opacity-70'
          )}
          title={isDoneToday ? 'Click to unmark' : 'Click to mark as done'}
        >
          {isDoneToday ? <XCircle size={14} /> : <CheckCircle size={14} />}
          {isToggling ? 'Updating...' : isDoneToday ? 'Undo' : 'Mark as done'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default GoalsSection;
