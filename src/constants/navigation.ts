import { Home, BarChart3, Trophy, Settings, Target, LucideIcon } from 'lucide-react';

export interface AppNavItem {
  route: string;
  fullLabel: string;
  shortLabel: string;
  icon: LucideIcon;
  end?: boolean;
}

export const DASHBOARD_NAV_ITEMS: AppNavItem[] = [
  { route: '/dashboard', fullLabel: 'Home', shortLabel: 'Home', icon: Home, end: true },
  { route: '/dashboard/goals', fullLabel: 'Goals', shortLabel: 'Goals', icon: Target },
  { route: '/dashboard/stats', fullLabel: 'Statistics', shortLabel: 'Stats', icon: BarChart3 },
  { route: '/dashboard/achievements', fullLabel: 'Achievements', shortLabel: 'Achievements', icon: Trophy },
];

export const SETTINGS_NAV_ITEM: AppNavItem = {
  route: '/dashboard/settings',
  fullLabel: 'Settings',
  shortLabel: 'Settings',
  icon: Settings,
};
