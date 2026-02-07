import { LucideIcon, PlusCircle, Sparkles, FolderOpen, List, Camera, Target, Calendar, Heart } from 'lucide-react';
import { Button } from './button';

type IconName = 'sparkles' | 'folder' | 'list' | 'plus' | 'camera' | 'target' | 'calendar' | 'heart';
type EmptyStateVariant = 'default' | 'firstEntry' | 'noEntriesThisWeek' | 'noPhotos' | 'noGoals' | 'noHistory' | 'noStats' | 'emptyFolder';

interface EmptyStateVariantConfig {
  title: string;
  message: string;
  icon: LucideIcon;
}

interface EmptyStateProps {
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: IconName | LucideIcon;
  variant?: EmptyStateVariant;
}

const EMPTY_STATE_VARIANTS: Record<EmptyStateVariant, EmptyStateVariantConfig> = {
  default: {
    title: "Nothing here yet",
    message: "Time to start something new! ✨",
    icon: Sparkles
  },
  firstEntry: {
    title: "Your first entry!",
    message: "Let's make some history! This is where your journey begins. 🌟",
    icon: Sparkles
  },
  noEntriesThisWeek: {
    title: "A fresh week awaits",
    message: "What will you feel first? Every moment is a new beginning. 🌱",
    icon: Calendar
  },
  noPhotos: {
    title: "Gallery is empty",
    message: "Capture a moment today! Photos bring entries to life. 📸",
    icon: Camera
  },
  noGoals: {
    title: "No goals yet",
    message: "Set an intention for tomorrow! Small steps lead to big changes. 🎯",
    icon: Target
  },
  noHistory: {
    title: "Your story starts here",
    message: "Every great journey begins with a single step. Start logging! 📖",
    icon: Heart
  },
  noStats: {
    title: "Not enough data yet",
    message: "Keep journaling! Insights appear after a few entries. 📊",
    icon: List
  },
  emptyFolder: {
    title: "This folder is empty",
    message: "Add some items to get started!",
    icon: FolderOpen
  }
};

const EmptyState = ({
  title,
  message,
  actionLabel,
  onAction,
  icon = "sparkles",
  variant = "default"
}: EmptyStateProps) => {
  const variantConfig = EMPTY_STATE_VARIANTS[variant] || EMPTY_STATE_VARIANTS.default;
  const finalTitle = title || variantConfig.title;
  const finalMessage = message || variantConfig.message;

  const getIcon = (): LucideIcon => {
    if (typeof icon !== 'string') return icon;
    switch (icon) {
      case 'sparkles': return variantConfig.icon || Sparkles;
      case 'folder': return FolderOpen;
      case 'list': return List;
      case 'plus': return PlusCircle;
      case 'camera': return Camera;
      case 'target': return Target;
      case 'calendar': return Calendar;
      case 'heart': return Heart;
      default: return variantConfig.icon || Sparkles;
    }
  };

  const IconComponent = getIcon();

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center rounded-2xl bg-muted/50 border border-dashed border-border w-full min-h-[200px] animate-in fade-in duration-300">
      <div className="w-16 h-16 mb-4 rounded-full bg-accent flex items-center justify-center text-accent-foreground">
        <IconComponent size={32} />
      </div>

      <h3 className="text-xl font-bold text-foreground mb-2">
        {finalTitle}
      </h3>

      <p className="text-muted-foreground max-w-xs mb-6 mx-auto">
        {finalMessage}
      </p>

      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          className="flex items-center gap-2 rounded-full shadow-md"
        >
          <PlusCircle size={18} />
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
