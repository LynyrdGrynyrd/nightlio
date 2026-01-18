import { useState, useEffect, CSSProperties, MouseEvent } from 'react';
import { Target, Plus, ArrowRight, Calendar, CheckCircle, XCircle } from 'lucide-react';
import Skeleton from '../ui/Skeleton';
import apiService from '../../services/api';
import AddGoalCard from './AddGoalCard';
import { useToast } from '../ui/ToastProvider';

interface Goal {
  id: number;
  title: string;
  description: string;
  frequency: string;
  completed: number;
  total: number;
  streak: number;
  last_completed_date: string | null;
  _doneToday: boolean;
}

interface GoalsSectionProps {
  onNavigateToGoals: () => void;
}

interface GoalPreviewCardProps {
  goal: Goal;
  onToggleComplete: (goalId: number) => Promise<void>;
}

const GoalsSection = ({ onNavigateToGoals }: GoalsSectionProps) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const { show } = useToast();

  // Dummy data for home page preview (first 3 goals)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await apiService.getGoals();
        if (!mounted) return;
        const d = new Date();
        const today = `\${d.getFullYear()}-\${String(d.getMonth() + 1).padStart(2, '0')}-\${String(d.getDate()).padStart(2, '0')}`;
        const mapped = (data || []).slice(0, 3).map((g: any) => ({
          id: g.id,
          title: g.title,
          description: g.description,
          frequency: `\${g.frequency_per_week} days a week`,
          completed: g.completed ?? 0,
          total: g.frequency_per_week ?? 0,
          streak: g.streak ?? 0,
          last_completed_date: g.last_completed_date || null,
          _doneToday: (() => {
            try {
              const localVal = typeof localStorage !== 'undefined' ? localStorage.getItem(`goal_done_\${g.id}`) : null;
              return (localVal === today) || g.already_completed_today === true || (g.last_completed_date === today);
            } catch {
              return g.already_completed_today === true || (g.last_completed_date === today);
            }
          })(),
        }));
        setGoals(mapped);
      } catch {
        // leave empty on failure; section can show skeleton or CTA
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (loading) {
    const loadingContainerStyle: CSSProperties = {
      textAlign: 'left',
      padding: '1rem 0'
    };

    const loadingHeaderStyle: CSSProperties = {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12
    };

    return (
      <div style={loadingContainerStyle}>
        <div style={loadingHeaderStyle}>
          <Skeleton height={28} width={120} />
          <Skeleton height={32} width={100} />
        </div>
        <div className="card-grid">
          {[1, 2, 3].map((i) => (
            <div key={i}>
              <Skeleton height={160} radius={16} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Toggle completion - supports both marking and unmarking
  const handleToggleComplete = async (goalId: number) => {
    const d = new Date();
    const today = `\${d.getFullYear()}-\${String(d.getMonth() + 1).padStart(2, '0')}-\${String(d.getDate()).padStart(2, '0')}`;
    const target = goals.find(g => g.id === goalId);
    if (!target) return;

    const wasDoneToday = target._doneToday || target.last_completed_date === today;

    // Optimistic update
    try {
      if (typeof localStorage !== 'undefined') {
        if (wasDoneToday) {
          localStorage.removeItem(`goal_done_\${goalId}`);
        } else {
          localStorage.setItem(`goal_done_\${goalId}`, today);
        }
      }
    } catch {
      // localStorage access failed
    }

    setGoals(prev => prev.map(g => g.id === goalId ? {
      ...g,
      _doneToday: !wasDoneToday,
      last_completed_date: wasDoneToday ? null : today,
      completed: wasDoneToday ? Math.max(0, g.completed - 1) : Math.min(g.total, g.completed + 1)
    } : g));

    try {
      const result = await apiService.toggleGoalCompletion(goalId, today);
      if (result) {
        setGoals(prev => prev.map(g => g.id === result.id ? {
          ...g,
          completed: result.completed ?? g.completed,
          total: result.frequency_per_week ?? g.total,
          streak: result.streak ?? g.streak,
          last_completed_date: result.last_completed_date || null,
          _doneToday: result.already_completed_today || result.last_completed_date === today,
          frequency: `\${result.frequency_per_week ?? g.total} days a week`
        } : g));
        show(result.is_completed ? 'Marked complete' : 'Unmarked', 'success');
      }
    } catch {
      // Revert on error
      try {
        if (typeof localStorage !== 'undefined') {
          if (wasDoneToday) {
            localStorage.setItem(`goal_done_\${goalId}`, today);
          } else {
            localStorage.removeItem(`goal_done_\${goalId}`);
          }
        }
      } catch {
        // localStorage access failed
      }
      setGoals(prev => prev.map(g => g.id === goalId ? {
        ...g,
        _doneToday: wasDoneToday,
        last_completed_date: wasDoneToday ? today : target.last_completed_date,
        completed: target.completed
      } : g));
      show('Failed to update', 'error');
    }
  };

  const containerStyle: CSSProperties = {
    textAlign: 'left',
    marginTop: 0
  };

  const headerContainerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  };

  const headerTitleStyle: CSSProperties = {
    margin: 0,
    paddingLeft: 'calc(var(--space-1) / 2)',
    paddingTop: 0,
    paddingBottom: 'calc(var(--space-1) / 2)',
    color: 'var(--text)',
    fontWeight: '600'
  };

  const viewAllButtonStyle: CSSProperties = {
    background: 'none',
    border: 'none',
    color: 'var(--accent-600)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '0.9rem',
    fontWeight: '500',
    padding: '6px 8px',
    borderRadius: '6px',
    transition: 'background-color 0.2s'
  };

  const handleViewAllMouseEnter = (e: MouseEvent<HTMLButtonElement>) => {
    (e.target as HTMLButtonElement).style.background = 'var(--accent-bg-softer)';
  };

  const handleViewAllMouseLeave = (e: MouseEvent<HTMLButtonElement>) => {
    (e.target as HTMLButtonElement).style.background = 'none';
  };

  const emptyStateStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: '1rem',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow-sm)'
  };

  const emptyContentStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    color: 'var(--text)'
  };

  const emptyIconStyle: CSSProperties = {
    color: 'var(--accent-600)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
    borderRadius: '50%',
    background: 'var(--accent-bg-softer)',
    border: '1px solid var(--border)'
  };

  const emptyTextStyle: CSSProperties = {
    margin: 0,
    fontSize: '1rem',
    opacity: 0.9
  };

  const addButtonStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px'
  };

  return (
    <div style={containerStyle}>
      <div style={headerContainerStyle}>
        <h2 style={headerTitleStyle}>
          Goals
        </h2>
        <button
          onClick={onNavigateToGoals}
          style={viewAllButtonStyle}
          onMouseEnter={handleViewAllMouseEnter}
          onMouseLeave={handleViewAllMouseLeave}
        >
          View All
          <ArrowRight size={14} />
        </button>
      </div>

      {goals.length === 0 ? (
        <div style={emptyStateStyle}>
          <div style={emptyContentStyle}>
            <span style={emptyIconStyle}>
              <Target size={16} strokeWidth={2} />
            </span>
            <p style={emptyTextStyle}>No goals yet.</p>
          </div>
          <button
            onClick={onNavigateToGoals}
            className="primary"
            style={addButtonStyle}
          >
            <Plus size={16} />
            Add First Goal
          </button>
        </div>
      ) : (
        <div className="card-grid">
          <AddGoalCard onAdd={onNavigateToGoals} />
          {goals.map(goal => (
            <GoalPreviewCard
              key={goal.id}
              goal={goal}
              onToggleComplete={handleToggleComplete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const GoalPreviewCard = ({ goal, onToggleComplete }: GoalPreviewCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const progressPercentage = (goal.completed / goal.total) * 100;
  const isCompletedWeek = goal.completed >= goal.total;
  const isDoneToday = (() => {
    const d = new Date();
    const today = `\${d.getFullYear()}-\${String(d.getMonth() + 1).padStart(2, '0')}-\${String(d.getDate()).padStart(2, '0')}`;
    try {
      const localVal = typeof localStorage !== 'undefined' ? localStorage.getItem(`goal_done_\${goal.id}`) : null;
      return (localVal === today) || goal.last_completed_date === today || goal._doneToday === true;
    } catch {
      return goal.last_completed_date === today || goal._doneToday === true;
    }
  })();

  const cardStyle: CSSProperties = {
    border: isHovered ? '1px solid color-mix(in oklab, var(--accent-600), transparent 55%)' : '1px solid var(--border)',
    boxShadow: isHovered ? 'var(--shadow-md)' : 'var(--shadow-sm)',
    position: 'relative'
  };

  const headerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '12px',
    position: 'relative'
  };

  const headerContentStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flex: 1,
    marginRight: goal.streak > 0 ? '50px' : '0'
  };

  const iconStyle: CSSProperties = {
    color: 'var(--accent-600)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
    borderRadius: '50%',
    background: 'var(--accent-bg-softer)',
    border: '1px solid var(--border)'
  };

  const frequencyStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    fontSize: '0.85rem',
    color: 'var(--text)',
    opacity: 0.8
  };

  const streakStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    background: 'var(--accent-600)',
    color: 'white',
    fontSize: '0.7rem',
    padding: '2px 6px',
    borderRadius: '10px',
    fontWeight: '500',
    lineHeight: '1'
  };

  const titleStyle: CSSProperties = {
    marginBottom: goal.description ? '8px' : '16px'
  };

  const descriptionStyle: CSSProperties = {
    marginBottom: '16px'
  };

  const progressContainerStyle: CSSProperties = {
    marginBottom: '12px'
  };

  const progressHeaderStyle: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px',
    fontSize: '0.85rem',
    color: 'var(--text)',
    opacity: 0.9
  };

  const progressBarContainerStyle: CSSProperties = {
    width: '100%',
    height: '6px',
    background: 'var(--accent-bg-softer)',
    borderRadius: '3px',
    overflow: 'hidden'
  };

  const progressBarStyle: CSSProperties = {
    width: `\${progressPercentage}%`,
    height: '100%',
    background: isCompletedWeek ? 'var(--success)' : 'var(--accent-600)',
    transition: 'width 0.3s ease'
  };

  const buttonStyle: CSSProperties = {
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
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="entry-card"
      style={cardStyle}
    >
      {/* Header */}
      <div style={headerStyle}>
        <div style={headerContentStyle}>
          <span style={iconStyle}>
            <Target size={16} strokeWidth={2} />
          </span>
          <div style={frequencyStyle}>
            <Calendar size={14} style={{ marginRight: '4px' }} />
            <span>{goal.frequency}</span>
          </div>
        </div>

        {goal.streak > 0 && (
          <div style={streakStyle}>
            🔥 {goal.streak}
          </div>
        )}
      </div>

      {/* Title */}
      <div className="entry-card__title" style={titleStyle}>
        {goal.title}
      </div>

      {/* Description (excerpt) */}
      {goal.description && (
        <div className="entry-card__excerpt" style={descriptionStyle}>
          {goal.description}
        </div>
      )}

      {/* Progress Bar */}
      <div style={progressContainerStyle}>
        <div style={progressHeaderStyle}>
          <span>Progress</span>
          <span>{goal.completed}/{goal.total}</span>
        </div>
        <div style={progressBarContainerStyle}>
          <div style={progressBarStyle} />
        </div>
      </div>

      {/* Quick Action Button - now supports toggle */}
      <button
        onClick={async () => {
          setIsToggling(true);
          try {
            await onToggleComplete(goal.id);
          } finally {
            setIsToggling(false);
          }
        }}
        disabled={isToggling}
        style={buttonStyle}
        title={isDoneToday ? 'Click to unmark' : 'Click to mark as done'}
      >
        {isDoneToday ? <XCircle size={14} /> : <CheckCircle size={14} />}
        {isToggling ? 'Updating...' : (isDoneToday ? 'Undo' : 'Mark as done')}
      </button>
    </div>
  );
};

export default GoalsSection;
