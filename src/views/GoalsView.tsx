import { useState, useEffect, useRef } from 'react';
import { Target } from 'lucide-react';
import GoalsList from '../components/goals/GoalsList';
import GoalForm from '../components/goals/GoalForm';
import Skeleton from '../components/ui/Skeleton';
import apiService, { Goal } from '../services/api';
import ResponsiveGrid from '../components/layout/ResponsiveGrid';
import { getTodayISO } from '../utils/dateUtils';
import { useGoalCompletion } from '../hooks/useGoalCompletion';
import { mapGoalToExtras } from '../utils/goalUtils';
import type { GoalWithExtras } from '../types/goals';
import { GoalFormHandle, GoalFormData, GoalSuggestion } from '../types/goals';

const GoalsView = () => {
  const [goals, setGoals] = useState<GoalWithExtras[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const formRef = useRef<GoalFormHandle>(null);

  const { toggleGoalCompletion, incrementProgress, handleGoalUpdated } = useGoalCompletion();

  const suggestions: GoalSuggestion[] = [
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
        const today = getTodayISO();
        const mapped: GoalWithExtras[] = (data || []).map((g) => mapGoalToExtras(g, today));
        setGoals(mapped);
      } catch {
        // fallback: keep goals empty; UI can still add
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleAddGoal = async (newGoal: GoalFormData): Promise<void> => {
    const frequencyType = newGoal.frequencyType ?? 'weekly';
    const customDays =
      frequencyType === 'custom'
        ? (newGoal.customDays || []).filter((day) => Number.isInteger(day) && day >= 0 && day <= 6)
        : [];
    const fallbackFrequency = newGoal.frequency || '3';
    const parsedLegacyFrequency = parseInt(fallbackFrequency.split(' ')[0], 10);
    const numericFrequency = Number.isFinite(parsedLegacyFrequency) && parsedLegacyFrequency > 0
      ? parsedLegacyFrequency
      : 3;
    const weeklyTarget = Math.max(1, Number(newGoal.frequencyNumber || numericFrequency));
    const periodTarget = Math.max(1, Number(newGoal.targetCount || weeklyTarget));
    const resolvedTargetCount =
      frequencyType === 'weekly'
        ? weeklyTarget
        : frequencyType === 'custom'
          ? Math.max(1, customDays.length)
          : periodTarget;
    const safeFrequencyPerWeek =
      frequencyType === 'weekly'
        ? Math.min(7, weeklyTarget)
        : Math.min(7, resolvedTargetCount);

    const baseGoal: Goal = {
      id: Date.now(),
      user_id: 0,
      title: newGoal.title,
      description: newGoal.description,
      frequency_per_week: safeFrequencyPerWeek,
      frequency_type: frequencyType,
      target_count: resolvedTargetCount,
      custom_days: frequencyType === 'custom' ? customDays : undefined,
      completed: 0,
      streak: 0,
      created_at: new Date().toISOString(),
      is_archived: false,
    };

    try {
      const resp = await apiService.createGoal({
        frequency: safeFrequencyPerWeek.toString(),
        title: newGoal.title,
        description: newGoal.description,
        frequencyNumber: safeFrequencyPerWeek,
        frequency_type: frequencyType,
        target_count: resolvedTargetCount,
        custom_days: frequencyType === 'custom' ? customDays : undefined,
      });
      const goal = mapGoalToExtras({
        ...baseGoal,
        id: resp?.id ?? baseGoal.id,
        user_id: resp?.user_id ?? 0,
      });
      setGoals((prev) => [goal, ...prev]);
    } catch {
      const goal = mapGoalToExtras(baseGoal);
      setGoals((prev) => [goal, ...prev]);
    } finally {
      setShowForm(false);
    }
  };

  const handleDeleteGoal = (goalId: number) => {
    setGoals((prev) => prev.filter((goal) => goal.id !== goalId));
    apiService.deleteGoal(goalId).catch(() => {});
  };

  const handleUpdateProgress = (goalId: number) => {
    incrementProgress(goalId, goals, setGoals);
  };

  const handleToggleCompletion = async (goalId: number, dateStr: string) => {
    await toggleGoalCompletion(goalId, goals, setGoals, dateStr);
  };

  const onGoalUpdated = (updatedGoal: Goal) => {
    handleGoalUpdated(updatedGoal, setGoals);
  };

  if (showForm) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <Target size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Add New Goal</h1>
            <p className="text-muted-foreground mt-1">Set a new goal to track your progress</p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <div className="flex-1 w-full lg:min-w-[480px]">
            <GoalForm
              ref={formRef}
              showInlineSuggestions={false}
              onSubmit={handleAddGoal}
              onCancel={() => setShowForm(false)}
            />
          </div>
          <aside className="lg:w-80 w-full shrink-0">
            <div className="sticky top-4 border rounded-2xl bg-card p-6 shadow-sm">
              <div className="text-sm font-medium text-muted-foreground mb-4">Quick suggestions</div>
              <div className="flex flex-col gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s.t}
                    type="button"
                    onClick={() => handlePrefill(s.t, s.d)}
                    className="text-left p-3 rounded-xl border bg-muted/30 hover:bg-muted hover:border-primary/30 transition-all group"
                  >
                    <div className="font-semibold text-sm group-hover:text-primary transition-colors">
                      {s.t}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{s.d}</div>
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
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <Target size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Goals</h1>
            <p className="text-muted-foreground mt-1">
              Track your personal goals and build better habits
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <ResponsiveGrid minCardWidth="17rem" maxColumns={5} gapToken="normal">
          {[1, 2, 3, 4].map((i) => (
            <div key={i}>
              <Skeleton height={180} radius={16} />
            </div>
          ))}
        </ResponsiveGrid>
      ) : (
        <GoalsList
          goals={goals}
          onDelete={handleDeleteGoal}
          onUpdateProgress={handleUpdateProgress}
          onToggleCompletion={handleToggleCompletion}
          onGoalUpdated={onGoalUpdated}
          onAdd={() => setShowForm(true)}
        />
      )}
    </div>
  );
};

export default GoalsView;
