import { MOODS } from '../../utils/moodUtils';
import { CSSProperties } from 'react';

interface MoodDisplayProps {
  moodValue: number;
  size?: number;
}

const MoodDisplay = ({ moodValue, size = 32 }: MoodDisplayProps) => {
  const mood = MOODS.find(m => m.value === moodValue);
  
  if (!mood) return null;
  
  const IconComponent = mood.icon;
  
  const containerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1rem',
    padding: '1rem',
    background: 'var(--bg-card)',
    borderRadius: '16px',
    boxShadow: 'var(--shadow-lg)',
  };

  const textStyle: CSSProperties = {
    fontSize: '1.2rem',
    fontWeight: '600',
    color: mood.color,
  };

  const iconStyle: CSSProperties = {
    color: mood.color
  };

  return (
    <div style={containerStyle}>
      <IconComponent
        size={size}
        strokeWidth={1.5}
        style={iconStyle}
      />
      <span style={textStyle}>
        Feeling {mood.label}
      </span>
    </div>
  );
};

export default MoodDisplay;
