import { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { DASHBOARD_NAV_ITEMS } from '@/constants/navigation';

interface BottomNavProps {
  onLoadStatistics?: () => void;
}

const BottomNav = ({ onLoadStatistics }: BottomNavProps) => {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname.includes('discover') && typeof onLoadStatistics === 'function') {
      onLoadStatistics();
    }
  }, [location.pathname, onLoadStatistics]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-card/92 backdrop-blur border-t border-border/70 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-16 px-1">
        {DASHBOARD_NAV_ITEMS.map(({ route, shortLabel, fullLabel, icon: Icon, end }) => (
          <NavLink
            key={route}
            to={route}
            end={end}
            className={({ isActive }) => cn(
              "flex flex-col items-center justify-center flex-1 h-full gap-0.5 text-xs font-medium transition-colors rounded-[calc(var(--radius)-8px)] mx-0.5",
              isActive
                ? "text-primary bg-primary/10"
                : "text-muted-foreground hover:text-foreground"
            )}
            aria-label={fullLabel}
          >
            <Icon size={20} className="shrink-0" aria-hidden="true" />
            <span className="text-[10px] leading-none max-w-[60px] truncate">{shortLabel}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
