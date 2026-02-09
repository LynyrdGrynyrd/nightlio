import { describe, expect, it } from 'vitest';

import {
  DEFAULT_EMOTION_ANCHORS,
  buildInsightPatterns,
  clampMoodPoint,
  deriveQuickScore,
  nearestEmotion,
  quickScoreToCanonicalPoint,
  screenToMoodPoint,
} from './moodPlane';

describe('moodPlane utilities', () => {
  it('clamps mood points to axis bounds', () => {
    expect(clampMoodPoint({ valence: 1.7, arousal: -2.4 })).toEqual({ valence: 1, arousal: -1 });
  });

  it('maps screen coordinates to valence/arousal corners', () => {
    expect(screenToMoodPoint(0, 0, 100, 100)).toEqual({ valence: -1, arousal: 1 });
    expect(screenToMoodPoint(100, 100, 100, 100)).toEqual({ valence: 1, arousal: -1 });
    expect(screenToMoodPoint(50, 50, 100, 100)).toEqual({ valence: 0, arousal: 0 });
  });

  it('derives quick scores from valence-first with arousal tweak', () => {
    expect(deriveQuickScore({ valence: 0.8, arousal: 0.8 })).toBe(5);
    expect(deriveQuickScore({ valence: 0.7, arousal: -0.7 })).toBe(4);
    expect(deriveQuickScore({ valence: -0.7, arousal: 0.7 })).toBe(1);
    expect(deriveQuickScore({ valence: -0.6, arousal: -0.7 })).toBe(2);
  });

  it('returns canonical quick-score points', () => {
    expect(quickScoreToCanonicalPoint(1)).toEqual({ valence: -0.85, arousal: 0.65 });
    expect(quickScoreToCanonicalPoint(5)).toEqual({ valence: 0.8, arousal: 0.7 });
    expect(quickScoreToCanonicalPoint(8)).toBeNull();
  });

  it('selects nearest emotion anchor', () => {
    expect(nearestEmotion({ valence: 0.82, arousal: 0.76 }, DEFAULT_EMOTION_ANCHORS)?.id).toBe('excited');
    expect(nearestEmotion({ valence: -0.73, arousal: 0.69 }, DEFAULT_EMOTION_ANCHORS)?.id).toBe('anxious');
  });

  it('builds exactly three insight patterns with valid ratios', () => {
    const history = [
      { valence: -0.2, arousal: 0.4 },
      { valence: -0.7, arousal: -0.5 },
      { valence: 0.4, arousal: -0.4 },
      { valence: 0.7, arousal: 0.8 },
    ];

    const patterns = buildInsightPatterns(history);

    expect(patterns).toHaveLength(3);
    expect(patterns.map((pattern) => pattern.id)).toEqual([
      'high-energy-negative',
      'low-energy-negative',
      'calm-positive',
    ]);
    patterns.forEach((pattern) => {
      expect(pattern.ratio).toBeGreaterThanOrEqual(0);
      expect(pattern.ratio).toBeLessThanOrEqual(1);
    });
  });
});
