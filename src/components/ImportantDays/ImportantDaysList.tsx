import { useState, useEffect } from 'react';
import { Calendar, Plus, Gift, Heart, Users, Plane, Home, Briefcase, Star, Trash2, Edit2, LucideIcon } from 'lucide-react';
import apiService from '../../services/api';
import ImportantDayModal, { ImportantDay, ImportantDaySaveData } from './ImportantDayModal';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { cn } from '@/lib/utils';
import Skeleton from '../ui/Skeleton';
import ConfirmDialog from '../ui/ConfirmDialog';
import type { ActionVisibility } from '@/types/common';

// ========== Types ==========

interface CategoryIcons {
  [key: string]: LucideIcon;
}

interface ImportantDayCardProps {
  day: ImportantDay;
  onEdit: (day: ImportantDay) => void;
  onDelete: (day: ImportantDay) => void;
}

// ========== Constants ==========

const CATEGORY_ICONS: CategoryIcons = {
  Birthday: Gift,
  Relationship: Heart,
  Family: Users,
  Travel: Plane,
  Home: Home,
  Work: Briefcase,
  Custom: Star,
};

const ACTION_VISIBILITY: ActionVisibility = 'adaptiveTouch';

// ========== Sub-Components ==========

const ImportantDayCard = ({ day, onEdit, onDelete }: ImportantDayCardProps) => {
  const IconComponent = CATEGORY_ICONS[day.category] || Calendar;

  const isToday = day.is_today;
  const isSoon = day.days_until !== undefined && day.days_until <= 7 && day.days_until > 0;
  const isPast = day.is_past;

  return (
    <div className={cn(
      "group relative flex items-center gap-4 p-4 rounded-xl border bg-card transition-all hover:shadow-md",
      isToday && "border-[color:var(--success)] bg-[color:var(--success-soft)]",
      isSoon && "border-[color:var(--warning)] bg-[color:var(--warning-soft)]",
      isPast && "opacity-75 bg-muted/50"
    )}>
      <div className={cn(
        "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
        isToday ? "bg-[color:var(--success-soft)] text-[color:var(--success)]" :
          isSoon ? "bg-[color:var(--warning-soft)] text-[color:var(--warning)]" :
            "bg-primary/10 text-primary"
      )}>
        <IconComponent size={20} />
      </div>

      <div className="flex-1 min-w-0">
        <h4 className={cn("font-medium truncate", isPast && "line-through text-muted-foreground")}>
          {day.title}
        </h4>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{day.category}</span>
          {day.recurring_type !== 'once' && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-muted border text-[10px]">
              Recurring
            </span>
          )}
        </div>
      </div>

      <div className="text-right shrink-0">
        <div className={cn(
          "font-bold text-lg leading-none",
          isToday ? "text-[color:var(--success)]" :
            isSoon ? "text-[color:var(--warning)]" :
              isPast ? "text-muted-foreground" :
                "text-foreground"
        )}>
          {day.display_text}
        </div>
      </div>

      <div className={cn(
        'absolute right-2 top-2 transition-opacity flex gap-1',
        ACTION_VISIBILITY === 'always' && 'opacity-100',
        ACTION_VISIBILITY === 'hover' && 'opacity-0 group-hover:opacity-100 focus-within:opacity-100',
        ACTION_VISIBILITY === 'adaptiveTouch' && 'opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100'
      )}>
        <Button
          variant="ghost"
          size="icon"
          className="h-11 w-11 min-h-[44px] min-w-[44px]"
          onClick={() => onEdit(day)}
          aria-label={`Edit ${day.title}`}
        >
          <Edit2 size={14} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-11 w-11 min-h-[44px] min-w-[44px] text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => onDelete(day)}
          aria-label={`Delete ${day.title}`}
        >
          <Trash2 size={14} />
        </Button>
      </div>
    </div>
  );
};

// ========== Main Component ==========

const ImportantDaysList = () => {
  const [days, setDays] = useState<ImportantDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDay, setEditingDay] = useState<ImportantDay | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [dayToDelete, setDayToDelete] = useState<ImportantDay | null>(null);

  const fetchDays = async () => {
    try {
      const response: any = await apiService.getImportantDays();
      // Handle both array and object response
      const data = Array.isArray(response) ? response : (response.days || []);
      setDays(data);
    } catch (err) {
      console.error('Failed to fetch important days:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDays();
  }, []);

  const handleAdd = () => {
    setEditingDay(null);
    setModalOpen(true);
  };

  const handleEdit = (day: ImportantDay) => {
    setEditingDay(day);
    setModalOpen(true);
  };

  const handleDeleteRequest = (day: ImportantDay) => {
    setDayToDelete(day);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!dayToDelete) return;
    try {
      await apiService.deleteImportantDay(dayToDelete.id);
      setDays(prev => prev.filter(d => d.id !== dayToDelete.id));
    } catch (err) {
      console.error('Failed to delete:', err);
    } finally {
      setDayToDelete(null);
    }
  };

  const handleSave = async (data: ImportantDaySaveData) => {
    try {
      if (editingDay) {
        await apiService.updateImportantDay(editingDay.id, data);
      } else {
        // Map category to type for API compatibility
        const typeMap: Record<string, 'countdown' | 'anniversary' | 'reminder'> = {
          'Birthday': 'anniversary',
          'Relationship': 'anniversary',
          'Family': 'anniversary',
          'Travel': 'countdown',
          'Home': 'countdown',
          'Work': 'reminder',
          'Custom': 'reminder',
        };
        await apiService.createImportantDay({
          ...data,
          type: typeMap[data.category] || 'reminder'
        });
      }
      setModalOpen(false);
      fetchDays();
    } catch (err) {
      console.error('Failed to save:', err);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <Calendar size={20} className="text-primary" />
          Important Days
        </h3>
        <Button onClick={handleAdd} size="sm" className="gap-2">
          <Plus size={16} />
          Add
        </Button>
      </div>

      {days.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-8 text-center border-dashed">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4 text-muted-foreground">
            <Gift size={24} />
          </div>
          <h4 className="font-medium mb-1">No upcoming days</h4>
          <p className="text-sm text-muted-foreground mb-4">Add birthdays, anniversaries, or countdowns</p>
          <Button variant="outline" onClick={handleAdd}>Add your first</Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {days.map(day => (
            <ImportantDayCard
              key={day.id}
              day={day}
              onEdit={handleEdit}
              onDelete={handleDeleteRequest}
            />
          ))}
        </div>
      )}

      {modalOpen && (
        <ImportantDayModal
          day={editingDay}
          onSave={handleSave}
          onClose={() => setModalOpen(false)}
        />
      )}

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Important Day"
        description={`Are you sure you want to delete "${dayToDelete?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default ImportantDaysList;
export { ImportantDayCard };
