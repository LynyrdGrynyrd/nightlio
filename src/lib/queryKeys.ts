export const queryKeys = {
  moods: {
    all: ['moods'] as const,
    list: (include?: string[]) => ['moods', 'list', { include }] as const,
  },
  statistics: {
    all: ['statistics'] as const,
    summary: () => ['statistics', 'summary'] as const,
  },
  streak: {
    all: ['streak'] as const,
    current: () => ['streak', 'current'] as const,
    details: () => ['streak', 'details'] as const,
  },
  groups: {
    all: ['groups'] as const,
    list: () => ['groups', 'list'] as const,
  },
  goals: {
    all: ['goals'] as const,
    list: () => ['goals', 'list'] as const,
  },
  scales: {
    all: ['scales'] as const,
    list: () => ['scales', 'list'] as const,
  },
  achievements: {
    all: ['achievements'] as const,
    progress: () => ['achievements', 'progress'] as const,
  },
  journal: {
    stats: () => ['journal', 'stats'] as const,
  },
  analytics: {
    all: ['analytics'] as const,
    batch: () => ['analytics', 'batch'] as const,
  },
  moodDefinitions: {
    all: ['moodDefinitions'] as const,
  },
} as const;
