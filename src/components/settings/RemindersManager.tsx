import { Dispatch, ReactElement, SetStateAction, useEffect, useMemo, useState } from 'react';
import { Bell, Clock, Trash2, Plus, Pencil, Save, X } from 'lucide-react';
import apiService, { Goal, Reminder } from '../../services/api';
import { useNotificationSubscription } from '../../hooks/useNotificationSubscription';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { useToast } from '../ui/ToastProvider';

interface ReminderDraft {
  time: string;
  days: number[];
  message: string;
  goalId: string;
  isActive: boolean;
}

const WEEKDAYS = [
  { value: 0, label: 'Mon' },
  { value: 1, label: 'Tue' },
  { value: 2, label: 'Wed' },
  { value: 3, label: 'Thu' },
  { value: 4, label: 'Fri' },
  { value: 5, label: 'Sat' },
  { value: 6, label: 'Sun' },
];

const DEFAULT_DRAFT: ReminderDraft = {
  time: '20:00',
  days: [0, 1, 2, 3, 4, 5, 6],
  message: 'Time to log your mood!',
  goalId: '',
  isActive: true,
};

const normalizeDays = (days: number[]): number[] =>
  Array.from(
    new Set(days.filter((day) => Number.isInteger(day) && day >= 0 && day <= 6))
  ).sort((a, b) => a - b);

const formatDaysLabel = (days: number[]): string => {
  const normalized = normalizeDays(days);
  if (normalized.length === 7) return 'Every day';
  if (normalized.length === 0) return 'No days selected';
  return normalized
    .map((day) => WEEKDAYS.find((item) => item.value === day)?.label || '')
    .filter(Boolean)
    .join(', ');
};

const fromReminder = (reminder: Reminder): ReminderDraft => ({
  time: reminder.time,
  days: normalizeDays(reminder.days || []),
  message: reminder.message || 'Time to log your mood!',
  goalId: reminder.goal_id ? String(reminder.goal_id) : '',
  isActive: reminder.is_active ?? reminder.isActive ?? true,
});

function toPayload(draft: ReminderDraft) {
  const parsedGoalId = Number(draft.goalId);
  return {
    time: draft.time,
    days: normalizeDays(draft.days),
    message: draft.message.trim() || 'Time to log your mood!',
    goal_id:
      draft.goalId && Number.isFinite(parsedGoalId) ? parsedGoalId : null,
    is_active: draft.isActive,
  };
}

function toggleDraftDay(
  setter: Dispatch<SetStateAction<ReminderDraft>>,
  day: number
): void {
  setter((prev) => {
    const hasDay = prev.days.includes(day);
    const nextDays = hasDay
      ? prev.days.filter((value) => value !== day)
      : [...prev.days, day];
    return { ...prev, days: normalizeDays(nextDays) };
  });
}

// --- Shared form fields ---

interface ReminderFormFieldsProps {
  draft: ReminderDraft;
  setDraft: Dispatch<SetStateAction<ReminderDraft>>;
  goals: Goal[];
}

function ReminderFormFields({ draft, setDraft, goals }: ReminderFormFieldsProps): ReactElement {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          type="time"
          value={draft.time}
          onChange={(event) =>
            setDraft((prev) => ({ ...prev, time: event.target.value }))
          }
          className="font-mono"
        />
        <Select
          value={draft.goalId || 'none'}
          onValueChange={(value) =>
            setDraft((prev) => ({
              ...prev,
              goalId: value === 'none' ? '' : value,
            }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Link goal (optional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No linked goal</SelectItem>
            {goals.map((goal) => (
              <SelectItem key={goal.id} value={String(goal.id)}>
                {goal.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Input
        value={draft.message}
        onChange={(event) =>
          setDraft((prev) => ({ ...prev, message: event.target.value }))
        }
        placeholder="Reminder message"
      />

      <div className="space-y-2">
        <div className="text-xs text-muted-foreground">Weekdays</div>
        <div className="flex flex-wrap gap-2">
          {WEEKDAYS.map((day) => {
            const selected = draft.days.includes(day.value);
            return (
              <Button
                key={day.value}
                type="button"
                size="sm"
                variant={selected ? 'default' : 'outline'}
                onClick={() => toggleDraftDay(setDraft, day.value)}
                className="h-8 px-3 text-xs"
              >
                {day.label}
              </Button>
            );
          })}
        </div>
      </div>
    </>
  );
}

// --- RemindersManager ---

const RemindersManager = () => {
  const isMockMode = import.meta.env.VITE_MOCK_MODE === 'true';
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newReminder, setNewReminder] = useState<ReminderDraft>(DEFAULT_DRAFT);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<ReminderDraft>(DEFAULT_DRAFT);
  const { show } = useToast();
  const { subscribed, subscribing, subscribe, sendTest } = useNotificationSubscription(isMockMode);

  const goalTitleMap = useMemo(() => {
    const map = new Map<string, string>();
    goals.forEach((goal) => map.set(String(goal.id), goal.title));
    return map;
  }, [goals]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [reminderRows, goalRows] = await Promise.all([
        apiService.getReminders(),
        apiService.getGoals(),
      ]);
      setReminders(reminderRows || []);
      setGoals(goalRows || []);
    } catch (err) {
      console.error('Failed to load reminders', err);
      show('Failed to load reminders.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      await loadData();
      if (!mounted) return;
    };
    init();
    return () => {
      mounted = false;
    };
  }, []);

  const validateDraft = (draft: ReminderDraft): boolean => {
    if (!draft.time) {
      show('Please choose a reminder time.', 'error');
      return false;
    }
    if (draft.days.length === 0) {
      show('Select at least one weekday.', 'error');
      return false;
    }
    return true;
  };

  const handleCreateReminder = async () => {
    if (!validateDraft(newReminder)) return;

    setSaving(true);
    try {
      await apiService.createReminder(toPayload(newReminder));
      setNewReminder(DEFAULT_DRAFT);
      await loadData();
      show('Reminder created.', 'success');
    } catch (err) {
      console.error(err);
      show('Failed to create reminder.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteReminder = async (id: number) => {
    try {
      await apiService.deleteReminder(id);
      await loadData();
      show('Reminder deleted.', 'success');
    } catch (err) {
      console.error(err);
      show('Failed to delete reminder.', 'error');
    }
  };

  const handleToggleActive = async (reminder: Reminder) => {
    try {
      await apiService.updateReminder(reminder.id, {
        is_active: !(reminder.is_active ?? reminder.isActive ?? true),
      });
      await loadData();
    } catch (err) {
      console.error(err);
      show('Failed to update reminder.', 'error');
    }
  };

  const handleStartEdit = (reminder: Reminder) => {
    setEditingId(reminder.id);
    setEditDraft(fromReminder(reminder));
  };

  const handleSaveEdit = async (reminderId: number) => {
    if (!validateDraft(editDraft)) return;

    setSaving(true);
    try {
      await apiService.updateReminder(reminderId, toPayload(editDraft));
      setEditingId(null);
      await loadData();
      show('Reminder updated.', 'success');
    } catch (err) {
      console.error(err);
      show('Failed to update reminder.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Bell className="w-6 h-6 text-primary" />
          <CardTitle>Daily Reminders</CardTitle>
        </div>
        <CardDescription>
          Configure weekday reminders with optional custom messages and linked goals.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!subscribed ? (
          <div className="flex flex-col gap-4">
            <CardDescription>
              Enable push notifications to receive reminders on this device.
            </CardDescription>
            <Button onClick={subscribe} disabled={subscribing} className="self-start">
              {subscribing ? 'Enabling...' : 'Enable Notifications'}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <Badge
              variant="outline"
              className="text-[color:var(--success)] border-[color:var(--success)] w-fit"
            >
              <span className="w-2 h-2 rounded-full bg-[color:var(--success)] mr-2" />
              Notifications Enabled
            </Badge>
            <Button variant="link" onClick={sendTest} className="self-start p-0 h-auto">
              Send Test Notification
            </Button>
          </div>
        )}

        {subscribed && (
          <>
            <div className="border rounded-xl p-4 space-y-4">
              <h3 className="font-semibold">New Reminder</h3>
              <ReminderFormFields
                draft={newReminder}
                setDraft={setNewReminder}
                goals={goals}
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Active</span>
                  <Switch
                    checked={newReminder.isActive}
                    onCheckedChange={(checked) =>
                      setNewReminder((prev) => ({ ...prev, isActive: checked }))
                    }
                    aria-label="Toggle reminder active state"
                  />
                </div>
                <Button onClick={handleCreateReminder} disabled={saving}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Reminder
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold">Your Reminders</h3>

              {loading ? (
                <p className="text-sm text-muted-foreground">Loading reminders...</p>
              ) : reminders.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No reminders set.</p>
              ) : (
                reminders.map((reminder) => {
                  const isEditing = editingId === reminder.id;
                  const activeState = reminder.is_active ?? reminder.isActive ?? true;
                  return (
                    <Card key={reminder.id} className="p-3">
                      {!isEditing ? (
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-muted-foreground" />
                              <span className="font-mono text-lg">{reminder.time}</span>
                              <Badge variant={activeState ? 'default' : 'outline'}>
                                {activeState ? 'Active' : 'Paused'}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1">
                              <Switch
                                checked={activeState}
                                onCheckedChange={() => handleToggleActive(reminder)}
                                aria-label="Toggle reminder active state"
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleStartEdit(reminder)}
                                aria-label="Edit reminder"
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteReminder(reminder.id)}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                aria-label="Delete reminder"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p>{reminder.message || 'Time to log your mood!'}</p>
                            <p>{formatDaysLabel(reminder.days || [])}</p>
                            {reminder.goal_id ? (
                              <p className="text-foreground/80">
                                Linked goal:{' '}
                                <span className="font-medium">
                                  {goalTitleMap.get(String(reminder.goal_id)) ||
                                    `Goal #${reminder.goal_id}`}
                                </span>
                              </p>
                            ) : null}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <ReminderFormFields
                            draft={editDraft}
                            setDraft={setEditDraft}
                            goals={goals}
                          />
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>Active</span>
                              <Switch
                                checked={editDraft.isActive}
                                onCheckedChange={(checked) =>
                                  setEditDraft((prev) => ({ ...prev, isActive: checked }))
                                }
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingId(null)}
                              >
                                <X className="w-4 h-4 mr-1" />
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleSaveEdit(reminder.id)}
                                disabled={saving}
                              >
                                <Save className="w-4 h-4 mr-1" />
                                Save
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </Card>
                  );
                })
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default RemindersManager;
