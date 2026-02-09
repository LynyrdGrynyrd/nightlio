import { LucideIcon, PlusCircle, Sparkles, FolderOpen, List, Camera, Target, Calendar, Heart } from 'lucide-react';
import { Button } from './button';
import WellnessIllustration, { WellnessIllustrationVariant } from './WellnessIllustration';

type IconName = 'sparkles' | 'folder' | 'list' | 'plus' | 'camera' | 'target' | 'calendar' | 'heart';
type EmptyStateVariant = 'default' | 'firstEntry' | 'noEntriesThisWeek' | 'noPhotos' | 'noGoals' | 'noHistory' | 'noStats' | 'emptyFolder';

interface EmptyStateVariantConfig {
  title: string;
  message: string;
  icon: LucideIcon;
  illustration: WellnessIllustrationVariant;
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
    title: "A quiet space for something new",
    message: "When you are ready, begin with one small check-in.",
    icon: Sparkles,
    illustration: 'sparkles',
  },
  firstEntry: {
    title: "Your first entry is waiting",
    message: "Capture today in a few words and your story begins from here.",
    icon: Sparkles,
    illustration: 'journey',
  },
  noEntriesThisWeek: {
    title: "A fresh week to listen inward",
    message: "One entry is enough to re-open your rhythm.",
    icon: Calendar,
    illustration: 'calendar',
  },
  noPhotos: {
    title: "No photos yet",
    message: "Add a small visual memory when a moment feels meaningful.",
    icon: Camera,
    illustration: 'photos',
  },
  noGoals: {
    title: "No intentions set yet",
    message: "Set one gentle goal to support tomorrow's mood.",
    icon: Target,
    illustration: 'goals',
  },
  noHistory: {
    title: "Your journal opens here",
    message: "A short reflection today can become a meaningful pattern over time.",
    icon: Heart,
    illustration: 'journey',
  },
  noStats: {
    title: "Insights need a little more time",
    message: "Keep checking in and your mood landscape will begin to take shape.",
    icon: List,
    illustration: 'insights',
  },
  emptyFolder: {
    title: "This folder is empty",
    message: "Add some items to get started!",
    icon: FolderOpen,
    illustration: 'folder',
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
    <div className="flex flex-col items-center justify-center p-8 text-center rounded-[calc(var(--radius)+6px)] bg-muted/40 border border-dashed border-border w-full min-h-[240px] animate-in fade-in duration-300">
      <WellnessIllustration variant={variantConfig.illustration} className="mb-5" />
      <div className="w-12 h-12 mb-3 rounded-full bg-accent/60 flex items-center justify-center text-accent-foreground border border-border/60 shadow-sm">
        <IconComponent size={20} />
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
