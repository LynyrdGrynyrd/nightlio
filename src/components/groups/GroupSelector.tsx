import { MouseEvent, CSSProperties } from 'react';
import { getIconComponent } from '../ui/IconPicker';
import { Group } from '../../services/api';

// ========== Types ==========

interface ColorScheme {
  bg: string;
  border: string;
}

interface GroupSelectorProps {
  groups: Group[];
  selectedOptions: number[];
  onOptionToggle: (optionId: number) => void;
}

// ========== Constants ==========

const GROUP_COLORS: ColorScheme[] = [
  { bg: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', border: '#3b82f6' }, // Blue
  { bg: 'linear-gradient(135deg, #10b981, #059669)', border: '#10b981' }, // Green
  { bg: 'linear-gradient(135deg, #f59e0b, #d97706)', border: '#f59e0b' }, // Amber
  { bg: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', border: '#8b5cf6' }, // Violet
  { bg: 'linear-gradient(135deg, #ec4899, #db2777)', border: '#ec4899' }, // Pink
  { bg: 'linear-gradient(135deg, #06b6d4, #0891b2)', border: '#06b6d4' }, // Cyan
  { bg: 'linear-gradient(135deg, #f43f5e, #e11d48)', border: '#f43f5e' }, // Rose
  { bg: 'linear-gradient(135deg, #84cc16, #65a30d)', border: '#84cc16' }, // Lime
];

// ========== Component ==========

const GroupSelector = ({ groups, selectedOptions, onOptionToggle }: GroupSelectorProps) => {
  if (!groups.length) return null;

  const handleMouseEnter = (e: MouseEvent<HTMLButtonElement>, colorScheme: ColorScheme, isSelected: boolean) => {
    if (!isSelected) {
      const target = e.currentTarget;
      target.style.borderColor = colorScheme.border;
      target.style.transform = 'scale(1.05)';
      target.style.color = colorScheme.border;
    }
  };

  const handleMouseLeave = (e: MouseEvent<HTMLButtonElement>, isSelected: boolean) => {
    if (!isSelected) {
      const target = e.currentTarget;
      target.style.borderColor = 'var(--border)';
      target.style.transform = 'none';
      target.style.color = 'var(--text-muted)';
    }
  };

  const containerStyle: CSSProperties = {
    marginBottom: '2rem'
  };

  const groupStyle: CSSProperties = {
    marginBottom: '1.5rem',
    background: 'var(--bg-card)',
    borderRadius: '16px',
    padding: '1.5rem',
    boxShadow: 'var(--shadow-md)',
    border: '1px solid var(--border)',
  };

  const optionsGridStyle: CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '1rem',
  };

  const namesGridStyle: CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '1rem',
    marginTop: '0.5rem',
    fontSize: '0.7rem',
    color: 'var(--text-muted)'
  };

  return (
    <div style={containerStyle}>
      {groups.map((group, groupIndex) => {
        const colorScheme = GROUP_COLORS[groupIndex % GROUP_COLORS.length];

        const titleStyle: CSSProperties = {
          margin: '0 0 1rem 0',
          color: colorScheme.border,
          fontSize: '0.9rem',
          fontWeight: '600',
          letterSpacing: '0.5px',
          textTransform: 'uppercase',
        };

        return (
          <div key={group.id} style={groupStyle}>
            <h3 style={titleStyle}>{group.name}</h3>
            <div style={optionsGridStyle}>
              {group.options.map(option => {
                const Icon = getIconComponent(option.icon || '');
                const isSelected = selectedOptions.includes(option.id);

                const buttonStyle: CSSProperties = {
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  border: isSelected
                    ? `3px solid ${colorScheme.border}`
                    : '2px solid var(--border)',
                  background: isSelected
                    ? colorScheme.bg
                    : 'var(--surface)',
                  color: isSelected ? 'white' : 'var(--text-muted)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: isSelected
                    ? '0 4px 12px rgba(0,0,0,0.15)'
                    : 'var(--shadow-sm)',
                  transform: isSelected ? 'scale(1.1)' : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                };

                return (
                  <button
                    key={option.id}
                    onClick={() => onOptionToggle(option.id)}
                    title={option.name}
                    style={buttonStyle}
                    onMouseEnter={(e) => handleMouseEnter(e, colorScheme, isSelected)}
                    onMouseLeave={(e) => handleMouseLeave(e, isSelected)}
                  >
                    {Icon && <Icon size={24} />}
                  </button>
                );
              })}
            </div>
            <div style={namesGridStyle}>
              {group.options.map(option => (
                <span
                  key={option.id}
                  style={{
                    width: '56px',
                    textAlign: 'center',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontWeight: selectedOptions.includes(option.id) ? 600 : 400,
                    color: selectedOptions.includes(option.id) ? 'var(--text)' : 'var(--text-muted)'
                  }}
                >
                  {option.name}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default GroupSelector;
