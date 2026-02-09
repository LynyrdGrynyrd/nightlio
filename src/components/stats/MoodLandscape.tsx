import { memo, useMemo } from 'react';
import { cn } from '@/lib/utils';

interface MoodLandscapePoint {
  iso: string;
  monthIndex: number;
  day: number;
  mood: number | null;
  shouldDim: boolean;
}

interface MoodLandscapeProps {
  points: MoodLandscapePoint[];
  selectedYear: number;
  moodFilter: string;
  getMoodColor: (mood: number) => string;
  onDayClick?: (date: string) => void;
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const SVG_WIDTH = 1280;
const SVG_HEIGHT = 330;
const BASELINE_Y = 264;
const GRAPH_TOP = 52;
const GRAPH_BOTTOM = 232;

const smoothPath = (coords: Array<{ x: number; y: number }>): string => {
  if (coords.length === 0) return '';
  if (coords.length === 1) {
    const point = coords[0];
    return `M ${point.x} ${point.y}`;
  }

  const path: string[] = [`M ${coords[0].x} ${coords[0].y}`];
  for (let index = 0; index < coords.length - 1; index += 1) {
    const point = coords[index];
    const next = coords[index + 1];
    const midpointX = (point.x + next.x) / 2;
    path.push(`Q ${point.x} ${point.y} ${midpointX} ${(point.y + next.y) / 2}`);
  }

  const last = coords[coords.length - 1];
  path.push(`T ${last.x} ${last.y}`);
  return path.join(' ');
};

const MoodLandscape = ({ points, selectedYear, moodFilter, getMoodColor, onDayClick }: MoodLandscapeProps) => {
  const currentFilter = moodFilter === 'all' ? null : Number(moodFilter);
  const drawablePoints = useMemo(() => {
    const length = Math.max(points.length - 1, 1);

    return points.map((point, index) => {
      const x = 24 + (index / length) * (SVG_WIDTH - 48);
      const normalizedMood = point.mood ?? 3;
      const y = GRAPH_BOTTOM - ((normalizedMood - 1) / 4) * (GRAPH_BOTTOM - GRAPH_TOP);
      return { ...point, x, y };
    });
  }, [points]);

  const landlineCoords = useMemo(
    () => drawablePoints.map((point) => ({ x: point.x, y: point.y })),
    [drawablePoints]
  );
  const landscapePath = useMemo(() => smoothPath(landlineCoords), [landlineCoords]);
  const fillPath = useMemo(() => {
    if (!landlineCoords.length) return '';
    const first = landlineCoords[0];
    const last = landlineCoords[landlineCoords.length - 1];
    return `${landscapePath} L ${last.x} ${BASELINE_Y} L ${first.x} ${BASELINE_Y} Z`;
  }, [landlineCoords, landscapePath]);

  const monthBreaks = useMemo(() => {
    const markers: Array<{ x: number; label: string }> = [];
    drawablePoints.forEach((point, index) => {
      if (point.day !== 1) return;
      const label = MONTH_LABELS[point.monthIndex];
      if (index === 0 || label !== markers[markers.length - 1]?.label) {
        markers.push({ x: point.x, label });
      }
    });
    return markers;
  }, [drawablePoints]);

  return (
    <div className="space-y-4">
      <div className="relative rounded-[calc(var(--radius)+2px)] border border-border/70 bg-background/75 p-3 md:p-4 shadow-sm overflow-hidden">
        <svg viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} className="w-full h-[260px]" role="img" aria-label={`Mood landscape for ${selectedYear}`}>
          <defs>
            <linearGradient id="mood-landscape-fill" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="var(--accent-400)" stopOpacity="0.28" />
              <stop offset="100%" stopColor="var(--accent-100)" stopOpacity="0.04" />
            </linearGradient>
          </defs>

          <path d={fillPath} fill="url(#mood-landscape-fill)" />
          <path d={landscapePath} fill="none" stroke="var(--accent-600)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="24" y1={BASELINE_Y} x2={SVG_WIDTH - 24} y2={BASELINE_Y} stroke="var(--border)" strokeWidth="2" />

          {monthBreaks.map((marker) => (
            <g key={`month-${marker.label}-${marker.x}`}>
              <line x1={marker.x} y1={40} x2={marker.x} y2={BASELINE_Y} stroke="var(--border-soft)" strokeWidth="1.5" />
              <text x={marker.x + 4} y={30} fill="var(--muted-foreground)" fontSize="18" fontFamily="var(--font-family-ui)">
                {marker.label}
              </text>
            </g>
          ))}

          {drawablePoints.map((point) => {
            const roundedMood = point.mood === null ? null : Math.round(point.mood);
            const isFilteredOut = currentFilter !== null && roundedMood !== null && roundedMood !== currentFilter;
            const color = roundedMood ? getMoodColor(roundedMood) : 'var(--border)';

            return (
              <circle
                key={point.iso}
                cx={point.x}
                cy={point.y}
                r={point.mood === null ? 2.2 : 3.8}
                fill={point.mood === null ? 'var(--border)' : color}
                opacity={isFilteredOut || point.shouldDim ? 0.25 : 0.95}
              />
            );
          })}

          {onDayClick && drawablePoints.map((point) => (
            <rect
              key={`hit-${point.iso}`}
              x={point.x - 3}
              y={GRAPH_TOP - 12}
              width={6}
              height={BASELINE_Y - GRAPH_TOP + 16}
              fill="transparent"
              className="cursor-pointer"
              onClick={() => onDayClick(point.iso)}
            />
          ))}
        </svg>
      </div>

      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-2 rounded-full border border-border/70 px-3 py-1 bg-background/70">
          <span className="h-2.5 w-2.5 rounded-full bg-[color:var(--mood-1)]" />
          Lower moods
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border border-border/70 px-3 py-1 bg-background/70">
          <span className="h-2.5 w-2.5 rounded-full bg-[color:var(--mood-5)]" />
          Higher moods
        </span>
        {moodFilter !== 'all' ? (
          <span className={cn("inline-flex items-center gap-2 rounded-full border border-border/70 px-3 py-1 bg-background/70")}>
            Filter active: mood {moodFilter}
          </span>
        ) : null}
      </div>
    </div>
  );
};

export default memo(MoodLandscape);
