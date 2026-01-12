import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import EntryView from './EntryView';

// Mocks
vi.mock('../services/api', () => ({
    default: {
        createMoodEntry: vi.fn(),
        updateMoodEntry: vi.fn(),
        getEntryMedia: vi.fn().mockResolvedValue([]),
        uploadMedia: vi.fn(),
        deleteMedia: vi.fn(),
    },
}));

vi.mock('../services/offlineStorage', () => ({
    offlineStorage: {
        addToQueue: vi.fn(),
    },
}));

vi.mock('../components/ui/ToastProvider', () => ({
    useToast: () => ({
        show: vi.fn(),
    }),
}));

vi.mock('../contexts/ConfigContext', () => ({
    useConfig: () => ({
        API_BASE_URL: 'http://localhost:5000',
    }),
}));

// Mock child components to simplify testing EntryView specifically
vi.mock('../components/mood/MoodPicker', () => ({
    default: ({ onMoodSelect }) => (
        <div data-testid="mood-picker">
            <button onClick={() => onMoodSelect(5)}>Select Mood 5</button>
        </div>
    ),
}));

vi.mock('../components/mood/MoodDisplay', () => ({
    default: ({ moodValue }) => <div data-testid="mood-display">Mood: {moodValue}</div>,
}));

vi.mock('../components/groups/GroupSelector', () => ({
    default: () => <div data-testid="group-selector">GroupSelector</div>,
}));

vi.mock('../components/groups/GroupManager', () => ({
    default: () => <div data-testid="group-manager">GroupManager</div>,
}));

vi.mock('../components/MarkdownArea.jsx', () => ({
    default: () => <div data-testid="markdown-area">MarkdownArea</div>, // Simplified
}));

// We need to mock the ref implementation for MarkdownArea since EntryView uses it
// But since we mocked the component, the ref won't attach naturally to a real instance with methods.
// We'll need to mock useRef behavior or just test what we can. 
// Actually, let's mock React.useRef if possible or skip checking the ref instance calls for now
// and focus on rendering. Or better, use a smarter mock for MarkdownArea if we need to simulate getMarkdown().

describe('EntryView', () => {
    const defaultProps = {
        selectedMood: null,
        groups: [],
        onBack: vi.fn(),
        onEntrySubmitted: vi.fn(),
        onSelectMood: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders mood picker when no mood selected', () => {
        render(<EntryView {...defaultProps} />);
        expect(screen.getByTestId('mood-picker')).toBeInTheDocument();
        expect(screen.getByText('Pick your mood to start an entry')).toBeInTheDocument();
    });

    it('calls onSelectMood when mood is selected', () => {
        render(<EntryView {...defaultProps} />);
        fireEvent.click(screen.getByText('Select Mood 5'));
        expect(defaultProps.onSelectMood).toHaveBeenCalledWith(5);
    });

    it('renders entry form when mood is selected', () => {
        render(<EntryView {...defaultProps} selectedMood={4} />);
        expect(screen.getByTestId('mood-display')).toHaveTextContent('Mood: 4');
        expect(screen.getByText('← Back to History')).toBeInTheDocument();
        expect(screen.getByText('Save Entry')).toBeInTheDocument();
    });
});
