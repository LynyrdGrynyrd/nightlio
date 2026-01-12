import GoalCard from './GoalCard';
import AddGoalCard from './AddGoalCard';
import EmptyState from '../ui/EmptyState';

const GoalsList = ({ goals, onDelete, onUpdateProgress, onToggleCompletion, onGoalUpdated, onAdd }) => {
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
