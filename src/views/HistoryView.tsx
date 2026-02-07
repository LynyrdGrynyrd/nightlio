import MoodPicker from '../components/mood/MoodPicker';
import HistoryList from '../components/history/HistoryList';
import { HistoryEntry } from '../types/entry';

// ========== Types ==========

interface HistoryViewProps {
  pastEntries: HistoryEntry[];
  loading: boolean;
  error: string | null;
  onMoodSelect: (mood: number) => void;
  onDelete: (id: number) => void;
  onEdit: (entry: HistoryEntry) => void;
  renderOnlyHeader?: boolean;
}

// ========== Component ==========

const HistoryView = ({
  pastEntries,
  loading,
  error,
  onMoodSelect,
  onDelete,
  onEdit,
  renderOnlyHeader = false
}: HistoryViewProps) => {
  const currentDate = new Date();
  const dateString = currentDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const timeString = currentDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  return (
    <>
      <div className="space-y-6">
        {/* Mood Picker - Now visible and properly styled */}
        <div className="flex justify-center">
          <MoodPicker onMoodSelect={onMoodSelect} selectedMood={null} />
        </div>

        {/* Date Section with proper spacing */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Today</h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-sm text-muted-foreground">
            <span>{dateString}</span>
            <span className="hidden sm:inline">•</span>
            <span>{timeString}</span>
          </div>
        </div>
      </div>
      {renderOnlyHeader ? null : (
        <HistoryList
          entries={pastEntries}
          loading={loading}
          error={error ?? undefined}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      )}
    </>
  );
};

export default HistoryView;
