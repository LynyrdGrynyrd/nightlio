import { useState, KeyboardEvent, MouseEvent, lazy, Suspense } from 'react';
import { Target, Trash2, CheckCircle, Calendar, XCircle, Flame, Loader2 } from 'lucide-react';
import { useToast } from '../ui/ToastProvider';
import Modal from '../ui/Modal';
import ConfirmDialog from '../ui/ConfirmDialog';
import { Skeleton } from '../ui/Skeleton';

// Lazy load GoalStatsCalendar since it's only shown in modal
const GoalStatsCalendar = lazy(() => import('./GoalStatsCalendar'));
import { Goal } from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import type { ActionVisibility } from '@/types/common';

// ========== Types ==========

interface GoalCardProps {
  goal: Goal & {
    frequency?: string;
    completed?: number;
    total?: number;
    last_completed_date?: string | null;
    streak?: number;
    _doneToday?: boolean;
  };
  onDelete: (goalId: number) => void;
  onUpdateProgress: (goalId: number) => void;
  onToggleCompletion: (goalId: number, date: string) => Promise<void>;
  onGoalUpdated: (goal: Goal) => void;
}

// ========== Component ==========

// Helper to compute isDoneToday outside component
const computeIsDoneToday = (goal: GoalCardProps['goal']): boolean => {
  const d = new Date();
  const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  try {
    const localVal = typeof localStorage !== 'undefined' ? localStorage.getItem(`goal_done_${goal.id}`) : null;
    return (localVal === today) || goal.last_completed_date === today || goal._doneToday === true;
  } catch {
    return goal.last_completed_date === today || goal._doneToday === true;
  }
};

const DELETE_ACTION_VISIBILITY: ActionVisibility = 'adaptiveTouch';

const GoalCard = ({ goal, onDelete, onUpdateProgress, onToggleCompletion, onGoalUpdated }: GoalCardProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { show } = useToast();

  // Compute isDoneToday early so it can be used in handlers
  const isDoneToday = computeIsDoneToday(goal);

  const handleDeleteClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);

    // Simulate API call delay
    setTimeout(() => {
      onDelete(goal.id);
      show('Goal deleted successfully', 'success');
      setIsDeleting(false);
    }, 500);
  };

  const handleToggleComplete = async () => {
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    // If toggle handler is provided, use it (supports both mark and unmark)
    if (onToggleCompletion) {
      setIsToggling(true);
      try {
        await onToggleCompletion(goal.id, today);
      } finally {
        setIsToggling(false);
      }
      return;
    }

    // Fallback to old increment-only behavior
    try {
      const localVal = typeof localStorage !== 'undefined' ? localStorage.getItem(`goal_done_${goal.id}`) : null;
      if (localVal === today) {
        show('Already completed for today', 'info');
        return;
      }
    } catch {
      // localStorage access failed
    }
    if (goal.last_completed_date === today) {
      show('Already completed for today', 'info');
      return;
    }
    if (goal.completed !== undefined && goal.total !== undefined && goal.completed >= goal.total) {
      show('Goal already completed for this period!', 'info');
      return;
    }
    onUpdateProgress(goal.id);
    if (!isDoneToday) {
      import('canvas-confetti').then((confetti) => {
        confetti.default({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      });
    }
    show('Progress updated!', 'success');
  };

  const progressPercentage = goal.completed !== undefined && goal.total !== undefined
    ? (goal.completed / goal.total) * 100
    : 0;
  const isCompleted = goal.completed !== undefined && goal.total !== undefined && goal.completed >= goal.total;

  // When calendar updates the goal, bubble it up
  const handleGoalUpdatedFromCalendar = (updatedGoal: Goal) => {
    if (onGoalUpdated) {
      onGoalUpdated(updatedGoal);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setShowStats(true);
    }
  };

  const handleToggleClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    handleToggleComplete();
  };

  return (
    <Card
      onClick={() => setShowStats(true)}
      className={cn(
        "group relative cursor-pointer transition-[colors,shadow] hover:border-primary/50 hover:shadow-md",
        isDeleting && "opacity-50 pointer-events-none"
      )}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <CardHeader className="pb-3 pt-4 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 border text-primary">
              <Target size={14} className="shrink-0" />
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar size={12} />
              <span className="truncate">{goal.frequency}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {goal.streak && goal.streak > 0 && (
              <Badge variant="secondary" className="h-6 px-1.5 gap-1 bg-primary text-primary-foreground hover:bg-primary">
                <Flame size={12} />
                {goal.streak}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'h-11 w-11 min-h-[44px] min-w-[44px] text-muted-foreground transition-opacity hover:text-destructive',
                DELETE_ACTION_VISIBILITY === 'always' && 'opacity-100',
                DELETE_ACTION_VISIBILITY === 'hover' && 'opacity-0 group-hover:opacity-100',
                DELETE_ACTION_VISIBILITY === 'adaptiveTouch' && 'opacity-100 md:opacity-0 md:group-hover:opacity-100'
              )}
              onClick={handleDeleteClick}
              aria-label="Delete goal"
            >
              <Trash2 size={14} />
            </Button>
          </div>
        </div>
        <CardTitle className="text-lg leading-tight mt-2">{goal.title}</CardTitle>
        {goal.description && (
          <CardDescription className="line-clamp-2 text-sm">
            {goal.description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="px-4 pb-3">
        {goal.completed !== undefined && goal.total !== undefined && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium">
              <span>Progress</span>
              <span className="tabular-nums">{goal.completed}/{goal.total}</span>
            </div>
            <Progress
              value={progressPercentage}
              className="h-2"
              indicatorClassName={cn(isCompleted ? "bg-[color:var(--success)]" : "bg-primary")}
            />
          </div>
        )}
      </CardContent>

      <CardFooter className="px-4 pb-4 pt-0">
        <Button
          onClick={handleToggleClick}
          disabled={isToggling}
          size="sm"
          className={cn(
            "w-full gap-2 transition-colors",
            isDoneToday ? "bg-[color:var(--success)] hover:brightness-95" : "bg-primary"
          )}
          title={isDoneToday ? 'Click to unmark' : 'Click to mark as done'}
        >
          {isToggling ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isDoneToday ? (
            <XCircle size={14} />
          ) : (
            <CheckCircle size={14} />
          )}
          {isToggling ? 'Updating...' : (isDoneToday ? 'Completed (click to undo)' : 'Mark as done')}
        </Button>
      </CardFooter>

      <Modal open={showStats} title="Goal Statistics" onClose={() => setShowStats(false)}>
        <Suspense fallback={<Skeleton className="h-64 w-full" />}>
          <GoalStatsCalendar goalId={goal.id} onGoalUpdated={handleGoalUpdatedFromCalendar} />
        </Suspense>
      </Modal>

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete Goal"
        description="Are you sure you want to delete this goal? This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleConfirmDelete}
      />
    </Card>
  );
};



export default GoalCard;
