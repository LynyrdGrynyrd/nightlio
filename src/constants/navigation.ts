import { Sun, BookOpen, Compass, LucideIcon } from 'lucide-react';

export interface AppNavItem {
  route: string;
  fullLabel: string;
  shortLabel: string;
  icon: LucideIcon;
  end?: boolean;
}

export const DASHBOARD_NAV_ITEMS: AppNavItem[] = [
  { route: '/dashboard', fullLabel: 'Check-In', shortLabel: 'Check-In', icon: Sun, end: true },
  { route: '/dashboard/journal', fullLabel: 'Journal', shortLabel: 'Journal', icon: BookOpen },
  { route: '/dashboard/discover', fullLabel: 'Insights', shortLabel: 'Insights', icon: Compass },
];
