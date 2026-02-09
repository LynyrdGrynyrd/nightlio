export interface MoodPoint {
  valence: number;
  arousal: number;
}

export interface EmotionAnchor {
  id: string;
  label: string;
  emoji: string;
  valence: number;
  arousal: number;
}

export interface InsightPattern {
  id: string;
  title: string;
  ratio: number;
  tone: 'neutral' | 'warning' | 'positive';
  blurb: string;
}
