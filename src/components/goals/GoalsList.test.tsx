import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import GoalsList from './GoalsList';

// Mock child components
vi.mock('./GoalCard', () => ({
    default: ({ goal }: { goal: { title: string } }) => <div data-testid="goal-card">{goal.title}</div>,
}));

vi.mock('./AddGoalCard', () => ({
    default: () => <div data-testid="add-goal-card">Add Goal</div>,
}));

vi.mock('../ui/EmptyState', () => ({
    default: () => <div data-testid="empty-state">No Goals</div>,
}));

describe('GoalsList', () => {
    const mockGoals = [
        { id: 1, title: 'Drink Water' },
        { id: 2, title: 'Read Book' },
    ];

    it('renders list of goals', () => {
        render(<GoalsList goals={mockGoals} />);
        expect(screen.getAllByTestId('goal-card')).toHaveLength(2);
        expect(screen.getByText('Drink Water')).toBeInTheDocument();
        expect(screen.getByText('Read Book')).toBeInTheDocument();
    });

    it('renders add card when onAdd provided', () => {
        render(<GoalsList goals={mockGoals} onAdd={vi.fn()} />);
        expect(screen.getByTestId('add-goal-card')).toBeInTheDocument();
    });

    it('renders empty state when no goals', () => {
        render(<GoalsList goals={[]} />);
        expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });
});
