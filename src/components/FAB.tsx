import { useState, useRef, useEffect } from 'react';
import { Plus, CalendarPlus, ArrowLeft, Calendar, Target, Star, LucideIcon } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

interface FABOption {
  label: string;
  icon: LucideIcon;
  action: () => void;
  color?: string;
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
  const prefersReducedMotion = useReducedMotion();

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
        label: 'Other day',
        icon: CalendarPlus,
        action: () => {
          navigate('/dashboard/stats');
          setExpanded(false);
        }
      },
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
        },
        color: 'bg-primary text-primary-foreground'
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
        },
        color: 'bg-primary text-primary-foreground'
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
    <div className="fixed bottom-20 right-6 z-50 flex flex-col items-end gap-3 pb-[env(safe-area-inset-bottom)] touch-manipulation" ref={fabRef}>
      <AnimatePresence>
        {expanded && (
          <div className="flex flex-col items-end gap-3 mb-2">
            {currentOptions.map((opt, idx) => {
              const Icon = opt.icon;
              return (
                <motion.div
                  key={opt.label}
                  initial={prefersReducedMotion ? {} : { opacity: 0, y: 10, scale: 0.8 }}
                  animate={prefersReducedMotion ? {} : { opacity: 1, y: 0, scale: 1 }}
                  exit={prefersReducedMotion ? {} : { opacity: 0, y: 10, scale: 0.8 }}
                  transition={prefersReducedMotion ? {} : { duration: 0.15, delay: idx * 0.05 }}
                  className="flex items-center gap-3"
                >
                  <span className="text-sm font-medium bg-background/80 backdrop-blur-sm px-2 py-1 rounded shadow-sm text-foreground">
                    {opt.label}
                  </span>
                  <Button
                    size="icon"
                    variant="secondary"
                    className={cn("h-12 w-12 rounded-full shadow-lg hover:scale-105 transition-transform", opt.color)}
                    onClick={opt.action}
                    aria-label={opt.label}
                  >
                    <Icon size={20} aria-hidden="true" />
                  </Button>
                </motion.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>

      <Button
        size="icon"
        className={cn(
          "h-14 w-14 rounded-full shadow-xl transition-all duration-300",
          expanded ? "rotate-45" : "hover:scale-105"
        )}
        onClick={handleMainClick}
        aria-label={expanded ? "Close menu" : "Open actions menu"}
        aria-expanded={expanded}
      >
        <Plus size={expanded ? 28 : 24} aria-hidden="true" />
      </Button>
    </div>
  );
};

export { SmartFAB };

const FAB = ({ onClick, label = 'New Entry' }: FABProps) => {
  return (
    <div className="fixed bottom-20 right-6 z-50 pb-[env(safe-area-inset-bottom)] touch-manipulation">
      <Button
        size="icon"
        className="h-14 w-14 rounded-full shadow-xl hover:scale-105 transition-transform"
        onClick={onClick}
        title={label}
        aria-label={label}
      >
        <Plus size={24} />
      </Button>
    </div>
  );
};

export default FAB;
