import { useState, useEffect, CSSProperties } from 'react';
import { Flame, Check, Plus, Trophy, Share2 } from 'lucide-react';
import apiService from '../../services/api';
import './StreakChain.css';

interface DayInfo {
  date: string;
  dayName: string;
  hasEntry: boolean;
  isToday: boolean;
}

interface StreakData {
  current_streak: number;
  longest_streak: number;
  recent_days: DayInfo[];
}

const StreakChain = () => {
  const [data, setData] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const details = await apiService.getStreakDetails();
        setData(details);
      } catch (err) {
        console.error('Failed to fetch streak details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleShare = async () => {
    if (!data) return;
    setSharing(true);

    const streakText = `🔥 I'm on a ${data.current_streak}-day streak logging my mood!`;
    const longestText = data.longest_streak > 0 ? ` My longest streak: ${data.longest_streak} days!` : '';
    const shareText = `${streakText}${longestText}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'My Mood Streak',
          text: shareText,
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(shareText);
        alert('Streak copied to clipboard!');
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Share failed:', err);
      }
    } finally {
      setSharing(false);
    }
  };

  if (loading) {
    return (
      <div className="streak-chain streak-chain--loading">
        <div className="streak-chain__skeleton" />
      </div>
    );
  }

  if (!data) return null;

  const { current_streak, longest_streak, recent_days } = data;

  const shareButtonStyle: CSSProperties = {
    background: 'none',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    padding: '6px 12px',
    cursor: current_streak === 0 ? 'not-allowed' : 'pointer',
    color: 'var(--text-muted)',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.85rem',
    opacity: current_streak === 0 ? 0.5 : 1,
    transition: 'all 0.2s'
  };

  return (
    <div className="streak-chain">
      <div className="streak-chain__header">
        <h3 className="streak-chain__title">Days in a Row</h3>
        <button
          onClick={handleShare}
          disabled={sharing || current_streak === 0}
          className="streak-chain__share-btn"
          style={shareButtonStyle}
          title={current_streak === 0 ? 'Start a streak to share' : 'Share your streak'}
        >
          <Share2 size={14} />
          Share
        </button>
      </div>

      <div className="streak-chain__days">
        <div className="streak-chain__line" />

        {recent_days.map((day) => (
          <div
            key={day.date}
            className={`streak-chain__day ${day.hasEntry ? 'streak-chain__day--logged' : ''} ${day.isToday ? 'streak-chain__day--today' : ''}`}
          >
            <div className="streak-chain__circle">
              {day.hasEntry ? (
                <Check size={14} strokeWidth={3} />
              ) : (
                <Plus size={14} strokeWidth={2} />
              )}
            </div>
            <span className="streak-chain__dayname">{day.dayName}</span>
          </div>
        ))}

        <div className="streak-chain__count">
          <Flame size={20} className="streak-chain__flame" />
          <span className="streak-chain__number">{current_streak}</span>
        </div>
      </div>

      {longest_streak > 0 && (
        <div className="streak-chain__longest">
          <Trophy size={14} />
          <span>Longest Chain: {longest_streak}</span>
        </div>
      )}
    </div>
  );
};

export default StreakChain;
