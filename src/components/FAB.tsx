import { useState, useEffect, useRef, MouseEvent } from 'react';
import { Plus, X, CalendarPlus, ArrowLeft, Calendar, Target, Star, LucideIcon } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import './FAB.css';

interface FABOption {
  label: string;
  icon: LucideIcon;
  action: () => void;
}

type FABContext = 'dashboard' | 'stats' | 'goals';

interface SmartFABProps {
  onCreateEntry?: () => void;
  onCreateEntryForDate?: (date: string) => void;
}

interface FABProps {
  onClick: () => void;
  label?: string;
}

const SmartFAB = ({ onCreateEntry, onCreateEntryForDate }: SmartFABProps) => {
  const [expanded, setExpanded] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const fabRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (fabRef.current && !fabRef.current.contains(e.target as Node)) {
        setExpanded(false);
      }
    };
    if (expanded) {
      document.addEventListener('mousedown', handleClickOutside as any);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside as any);
  }, [expanded]);

  const getContext = (): FABContext => {
    const path = location.pathname;
    if (path.includes('/stats')) return 'stats';
    if (path.includes('/goals')) return 'goals';
    return 'dashboard';
  };

  const context = getContext();

  const getYesterdayDate = (): string => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  };

  const options: Record<FABContext, FABOption[]> = {
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

export { SmartFAB };

const FAB = ({ onClick, label = 'New Entry' }: FABProps) => {
  return (
    <button className="fab" onClick={onClick} aria-label={label} title={label}>
      <Plus size={24} />
    </button>
  );
};

export default FAB;
