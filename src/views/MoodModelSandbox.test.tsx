import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';

import MoodModelSandbox from './MoodModelSandbox';

describe('MoodModelSandbox', () => {
  it('renders the plane, sliders, quick chips, presets, and comparison cards', () => {
    render(<MoodModelSandbox />);

    expect(screen.getByTestId('mood-plane')).toBeInTheDocument();
    expect(screen.getByLabelText('Valence')).toBeInTheDocument();
    expect(screen.getByLabelText('Arousal')).toBeInTheDocument();
    expect(screen.getByTestId('quick-score-chips')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Grieving but supported/i })).toBeInTheDocument();
    expect(screen.getByText('Old model')).toBeInTheDocument();
    expect(screen.getByText('New model')).toBeInTheDocument();
  });

  it('syncs coordinates and derived score when clicking a quick-score chip', () => {
    render(<MoodModelSandbox />);

    fireEvent.click(screen.getByRole('button', { name: /Quick check-in score 5/i }));

    expect(screen.getByTestId('derived-quick-score')).toHaveTextContent('5 / 5');
    expect(screen.getByTestId('new-model-valence')).toHaveTextContent('+0.80');
    expect(screen.getByTestId('new-model-arousal')).toHaveTextContent('+0.70');
  });

  it('updates nearest emotion label when selecting a preset', () => {
    render(<MoodModelSandbox />);

    fireEvent.click(screen.getByRole('button', { name: /Wired and overwhelmed/i }));

    expect(screen.getByTestId('nearest-emotion-label')).toHaveTextContent('Anxious');
  });

  it('updates insight card percentages when sliders change the point', () => {
    render(<MoodModelSandbox />);

    const highEnergyCard = screen.getByTestId('insight-card-high-energy-negative');
    expect(within(highEnergyCard).getByText('29%')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Valence'), { target: { value: '-0.9' } });
    fireEvent.change(screen.getByLabelText('Arousal'), { target: { value: '0.9' } });

    expect(within(highEnergyCard).getByText('43%')).toBeInTheDocument();
  });

  it('always shows old and new model comparison labels', () => {
    render(<MoodModelSandbox />);

    expect(screen.getByText(/Single-axis interpretation only/i)).toBeInTheDocument();
    expect(screen.getByText(/Valence \+ arousal interpretation/i)).toBeInTheDocument();
  });
});
