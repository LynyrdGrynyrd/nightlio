import { useState, CSSProperties, KeyboardEvent } from 'react';
import { getIconComponent } from '../ui/IconPicker';
import { getMoodIcon } from '../../utils/moodUtils';
import apiService from '../../services/api';
import { useToast } from '../ui/ToastProvider';
import EntryModal from './EntryModal';

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

interface HistoryEntryProps {
  entry: Entry;
  onDelete: (id: number) => void;
  onEdit?: (entry: Entry) => void;
}

const HistoryEntry = ({ entry, onDelete, onEdit }: HistoryEntryProps) => {
  const { icon: IconComponent, color } = getMoodIcon(entry.mood);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [open, setOpen] = useState(false);

  // helpers to split title/body and strip markdown for previews
  const stripMd = (s = '') => s
    .replace(/`{1,3}[^`]*`{1,3}/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[(.*?)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^[>\-+*]\s+/gm, '')
    .replace(/[*_~`>#[\]()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const splitTitleBody = (content = '') => {
    const text = (content || '').replace(/\r\n/g, '\n').trim();
    if (!text) return { title: '', body: '' };
    const lines = text.split('\n');
    const first = (lines[0] || '').trim();
    const heading = first.match(/^#{1,6}\s+(.+?)\s*$/);
    if (heading) {
      return { title: heading[1].trim(), body: lines.slice(1).join('\n').trim() };
    }
    if (lines.length > 1) {
      return { title: first, body: lines.slice(1).join('\n').trim() };
    }
    const idx = first.indexOf(' ');
    if (idx > 0) {
      return { title: first.slice(0, idx).trim(), body: first.slice(idx + 1).trim() };
    }
    return { title: first, body: '' };
  };

  const { title: rawTitle, body: rawBody } = splitTitleBody(entry.content || '');
  const title = stripMd(rawTitle).slice(0, 80);
  const excerpt = stripMd(rawBody).slice(0, 420);

  const { show } = useToast();
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this entry?')) return false;
    setIsDeleting(true);
    try {
      await apiService.deleteMoodEntry(entry.id);
      onDelete(entry.id);
      show('Entry deleted', 'success');
      return true;
    } catch (error) {
      console.error('Failed to delete entry:', error);
      show('Failed to delete entry. Please try again.', 'error');
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  const openPreview = () => setOpen(true);
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openPreview();
    }
  };

  const handleEdit = () => {
    if (typeof onEdit === 'function') {
      onEdit(entry);
    }
  };

  const cardStyle: CSSProperties = {
    border: isHovered ? '1px solid color-mix(in oklab, var(--accent-600), transparent 55%)' : '1px solid var(--border)',
    boxShadow: isHovered ? 'var(--shadow-md)' : 'var(--shadow-sm)',
    cursor: 'pointer',
    outline: 'none'
  };

  const headerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '8px'
  };

  const iconStyle: CSSProperties = {
    color,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
    borderRadius: '50%',
    background: 'var(--accent-bg-softer)',
    border: '1px solid var(--border)'
  };

  const dateContainerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap'
  };

  const dateStyle: CSSProperties = {
    fontWeight: 700,
    color: 'var(--text)'
  };

  const separatorStyle: CSSProperties = {
    color: 'color-mix(in oklab, var(--text), transparent 40%)'
  };

  const timeStyle: CSSProperties = {
    color: 'color-mix(in oklab, var(--text), transparent 20%)'
  };

  const mediaContainerStyle: CSSProperties = {
    display: 'flex',
    gap: '4px',
    marginTop: '8px',
    overflow: 'hidden'
  };

  const mediaItemStyle: CSSProperties = {
    width: '40px',
    height: '40px',
    borderRadius: '4px',
    overflow: 'hidden',
    border: '1px solid var(--border)'
  };

  const mediaImageStyle: CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  };

  const tagsContainerStyle: CSSProperties = {
    marginTop: '0.75rem'
  };

  const tagsListStyle: CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem'
  };

  const tagStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.3rem'
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="entry-card"
      role="button"
      tabIndex={0}
      onClick={openPreview}
      onKeyDown={onKey}
      aria-label={`Open entry from ${entry.date}`}
      style={cardStyle}
    >
      {/* Header: mood icon + date • time */}
      <div style={headerStyle}>
        <span style={iconStyle}>
          <IconComponent size={18} strokeWidth={1.8} />
        </span>
        <div style={dateContainerStyle}>
          <span style={dateStyle}>{entry.date}</span>
          {entry.created_at && (
            <>
              <span aria-hidden="true" style={separatorStyle}>•</span>
              <span style={timeStyle}>
                {new Date(entry.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Title + excerpt preview */}
      <div className="entry-card__title">{title || 'Entry'}</div>
      {excerpt && (
        <div className="entry-card__excerpt">{excerpt}</div>
      )}

      {/* Photo Preview */}
      {entry.media && entry.media.length > 0 && (
        <div style={mediaContainerStyle}>
          {entry.media.map(media => (
            <div key={media.id} style={mediaItemStyle}>
              <img
                src={`/api/media/${media.file_path}`}
                alt="attachment"
                style={mediaImageStyle}
              />
            </div>
          ))}
        </div>
      )}

      {/* Tags at the bottom */}
      {entry.selections && entry.selections.length > 0 && (
        <div style={tagsContainerStyle}>
          <div style={tagsListStyle}>
            {entry.selections.map(selection => {
              const Icon = getIconComponent(selection.icon);
              return (
                <span key={selection.id} className="tag" style={tagStyle}>
                  {Icon && <Icon size={12} />}
                  {selection.name}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal for full view */}
      <EntryModal
        isOpen={open}
        entry={entry}
        onClose={() => setOpen(false)}
        onDelete={async () => {
          const ok = await handleDelete();
          if (ok) setOpen(false);
        }}
        isDeleting={isDeleting}
        onEdit={onEdit ? () => {
          setOpen(false);
          handleEdit();
        } : undefined}
      />
    </div>
  );
};

export default HistoryEntry;
