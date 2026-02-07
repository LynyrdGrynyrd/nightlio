import { MOODS } from '../../utils/moodUtils';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

// Tailwind JIT needs full class strings — no template literals
const moodTextClass: Record<number, string> = {
  1: '!text-mood-1',
  2: '!text-mood-2',
  3: '!text-mood-3',
  4: '!text-mood-4',
  5: '!text-mood-5',
};

interface MoodPickerProps {
  onMoodSelect: (mood: number) => void;
  selectedMood: number | null;
}

const MoodPicker = ({ onMoodSelect, selectedMood }: MoodPickerProps) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="grid grid-cols-5 gap-3 p-2 justify-items-center">
      {MOODS.map(mood => {
        const IconComponent = mood.icon;
        const isSelected = selectedMood === mood.value;
        const isMuted = selectedMood !== null && !isSelected;

        const motionProps = prefersReducedMotion
          ? {}
          : {
            whileHover: { scale: 1.1 },
            whileTap: { scale: 0.95 },
            initial: { scale: 1 },
            animate: {
              scale: isSelected ? 1.15 : 1,
              opacity: isMuted ? 0.3 : 1,
            },
          };

        return (
          <motion.button
            key={mood.value}
            onClick={() => onMoodSelect(mood.value)}
            className={cn(
              "group flex flex-col items-center justify-center p-3 rounded-2xl outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
              moodTextClass[mood.value],
              isSelected ? "bg-accent/10 shadow-inner" : "hover:bg-accent/5",
              isMuted && "grayscale opacity-40 hover:opacity-100 hover:grayscale-0"
            )}
            style={{ backgroundColor: isSelected ? 'var(--accent-bg-softer)' : 'transparent' }}
            aria-label={`Select mood: ${mood.label}`}
            aria-pressed={isSelected}
            {...motionProps}
            type="button"
          >
            <IconComponent
              size={48}
              strokeWidth={isSelected ? 2 : 1.5}
              className={cn("icon-custom drop-shadow-sm", moodTextClass[mood.value])}
              fill={isSelected ? "currentColor" : "none"}
              aria-hidden="true"
            />
            <motion.span
              className={cn(
                "text-xs uppercase tracking-[0.08em] font-semibold mt-2",
                isSelected ? "opacity-100" : "opacity-70"
              )}
            >
              {mood.label}
            </motion.span>
          </motion.button>
        );
      })}
    </div>
  );
};

export default MoodPicker;
