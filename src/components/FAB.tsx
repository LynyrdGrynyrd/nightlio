import { useState, useEffect, useRef } from 'react';
import { Plus, X, CalendarPlus, ArrowLeft, Calendar, Target, Star, LucideIcon } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import './FAB.css';

// ========== Types ==========

interface FABOption {
  label: string;
  icon: LucideIcon;
  action: () => void;
}

type ContextType = 'dashboard' | 'stats' | 'goals';

interface SmartFABProps {
  onCreateEntry?: () => void;
  onCreateEntryForDate?: (date: string) => void;
}

interface FABProps {
  onClick: () => void;
  label?: string;
}

// ========== Smart FAB Component ==========

const SmartFAB = ({ onCreateEntry, onCreateEntryForDate }: SmartFABProps) => {
  const [expanded, setExpanded] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const fabRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (fabRef.current && !fabRef.current.contains(e.target as Node)) {
        setExpanded(false);
      }
    };
    if (expanded) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [expanded]);

  // Get context based on current path
  const getContext = (): ContextType => {
    const path = location.pathname;
    if (path.includes('/stats')) return 'stats';
    if (path.includes('/goals')) return 'goals';
    return 'dashboard';
  };

  const context = getContext();

  // Calculate yesterday's date
  const getYesterdayDate = (): string => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  };

  // Context-specific options
  const options: Record<ContextType, FABOption[]> = {
    dashboard: [
      {
        label: 'Yesterday',
        icon: ArrowLeft,
        action: () => {
          if (onCreateEntryForDate) onCreateEntryForDate(getYesterdayDate());
          setExpanded(false);
        }
      },
      {
        label: 'Today',
        icon: Calendar,
        action: () => {
          if (onCreateEntry) onCreateEntry();
          setExpanded(false);
        }
      },
      {
        label: 'Other day',
        icon: CalendarPlus,
        action: () => {
          // Navigate to stats which has the calendar for date picking
          navigate('/dashboard/stats');
          setExpanded(false);
        }
      },
    ],
    stats: [
      {
        label: 'New Goal',
        icon: Target,
        action: () => {
          navigate('/dashboard/goals');
          setExpanded(false);
        }
      },
      {
        label: 'Important Day',
        icon: Star,
        action: () => {
          navigate('/dashboard/stats', { state: { openImportantDayForm: true } });
          setExpanded(false);
        }
      },
      {
        label: 'New Entry',
        icon: Plus,
        action: () => {
          if (onCreateEntry) onCreateEntry();
          setExpanded(false);
        }
      },
    ],
    goals: [
      {
        label: 'New Entry',
        icon: Plus,
        action: () => {
          if (onCreateEntry) onCreateEntry();
          setExpanded(false);
        }
      },
    ],
  };

  const currentOptions = options[context] || options.dashboard;

  const handleMainClick = () => {
    if (currentOptions.length === 1) {
      // Direct action if only one option
      currentOptions[0].action();
    } else {
      setExpanded(!expanded);
    }
  };

  return (
    <div className="smart-fab" ref={fabRef}>
      {expanded && (
        <div className="smart-fab__menu">
          {currentOptions.map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.label}
                className="smart-fab__option"
                onClick={opt.action}
              >
                <Icon size={18} />
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      )}
      <button
        className="smart-fab__main"
        onClick={handleMainClick}
        aria-label={expanded ? 'Close menu' : 'Open actions'}
        aria-expanded={expanded}
      >
        {expanded ? <X size={24} /> : <Plus size={24} />}
      </button>
    </div>
  );
};

// ========== Simple FAB Component ==========

const FAB = ({ onClick, label = 'New Entry' }: FABProps) => {
  return (
    <button className="fab" onClick={onClick} aria-label={label} title={label}>
      <Plus size={24} />
    </button>
  );
};

// ========== Exports ==========

export { SmartFAB };
export default FAB;
