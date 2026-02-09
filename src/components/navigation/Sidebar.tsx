import { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { DASHBOARD_NAV_ITEMS } from '@/constants/navigation';

interface SidebarProps {
  onLoadStatistics?: () => void;
}

const Sidebar = ({ onLoadStatistics }: SidebarProps) => {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname.includes('discover') && typeof onLoadStatistics === 'function') {
      onLoadStatistics();
    }
  }, [location.pathname, onLoadStatistics]);

  return (
    <aside className="fixed left-0 top-0 h-full w-64 xl:w-72 2xl:w-80 border-r border-border/70 bg-card/85 backdrop-blur hidden md:flex flex-col z-30">
      <div className="flex flex-col h-full p-4">
        {/* Brand */}
        <div className="flex items-center gap-3 px-2 mb-8 mt-2">
          <div className="w-9 h-9 rounded-[calc(var(--radius)-6px)] bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
            <img
              src="/logo.png"
              alt="Twilightio"
              width={36}
              height={36}
              className="w-full h-full object-contain p-1"
            />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold leading-none tracking-tight">Twilightio</h1>
            <span className="text-[10px] text-muted-foreground font-medium">Daily Reflection Companion</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1">
          {DASHBOARD_NAV_ITEMS.map(({ route, fullLabel, icon: Icon, end }) => (
            <NavLink
              key={route}
              to={route}
              end={end}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-[calc(var(--radius)-6px)] text-sm font-medium transition-all group relative",
                isActive
                  ? "bg-primary/90 text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              )}
            >
              <Icon size={18} aria-hidden="true" />
              <span>{fullLabel}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
