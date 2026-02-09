import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EntryView from './EntryView';

const mockUseReducedMotion = vi.fn(() => false);
const mockLaunchMoodCelebration = vi.fn(() => Promise.resolve());
const mockUseEntrySubmit = vi.fn();

vi.mock('framer-motion', () => ({
  useReducedMotion: () => mockUseReducedMotion(),
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: {
    div: ({ children, ...props }: Record<string, unknown>) => <div {...props}>{children as React.ReactNode}</div>,
  },
}));

vi.mock('@/utils/celebration', () => ({
  isPositiveMood: (mood: number | null | undefined) => typeof mood === 'number' && mood >= 4,
  launchMoodCelebration: (args: { mood: number; reducedMotion: boolean }) => mockLaunchMoodCelebration(args),
}));

vi.mock('../hooks/useEntrySubmit', () => ({
  default: (params: unknown) => mockUseEntrySubmit(params),
}));

vi.mock('../services/api', () => ({
  default: {
    deleteMedia: vi.fn(),
    getScales: vi.fn(() => new Promise(() => {})),
    getEntryScales: vi.fn(() => new Promise(() => {})),
    getJournalStats: vi.fn(() => new Promise(() => {})),
  },
}));

vi.mock('../components/ui/ToastProvider', () => ({
  useToast: () => ({
    show: vi.fn(),
  }),
}));

vi.mock('../components/mood/MoodPicker', () => ({
  default: ({ onMoodSelect }: { onMoodSelect: (mood: number) => void }) => (
    <div data-testid="mood-picker">
      <button type="button" onClick={() => onMoodSelect(5)}>Select Mood 5</button>
    </div>
  ),
}));

vi.mock('../components/mood/MoodDisplay', () => ({
  default: ({ moodValue }: { moodValue: number }) => <div data-testid="mood-display">Mood: {moodValue}</div>,
}));

vi.mock('../components/groups/GroupSelector', () => ({
  default: () => <div data-testid="group-selector">GroupSelector</div>,
}));

vi.mock('../components/groups/GroupManager', () => ({
  default: () => <div data-testid="group-manager">GroupManager</div>,
}));

vi.mock('../components/MarkdownAreaLazy', () => ({
  default: () => <div data-testid="markdown-area">MarkdownArea</div>,
}));

vi.mock('../components/scales/ScaleSection', () => ({
  default: () => <div data-testid="scale-section">ScaleSection</div>,
}));

vi.mock('../components/media/PhotoPicker', () => ({
  default: () => <div data-testid="photo-picker">PhotoPicker</div>,
}));

vi.mock('../components/entry/TemplateSelector', () => ({
  default: () => <div data-testid="template-selector">TemplateSelector</div>,
}));

vi.mock('../components/entry/EntryVoiceNotes', () => ({
  default: () => <div data-testid="entry-voice-notes">EntryVoiceNotes</div>,
}));

vi.mock('../components/entry/JournalPromptBar', () => ({
  default: () => <div data-testid="journal-prompt-bar">JournalPromptBar</div>,
}));

vi.mock('../components/entry/WordCountIndicator', () => ({
  default: () => <div data-testid="word-count-indicator">WordCount</div>,
}));

describe('EntryView', () => {
  const defaultProps = {
    selectedMood: undefined as number | undefined,
    groups: [] as Array<{ id: number; name: string }>,
    onBack: vi.fn(),
    onCreateGroup: vi.fn().mockResolvedValue(true),
    onCreateOption: vi.fn().mockResolvedValue(true),
    onMoveOption: vi.fn().mockResolvedValue(undefined),
    onEntrySubmitted: vi.fn(),
    onSelectMood: vi.fn(),
    onEditMoodSelect: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseReducedMotion.mockReturnValue(false);
    mockUseEntrySubmit.mockReturnValue({
      isSubmitting: false,
      submitMessage: '',
      handleSubmit: vi.fn(),
    });
  });

  it('renders breathing prompt with mood picker when no mood is selected', () => {
    render(<EntryView {...defaultProps} />);
    expect(screen.getByText('Take one breath')).toBeInTheDocument();
    expect(screen.getByTestId('mood-picker')).toBeInTheDocument();
  });

  it('calls onSelectMood when mood is selected', () => {
    render(<EntryView {...defaultProps} />);
    fireEvent.click(screen.getByText('Select Mood 5'));
    expect(defaultProps.onSelectMood).toHaveBeenCalledWith(5);
  });

  it('triggers celebration for successful positive mood save', async () => {
    mockUseEntrySubmit.mockReturnValue({
      isSubmitting: false,
      submitMessage: 'Entry saved successfully! 🎉',
      handleSubmit: vi.fn(),
    });

    render(<EntryView {...defaultProps} selectedMood={4} />);

    await waitFor(() => {
      expect(mockLaunchMoodCelebration).toHaveBeenCalledWith({ mood: 4, reducedMotion: false });
    });
  });

  it('does not trigger celebration for neutral mood save', async () => {
    mockUseEntrySubmit.mockReturnValue({
      isSubmitting: false,
      submitMessage: 'Entry saved successfully! 🎉',
      handleSubmit: vi.fn(),
    });

    render(<EntryView {...defaultProps} selectedMood={3} />);

    await waitFor(() => {
      expect(mockLaunchMoodCelebration).not.toHaveBeenCalled();
    });
  });

  it('suppresses celebration when reduced motion is enabled', async () => {
    mockUseReducedMotion.mockReturnValue(true);
    mockUseEntrySubmit.mockReturnValue({
      isSubmitting: false,
      submitMessage: 'Entry saved successfully! 🎉',
      handleSubmit: vi.fn(),
    });

    render(<EntryView {...defaultProps} selectedMood={5} />);

    await waitFor(() => {
      expect(mockLaunchMoodCelebration).not.toHaveBeenCalled();
    });
  });
});
