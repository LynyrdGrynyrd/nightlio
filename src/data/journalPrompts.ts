export interface JournalPrompt {
  id: string;
  text: string;
  moods: number[];
}

interface JournalStarter {
  id: string;
  text: string;
  moods: number[];
}

const PROMPTS: JournalPrompt[] = [
  { id: 'p1', text: 'What is the strongest feeling in your body right now?', moods: [1, 2, 3, 4, 5] },
  { id: 'p2', text: 'What happened today that most influenced this mood?', moods: [1, 2, 3, 4, 5] },
  { id: 'p3', text: 'What felt hardest to carry today, and why?', moods: [1, 2] },
  { id: 'p4', text: 'What helped you feel even 1% safer or steadier?', moods: [1, 2] },
  { id: 'p5', text: 'What felt neutral but necessary today?', moods: [3] },
  { id: 'p6', text: 'What gave you a small signal of progress?', moods: [3, 4] },
  { id: 'p7', text: 'What gave you energy today that you want to repeat?', moods: [4, 5] },
  { id: 'p8', text: 'How can you protect this momentum tomorrow?', moods: [4, 5] },
];

const STARTERS: JournalStarter[] = [
  { id: 's1', text: 'Right now I feel...', moods: [1, 2, 3, 4, 5] },
  { id: 's2', text: 'Today shifted when...', moods: [1, 2, 3, 4, 5] },
  { id: 's3', text: 'One thing I need tonight is...', moods: [1, 2] },
  { id: 's4', text: 'A small win was...', moods: [3, 4, 5] },
  { id: 's5', text: 'Tomorrow I want to...', moods: [3, 4, 5] },
];

const DEFAULT_MOOD = 3;

const normalizeMood = (mood: number): number => {
  if (!Number.isFinite(mood)) return DEFAULT_MOOD;
  if (mood < 1) return 1;
  if (mood > 5) return 5;
  return Math.round(mood);
};

const filterByMood = <T extends { moods: number[] }>(collection: T[], mood: number): T[] => {
  const normalized = normalizeMood(mood);
  const filtered = collection.filter((item) => item.moods.includes(normalized));
  return filtered.length > 0 ? filtered : collection;
};

export const pickPrompt = (mood: number, excludeIds: string[] = []): JournalPrompt | null => {
  const candidates = filterByMood(PROMPTS, mood).filter((prompt) => !excludeIds.includes(prompt.id));
  if (candidates.length === 0) return null;

  const index = Math.floor(Math.random() * candidates.length);
  return candidates[index];
};

export const getStartersForMood = (mood: number): JournalStarter[] => {
  return filterByMood(STARTERS, mood);
};
