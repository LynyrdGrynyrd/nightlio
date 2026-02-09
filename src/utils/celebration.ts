interface CelebrationOptions {
  mood: number | null | undefined;
  reducedMotion: boolean;
}

const POSITIVE_MOOD_MIN = 4;

const resolveColorToken = (token: string, fallback: string): string => {
  if (typeof window === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
  return value || fallback;
};

export const isPositiveMood = (mood: number | null | undefined): mood is number => {
  return typeof mood === 'number' && mood >= POSITIVE_MOOD_MIN;
};

export const launchMoodCelebration = async ({ mood, reducedMotion }: CelebrationOptions): Promise<void> => {
  if (reducedMotion || !isPositiveMood(mood)) return;

  const [{ default: confetti }] = await Promise.all([
    import('canvas-confetti'),
  ]);

  const moodFour = resolveColorToken('--mood-4', 'rgb(138, 166, 124)');
  const moodFive = resolveColorToken('--mood-5', 'rgb(111, 147, 168)');
  const accent = resolveColorToken('--accent-400', 'rgb(201, 152, 114)');
  const surface = resolveColorToken('--surface', 'rgb(255, 250, 242)');

  confetti({
    particleCount: 72,
    spread: 58,
    startVelocity: 25,
    decay: 0.91,
    scalar: 0.9,
    gravity: 0.88,
    colors: [moodFour, moodFive, accent, surface],
    origin: { x: 0.5, y: 0.62 },
    shapes: ['circle'],
  });

  confetti({
    particleCount: 42,
    spread: 74,
    startVelocity: 19,
    decay: 0.9,
    scalar: 0.72,
    gravity: 0.95,
    colors: [moodFour, moodFive, accent],
    origin: { x: 0.5, y: 0.52 },
    shapes: ['circle'],
  });
};
