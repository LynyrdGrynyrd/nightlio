import { useCallback, useMemo, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { MoodPoint } from '@/types/moodPlane';
import {
  DEFAULT_EMOTION_ANCHORS,
  QUICK_SCORE_LABELS,
  buildInsightPatterns,
  deriveQuickScore,
  moodPointToScreenPercent,
  nearestEmotion,
  quickScoreToCanonicalPoint,
  screenToMoodPoint,
} from '@/utils/moodPlane';

const PLANE_BACKGROUND_STYLE = {
  background: `
    linear-gradient(180deg, rgba(198, 97, 79, 0.4) 0%, rgba(118, 159, 178, 0.35) 100%),
    linear-gradient(90deg, rgba(191, 97, 74, 0.4) 0%, rgba(118, 169, 108, 0.42) 100%)
  `,
};

const WEEK_HISTORY_SEED: MoodPoint[] = [
  { valence: -0.62, arousal: 0.54 },
  { valence: -0.28, arousal: -0.45 },
  { valence: 0.32, arousal: -0.22 },
  { valence: -0.7, arousal: 0.72 },
  { valence: 0.5, arousal: -0.6 },
  { valence: -0.4, arousal: -0.7 },
];

const SCENARIO_PRESETS: Array<{ label: string; point: MoodPoint }> = [
  { label: 'Grieving but supported', point: { valence: -0.35, arousal: -0.55 } },
  { label: 'Wired and overwhelmed', point: { valence: -0.7, arousal: 0.7 } },
  { label: 'Peacefully connected', point: { valence: 0.65, arousal: -0.6 } },
  { label: 'Motivated and focused', point: { valence: 0.7, arousal: 0.45 } },
  { label: 'Numb and drained', point: { valence: -0.75, arousal: -0.75 } },
  { label: 'Joyfully energized', point: { valence: 0.85, arousal: 0.8 } },
];

const CORNER_EMOJIS = [
  { key: 'top-left', label: 'Activated + unpleasant', emoji: '😰', className: 'left-2 top-2' },
  { key: 'top-right', label: 'Activated + pleasant', emoji: '🤩', className: 'right-2 top-2' },
  { key: 'bottom-left', label: 'Deactivated + unpleasant', emoji: '😔', className: 'left-2 bottom-2' },
  { key: 'bottom-right', label: 'Deactivated + pleasant', emoji: '😌', className: 'right-2 bottom-2' },
] as const;

const INSIGHT_TONE_STYLES = {
  neutral: 'border-border/70 bg-card/90',
  warning: 'border-[color:var(--mood-2)]/50 bg-[color:var(--mood-2)]/12',
  positive: 'border-[color:var(--mood-4)]/50 bg-[color:var(--mood-4)]/14',
};

const formatAxisValue = (value: number): string => {
  const rounded = Math.round(value * 100) / 100;
  const sign = rounded >= 0 ? '+' : '';
  return `${sign}${rounded.toFixed(2)}`;
};

const getQuadrantLabel = (point: MoodPoint): string => {
  if (point.valence >= 0 && point.arousal >= 0) return 'Pleasant + activated';
  if (point.valence >= 0 && point.arousal < 0) return 'Pleasant + deactivated';
  if (point.valence < 0 && point.arousal >= 0) return 'Unpleasant + activated';
  return 'Unpleasant + deactivated';
};

const MoodModelSandbox = () => {
  const prefersReducedMotion = useReducedMotion();
  const [point, setPoint] = useState<MoodPoint>({ valence: 0.34, arousal: -0.12 });

  const planeRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);

  const updateFromClientCoordinates = useCallback((clientX: number, clientY: number) => {
    const plane = planeRef.current;
    if (!plane) return;

    const bounds = plane.getBoundingClientRect();
    const localX = clientX - bounds.left;
    const localY = clientY - bounds.top;
    const nextPoint = screenToMoodPoint(localX, localY, bounds.width, bounds.height);
    setPoint(nextPoint);
  }, []);

  const handlePlanePointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    draggingRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    updateFromClientCoordinates(event.clientX, event.clientY);
  }, [updateFromClientCoordinates]);

  const handlePlanePointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    updateFromClientCoordinates(event.clientX, event.clientY);
  }, [updateFromClientCoordinates]);

  const handlePlanePointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    draggingRef.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }, []);

  const markerPosition = useMemo(() => moodPointToScreenPercent(point), [point]);

  const quickScore = useMemo(() => deriveQuickScore(point), [point]);
  const closestEmotion = useMemo(() => nearestEmotion(point, DEFAULT_EMOTION_ANCHORS), [point]);
  const quadrantLabel = useMemo(() => getQuadrantLabel(point), [point]);
  const insightHistory = useMemo(() => [...WEEK_HISTORY_SEED, point], [point]);
  const insightPatterns = useMemo(() => buildInsightPatterns(insightHistory), [insightHistory]);

  const applyQuickScore = useCallback((score: number) => {
    const mappedPoint = quickScoreToCanonicalPoint(score);
    if (!mappedPoint) return;
    setPoint(mappedPoint);
  }, []);

  const applyPreset = useCallback((nextPoint: MoodPoint) => {
    setPoint(nextPoint);
  }, []);

  const handleValenceRangeChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseFloat(event.target.value);
    setPoint((current) => ({ ...current, valence: Number.isFinite(value) ? value : current.valence }));
  }, []);

  const handleArousalRangeChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseFloat(event.target.value);
    setPoint((current) => ({ ...current, arousal: Number.isFinite(value) ? value : current.arousal }));
  }, []);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          Sandbox
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Mood model is too reductive</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          A single number hides emotional nuance. This demo tests a valence/arousal plane where calm-positive and
          anxious-negative can be separated, then mapped back to an optional quick 1-5 check-in.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle>2D mood input</CardTitle>
            <CardDescription>Tap or drag anywhere on the plane to position your current emotional state.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="mx-auto max-w-[36rem]">
              <div
                ref={planeRef}
                data-testid="mood-plane"
                role="application"
                aria-label="Valence and arousal mood plane"
                className="relative aspect-square w-full rounded-[calc(var(--radius)+4px)] border border-border/80 shadow-inner select-none touch-none cursor-crosshair overflow-hidden"
                style={PLANE_BACKGROUND_STYLE}
                onPointerDown={handlePlanePointerDown}
                onPointerMove={handlePlanePointerMove}
                onPointerUp={handlePlanePointerUp}
                onPointerCancel={handlePlanePointerUp}
              >
                <div className="pointer-events-none absolute inset-y-0 left-1/2 w-px bg-foreground/20" />
                <div className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-foreground/20" />

                {CORNER_EMOJIS.map((corner) => (
                  <span
                    key={corner.key}
                    className={cn(
                      'pointer-events-none absolute rounded-full border border-border/70 bg-card/90 px-2 py-1 text-sm shadow-sm',
                      corner.className
                    )}
                    aria-label={corner.label}
                  >
                    {corner.emoji}
                  </span>
                ))}

                <div
                  data-testid="mood-marker"
                  className={cn(
                    'pointer-events-none absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card bg-primary shadow-[0_0_0_4px_rgba(255,250,242,0.38)]',
                    !prefersReducedMotion && 'transition-[left,top] duration-150 ease-out'
                  )}
                  style={{ left: `${markerPosition.x}%`, top: `${markerPosition.y}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Unpleasant</span>
              <span>Valence</span>
              <span>Pleasant</span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Activated</span>
              <span>Arousal</span>
              <span>Deactivated</span>
            </div>

            <div className="space-y-4 rounded-[calc(var(--radius)-2px)] border border-border/70 bg-muted/25 p-4">
              <h3 className="text-sm font-semibold">Accessible slider fallback</h3>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="valence-slider" className="text-sm font-medium">Valence</label>
                  <span className="text-xs text-muted-foreground">{formatAxisValue(point.valence)}</span>
                </div>
                <input
                  id="valence-slider"
                  data-testid="valence-slider"
                  type="range"
                  min={-1}
                  max={1}
                  step={0.01}
                  value={point.valence}
                  onChange={handleValenceRangeChange}
                  className="w-full accent-[color:var(--accent-bg)]"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="arousal-slider" className="text-sm font-medium">Arousal</label>
                  <span className="text-xs text-muted-foreground">{formatAxisValue(point.arousal)}</span>
                </div>
                <input
                  id="arousal-slider"
                  data-testid="arousal-slider"
                  type="range"
                  min={-1}
                  max={1}
                  step={0.01}
                  value={point.arousal}
                  onChange={handleArousalRangeChange}
                  className="w-full accent-[color:var(--accent-bg)]"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Live readout</CardTitle>
            <CardDescription>Optional quick score is synchronized to the 2D point.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-[calc(var(--radius)-2px)] border border-border/70 bg-card/70 p-4">
              <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Nearest emotion</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-2xl" aria-hidden="true">{closestEmotion?.emoji ?? '🙂'}</span>
                <p data-testid="nearest-emotion-label" className="text-lg font-semibold">
                  Nearest emotion: {closestEmotion?.label ?? 'Unknown'}
                </p>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{quadrantLabel}</p>
            </div>

            <div className="rounded-[calc(var(--radius)-2px)] border border-border/70 bg-card/70 p-4 space-y-3">
              <h3 className="text-sm font-semibold">Quick check-in fast path</h3>
              <div className="grid grid-cols-5 gap-2" data-testid="quick-score-chips">
                {[1, 2, 3, 4, 5].map((score) => (
                  <Button
                    key={score}
                    type="button"
                    size="sm"
                    variant={quickScore === score ? 'default' : 'outline'}
                    aria-label={`Quick check-in score ${score}`}
                    onClick={() => applyQuickScore(score)}
                  >
                    {score}
                  </Button>
                ))}
              </div>
              <p data-testid="derived-quick-score" className="text-xs text-muted-foreground">
                Derived quick score: <span className="font-semibold text-foreground">{quickScore} / 5</span> ({QUICK_SCORE_LABELS[quickScore]})
              </p>
            </div>

            <div className="rounded-[calc(var(--radius)-2px)] border border-border/70 bg-card/70 p-4 space-y-3">
              <h3 className="text-sm font-semibold">Scenario presets</h3>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {SCENARIO_PRESETS.map((preset) => (
                  <Button
                    key={preset.label}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="justify-start h-auto py-2 px-3 whitespace-normal text-left"
                    onClick={() => applyPreset(preset.point)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Old model</CardTitle>
            <CardDescription>Single-axis interpretation only.</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-2xl font-semibold">{quickScore}/5</p>
            <p className="text-sm text-muted-foreground">
              This reads as <strong>{QUICK_SCORE_LABELS[quickScore]}</strong> without context about energy.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">New model</CardTitle>
            <CardDescription>Valence + arousal interpretation.</CardDescription>
          </CardHeader>
          <CardContent className="pt-0 space-y-2 text-sm">
            <p data-testid="new-model-valence">Valence: <span className="font-semibold">{formatAxisValue(point.valence)}</span></p>
            <p data-testid="new-model-arousal">Arousal: <span className="font-semibold">{formatAxisValue(point.arousal)}</span></p>
            <p data-testid="new-model-nearest-emotion">Nearest emotion: <span className="font-semibold">{closestEmotion?.label ?? 'Unknown'}</span></p>
            <p>Quadrant: <span className="font-semibold">{quadrantLabel}</span></p>
          </CardContent>
        </Card>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight">Pattern preview (simulated week)</h2>
          <Badge variant="outline" className="text-[11px]">UI-only demo data</Badge>
        </div>

        <div className="grid gap-3 lg:grid-cols-3" data-testid="insight-cards">
          {insightPatterns.map((pattern) => (
            <Card key={pattern.id} data-testid={`insight-card-${pattern.id}`} className={INSIGHT_TONE_STYLES[pattern.tone]}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">{pattern.title}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                <p className="text-2xl font-semibold tabular-nums">{Math.round(pattern.ratio * 100)}%</p>
                <p className="text-xs text-muted-foreground">{pattern.blurb}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
};

export default MoodModelSandbox;
