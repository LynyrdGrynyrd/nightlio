import { Home, BarChart3, Trophy, Settings, Target, LucideIcon } from 'lucide-react';
import { useEffect, CSSProperties } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

interface SidebarProps {
  onLoadStatistics?: () => void;
}

interface NavItem {
  key: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

const Sidebar = ({ onLoadStatistics }: SidebarProps) => {
  const items: NavItem[] = [
    { key: '.', label: 'Home', icon: Home, end: true },
    { key: 'goals', label: 'Goals', icon: Target },
    { key: 'stats', label: 'Statistics', icon: BarChart3 },
    { key: 'achievements', label: 'Achievements', icon: Trophy },
  ];

  const location = useLocation();

  useEffect(() => {
    if (location.pathname.includes('stats') && typeof onLoadStatistics === 'function') {
      onLoadStatistics();
    }
  }, [location.pathname, onLoadStatistics]);

  const brandContainerStyle: CSSProperties = {
    alignItems: 'flex-start',
    flexDirection: 'column',
    gap: '0.75rem'
  };

  const brandInnerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem'
  };

  const logoContainerStyle: CSSProperties = {
    width: 36,
    height: 36,
    borderRadius: 10,
    background: 'transparent',
    display: 'grid',
    placeItems: 'center',
    color: 'var(--text)',
    overflow: 'hidden'
  };

  const logoImageStyle: CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    display: 'block',
    background: 'transparent',
    outline: 'none'
  };

  const titleStyle: CSSProperties = {
    color: 'var(--text)',
    letterSpacing: '-0.01em',
    fontSize: '1.5rem',
    fontWeight: '700'
  };

  const subtitleStyle: CSSProperties = {
    color: 'var(--text)',
    opacity: 0.85,
    fontSize: '0.875rem',
    paddingLeft: '0.25rem'
  };

  const iconStyle: CSSProperties = {
    flexShrink: 0
  };

  return (
    <aside className="sidebar">
      <div className="sidebar__inner">
        <div className="sidebar__brand" style={brandContainerStyle}>
          <div style={brandInnerStyle}>
            <div style={logoContainerStyle}>
              <img
                src="/logo.png"
                alt="Twilightio"
                style={logoImageStyle}
              />
            </div>
            <strong style={titleStyle}>Twilightio</strong>
          </div>
          <span style={subtitleStyle}>Your daily mood companion.</span>
        </div>

        <div className="sidebar__sections">
          {items.map(({ key, label, icon: Icon, end }) => (
            <NavLink
              key={key}
              to={key}
              end={end}
              className={({ isActive }) => `sidebar__item ${isActive ? 'is-active' : ''}`}
              title={label}
            >
              <Icon size={18} style={iconStyle} />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>

        <div className="sidebar__footer">
          <NavLink
            to="settings"
            className={({ isActive }) => `sidebar__item ${isActive ? 'is-active' : ''}`}
            title="Settings"
          >
            <Settings size={18} style={iconStyle} />
            <span>Settings</span>
          </NavLink>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
