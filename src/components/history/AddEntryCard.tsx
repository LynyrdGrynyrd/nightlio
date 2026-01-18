import { Plus } from 'lucide-react';
import { KeyboardEvent, CSSProperties } from 'react';

const AddEntryCard = () => {
  const handleAdd = () => {
    window.dispatchEvent(new CustomEvent('twilightio:new-entry'));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleAdd();
    }
  };

  const cardStyle: CSSProperties = {
    display: 'grid',
    placeItems: 'center',
    minHeight: 200,
    background: 'var(--accent-bg-softer)',
    borderStyle: 'dashed',
    borderColor: 'color-mix(in oklab, var(--accent-600), transparent 40%)',
    cursor: 'pointer',
    transition: 'background 0.2s, border-color 0.2s'
  };

  const contentStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    color: 'var(--accent-600)'
  };

  const iconContainerStyle: CSSProperties = {
    width: 56,
    height: 56,
    borderRadius: '50%',
    display: 'grid',
    placeItems: 'center',
    background: 'var(--accent-bg)',
    color: '#fff',
    boxShadow: 'var(--shadow-sm)'
  };

  const labelStyle: CSSProperties = {
    fontWeight: 600
  };

  return (
    <div
      className="entry-card"
      role="button"
      tabIndex={0}
      onClick={handleAdd}
      onKeyDown={handleKeyDown}
      style={cardStyle}
      aria-label="Add Entry"
      title="Add Entry"
    >
      <div style={contentStyle}>
        <div style={iconContainerStyle}>
          <Plus size={24} />
        </div>
        <div style={labelStyle}>Add Entry</div>
      </div>
    </div>
  );
};

export default AddEntryCard;
