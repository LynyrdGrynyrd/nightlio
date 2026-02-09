import { memo } from 'react';
import { getMoodColor } from '../statisticsConstants';

interface DotProps {
  cx?: number;
  cy?: number;
  payload?: { mood?: number | null };
}

export const MoodDot = memo(function MoodDot(props: DotProps) {
  const { cx, cy, payload } = props;
  if (!payload || payload.mood === null || payload.mood === undefined) return null;
  if (cx === undefined || cy === undefined) return null;
  const color = getMoodColor(payload.mood);
  return (
    <circle
      cx={cx}
      cy={cy}
      r={5}
      fill={color}
      stroke="var(--card)"
      strokeWidth={2}
    />
  );
});

export const MoodActiveDot = memo(function MoodActiveDot(props: DotProps) {
  const { cx, cy, payload } = props;
  if (!payload || payload.mood === null || payload.mood === undefined) return null;
  if (cx === undefined || cy === undefined) return null;
  const color = getMoodColor(payload.mood);
  return (
    <circle
      cx={cx}
      cy={cy}
      r={8}
      fill={color}
      stroke="var(--card)"
      strokeWidth={2}
    />
  );
});
