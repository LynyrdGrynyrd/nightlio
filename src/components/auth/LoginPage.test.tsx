import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from './LoginPage';
import { AuthProvider } from '../../contexts/AuthContext';
import { ConfigProvider } from '../../contexts/ConfigContext';

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
        expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
    });
});
