import GoalCard from './GoalCard';
import AddGoalCard from './AddGoalCard';
import EmptyState from '../ui/EmptyState';
import { Goal } from '../../services/api';
import ResponsiveGrid from '../layout/ResponsiveGrid';

// ========== Types ==========

interface GoalsListProps {
  goals: Goal[];
  onDelete: (goalId: number) => void;
  onUpdateProgress: (goalId: number) => void;
  onToggleCompletion: (goalId: number, date: string) => Promise<void>;
  onGoalUpdated: (goal: Goal) => void;
  onAdd?: () => void;
}

// ========== Component ==========

const GoalsList = ({ goals, onDelete, onUpdateProgress, onToggleCompletion, onGoalUpdated, onAdd }: GoalsListProps) => {
  if (goals.length === 0) {
    return (
      <ResponsiveGrid minCardWidth="17rem" maxColumns={5} gapToken="normal">
        {onAdd ? <AddGoalCard onAdd={onAdd} /> : null}
        <div className="col-span-full">
          <EmptyState variant="noGoals" />
        </div>
      </ResponsiveGrid>
    );
  }

  return (
    <ResponsiveGrid minCardWidth="17rem" maxColumns={5} gapToken="normal">
      {onAdd ? <AddGoalCard onAdd={onAdd} /> : null}
      {goals.map(goal => (
        <GoalCard
          key={goal.id}
          goal={goal}
          onDelete={onDelete}
          onUpdateProgress={onUpdateProgress}
          onToggleCompletion={onToggleCompletion}
          onGoalUpdated={onGoalUpdated}
        />
      ))}
    </ResponsiveGrid>
  );
};

export default GoalsList;
