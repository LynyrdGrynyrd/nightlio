import { forwardRef, useImperativeHandle, useMemo, useState, ChangeEvent, KeyboardEvent, FormEvent, MouseEvent, ForwardedRef, FocusEvent } from 'react';
import { ArrowLeft, Calendar, Info } from 'lucide-react';

// ========== Types ==========

interface FormData {
  title: string;
  description: string;
  frequencyNumber: number;
  frequencyType: 'daily' | 'weekly' | 'monthly';
  targetCount: number;
}

interface FormErrors {
  title?: string;
  description?: string;
}

interface GoalFormData {
  title: string;
  description: string;
  frequency: string;
  frequencyType: 'daily' | 'weekly' | 'monthly';
  frequencyNumber: number;
  targetCount: number;
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

// ========== Component ==========

const GoalForm = forwardRef<GoalFormHandle, GoalFormProps>(({ onSubmit, onCancel, showInlineSuggestions = true }, ref: ForwardedRef<GoalFormHandle>) => {
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    frequencyNumber: 3,
    frequencyType: 'weekly',
    targetCount: 1,
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
    } else if (formData.frequencyType === 'monthly') {
      return formData.targetCount === 1 ? 'Once a month' : `${formData.targetCount}x monthly`;
    }
    return `${formData.frequencyNumber} ${formData.frequencyNumber === 1 ? 'day' : 'days'} a week`;
  }, [formData.frequencyNumber, formData.frequencyType, formData.targetCount]);

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
        frequencyNumber: formData.frequencyType === 'weekly' ? formData.frequencyNumber : formData.targetCount,
        targetCount: formData.frequencyType === 'weekly' ? formData.frequencyNumber : formData.targetCount,
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

  const handleBackMouseEnter = (e: MouseEvent<HTMLButtonElement>) => {
    (e.target as HTMLButtonElement).style.background = 'var(--accent-bg-softer)';
  };

  const handleBackMouseLeave = (e: MouseEvent<HTMLButtonElement>) => {
    (e.target as HTMLButtonElement).style.background = 'none';
  };

  const handleTitleFocus = (e: FocusEvent<HTMLInputElement>) => {
    if (!errors.title) e.target.style.borderColor = 'var(--accent-600)';
  };

  const handleTitleBlur = (e: FocusEvent<HTMLInputElement>) => {
    if (!errors.title) e.target.style.borderColor = 'var(--border)';
  };

  const handleDescFocus = (e: FocusEvent<HTMLTextAreaElement>) => {
    if (!errors.description) e.target.style.borderColor = 'var(--accent-600)';
  };

  const handleDescBlur = (e: FocusEvent<HTMLTextAreaElement>) => {
    if (!errors.description) e.target.style.borderColor = 'var(--border)';
  };

  const handleCancelMouseEnter = (e: MouseEvent<HTMLButtonElement>) => {
    (e.target as HTMLButtonElement).style.background = 'var(--accent-bg-softer)';
  };

  const handleCancelMouseLeave = (e: MouseEvent<HTMLButtonElement>) => {
    (e.target as HTMLButtonElement).style.background = 'var(--surface)';
  };

  const suggestions: Suggestion[] = [
    { t: 'Morning Meditation', d: '10 minutes of mindfulness' },
    { t: 'Evening Walk', d: '30-minute walk outside' },
    { t: 'Read Before Bed', d: 'Read 20 minutes' }
  ];

  const frequencyTypes: Array<'daily' | 'weekly' | 'monthly'> = ['daily', 'weekly', 'monthly'];
  const labels: Record<'daily' | 'weekly' | 'monthly', string> = {
    daily: '📅 Daily',
    weekly: '📆 Weekly',
    monthly: '🗓️ Monthly'
  };

  return (
    <div style={{ maxWidth: '600px' }}>
      <button
        onClick={onCancel}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '24px',
          padding: '8px 12px',
          borderRadius: '8px',
          fontSize: '0.95rem'
        }}
        onMouseEnter={handleBackMouseEnter}
        onMouseLeave={handleBackMouseLeave}
      >
        <ArrowLeft size={16} />
        Back to Goals
      </button>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '24px' }}>
          <label htmlFor="goal-title" style={{
            display: 'block',
            marginBottom: '8px',
            fontWeight: '500',
            color: 'var(--text)',
            fontSize: '0.95rem'
          }}>
            Goal Title *
          </label>
          <input
            type="text"
            id="goal-title"
            value={formData.title}
            onChange={(e: ChangeEvent<HTMLInputElement>) => handleInputChange('title', e.target.value)}
            placeholder="e.g., Morning Meditation, Evening Walk, Read Before Bed"
            style={{
              width: '100%',
              padding: '12px 16px',
              border: `1px solid ${errors.title ? 'var(--error)' : 'var(--border)'}`,
              borderRadius: '8px',
              background: 'var(--surface)',
              color: 'var(--text)',
              fontSize: '1rem',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            autoFocus
            maxLength={titleMax}
            onFocus={handleTitleFocus}
            onBlur={handleTitleBlur}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            {errors.title ? (
              <div style={{ color: 'var(--error)', fontSize: '0.85rem' }}>{errors.title}</div>
            ) : (
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Make it clear and specific</span>
            )}
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{titleLen}/{titleMax}</span>
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label htmlFor="goal-desc" style={{
            display: 'block',
            marginBottom: '8px',
            fontWeight: '500',
            color: 'var(--text)',
            fontSize: '0.95rem'
          }}>
            Description *
          </label>
          <textarea
            id="goal-desc"
            value={formData.description}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => handleInputChange('description', e.target.value)}
            placeholder="Describe your goal and why it's important to you..."
            rows={4}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: `1px solid ${errors.description ? 'var(--error)' : 'var(--border)'}`,
              borderRadius: '8px',
              background: 'var(--surface)',
              color: 'var(--text)',
              fontSize: '1rem',
              fontFamily: 'inherit',
              outline: 'none',
              resize: 'vertical',
              minHeight: '100px',
              transition: 'border-color 0.2s'
            }}
            maxLength={descMax}
            onFocus={handleDescFocus}
            onBlur={handleDescBlur}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            {errors.description ? (
              <div style={{ color: 'var(--error)', fontSize: '0.85rem' }}>{errors.description}</div>
            ) : (
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Add a short motivation to keep you accountable</span>
            )}
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{descLen}/{descMax}</span>
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <label style={{ fontWeight: 500, color: 'var(--text)', fontSize: '0.95rem' }}>Frequency Type</label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
            {frequencyTypes.map(type => {
              const active = formData.frequencyType === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleInputChange('frequencyType', type)}
                  aria-pressed={active}
                  style={{
                    padding: '12px',
                    borderRadius: 10,
                    border: `2px solid ${active ? 'var(--accent-600)' : 'var(--border)'}`,
                    background: active ? 'var(--accent-bg-soft)' : 'var(--surface)',
                    color: active ? 'var(--accent-600)' : 'var(--text)',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.9rem'
                  }}
                >
                  {labels[type]}
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <label style={{ fontWeight: 500, color: 'var(--text)', fontSize: '0.95rem' }}>
              {formData.frequencyType === 'weekly' ? 'Days per week' : 'Times per period'}
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <Calendar size={14} />
              <span>{freqLabel}</span>
            </div>
          </div>

          {formData.frequencyType === 'weekly' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
              {Array.from({ length: 7 }, (_, i) => i + 1).map(n => {
                const active = formData.frequencyNumber === n;
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => handleInputChange('frequencyNumber', n)}
                    aria-pressed={active}
                    style={{
                      padding: '10px 0',
                      borderRadius: 8,
                      border: `1px solid ${active ? 'color-mix(in oklab, var(--accent-600), transparent 30%)' : 'var(--border)'}`,
                      background: active ? 'var(--accent-600)' : 'var(--surface)',
                      color: active ? 'white' : 'var(--text)',
                      cursor: 'pointer',
                      fontWeight: 600
                    }}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input
                type="number"
                min="1"
                max={formData.frequencyType === 'daily' ? 10 : 30}
                value={formData.targetCount}
                onChange={(e: ChangeEvent<HTMLInputElement>) => handleInputChange('targetCount', Math.max(1, parseInt(e.target.value) || 1))}
                style={{
                  width: 80,
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--text)',
                  fontSize: '1rem',
                  textAlign: 'center'
                }}
              />
              <span style={{ color: 'var(--text-muted)' }}>
                {formData.frequencyType === 'daily' ? 'time(s) per day' : 'time(s) per month'}
              </span>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <Info size={14} />
            <span>
              {formData.frequencyType === 'daily' && 'Resets every day at midnight.'}
              {formData.frequencyType === 'weekly' && 'This sets your weekly target. Resets every Monday.'}
              {formData.frequencyType === 'monthly' && 'Resets on the 1st of each month.'}
            </span>
          </div>
        </div>

        {showInlineSuggestions && (
          <div style={{ marginBottom: '28px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 8 }}>Quick suggestions</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {suggestions.map((s) => (
                <button
                  key={s.t}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, title: s.t, description: s.d }))}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 999,
                    border: '1px solid var(--border)',
                    background: 'var(--surface)',
                    color: 'var(--text)',
                    cursor: 'pointer',
                    fontSize: '0.85rem'
                  }}
                >
                  {s.t}
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              flex: 1,
              padding: '12px 24px',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              background: 'var(--surface)',
              color: 'var(--text)',
              fontSize: '1rem',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={handleCancelMouseEnter}
            onMouseLeave={handleCancelMouseLeave}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="primary"
            style={{
              flex: 1,
              padding: '12px 24px',
              fontSize: '1rem',
              opacity: submitting ? 0.8 : 1,
              cursor: submitting ? 'default' : 'pointer'
            }}
            disabled={submitting}
          >
            {submitting ? 'Creating…' : 'Create Goal'}
          </button>
        </div>
      </form>
    </div>
  );
});

GoalForm.displayName = 'GoalForm';
export default GoalForm;
