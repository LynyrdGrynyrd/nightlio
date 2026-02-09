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
    <div className="flex items-center justify-center gap-4 p-5 bg-card rounded-[calc(var(--radius)+2px)] border border-border/70 shadow-sm">
      <IconComponent
        size={size}
        strokeWidth={1.5}
        style={{ color: mood.color }}
      />
      <span
        className="text-xl font-semibold font-journal"
        style={{ color: mood.color }}
      >
        Feeling {mood.label.toLowerCase()}
      </span>
    </div>
  );
};

export default MoodDisplay;
