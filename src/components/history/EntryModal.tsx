import { useEffect, CSSProperties, MouseEvent } from 'react';
import ReactMarkdown from 'react-markdown';
import { getIconComponent } from '../ui/IconPicker';

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

interface EntryModalProps {
  isOpen: boolean;
  entry: Entry | null;
  onClose: () => void;
  onDelete?: () => void;
  isDeleting?: boolean;
  onEdit?: () => void;
}

const backdropStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 100,
};

const panelStyle: CSSProperties = {
  width: 'min(820px, 92vw)',
  maxHeight: '85vh',
  overflow: 'auto',
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: '14px',
  boxShadow: 'var(--shadow-lg)',
  padding: '20px',
};

const deriveTitleBody = (content = '') => {
  const text = (content || '').replace(/\r\n/g, '\n').trim();
  if (!text) return { title: '', body: '' };
  const lines = text.split('\n');
  const first = (lines[0] || '').trim();
  // If first line is a markdown heading like # Title
  const heading = first.match(/^#{1,6}\s+(.+?)\s*$/);
  if (heading) {
    return { title: heading[1].trim(), body: lines.slice(1).join('\n').trim() };
  }
  // Otherwise, multi-line: first line as title, remainder as body
  if (lines.length > 1) {
    return { title: first, body: lines.slice(1).join('\n').trim() };
  }
  // Single-line content; split at first space into title + body
  const idx = first.indexOf(' ');
  if (idx > 0) {
    return { title: first.slice(0, idx).trim(), body: first.slice(idx + 1).trim() };
  }
  // Single word only
  return { title: first, body: '' };
};

const EntryModal = ({ isOpen, entry, onClose, onDelete, isDeleting, onEdit }: EntryModalProps) => {
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        if (typeof onClose === 'function') onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !entry) return null;

  const onBackdrop = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const { title, body } = deriveTitleBody(entry.content);

  const headerStyle: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12
  };

  const dateContainerStyle: CSSProperties = {
    minWidth: 0
  };

  const dateStyle: CSSProperties = {
    fontWeight: 600,
    color: 'var(--text)'
  };

  const timeStyle: CSSProperties = {
    fontSize: '0.85rem',
    color: 'color-mix(in oklab, var(--text), transparent 30%)'
  };

  const buttonsStyle: CSSProperties = {
    display: 'flex',
    gap: 8
  };

  const editButtonStyle: CSSProperties = {
    background: 'var(--accent-bg)',
    color: '#fff',
    border: '1px solid var(--accent-bg)',
    borderRadius: 10,
    padding: '8px 12px',
    fontWeight: 600,
    boxShadow: 'var(--shadow-sm)'
  };

  const deleteButtonStyle: CSSProperties = {
    background: 'var(--danger)',
    color: '#fff',
    border: '1px solid var(--danger)',
    borderRadius: 10,
    padding: '8px 12px',
    fontWeight: 600,
    boxShadow: 'var(--shadow-sm)'
  };

  const titleContainerStyle: CSSProperties = {
    marginBottom: 8
  };

  const titleHeadingStyle: CSSProperties = {
    margin: 0
  };

  const tagsContainerStyle: CSSProperties = {
    marginBottom: 12
  };

  const tagStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  };

  const mediaGridStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: '12px',
    marginBottom: '20px'
  };

  const mediaLinkStyle: CSSProperties = {
    borderRadius: '12px',
    overflow: 'hidden',
    border: '1px solid var(--border)',
    display: 'block'
  };

  const mediaImageStyle: CSSProperties = {
    width: '100%',
    aspectRatio: '1/1',
    objectFit: 'cover',
    display: 'block'
  };

  return (
    <div style={backdropStyle} onClick={onBackdrop} role="dialog" aria-modal="true">
      <div style={panelStyle}>
        <div style={headerStyle}>
          <div style={dateContainerStyle}>
            <div style={dateStyle}>{entry.date}</div>
            {entry.created_at && (
              <div style={timeStyle}>
                {new Date(entry.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
          </div>
          <div style={buttonsStyle}>
            {onEdit && (
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(); }}
                disabled={isDeleting}
                style={editButtonStyle}
                aria-label="Edit entry"
              >
                Edit
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                disabled={isDeleting}
                style={deleteButtonStyle}
                aria-label="Delete entry"
              >
                {isDeleting ? 'Deleting…' : 'Delete'}
              </button>
            )}
          </div>
        </div>
        {title && (
          <div className="history-markdown" style={titleContainerStyle}>
            <h1 style={titleHeadingStyle}>{title}</h1>
          </div>
        )}
        {entry.selections && entry.selections.length > 0 && (
          <div className="tag-list" style={tagsContainerStyle}>
            {entry.selections.map((s) => {
              const Icon = getIconComponent(s.icon);
              return (
                <span key={s.id} className="tag" style={tagStyle}>
                  {Icon && <Icon size={12} />}
                  {s.name}
                </span>
              );
            })}
          </div>
        )}

        {entry.media && entry.media.length > 0 && (
          <div style={mediaGridStyle}>
            {entry.media.map(media => (
              <a
                key={media.id}
                href={`/api/media/${media.file_path}`}
                target="_blank"
                rel="noopener noreferrer"
                style={mediaLinkStyle}
              >
                <img
                  src={`/api/media/${media.file_path}`}
                  alt="Attachment"
                  style={mediaImageStyle}
                />
              </a>
            ))}
          </div>
        )}

        <div className="history-markdown">
          <ReactMarkdown>{body}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export default EntryModal;
