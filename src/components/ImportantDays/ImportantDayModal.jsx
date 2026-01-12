import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import './ImportantDays.css';

const CATEGORIES = ['Birthday', 'Relationship', 'Family', 'Travel', 'Home', 'Work', 'Custom'];
const RECURRING_TYPES = [
    { value: 'once', label: 'One-time' },
    { value: 'yearly', label: 'Every year' },
    { value: 'monthly', label: 'Every month' },
];

const ImportantDayModal = ({ day, onSave, onClose }) => {
    const [title, setTitle] = useState('');
    const [date, setDate] = useState('');
    const [category, setCategory] = useState('Custom');
    const [recurringType, setRecurringType] = useState('once');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (day) {
            setTitle(day.title || '');
            setDate(day.date || '');
            setCategory(day.category || 'Custom');
            setRecurringType(day.recurring_type || 'once');
            setNotes(day.notes || '');
        }
    }, [day]);

    const handleSubmit = (e) => {
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
        <div className="important-day-modal__overlay" onClick={onClose}>
            <div className="important-day-modal" onClick={e => e.stopPropagation()}>
                <div className="important-day-modal__header">
                    <h3>{day ? 'Edit Important Day' : 'Add Important Day'}</h3>
                    <button onClick={onClose} className="important-day-modal__close">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="important-day-modal__form">
                    <div className="important-day-modal__field">
                        <label htmlFor="title">Title</label>
                        <input
                            id="title"
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="e.g., Mom's Birthday"
                            required
                        />
                    </div>

                    <div className="important-day-modal__field">
                        <label htmlFor="date">Date</label>
                        <input
                            id="date"
                            type="date"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            required
                        />
                    </div>

                    <div className="important-day-modal__field">
                        <label htmlFor="category">Category</label>
                        <select
                            id="category"
                            value={category}
                            onChange={e => setCategory(e.target.value)}
                        >
                            {CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    <div className="important-day-modal__field">
                        <label htmlFor="recurring">Repeat</label>
                        <select
                            id="recurring"
                            value={recurringType}
                            onChange={e => setRecurringType(e.target.value)}
                        >
                            {RECURRING_TYPES.map(rt => (
                                <option key={rt.value} value={rt.value}>{rt.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="important-day-modal__field">
                        <label htmlFor="notes">Notes (optional)</label>
                        <textarea
                            id="notes"
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder="Add any notes..."
                            rows={3}
                        />
                    </div>

                    <div className="important-day-modal__actions">
                        <button type="button" onClick={onClose} className="important-day-modal__btn--secondary">
                            Cancel
                        </button>
                        <button type="submit" className="important-day-modal__btn--primary">
                            {day ? 'Update' : 'Add'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ImportantDayModal;
