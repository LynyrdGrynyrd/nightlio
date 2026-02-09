import { cn } from '@/lib/utils';

export type WellnessIllustrationVariant =
  | 'sparkles'
  | 'journey'
  | 'photos'
  | 'goals'
  | 'calendar'
  | 'insights'
  | 'folder';

interface WellnessIllustrationProps {
  variant: WellnessIllustrationVariant;
  className?: string;
}

const variantLabel: Record<WellnessIllustrationVariant, string> = {
  sparkles: 'Sparkles illustration',
  journey: 'Journey illustration',
  photos: 'Photos illustration',
  goals: 'Goals illustration',
  calendar: 'Calendar illustration',
  insights: 'Insights illustration',
  folder: 'Folder illustration',
};

const WellnessIllustration = ({ variant, className }: WellnessIllustrationProps) => {
  return (
    <div
      className={cn(
        'relative isolate flex h-32 w-32 items-center justify-center rounded-full border border-border/60 bg-[color:var(--accent-bg-softer)] shadow-sm',
        className
      )}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 120 120"
        className="h-24 w-24"
        role="img"
        aria-label={variantLabel[variant]}
      >
        <defs>
          <linearGradient id={`wellness-${variant}-gradient`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--mood-4)" />
            <stop offset="100%" stopColor="var(--mood-5)" />
          </linearGradient>
        </defs>

        <path
          d="M10 66C20 44 44 34 66 42C82 48 96 62 110 60"
          fill="none"
          stroke={`url(#wellness-${variant}-gradient)`}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.55"
        />

        {variant === 'sparkles' && (
          <>
            <circle cx="58" cy="55" r="22" fill="none" stroke="var(--accent-500)" strokeWidth="2.4" />
            <path d="M58 38V72M41 55H75" stroke="var(--accent-600)" strokeWidth="2.4" strokeLinecap="round" />
            <circle cx="36" cy="40" r="3" fill="var(--mood-4)" />
            <circle cx="80" cy="38" r="2.8" fill="var(--mood-5)" />
          </>
        )}

        {variant === 'journey' && (
          <>
            <path
              d="M24 76C34 52 48 45 60 45C71 45 84 52 94 76"
              fill="none"
              stroke="var(--accent-600)"
              strokeWidth="2.8"
              strokeLinecap="round"
            />
            <circle cx="60" cy="44" r="6.5" fill="var(--mood-4)" />
            <circle cx="24" cy="76" r="4.5" fill="var(--mood-2)" />
            <circle cx="94" cy="76" r="4.5" fill="var(--mood-5)" />
          </>
        )}

        {variant === 'photos' && (
          <>
            <rect x="25" y="35" width="70" height="52" rx="12" fill="none" stroke="var(--accent-600)" strokeWidth="2.4" />
            <circle cx="45" cy="52" r="6" fill="var(--mood-5)" />
            <path d="M32 76L48 62L62 71L78 57L88 66" fill="none" stroke="var(--mood-4)" strokeWidth="2.6" strokeLinecap="round" />
          </>
        )}

        {variant === 'goals' && (
          <>
            <circle cx="60" cy="60" r="24" fill="none" stroke="var(--accent-500)" strokeWidth="2.6" />
            <circle cx="60" cy="60" r="15" fill="none" stroke="var(--accent-700)" strokeWidth="2.2" />
            <circle cx="60" cy="60" r="6" fill="var(--mood-4)" />
            <path d="M72 48L90 30" stroke="var(--mood-5)" strokeWidth="2.8" strokeLinecap="round" />
            <circle cx="92" cy="28" r="3.6" fill="var(--mood-5)" />
          </>
        )}

        {variant === 'calendar' && (
          <>
            <rect x="27" y="32" width="66" height="56" rx="10" fill="none" stroke="var(--accent-600)" strokeWidth="2.3" />
            <path d="M27 47H93" stroke="var(--border)" strokeWidth="2.2" />
            <circle cx="44" cy="62" r="4" fill="var(--mood-1)" />
            <circle cx="60" cy="62" r="4" fill="var(--mood-3)" />
            <circle cx="76" cy="62" r="4" fill="var(--mood-5)" />
            <circle cx="44" cy="76" r="4" fill="var(--mood-4)" />
            <circle cx="60" cy="76" r="4" fill="var(--mood-2)" />
          </>
        )}

        {variant === 'insights' && (
          <>
            <path d="M30 82V56M48 82V48M66 82V62M84 82V40" stroke="var(--accent-600)" strokeWidth="4" strokeLinecap="round" />
            <path d="M24 42C34 35 48 36 60 46C72 56 84 56 96 44" fill="none" stroke="var(--mood-5)" strokeWidth="2.3" strokeLinecap="round" />
            <circle cx="96" cy="44" r="4.5" fill="var(--mood-5)" />
          </>
        )}

        {variant === 'folder' && (
          <>
            <path
              d="M26 44C26 39 30 36 35 36H49L56 44H85C90 44 94 48 94 53V78C94 83 90 87 85 87H35C30 87 26 83 26 78V44Z"
              fill="none"
              stroke="var(--accent-600)"
              strokeWidth="2.4"
              strokeLinejoin="round"
            />
            <path d="M34 60H86" stroke="var(--border)" strokeWidth="2.2" />
            <circle cx="46" cy="72" r="4.2" fill="var(--mood-4)" />
            <circle cx="62" cy="72" r="4.2" fill="var(--mood-5)" />
          </>
        )}
      </svg>
    </div>
  );
};

export default WellnessIllustration;
