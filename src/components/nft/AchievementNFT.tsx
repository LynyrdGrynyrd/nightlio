import { CSSProperties } from 'react';
import {
  Zap,
  Flame,
  Target,
  BarChart3,
  Crown,
  Sparkles,
  Medal,
  Trophy,
  Camera,
  CheckCircle2,
  RefreshCw,
  Award,
  Star,
  Gem,
  Lock,
  LucideIcon,
} from 'lucide-react';
import ProgressBar from '../ui/ProgressBar';
import { cn } from '@/lib/utils';

export type AchievementIconKey =
  | 'Zap'
  | 'Flame'
  | 'Target'
  | 'BarChart3'
  | 'Crown'
  | 'Sparkles'
  | 'Medal'
  | 'Trophy'
  | 'Camera'
  | 'CheckCircle2'
  | 'RefreshCw'
  | 'Award'
  | 'Star'
  | 'Gem'
  | 'Lock';

interface Achievement {
  id?: number;
  name: string;
  description: string;
  icon: AchievementIconKey;
  rarity?: string;
}

interface AchievementNFTProps {
  achievement: Achievement;
  isUnlocked?: boolean;
  progressValue?: number;
  progressMax?: number;
}

interface RarityStyle {
  bg: string;
  text: string;
  border: string;
}

const ACHIEVEMENT_ICON_MAP: Record<AchievementIconKey, LucideIcon> = {
  Zap,
  Flame,
  Target,
  BarChart3,
  Crown,
  Sparkles,
  Medal,
  Trophy,
  Camera,
  CheckCircle2,
  RefreshCw,
  Award,
  Star,
  Gem,
  Lock,
};

export const isAchievementIconKey = (value: string): value is AchievementIconKey =>
  value in ACHIEVEMENT_ICON_MAP;

const AchievementNFT = ({ achievement, isUnlocked = true, progressValue, progressMax }: AchievementNFTProps) => {
  const IconComponent = ACHIEVEMENT_ICON_MAP[achievement.icon] || Zap;

  const rarityToken = (achievement.rarity || '').toLowerCase();
  const rarityStyles: Record<string, RarityStyle> = {
    legendary: { bg: 'color-mix(in oklab, gold 25%, transparent)', text: 'var(--text)', border: 'color-mix(in oklab, gold, transparent 50%)' },
    rare: { bg: 'color-mix(in oklab, var(--accent-600) 20%, transparent)', text: 'var(--text)', border: 'color-mix(in oklab, var(--accent-600), transparent 60%)' },
    uncommon: { bg: 'color-mix(in oklab, var(--mood-5) 20%, transparent)', text: 'var(--text)', border: 'color-mix(in oklab, var(--mood-5), transparent 60%)' },
    common: { bg: 'color-mix(in oklab, var(--text) 12%, transparent)', text: 'var(--text)', border: 'color-mix(in oklab, var(--text), transparent 60%)' },
  };
  const r = rarityStyles[rarityToken] || rarityStyles.common;

  const rarityBadgeStyle: CSSProperties = {
    background: r.bg,
    color: r.text,
    borderColor: r.border,
  };

  const iconCircleStyle: CSSProperties = {
    background: isUnlocked
      ? 'linear-gradient(135deg, var(--accent-bg), var(--accent-bg-2))'
      : 'linear-gradient(135deg, color-mix(in oklab, var(--text), transparent 40%), color-mix(in oklab, var(--text), transparent 20%))',
  };

  const titleStyle: CSSProperties = isUnlocked
    ? {}
    : { color: 'color-mix(in oklab, var(--text), transparent 40%)' };

  const descriptionStyle: CSSProperties = {
    color: isUnlocked
      ? 'color-mix(in oklab, var(--text), transparent 15%)'
      : 'color-mix(in oklab, var(--text), transparent 45%)',
  };

  return (
    <div
      className={cn(
        'relative box-border p-5 rounded-xl bg-surface border border-border shadow-sm',
        'text-center flex flex-col justify-between min-h-[280px] overflow-hidden w-full',
        'transition-transform duration-200 ease-out will-change-transform',
        isUnlocked ? 'opacity-100' : 'opacity-90'
      )}
    >
      {rarityToken && (
        <div
          className="absolute top-2.5 right-2.5 px-2 py-1 rounded-full text-[11px] font-semibold border tracking-wide"
          style={rarityBadgeStyle}
          aria-label={`rarity: ${rarityToken}`}
        >
          {rarityToken}
        </div>
      )}

      <div className="mb-4 flex justify-center">
        <div
          className="rounded-full p-3.5 flex items-center justify-center shadow-sm"
          style={iconCircleStyle}
        >
          <IconComponent size={26} color="var(--primary-foreground)" />
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-between">
        <div>
          <h3
            className="text-foreground m-0 mb-2 text-[1.05rem] font-bold leading-tight overflow-hidden text-ellipsis whitespace-nowrap break-words hyphens-auto"
            style={titleStyle}
          >
            {achievement.name}
          </h3>

          <p
            className="m-0 mb-4 text-[0.9rem] leading-snug line-clamp-2 break-words hyphens-auto"
            style={descriptionStyle}
          >
            {achievement.description}
          </p>
        </div>

        <div className="h-1" />
      </div>

      <div className="min-h-[40px] flex items-center justify-center">
        {!isUnlocked ? (
          <div className="w-full">
            <ProgressBar value={typeof progressValue === 'number' ? progressValue : 0} max={typeof progressMax === 'number' ? progressMax : 7} label="Progress" />
          </div>
        ) : (
          <div className="bg-gradient-to-br from-accent-bg to-accent-bg-2 text-[color:var(--primary-foreground)] px-4 py-2 rounded-full text-[13px] font-semibold inline-flex items-center justify-center gap-1.5">
            <Zap size={14} />
            Unlocked
          </div>
        )}
      </div>

    </div>
  );
};

export default AchievementNFT;
