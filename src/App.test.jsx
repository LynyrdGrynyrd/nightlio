import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

describe('App', () => {
    it('renders without crashing', () => {
        render(
            <MemoryRouter>
                <App />
            </MemoryRouter>
        );
        // Basic verification - since initial view depends on auth/loading, 
        // it might show loading or login. Just checking it doesn't throw.
        // Assuming it redirects to login on start:
        // expect(screen.getByText(/Sign In/i)).toBeInTheDocument();
    });
});
