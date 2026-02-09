import type { ComponentType } from 'react';
import type { HistoryEntry } from './entry';

export interface DashboardHomeProps {
  pastEntries: HistoryEntry[];
  historyLoading: boolean;
  historyError: string | null;
  currentStreak: number;
  onMoodSelect: (mood: number) => void;
  onDelete: (id: number) => void;
  onEdit: (entry: HistoryEntry) => void;
  onNavigateToEntry: () => void;
  onNavigateToJournal: () => void;
  onNavigateToDiscover: () => void;
}

export interface ProgressPrompt {
  id: string;
  label: string;
  current: number;
  target: number;
  percent: number;
}

export interface RecentDaySnapshot {
  iso: string;
  label: string;
  hasEntry: boolean;
  mood: number | null;
  isToday: boolean;
}

export interface DashboardRecentStats {
  todayEntry: HistoryEntry | null;
  avgMood: number | null;
  completionRate: number;
  weekCount: number;
  recentDays: RecentDaySnapshot[];
}

export interface ActionItem {
  id: string;
  title: string;
  description: string;
  cta: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  onClick: () => void;
  tone: 'warning' | 'default';
}

export const ONE_DAY_MS = 24 * 60 * 60 * 1000;
export const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100, 180, 365] as const;
export const STREAK_CELEBRATION_STORAGE_KEY = 'twilightio:last-streak-celebration';
