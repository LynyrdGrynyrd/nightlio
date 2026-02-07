import { MOODS } from '../../utils/moodUtils';

interface MoodDisplayProps {
  moodValue: number;
  size?: number;
}

const MoodDisplay = ({ moodValue, size = 32 }: MoodDisplayProps) => {
  const mood = MOODS.find(m => m.value === moodValue);

  if (!mood) return null;

  const IconComponent = mood.icon;

  return (
    <div className="flex items-center justify-center gap-4 p-4 bg-card rounded-2xl shadow-lg">
      <IconComponent
        size={size}
        strokeWidth={1.5}
        style={{ color: mood.color }}
      />
      <span
        className="text-xl font-semibold"
        style={{ color: mood.color }}
      >
        Feeling {mood.label}
      </span>
    </div>
  );
};

export default MoodDisplay;
