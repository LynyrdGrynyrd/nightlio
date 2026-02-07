import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

// ========== Types ==========

type RecurringType = 'once' | 'yearly' | 'monthly';

interface ImportantDay {
  id: number;
  title: string;
  date: string;
  category: string;
  recurring_type: RecurringType;
  notes?: string | null;
  display_text?: string;
  days_until?: number;
  is_today?: boolean;
  is_past?: boolean;
}

interface ImportantDaySaveData {
  title: string;
  date: string;
  category: string;
  recurring_type: RecurringType;
  notes: string | null;
}

interface ImportantDayModalProps {
  day: ImportantDay | null;
  onSave: (data: ImportantDaySaveData) => void;
  onClose: () => void;
}

interface RecurringTypeOption {
  value: RecurringType;
  label: string;
}

// ========== Constants ==========

const CATEGORIES = ['Birthday', 'Relationship', 'Family', 'Travel', 'Home', 'Work', 'Custom'];
const RECURRING_TYPES: RecurringTypeOption[] = [
  { value: 'once', label: 'One-time' },
  { value: 'yearly', label: 'Every year' },
  { value: 'monthly', label: 'Every month' },
];

// ========== Component ==========

const ImportantDayModal = ({ day, onSave, onClose }: ImportantDayModalProps) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [category, setCategory] = useState('Custom');
  const [recurringType, setRecurringType] = useState<RecurringType>('once');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (day) {
      setTitle(day.title || '');
      setDate(day.date || '');
      setCategory(day.category || 'Custom');
      setRecurringType(day.recurring_type || 'once');
      setNotes(day.notes || '');
    } else {
      setTitle('');
      setDate('');
      setCategory('Custom');
      setRecurringType('once');
      setNotes('');
    }
  }, [day]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title.trim() || !date) return;

    onSave({
      title: title.trim(),
      date,
      category,
      recurring_type: recurringType,
      notes: notes.trim() || null,
    });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{day ? 'Edit Important Day' : 'Add Important Day'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="important-day-title"
              autoComplete="off"
              value={title}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
              placeholder="e.g., Mom's Birthday"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              name="important-day-date"
              autoComplete="off"
              type="date"
              value={date}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="recurring">Repeat</Label>
            <Select value={recurringType} onValueChange={(val) => setRecurringType(val as RecurringType)}>
              <SelectTrigger>
                <SelectValue placeholder="Select recurrence" />
              </SelectTrigger>
              <SelectContent>
                {RECURRING_TYPES.map(rt => (
                  <SelectItem key={rt.value} value={rt.value}>{rt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              name="important-day-notes"
              autoComplete="off"
              value={notes}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
              placeholder="Add any notes..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {day ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ImportantDayModal;
export type { ImportantDay, ImportantDaySaveData };
