import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from './LoginPage';
import { AuthProvider } from '../../contexts/AuthContext';
import { ConfigProvider } from '../../contexts/ConfigContext';

// Mock contexts if needed, but integration with logic-less providers is better if possible.
// Basic smoke test.
describe('LoginPage', () => {
    it('renders login form', () => {
        render(
            <MemoryRouter>
                <ConfigProvider>
                    <AuthProvider>
                        <LoginPage />
                    </AuthProvider>
                </ConfigProvider>
            </MemoryRouter>
        );
        expect(screen.getByRole('button', { name: /Continue/i })).toBeInTheDocument();
    });
});
