import { getIconComponent } from '../ui/IconPicker';
import { Group } from '../../services/api';
import { cn } from '@/lib/utils';

interface ColorScheme {
  color: string;
}

interface GroupSelectorProps {
  groups: Group[];
  selectedOptions: number[];
  onOptionToggle: (optionId: number) => void;
}

// Map index to semantic theme tokens
const COLORS: ColorScheme[] = [
  { color: 'var(--mood-5)' },
  { color: 'var(--success)' },
  { color: 'var(--warning)' },
  { color: 'var(--accent-600)' },
  { color: 'var(--mood-1)' },
  { color: 'var(--mood-4)' },
  { color: 'var(--mood-2)' },
  { color: 'var(--mood-3)' },
];

const GroupSelector = ({ groups, selectedOptions, onOptionToggle }: GroupSelectorProps) => {
  if (!groups.length) return null;

  return (
    <div className="mb-8 space-y-6">
      {groups.map((group, groupIndex) => {
        const color = COLORS[groupIndex % COLORS.length];

        return (
          <div key={group.id} className="rounded-xl border bg-card p-6 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: color.color }}>
              {group.name}
            </h3>

            <div className="flex flex-wrap gap-4">
              {group.options.map(option => {
                const Icon = getIconComponent(option.icon || '');
                const isSelected = selectedOptions.includes(option.id);

                return (
                  <div key={option.id} className="flex flex-col items-center gap-2 w-14">
                    <button
                      onClick={() => onOptionToggle(option.id)}
                      title={option.name}
                      className={cn(
                        "w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm border-2",
                        isSelected
                          ? "text-[color:var(--primary-foreground)] scale-110 shadow-md"
                          : "bg-background border-border text-muted-foreground hover:border-primary/50 hover:text-foreground hover:scale-105"
                      )}
                      style={isSelected ? { backgroundColor: color.color, borderColor: color.color } : undefined}
                    >
                      {Icon && <Icon size={24} />}
                    </button>
                    <span className={cn(
                      "text-[10px] text-center w-full truncate font-medium leading-tight px-0.5",
                      isSelected ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {option.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default GroupSelector;
