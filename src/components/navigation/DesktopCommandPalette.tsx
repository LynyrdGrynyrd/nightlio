import { type ComponentType, useMemo } from 'react';
import { BookOpen, CalendarPlus2, CheckCircle2, Compass, Search, Settings, Sun } from 'lucide-react';
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
  onOpenToday: () => void;
  onOpenSearch: () => void;
  onOpenEntry: () => void;
  onOpenJournal: () => void;
  onOpenDiscover: () => void;
  onOpenSettings: () => void;
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
  onOpenToday,
  onOpenSearch,
  onOpenEntry,
  onOpenJournal,
  onOpenDiscover,
  onOpenSettings,
  onCompleteGoal,
}: DesktopCommandPaletteProps) => {
  const actions = useMemo<CommandAction[]>(
    () => [
      {
        id: 'nav-today',
        group: 'Navigation',
        label: 'Go to Today',
        hint: 'Return to your daily home view',
        keywords: 'home dashboard today overview',
        shortcut: '⌘K',
        icon: Sun,
        onSelect: onOpenToday,
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
        id: 'nav-journal',
        group: 'Navigation',
        label: 'Go to Journal',
        hint: 'Browse all entries and photos',
        keywords: 'journal history entries browse photos gallery',
        shortcut: 'J',
        icon: BookOpen,
        onSelect: onOpenJournal,
      },
      {
        id: 'nav-discover',
        group: 'Navigation',
        label: 'Go to Discover',
        hint: 'Analytics, insights, and achievements',
        keywords: 'discover stats analytics trends charts achievements rewards',
        shortcut: 'D',
        icon: Compass,
        onSelect: onOpenDiscover,
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
        id: 'nav-settings',
        group: 'Actions',
        label: 'Settings',
        hint: 'Manage your preferences',
        keywords: 'settings preferences config theme',
        shortcut: '',
        icon: Settings,
        onSelect: onOpenSettings,
      },
    ],
    [
      onCompleteGoal,
      onOpenDiscover,
      onOpenEntry,
      onOpenJournal,
      onOpenSearch,
      onOpenSettings,
      onOpenToday,
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
                {action.shortcut && <CommandShortcut>{action.shortcut}</CommandShortcut>}
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
                {action.shortcut && <CommandShortcut>{action.shortcut}</CommandShortcut>}
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};

export default DesktopCommandPalette;
