import { useState, useEffect, ChangeEvent } from 'react';
import { ChevronDown } from 'lucide-react';
import { getIconComponent } from '../ui/IconPicker';
import apiService from '../../services/api';
import './FrequentlyTogether.css';

// ========== Types ==========

interface MoodOption {
  value: number | 'all';
  label: string;
  emoji: string;
}

interface ActivityPair {
  option1_id: number;
  option2_id: number;
  option1_name: string;
  option2_name: string;
  option1_icon: string;
  option2_icon: string;
  frequency: number;
}

interface FrequentlyTogetherProps {
  data: ActivityPair[];
}

// ========== Constants ==========

const MOOD_OPTIONS: MoodOption[] = [
  { value: 'all', label: 'All Moods', emoji: '🎯' },
  { value: 5, label: 'Amazing', emoji: '😄' },
  { value: 4, label: 'Good', emoji: '🙂' },
  { value: 3, label: 'Okay', emoji: '😐' },
  { value: 2, label: 'Bad', emoji: '😕' },
  { value: 1, label: 'Terrible', emoji: '😢' },
];

// ========== Component ==========

const FrequentlyTogether = ({ data }: FrequentlyTogetherProps) => {
  const [selectedMood, setSelectedMood] = useState<number | 'all'>('all');
  const [filteredData, setFilteredData] = useState<ActivityPair[] | null>(null);
  const [loading, setLoading] = useState(false);

  // Use provided data or filtered data
  const displayData = filteredData !== null ? filteredData : data;

  useEffect(() => {
    if (selectedMood === 'all') {
      setFilteredData(null);
      return;
    }

    // Fetch mood-filtered co-occurrence data
    const fetchFiltered = async () => {
      setLoading(true);
      try {
        const result = await apiService.getAnalyticsCoOccurrenceByMood(selectedMood);
        setFilteredData(result || []);
      } catch (err) {
        console.error('Failed to fetch filtered pairs:', err);
        setFilteredData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchFiltered();
  }, [selectedMood]);

  const handleMoodChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedMood(value === 'all' ? 'all' : Number(value));
  };

  if ((!data || data.length === 0) && selectedMood === 'all') {
    return (
      <div className="frequently-together frequently-together--empty">
        <p>Not enough data for pairs yet.</p>
      </div>
    );
  }

  return (
    <div className="frequently-together card">
      <div className="frequently-together__header">
        <div>
          <h3 className="frequently-together__title">Often Together</h3>
          <p className="frequently-together__subtitle">
            When you feel:
            <select
              value={selectedMood}
              onChange={handleMoodChange}
              className="frequently-together__mood-select"
            >
              {MOOD_OPTIONS.map(mood => (
                <option key={mood.value} value={mood.value}>
                  {mood.emoji} {mood.label}
                </option>
              ))}
            </select>
          </p>
        </div>
      </div>

      {loading ? (
        <div className="frequently-together__loading">Loading...</div>
      ) : !displayData || displayData.length === 0 ? (
        <div className="frequently-together__empty-state">
          <p>No activity pairs found for this mood.</p>
        </div>
      ) : (
        <>
          <p className="frequently-together__label">You often do this:</p>
          <div className="frequently-together__grid">
            {displayData.slice(0, 8).map((pair) => {
              const Icon1 = getIconComponent(pair.option1_icon);
              const Icon2 = getIconComponent(pair.option2_icon);

              return (
                <div key={`${pair.option1_id}-${pair.option2_id}`} className="frequently-together__card">
                  <div className="frequently-together__icons">
                    <span>{Icon1 && <Icon1 size={18} />}</span>
                    <span className="frequently-together__plus">+</span>
                    <span>{Icon2 && <Icon2 size={18} />}</span>
                  </div>
                  <div className="frequently-together__names">
                    <span>{pair.option1_name}</span>
                    <span>&</span>
                    <span>{pair.option2_name}</span>
                  </div>
                  <div className="frequently-together__count">{pair.frequency}×</div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default FrequentlyTogether;
