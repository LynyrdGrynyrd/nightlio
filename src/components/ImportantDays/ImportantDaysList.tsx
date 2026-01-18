import { useState, useEffect } from 'react';
import { Calendar, Plus, Gift, Heart, Users, Plane, Home, Briefcase, Star, Trash2, Edit2, LucideIcon } from 'lucide-react';
import apiService from '../../services/api';
import ImportantDayModal, { ImportantDay, ImportantDaySaveData } from './ImportantDayModal';
import './ImportantDays.css';

// ========== Types ==========

interface CategoryIcons {
  [key: string]: LucideIcon;
}

interface ImportantDayCardProps {
  day: ImportantDay;
  onEdit: (day: ImportantDay) => void;
  onDelete: (dayId: number) => void;
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

// ========== Sub-Components ==========

const ImportantDayCard = ({ day, onEdit, onDelete }: ImportantDayCardProps) => {
  const IconComponent = CATEGORY_ICONS[day.category] || Calendar;

  const getCountdownClass = (): string => {
    if (day.is_today) return 'important-day-card--today';
    if (day.days_until !== undefined && day.days_until <= 7 && day.days_until > 0) return 'important-day-card--soon';
    if (day.is_past) return 'important-day-card--past';
    return '';
  };

  return (
    <div className={`important-day-card ${getCountdownClass()}`}>
      <div className="important-day-card__icon">
        <IconComponent size={20} />
      </div>
      <div className="important-day-card__content">
        <h4 className="important-day-card__title">{day.title}</h4>
        <span className="important-day-card__category">{day.category}</span>
      </div>
      <div className="important-day-card__countdown">
        <span className="important-day-card__days">{day.display_text}</span>
        {day.recurring_type !== 'once' && (
          <span className="important-day-card__recurring">🔄</span>
        )}
      </div>
      <div className="important-day-card__actions">
        <button onClick={() => onEdit(day)} className="important-day-card__btn" aria-label="Edit">
          <Edit2 size={14} />
        </button>
        <button onClick={() => onDelete(day.id)} className="important-day-card__btn important-day-card__btn--delete" aria-label="Delete">
          <Trash2 size={14} />
        </button>
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

  const fetchDays = async () => {
    try {
      const response = await apiService.getImportantDays();
      setDays(response.days || []);
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

  const handleDelete = async (dayId: number) => {
    if (!window.confirm('Delete this important day?')) return;
    try {
      await apiService.deleteImportantDay(dayId);
      setDays(prev => prev.filter(d => d.id !== dayId));
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  const handleSave = async (data: ImportantDaySaveData) => {
    try {
      if (editingDay) {
        await apiService.updateImportantDay(editingDay.id, data);
      } else {
        await apiService.createImportantDay(data);
      }
      setModalOpen(false);
      fetchDays();
    } catch (err) {
      console.error('Failed to save:', err);
    }
  };

  if (loading) {
    return (
      <div className="important-days">
        <div className="important-days__skeleton" />
      </div>
    );
  }

  return (
    <div className="important-days">
      <div className="important-days__header">
        <h3 className="important-days__title">Important Days</h3>
        <button onClick={handleAdd} className="important-days__add-btn">
          <Plus size={16} />
          Add
        </button>
      </div>

      {days.length === 0 ? (
        <div className="important-days__empty">
          <Calendar size={32} />
          <p>No important days yet</p>
          <button onClick={handleAdd} className="important-days__empty-btn">Add your first</button>
        </div>
      ) : (
        <div className="important-days__list">
          {days.map(day => (
            <ImportantDayCard
              key={day.id}
              day={day}
              onEdit={handleEdit}
              onDelete={handleDelete}
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
    </div>
  );
};

export default ImportantDaysList;
export { ImportantDayCard };
