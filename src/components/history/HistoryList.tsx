import { CSSProperties } from 'react';
import HistoryEntry from './HistoryEntry';
import AddEntryCard from './AddEntryCard';
import Skeleton from '../ui/Skeleton';
import EmptyState from '../ui/EmptyState';

interface Selection {
  id: number;
  name: string;
  icon: string;
}

interface Media {
  id: number;
  file_path: string;
}

interface Entry {
  id: number;
  date: string;
  created_at?: string;
  content?: string;
  mood: number;
  selections?: Selection[];
  media?: Media[];
}

interface HistoryListProps {
  entries: Entry[];
  loading: boolean;
  error?: string;
  onDelete: (id: number) => void;
  onEdit?: (entry: Entry) => void;
}

const HistoryList = ({ entries, loading, error, onDelete, onEdit }: HistoryListProps) => {
  const containerStyle: CSSProperties = {
    textAlign: 'left',
    padding: '1rem 0'
  };

  const skeletonHeaderStyle: CSSProperties = {
    marginBottom: 12
  };

  const errorStyle: CSSProperties = {
    textAlign: 'center',
    color: 'var(--accent-600)',
    padding: '2rem'
  };

  const emptyContainerStyle: CSSProperties = {
    textAlign: 'left',
    marginTop: 0
  };

  if (loading) {
    return (
      <div style={containerStyle}>
        <Skeleton height={28} width={220} style={skeletonHeaderStyle} />
        <div className="card-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i}>
              <Skeleton height={220} radius={16} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={errorStyle}>
        {error}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div style={emptyContainerStyle}>
        <div className="card-grid">
          <AddEntryCard />
          <div className="col-span-full">
            <EmptyState
              variant="noHistory"
              actionLabel="Create Entry"
              onAction={() => document.getElementById('fab-main-button')?.click()}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={emptyContainerStyle}>
      <div className="card-grid">
        <AddEntryCard />
        {entries.map(entry => (
          <HistoryEntry
            key={entry.id || entry.date}
            entry={entry}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        ))}
      </div>
    </div>
  );
};

export default HistoryList;
