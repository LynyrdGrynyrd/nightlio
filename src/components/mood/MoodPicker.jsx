import { MOODS } from '../../utils/moodUtils';
// import { motion } from 'framer-motion';
import './MoodPicker.css';

const MoodPicker = ({ onMoodSelect, selectedMood }) => {
  return (
    <div className="mood-grid">
      {MOODS.map(mood => {
        const IconComponent = mood.icon;
        const isSelected = selectedMood === mood.value;

        return (
          <motion.button
            key={mood.value}
            onClick={() => onMoodSelect(mood.value)}
            className={`mood-button ${isSelected ? 'is-selected' : ''}`}
            style={{ color: mood.color }}
            title={mood.label}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            initial={{ scale: 1 }}
            animate={{ scale: isSelected ? 1.15 : 1 }}
          >
            <IconComponent
              size={40}
              strokeWidth={1.5}
              fill={isSelected ? "currentColor" : "none"}
            />
          </motion.button>
        );
      })}
    </div>
  );
};

export default MoodPicker;