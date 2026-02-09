import type { EmotionAnchor, InsightPattern, MoodPoint } from '@/types/moodPlane';

const MIN_AXIS_VALUE = -1;
const MAX_AXIS_VALUE = 1;

const clampAxisValue = (value: number): number => {
  return Math.max(MIN_AXIS_VALUE, Math.min(MAX_AXIS_VALUE, value));
};

const toSignedPercent = (ratio: number): number => {
  return clampAxisValue((ratio * 2) - 1);
};

const ratioFromSignedPercent = (value: number): number => {
  return (clampAxisValue(value) + 1) / 2;
};

export const QUICK_SCORE_LABELS: Record<number, string> = {
  1: 'Terrible',
  2: 'Bad',
  3: 'Okay',
  4: 'Good',
  5: 'Amazing',
};

export const DEFAULT_EMOTION_ANCHORS: EmotionAnchor[] = [
  { id: 'excited', label: 'Excited', emoji: '🤩', valence: 0.86, arousal: 0.78 },
  { id: 'motivated', label: 'Motivated', emoji: '⚡', valence: 0.62, arousal: 0.45 },
  { id: 'calm', label: 'Calm', emoji: '😌', valence: 0.66, arousal: -0.64 },
  { id: 'content', label: 'Content', emoji: '🙂', valence: 0.34, arousal: -0.12 },
  { id: 'anxious', label: 'Anxious', emoji: '😰', valence: -0.72, arousal: 0.68 },
  { id: 'angry', label: 'Angry', emoji: '😤', valence: -0.88, arousal: 0.34 },
  { id: 'sad', label: 'Sad', emoji: '😔', valence: -0.64, arousal: -0.62 },
  { id: 'drained', label: 'Drained', emoji: '🫥', valence: -0.82, arousal: -0.86 },
];

const QUICK_SCORE_POINTS: Record<1 | 2 | 3 | 4 | 5, MoodPoint> = {
  1: { valence: -0.85, arousal: 0.65 },
  2: { valence: -0.7, arousal: -0.55 },
  3: { valence: 0.0, arousal: -0.05 },
  4: { valence: 0.55, arousal: -0.35 },
  5: { valence: 0.8, arousal: 0.7 },
};

const HIGH_ENERGY_NEGATIVE_ID = 'high-energy-negative';
const LOW_ENERGY_NEGATIVE_ID = 'low-energy-negative';
const CALM_POSITIVE_ID = 'calm-positive';

const buildPatternBlurb = (title: string, ratio: number): string => {
  const percentage = Math.round(ratio * 100);

  if (percentage === 0) {
    return `No ${title.toLowerCase()} pattern is visible in this sample yet.`;
  }
  if (percentage <= 25) {
    return `${percentage}% of sample entries show a light ${title.toLowerCase()} signal.`;
  }
  if (percentage <= 50) {
    return `${percentage}% of sample entries show a moderate ${title.toLowerCase()} pattern.`;
  }
  return `${percentage}% of sample entries show a strong ${title.toLowerCase()} pattern.`;
};

export const clampMoodPoint = (point: MoodPoint): MoodPoint => {
  return {
    valence: clampAxisValue(point.valence),
    arousal: clampAxisValue(point.arousal),
  };
};

export const screenToMoodPoint = (
  xPx: number,
  yPx: number,
  width: number,
  height: number
): MoodPoint => {
  if (width <= 0 || height <= 0) {
    return { valence: 0, arousal: 0 };
  }

  const xRatio = Math.max(0, Math.min(width, xPx)) / width;
  const yRatio = Math.max(0, Math.min(height, yPx)) / height;

  return {
    valence: toSignedPercent(xRatio),
    arousal: toSignedPercent(1 - yRatio),
  };
};

export const moodPointToScreenPercent = (point: MoodPoint): { x: number; y: number } => {
  return {
    x: ratioFromSignedPercent(point.valence) * 100,
    y: (1 - ratioFromSignedPercent(point.arousal)) * 100,
  };
};

export const deriveQuickScore = (point: MoodPoint): number => {
  const normalized = clampMoodPoint(point);
  const base = 3 + (2 * normalized.valence);
  const signedArousal = normalized.arousal * Math.sign(normalized.valence || 0);
  const adjusted = base + (0.35 * signedArousal);

  return Math.max(1, Math.min(5, Math.round(adjusted)));
};

export const nearestEmotion = (point: MoodPoint, anchors: EmotionAnchor[]): EmotionAnchor | null => {
  if (anchors.length === 0) {
    return null;
  }

  const normalizedPoint = clampMoodPoint(point);
  let closest = anchors[0];
  let minDistance = Number.POSITIVE_INFINITY;

  anchors.forEach((anchor) => {
    const dx = normalizedPoint.valence - anchor.valence;
    const dy = normalizedPoint.arousal - anchor.arousal;
    const distance = Math.sqrt((dx * dx) + (dy * dy));
    if (distance < minDistance) {
      minDistance = distance;
      closest = anchor;
    }
  });

  return closest;
};

export const quickScoreToCanonicalPoint = (score: number): MoodPoint | null => {
  if (!Number.isInteger(score) || score < 1 || score > 5) {
    return null;
  }

  const value = QUICK_SCORE_POINTS[score as 1 | 2 | 3 | 4 | 5];
  return { ...value };
};

export const buildInsightPatterns = (history: MoodPoint[]): InsightPattern[] => {
  const normalized = history.map(clampMoodPoint);
  const total = normalized.length;

  const highEnergyNegativeCount = normalized.filter((point) => point.valence < 0 && point.arousal >= 0).length;
  const lowEnergyNegativeCount = normalized.filter((point) => point.valence < 0 && point.arousal < 0).length;
  const calmPositiveCount = normalized.filter((point) => point.valence >= 0 && point.arousal < 0).length;

  const toRatio = (count: number): number => {
    return total === 0 ? 0 : count / total;
  };

  const highEnergyNegativeRatio = toRatio(highEnergyNegativeCount);
  const lowEnergyNegativeRatio = toRatio(lowEnergyNegativeCount);
  const calmPositiveRatio = toRatio(calmPositiveCount);

  return [
    {
      id: HIGH_ENERGY_NEGATIVE_ID,
      title: 'High-energy negative',
      ratio: highEnergyNegativeRatio,
      tone: 'warning',
      blurb: buildPatternBlurb('high-energy negative', highEnergyNegativeRatio),
    },
    {
      id: LOW_ENERGY_NEGATIVE_ID,
      title: 'Low-energy negative',
      ratio: lowEnergyNegativeRatio,
      tone: 'neutral',
      blurb: buildPatternBlurb('low-energy negative', lowEnergyNegativeRatio),
    },
    {
      id: CALM_POSITIVE_ID,
      title: 'Calm-positive',
      ratio: calmPositiveRatio,
      tone: 'positive',
      blurb: buildPatternBlurb('calm-positive', calmPositiveRatio),
    },
  ];
};
