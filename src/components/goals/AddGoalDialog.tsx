import { useRef, useState } from 'react';
import GoalForm from './GoalForm';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '../ui/sheet';
import { ScrollArea } from '../ui/scroll-area';
import apiService, { Goal } from '../../services/api';
import { useToast } from '../ui/ToastProvider';
import { mapGoalToExtras } from '../../utils/goalUtils';
import { getTodayISO } from '../../utils/dateUtils';
import type { GoalFormHandle, GoalFormData, GoalWithExtras } from '../../types/goals';

interface AddGoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGoalCreated: (goal: GoalWithExtras) => void;
}

const AddGoalDialog = ({ open, onOpenChange, onGoalCreated }: AddGoalDialogProps) => {
  const formRef = useRef<GoalFormHandle>(null);
  const { show } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (data: GoalFormData) => {
    setSubmitting(true);
    const frequencyType = data.frequencyType ?? 'weekly';
    const customDays =
      frequencyType === 'custom'
        ? (data.customDays || []).filter((day) => Number.isInteger(day) && day >= 0 && day <= 6)
        : [];
    const fallbackFrequency = data.frequency || '3';
    const parsedLegacyFrequency = parseInt(fallbackFrequency.split(' ')[0], 10);
    const numericFrequency = Number.isFinite(parsedLegacyFrequency) && parsedLegacyFrequency > 0
      ? parsedLegacyFrequency
      : 3;
    const weeklyTarget = Math.max(1, Number(data.frequencyNumber || numericFrequency));
    const periodTarget = Math.max(1, Number(data.targetCount || weeklyTarget));
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
      title: data.title,
      description: data.description,
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
        title: data.title,
        description: data.description,
        frequencyNumber: safeFrequencyPerWeek,
        frequency_type: frequencyType,
        target_count: resolvedTargetCount,
        custom_days: frequencyType === 'custom' ? customDays : undefined,
      });
      const today = getTodayISO();
      const goal = mapGoalToExtras({
        ...baseGoal,
        id: resp?.id ?? baseGoal.id,
        user_id: resp?.user_id ?? 0,
      }, today);
      onGoalCreated(goal);
      show('Goal created!', 'success');
      onOpenChange(false);
    } catch {
      const today = getTodayISO();
      const goal = mapGoalToExtras(baseGoal, today);
      onGoalCreated(goal);
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle>Add New Goal</SheetTitle>
          <SheetDescription>Set a new goal to track your progress</SheetDescription>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-8rem)] px-6 py-4">
          <GoalForm
            ref={formRef}
            showInlineSuggestions
            onSubmit={handleSubmit}
            onCancel={() => onOpenChange(false)}
          />
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default AddGoalDialog;
