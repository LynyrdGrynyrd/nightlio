import { useState, MouseEvent, CSSProperties } from 'react';
import { FileText, ChevronDown, ChevronUp } from 'lucide-react';

// ========== Types ==========

interface Template {
  id: string;
  name: string;
  icon: string;
  content: string;
}

interface TemplateSelectorProps {
  onSelectTemplate: (content: string) => void;
}

// ========== Data ==========

const DEFAULT_TEMPLATES: Template[] = [
  {
    id: 'daily-reflection',
    name: 'Daily Reflection',
    icon: '📝',
    content: `## What went well today?

## What could have been better?

## What am I grateful for?
`
  },
  {
    id: 'anxiety-checkin',
    name: 'Anxiety Check-in',
    icon: '🧠',
    content: `## Current anxiety level (1-10):

## What triggered it?

## Physical symptoms:

## Coping strategies used:
`
  },
  {
    id: 'sleep-log',
    name: 'Sleep Log',
    icon: '😴',
    content: `## Hours slept:

## Sleep quality (1-10):

## Dreams or interruptions:

## Energy level upon waking:
`
  },
  {
    id: 'gratitude',
    name: 'Gratitude Journal',
    icon: '🙏',
    content: `## Three things I'm grateful for today:
1.
2.
3.

## One person I appreciate and why:

## Something small that made me smile:
`
  },
  {
    id: 'goals',
    name: 'Goals & Progress',
    icon: '🎯',
    content: `## Today's main goal:

## Progress made:

## Obstacles encountered:

## Tomorrow's priority:
`
  }
];

// ========== Component ==========

const TemplateSelector = ({ onSelectTemplate }: TemplateSelectorProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleTemplateClick = (content: string) => {
    onSelectTemplate(content);
    setIsExpanded(false);
  };

  const handleMouseEnter = (e: MouseEvent<HTMLButtonElement>) => {
    (e.target as HTMLButtonElement).style.background = 'var(--bg)';
  };

  const handleMouseLeave = (e: MouseEvent<HTMLButtonElement>) => {
    (e.target as HTMLButtonElement).style.background = 'transparent';
  };

  const toggleStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 0.75rem',
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    color: 'var(--text-muted)',
    fontSize: '0.875rem',
    cursor: 'pointer',
    transition: 'all 0.2s'
  };

  const dropdownStyle: CSSProperties = {
    position: 'absolute',
    zIndex: 10,
    marginTop: '0.5rem',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    boxShadow: 'var(--shadow-lg)',
    padding: '0.5rem',
    minWidth: '220px',
    maxWidth: '300px'
  };

  const buttonStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    width: '100%',
    padding: '0.75rem',
    background: 'transparent',
    border: 'none',
    borderRadius: '8px',
    textAlign: 'left',
    cursor: 'pointer',
    color: 'var(--text)',
    transition: 'background 0.15s'
  };

  return (
    <div className="template-selector">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="template-toggle"
        style={toggleStyle}
      >
        <FileText size={16} />
        Load Template
        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {isExpanded && (
        <div style={dropdownStyle}>
          {DEFAULT_TEMPLATES.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => handleTemplateClick(template.content)}
              style={buttonStyle}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <span style={{ fontSize: '1.25rem' }}>{template.icon}</span>
              <span style={{ fontWeight: 500 }}>{template.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default TemplateSelector;
