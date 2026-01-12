import { useState, useEffect, useRef } from 'react';
import { Search, X, Calendar, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { MOOD_CONFIG, TIMEOUTS } from '../../constants/appConstants';
import './SearchModal.css';

// MOODS constant replaced by MOOD_CONFIG from constants

// Highlight matching search terms in text
const highlightText = (text, query) => {
    if (!query || !text) return text;

    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'));

    return parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase()
            ? <mark key={i} className="search-highlight">{part}</mark>
            : part
    );
};

const SearchModal = ({ isOpen, onClose }) => {
    const [query, setQuery] = useState('');
    const [selectedMoods, setSelectedMoods] = useState([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef(null);
    const modalRef = useRef(null);
    const navigate = useNavigate();
    useAuth(); // Assuming useAuth exposes token or we get it from storage

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 50);
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    // Close on Escape or Click Outside
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        const handleClickOutside = (e) => {
            if (modalRef.current && !modalRef.current.contains(e.target)) {
                onClose();
            }
        };
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    // Debounced Search
    useEffect(() => {
        if (!isOpen) return;

        // Only search if we have a query OR filters
        if (!query && selectedMoods.length === 0 && !startDate && !endDate) {
            setResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                if (query) params.append('q', query);
                if (selectedMoods.length > 0) params.append('moods', selectedMoods.join(','));
                if (startDate) params.append('start_date', startDate);
                if (endDate) params.append('end_date', endDate);

                const res = await fetch(`/api/search?${params.toString()}`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setResults(data);
                }
            } catch (err) {
                console.error("Search failed", err);
            } finally {
                setLoading(false);
            }
        }, TIMEOUTS.DEBOUNCE_SEARCH);

        return () => clearTimeout(timer);
    }, [query, selectedMoods, startDate, endDate, isOpen]);

    const toggleMood = (mood) => {
        setSelectedMoods(prev =>
            prev.includes(mood) ? prev.filter(m => m !== mood) : [...prev, mood]
        );
    };

    const handleEntryClick = (entry) => {
        onClose();
        navigate('/dashboard/entry', { state: { entry, mood: entry.mood } });
    };

    if (!isOpen) return null;

    return (
        <div className="search-modal-overlay">
            <div className="search-modal" ref={modalRef}>
                <div className="search-header">
                    <div className="search-input-wrapper">
                        <Search className="search-icon" size={20} />
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Search your journal..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="search-input"
                        />
                        {query && (
                            <button onClick={() => setQuery('')} className="clear-btn">
                                <X size={16} />
                            </button>
                        )}
                    </div>
                    <button onClick={onClose} className="close-btn">Done</button>
                </div>

                <div className="search-filters">
                    <div className="filter-group">
                        <span className="filter-label"><Filter size={14} /> Mood</span>
                        <div className="mood-filters">
                            {MOOD_CONFIG.map(m => (
                                <button
                                    key={m.value}
                                    onClick={() => toggleMood(m.value)}
                                    className={`mood-chip ${selectedMoods.includes(m.value) ? 'active' : ''}`}
                                    style={{
                                        '--chip-color': m.color,
                                        backgroundColor: selectedMoods.includes(m.value) ? m.color : 'transparent',
                                        color: selectedMoods.includes(m.value) ? '#000' : 'var(--text-muted)'
                                    }}
                                >
                                    {m.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="filter-group border-l pl-4 ml-4">
                        <span className="filter-label"><Calendar size={14} /> Range</span>
                        <div className="date-filters">
                            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                            <span>to</span>
                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                        </div>
                    </div>
                </div>

                <div className="search-results">
                    {loading && <div className="loading-state">Searching...</div>}

                    {!loading && results.length === 0 && (query || selectedMoods.length > 0) && (
                        <div className="empty-state">No matching entries found.</div>
                    )}

                    <div className="results-list">
                        {results.map(entry => (
                            <div key={entry.id} className="result-item" onClick={() => handleEntryClick(entry)}>
                                <div className="result-date">
                                    <span className="day">{new Date(entry.date).getDate()}</span>
                                    <span className="month">{new Date(entry.date).toLocaleString('default', { month: 'short' })}</span>
                                    <span className="year">{new Date(entry.date).getFullYear()}</span>
                                </div>
                                <div className="result-content">
                                    <div className="mood-indicator" style={{ backgroundColor: `var(--mood-${entry.mood})` }}></div>
                                    <p className="entry-truncate">{highlightText(entry.content, query)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SearchModal;
