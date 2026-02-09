import { describe, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

const renderApp = (initialEntries: string[] = ['/']) => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });

    return render(
        <QueryClientProvider client={queryClient}>
            <MemoryRouter initialEntries={initialEntries}>
                <App />
            </MemoryRouter>
        </QueryClientProvider>
    );
};

describe('App', () => {
    it('renders without crashing', () => {
        renderApp(['/ui-demo']);
    });

    it('renders the mood model sandbox route', async () => {
        renderApp(['/ui-demo/mood-model']);

        expect(await screen.findByText(/Mood model is too reductive/i, {}, { timeout: 5000 })).toBeInTheDocument();
    });
});
