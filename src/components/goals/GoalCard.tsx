import { useState, KeyboardEvent, MouseEvent } from 'react';
import { Target, Trash2, CheckCircle, Calendar, XCircle } from 'lucide-react';
import { useToast } from '../ui/ToastProvider';
import GoalStatsCalendar from './GoalStatsCalendar';
import Modal from '../ui/Modal';
import { Goal } from '../../services/api';

// ========== Types ==========

interface GoalCardProps {
  goal: Goal & {
    frequency?: string;
    completed?: number;
    total?: number;
    last_completed_date?: string;
    streak?: number;
    _doneToday?: boolean;
  };
  onDelete: (goalId: number) => void;
  onUpdateProgress: (goalId: number) => void;
  onToggleCompletion: (goalId: number, date: string) => Promise<void>;
  onGoalUpdated: (goal: Goal) => void;
}

// ========== Component ==========

const GoalCard = ({ goal, onDelete, onUpdateProgress, onToggleCompletion, onGoalUpdated }: GoalCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const { show } = useToast();

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this goal?')) return;
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
  const isDoneToday = (() => {
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    try {
      const localVal = typeof localStorage !== 'undefined' ? localStorage.getItem(`goal_done_${goal.id}`) : null;
      return (localVal === today) || goal.last_completed_date === today || goal._doneToday === true;
    } catch {
      return goal.last_completed_date === today || goal._doneToday === true;
    }
  })();

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

  const handleDeleteClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    handleDelete();
  };

  const handleToggleClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    handleToggleComplete();
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => setShowStats(true)}
      className="entry-card"
      style={{
        border: isHovered ? '1px solid color-mix(in oklab, var(--accent-600), transparent 55%)' : '1px solid var(--border)',
        boxShadow: isHovered ? 'var(--shadow-md)' : 'var(--shadow-sm)',
        position: 'relative',
        opacity: isDeleting ? 0.5 : 1,
        pointerEvents: isDeleting ? 'none' : 'auto',
        cursor: 'pointer'
      }}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {/* Header: icon + delete button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, marginRight: (goal.streak && goal.streak > 0) ? '60px' : '40px' }}>
          <span style={{
            color: 'var(--accent-600)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: 'var(--accent-bg-softer)',
            border: '1px solid var(--border)'
          }}>
            <Target size={16} strokeWidth={2} />
          </span>
          <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.85rem', color: 'var(--text)', opacity: 0.8 }}>
            <Calendar size={14} style={{ marginRight: '4px' }} />
            <span>{goal.frequency}</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)' }}>
          {goal.streak && goal.streak > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: 'var(--accent-600)',
              color: 'white',
              fontSize: '0.75rem',
              padding: '2px 6px',
              borderRadius: '12px',
              fontWeight: '500',
              lineHeight: '1'
            }}>
              🔥 {goal.streak}
            </div>
          )}
          <button
            onClick={handleDeleteClick}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text)',
              opacity: isHovered ? 0.7 : 0.4,
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              transition: 'opacity 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            aria-label="Delete goal"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Title */}
      <div className="entry-card__title" style={{ marginBottom: '8px' }}>
        {goal.title}
      </div>

      {/* Description */}
      {goal.description && (
        <div className="entry-card__excerpt" style={{ marginBottom: '16px' }}>
          {goal.description}
        </div>
      )}

      {/* Progress Bar */}
      {goal.completed !== undefined && goal.total !== undefined && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '6px',
            fontSize: '0.85rem',
            color: 'var(--text)',
            opacity: 0.9
          }}>
            <span>Progress</span>
            <span>{goal.completed}/{goal.total}</span>
          </div>
          <div style={{
            width: '100%',
            height: '8px',
            background: 'var(--accent-bg-softer)',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${progressPercentage}%`,
              height: '100%',
              background: isCompleted ? 'var(--success)' : 'var(--accent-600)',
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>
      )}

      {/* Action Button - now supports toggle */}
      <button
        onClick={handleToggleClick}
        disabled={isToggling}
        style={{
          width: '100%',
          padding: '8px 12px',
          borderRadius: '8px',
          border: 'none',
          background: isDoneToday ? 'var(--success)' : 'var(--accent-bg)',
          color: '#fff',
          fontSize: '0.85rem',
          fontWeight: '500',
          cursor: isToggling ? 'wait' : 'pointer',
          opacity: isToggling ? 0.7 : 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          transition: 'background-color 0.2s'
        }}
        title={isDoneToday ? 'Click to unmark' : 'Click to mark as done'}
      >
        {isDoneToday ? <XCircle size={14} /> : <CheckCircle size={14} />}
        {isToggling ? 'Updating...' : (isDoneToday ? 'Completed (click to undo)' : 'Mark as done')}
      </button>
      <Modal open={showStats} title="Goal Statistics" onClose={() => setShowStats(false)}>
        <GoalStatsCalendar goalId={goal.id} onGoalUpdated={handleGoalUpdatedFromCalendar} />
      </Modal>
    </div>
  );
};

export default GoalCard;
