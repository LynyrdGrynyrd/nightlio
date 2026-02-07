import { type ComponentType, useMemo } from 'react';
import { BarChart3, CalendarPlus2, CheckCircle2, Home, Search, Target, Trophy } from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '../ui/command';

interface DesktopCommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenDashboard: () => void;
  onOpenSearch: () => void;
  onOpenEntry: () => void;
  onOpenGoals: () => void;
  onOpenStats: () => void;
  onOpenAchievements: () => void;
  onCompleteGoal: () => void;
}

interface CommandAction {
  id: string;
  group: 'Navigation' | 'Actions';
  label: string;
  hint: string;
  keywords: string;
  shortcut: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  onSelect: () => void;
}

const DesktopCommandPalette = ({
  open,
  onOpenChange,
  onOpenDashboard,
  onOpenSearch,
  onOpenEntry,
  onOpenGoals,
  onOpenStats,
  onOpenAchievements,
  onCompleteGoal,
}: DesktopCommandPaletteProps) => {
  const actions = useMemo<CommandAction[]>(
    () => [
      {
        id: 'nav-dashboard',
        group: 'Navigation',
        label: 'Go to Dashboard',
        hint: 'Return to your daily home view',
        keywords: 'home dashboard overview',
        shortcut: '⌘K',
        icon: Home,
        onSelect: onOpenDashboard,
      },
      {
        id: 'nav-search',
        group: 'Navigation',
        label: 'Search Entries',
        hint: 'Open global search with filters',
        keywords: 'search find query entries',
        shortcut: '/',
        icon: Search,
        onSelect: onOpenSearch,
      },
      {
        id: 'nav-achievements',
        group: 'Navigation',
        label: 'Go to Achievements',
        hint: 'Review progress and rewards',
        keywords: 'achievements awards rewards unlocks',
        shortcut: 'A',
        icon: Trophy,
        onSelect: onOpenAchievements,
      },
      {
        id: 'entry-new',
        group: 'Actions',
        label: 'New Entry',
        hint: 'Capture your mood now',
        keywords: 'new entry check in mood',
        shortcut: 'C',
        icon: CalendarPlus2,
        onSelect: onOpenEntry,
      },
      {
        id: 'goal-open',
        group: 'Actions',
        label: 'Open Goals',
        hint: 'View and manage active goals',
        keywords: 'goals habits tasks',
        shortcut: 'G',
        icon: Target,
        onSelect: onOpenGoals,
      },
      {
        id: 'goal-complete',
        group: 'Actions',
        label: 'Complete Priority Goal',
        hint: 'Mark your closest goal complete',
        keywords: 'complete goal done progress quick',
        shortcut: '⇧G',
        icon: CheckCircle2,
        onSelect: onCompleteGoal,
      },
      {
        id: 'stats-open',
        group: 'Actions',
        label: 'Open Statistics',
        hint: 'Review trends and analytics',
        keywords: 'stats analytics trends charts',
        shortcut: 'S',
        icon: BarChart3,
        onSelect: onOpenStats,
      },
    ],
    [
      onCompleteGoal,
      onOpenAchievements,
      onOpenDashboard,
      onOpenEntry,
      onOpenGoals,
      onOpenSearch,
      onOpenStats,
    ]
  );

  const handleSelect = (action: CommandAction) => {
    onOpenChange(false);
    action.onSelect();
  };

  const navigationActions = actions.filter((action) => action.group === 'Navigation');
  const quickActions = actions.filter((action) => action.group === 'Actions');

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search commands..." />
      <CommandList>
        <CommandEmpty>No matching commands.</CommandEmpty>

        <CommandGroup heading="Navigation">
          {navigationActions.map((action) => {
            const Icon = action.icon;
            return (
              <CommandItem
                key={action.id}
                keywords={[action.keywords]}
                value={`${action.label} ${action.keywords}`}
                onSelect={() => handleSelect(action)}
                className="items-start py-2.5"
              >
                <Icon size={16} className="mt-0.5" />
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium leading-tight">{action.label}</span>
                  <span className="text-xs text-muted-foreground leading-tight">{action.hint}</span>
                </div>
                <CommandShortcut>{action.shortcut}</CommandShortcut>
              </CommandItem>
            );
          })}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Quick Actions">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <CommandItem
                key={action.id}
                keywords={[action.keywords]}
                value={`${action.label} ${action.keywords}`}
                onSelect={() => handleSelect(action)}
                className="items-start py-2.5"
              >
                <Icon size={16} className="mt-0.5" />
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium leading-tight">{action.label}</span>
                  <span className="text-xs text-muted-foreground leading-tight">{action.hint}</span>
                </div>
                <CommandShortcut>{action.shortcut}</CommandShortcut>
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};

export default DesktopCommandPalette;
