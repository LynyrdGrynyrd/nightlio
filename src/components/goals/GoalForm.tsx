import { forwardRef, useImperativeHandle, useMemo, useState, ChangeEvent, FormEvent, ForwardedRef } from 'react';
import { ArrowLeft, Calendar, Info, Loader2 } from 'lucide-react';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';

import { cn } from '@/lib/utils';
import { GoalFormData } from '../../types/goals';

// ========== Types ==========

interface FormData {
  title: string;
  description: string;
  frequencyNumber: number;
  frequencyType: 'daily' | 'weekly' | 'monthly' | 'custom';
  targetCount: number;
  customDays: number[];
}

interface FormErrors {
  title?: string;
  description?: string;
}



interface GoalFormProps {
  onSubmit: (data: GoalFormData) => Promise<void>;
  onCancel: () => void;
  showInlineSuggestions?: boolean;
}

export interface GoalFormHandle {
  prefill: (title: string, description: string) => void;
}

interface Suggestion {
  t: string;
  d: string;
}

// Static arrays moved outside component to avoid recreation
const GOAL_SUGGESTIONS: Suggestion[] = [
  { t: 'Morning Meditation', d: '10 minutes of mindfulness' },
  { t: 'Evening Walk', d: '30-minute walk outside' },
  { t: 'Read Before Bed', d: 'Read 20 minutes' }
];

const WEEKDAY_OPTIONS = [
  { value: 0, label: 'Mon' },
  { value: 1, label: 'Tue' },
  { value: 2, label: 'Wed' },
  { value: 3, label: 'Thu' },
  { value: 4, label: 'Fri' },
  { value: 5, label: 'Sat' },
  { value: 6, label: 'Sun' },
];



// ========== Component ==========

const GoalForm = forwardRef<GoalFormHandle, GoalFormProps>(({ onSubmit, onCancel, showInlineSuggestions = true }, ref: ForwardedRef<GoalFormHandle>) => {
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    frequencyNumber: 3,
    frequencyType: 'weekly',
    targetCount: 1,
    customDays: [0, 2, 4],
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const titleMax = 80;
  const descMax = 280;
  const titleLen = formData.title.length;
  const descLen = formData.description.length;

  const freqLabel = useMemo(() => {
    if (formData.frequencyType === 'daily') {
      return formData.targetCount === 1 ? 'Once daily' : `${formData.targetCount}x daily`;
    }
    if (formData.frequencyType === 'monthly') {
      return formData.targetCount === 1 ? 'Once a month' : `${formData.targetCount}x monthly`;
    }
    if (formData.frequencyType === 'custom') {
      return `${formData.customDays.length} custom day${formData.customDays.length === 1 ? '' : 's'} weekly`;
    }
    return `${formData.frequencyNumber} ${formData.frequencyNumber === 1 ? 'day' : 'days'} a week`;
  }, [formData.frequencyNumber, formData.frequencyType, formData.targetCount, formData.customDays.length]);

  const toggleCustomDay = (dayValue: number) => {
    setFormData((prev) => {
      const hasDay = prev.customDays.includes(dayValue);
      const nextDays = hasDay
        ? prev.customDays.filter((d) => d !== dayValue)
        : [...prev.customDays, dayValue];
      return {
        ...prev,
        customDays: nextDays.length > 0 ? nextDays.sort((a, b) => a - b) : prev.customDays,
      };
    });
  };

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm() || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit({
        title: formData.title.trim(),
        description: formData.description.trim(),
        frequency: freqLabel,
        frequencyType: formData.frequencyType,
        frequencyNumber:
          formData.frequencyType === 'weekly'
            ? formData.frequencyNumber
            : formData.frequencyType === 'custom'
              ? formData.customDays.length
              : formData.targetCount,
        targetCount:
          formData.frequencyType === 'weekly'
            ? formData.frequencyNumber
            : formData.frequencyType === 'custom'
              ? formData.customDays.length
              : formData.targetCount,
        customDays: formData.frequencyType === 'custom' ? formData.customDays : undefined,
      });
    } finally {
      setSubmitting(false);
    }
  };

  useImperativeHandle(ref, () => ({
    prefill: (title: string, description: string) => {
      setFormData(prev => ({ ...prev, title, description }));
    },
  }));

  return (
    <div className="max-w-[600px] mx-auto">
      <Button
        variant="ghost"
        onClick={onCancel}
        className="mb-6 gap-2"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        Back to Goals
      </Button>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="goal-title">Goal Title *</Label>
            <Input
              id="goal-title"
              name="goal-title"
              autoComplete="off"
              value={formData.title}
              onChange={(e: ChangeEvent<HTMLInputElement>) => handleInputChange('title', e.target.value)}
              placeholder="e.g., Morning Meditation, Evening Walk"
              className={cn(errors.title && "border-destructive")}
              maxLength={titleMax}
              autoFocus={typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              {errors.title ? (
                <span className="text-destructive font-medium">{errors.title}</span>
              ) : (
                <span>Make it clear and specific</span>
              )}
              <span>{titleLen}/{titleMax}</span>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="goal-desc">Description *</Label>
            <Textarea
              id="goal-desc"
              name="goal-description"
              autoComplete="off"
              value={formData.description}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => handleInputChange('description', e.target.value)}
              placeholder="Describe your goal and why it's important to you..."
              className={cn("min-h-[100px]", errors.description && "border-destructive")}
              maxLength={descMax}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              {errors.description ? (
                <span className="text-destructive font-medium">{errors.description}</span>
              ) : (
                <span>Add a short motivation to keep you accountable</span>
              )}
              <span>{descLen}/{descMax}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid gap-2">
            <Label>Frequency Type</Label>
            <Tabs
              value={formData.frequencyType}
              onValueChange={(val) => handleInputChange('frequencyType', val as FormData['frequencyType'])}
              className="w-full"
            >
              <TabsList className="grid grid-cols-4 w-full h-12">
                <TabsTrigger value="daily" className="h-10">📅 Daily</TabsTrigger>
                <TabsTrigger value="weekly" className="h-10">📆 Weekly</TabsTrigger>
                <TabsTrigger value="monthly" className="h-10">🗓️ Monthly</TabsTrigger>
                <TabsTrigger value="custom" className="h-10">🎯 Custom</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label>
                {formData.frequencyType === 'weekly'
                  ? 'Days per week'
                  : formData.frequencyType === 'custom'
                    ? 'Choose custom weekdays'
                    : 'Times per period'}
              </Label>
              <Badge variant="outline" className="gap-1.5 font-normal">
                <Calendar size={12} className="text-primary" aria-hidden="true" />
                {freqLabel}
              </Badge>
            </div>

            {formData.frequencyType === 'weekly' ? (
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 7 }, (_, i) => i + 1).map(n => (
                  <Button
                    key={n}
                    type="button"
                    variant={formData.frequencyNumber === n ? "default" : "outline"}
                    onClick={() => handleInputChange('frequencyNumber', n)}
                    className="h-10 w-full p-0 font-bold"
                  >
                    {n}
                  </Button>
                ))}
              </div>
            ) : formData.frequencyType === 'custom' ? (
              <div className="grid grid-cols-7 gap-2">
                {WEEKDAY_OPTIONS.map((day) => {
                  const selected = formData.customDays.includes(day.value);
                  return (
                    <Button
                      key={day.value}
                      type="button"
                      variant={selected ? 'default' : 'outline'}
                      onClick={() => toggleCustomDay(day.value)}
                      className="h-10 w-full p-0 text-xs font-semibold"
                    >
                      {day.label}
                    </Button>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  inputMode="numeric"
                  name="goal-target"
                  autoComplete="off"
                  min="1"
                  max={formData.frequencyType === 'daily' ? 10 : 30}
                  value={formData.targetCount}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => handleInputChange('targetCount', Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-24 text-center font-bold"
                  aria-label={formData.frequencyType === 'daily' ? 'Times per day' : 'Times per month'}
                />
                <span className="text-sm text-muted-foreground font-medium">
                  {formData.frequencyType === 'daily' ? 'time(s) per day' : 'time(s) per month'}
                </span>
              </div>
            )}

            <div className="flex items-center gap-2 mt-1 py-2 px-3 bg-muted/50 rounded-lg text-xs text-muted-foreground border">
              <Info size={14} className="shrink-0 text-primary" aria-hidden="true" />
              <span>
                {formData.frequencyType === 'daily' && 'Resets every day at midnight.'}
                {formData.frequencyType === 'weekly' && 'This sets your weekly target. Resets every Monday.'}
                {formData.frequencyType === 'monthly' && 'Resets on the 1st of each month.'}
                {formData.frequencyType === 'custom' && 'Tracks only on selected weekdays and resets weekly.'}
              </span>
            </div>
          </div>
        </div>

        {showInlineSuggestions && (
          <div className="space-y-2">
            <Label className="text-muted-foreground font-normal">Quick suggestions</Label>
            <div className="flex flex-wrap gap-2">
              {GOAL_SUGGESTIONS.map((s) => (
                <Button
                  key={s.t}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFormData(prev => ({ ...prev, title: s.t, description: s.d }))}
                  className="rounded-full text-xs"
                >
                  {s.t}
                </Button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1 h-12 text-base"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={submitting}
            className="flex-1 h-12 text-base font-bold shadow-lg"
          >
            {submitting ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> Creating…</>
            ) : (
              'Create Goal'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
});

GoalForm.displayName = 'GoalForm';
export default GoalForm;
