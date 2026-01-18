import { useState, useEffect, useRef, CSSProperties } from 'react';
import { Target, Plus } from 'lucide-react';
import GoalsList from '../components/goals/GoalsList';
import GoalForm from '../components/goals/GoalForm';
import Skeleton from '../components/ui/Skeleton';
import apiService, { Goal } from '../services/api';

// ========== Types ==========

interface GoalWithExtras extends Goal {
  frequency: string;
  completed: number;
  total: number;
  streak: number;
  last_completed_date?: string | null;
  _doneToday?: boolean;
}

interface NewGoal {
  title: string;
  description: string;
  frequency?: string;
  frequencyNumber?: string;
}

interface Suggestion {
  t: string;
  d: string;
}

interface GoalFormHandle {
  prefill: (title: string, description: string) => void;
}

// ========== Component ==========

const GoalsView = () => {
  const [goals, setGoals] = useState<GoalWithExtras[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const formRef = useRef<GoalFormHandle>(null);

  const suggestions: Suggestion[] = [
    { t: 'Morning Meditation', d: '10 minutes of mindfulness' },
    { t: 'Evening Walk', d: '30-minute walk outside' },
    { t: 'Read Before Bed', d: 'Read 20 minutes before sleep' },
    { t: 'Drink Water', d: '8 glasses of water daily' },
    { t: 'Stretching Routine', d: '15 minutes of light stretching' },
    { t: 'Learn a Language', d: 'Practice 20 minutes on Duolingo' },
    { t: 'Journal', d: 'Write 5-minute reflection' },
  ];

  const handlePrefill = (title: string, description: string) => {
    if (formRef.current && typeof formRef.current.prefill === 'function') {
      formRef.current.prefill(title, description);
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await apiService.getGoals();
        if (!mounted) return;
        const d = new Date();
        const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const mapped: GoalWithExtras[] = (data || []).map(g => ({
          ...g,
          frequency: `${g.frequency_per_week} days a week`,
          completed: g.completed ?? 0,
          total: g.frequency_per_week ?? 0,
          streak: g.streak ?? 0,
          last_completed_date: g.last_completed_date || null,
          _doneToday: (() => {
            try {
              const localKey = `goal_done_${g.id}`;
              const localVal = typeof localStorage !== 'undefined' ? localStorage.getItem(localKey) : null;
              return (localVal === today) || g.already_completed_today === true || (g.last_completed_date === today);
            } catch {
              return g.already_completed_today === true || (g.last_completed_date === today);
            }
          })(),
        }));
        setGoals(mapped);
      } catch {
        // fallback: keep goals empty; UI can still add
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleAddGoal = (newGoal: NewGoal) => {
    (async () => {
      try {
        const freqNum = newGoal.frequencyNumber ? parseInt(newGoal.frequencyNumber) : parseInt((newGoal.frequency || '0').split(' ')[0]);
        const resp = await apiService.createGoal({
          title: newGoal.title,
          description: newGoal.description,
          frequency: Number.isFinite(freqNum) && freqNum > 0 ? freqNum : 3,
        });
        const id = resp?.id ?? Date.now();
        const goal: GoalWithExtras = {
          id,
          user_id: resp?.user_id ?? 0,
          title: newGoal.title,
          description: newGoal.description,
          frequency_per_week: Number.isFinite(freqNum) && freqNum > 0 ? freqNum : 3,
          frequency: `${Number.isFinite(freqNum) && freqNum > 0 ? freqNum : 3} days a week`,
          completed: 0,
          total: Number.isFinite(freqNum) && freqNum > 0 ? freqNum : 3,
          streak: 0,
          created_at: new Date().toISOString(),
          is_archived: false,
        };
        setGoals(prev => [goal, ...prev]);
      } catch {
        // optimistic add on failure
        const freqNum = newGoal.frequencyNumber ? parseInt(newGoal.frequencyNumber) : parseInt((newGoal.frequency || '0').split(' ')[0]);
        const goal: GoalWithExtras = {
          id: Date.now(),
          user_id: 0,
          title: newGoal.title,
          description: newGoal.description,
          frequency_per_week: Number.isFinite(freqNum) && freqNum > 0 ? freqNum : 3,
          frequency: `${Number.isFinite(freqNum) && freqNum > 0 ? freqNum : 3} days a week`,
          completed: 0,
          total: Number.isFinite(freqNum) && freqNum > 0 ? freqNum : 3,
          streak: 0,
          created_at: new Date().toISOString(),
          is_archived: false,
        };
        setGoals(prev => [goal, ...prev]);
      } finally {
        setShowForm(false);
      }
    })();
  };

  const handleDeleteGoal = (goalId: number) => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(`goal_done_${goalId}`);
      }
    } catch {
      // localStorage access failed
    }
    setGoals(prev => prev.filter(goal => goal.id !== goalId));
    apiService.deleteGoal(goalId).catch(() => { });
  };

  const handleUpdateProgress = (goalId: number) => {
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const target = goals.find(g => g.id === goalId);
    if (!target) return;
    if (target.last_completed_date === today || target._doneToday) return;

    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(`goal_done_${goalId}`, today);
      }
    } catch {
      // localStorage access failed
    }
    setGoals(prev => prev.map(g => g.id === goalId ? { ...g, last_completed_date: today, _doneToday: true } : g));
    apiService.incrementGoalProgress(goalId).then(updated => {
      if (!updated) return;
      setGoals(prev => prev.map(g => g.id === goalId ? {
        ...g,
        completed: updated.completed ?? g.completed,
        total: updated.frequency_per_week ?? g.total,
        frequency_per_week: updated.frequency_per_week ?? g.frequency_per_week,
        streak: updated.streak ?? g.streak,
        last_completed_date: updated.last_completed_date || today,
        _doneToday: (() => {
          const serverDone = updated.already_completed_today === true || (updated.last_completed_date === today);
          if (serverDone) return true;
          try {
            const localVal = typeof localStorage !== 'undefined' ? localStorage.getItem(`goal_done_${goalId}`) : null;
            return localVal === today;
          } catch {
            return false;
          }
        })(),
        frequency: `${updated.frequency_per_week ?? g.total} days a week`
      } : g));
    }).catch(() => {
      try {
        if (typeof localStorage !== 'undefined') {
          const existing = localStorage.getItem(`goal_done_${goalId}`);
          if (existing === today) localStorage.removeItem(`goal_done_${goalId}`);
        }
      } catch {
        // localStorage access failed
      }
      setGoals(prev => prev.map(g => g.id === goalId ? { ...g, last_completed_date: target.last_completed_date || null, _doneToday: target.last_completed_date === today } : g));
    });
  };

  const handleToggleCompletion = async (goalId: number, dateStr: string) => {
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const target = goals.find(g => g.id === goalId);
    if (!target) return;

    const wasDoneToday = dateStr === today && (target._doneToday || target.last_completed_date === today);

    if (dateStr === today) {
      try {
        if (typeof localStorage !== 'undefined') {
          if (wasDoneToday) {
            localStorage.removeItem(`goal_done_${goalId}`);
          } else {
            localStorage.setItem(`goal_done_${goalId}`, today);
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
    }

    try {
      const result = await apiService.toggleGoalCompletion(goalId, dateStr);
      if (result) {
        handleGoalUpdated(result);
      }
    } catch (err) {
      if (dateStr === today) {
        try {
          if (typeof localStorage !== 'undefined') {
            if (wasDoneToday) {
              localStorage.setItem(`goal_done_${goalId}`, today);
            } else {
              localStorage.removeItem(`goal_done_${goalId}`);
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
      }
      throw err;
    }
  };

  const handleGoalUpdated = (updatedGoal: Goal) => {
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    setGoals(prev => prev.map(g => g.id === updatedGoal.id ? {
      ...g,
      ...updatedGoal,
      completed: updatedGoal.completed ?? g.completed,
      total: updatedGoal.frequency_per_week ?? g.total,
      frequency_per_week: updatedGoal.frequency_per_week ?? g.frequency_per_week,
      streak: updatedGoal.streak ?? g.streak,
      last_completed_date: updatedGoal.last_completed_date || null,
      _doneToday: updatedGoal.already_completed_today || updatedGoal.last_completed_date === today,
      frequency: `${updatedGoal.frequency_per_week ?? g.total} days a week`
    } : g));
  };

  const iconStyle: CSSProperties = {
    width: 40,
    height: 40,
    borderRadius: 12,
    background: 'var(--accent-bg)',
    display: 'grid',
    placeItems: 'center',
    color: '#fff'
  };

  const titleStyle: CSSProperties = {
    margin: 0,
    color: 'var(--text)',
    fontSize: '1.75rem',
    fontWeight: '700'
  };

  const subtitleStyle: CSSProperties = {
    margin: 0,
    color: 'var(--text)',
    opacity: 0.8,
    fontSize: '0.95rem'
  };

  if (showForm) {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <div style={iconStyle}>
            <Target size={20} />
          </div>
          <div>
            <h1 style={titleStyle}>Add New Goal</h1>
            <p style={subtitleStyle}>
              Set a new goal to track your progress
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 480px', minWidth: 280 }}>
            <GoalForm
              ref={formRef}
              showInlineSuggestions={false}
              onSubmit={handleAddGoal}
              onCancel={() => setShowForm(false)}
            />
          </div>
          <aside style={{ flex: '0 0 320px', minWidth: 260 }}>
            <div style={{
              position: 'sticky', top: 12,
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              borderRadius: 16,
              padding: 16
            }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 8 }}>Quick suggestions</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {suggestions.map(s => (
                  <button
                    key={s.t}
                    type="button"
                    onClick={() => handlePrefill(s.t, s.d)}
                    style={{
                      textAlign: 'left',
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: '1px solid var(--border)',
                      background: 'var(--surface-2, var(--surface))',
                      color: 'var(--text)',
                      cursor: 'pointer',
                      transition: 'background 0.2s, border-color 0.2s'
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 4 }}>{s.t}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{s.d}</div>
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={iconStyle}>
            <Target size={20} />
          </div>
          <div>
            <h1 style={titleStyle}>Goals</h1>
            <p style={subtitleStyle}>
              Track your personal goals and build better habits
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div>
          <div className="card-grid">
            {[1, 2, 3, 4].map((i) => (
              <div key={i}>
                <Skeleton height={180} radius={16} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <GoalsList
          goals={goals}
          onDelete={handleDeleteGoal}
          onUpdateProgress={handleUpdateProgress}
          onToggleCompletion={handleToggleCompletion}
          onGoalUpdated={handleGoalUpdated}
          onAdd={() => setShowForm(true)}
        />
      )}
    </div>
  );
};

export default GoalsView;
