import GoalCard from './GoalCard';
import AddGoalCard from './AddGoalCard';
import EmptyState from '../ui/EmptyState';
import { Goal } from '../../services/api';

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
      <div className="card-grid">
        {onAdd && <AddGoalCard onAdd={onAdd} />}
        <div className="col-span-full">
          <EmptyState variant="noGoals" />
        </div>
      </div>
    );
  }

  return (
    <div className="card-grid">
      {onAdd && (
        <AddGoalCard onAdd={onAdd} />
      )}
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
    </div>
  );
};

export default GoalsList;
