import { LucideIcon } from 'lucide-react';
import {
  Activity,
  Gamepad2,
  BookOpen,
  Coffee,
  Dumbbell,
  Music,
  Briefcase,
  Users,
  Code,
  Utensils,
  Plane,
  Home,
  Sun,
  Moon,
  CloudRain,
  Heart,
  Smile,
  Zap,
  Tv,
  ShoppingBag,
  Car,
  Bike
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ========== Types ==========

interface IconItem {
  name: string;
  component: LucideIcon;
  label: string;
}

interface IconPickerProps {
  onSelect: (iconName: string) => void;
  selectedIcon: string | null;
}

// ========== Data ==========

const ICON_LIST: IconItem[] = [
  { name: 'Activity', component: Activity, label: 'Activity' },
  { name: 'Gamepad2', component: Gamepad2, label: 'Gaming' },
  { name: 'BookOpen', component: BookOpen, label: 'Reading' },
  { name: 'Coffee', component: Coffee, label: 'Coffee' },
  { name: 'Dumbbell', component: Dumbbell, label: 'Exercise' },
  { name: 'Music', component: Music, label: 'Music' },
  { name: 'Briefcase', component: Briefcase, label: 'Work' },
  { name: 'Users', component: Users, label: 'Social' },
  { name: 'Code', component: Code, label: 'Coding' },
  { name: 'Utensils', component: Utensils, label: 'Food' },
  { name: 'Plane', component: Plane, label: 'Travel' },
  { name: 'Home', component: Home, label: 'Home' },
  { name: 'Sun', component: Sun, label: 'Day' },
  { name: 'Moon', component: Moon, label: 'Night' },
  { name: 'CloudRain', component: CloudRain, label: 'Rain' },
  { name: 'Heart', component: Heart, label: 'Love' },
  { name: 'Smile', component: Smile, label: 'Happy' },
  { name: 'Zap', component: Zap, label: 'Energy' },
  { name: 'Tv', component: Tv, label: 'Movies/TV' },
  { name: 'ShoppingBag', component: ShoppingBag, label: 'Shopping' },
  { name: 'Car', component: Car, label: 'Drive' },
  { name: 'Bike', component: Bike, label: 'Cycling' }
];

// Create Map for O(1) lookup
const ICON_MAP = new Map(ICON_LIST.map(i => [i.name, i.component]));

// ========== Component ==========

const IconPicker = ({ onSelect, selectedIcon }: IconPickerProps) => {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(44px,1fr))] gap-2 p-2 max-h-[200px] overflow-y-auto">
      {ICON_LIST.map((item) => {
        const Icon = item.component;
        const isSelected = selectedIcon === item.name;
        return (
          <button
            key={item.name}
            type="button"
            onClick={() => onSelect(item.name)}
            aria-label={item.label}
            title={item.label}
              className={cn(
                "grid place-items-center w-11 h-11 rounded-lg cursor-pointer p-0 transition-[colors,transform] duration-200",
                isSelected
                ? "bg-accent-bg text-[color:var(--primary-foreground)] border-none"
                : "bg-card text-foreground border border-border hover:bg-muted"
              )}
            >
            <Icon size={20} aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
};

// ========== Utilities ==========

export const getIconComponent = (iconName: string): LucideIcon | null => {
  if (!iconName) return null;
  return ICON_MAP.get(iconName) ?? null;
};

export default IconPicker;
